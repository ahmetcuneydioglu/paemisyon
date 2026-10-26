import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { NOTIFICATIONS_CONFIG, notificationsWorkerEnabled } from './notifications.config';

/**
 * Gece işleri (Doc 52 §11–12): 04.20 günlük özet, 04.25 saklama temizliği,
 * 04.30 90 gün görünmeyen cihazlar `stale`. Özet tablosu süresiz kalır.
 */
@Injectable()
export class RollupService {
  private readonly logger = new Logger(RollupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  @Cron('20 4 * * *', { timeZone: 'Europe/Istanbul' })
  async nightlyRollup() {
    if (!notificationsWorkerEnabled()) return;
    const n = await this.rollupDay(new Date(Date.now() - 86_400_000)).catch((e) => {
      this.logger.error(`Rollup: ${(e as Error).message}`);
      return -1;
    });
    if (n >= 0) this.logger.log(`Bildirim günlük özeti yazıldı: ${n} satır.`);
  }

  @Cron('25 4 * * *', { timeZone: 'Europe/Istanbul' })
  async nightlyPurge() {
    if (!notificationsWorkerEnabled()) return;
    const r = await this.purge().catch((e) => {
      this.logger.error(`Temizlik: ${(e as Error).message}`);
      return null;
    });
    if (r) this.logger.log(`Bildirim temizliği: ${JSON.stringify(r)}`);
  }

  async retention() {
    const raw = await this.settings.getString(SETTING_KEYS.notificationsRetention, '');
    let parsed: Partial<typeof NOTIFICATIONS_CONFIG.retentionDefault> = {};
    try {
      if (raw) parsed = JSON.parse(raw);
    } catch {
      /* bozuk JSON → varsayılan */
    }
    return { ...NOTIFICATIONS_CONFIG.retentionDefault, ...parsed };
  }

  /** TR takvim günü `day` için özet (idempotent: önce silinir). */
  async rollupDay(day: Date): Promise<number> {
    const dayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(day); // YYYY-MM-DD
    await this.prisma.$executeRaw`DELETE FROM notification_daily_stats WHERE day = ${dayStr}::date`;
    const n = await this.prisma.$executeRaw`
      INSERT INTO notification_daily_stats (day, campaign_id, automation_code, category, channel, platform, queued, sent, failed, suppressed, opened, clicked, converted)
      SELECT ${dayStr}::date,
             COALESCE(n.campaign_id, '00000000-0000-0000-0000-000000000000'::uuid),
             COALESCE(n.automation_code, ''),
             n.category, d.channel, COALESCE(p.platform, ''),
             count(*) FILTER (WHERE d.status = 'queued')::int,
             count(*) FILTER (WHERE d.status = 'sent')::int,
             count(*) FILTER (WHERE d.status = 'failed')::int,
             count(*) FILTER (WHERE d.status IN ('suppressed','expired'))::int,
             count(*) FILTER (WHERE d.status = 'sent' AND n.opened_at IS NOT NULL)::int,
             count(*) FILTER (WHERE d.status = 'sent' AND n.clicked_at IS NOT NULL)::int,
             count(*) FILTER (WHERE d.status = 'sent' AND n.converted_at IS NOT NULL)::int
      FROM notification_deliveries d
      JOIN notifications n ON n.id = d.notification_id
      LEFT JOIN push_tokens p ON d.channel = 'push' AND p.token = d.target
      WHERE (d.queued_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul')::date = ${dayStr}::date
      GROUP BY 2, 3, 4, 5, 6`;
    return n;
  }

  async purge() {
    const r = await this.retention();
    const cut = (days: number) => new Date(Date.now() - days * 86_400_000);
    const [events, deliveries, inbox, stale, inactive, appEvents] = await Promise.all([
      this.prisma.notificationEvent.deleteMany({ where: { occurredAt: { lt: cut(r.events) } } }),
      this.prisma.notificationDelivery.deleteMany({
        where: { queuedAt: { lt: cut(r.deliveries) } },
      }),
      this.prisma.notification.deleteMany({ where: { createdAt: { lt: cut(r.inbox) } } }),
      this.prisma.pushToken.updateMany({
        where: { isActive: true, lastSeenAt: { lt: cut(r.staleDevices) } },
        data: { isActive: false, disabledReason: 'stale' },
      }),
      this.prisma.pushToken.deleteMany({
        where: { isActive: false, updatedAt: { lt: cut(r.inactiveDevices) } },
      }),
      // Olay omurgası (F2): otomasyon izi ile birlikte (cascade) silinir.
      this.prisma.appEvent.deleteMany({ where: { occurredAt: { lt: cut(r.events) } } }),
    ]);
    return {
      appEvents: appEvents.count,
      events: events.count,
      deliveries: deliveries.count,
      inbox: inbox.count,
      staleDevices: stale.count,
      removedDevices: inactive.count,
    };
  }
}
