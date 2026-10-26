import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CampaignsService } from './campaigns.service';
import { DecisionService } from './decision.service';
import { EmailChannelService } from './email-channel.service';
import { NOTIFICATIONS_CONFIG, notificationsWorkerEnabled, workerId } from './notifications.config';
import { PushService } from './push.service';

type Claimed = {
  id: bigint;
  notification_id: string;
  user_id: string;
  channel: 'push' | 'email';
  target: string;
  attempts: number;
};

/**
 * Teslim işçisi (Doc 52 §3.2, §7): 30 saniyede bir — zamanı gelen kampanyaları
 * kitleye açar, kuyruğu SKIP LOCKED ile çeker, push'u FCM'e, e-postayı SES'e
 * verir, sonuçları yazar. Tek `running` kilidi (pooler dar); kilit süresi
 * dolan satırlar yeniden alınır. Retry: 1/5/30/60/120 dk, en çok 5; kalıcı
 * hata retry edilmez. Kill switch ve ortam kapısı her tick'te okunur.
 */
@Injectable()
export class DeliveryWorker {
  private readonly logger = new Logger(DeliveryWorker.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly email: EmailChannelService,
    private readonly campaigns: CampaignsService,
    private readonly decision: DecisionService,
  ) {}

  @Cron('*/30 * * * * *')
  async cron() {
    if (!notificationsWorkerEnabled()) return;
    await this.tick();
  }

  async tick(): Promise<{
    materialized: number;
    sent: number;
    failed: number;
    retried: number;
    expired: number;
  }> {
    const totals = { materialized: 0, sent: 0, failed: 0, retried: 0, expired: 0 };
    if (this.running) return totals;
    this.running = true;
    try {
      const gates = await this.decision.globalGates();
      if (gates.killSwitch) return totals;
      if (!gates.environmentOk) {
        this.logger.warn(
          'Ortam kapısı: notifications.environment ile NOTIFICATIONS_ENV eşleşmiyor; gönderim yok.',
        );
        return totals;
      }
      const now = new Date();
      // 1) Kampanyaları kitleye aç
      let budget = NOTIFICATIONS_CONFIG.materializePerTick;
      for (const c of await this.campaigns.dueCampaigns(now)) {
        if (budget <= 0) break;
        const n = await this.campaigns.materialize(c, budget).catch((e) => {
          this.logger.error(`Kampanya açılamadı ${c.id}: ${(e as Error).message}`);
          return 0;
        });
        budget -= n;
        totals.materialized += n;
      }
      // 2) Süresi dolanlar
      const exp = await this.prisma.$executeRaw`
        UPDATE notification_deliveries d SET status = 'expired', suppression_reason = 'ttl'
        FROM notifications n WHERE n.id = d.notification_id AND d.status = 'queued' AND n.expires_at IS NOT NULL AND n.expires_at < now()`;
      totals.expired = exp;
      // 3) Kuyruğu çek
      const claimed = await this.claim(NOTIFICATIONS_CONFIG.claimBatch);
      if (claimed.length) {
        const r = await this.deliver(claimed);
        totals.sent += r.sent;
        totals.failed += r.failed;
        totals.retried += r.retried;
      }
      await this.campaigns.settle();
      return totals;
    } catch (e) {
      this.logger.error(`Tick: ${(e as Error).message}`);
      return totals;
    } finally {
      this.running = false;
    }
  }

  private async claim(limit: number): Promise<Claimed[]> {
    const stale = new Date(Date.now() - NOTIFICATIONS_CONFIG.lockStaleMs);
    return this.prisma.$queryRaw<Claimed[]>`
      WITH picked AS (
        SELECT id FROM notification_deliveries
        WHERE (status = 'queued' AND next_attempt_at <= now())
           OR (status = 'sending' AND locked_at < ${stale})
        ORDER BY next_attempt_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE notification_deliveries d
      SET status = 'sending', locked_at = now(), locked_by = ${workerId()}
      FROM picked WHERE d.id = picked.id
      RETURNING d.id, d.notification_id, d.user_id, d.channel, d.target, d.attempts`;
  }

