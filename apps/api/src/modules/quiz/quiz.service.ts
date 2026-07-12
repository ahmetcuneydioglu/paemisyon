import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { isEntitlementActive } from '../billing/entitlement.util';
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
  async startSession(userId: string, dto: StartSessionDto) {
    const count = dto.questionCount ?? 10;

    const pool = await this.prisma.question.findMany({
      where: { topicId: dto.topicId, deletedAt: null, currentVersionId: { not: null } },
      select: { id: true, currentVersionId: true },
    });
    if (pool.length === 0) {
      throw new NotFoundException('Bu konuda yayında soru yok.');
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

    const session = await this.prisma.quizSession.create({
      data: { userId, mode: dto.mode, topicId: dto.topicId, totalQuestions: chosen.length },
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

    return { sessionId: session.id, mode: session.mode, questions };
  }

  /** Tek cevap gönder (idempotent). Sunucu değerlendirir; freemium limiti sunucuda. */
  async submitAnswer(userId: string, sessionId: string, dto: SubmitAnswerDto) {
    const session = await this.prisma.quizSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Oturum tamamlanmış.');
    }

    const existing = await this.prisma.quizAnswer.findUnique({
      where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
    });
    // Yeni soru → freemium günlük limit (re-answer sayılmaz).
    if (!existing) {
      await this.enforceDailyLimit(userId);
    }

    // Doğru cevabı SUNUCUDA bul.
    const correct = await this.prisma.questionOption.findFirst({
      where: { questionVersionId: dto.questionVersionId, isCorrect: true },
      select: { id: true },
    });
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

    return {
      sessionId,
      totalQuestions: session.totalQuestions,
      correctCount,
      wrongCount,
      blankCount,
      score: Math.round(score * 100) / 100,
      durationSeconds,
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

  private async enforceDailyLimit(userId: string) {
    const entitlement = await this.prisma.entitlement.findUnique({ where: { userId } });
    if (isEntitlementActive(entitlement)) return; // premium (süresi geçerli) = sınırsız

    const freePlan = await this.prisma.plan.findUnique({ where: { key: 'free' } });
    const limit = freePlan?.dailyQuestionLimit ?? 15;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const usage = await this.prisma.dailyUsage.upsert({
      where: { userId_usageDate: { userId, usageDate: today } },
      update: {},
      create: { userId, usageDate: today, questionsAnswered: 0, dailyLimit: limit },
    });

    if (usage.questionsAnswered >= limit) {
      throw new ForbiddenException({
        code: 'DAILY_LIMIT_REACHED',
        message: `Bugünkü ücretsiz soru hakkın (${limit}) doldu. Sınırsız için Premium'a geç.`,
      });
    }

    await this.prisma.dailyUsage.update({
      where: { userId_usageDate: { userId, usageDate: today } },
      data: { questionsAnswered: { increment: 1 } },
    });
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
