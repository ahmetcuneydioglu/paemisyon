import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

/**
 * Quiz motoru (Doc 10 §2.5). Çekirdek ilke: değerlendirme ve skorlama SUNUCUDA;
 * exam modunda doğru cevap istemciye hiç gönderilmez (Doc 7 §3).
 */
@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  /** Oturum başlat: konudan rastgele yayında sorular → exam-güvenli (cevapsız) döner. */
  /** Sınav süresi: soru başına 75 sn (polis sınavı temposu). */
  private static readonly EXAM_SECONDS_PER_QUESTION = 75;
  /** Süre aşımı toleransı (ağ gecikmesi için). */
  private static readonly EXAM_GRACE_SECONDS = 30;

  async startSession(user: AuthenticatedUser, dto: StartSessionDto) {
    const userId = user.id;
    const count = dto.questionCount ?? 10;

    // Kapsam: tam olarak biri — konu VEYA ders (ders = deneme sınavı).
    if ((dto.topicId == null) === (dto.courseId == null)) {
      throw new BadRequestException('topicId veya courseId alanlarından tam olarak biri verilmeli.');
    }
    if (dto.courseId != null && dto.mode !== 'exam') {
      throw new BadRequestException('Ders geneli oturum yalnızca deneme (exam) modunda başlatılabilir.');
    }

    // Premium kapısı SUNUCUDA (Doc 8). Guard isPremium'u zaten hesapladı — ekstra sorgu yok.
    const isPremiumUser = user.isPremium;

    let poolWhere;
    if (dto.topicId != null) {
      const topic = await this.prisma.topic.findFirst({
        where: { id: dto.topicId, deletedAt: null },
        select: { isPremium: true },
      });
      if (!topic) throw new NotFoundException('Konu bulunamadı.');
      if (topic.isPremium && !isPremiumUser) {
        throw new ForbiddenException({
          code: 'PREMIUM_REQUIRED',
          message: 'Bu konu premium içeriktir.',
        });
      }
      poolWhere = { topicId: dto.topicId, deletedAt: null, currentVersionId: { not: null } };
    } else {
      // Ders denemesi: dersin konularından karışık havuz; free kullanıcıya
      // premium konuların soruları dahil edilmez (sızdırma yok).
      poolWhere = {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          courseId: dto.courseId!,
          deletedAt: null,
          ...(isPremiumUser ? {} : { isPremium: false }),
        },
      };
    }

    const pool = await this.prisma.question.findMany({
      where: poolWhere,
      select: { id: true, currentVersionId: true },
    });
    if (pool.length === 0) {
      throw new NotFoundException(
        dto.topicId != null ? 'Bu konuda yayında soru yok.' : 'Bu derste yayında soru yok.',
      );
    }

    const chosen = this.shuffle(pool).slice(0, count);
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: chosen.map((q) => q.currentVersionId!) } },
      select: {
        id: true,
        questionId: true,
        stem: true,
        mediaUrl: true,
        options: {
          select: { id: true, label: true, text: true }, // is_correct/explanation YOK
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));

    // Deneme sınavında planlı süre — sunucu aşımı reddeder (submitAnswer).
    const plannedDurationSeconds =
      dto.mode === 'exam' ? chosen.length * QuizService.EXAM_SECONDS_PER_QUESTION : null;

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        mode: dto.mode,
        topicId: dto.topicId ?? null,
        courseId: dto.courseId ?? null,
        totalQuestions: chosen.length,
        plannedDurationSeconds,
      },
    });

    const questions = chosen.map((q) => {
      const v = byId.get(q.currentVersionId!)!;
      return {
        questionId: v.questionId,
        versionId: v.id,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        options: v.options,
      };
    });

    return {
      sessionId: session.id,
      mode: session.mode,
      plannedDurationSeconds,
      questions,
    };
  }

  /** Tek cevap gönder (idempotent). Sunucu değerlendirir; freemium limiti sunucuda. */
  async submitAnswer(user: AuthenticatedUser, sessionId: string, dto: SubmitAnswerDto) {
    const userId = user.id;
    // Bağımsız üç okuma tek gidiş-dönüşte (Frankfurt RTT ~50ms — sayı önemli).
    const [session, existing, correct] = await Promise.all([
      this.prisma.quizSession.findFirst({ where: { id: sessionId, userId } }),
      this.prisma.quizAnswer.findUnique({
        where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      }),
      this.prisma.questionOption.findFirst({
        where: { questionVersionId: dto.questionVersionId, isCorrect: true },
        select: { id: true },
      }),
    ]);
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Oturum tamamlanmış.');
    }
    // Deneme sınavında süre SUNUCUDA denetlenir — istemci saati manipüle edilemez.
    if (session.plannedDurationSeconds != null) {
      const deadline =
        session.startedAt.getTime() +
        (session.plannedDurationSeconds + QuizService.EXAM_GRACE_SECONDS) * 1000;
      if (Date.now() > deadline) {
        throw new ForbiddenException({
          code: 'EXAM_TIME_OVER',
          message: 'Sınav süresi doldu. Kalan sorular boş sayılır.',
        });
      }
    }

    // Yeni soru → freemium günlük limit (re-answer sayılmaz).
    if (!existing) {
      await this.enforceDailyLimit(user);
    }
    const isCorrect = dto.selectedOptionId != null && dto.selectedOptionId === correct?.id;

    await this.prisma.quizAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      update: {
        questionVersionId: dto.questionVersionId,
        selectedOptionId: dto.selectedOptionId ?? null,
        isCorrect,
        timeSpentMs: dto.timeSpentMs ?? null,
      },
      create: {
        sessionId,
        questionId: dto.questionId,
        questionVersionId: dto.questionVersionId,
        selectedOptionId: dto.selectedOptionId ?? null,
        isCorrect,
        timeSpentMs: dto.timeSpentMs ?? null,
      },
    });

    // exam modunda doğru cevap SIZDIRILMAZ.
    if (session.mode === 'exam') {
      return { recorded: true };
    }

    // practice: anlık geri bildirim + açıklama.
    const version = await this.prisma.questionVersion.findUnique({
      where: { id: dto.questionVersionId },
      select: { explanation: true, legalReferences: { select: { citation: true }, take: 1 } },
    });
    return {
      isCorrect,
      correctOptionId: correct?.id ?? null,
      explanation: version?.explanation ?? null,
      legalReference: version?.legalReferences[0]?.citation ?? null,
    };
  }

  /** Oturumu bitir: skor + doğru/yanlış/boş (sunucuda hesaplanır). */
  async completeSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      include: { answers: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    const correctCount = session.answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = session.answers.filter(
      (a) => a.isCorrect === false && a.selectedOptionId != null,
    ).length;
    const blankCount = session.totalQuestions - correctCount - wrongCount;
    const score =
      session.totalQuestions > 0 ? (correctCount / session.totalQuestions) * 100 : 0;
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - session.startedAt.getTime()) / 1000),
    );

    await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        correctCount,
        wrongCount,
        blankCount,
        score,
        durationSeconds,
      },
    });

    // İlerleme/istatistik/streak/yanlışlar güncelle (Doc 6/7).
    await this.progress.recordSessionCompletion(userId, {
      topicId: session.topicId,
      correctCount,
      wrongCount,
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        selectedOptionId: a.selectedOptionId,
      })),
    });

    // Ders denemesi karnesi: konu bazında doğru/toplam kırılımı (Doc 12 §7).
    let topicBreakdown: { topicId: string; topicName: string; correct: number; total: number }[] | null =
      null;
    if (session.courseId != null && session.answers.length > 0) {
      const qids = session.answers.map((a) => a.questionId);
      const qTopics = await this.prisma.question.findMany({
        where: { id: { in: qids } },
        select: { id: true, topic: { select: { id: true, name: true } } },
      });
      const topicOf = new Map(qTopics.map((q) => [q.id, q.topic]));
      const acc = new Map<string, { topicId: string; topicName: string; correct: number; total: number }>();
      for (const a of session.answers) {
        const t = topicOf.get(a.questionId);
        if (!t) continue;
        const cur = acc.get(t.id) ?? { topicId: t.id, topicName: t.name, correct: 0, total: 0 };
        cur.total++;
        if (a.isCorrect === true) cur.correct++;
        acc.set(t.id, cur);
      }
      topicBreakdown = [...acc.values()].sort((a, b) => b.total - a.total);
    }

    return {
      sessionId,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      correctCount,
      wrongCount,
      blankCount,
      score: Math.round(score * 100) / 100,
      durationSeconds,
      plannedDurationSeconds: session.plannedDurationSeconds,
      topicBreakdown,
    };
  }

  /** Oturum durumu (kaldığı yerden devam için). */
  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        status: true,
        totalQuestions: true,
        answers: { select: { questionId: true, selectedOptionId: true } },
      },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    return session;
  }

  /** Ücretsiz plan limiti — 60 sn bellek önbelleği (admin değişikliği ≤60 sn'de yansır). */
  private planLimitCache: { limit: number; expiresAt: number } | null = null;

  private async freeDailyLimit(): Promise<number> {
    if (this.planLimitCache && this.planLimitCache.expiresAt > Date.now()) {
      return this.planLimitCache.limit;
    }
    const freePlan = await this.prisma.plan.findUnique({ where: { key: 'free' } });
    const limit = freePlan?.dailyQuestionLimit ?? 15;
    this.planLimitCache = { limit, expiresAt: Date.now() + 60_000 };
    return limit;
  }

  private async enforceDailyLimit(user: AuthenticatedUser) {
    if (user.isPremium) return; // guard hesapladı — sınırsız

    const limit = await this.freeDailyLimit(); // çoğunlukla bellek, 0 sorgu
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // TEK atomik sorgu: satır yoksa aç, limiti aşmadıysa artır; aşıldıysa satır dönmez.
    const rows = await this.prisma.$queryRaw<{ questions_answered: number }[]>`
      INSERT INTO daily_usage (user_id, usage_date, questions_answered, daily_limit)
      VALUES (${user.id}::uuid, ${today}::date, 1, ${limit})
      ON CONFLICT (user_id, usage_date) DO UPDATE
        SET questions_answered = daily_usage.questions_answered + 1
        WHERE daily_usage.questions_answered < ${limit}
      RETURNING questions_answered`;
    if (rows.length === 0) {
      throw new ForbiddenException({
        code: 'DAILY_LIMIT_REACHED',
        message: `Bugünkü ücretsiz soru hakkın (${limit}) doldu. Sınırsız için Premium'a geç.`,
      });
    }
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
