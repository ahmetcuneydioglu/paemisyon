import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
