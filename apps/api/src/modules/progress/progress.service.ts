import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { computeStreakUpdate } from './streak.logic';
import { computeRank, rankScore, ACTIVE_DAY_POINTS } from '../coach/rank.logic';

/** Liderlik dönemi — sekmelerle birebir (Bugün/Hafta/Ay/Tüm). */
export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'all';

/** Bir kullanıcının liderlik satırı — kimlik + dönem sıralaması + ömür-boyu kimliği. */
export interface LeaderboardRow {
  rank: number;
  isMe: boolean;
  displayName: string;
  avatarUrl: string | null;
  /** Seçili dönemdeki sıralama metriği: dönem içi doğru cevap sayısı. */
  points: number;
  /** Ömür-boyu tecrübe puanı (rütbe skoru) — Seviye'yi belirler. */
  xp: number;
  level: number;
  rankName: string;
  correct: number;
  accuracy: number;
  sessions: number;
  badges: number;
  /** Son aktif olunan gün (YYYY-MM-DD) — yoksa null. */
  lastActive: string | null;
}

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

      // Konu ilerlemesi CEVAP bazında yazılır (karışık ders/koç seansları da
      // mastery biriktirir — eskiden yalnız tek-konulu oturumlar yazıyordu).
      const answered = session.answers.filter(
        (a) => a.isCorrect != null && a.selectedOptionId != null,
      );
      if (answered.length > 0) {
        const topicOf = new Map(
          (
            await tx.question.findMany({
              where: { id: { in: answered.map((a) => a.questionId) } },
              select: { id: true, topicId: true },
            })
          ).map((q) => [q.id, q.topicId]),
        );
        const byTopic = new Map<string, { solved: number; correct: number }>();
        for (const a of answered) {
          const topicId = topicOf.get(a.questionId);
          if (!topicId) continue;
          const b = byTopic.get(topicId) ?? { solved: 0, correct: 0 };
          b.solved += 1;
          if (a.isCorrect === true) b.correct += 1;
          byTopic.set(topicId, b);
        }
        for (const [topicId, b] of byTopic) {
          const existing = await tx.userTopicProgress.findUnique({
            where: { userId_topicId: { userId, topicId } },
          });
          const newSolved = (existing?.solvedCount ?? 0) + b.solved;
          const newCorrect = (existing?.correctCount ?? 0) + b.correct;
          const mastery = newSolved > 0 ? newCorrect / newSolved : 0;
          await tx.userTopicProgress.upsert({
            where: { userId_topicId: { userId, topicId } },
            update: {
              solvedCount: newSolved,
              correctCount: newCorrect,
              mastery,
              lastActivityAt: new Date(),
            },
            create: {
              userId,
              topicId,
              solvedCount: b.solved,
              correctCount: b.correct,
              mastery,
              lastActivityAt: new Date(),
            },
          });
        }
      }

      // Streak + seri sigortası (Doc 24 §7.2, saf mantık: streak.logic.ts) —
      // vardiyalı çalışan bir gece nöbetiyle seriyi yakmasın.
      const streak = await tx.streak.findUnique({ where: { userId } });
      const entitlement = await tx.entitlement.findUnique({ where: { userId } });
      const isPremium =
        entitlement?.isPremium === true &&
        (entitlement.validUntil == null || entitlement.validUntil > new Date());
      const update = computeStreakUpdate(streak, today, isPremium ? 3 : 1);
      await tx.streak.upsert({
        where: { userId },
        update: {
          currentStreak: update.currentStreak,
          longestStreak: update.longestStreak,
          lastActiveDate: today,
          freezeWeekStart: update.freezeWeekStart,
          freezesUsed: update.freezesUsed,
        },
        create: {
          userId,
          currentStreak: update.currentStreak,
          longestStreak: update.longestStreak,
          lastActiveDate: today,
          freezeWeekStart: update.freezeWeekStart,
          freezesUsed: update.freezesUsed,
        },
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

  /** Dönemin başlangıç anı (UTC); 'all' için alt sınır yoktur (null). */
  private leaderboardFrom(period: LeaderboardPeriod): Date | null {
    if (period === 'all') return null;
    const from = startOfUtcDay(new Date());
    if (period === 'week') {
      const mondayOffset = (from.getUTCDay() + 6) % 7; // Pzt = 0
      from.setUTCDate(from.getUTCDate() - mondayOffset);
    } else if (period === 'month') {
      from.setUTCDate(1);
    }
    return from;
  }

  /** Verilen kullanıcılar için ömür-boyu kimlik verisini (rütbe/rozet/aktiflik) toplar. */
  private async enrichUsers(ids: string[]) {
    const map = new Map<
      string,
      {
        displayName: string;
        avatarUrl: string | null;
        totalSolved: number;
        totalCorrect: number;
        totalSessions: number;
        activeDays: number;
        badges: number;
        lastActive: string | null;
      }
    >();
    if (ids.length === 0) return map;

    const [users, stats, usage, badges, streaks] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, displayName: true, avatarUrl: true },
      }),
      this.prisma.userStats.findMany({
        where: { userId: { in: ids } },
        select: { userId: true, totalSolved: true, totalCorrect: true, totalSessions: true },
      }),
      this.prisma.dailyUsage.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, questionsAnswered: { gt: 0 } },
        _count: { _all: true },
        _max: { usageDate: true },
      }),
      this.prisma.userBadge.groupBy({
        by: ['userId'],
        where: { userId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.streak.findMany({
        where: { userId: { in: ids } },
        select: { userId: true, lastActiveDate: true },
      }),
    ]);

    const statsBy = new Map(stats.map((s) => [s.userId, s]));
    const usageBy = new Map(usage.map((u) => [u.userId, u]));
    const badgeBy = new Map(badges.map((b) => [b.userId, b._count._all]));
    const streakBy = new Map(streaks.map((s) => [s.userId, s.lastActiveDate]));
    const toIso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

    for (const u of users) {
      const s = statsBy.get(u.id);
      const usg = usageBy.get(u.id);
      map.set(u.id, {
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        totalSolved: s?.totalSolved ?? 0,
        totalCorrect: s?.totalCorrect ?? 0,
        totalSessions: s?.totalSessions ?? 0,
        activeDays: usg?._count._all ?? 0,
        badges: badgeBy.get(u.id) ?? 0,
        lastActive: toIso(usg?._max.usageDate) ?? toIso(streakBy.get(u.id)),
      });
    }
    return map;
  }

  private buildRow(
    userId: string,
    meId: string,
    rank: number,
    points: number,
    map: Awaited<ReturnType<ProgressService['enrichUsers']>>,
  ): LeaderboardRow {
    const e = map.get(userId);
    const solved = e?.totalSolved ?? 0;
    const correct = e?.totalCorrect ?? 0;
    const xp = rankScore(solved, e?.activeDays ?? 0);
    const rk = computeRank(xp);
    return {
      rank,
      isMe: userId === meId,
      displayName: e?.displayName ?? 'Aday',
      avatarUrl: e?.avatarUrl ?? null,
      points,
      xp,
      level: rk.level,
      rankName: rk.name,
      correct,
      accuracy: solved > 0 ? Math.round((correct / solved) * 100) : 0,
      sessions: e?.totalSessions ?? 0,
      badges: e?.badges ?? 0,
      lastActive: e?.lastActive ?? null,
    };
  }

  /**
   * Premium liderlik tablosu (Doc 24 §5 gamification, Doc 12 moral-koruyan tasarım).
   * Sıralama metriği = seçili dönemdeki doğru cevap sayısı ("puan"). Her satır ayrıca
   * ömür-boyu XP (rütbe skoru), seviye, başarı %, rozet ve son aktifliği taşır.
   * İlk 50 + kullanıcının kendi satırı (listede olmasa da) + sayfa özeti döner.
   */
  async getLeaderboard(userId: string, period: LeaderboardPeriod) {
    const from = this.leaderboardFrom(period);
    const fromClause = from ? Prisma.sql`AND qs.started_at >= ${from}` : Prisma.empty;

    const [topRows, mineRow, stats] = await Promise.all([
      this.prisma.$queryRaw<{ user_id: string; points: number }[]>(Prisma.sql`
        SELECT qs.user_id, SUM(qs.correct_count)::int AS points
        FROM quiz_sessions qs
        JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
        WHERE qs.status = 'completed' ${fromClause}
        GROUP BY qs.user_id
        HAVING SUM(qs.correct_count) > 0
        ORDER BY points DESC, MAX(qs.completed_at) ASC
        LIMIT 50`),
      this.prisma.$queryRaw<{ points: number }[]>(Prisma.sql`
        SELECT COALESCE(SUM(qs.correct_count), 0)::int AS points
        FROM quiz_sessions qs
        WHERE qs.user_id = ${userId}::uuid AND qs.status = 'completed' ${fromClause}`),
      this.leaderboardStats(),
    ]);

    const myPoints = mineRow[0]?.points ?? 0;
    const inTop = topRows.some((r) => r.user_id === userId);

    let myRank: number | null = null;
    if (myPoints > 0 && !inTop) {
      const rankRow = await this.prisma.$queryRaw<{ rank: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int + 1 AS rank FROM (
          SELECT qs.user_id
          FROM quiz_sessions qs
          JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
          WHERE qs.status = 'completed' ${fromClause}
          GROUP BY qs.user_id
          HAVING SUM(qs.correct_count) > ${myPoints}
        ) better`);
      myRank = rankRow[0]?.rank ?? null;
    }

    const ids = [...new Set([...topRows.map((r) => r.user_id), userId])];
    const enriched = await this.enrichUsers(ids);

    const top = topRows.map((r, i) => this.buildRow(r.user_id, userId, i + 1, r.points, enriched));

    // "Bir üst sırayı geçmek için kaç puan" — üstteki oyuncu yüklü listedeyse hesaplanır.
    let me: (LeaderboardRow & { pointsToNext: number | null; nextName: string | null }) | null;
    const myTopRow = top.find((r) => r.isMe) ?? null;
    if (myTopRow) {
      const above = myTopRow.rank > 1 ? top[myTopRow.rank - 2] : null;
      me = {
        ...myTopRow,
        pointsToNext: above ? Math.max(0, above.points - myTopRow.points) : null,
        nextName: above ? above.displayName : null,
      };
    } else if (myPoints > 0 && myRank != null) {
      const row = this.buildRow(userId, userId, myRank, myPoints, enriched);
      const above = myRank - 2 >= 0 ? (top[myRank - 2] ?? null) : null;
      me = {
        ...row,
        pointsToNext: above ? Math.max(0, above.points - myPoints) : null,
        nextName: above ? above.displayName : null,
      };
    } else {
      // Bu dönemde hiç puanı yok — yine de kimliğini göster (motivasyon için).
      const row = this.buildRow(userId, userId, 0, 0, enriched);
      me = { ...row, rank: 0, pointsToNext: null, nextName: null };
    }

    return { period, stats, top, me };
  }

  /** Sayfa özeti kartları: toplam aktif kullanıcı, bugünkü quiz, dağıtılan XP, günün lideri. */
  private async leaderboardStats() {
    const dayStart = startOfUtcDay(new Date());
    const [totalUsers, todayQuizCount, solvedAgg, activeDayRows, todayLeader] = await Promise.all([
      this.prisma.userStats.count({ where: { totalSessions: { gt: 0 } } }),
      this.prisma.quizSession.count({
        where: { status: 'completed', startedAt: { gte: dayStart } },
      }),
      this.prisma.userStats.aggregate({ _sum: { totalSolved: true } }),
      this.prisma.dailyUsage.count({ where: { questionsAnswered: { gt: 0 } } }),
      this.prisma.$queryRaw<{ display_name: string; points: number }[]>(Prisma.sql`
        SELECT u.display_name, SUM(qs.correct_count)::int AS points
        FROM quiz_sessions qs
        JOIN users u ON u.id = qs.user_id AND u.deleted_at IS NULL
        WHERE qs.status = 'completed' AND qs.started_at >= ${dayStart}
        GROUP BY u.display_name
        HAVING SUM(qs.correct_count) > 0
        ORDER BY points DESC
        LIMIT 1`),
    ]);
    const totalXp = (solvedAgg._sum.totalSolved ?? 0) + ACTIVE_DAY_POINTS * activeDayRows;
    return {
      totalUsers,
      todayQuizCount,
      totalXp,
      todaysLeader: todayLeader[0]?.display_name ?? null,
    };
  }

  async getSummary(userId: string) {
    const [stats, streak] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
    ]);
    const accuracy =
      stats && stats.totalSolved > 0
        ? Math.round((stats.totalCorrect / stats.totalSolved) * 100)
        : 0;
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
        topic: { select: { name: true, course: { select: { name: true } } } },
      },
    });
    return rows.map((r) => ({
      topicId: r.topicId,
      topicName: r.topic.name,
      // Konu haritası ders bazında gruplanır (Doc 25 Performans bölgesi).
      courseName: r.topic.course.name,
      solvedCount: r.solvedCount,
      correctCount: r.correctCount,
      mastery: Math.round(Number(r.mastery) * 100),
    }));
  }

  /** Son 14 günün günlük soru hacmi (daily_usage) — boş günler 0 ile doldurulur. */
  async getActivity(userId: string, days = 14) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const from = new Date(today.getTime() - (days - 1) * 86_400_000);
    const rows = await this.prisma.dailyUsage.findMany({
      where: { userId, usageDate: { gte: from } },
      select: { usageDate: true, questionsAnswered: true },
    });
    const byDay = new Map(
      rows.map((r) => [r.usageDate.toISOString().slice(0, 10), r.questionsAnswered]),
    );
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(from.getTime() + i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      return { date: key, questionsAnswered: byDay.get(key) ?? 0 };
    });
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
