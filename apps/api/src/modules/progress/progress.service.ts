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
