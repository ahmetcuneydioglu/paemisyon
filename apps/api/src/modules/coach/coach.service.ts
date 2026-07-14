import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CoachBrief, CoachCard, CoachContext } from './coach.types';
import { coachRules, motivationRule } from './rules';

/** Haftalık aktif gün hedefi (v1 sabit; ileride kullanıcı ayarı olabilir). */
const WEEKLY_GOAL_DAYS = 5;

/**
 * Kişisel Koç motoru (Doc 19). Akış: buildContext (tek Promise.all ile gerçek
 * veri) → kurallar (saf fonksiyonlar) → en önemli 4 kart + primaryAction.
 * AI-hazırlık: v2'de bu servisin kart üreticisi değişir, sözleşme değişmez.
 */
@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  async brief(user: AuthenticatedUser): Promise<CoachBrief> {
    const ctx = await this.buildContext(user);

    let cards: CoachCard[] = coachRules
      .map((rule) => rule(ctx))
      .filter((c): c is CoachCard => c != null)
      .sort((a, b) => b.priority - a.priority);

    // Geri dönüş kartı TEK BAŞINA gösterilir (Doc 19 kural 12):
    // uzun aradan dönen kullanıcıyı görev listesiyle boğma.
    const comeback = cards.find((c) => c.type === 'comeback');
    if (comeback) {
      cards = [comeback];
    } else if (cards.length === 0) {
      cards = [motivationRule(ctx)!]; // motivasyon her zaman kart döndürür
    } else {
      cards = cards.slice(0, 4);
    }

    const top = cards[0];
    const primaryAction: CoachBrief['primaryAction'] = top?.cta
      ? { type: top.type, ...top.cta }
      : { type: 'default', label: 'Çalışmaya başla', route: '/catalog' };

    return {
      greeting: {
        displayName: ctx.user.displayName,
        isPremium: ctx.user.isPremium,
        onboardingCompleted: ctx.user.onboardingCompleted,
        preferredModuleName: ctx.user.preferredModuleName,
      },
      today: {
        goal: ctx.user.dailyGoal,
        answered: ctx.answeredToday,
        streak: {
          current: ctx.streak.current,
          longest: ctx.streak.longest,
          // Bayrak saatten bağımsız (UI ince uyarı gösterebilir);
          // kart (streak_risk) yalnız akşam tetiklenir.
          atRisk: ctx.streak.activeYesterday && ctx.answeredToday === 0,
        },
      },
      primaryAction,
      cards,
      stats: {
        totalSolved: ctx.stats.totalSolved,
        accuracy:
          ctx.stats.totalSolved > 0
            ? Math.round((ctx.stats.totalCorrect / ctx.stats.totalSolved) * 100)
            : 0,
        totalSessions: ctx.stats.totalSessions,
      },
      gamification: {
        nextBadge: ctx.nextBadge,
        records: {
          bestNet: ctx.exams.bestNet,
          longestStreak: ctx.streak.longest,
          maxDailyQuestions: ctx.maxDailyQuestions,
        },
        weekly: ctx.weekly,
      },
    };
  }

  // ── Bağlam: kuralların okuduğu TÜM gerçek veri tek seferde ──

  private async buildContext(user: AuthenticatedUser): Promise<CoachContext> {
    const now = new Date();
    const todayUtc = startOfUtcDay(now);
    const weekStart = startOfUtcWeek(now);
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 3_600_000);

    const [
      profile,
      streak,
      todayUsage,
      stats,
      unresolvedWrongCount,
      weakest,
      exams,
      mySessions,
      denemeAgg,
      dailySession,
      badgeCatalog,
      earnedBadges,
      weeklyActive,
      maxDaily,
      snapshots,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          displayName: true,
          dailyGoal: true,
          onboardingCompletedAt: true,
          preferredModule: { select: { name: true } },
        },
      }),
      this.prisma.streak.findUnique({ where: { userId: user.id } }),
      this.prisma.dailyUsage.findUnique({
        where: { userId_usageDate: { userId: user.id, usageDate: todayUtc } },
      }),
      this.prisma.userStats.findUnique({ where: { userId: user.id } }),
      this.prisma.wrongAnswer.count({
        where: { userId: user.id, resolvedAt: null },
      }),
      this.prisma.userTopicProgress.findFirst({
        where: {
          userId: user.id,
          solvedCount: { gte: 10 },
          mastery: { lt: 0.5 },
        },
        orderBy: { mastery: 'asc' },
        include: { topic: { select: { id: true, name: true } } },
      }),
      this.prisma.exam.findMany({
        where: { status: 'published', deletedAt: null },
        orderBy: { startAt: 'desc' },
        take: 20,
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.quizSession.findMany({
        where: { userId: user.id, examId: { not: null } },
        select: { examId: true, status: true },
      }),
      this.prisma.quizSession.aggregate({
        where: { userId: user.id, mode: 'deneme', status: 'completed' },
        _count: { _all: true },
        _max: { score: true },
      }),
      this.prisma.quizSession.findFirst({
        where: { userId: user.id, mode: 'daily', startedAt: { gte: todayUtc } },
        orderBy: { startedAt: 'desc' },
        select: { status: true },
      }),
      this.prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId: user.id },
        select: { badgeKey: true },
      }),
      this.prisma.dailyUsage.count({
        where: {
          userId: user.id,
          usageDate: { gte: weekStart },
          questionsAnswered: { gt: 0 },
        },
      }),
      this.prisma.dailyUsage.aggregate({
        where: { userId: user.id },
        _max: { questionsAnswered: true },
      }),
      this.prisma.topicMasterySnapshot.findMany({
        where: { userId: user.id, weekStart: { in: [weekStart, prevWeekStart] } },
        include: { topic: { select: { course: { select: { name: true } } } } },
      }),
    ]);

    // ── Deneme durumları ──
    const sessionOf = new Map(mySessions.map((s) => [s.examId!, s.status]));
    const endOf = (e: { startAt: Date; durationMinutes: number }) =>
      new Date(e.startAt.getTime() + e.durationMinutes * 60_000);

    const liveExam = exams.find((e) => e.startAt <= now && now < endOf(e));
    const todayUpcoming = exams.find(
      (e) => e.startAt > now && trDayKey(e.startAt) === trDayKey(now),
    );
    const newPublished = exams.find(
      (e) =>
        e.createdAt >= twoDaysAgo &&
        !sessionOf.has(e.id) &&
        e.id !== liveExam?.id &&
        e.id !== todayUpcoming?.id, // aynı deneme iki kartta görünmesin
    );

    // ── Sıradaki rozet: kazanılmamışlar içinde tamamlanmaya en yakın ──
    const earned = new Set(earnedBadges.map((b) => b.badgeKey));
    const totalSolved = stats?.totalSolved ?? 0;
    const accuracyPct =
      totalSolved > 0 ? Math.round(((stats?.totalCorrect ?? 0) / totalSolved) * 100) : 0;
    const progressOf = (kind: string): number => {
      switch (kind) {
        case 'streak':
          return streak?.currentStreak ?? 0;
        case 'solved':
          return totalSolved;
        case 'exam':
          return denemeAgg._count._all;
        case 'accuracy':
          return totalSolved >= 100 ? accuracyPct : 0; // min 100 soru şartı
        default:
          return 0;
      }
    };
    let nextBadge: CoachContext['nextBadge'] = null;
    let bestRatio = -1;
    for (const b of badgeCatalog) {
      if (earned.has(b.key)) continue;
      const p = progressOf(b.kind);
      // Eşiği geçmiş ama henüz verilmemiş rozet "sıradaki" DEĞİLDİR —
      // verme kancası (Faz 3) onu user_badges'e taşır; "az kaldı" demek yanlış.
      if (p >= b.threshold) continue;
      const ratio = p / b.threshold;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        nextBadge = { key: b.key, name: b.name, progress: p, target: b.threshold };
      }
    }

    // ── Haftalık ders trendi: iki haftanın kurs bazlı ortalama mastery farkı ──
    const byCourseWeek = new Map<string, { cur: number[]; prev: number[] }>();
    for (const s of snapshots) {
      const name = s.topic.course.name;
      const bucket = byCourseWeek.get(name) ?? { cur: [], prev: [] };
      (s.weekStart.getTime() === weekStart.getTime() ? bucket.cur : bucket.prev).push(
        Number(s.mastery),
      );
      byCourseWeek.set(name, bucket);
    }
    let courseTrend: CoachContext['courseTrend'] = null;
    for (const [courseName, w] of byCourseWeek) {
      if (w.cur.length === 0 || w.prev.length === 0) continue;
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      const prev = avg(w.prev);
      if (prev <= 0) continue;
      const deltaPct = Math.round(((avg(w.cur) - prev) / prev) * 100);
      if (!courseTrend || Math.abs(deltaPct) > Math.abs(courseTrend.deltaPct)) {
        courseTrend = { courseName, deltaPct };
      }
    }

    // ── Aktivite günleri (streak.lastActiveDate = @db.Date, UTC gün) ──
    const lastActive = streak?.lastActiveDate ?? null;
    const daysSince = lastActive
      ? Math.floor((todayUtc.getTime() - startOfUtcDay(lastActive).getTime()) / 86_400_000)
      : null;

    return {
      now,
      // Türkiye saati sabit UTC+3 (2016'dan beri DST yok).
      trHour: (now.getUTCHours() + 3) % 24,
      user: {
        id: user.id,
        displayName: profile?.displayName ?? null,
        dailyGoal: profile?.dailyGoal ?? 20,
        isPremium: user.isPremium,
        onboardingCompleted: profile?.onboardingCompletedAt != null,
        preferredModuleName: profile?.preferredModule?.name ?? null,
      },
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
        activeYesterday: daysSince === 1,
      },
      answeredToday: todayUsage?.questionsAnswered ?? 0,
      stats: {
        totalSolved,
        totalCorrect: stats?.totalCorrect ?? 0,
        totalSessions: stats?.totalSessions ?? 0,
      },
      unresolvedWrongCount,
      weakestTopic: weakest
        ? {
            topicId: weakest.topic.id,
            name: weakest.topic.name,
            mastery: Number(weakest.mastery),
          }
        : null,
      exams: {
        live: liveExam
          ? {
              id: liveExam.id,
              title: liveExam.title,
              endAt: endOf(liveExam),
              attempted: sessionOf.get(liveExam.id) === 'completed',
              inProgress: sessionOf.get(liveExam.id) === 'in_progress',
            }
          : null,
        todayUpcoming: todayUpcoming
          ? {
              id: todayUpcoming.id,
              title: todayUpcoming.title,
              startAt: todayUpcoming.startAt,
              questionCount: todayUpcoming._count.questions,
              durationMinutes: todayUpcoming.durationMinutes,
            }
          : null,
        newPublished: newPublished
          ? { id: newPublished.id, title: newPublished.title }
          : null,
        completedCount: denemeAgg._count._all,
        bestNet: denemeAgg._max.score != null ? Number(denemeAgg._max.score) : null,
      },
      dailyQuizPlayed: dailySession?.status === 'completed',
      nextBadge,
      weekly: { activeDays: weeklyActive, goalDays: WEEKLY_GOAL_DAYS },
      maxDailyQuestions: maxDaily._max.questionsAnswered ?? 0,
      courseTrend,
      daysSinceLastActivity: daysSince,
    };
  }
}

// ── Tarih yardımcıları (UTC gün konvansiyonu — dashboard ile aynı) ──

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Pazartesi başlangıçlı UTC hafta (snapshot konvansiyonu — Doc 19 §3.2). */
function startOfUtcWeek(d: Date): Date {
  const day = startOfUtcDay(d);
  const offset = (day.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  return new Date(day.getTime() - offset * 86_400_000);
}

/** Türkiye günü anahtarı (UTC+3 sabit) — "bugün başlayacak" karşılaştırması. */
function trDayKey(d: Date): string {
  return new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
}
