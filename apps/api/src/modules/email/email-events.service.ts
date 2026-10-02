import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EmailEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EMAIL_CONFIG } from './email.config';
import { SnsMessage, verifySnsMessage } from './sns-signature';

/** SES olay bildirimi (SNS üzerinden) — yalnız kullandığımız alanlar. */
type SesEvent = {
  eventType: string;
  mail: {
    messageId: string;
    timestamp: string;
    destination?: string[];
    tags?: Record<string, string[]>;
  };
  bounce?: {
    bounceType: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType?: string;
    timestamp?: string;
    bouncedRecipients?: { emailAddress: string; diagnosticCode?: string; status?: string }[];
  };
  complaint?: {
    complaintFeedbackType?: string;
    timestamp?: string;
    complainedRecipients?: { emailAddress: string }[];
  };
  delivery?: {
    timestamp?: string;
    smtpResponse?: string;
    processingTimeMillis?: number;
    recipients?: string[];
  };
  reject?: { reason?: string };
  deliveryDelay?: {
    delayType?: string;
    timestamp?: string;
    delayedRecipients?: { emailAddress: string; diagnosticCode?: string }[];
  };
  click?: { timestamp?: string; link?: string };
  failure?: { errorMessage?: string };
};

const TYPE_MAP: Record<string, EmailEventType> = {
  Send: 'send',
  Delivery: 'delivery',
  Bounce: 'bounce',
  Complaint: 'complaint',
  Reject: 'reject',
  DeliveryDelay: 'delivery_delay',
  Click: 'click',
  'Rendering Failure': 'rendering_failure',
};

