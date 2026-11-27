import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';

export interface EarnedBadge {
  key: string;
  name: string;
  description: string;
}

/** accuracy rozetleri bu eşiğin altındaki toplam çözümde değerlendirilmez —
 *  5 soruda %80 "Keskin Nişancı" yapmaz. */
const ACCURACY_MIN_SOLVED = 100;

const DUEL_BADGE_KINDS = new Set<string>(['duel_wins', 'duel_streak', 'room_wins', 'duel_weekly']);

/**
 * Rozet verme (Doc 19 §3.2). Kural deterministik: kind + threshold.
 * completeSession sonunda çağrılır (stats/streak tazeyken); idempotenttir
 * (createMany skipDuplicates) — yarışta çift rozet oluşmaz.
 */
@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly settings?: SettingsService,
  ) {}

  /**
   * Düello (Doc 59) herkese açılana kadar düello rozetleri vitrinde yalnız KAZANANA görünür:
   * özelliği göremeyen adaya kazanamayacağı kilitli rozet gösterilmez.
   */
  private async duelBadgesVisible(): Promise<boolean> {
    return this.settings ? this.settings.getBool(SETTING_KEYS.duelEnabled, false) : true;
  }

  /**
   * Profil vitrini: kazanılan ve kilitli rozetleri katalog sırasıyla döndürür. Kilitli rozette
   * `progress`/`threshold` kuralın kendi ölçüsüdür (13 Kas 2026): "Sıradaki rozet" kartı rozetin
   * kendi ilerlemesini gösterir (19/30 gün), kazanılmış rozet oranını değil.
   */
  async listForUser(userId: string) {
    const [catalog, earnedRows, progressOf] = await Promise.all([
      this.prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeKey: true, earnedAt: true },
      }),
      this.progressReader(userId),
    ]);
    const earnedAt = new Map(earnedRows.map((row) => [row.badgeKey, row.earnedAt]));
    const duelAcik = await this.duelBadgesVisible();
    const gorunen = catalog.filter(
      (b) => duelAcik || earnedAt.has(b.key) || !DUEL_BADGE_KINDS.has(b.kind),
    );
    return {
      earnedCount: earnedRows.length,
      totalCount: gorunen.length,
      items: gorunen.map((badge) => {
        const earned = earnedAt.has(badge.key);
        return {
          key: badge.key,
          name: badge.name,
          description: badge.description,
          earned,
          earnedAt: earnedAt.get(badge.key)?.toISOString() ?? null,
          threshold: badge.threshold,
          progress: earned ? badge.threshold : Math.min(badge.threshold, progressOf(badge.kind)),
        };
      }),
    };
  }

  /** Hak edilmiş ama verilmemiş rozetleri verir; YENİ verilenleri döner. */
  async checkAndAward(userId: string): Promise<EarnedBadge[]> {
    const [catalog, earnedRows, progressOf] = await Promise.all([
      this.prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeKey: true },
      }),
      this.progressReader(userId),
    ]);
    const earned = new Set(earnedRows.map((r) => r.badgeKey));

    const newlyEarned = catalog.filter(
      (b) => !earned.has(b.key) && progressOf(b.kind) >= b.threshold,
    );
    if (newlyEarned.length === 0) return [];

    await this.prisma.userBadge.createMany({
      data: newlyEarned.map((b) => ({ userId, badgeKey: b.key })),
      skipDuplicates: true, // eşzamanlı iki complete yarışında güvenli
    });
    this.logger.log(`Rozet verildi: user=${userId} → ${newlyEarned.map((b) => b.key).join(', ')}`);
    return newlyEarned.map((b) => ({
      key: b.key,
      name: b.name,
      description: b.description,
    }));
  }

  /** Kural ölçüleri (tek kaynak): rozet verme ve vitrin aynı ölçüyü kullanır. */
  private async progressReader(userId: string): Promise<(kind: string) => number> {
    const [stats, streak, duel, examCount] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.duelStats.findUnique({
        where: { userId },
        select: { wins: true, bestStreak: true, roomWins: true },
      }),
      this.prisma.quizSession.count({
        where: { userId, mode: 'deneme', status: 'completed' },
      }),
    ]);
    const totalSolved = stats?.totalSolved ?? 0;
    const accuracyPct =
      totalSolved > 0 ? Math.round(((stats?.totalCorrect ?? 0) / totalSolved) * 100) : 0;
    return (kind: string): number => {
      switch (kind) {
        case 'streak':
          // Rekor üzerinden: 7 gün seriyi bir kez yapan rozeti hak etmiştir;
          // seri sonradan bozulunca rozet geri alınmaz.
          return streak?.longestStreak ?? 0;
        case 'solved':
          return totalSolved;
        case 'exam':
          return examCount;
        case 'accuracy':
          return totalSolved >= ACCURACY_MIN_SOLVED ? accuracyPct : 0;
        // Düello (Doc 59): ölçü tamamlanmış maç kayıtlarından (duel_stats).
        case 'duel_wins':
          return duel?.wins ?? 0;
        case 'duel_streak':
          return duel?.bestStreak ?? 0;
        case 'room_wins':
          return duel?.roomWins ?? 0;
        // 'duel_weekly' kuralla verilmez: haftalık görev (DuelSweeperService) yazar.
        default:
          return 0;
      }
    };
  }
}
