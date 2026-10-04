import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EmailCampaignsService } from './email-campaigns.service';
import { EmailEventsService } from './email-events.service';
import { EMAIL_CONFIG, emailWorkerEnabled } from './email.config';
import { SesService } from './ses.service';

type ClaimedSend = {
  id: string;
  email: string;
  contact_id: string;
  unsubscribe_token: string;
  display_name: string | null;
  contact_status: string;
};

/**
 * Gönderici işçi (02-tasarim.md §4). 30 saniyede bir: gönderimdeki kampanyalar
 * için kota/tavan/hız içinde parti alır (SKIP LOCKED), kişi durumunu son kez
 * okur, SES'e verir. `claimed` satır 10 dk'dan eskiyse otomatik yeniden
 * GÖNDERİLMEZ — belirsiz sayılır (aynı kişiye ikinci posta hiç gitmemesinden
 * daha kötüdür).
 */
@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: EmailCampaignsService,
    private readonly events: EmailEventsService,
    private readonly ses: SesService,
  ) {}

  @Cron('*/30 * * * * *')
  async cron() {
    if (!emailWorkerEnabled() || !this.ses.enabled) return;
    await this.tick();
  }

  @Cron('15 4 * * *', { timeZone: 'Europe/Istanbul' })
  async nightly() {
    if (!emailWorkerEnabled()) return;
    const n = await this.events.pruneOldEvents();
    if (n) this.logger.log(`Eski e-posta olayı silindi: ${n}`);
  }

  async tick(): Promise<{ sent: number; skipped: number; failed: number }> {
    if (this.running) return { sent: 0, skipped: 0, failed: 0 };
    this.running = true;
    const totals = { sent: 0, skipped: 0, failed: 0 };
    try {
      // Zamanı gelen planlı kampanyalar
      await this.prisma.emailCampaign.updateMany({
        where: { status: 'scheduled', scheduledAt: { lte: new Date() } },
        data: { status: 'test_sent' },
      });
      const due = await this.prisma.emailCampaign.findMany({
        where: { status: 'test_sent', scheduledAt: { lte: new Date() }, startedAt: null },
      });
      for (const c of due) {
        const n = await this.prisma.emailContact.count({
          where: this.campaigns.audienceWhere(c.topic, c.audience as never),
        });
        await this.campaigns
          .start(c.id, { expectedCount: n })
          .catch((e) => this.logger.error(`Planlı başlatma: ${c.name}: ${(e as Error).message}`));
      }

      const hour = Number(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Istanbul',
          hour: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
      if (hour < EMAIL_CONFIG.sendWindow.startHour || hour >= EMAIL_CONFIG.sendWindow.endHour)
        return totals;

      const account = await this.ses.account();
      if (!account.sendingEnabled) return totals;
      const accountRemaining = Math.floor(
        account.max24HourSend * EMAIL_CONFIG.accountQuotaStopRatio - account.sentLast24Hours,
      );
      if (accountRemaining <= 0) {
        this.logger.warn("SES 24 saat kotasının %80'i doldu; bu tick atlandı.");
        return totals;
      }

      const sending = await this.prisma.emailCampaign.findMany({
        where: { status: 'sending' },
        orderBy: { startedAt: 'asc' },
      });
      let budget = accountRemaining;
      for (const c of sending) {
        if (budget <= 0) break;
        if (await this.safetyTripped(c.id)) continue;
        const rate = Math.min(Number(c.sendRatePerSec), account.maxSendRate || 1);
        const sentToday = await this.campaigns.sentToday(c.id);
        const perTick = Math.min(
          EMAIL_CONFIG.maxPerTick,
          Math.max(1, Math.floor(rate * 25)),
          c.dailyCap - sentToday,
          budget,
        );
        if (perTick <= 0) continue;

        const claimed = await this.claim(c.id, perTick);
        if (claimed.length === 0) {
          await this.finishIfDone(c.id);
          continue;
        }
        const template = c.htmlSnapshot ?? this.campaigns.render(c);
        const gapMs = Math.ceil(1000 / rate);
        for (const s of claimed) {
          const started = Date.now();
          if (s.contact_status !== 'subscribed') {
            await this.prisma.emailSend.update({
              where: { id: s.id },
              data: { status: 'skipped', error: `kişi ${s.contact_status}` },
            });
            totals.skipped++;
            continue;
          }
          const { html, text } = this.campaigns.personalize(
            template,
            { unsubscribeToken: s.unsubscribe_token, displayName: s.display_name },
            c.id,
            s.id,
          );
          try {
            const r = await this.ses.send({
              fromName: c.fromName,
              fromEmail: c.fromEmail,
              to: s.email,
              replyTo: c.replyTo,
              subject: c.subject,
              html,
              text,
              configurationSet: EMAIL_CONFIG.configurationSets.duyuru,
              unsubscribe: {
                url: `${EMAIL_CONFIG.apiBaseUrl}/email/unsubscribe/${s.unsubscribe_token}?c=${c.id}`,
                mailto: `${EMAIL_CONFIG.defaultFrom.replyTo}?subject=abonelikten-cik`,
              },
              tags: { campaign: c.id },
            });
            await this.prisma.$transaction([
              this.prisma.emailSend.update({
                where: { id: s.id },
                data: {
                  status: 'sent',
                  sesMessageId: r.messageId,
                  sentAt: new Date(),
                  attempts: { increment: 1 },
                },
              }),
              this.prisma.emailContact.update({
                where: { id: s.contact_id },
                data: { lastSentAt: new Date() },
              }),
              this.prisma.emailCampaign.update({
                where: { id: c.id },
                data: { sentCount: { increment: 1 } },
              }),
            ]);
            totals.sent++;
            budget--;
          } catch (e) {
            const err = e as { name?: string; message?: string };
            const name = err.name ?? '';
            if (
              name === 'TooManyRequestsException' ||
              name === 'Throttling' ||
              name === 'ThrottlingException'
            ) {
              await this.prisma.emailSend.update({
                where: { id: s.id },
                data: { status: 'queued', claimedAt: null, attempts: { increment: 1 } },
              });
              this.logger.warn(`SES hız sınırı; ${c.name} bu tick'te durdu.`);
              break;
            }
            if (
              name === 'AccountSuspendedException' ||
              name === 'SendingPausedException' ||
              name === 'MailFromDomainNotVerifiedException'
            ) {
              await this.prisma.emailSend.update({
                where: { id: s.id },
                data: { status: 'queued', claimedAt: null },
              });
              await this.prisma.emailCampaign.update({
                where: { id: c.id },
                data: { status: 'paused', pausedReason: `SES: ${name}` },
              });
              this.logger.error(`Kampanya duraklatıldı (${name}): ${c.name}`);
              break;
            }
            await this.prisma.emailSend.update({
              where: { id: s.id },
              data: {
                status: 'failed',
                error: `${name}: ${err.message ?? ''}`.slice(0, 500),
                attempts: { increment: 1 },
              },
            });
            totals.failed++;
          }
          const wait = gapMs - (Date.now() - started);
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        }
        await this.finishIfDone(c.id);
      }
      return totals;
    } finally {
      this.running = false;
    }
  }

  /** Kuyruktan parti al (FOR UPDATE SKIP LOCKED) ve kişi bilgisini birlikte getir. */
  private claim(campaignId: string, n: number): Promise<ClaimedSend[]> {
    return this.prisma.$queryRaw<ClaimedSend[]>`
      with picked as (
        select id from email_sends
        where campaign_id = ${campaignId}::uuid and status = 'queued'
        order by created_at
        limit ${n}
        for update skip locked
      ), upd as (
        update email_sends s set status = 'claimed', claimed_at = now()
        from picked where s.id = picked.id
        returning s.id, s.email, s.contact_id
      )
      select upd.id, upd.email, upd.contact_id, c.unsubscribe_token, c.display_name, c.status::text as contact_status
      from upd join email_contacts c on c.id = upd.contact_id`;
  }

  private async finishIfDone(campaignId: string) {
    const open = await this.prisma.emailSend.count({
      where: { campaignId, status: { in: ['queued', 'claimed'] } },
    });
    if (open === 0) {
      await this.prisma.emailCampaign.updateMany({
        where: { id: campaignId, status: 'sending' },
        data: { status: 'completed', completedAt: new Date() },
      });
    }
  }

  /** Otomatik emniyet: son pencerede bounce/şikâyet eşiği aşıldıysa duraklat. */
  private async safetyTripped(campaignId: string): Promise<boolean> {
    const { window, minSample, bounceRate, complaintRate } = EMAIL_CONFIG.safety;
    const recent = await this.prisma.emailSend.findMany({
      where: { campaignId, status: { in: ['sent', 'delivered', 'bounced', 'complained'] } },
      orderBy: { sentAt: 'desc' },
      take: window,
      select: { status: true },
    });
    if (recent.length < minSample) return false;
    const bounced = recent.filter((r) => r.status === 'bounced').length / recent.length;
    const complained = recent.filter((r) => r.status === 'complained').length / recent.length;
    if (bounced >= bounceRate || complained >= complaintRate) {
      await this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'paused',
          pausedReason: `Otomatik emniyet: bounce %${(bounced * 100).toFixed(1)}, şikâyet ‰${(complained * 1000).toFixed(2)}`,
        },
      });
      this.logger.error(`Kampanya otomatik duraklatıldı: ${campaignId}`);
      return true;
    }
    return false;
  }
}
