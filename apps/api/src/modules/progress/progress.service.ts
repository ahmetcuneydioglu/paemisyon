import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { computeStreakUpdate, liveStreak, weeklyFreezeAllowance } from './streak.logic';
import { GUN_KAYMASI_MS, gunAnahtari, gunBaslangici, haftaBaslangici } from '../../common/gun';
import { computeRank, rankScore, ACTIVE_DAY_POINTS } from '../coach/rank.logic';
import { tallyByUnit, type UnitTally } from '../summaries/unite-eslesme';

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

export type SessionForProgress = {
  topicId: string | null;
  correctCount: number;
  wrongCount: number;
  answers: { questionId: string; isCorrect: boolean | null; selectedOptionId: string | null }[];
};

/// İlerleme kaydı ve okuması (Doc 6 §4.4, Doc 7 §4.5).
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Quiz tamamlanınca çağrılır: stats + konu ilerlemesi + streak + yanlışlar güncellenir. */
  async recordSessionCompletion(userId: string, session: SessionForProgress) {
    await this.recordSessionProgress(userId, session, { countSession: true, activity: true });
  }

  /**
   * Tur kapanınca ilerleme yazımı — TEK çekirdek (Doc 48 B-3).
   *  - Tamamlama: tur sayılır (totalSessions), aktiflik güvencesi yazılır.
   *  - Terk (tek aktif tur / bayat tur): çözülen cevaplar EMEK olarak yazılır
   *    (istatistik, konu ilerlemesi, yanlış listesi) ama tur sayısına girmez;
   *    aktiflik YAZILMAZ — o gün zaten cevap anında yazıldı, bugün kapatılan
   *    eski tur bugünü "aktif" gösteremez.
   */
  async recordSessionProgress(
    userId: string,
    session: SessionForProgress,
    opts: { countSession: boolean; activity: boolean },
  ) {
    const solved = session.correctCount + session.wrongCount; // boş hariç
    // Uygulama günü (TR 04.00 — Doc 48 D2): seri, sayaçla aynı günü okur.
    const today = gunAnahtari();

    // PERFORMANS: eskiden konu başına 2 + cevap başına 1 ardışık sorgu vardı;
    // 100 soruluk bir denemede transaction ~35+ gidiş-dönüşe (Supabase pooler,
    // ~60ms/RT) şişiyor ve "testi bitir" saniyelerce sürüyordu. Döngüler artık
    // unnest'li TEK toplu upsert; okumalar tx dışında (havuz bağlantısı kısa
    // kalır — connection_limit=4 için kritik).
    const answered = session.answers.filter(
      (a) => a.isCorrect != null && a.selectedOptionId != null,
    );
    const byTopic = new Map<string, { solved: number; correct: number }>();
    // Ünite hâkimiyeti (Doc 53 F5): ünite etikettir — konu + madde aralığı. Konu sayımıyla aynı
    // cevaplardan, aynı işlemde birikir; yayında ünitesi olmayan konularda sessiz.
    let byUnit = new Map<string, UnitTally>();
    if (answered.length > 0) {
      const sorular = await this.prisma.question.findMany({
        where: { id: { in: answered.map((a) => a.questionId) } },
        select: { id: true, topicId: true, articleNo: true },
      });
      const soruOf = new Map(sorular.map((q) => [q.id, q]));
      for (const a of answered) {
        const topicId = soruOf.get(a.questionId)?.topicId;
        if (!topicId) continue;
        const b = byTopic.get(topicId) ?? { solved: 0, correct: 0 };
        b.solved += 1;
        if (a.isCorrect === true) b.correct += 1;
        byTopic.set(topicId, b);
      }
      const uniteler = await this.prisma.summaryUnit.findMany({
        where: { topicId: { in: [...byTopic.keys()] }, status: 'published', deletedAt: null },
        select: { id: true, topicId: true, articleFrom: true, articleTo: true },
      });
      byUnit = tallyByUnit(
        answered
          .map((a) => {
            const q = soruOf.get(a.questionId);
            return q
              ? { topicId: q.topicId, articleNo: q.articleNo, isCorrect: a.isCorrect === true }
              : null;
          })
          .filter((x): x is NonNullable<typeof x> => x != null),
        uniteler,
      );
    }
    const wrongIds = session.answers
      .filter((a) => a.isCorrect === false && a.selectedOptionId != null)
      .map((a) => a.questionId);
    const correctIds = session.answers.filter((a) => a.isCorrect === true).map((a) => a.questionId);

    await this.prisma.$transaction(async (tx) => {
      await tx.userStats.upsert({
        where: { userId },
        update: {
          totalSolved: { increment: solved },
          totalCorrect: { increment: session.correctCount },
          ...(opts.countSession ? { totalSessions: { increment: 1 } } : {}),
        },
        create: {
          userId,
          totalSolved: solved,
          totalCorrect: session.correctCount,
          totalSessions: opts.countSession ? 1 : 0,
        },
      });

      // Konu ilerlemesi CEVAP bazında yazılır (karışık ders/koç turları da
      // mastery biriktirir). Tüm konular tek toplu upsert'te; mastery her iki
      // dalda da (insert/update) TOPLAM üzerinden hesaplanır — eski satır-satır
      // upsert ile birebir aynı sonuç.
      if (byTopic.size > 0) {
        const topicIds = [...byTopic.keys()];
        const solvedArr = topicIds.map((t) => byTopic.get(t)!.solved);
        const correctArr = topicIds.map((t) => byTopic.get(t)!.correct);
        await tx.$executeRaw`
          INSERT INTO user_topic_progress
            (user_id, topic_id, solved_count, correct_count, mastery, last_activity_at)
          SELECT ${userId}::uuid, u.t, u.s, u.c,
                 CASE WHEN u.s > 0 THEN u.c::decimal / u.s ELSE 0 END, now()
          FROM unnest(${topicIds}::uuid[], ${solvedArr}::int[], ${correctArr}::int[])
            AS u(t, s, c)
          ON CONFLICT (user_id, topic_id) DO UPDATE SET
            solved_count = user_topic_progress.solved_count + EXCLUDED.solved_count,
            correct_count = user_topic_progress.correct_count + EXCLUDED.correct_count,
            mastery = CASE
              WHEN user_topic_progress.solved_count + EXCLUDED.solved_count > 0
              THEN (user_topic_progress.correct_count + EXCLUDED.correct_count)::decimal
                   / (user_topic_progress.solved_count + EXCLUDED.solved_count)
              ELSE 0 END,
            last_activity_at = now()`;
      }

      // Ünite hâkimiyeti — konu upsert'iyle birebir aynı biçim (Doc 53 F5).
      if (byUnit.size > 0) {
        const unitIds = [...byUnit.keys()];
        const uSolved = unitIds.map((u) => byUnit.get(u)!.solved);
        const uCorrect = unitIds.map((u) => byUnit.get(u)!.correct);
        await tx.$executeRaw`
          INSERT INTO user_unit_progress
            (user_id, unit_id, solved_count, correct_count, mastery, last_activity_at)
          SELECT ${userId}::uuid, u.t, u.s, u.c,
                 CASE WHEN u.s > 0 THEN u.c::decimal / u.s ELSE 0 END, now()
          FROM unnest(${unitIds}::uuid[], ${uSolved}::int[], ${uCorrect}::int[])
            AS u(t, s, c)
          ON CONFLICT (user_id, unit_id) DO UPDATE SET
            solved_count = user_unit_progress.solved_count + EXCLUDED.solved_count,
            correct_count = user_unit_progress.correct_count + EXCLUDED.correct_count,
            mastery = CASE
              WHEN user_unit_progress.solved_count + EXCLUDED.solved_count > 0
              THEN (user_unit_progress.correct_count + EXCLUDED.correct_count)::decimal
                   / (user_unit_progress.solved_count + EXCLUDED.solved_count)
              ELSE 0 END,
            last_activity_at = now()`;
      }

      // Aktiflik asıl olarak CEVAP ANINDA yazılır (touchActivity — Doc 48 D3);
      // burada yalnız güvence: aynı gün etkisiz. Cevapsız bitirilen tur aktiflik
      // DEĞİLDİR (önceden boş tur da seriyi sayıyordu).
      if (opts.activity && session.answers.length > 0) {
        const entitlement = await tx.entitlement.findUnique({ where: { userId } });
        const isPremium =
          entitlement?.isPremium === true &&
          (entitlement.validUntil == null || entitlement.validUntil > new Date());
        await this.seriyiGuncelle(tx, userId, isPremium, today);
      }

      // Yanlışlarım / çözüldü — cevap başına döngü yerine 2 toplu sorgu.
      if (wrongIds.length > 0) {
        await tx.$executeRaw`
          INSERT INTO wrong_answers (user_id, question_id)
          SELECT ${userId}::uuid, u.q FROM unnest(${wrongIds}::uuid[]) AS u(q)
          ON CONFLICT (user_id, question_id) DO UPDATE SET
            wrong_count = wrong_answers.wrong_count + 1,
            last_wrong_at = now(),
            resolved_at = NULL`;
      }
      if (correctIds.length > 0) {
        await tx.wrongAnswer.updateMany({
          where: { userId, questionId: { in: correctIds }, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
      }
    });
  }

  /**
   * Aktiflik (Doc 48 D3): günün İLK sayılan cevabında çağrılır — seri ve "son
   * aktif gün" cevap anında yazılır. Önceden yalnız tur tamamlanınca yazılıyordu;
   * turu yarıda bırakan aday (turların çoğu!) pasif sayılıp "Hoş geldin" kartı
   * görüyordu. Aynı gün ikinci çağrı etkisizdir.
   */
  async touchActivity(
    userId: string,
    isPremium: boolean,
    day: Date = gunAnahtari(),
  ): Promise<void> {
    await this.seriyiGuncelle(this.prisma, userId, isPremium, day);
  }

  /** Seri + seri sigortası (Doc 24 §7.2; saf mantık streak.logic.ts) — tek çekirdek. */
  private async seriyiGuncelle(
    db: Pick<Prisma.TransactionClient, 'streak'>,
    userId: string,
    isPremium: boolean,
    day: Date,
  ): Promise<void> {
    const streak = await db.streak.findUnique({ where: { userId } });
    if (streak?.lastActiveDate && streak.lastActiveDate.getTime() === day.getTime()) return;
    const update = computeStreakUpdate(streak, day, weeklyFreezeAllowance(isPremium));
    const data = {
      currentStreak: update.currentStreak,
      longestStreak: update.longestStreak,
      lastActiveDate: day,
      freezeWeekStart: update.freezeWeekStart,
      freezesUsed: update.freezesUsed,
    };
    await db.streak.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  }

  /**
   * Dönemin başlangıç ANI; 'all' için alt sınır yoktur (null). Uygulama günü
   * TR 04.00'te döner (Doc 48 D2): gece nöbetindeki tur o günün liderliğine yazılır.
   */
  private leaderboardFrom(period: LeaderboardPeriod): Date | null {
    if (period === 'all') return null;
    if (period === 'today') return gunBaslangici();
    if (period === 'week') return haftaBaslangici();
    // Ay: ayın ilk uygulama gününün başı (1'i TR 04.00).
    const ayBasi = gunAnahtari();
    ayBasi.setUTCDate(1);
    return new Date(ayBasi.getTime() + GUN_KAYMASI_MS);
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
        where: { userId: { in: ids }, totalAnswered: { gt: 0 } },
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
  /**
   * Sıralamaya giren oturumlar (Doc 36, 7 Eyl 2026 kararı).
   *
   * Arşivden çözülen sınav puana yazılır — 100 soru çözmek gerçek emektir.
   * Ama SINIRSIZ TEKRAR hakkı var ve cevapları ezberleyen biri aynı seti
   * defalarca çözüp puan çiftçiliği yapabilirdi. Bu yüzden arşiv oturumları
   * kullanıcı+sınav başına yalnız EN İYİ sonucuyla sayılır; arşiv dışı
   * oturumların hepsi sayılmaya devam eder.
   */
  private puanlananOturumlar(fromClause: Prisma.Sql) {
    return Prisma.sql`
      SELECT qs.user_id, qs.correct_count, qs.completed_at
      FROM quiz_sessions qs
      WHERE qs.status = 'completed' AND qs.archive_exam_id IS NULL ${fromClause}
      UNION ALL
      SELECT user_id, correct_count, completed_at FROM (
        SELECT qs.user_id, qs.correct_count, qs.completed_at,
               ROW_NUMBER() OVER (
                 PARTITION BY qs.user_id, qs.archive_exam_id
                 ORDER BY qs.correct_count DESC, qs.completed_at ASC
               ) AS sira
        FROM quiz_sessions qs
        WHERE qs.status = 'completed' AND qs.archive_exam_id IS NOT NULL ${fromClause}
      ) arsiv WHERE arsiv.sira = 1`;
  }

  async getLeaderboard(userId: string, period: LeaderboardPeriod) {
    const from = this.leaderboardFrom(period);
    const fromClause = from ? Prisma.sql`AND qs.started_at >= ${from}` : Prisma.empty;
    const puanlanan = this.puanlananOturumlar(fromClause);

    const [topRows, mineRow, stats] = await Promise.all([
      this.prisma.$queryRaw<{ user_id: string; points: number }[]>(Prisma.sql`
        WITH puanlanan AS (${puanlanan})
        SELECT p.user_id, SUM(p.correct_count)::int AS points
        FROM puanlanan p
        JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
        GROUP BY p.user_id
        HAVING SUM(p.correct_count) > 0
        ORDER BY points DESC, MAX(p.completed_at) ASC
        LIMIT 50`),
      this.prisma.$queryRaw<{ points: number }[]>(Prisma.sql`
        WITH puanlanan AS (${puanlanan})
        SELECT COALESCE(SUM(p.correct_count), 0)::int AS points
        FROM puanlanan p WHERE p.user_id = ${userId}::uuid`),
      this.leaderboardStats(),
    ]);

    const myPoints = mineRow[0]?.points ?? 0;
    const inTop = topRows.some((r) => r.user_id === userId);

    let myRank: number | null = null;
    if (myPoints > 0 && !inTop) {
      const rankRow = await this.prisma.$queryRaw<{ rank: number }[]>(Prisma.sql`
        WITH puanlanan AS (${puanlanan})
        SELECT COUNT(*)::int + 1 AS rank FROM (
          SELECT p.user_id
          FROM puanlanan p
          JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
          GROUP BY p.user_id
          HAVING SUM(p.correct_count) > ${myPoints}
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
    const dayStart = gunBaslangici();
    const [totalUsers, todayQuizCount, solvedAgg, activeDayRows, todayLeader] = await Promise.all([
      this.prisma.userStats.count({ where: { totalSessions: { gt: 0 } } }),
      this.prisma.quizSession.count({
        where: { status: 'completed', startedAt: { gte: dayStart } },
      }),
      this.prisma.userStats.aggregate({ _sum: { totalSolved: true } }),
      this.prisma.dailyUsage.count({ where: { totalAnswered: { gt: 0 } } }),
      this.prisma.$queryRaw<{ display_name: string; points: number }[]>(Prisma.sql`
        WITH puanlanan AS (${this.puanlananOturumlar(Prisma.sql`AND qs.started_at >= ${dayStart}`)})
        SELECT u.display_name, SUM(p.correct_count)::int AS points
        FROM puanlanan p
        JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
        GROUP BY u.display_name
        HAVING SUM(p.correct_count) > 0
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

  async getSummary(userId: string, isPremium: boolean) {
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
      currentStreak: liveStreak(streak, gunAnahtari(), weeklyFreezeAllowance(isPremium)),
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
    const today = gunAnahtari(); // uygulama günü (TR 04.00 — Doc 48 D2)
    const from = new Date(today.getTime() - (days - 1) * 86_400_000);
    const rows = await this.prisma.dailyUsage.findMany({
      where: { userId, usageDate: { gte: from } },
      select: { usageDate: true, totalAnswered: true },
    });
    // Şerit günün TÜM cevaplarını gösterir (deneme dahil — Doc 48 A9); yanıt
    // alanının adı istemci uyumu için aynı kalır.
    const byDay = new Map(
      rows.map((r) => [r.usageDate.toISOString().slice(0, 10), r.totalAnswered]),
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
        /** Seçili mevzuat turu (1 Eki 2026): geçmişte "N mevzuat" etiketi için. */
        topicIds: true,
        totalQuestions: true,
        correctCount: true,
        score: true,
        completedAt: true,
      },
    });
  }
}
