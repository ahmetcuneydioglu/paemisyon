import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

type SessionForProgress = {
  topicId: string | null;
  correctCount: number;
  wrongCount: number;
  answers: { questionId: string; isCorrect: boolean | null; selectedOptionId: string | null }[];
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/// İlerleme kaydı ve okuması (Doc 6 §4.4, Doc 7 §4.5).
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Quiz tamamlanınca çağrılır: stats + konu ilerlemesi + streak + yanlışlar güncellenir. */
  async recordSessionCompletion(userId: string, session: SessionForProgress) {
    const solved = session.correctCount + session.wrongCount; // boş hariç
    const today = startOfUtcDay(new Date());

    await this.prisma.$transaction(async (tx) => {
      await tx.userStats.upsert({
        where: { userId },
        update: {
          totalSolved: { increment: solved },
          totalCorrect: { increment: session.correctCount },
          totalSessions: { increment: 1 },
        },
        create: {
          userId,
          totalSolved: solved,
          totalCorrect: session.correctCount,
          totalSessions: 1,
        },
      });

      if (session.topicId) {
        const existing = await tx.userTopicProgress.findUnique({
          where: { userId_topicId: { userId, topicId: session.topicId } },
        });
        const newSolved = (existing?.solvedCount ?? 0) + solved;
        const newCorrect = (existing?.correctCount ?? 0) + session.correctCount;
        const mastery = newSolved > 0 ? newCorrect / newSolved : 0;
        await tx.userTopicProgress.upsert({
          where: { userId_topicId: { userId, topicId: session.topicId } },
          update: {
            solvedCount: newSolved,
            correctCount: newCorrect,
            mastery,
            lastActivityAt: new Date(),
          },
          create: {
            userId,
            topicId: session.topicId,
            solvedCount: solved,
            correctCount: session.correctCount,
            mastery,
            lastActivityAt: new Date(),
          },
        });
      }

      // Streak
      const streak = await tx.streak.findUnique({ where: { userId } });
      const last = streak?.lastActiveDate ? startOfUtcDay(streak.lastActiveDate) : null;
      let current = streak?.currentStreak ?? 0;
      if (!last) {
        current = 1;
      } else {
        const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
        if (diffDays === 1) current += 1;
        else if (diffDays > 1) current = 1; // boşluk → sıfırla
        // diffDays === 0 → aynı gün, değişmez
      }
      const longest = Math.max(streak?.longestStreak ?? 0, current);
      await tx.streak.upsert({
        where: { userId },
        update: { currentStreak: current, longestStreak: longest, lastActiveDate: today },
        create: { userId, currentStreak: current, longestStreak: longest, lastActiveDate: today },
      });

      // Yanlışlarım / çözüldü
      for (const a of session.answers) {
        if (a.isCorrect === false && a.selectedOptionId != null) {
          await tx.wrongAnswer.upsert({
            where: { userId_questionId: { userId, questionId: a.questionId } },
            update: { wrongCount: { increment: 1 }, lastWrongAt: new Date(), resolvedAt: null },
            create: { userId, questionId: a.questionId },
          });
        } else if (a.isCorrect === true) {
          await tx.wrongAnswer.updateMany({
            where: { userId, questionId: a.questionId, resolvedAt: null },
            data: { resolvedAt: new Date() },
          });
        }
      }
    });
  }

  /**
   * Liderlik tablosu (Doc 13 V1 — moral bozmayan tasarim Doc 12):
   * puan = donem icinde tamamlanan oturumlardaki toplam dogru sayisi.
   * Ilk 20 + kullanicinin kendi sirasi (listede olmasa da) doner.
   */
  async getLeaderboard(userId: string, period: 'daily' | 'monthly') {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    if (period === 'monthly') from.setUTCDate(1);

    const top = await this.prisma.$queryRaw<
      { user_id: string; display_name: string; points: number }[]
    >`
      SELECT qs.user_id, u.display_name, SUM(qs.correct_count)::int AS points
      FROM quiz_sessions qs
      JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
      WHERE qs.status = 'completed' AND qs.started_at >= ${from}
      GROUP BY qs.user_id, u.display_name
      HAVING SUM(qs.correct_count) > 0
      ORDER BY points DESC, MAX(qs.completed_at) ASC
      LIMIT 20`;

    const mineRow = await this.prisma.$queryRaw<{ points: number }[]>`
      SELECT COALESCE(SUM(correct_count), 0)::int AS points
      FROM quiz_sessions
      WHERE user_id = ${userId}::uuid AND status = 'completed' AND started_at >= ${from}`;
    const myPoints = mineRow[0]?.points ?? 0;

    const rankRow = await this.prisma.$queryRaw<{ rank: number }[]>`
      SELECT COUNT(*)::int + 1 AS rank FROM (
        SELECT qs.user_id
        FROM quiz_sessions qs
        JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
        WHERE qs.status = 'completed' AND qs.started_at >= ${from}
        GROUP BY qs.user_id
        HAVING SUM(qs.correct_count) > ${myPoints}
      ) better`;

    return {
      period,
      top: top.map((r, i) => ({
        rank: i + 1,
        displayName: r.display_name,
        points: r.points,
        isMe: r.user_id === userId,
      })),
      me: { rank: myPoints > 0 ? (rankRow[0]?.rank ?? null) : null, points: myPoints },
    };
  }

  async getSummary(userId: string) {
    const [stats, streak] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
    ]);
    const accuracy =
      stats && stats.totalSolved > 0 ? Math.round((stats.totalCorrect / stats.totalSolved) * 100) : 0;
    return {
      totalSolved: stats?.totalSolved ?? 0,
      totalCorrect: stats?.totalCorrect ?? 0,
      totalSessions: stats?.totalSessions ?? 0,
      accuracy,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  }

  async getTopicProgress(userId: string) {
    const rows = await this.prisma.userTopicProgress.findMany({
      where: { userId },
      orderBy: { mastery: 'asc' }, // zayıf konular önce
      select: {
        topicId: true,
        solvedCount: true,
        correctCount: true,
        mastery: true,
        topic: { select: { name: true } },
      },
    });
    return rows.map((r) => ({
      topicId: r.topicId,
      topicName: r.topic.name,
      solvedCount: r.solvedCount,
      correctCount: r.correctCount,
      mastery: Math.round(Number(r.mastery) * 100),
    }));
  }

  async getHistory(userId: string, limit = 20) {
    return this.prisma.quizSession.findMany({
      where: { userId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        mode: true,
        topicId: true,
        totalQuestions: true,
        correctCount: true,
        score: true,
        completedAt: true,
      },
    });
  }
}
