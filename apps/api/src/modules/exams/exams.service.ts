import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QuizService } from '../quiz/quiz.service';
import type { AuthenticatedUser } from '../auth/auth.types';

export type ExamState = 'upcoming' | 'active' | 'ended';

/**
 * Randevulu canlı denemeler (Doc 18). Eski ekip_sinav akışının modern hali:
 * küresel pencere (startAt..startAt+duration), tek katılım, NET puan.
 * TÜM kurallar sunucuda — istemciler (web/iOS/Android) yalnız tüketir.
 */
@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quiz: QuizService,
  ) {}

  private endAt(exam: { startAt: Date; durationMinutes: number }): Date {
    return new Date(exam.startAt.getTime() + exam.durationMinutes * 60_000);
  }

  private stateOf(exam: { startAt: Date; durationMinutes: number }, now = new Date()): ExamState {
    if (now < exam.startAt) return 'upcoming';
    if (now < this.endAt(exam)) return 'active';
    return 'ended';
  }

  // ── Liste (public; kullanıcı varsa kendi katılımıyla zenginleşir) ──
  async list(user?: AuthenticatedUser) {
    const exams = await this.prisma.exam.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: [{ startAt: 'desc' }],
      take: 50,
      include: { _count: { select: { questions: true } } },
    });
    const ids = exams.map((e) => e.id);

    // Katılım sayısı + ortalama NET (yalnız tamamlananlar).
    const stats = await this.prisma.quizSession.groupBy({
      by: ['examId'],
      where: { examId: { in: ids }, status: 'completed' },
      _count: { _all: true },
      _avg: { score: true },
    });
    const statOf = new Map(stats.map((s) => [s.examId, s]));

    const mine = user
      ? await this.prisma.quizSession.findMany({
          where: { userId: user.id, examId: { in: ids } },
          select: { id: true, examId: true, status: true },
        })
      : [];
    const mineOf = new Map(mine.map((m) => [m.examId, m]));

    const now = new Date();
    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: this.endAt(e),
      durationMinutes: e.durationMinutes,
      questionCount: e._count.questions,
      isPremium: e.isPremium,
      questionsOpenAfterEnd: e.questionsOpenAfterEnd,
      state: this.stateOf(e, now),
      participantCount: statOf.get(e.id)?._count._all ?? 0,
      avgScore: statOf.get(e.id)?._avg.score != null
        ? Math.round(Number(statOf.get(e.id)!._avg.score) * 100) / 100
        : null,
      myAttempt: mineOf.get(e.id) ?? null,
    }));
  }

  async detail(examId: string, user?: AuthenticatedUser) {
    const list = await this.list(user);
    const found = list.find((e) => e.id === examId);
    if (!found) throw new NotFoundException('Deneme bulunamadı.');
    return found;
  }

  // ── Başlat / devam et (Doc 18 §7) ──
  async start(user: AuthenticatedUser, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');

    const now = new Date();
    const state = this.stateOf(exam, now);
    if (state === 'upcoming') {
      throw new ConflictException({
        code: 'EXAM_NOT_STARTED',
        message: 'Sınav henüz başlamadı.',
        details: { startAt: exam.startAt },
      });
    }
    if (exam.isPremium && !user.isPremium) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'Bu deneme premium üyelere özeldir.',
      });
    }

    const existing = await this.prisma.quizSession.findUnique({
      where: { userId_examId: { userId: user.id, examId } },
    });

    // Pencere kapandıysa: yarım kalan katılım varsa SUNUCUDA finalize edilir.
    if (state === 'ended') {
      if (existing && existing.status === 'in_progress') {
        await this.quiz.completeSession(user.id, existing.id);
      }
      throw new ConflictException({
        code: existing ? 'EXAM_ALREADY_TAKEN' : 'EXAM_ENDED',
        message: existing
          ? 'Bu sınava katıldın — sonucuna bakabilirsin.'
          : 'Sınav süresi doldu.',
        details: existing ? { attemptId: existing.id } : undefined,
      });
    }

    if (existing?.status === 'completed') {
      throw new ConflictException({
        code: 'EXAM_ALREADY_TAKEN',
        message: 'Bu sınava daha önce katıldın, tekrar katılamazsın.',
        details: { attemptId: existing.id },
      });
    }

    // Soru seti: yayın anında sabitlenmiş sürümler, exam-safe (doğru cevap YOK).
    const questions = await this.examQuestions(examId, { withAnswers: false });
    if (questions.length === 0) {
      throw new ConflictException({ code: 'EXAM_EMPTY', message: 'Denemeye soru bağlanmamış.' });
    }

    const endAt = this.endAt(exam);
    const session =
      existing ??
      (await this.prisma.quizSession
        .create({
          data: {
            userId: user.id,
            mode: 'deneme',
            examId,
            totalQuestions: questions.length,
            // Küresel bitişe kalan süre → mevcut sunucu süre denetimi aynen çalışır.
            plannedDurationSeconds: Math.max(
              1,
              Math.floor((endAt.getTime() - now.getTime()) / 1000),
            ),
          },
        })
        .catch(() => {
          // Unique (userId, examId) yarışı: eşzamanlı ikinci istek → mevcut oturuma düş.
          return this.prisma.quizSession.findUniqueOrThrow({
            where: { userId_examId: { userId: user.id, examId } },
          });
        }));

    // Devam senaryosu: verilmiş cevaplar da döner (yenileme/cihaz değişimi güvenli).
    const given = existing
      ? await this.prisma.quizAnswer.findMany({
          where: { sessionId: session.id },
          select: { questionId: true, selectedOptionId: true },
        })
      : [];

    return {
      sessionId: session.id,
      examId,
      title: exam.title,
      mode: 'deneme' as const,
      endsAt: endAt,
      liveAnswerReveal: exam.liveAnswerReveal,
      questions,
      givenAnswers: given,
    };
  }

  // ── Sonuç + inceleme (yalnız sahibi; Doc 18 güvenlik: anahtar ancak bitince) ──
  async getAttempt(user: AuthenticatedUser, attemptId: string) {
    const session = await this.prisma.quizSession.findFirst({
      where: { id: attemptId, userId: user.id, examId: { not: null } },
      include: { exam: true },
    });
    if (!session || !session.exam) throw new NotFoundException('Katılım bulunamadı.');

    const ended = this.stateOf(session.exam) === 'ended';
    if (session.status === 'in_progress') {
      if (!ended) {
        throw new ConflictException({
          code: 'EXAM_IN_PROGRESS',
          message: 'Sınav devam ediyor.',
          details: { examId: session.examId },
        });
      }
      await this.quiz.completeSession(user.id, session.id); // tembel finalize
    }

    const fresh = await this.prisma.quizSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    const answers = await this.prisma.quizAnswer.findMany({
      where: { sessionId: session.id },
      select: { questionId: true, selectedOptionId: true, isCorrect: true },
    });
    const answerOf = new Map(answers.map((a) => [a.questionId, a]));
    const review = (await this.examQuestions(session.examId!, { withAnswers: true })).map((q) => ({
      ...q,
      selectedOptionId: answerOf.get(q.questionId)?.selectedOptionId ?? null,
    }));

    return {
      attemptId: session.id,
      exam: {
        id: session.exam.id,
        title: session.exam.title,
        startAt: session.exam.startAt,
        durationMinutes: session.exam.durationMinutes,
      },
      totalQuestions: fresh.totalQuestions,
      correctCount: fresh.correctCount,
      wrongCount: fresh.wrongCount,
      blankCount: fresh.blankCount,
      score: fresh.score != null ? Number(fresh.score) : null, // NET (doğru − yanlış/4)
      durationSeconds: fresh.durationSeconds,
      completedAt: fresh.completedAt,
      review,
    };
  }

  // ── Deneme sıralaması (public; pencere kapanmadan liste verilmez) ──
  async leaderboard(examId: string, user?: AuthenticatedUser) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    if (this.stateOf(exam) !== 'ended') {
      return { available: false, endAt: this.endAt(exam), top: [], me: null };
    }

    const sessions = await this.prisma.quizSession.findMany({
      where: { examId, status: 'completed' },
      orderBy: [{ score: 'desc' }, { durationSeconds: 'asc' }, { completedAt: 'asc' }],
      include: { user: { select: { id: true, displayName: true, deletedAt: true } } },
    });
    const ranked = sessions
      .filter((s) => s.user.deletedAt == null)
      .map((s, i) => ({
        rank: i + 1,
        displayName: s.user.displayName,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        blankCount: s.blankCount,
        score: s.score != null ? Number(s.score) : 0,
        durationSeconds: s.durationSeconds,
        isMe: user ? s.userId === user.id : false,
      }));

    const me = ranked.find((r) => r.isMe) ?? null;
    return {
      available: true,
      endAt: this.endAt(exam),
      participantCount: ranked.length,
      top: ranked.slice(0, 100),
      me,
    };
  }

  // ── Genel liderlik (eski lider-tablosu): tüm denemelerin ortalaması ──
  async globalLeaderboard(user?: AuthenticatedUser) {
    const rows = await this.prisma.$queryRaw<
      { user_id: string; display_name: string; avg_score: number; attempts: number; total_correct: number }[]
    >`
      SELECT qs.user_id, u.display_name,
             AVG(qs.score)::float AS avg_score,
             COUNT(*)::int AS attempts,
             SUM(qs.correct_count)::int AS total_correct
      FROM quiz_sessions qs
      JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
      WHERE qs.mode = 'deneme' AND qs.status = 'completed'
      GROUP BY qs.user_id, u.display_name
      ORDER BY avg_score DESC, attempts DESC`;
    const ranked = rows.map((r, i) => ({
      rank: i + 1,
      displayName: r.display_name,
      avgScore: Math.round(r.avg_score * 100) / 100,
      attempts: r.attempts,
      totalCorrect: r.total_correct,
      isMe: user ? r.user_id === user.id : false,
    }));
    const me = ranked.find((x) => x.isMe) ?? null;
    return { top: ranked.slice(0, 100), me, participantCount: ranked.length };
  }

  // ── Sınav sonrası serbest soru görüntüleme (eski /sorular; cevapsız) ──
  async browseQuestions(examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: 'published', deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    if (!exam.questionsOpenAfterEnd || this.stateOf(exam) !== 'ended') {
      throw new ForbiddenException({
        code: 'QUESTIONS_NOT_OPEN',
        message: 'Bu denemenin soruları görüntülemeye açık değil.',
      });
    }
    return {
      examId,
      title: exam.title,
      questions: await this.examQuestions(examId, { withAnswers: false }),
    };
  }

  // ── Geçmişim ──
  async myAttempts(user: AuthenticatedUser) {
    const sessions = await this.prisma.quizSession.findMany({
      where: { userId: user.id, examId: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: { exam: { select: { id: true, title: true, startAt: true, durationMinutes: true } } },
    });
    return sessions.map((s) => ({
      attemptId: s.id,
      exam: s.exam,
      status: s.status,
      correctCount: s.correctCount,
      wrongCount: s.wrongCount,
      blankCount: s.blankCount,
      score: s.score != null ? Number(s.score) : null,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    }));
  }

  // ── Yardımcı: sabitlenmiş sürümlerden soru yükü ──
  private async examQuestions(examId: string, opts: { withAnswers: boolean }) {
    const rows = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { sortOrder: 'asc' },
      include: {
        questionVersion: {
          select: {
            id: true,
            questionId: true,
            stem: true,
            mediaUrl: true,
            explanation: opts.withAnswers,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, text: true, isCorrect: opts.withAnswers },
            },
          },
        },
      },
    });
    return rows.map((r, i) => ({
      order: i + 1,
      questionId: r.questionId,
      versionId: r.questionVersionId,
      stem: r.questionVersion.stem,
      mediaUrl: r.questionVersion.mediaUrl,
      explanation: opts.withAnswers ? (r.questionVersion as { explanation?: string | null }).explanation ?? null : undefined,
      options: r.questionVersion.options,
    }));
  }
}
