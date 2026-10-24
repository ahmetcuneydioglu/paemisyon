import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AuditService } from '../audit.service';
import { PushService } from '../../notifications/push.service';
import { QuizService } from '../../quiz/quiz.service';
import { ExamsService } from '../../exams/exams.service';
import { mean, median, rankWithTies } from '../../exams/exam-scoring.logic';
import { ExamAdjustmentDto } from '../dto/exam.dto';

/**
 * Soru iptali ve deneme istatistiği (Doc 50 §2.3, A-istatistik).
 *
 * İptal = puanlama kuralı değişikliği: etkilenen RESMÎ oturumlar aynı
 * `scoreDeneme` ile yeniden puanlanır, takvimli deneme donmuşsa sıralama
 * yeniden hesaplanır, adaya "netin güncellendi" izi (previousScore) yazılır.
 * Varsayılan eylem "herkese doğru say" — kimsenin neti düşmez.
 */
@Injectable()
export class AdminExamAdjustmentsService {
  private readonly logger = new Logger(AdminExamAdjustmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly push: PushService,
    private readonly quiz: QuizService,
    private readonly exams: ExamsService,
  ) {}

  async list(examId: string) {
    await this.exists(examId);
    const rows = await this.prisma.examQuestionAdjustment.findMany({
      where: { examId },
      orderBy: { createdAt: 'desc' },
    });
    const qs = await this.prisma.question.findMany({
      where: { id: { in: rows.map((r) => r.questionId) } },
      select: { id: true, currentVersion: { select: { stem: true } } },
    });
    const stemOf = new Map(qs.map((q) => [q.id, q.currentVersion?.stem ?? '']));
    return rows.map((r) => ({ ...r, stem: stemOf.get(r.questionId)?.slice(0, 160) ?? '' }));
  }

  /** Etki önizlemesi: kaç adayın neti ne kadar değişir (yazmaz). */
  async preview(examId: string, dto: ExamAdjustmentDto) {
    const exam = await this.exists(examId);
    const inSet = await this.prisma.examQuestion.findUnique({
      where: { examId_questionId: { examId, questionId: dto.questionId } },
    });
    if (!inSet) throw new NotFoundException('Bu soru denemede yok.');
    const sessions = await this.officialSessions(examId);
    const current = await this.exams.activeAdjustments(examId);
    const next = new Map(current);
    next.set(dto.questionId, dto.action);
    let up = 0;
    let down = 0;
    let same = 0;
    let deltaSum = 0;
    for (const s of sessions) {
      const before = s.score != null ? Number(s.score) : 0;
      const r = await this.rescore(s, next);
      const d = Math.round((r.score - before) * 100) / 100;
      if (d > 0) up++;
      else if (d < 0) down++;
      else same++;
      deltaSum += d;
    }
    return {
      examId,
      questionId: dto.questionId,
      action: dto.action,
      affected: sessions.length,
      up,
      down,
      same,
      avgDelta: sessions.length ? Math.round((deltaSum / sessions.length) * 100) / 100 : 0,
      frozen: exam.rankingsComputedAt != null,
      sentence: this.sentence(sessions.length, up, down, dto.action),
    };
  }

  private sentence(n: number, up: number, down: number, action: 'credit_all' | 'exclude') {
    if (n === 0) return 'Henüz resmî çözüm yok; iptal yalnız sonraki çözümleri etkiler.';
    if (action === 'credit_all')
      return `${up} adayın resmî neti artar; ${n - up} adayın neti değişmez.`;
    return `${up} adayın neti artar, ${down} adayın neti düşer, ${n - up - down} değişmez (hesaptan çıkarma).`;
  }

  async apply(actor: AuthenticatedUser, examId: string, dto: ExamAdjustmentDto) {
    const exam = await this.exists(examId);
    if (exam.status !== 'published')
      throw new BadRequestException('İptal yalnız yayındaki denemede yapılır.');
    const inSet = await this.prisma.examQuestion.findUnique({
      where: { examId_questionId: { examId, questionId: dto.questionId } },
    });
    if (!inSet) throw new NotFoundException('Bu soru denemede yok.');
    const existing = await this.prisma.examQuestionAdjustment.findFirst({
      where: { examId, questionId: dto.questionId, revertedAt: null },
    });
    if (existing)
      throw new BadRequestException('Bu soru için zaten etkin bir iptal var; önce geri al.');

    const row = await this.prisma.examQuestionAdjustment.create({
      data: {
        examId,
        questionId: dto.questionId,
        action: dto.action,
        reason: dto.reason,
        actorId: actor.id,
      },
    });
    const changed = await this.rescoreAll(examId, dto.notify === true, exam.title);
    await this.audit.log(actor, 'exam.adjustment', 'exam', examId, {
      questionId: dto.questionId,
      action: dto.action,
      reason: dto.reason,
      ...changed,
    });
    return { adjustment: row, ...changed };
  }