@Injectable()
export class EmailEventsService {
  private readonly logger = new Logger(EmailEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** SNS gövdesi (metin ya da ayrıştırılmış nesne). Doğrulanmayan mesaj 403. */
  async handleSns(raw: unknown): Promise<{ handled: string }> {
    const msg = (typeof raw === 'string' ? JSON.parse(raw) : raw) as SnsMessage;
    if (!EMAIL_CONFIG.topicArn || msg?.TopicArn !== EMAIL_CONFIG.topicArn) {
      throw new ForbiddenException('Beklenmeyen SNS konusu.');
    }
    if (!(await verifySnsMessage(msg))) throw new ForbiddenException('SNS imzası doğrulanamadı.');

    if (msg.Type === 'SubscriptionConfirmation' && msg.SubscribeURL) {
      const u = new URL(msg.SubscribeURL);
      if (u.protocol !== 'https:' || !/^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(u.hostname)) {
        throw new ForbiddenException('SubscribeURL beklenen alanda değil.');
      }
      const res = await fetch(msg.SubscribeURL);
      this.logger.log(`SNS aboneliği onaylandı (${res.status}).`);
      return { handled: 'subscription_confirmed' };
    }
    if (msg.Type !== 'Notification') return { handled: 'ignored' };

    const event = JSON.parse(msg.Message) as SesEvent;
    return this.processEvent(event);
  }

  async processEvent(event: SesEvent): Promise<{ handled: string }> {
    const type = TYPE_MAP[event.eventType];
    if (!type) return { handled: 'unknown_type' };
    const messageId = event.mail?.messageId;
    if (!messageId) return { handled: 'no_message_id' };

    const occurredAt = new Date(
      event.bounce?.timestamp ??
        event.complaint?.timestamp ??
        event.delivery?.timestamp ??
        event.deliveryDelay?.timestamp ??
        event.click?.timestamp ??
        event.mail.timestamp,
    );
    const recipients =
      event.bounce?.bouncedRecipients?.map((r) => r.emailAddress) ??
      event.complaint?.complainedRecipients?.map((r) => r.emailAddress) ??
      event.deliveryDelay?.delayedRecipients?.map((r) => r.emailAddress) ??
      event.delivery?.recipients ??
      event.mail.destination ??
      [];
    const recipient = (recipients[0] ?? '').toLowerCase();
    const subtype =
      type === 'bounce'
        ? `${event.bounce?.bounceType}/${event.bounce?.bounceSubType ?? ''}`
        : type === 'complaint'
          ? (event.complaint?.complaintFeedbackType ?? null)
          : type === 'delivery_delay'
            ? (event.deliveryDelay?.delayType ?? null)
            : type === 'reject'
              ? (event.reject?.reason ?? null)
              : null;
    const payload: Prisma.InputJsonValue = {
      diagnostic:
        event.bounce?.bouncedRecipients?.[0]?.diagnosticCode ??
        event.deliveryDelay?.delayedRecipients?.[0]?.diagnosticCode ??
        null,
      smtp: event.delivery?.smtpResponse ?? null,
      link: event.click?.link ?? null,
      error: event.failure?.errorMessage ?? null,
      campaign: event.mail.tags?.campaign?.[0] ?? null,
    };

    const send = await this.prisma.emailSend.findUnique({ where: { sesMessageId: messageId } });

    try {
      await this.prisma.emailEvent.create({
        data: {
          sesMessageId: messageId,
          sendId: send?.id ?? null,
          type,
          subtype,
          recipient,
          payload,
          occurredAt,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
        return { handled: 'duplicate' };
      throw e;
    }

    await this.applyEffects(type, event, send, recipient, occurredAt);
    return { handled: type };
  }

  private async applyEffects(
    type: EmailEventType,
    event: SesEvent,
    send: { id: string; campaignId: string; contactId: string; status: string } | null,
    recipient: string,
    at: Date,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const contact = send
        ? await tx.emailContact.findUnique({ where: { id: send.contactId } })
        : recipient
          ? await tx.emailContact.findUnique({ where: { email: recipient } })
          : null;

      if (send) {
        const sendStatus =
          type === 'delivery'
            ? 'delivered'
            : type === 'bounce'
              ? 'bounced'
              : type === 'complaint'
                ? 'complained'
                : type === 'reject' || type === 'rendering_failure'
                  ? 'failed'
                  : type === 'send' && send.status === 'claimed'
                    ? 'sent'
                    : null;
        await tx.emailSend.update({
          where: { id: send.id },
          data: {
            lastEventAt: at,
            ...(sendStatus ? { status: sendStatus } : {}),
            ...(type === 'send' && send.status === 'claimed' ? { sentAt: at } : {}),
          },
        });
        const inc =
          type === 'delivery'
            ? { deliveredCount: { increment: 1 } }
            : type === 'bounce'
              ? { bouncedCount: { increment: 1 } }
              : type === 'complaint'
                ? { complainedCount: { increment: 1 } }
                : null;
        if (inc) await tx.emailCampaign.update({ where: { id: send.campaignId }, data: inc });
      }

      if (!contact) return;
      const base = { lastEventAt: at };
      if (type === 'complaint') {
        await tx.emailContact.update({
          where: { id: contact.id },
          data: { ...base, status: 'complained' },
        });
      } else if (type === 'bounce') {
        const permanent = event.bounce?.bounceType === 'Permanent';
        if (permanent) {
          // complained daha ağır bir durumdur; düşürülmez.
          const status = contact.status === 'complained' ? 'complained' : 'bounced';
          await tx.emailContact.update({ where: { id: contact.id }, data: { ...base, status } });
        } else {
          const n = contact.softBounceCount + 1;
          const suppress = n >= EMAIL_CONFIG.softBounceLimit && contact.status === 'subscribed';
          await tx.emailContact.update({
            where: { id: contact.id },
            data: { ...base, softBounceCount: n, ...(suppress ? { status: 'suppressed' } : {}) },
          });
        }
      } else if (type === 'delivery') {
        await tx.emailContact.update({
          where: { id: contact.id },
          data: { ...base, softBounceCount: 0 },
        });
      } else {
        await tx.emailContact.update({ where: { id: contact.id }, data: base });
      }
    });
  }

  /** Günlük bakım: eski ham olayları sil (kampanya sayaçları kalır). */
  async pruneOldEvents(): Promise<number> {
    const cutoff = new Date(Date.now() - EMAIL_CONFIG.eventRetentionDays * 86_400_000);
    const r = await this.prisma.emailEvent.deleteMany({ where: { receivedAt: { lt: cutoff } } });
    return r.count;
  }
}
