import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface EarnedBadge {
  key: string;
  name: string;
  description: string;
}

/** accuracy rozetleri bu eşiğin altındaki toplam çözümde değerlendirilmez —
 *  5 soruda %80 "Keskin Nişancı" yapmaz. */
const ACCURACY_MIN_SOLVED = 100;

/**
 * Rozet verme (Doc 19 §3.2). Kural deterministik: kind + threshold.
 * completeSession sonunda çağrılır (stats/streak tazeyken); idempotenttir
 * (createMany skipDuplicates) — yarışta çift rozet oluşmaz.
 */
@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return {
      earnedCount: earnedRows.length,
      totalCount: catalog.length,
      items: catalog.map((badge) => {
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
    const [stats, streak, examCount] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
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
        default:
          return 0;
      }
    };
  }
}