  async revert(actor: AuthenticatedUser, examId: string, adjustmentId: string) {
    const exam = await this.exists(examId);
    const row = await this.prisma.examQuestionAdjustment.findFirst({
      where: { id: adjustmentId, examId, revertedAt: null },
    });
    if (!row) throw new NotFoundException('Etkin iptal bulunamadı.');
    await this.prisma.examQuestionAdjustment.update({
      where: { id: adjustmentId },
      data: { revertedAt: new Date() },
    });
    const changed = await this.rescoreAll(examId, false, exam.title);
    await this.audit.log(actor, 'exam.adjustment_revert', 'exam', examId, {
      adjustmentId,
      questionId: row.questionId,
      ...changed,
    });
    return { reverted: true, ...changed };
  }

  /** Bütün resmî oturumları yeniden puanla; sıralama donmuşsa yeniden dondur. */
  private async rescoreAll(examId: string, notify: boolean, title: string) {
    const sessions = await this.officialSessions(examId);
    const adjustments = await this.exams.activeAdjustments(examId);
    let changed = 0;
    for (const s of sessions) {
      const before = s.score != null ? Number(s.score) : 0;
      const r = await this.rescore(s, adjustments);
      if (r.score === before && r.correct === s.correctCount && r.wrong === s.wrongCount) continue;
      changed++;
      await this.prisma.quizSession.update({
        where: { id: s.id },
        data: {
          correctCount: r.correct,
          wrongCount: r.wrong,
          blankCount: r.blank,
          score: r.score,
          previousScore: s.previousScore ?? before, // ilk iptalden önceki net korunur
          scoreUpdatedAt: new Date(),
        },
      });
      if (notify) {
        await this.push
          .sendToUser(s.userId, {
            title: 'Netin güncellendi',
            body: `${title}: bir soru iptal edildi; netin ${before.toLocaleString('tr-TR')} → ${r.score.toLocaleString('tr-TR')}.`,
            route: `deneme-sonuc/${s.id}`,
          })
          .catch(() => undefined);
      }
    }
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      select: { rankingsComputedAt: true },
    });
    let rankingsRefrozen = false;
    if (exam.rankingsComputedAt) {
      await this.exams.freezeRankings(examId);
      rankingsRefrozen = true;
    }
    this.logger.log(`Yeniden puanlama ${examId}: ${changed}/${sessions.length} oturum değişti`);
    return { rescored: sessions.length, changed, rankingsRefrozen };
  }

  private async rescore(
    s: {
      id: string;
      examId: string | null;
      totalQuestions: number;
      questionOrder: unknown;
      answers: {
        questionId: string;
        questionVersionId: string;
        selectedOptionId: string | null;
        isCorrect: boolean | null;
      }[];
    },
    adjustments: Map<string, 'credit_all' | 'exclude'>,
  ) {
    const order = s.questionOrder;
    const orderSet = Array.isArray(order) && order.length > 0 ? new Set(order as string[]) : null;
    // scoreDeneme iptalleri DB'den okur; önizleme için farklı haritayla hesaplamak
    // gerekince aynı saf fonksiyonu doğrudan kullanırız.
    const { scoreAttempt } = await import('../../exams/exam-scoring.logic');
    let byVersion: Map<string, string> | null = null;
    if (orderSet) {
      const known = new Map(s.answers.map((a) => [a.questionVersionId, a.questionId]));
      const missing = [...orderSet].filter((v) => !known.has(v));
      if (missing.length > 0) {
        const vs = await this.prisma.questionVersion.findMany({
          where: { id: { in: missing } },
          select: { id: true, questionId: true },
        });
        for (const v of vs) known.set(v.id, v.questionId);
      }
      byVersion = new Map();
      for (const v of orderSet) {
        const q = known.get(v);
        if (q) byVersion.set(v, q);
      }
    }
    return scoreAttempt({
      total: s.totalQuestions,
      questionIdByVersion: byVersion,
      answers: s.answers,
      adjustments,
    });
  }

  private officialSessions(examId: string) {
    return this.prisma.quizSession.findMany({
      where: { examId, status: 'completed', attemptRole: 'official' },
      include: {
        answers: {
          select: {
            questionId: true,
            questionVersionId: true,
            selectedOptionId: true,
            isCorrect: true,
          },
        },
      },
    });
  }

  // ── İstatistik (Figma A-istatistik) ──
  async stats(examId: string) {
    const exam = await this.exists(examId);
    const [started, completedOfficial, inProgress, practice] = await Promise.all([
      this.prisma.quizSession.count({
        where: { examId, attemptRole: 'official', status: { not: 'abandoned' } },
      }),
      this.prisma.quizSession.findMany({
        where: { examId, attemptRole: 'official', status: 'completed' },
        select: {
          id: true,
          userId: true,
          score: true,
          wrongCount: true,
          durationSeconds: true,
          completedAt: true,
          closedReason: true,
        },
      }),
      this.prisma.quizSession.count({ where: { examId, status: 'in_progress' } }),
      this.prisma.quizSession.count({
        where: { examId, attemptRole: 'practice', status: 'completed' },
      }),
    ]);
    const scores = completedOfficial.map((s) => (s.score != null ? Number(s.score) : 0));
    const durations = completedOfficial.map((s) => s.durationSeconds ?? 0);
    // Net dağılımı: 10'luk kovalar (−25..100).
    const buckets = new Map<number, number>();
    for (const sc of scores) {
      const b = Math.floor(sc / 10) * 10;
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
    const distribution = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([from, count]) => ({ from, to: from + 10, count }));

    // Soru analizi: doğru oranı, şık dağılımı, süre; "anahtar şüpheli" işareti.
    const rows = await this.prisma.$queryRaw<
      {
        question_id: string;
        option_id: string | null;
        n: number;
        ok: number;
        avg_ms: number | null;
      }[]
    >`
      SELECT qa.question_id, qa.selected_option_id AS option_id, COUNT(*)::int AS n,
             SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS ok,
             AVG(qa.time_spent_ms)::float AS avg_ms
      FROM quiz_answers qa
      JOIN quiz_sessions qs ON qs.id = qa.session_id
      WHERE qs.exam_id = ${examId}::uuid AND qs.status = 'completed' AND qs.attempt_role = 'official'
      GROUP BY qa.question_id, qa.selected_option_id`;
    const examQs = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { sortOrder: 'asc' },
      include: {
        questionVersion: {
          select: {
            stem: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, label: true, isCorrect: true },
            },
          },
        },
        question: {
          select: {
            topic: { select: { name: true, course: { select: { name: true } } } },
            reports: { where: { status: 'open' }, select: { id: true } },
          },
        },
      },
    });
    const adjustments = await this.exams.activeAdjustments(examId);
    const byQ = new Map<string, typeof rows>();
    for (const r of rows) {
      const arr = byQ.get(r.question_id) ?? [];
      arr.push(r);
      byQ.set(r.question_id, arr);
    }
    const total = completedOfficial.length;
    const questions = examQs.map((q, i) => {
      const agg = byQ.get(q.questionId) ?? [];
      const answered = agg.filter((a) => a.option_id != null).reduce((s, a) => s + a.n, 0);
      const correct = agg.reduce((s, a) => s + a.ok, 0);
      const blank = Math.max(0, total - answered);
      const optionShare = q.questionVersion.options.map((o) => ({
        optionId: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
        count: agg.filter((a) => a.option_id === o.id).reduce((s, a) => s + a.n, 0),
      }));
      const rate = total > 0 ? Math.round((correct / total) * 100) : null;
      const topWrong = optionShare.filter((o) => !o.isCorrect).sort((a, b) => b.count - a.count)[0];
      const keySuspect =
        total >= 10 &&
        rate != null &&
        rate < 25 &&
        topWrong != null &&
        topWrong.count / Math.max(1, answered) > 0.5;
      const ms = agg.filter((a) => a.avg_ms != null);
      const avgMs = ms.length
        ? Math.round(
            ms.reduce((s, a) => s + (a.avg_ms ?? 0) * a.n, 0) /
              Math.max(
                1,
                ms.reduce((s, a) => s + a.n, 0),
              ),
          )
        : null;
      return {
        no: i + 1,
        questionId: q.questionId,
        stem: q.questionVersion.stem.slice(0, 200),
        course: q.question.topic.course.name,
        topic: q.question.topic.name,
        correctRate: rate,
        blank,
        avgSeconds: avgMs != null ? Math.round(avgMs / 1000) : null,
        optionShare,
        openReports: q.question.reports.length,
        keySuspect,
        adjustment: adjustments.get(q.questionId) ?? null,
        attention: keySuspect || q.question.reports.length > 0 || adjustments.has(q.questionId),
      };
    });
    const ranked = rankWithTies(
      completedOfficial.map((s) => ({
        key: s.userId,
        score: s.score != null ? Number(s.score) : 0,
        wrongCount: s.wrongCount,
        durationSeconds: s.durationSeconds ?? 0,
        submittedAt: s.completedAt ?? new Date(0),
      })),
    );
    return {
      exam: {
        id: exam.id,
        title: exam.title,
        publishMode: exam.publishMode,
        status: exam.status,
        rankingsComputedAt: exam.rankingsComputedAt,
      },
      summary: {
        started,
        completed: total,
        inProgress,
        practice,
        timeouts: completedOfficial.filter((s) => s.closedReason === 'timeout').length,
        meanScore: mean(scores),
        medianScore: median(scores),
        medianDurationSeconds: median(durations),
        maxScore: scores.length ? Math.max(...scores) : null,
      },
      distribution,
      questions,
      topRanks: ranked.slice(0, 3).map((r) => ({ rank: r.rank, score: r.row.score })),
    };
  }

  private async exists(id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, deletedAt: null } });
    if (!exam) throw new NotFoundException('Deneme bulunamadı.');
    return exam;
  }
}
