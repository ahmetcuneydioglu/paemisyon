import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  GetAccountCommand,
  GetEmailIdentityCommand,
  ListSuppressedDestinationsCommand,
  SESv2Client,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import { EMAIL_CONFIG } from './email.config';

export type SesSendInput = {
  fromName: string;
  fromEmail: string;
  to: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
  configurationSet: string;
  /** RFC 8058 tek tık çıkış için; yoksa başlıklar eklenmez (test postası). */
  unsubscribe?: { url: string; mailto: string };
  tags?: Record<string, string>;
};

/**
 * Amazon SES v2 istemcisi. Anahtar yoksa (lokal) sessizce devre dışı:
 * uygulama/panel kırılmaz, gönderim "yapılandırılmadı" hatası döner.
 */
@Injectable()
export class SesService implements OnModuleInit {
  private readonly logger = new Logger(SesService.name);
  private client: SESv2Client | null = null;
  private accountCache: { at: number; value: AccountStatus } | null = null;

  onModuleInit() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      this.logger.warn('AWS anahtarı yok — SES gönderimi devre dışı.');
      return;
    }
    this.client = new SESv2Client({ region: EMAIL_CONFIG.region });
    this.logger.log(`SES hazır (${EMAIL_CONFIG.region}).`);
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  private need(): SESv2Client {
    if (!this.client) throw new Error('SES yapılandırılmadı (AWS anahtarı yok).');
    return this.client;
  }

  async send(input: SesSendInput): Promise<{ messageId: string }> {
    const headers: { Name: string; Value: string }[] = [];
    if (input.unsubscribe) {
      headers.push(
        {
          Name: 'List-Unsubscribe',
          Value: `<${input.unsubscribe.url}>, <mailto:${input.unsubscribe.mailto}>`,
        },
        { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
      );
    }
    const res = await this.need().send(
      new SendEmailCommand({
        FromEmailAddress: `${input.fromName} <${input.fromEmail}>`,
        Destination: { ToAddresses: [input.to] },
        ReplyToAddresses: input.replyTo ? [input.replyTo] : undefined,
        ConfigurationSetName: input.configurationSet,
        EmailTags: input.tags
          ? Object.entries(input.tags).map(([Name, Value]) => ({ Name, Value }))
          : undefined,
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: input.html, Charset: 'UTF-8' },
              Text: { Data: input.text, Charset: 'UTF-8' },
            },
            Headers: headers.length ? headers : undefined,
          },
        },
      }),
    );
    if (!res.MessageId) throw new Error('SES MessageId döndürmedi.');
    return { messageId: res.MessageId };
  }

  /** Hesap kotası ve üretim durumu; 5 dk önbellek (işçi her tick'te okur). */
  async account(force = false): Promise<AccountStatus> {
    if (!force && this.accountCache && Date.now() - this.accountCache.at < 5 * 60_000)
      return this.accountCache.value;
    const a = await this.need().send(new GetAccountCommand({}));
    const value: AccountStatus = {
      productionAccess: a.ProductionAccessEnabled ?? false,
      sendingEnabled: a.SendingEnabled ?? false,
      enforcementStatus: a.EnforcementStatus ?? 'UNKNOWN',
      max24HourSend: a.SendQuota?.Max24HourSend ?? 0,
      maxSendRate: a.SendQuota?.MaxSendRate ?? 0,
      sentLast24Hours: a.SendQuota?.SentLast24Hours ?? 0,
      suppressedReasons: a.SuppressionAttributes?.SuppressedReasons ?? [],
    };
    this.accountCache = { at: Date.now(), value };
    return value;
  }

  async identity(name: string): Promise<IdentityStatus> {
    const i = await this.need().send(new GetEmailIdentityCommand({ EmailIdentity: name }));
    return {
      name,
      verified: i.VerifiedForSendingStatus ?? false,
      dkim: i.DkimAttributes?.Status ?? 'UNKNOWN',
      mailFromDomain: i.MailFromAttributes?.MailFromDomain ?? null,
      mailFrom: i.MailFromAttributes?.MailFromDomainStatus ?? 'UNKNOWN',
      configurationSet: i.ConfigurationSetName ?? null,
    };
  }

  async suppressedCount(): Promise<number> {
    let count = 0;
    let next: string | undefined;
    do {
      const r = await this.need().send(
        new ListSuppressedDestinationsCommand({ NextToken: next, PageSize: 1000 }),
      );
      count += r.SuppressedDestinationSummaries?.length ?? 0;
      next = r.NextToken;
    } while (next);
    return count;
  }
}

export type AccountStatus = {
  productionAccess: boolean;
  sendingEnabled: boolean;
  enforcementStatus: string;
  max24HourSend: number;
  maxSendRate: number;
  sentLast24Hours: number;
  suppressedReasons: string[];
};

export type IdentityStatus = {
  name: string;
  verified: boolean;
  dkim: string;
  mailFromDomain: string | null;
  mailFrom: string;
  configurationSet: string | null;
};