  private async deliver(rows: Claimed[]) {
    const ids = [...new Set(rows.map((r) => r.notification_id))];
    const notifications = new Map(
      (
        await this.prisma.notification.findMany({
          where: { id: { in: ids } },
          include: { user: { select: { email: true, displayName: true } } },
        })
      ).map((n) => [n.id, n]),
    );
    const out = { sent: 0, failed: 0, retried: 0 };
    const now = new Date();
    const results: {
      id: bigint;
      ok: boolean;
      messageId?: string;
      code?: string;
      permanent?: boolean;
    }[] = [];

    const pushRows = rows.filter(
      (r) => r.channel === 'push' && notifications.has(r.notification_id),
    );
    if (pushRows.length) {
      const res = await this.push.sendBatch(
        pushRows.map((r) => {
          const n = notifications.get(r.notification_id)!;
          const data = (n.data ?? {}) as Record<string, unknown>;
          return {
            token: r.target,
            title: n.title,
            body: n.body,
            imageUrl: n.imageUrl,
            route: n.route,
            webPath: n.webPath,
            data: {
              notificationId: n.id,
              category: n.category,
              ...(data.target ? { target: String(data.target) } : {}),
              ...(data.minAppVersion ? { minAppVersion: String(data.minAppVersion) } : {}),
            },
          };
        }),
      );
      res.forEach((r, i) => results.push({ id: pushRows[i].id, ...r }));
    }
    for (const r of rows.filter((x) => x.channel === 'email')) {
      const n = notifications.get(r.notification_id);
      if (!n) continue;
      const res = await this.email.send(n, n.user);
      results.push({ id: r.id, ...res });
    }
    for (const r of rows)
      if (!notifications.has(r.notification_id))
        results.push({ id: r.id, ok: false, code: 'notification_missing', permanent: true });

    for (const r of results) {
      const row = rows.find((x) => x.id === r.id)!;
      if (r.ok) {
        await this.prisma.notificationDelivery.update({
          where: { id: r.id },
          data: {
            status: 'sent',
            sentAt: now,
            providerMessageId: r.messageId ?? null,
            lockedAt: null,
            lockedBy: null,
            attempts: { increment: 1 },
          },
        });
        out.sent++;
        continue;
      }
      const attempts = row.attempts + 1;
      const retry = !r.permanent && attempts < NOTIFICATIONS_CONFIG.maxAttempts;
      if (retry) {
        const delay =
          NOTIFICATIONS_CONFIG.retryDelaysMin[
            Math.min(attempts - 1, NOTIFICATIONS_CONFIG.retryDelaysMin.length - 1)
          ];
        await this.prisma.notificationDelivery.update({
          where: { id: r.id },
          data: {
            status: 'queued',
            attempts,
            nextAttemptAt: new Date(now.getTime() + delay * 60_000),
            errorCode: r.code ?? null,
            lockedAt: null,
            lockedBy: null,
          },
        });
        out.retried++;
      } else {
        const suppressed = r.code === 'no_consent' || r.code === 'channel_policy';
        await this.prisma.notificationDelivery.update({
          where: { id: r.id },
          data: {
            status: suppressed ? 'suppressed' : 'failed',
            suppressionReason: suppressed ? r.code : null,
            attempts,
            failedAt: now,
            errorCode: r.code ?? null,
            errorMessage: r.code ?? null,
            lockedAt: null,
            lockedBy: null,
          },
        });
        out.failed++;
      }
    }
    // Kutu satırının özet durumu
    for (const id of ids) {
      const agg = await this.prisma.notificationDelivery.groupBy({
        by: ['status'],
        where: {
          notificationId: id,
          channel: { in: ['push', 'email'] },
          NOT: { target: { startsWith: '—' } },
        },
        _count: { _all: true },
      });
      const has = (s: string) => agg.some((a) => a.status === s && a._count._all > 0);
      const status: Prisma.NotificationUpdateInput['deliveryStatus'] = has('sent')
        ? 'sent'
        : has('queued') || has('sending')
          ? 'queued'
          : has('failed')
            ? 'failed'
            : has('expired')
              ? 'expired'
              : 'suppressed';
      await this.prisma.notification.update({ where: { id }, data: { deliveryStatus: status } });
    }
    return out;
  }
}
