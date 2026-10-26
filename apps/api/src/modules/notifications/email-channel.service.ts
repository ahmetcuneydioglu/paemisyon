import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Notification } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EMAIL_CONFIG } from '../email/email.config';
import { EmailContactsService } from '../email/email-contacts.service';
import { fillRecipient, htmlToText, renderCampaignHtml } from '../email/email-render';
import { SesService } from '../email/ses.service';
import { CATEGORY_POLICY } from './notification.categories';
import { notificationsProvider } from './notifications.config';
import { firstName } from './template';

/**
 * E-posta kanalı (Doc 52 karar 2): motorun bildirimi mevcut SES göndericisiyle
 * gider. Rıza mevcut EmailContact/EmailTopicPreference'ta kalır (marketing →
 * kampanya, diğerleri → duyuru). Hizmet e-postaları `islem`, pazarlama `duyuru`
 * yapılandırma setiyle gönderilir. Kullanıcının kişisi yoksa açılır (live_user).
 */
@Injectable()
export class EmailChannelService {
  private readonly logger = new Logger(EmailChannelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: SesService,
    private readonly contacts: EmailContactsService,
  ) {}

  get enabled(): boolean {
    return this.ses.enabled || notificationsProvider() === 'console';
  }

  /** Kullanıcının kişisi (yoksa açılır); abone değilse null. */
  async consentedContact(userId: string, email: string, displayName: string) {
    let c = await this.prisma.emailContact.findFirst({
      where: { userId },
      include: { preferences: true },
    });
    if (!c) {
      c = await this.prisma.emailContact.upsert({
        where: { email: email.toLowerCase() },
        update: { userId },
        create: {
          email: email.toLowerCase(),
          userId,
          displayName,
          source: 'live_user',
          consentAt: new Date(),
          consentSource: 'signup',
          unsubscribeToken: randomBytes(32).toString('base64url'),
        },
        include: { preferences: true },
      });
    }
    return c.status === 'subscribed' ? c : null;
  }

  /** Dönüş: {ok, messageId} ya da {ok:false, code, permanent}. */
  async send(
    n: Notification,
    user: { email: string; displayName: string },
  ): Promise<{ ok: boolean; messageId?: string; code?: string; permanent?: boolean }> {
    const topic = CATEGORY_POLICY[n.category].emailTopic;
    if (!topic) return { ok: false, code: 'channel_policy', permanent: true };
    const contact = await this.consentedContact(n.userId, user.email, user.displayName);
    if (!contact) return { ok: false, code: 'no_consent', permanent: true };
    if (contact.preferences.some((p) => p.topic === topic && !p.subscribed))
      return { ok: false, code: 'no_consent', permanent: true };

    const data = (n.data ?? {}) as Record<string, unknown>;
    const subject = String(data.emailSubject ?? n.title);
    const cta = n.webPath
      ? `\n\n[${n.ctaLabel ?? 'Uygulamayı aç'}](${EMAIL_CONFIG.publicBaseUrl}${n.webPath})`
      : '';
    const bodyMarkdown = String(data.emailBody ?? n.body) + cta;
    const html0 = renderCampaignHtml({
      subject,
      previewText: n.body.slice(0, 120),
      bodyMarkdown,
      siteUrl: EMAIL_CONFIG.publicBaseUrl,
      fromName: EMAIL_CONFIG.defaultFrom.name,
    });
    const unsubscribeUrl = this.contacts.unsubscribeUrl(contact.unsubscribeToken);
    const html = fillRecipient(html0, {
      unsubscribeUrl,
      preferencesUrl: this.contacts.preferencesUrl(contact.unsubscribeToken),
      ad: firstName(user.displayName),
      sendId: `n-${n.id}`,
    });
    const text = htmlToText(html);
    if (notificationsProvider() === 'console') {
      this.logger.log(`[console email] ${contact.email} "${subject}"`);
      return { ok: true, messageId: 'console' };
    }
    if (!this.ses.enabled) return { ok: false, code: 'not_configured', permanent: false };
    try {
      const r = await this.ses.send({
        fromName: EMAIL_CONFIG.defaultFrom.name,
        fromEmail: EMAIL_CONFIG.defaultFrom.email,
        replyTo: EMAIL_CONFIG.defaultFrom.replyTo,
        to: contact.email,
        subject,
        html,
        text,
        configurationSet:
          n.category === 'marketing'
            ? EMAIL_CONFIG.configurationSets.duyuru
            : EMAIL_CONFIG.configurationSets.islem,
        unsubscribe: {
          url: unsubscribeUrl,
          mailto: `${EMAIL_CONFIG.defaultFrom.replyTo}?subject=unsubscribe`,
        },
        tags: { source: 'notification', category: n.category },
      });
      await this.prisma.emailContact.update({
        where: { id: contact.id },
        data: { lastSentAt: new Date() },
      });
      return { ok: true, messageId: r.messageId };
    } catch (e) {
      const msg = (e as Error).message ?? '';
      const permanent = /MessageRejected|AccountSuppressed|MailFromDomainNotVerified/i.test(msg);
      return { ok: false, code: msg.slice(0, 120), permanent };
    }
  }
}
