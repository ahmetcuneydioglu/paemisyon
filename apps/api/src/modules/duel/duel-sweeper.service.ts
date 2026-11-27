import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { GUN_MS, haftaBaslangici } from '../../common/gun';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { DUEL_RULES } from './duel.config';
import { DuelEngineService } from './duel-engine.service';

/**
 * Süpürücü (Doc 59): maçlar istek geldikçe tembel ilerler; HİÇ istek gelmezse (iki oyuncu da
 * koptu, uygulamalar kapandı) maç burada kapanır. Açıkta süresiz maç, lobi, davet, kuyruk kalmaz.
 *
 * Yalnız canlı sunucuda çalışır (ScheduleModule orada kayıtlı — common/zamanlayici.ts).
 * Her tur tek hafif sorgu + geride kalmış en çok 25 maç; havuz bağlantı limitini zorlamaz.
 */
@Injectable()
export class DuelSweeperService {
  private readonly logger = new Logger(DuelSweeperService.name);
  private calisiyor = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: DuelEngineService,
  ) {}

  @Cron('*/15 * * * * *')
  async tick(): Promise<void> {
    if (this.calisiyor) return;
    this.calisiyor = true;
    try {
      await this.sweep(new Date());
    } catch (err) {
      this.logger.warn(`Düello süpürücü: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.calisiyor = false;
    }
  }

  /** Pazartesi 04.10 (TR): biten haftanın 1'e 1 liderine modül başına "Haftanın Lideri" rozeti. */
  @Cron('10 4 * * 1', { timeZone: 'Europe/Istanbul' })
  async weeklyTick(): Promise<void> {
    try {
      const n = await this.awardWeeklyLeaders(new Date());
      if (n > 0) this.logger.log(`Haftanın Lideri rozeti: ${n} kullanıcı.`);
    } catch (err) {
      this.logger.warn(`Haftanın Lideri: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Biten haftada (Pzt 04.00 – Pzt 04.00) her modülde en çok galibiyeti olan oyuncu; eşitlikte net
   * lig puanı, sonra az maç. En az üç maç oynamış olmalı. Rozet anahtarı tekil: yeniden
   * çalıştırmak ya da ikinci kez lider olmak yeni satır yazmaz.
   */
  async awardWeeklyLeaders(now: Date): Promise<number> {
    const bitis = haftaBaslangici(now);
    const baslangic = new Date(bitis.getTime() - 7 * GUN_MS);
    const liderler = await this.prisma.$queryRaw<{ user_id: string }[]>(Prisma.sql`
      SELECT DISTINCT ON (t.module_id) t.user_id
      FROM (
        SELECT m.module_id, p.user_id,
               COUNT(*) FILTER (WHERE p.outcome = 'win') AS wins,
               COALESCE(SUM(p.rating_delta), 0) AS points,
               COUNT(*) AS played
        FROM duel_participants p
        JOIN duel_matches m ON m.id = p.match_id AND m.kind = 'duel' AND m.phase = 'finished'
             AND m.finished_at >= ${baslangic} AND m.finished_at < ${bitis}
        JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
        WHERE p.kicked_at IS NULL
        GROUP BY m.module_id, p.user_id
        HAVING COUNT(*) >= 3 AND COUNT(*) FILTER (WHERE p.outcome = 'win') > 0
      ) t
      ORDER BY t.module_id, t.wins DESC, t.points DESC, t.played ASC, t.user_id`);
    if (liderler.length === 0) return 0;
    const r = await this.prisma.userBadge.createMany({
      data: liderler.map((l) => ({ userId: l.user_id, badgeKey: 'duel_weekly' })),
      skipDuplicates: true,
    });
    return r.count;
  }

  async sweep(now: Date): Promise<{ advanced: number; lobbies: number }> {
    // 1) Süresi geçmiş fazda bekleyen maçlar: durum okumak maçı sunucu saatine taşır.
    const geride = await this.prisma.duelMatch.findMany({
      where: {
        phase: { in: ['countdown', 'question', 'reveal'] },
        phaseEndsAt: { lt: new Date(now.getTime() - 3_000) },
      },
      select: { id: true },
      orderBy: { phaseEndsAt: 'asc' },
      take: 25,
    });
    for (const m of geride) {
      await this.engine.withMatch(m.id, async (_tx, match) => ({ match, result: null }), now);
    }

    // 2) Başlamayan eski lobiler.
    const lobiler = await this.prisma.duelMatch.findMany({
      where: { phase: 'lobby', createdAt: { lt: new Date(now.getTime() - DUEL_RULES.lobbyTtlMs) } },
      select: { id: true },
      take: 25,
    });
    for (const m of lobiler) {
      await this.engine.withMatch(
        m.id,
        async (tx, match, at) =>
          match.phase === 'lobby'
            ? { match: await this.engine.cancel(tx, match, at), result: null }
            : { match, result: null },
        now,
      );
    }

    // 3) Davet ve kuyruk artıkları.
    await this.prisma.duelInvitation.updateMany({
      where: { status: 'pending', expiresAt: { lte: now } },
      data: { status: 'expired' },
    });
    await this.prisma.duelQueue.deleteMany({ where: { expiresAt: { lt: now } } });

    return { advanced: geride.length, lobbies: lobiler.length };
  }
}
