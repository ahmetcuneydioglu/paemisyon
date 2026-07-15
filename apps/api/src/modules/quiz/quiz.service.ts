import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { BadgeService } from '../coach/badge.service';
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
    private readonly badges: BadgeService,
    private readonly settings: SettingsService,
  ) {}

  /** Oturum başlat: konudan rastgele yayında sorular → exam-güvenli (cevapsız) döner. */
  /** Sınav süresi: soru başına 75 sn (polis sınavı temposu). */
  private static readonly EXAM_SECONDS_PER_QUESTION = 75;
  /** Süre aşımı toleransı (ağ gecikmesi için). */
  private static readonly EXAM_GRACE_SECONDS = 30;

  async startSession(user: AuthenticatedUser, dto: StartSessionDto) {
    const userId = user.id;
    const count = dto.questionCount ?? 10;

    // Günün sorusu: kapsamsız özel akış (deterministik, günde 1 hak).
    if (dto.mode === 'daily') {
      if (dto.topicId != null || dto.courseId != null) {
        throw new BadRequestException('Günün sorusu kapsam almaz (topicId/courseId verilmez).');
      }
      return this.startDailySession(userId);
    }

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

  // ── Günün Quizi (Doc 13 V1 — eski daily_quiz'in modern hali) ──
  // 10 karışık soru, PAEM → Genel Mevzuat'tan; günde 1 hak; herkese aynı set
  // (tarih tohumlu deterministik seçim → adil liderlik). Seri sayar.
  private static readonly DAILY_QUESTION_COUNT = 10;
  private static readonly DAILY_COURSE_NAME = 'Genel Mevzuat';
  private static readonly DAILY_MODULE_KEY = 'paem';

  private async startDailySession(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existing = await this.prisma.quizSession.findFirst({
      where: { userId, mode: 'daily', startedAt: { gte: today } },
      orderBy: { startedAt: 'desc' },
    });
    if (existing?.status === 'completed') {
      throw new ConflictException({
        code: 'DAILY_ALREADY_PLAYED',
        message: 'Günün quizini bugün zaten çözdün. Yarın yenisi seni bekliyor! 🌅',
      });
    }

    const questions = await this.pickDailyQuestions();
    // Yarım kalan oturum → aynı oturum + aynı (deterministik) sorularla devam.
    const session =
      existing ??
      (await this.prisma.quizSession.create({
        data: { userId, mode: 'daily', totalQuestions: questions.length },
      }));
    return {
      sessionId: session.id,
      mode: 'daily' as const,
      plannedDurationSeconds: null,
      questions,
    };
  }

  private async pickDailyQuestions() {
    // Havuz: PAEM → Genel Mevzuat dersindeki yayında, premium OLMAYAN sorular.
    const pool = await this.prisma.question.findMany({
      where: {
        deletedAt: null,
        currentVersionId: { not: null },
        topic: {
          deletedAt: null,
          isPremium: false,
          course: {
            name: QuizService.DAILY_COURSE_NAME,
            deletedAt: null,
            examType: { key: QuizService.DAILY_MODULE_KEY },
          },
        },
      },
      select: { id: true, currentVersionId: true },
      orderBy: { id: 'asc' }, // deterministik taban sıra
    });
    if (pool.length === 0) {
      throw new NotFoundException(
        "Günün quizi için PAEM Genel Mevzuat'ta yayında soru yok. Panelden onaylaman gerekebilir.",
      );
    }

    // Tarih tohumlu örneklem — herkes o gün aynı 10 soruyu görür (adil liderlik).
    const dateKey = new Date().toISOString().slice(0, 10);
    const seed = QuizService.hashString(dateKey);
    const chosen = QuizService.seededSample(pool, QuizService.DAILY_QUESTION_COUNT, seed);

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
    // chosen sırasını koru (deterministik).
    return chosen.map((q) => {
      const v = byId.get(q.currentVersionId!)!;
      return {
        questionId: v.questionId,
        versionId: v.id,
        stem: v.stem,
        mediaUrl: v.mediaUrl,
        options: v.options,
      };
    });
  }

  /** djb2 — kriptografik değil; gün içi sabit tohum için yeterli. */
  private static hashString(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }

  /** Tohumlu (deterministik) örneklem — Fisher-Yates + mulberry32 PRNG. */
  private static seededSample<T>(arr: readonly T[], n: number, seed: number): T[] {
    const a = [...arr];
    let s = seed >>> 0;
    const rand = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(n, a.length));
  }

  /** Günün sorusu durumu (Home kartı): bugün oynandı mı, doğru muydu? */
  async getDailyStatus(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const session = await this.prisma.quizSession.findFirst({
      where: { userId, mode: 'daily', startedAt: { gte: today } },
      orderBy: { startedAt: 'desc' },
      select: { status: true, correctCount: true },
    });
    return {
      playedToday: session?.status === 'completed',
      correct: session?.status === 'completed' ? session.correctCount > 0 : null,
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
    // deneme: pencere açıkken anahtar SIZDIRILMAZ — yalnız liveAnswerReveal
    // açık denemelerde practice-gibi anlık geri bildirim (Doc 18 karar 5,
    // varsayılan KAPALI; eski sistemin anahtar-sızdırma açığı taşınmaz).
    if (session.mode === 'deneme') {
      const exam = session.examId
        ? await this.prisma.exam.findUnique({
            where: { id: session.examId },
            select: { liveAnswerReveal: true },
          })
        : null;
      if (!exam?.liveAnswerReveal) {
        return { recorded: true };
      }
    }

    // practice: anlık geri bildirim + açıklama (+ kaynak, ayar açıksa).
    const [version, showSource] = await Promise.all([
      this.prisma.questionVersion.findUnique({
        where: { id: dto.questionVersionId },
        select: {
          explanation: true,
          sourceLabel: true,
          legalReferences: { select: { citation: true }, take: 1 },
        },
      }),
      this.settings.getBool(SETTING_KEYS.showQuestionSource, true),
    ]);
    return {
      isCorrect,
      correctOptionId: correct?.id ?? null,
      explanation: version?.explanation ?? null,
      legalReference: version?.legalReferences[0]?.citation ?? null,
      source: showSource ? (version?.sourceLabel ?? null) : null,
    };
  }

  /** Oturumu bitir: skor + doğru/yanlış/boş (sunucuda hesaplanır). */
  async completeSession(userId: string, sessionId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      include: { answers: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');

    // İDEMPOTENT: bitmiş oturuma ikinci çağrı istatistikleri ÇİFT SAYMAZ —
    // saklanan sonuç aynen döner (deneme finalize yarışları için kritik, Doc 18).
    if (session.status === 'completed') {
      return {
        sessionId,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        blankCount: session.blankCount,
        score: session.score != null ? Number(session.score) : 0,
        durationSeconds: session.durationSeconds ?? 0,
        plannedDurationSeconds: session.plannedDurationSeconds,
        topicBreakdown: null,
        earnedBadges: [],
      };
    }

    const correctCount = session.answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = session.answers.filter(
      (a) => a.isCorrect === false && a.selectedOptionId != null,
    ).length;
    const blankCount = session.totalQuestions - correctCount - wrongCount;
    // Puan: deneme = NET (doğru − yanlış/4, polis sınavı kuralı — Doc 18 karar 3);
    // diğer modlar = yüzde (mevcut davranış).
    const score =
      session.mode === 'deneme'
        ? correctCount - wrongCount / 4
        : session.totalQuestions > 0
          ? (correctCount / session.totalQuestions) * 100
          : 0;
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

    // Rozet kontrolü (Doc 19): stats/streak TAZEyken. Hata oturumu bozmasın —
    // rozet bir sonraki tamamlamada telafi edilir (checkAndAward idempotent).
    let earnedBadges: Awaited<ReturnType<BadgeService['checkAndAward']>> = [];
    try {
      earnedBadges = await this.badges.checkAndAward(userId);
    } catch {
      /* sessiz: kutlama kaçar ama sonuç kaybolmaz */
    }

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
      // Yeni kazanılan rozetler — istemci kutlama gösterir (Doc 19).
      earnedBadges,
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
