import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmailCampaignStatus, EmailContactSource, EmailTopic, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EmailContactsService } from './email-contacts.service';
import { EMAIL_CONFIG } from './email.config';
import { fillRecipient, htmlToText, renderCampaignHtml } from './email-render';
import { SesService } from './ses.service';
import type { UpsertCampaignDto } from './dto/email.dto';

export type Audience = {
  sources?: string[];
  legacyYears?: number[];
  excludeCampaignIds?: string[];
};

const SOURCES = new Set<string>(Object.values(EmailContactSource));

@Injectable()
export class EmailCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: EmailContactsService,
    private readonly ses: SesService,
  ) {}

  /** Kitle süzgeci → Prisma where (yalnız abone + konu tercihi açık + hariç kampanyalarda yok). */
  audienceWhere(topic: EmailTopic, a: Audience): Prisma.EmailContactWhereInput {
    const sources = (a.sources ?? []).filter((s) => SOURCES.has(s)) as EmailContactSource[];
    return {
      status: 'subscribed',
      preferences: { none: { topic, subscribed: false } },
      ...(sources.length ? { source: { in: sources } } : {}),
      ...(a.legacyYears?.length ? { legacyYear: { in: a.legacyYears } } : {}),
      ...(a.excludeCampaignIds?.length
        ? { sends: { none: { campaignId: { in: a.excludeCampaignIds } } } }
        : {}),
    };
  }

  async audiencePreview(topic: EmailTopic, a: Audience) {
    const where = this.audienceWhere(topic, a);
    const [count, sample, byYear] = await Promise.all([
      this.prisma.emailContact.count({ where }),
      this.prisma.emailContact.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'asc' },
        select: { email: true, source: true, legacyYear: true },
      }),
      this.prisma.emailContact.groupBy({
        by: ['source', 'legacyYear'],
        where,
        _count: { _all: true },
      }),
    ]);
    return {
      count,
      sample: sample.map((s) => ({ ...s, email: s.email.replace(/^(.).*(@.*)$/, '$1***$2') })),
      breakdown: byYear.map((b) => ({
        source: b.source,
        legacyYear: b.legacyYear,
        count: b._count._all,
      })),
    };
  }

  list(status?: EmailCampaignStatus) {
    return this.prisma.emailCampaign.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    const [bySendStatus, uncertain] = await Promise.all([
      this.prisma.emailSend.groupBy({
        by: ['status'],
        where: { campaignId: id },
        _count: { _all: true },
      }),
      this.prisma.emailSend.count({
        where: {
          campaignId: id,
          status: 'claimed',
          claimedAt: { lt: new Date(Date.now() - EMAIL_CONFIG.claimStaleMs) },
        },
      }),
    ]);
    return {
      ...c,
      sendRatePerSec: Number(c.sendRatePerSec),
      sends: Object.fromEntries(bySendStatus.map((s) => [s.status, s._count._all])),
      uncertain,
      sentToday: await this.sentToday(id),
    };
  }

  async create(dto: UpsertCampaignDto, actorId: string) {
    return this.prisma.emailCampaign.create({ data: { ...this.toData(dto), createdBy: actorId } });
  }

  async update(id: string, dto: UpsertCampaignDto) {
    const c = await this.mustBeEditable(id);
    return this.prisma.emailCampaign.update({
      where: { id: c.id },
      data: { ...this.toData(dto), status: c.status === 'test_sent' ? 'draft' : c.status },
    });
  }

  private toData(dto: UpsertCampaignDto) {
    return {
      name: dto.name,
      topic: dto.topic,
      subject: dto.subject,
      previewText: dto.previewText ?? null,
      fromName: dto.fromName ?? EMAIL_CONFIG.defaultFrom.name,
      fromEmail: dto.fromEmail ?? EMAIL_CONFIG.defaultFrom.email,
      replyTo: dto.replyTo === undefined ? EMAIL_CONFIG.defaultFrom.replyTo : dto.replyTo,
      bodyMarkdown: dto.bodyMarkdown,
      audience: (dto.audience ?? {}) as Prisma.InputJsonValue,
      dailyCap: dto.dailyCap ?? 150,
      sendRatePerSec: dto.sendRatePerSec ?? 1,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    };
  }

  private async mustBeEditable(id: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    if (!['draft', 'test_sent', 'scheduled'].includes(c.status)) {
      throw new BadRequestException('Gönderimi başlamış kampanya düzenlenemez.');
    }
    return c;
  }

  /** Gönderici alanı yalnız doğrulanmış kimliklerden olabilir. */
  private assertFrom(fromEmail: string) {
    const domain = fromEmail.split('@')[1] ?? '';
    if (!(EMAIL_CONFIG.identities as readonly string[]).includes(domain)) {
      throw new BadRequestException(`Gönderici alanı doğrulanmış değil: ${domain}`);
    }
  }

  render(c: {
    subject: string;
    previewText: string | null;
    bodyMarkdown: string;
    fromName: string;
  }) {
    return renderCampaignHtml({
      subject: c.subject,
      previewText: c.previewText,
      bodyMarkdown: c.bodyMarkdown,
      siteUrl: EMAIL_CONFIG.publicBaseUrl,
      fromName: c.fromName,
    });
  }

  async preview(id: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    const html = fillRecipient(this.render(c), {
      unsubscribeUrl: `${EMAIL_CONFIG.publicBaseUrl}/eposta/abonelik/ornek`,
      preferencesUrl: `${EMAIL_CONFIG.publicBaseUrl}/eposta/abonelik/ornek`,
      ad: 'Ayşe',
    });
    return { html, text: htmlToText(html) };
  }

  /** Test postası: admin'in adresine, çıkış başlıkları olmadan, kampanya etiketiyle değil. */
  async sendTest(id: string, to: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    this.assertFrom(c.fromEmail);
    if (!this.ses.enabled) throw new BadRequestException('SES yapılandırılmadı.');
    const html = fillRecipient(this.render(c), {
      unsubscribeUrl: `${EMAIL_CONFIG.publicBaseUrl}/eposta/abonelik/ornek`,
      preferencesUrl: `${EMAIL_CONFIG.publicBaseUrl}/eposta/abonelik/ornek`,
      ad: 'Test',
    });
    const r = await this.ses.send({
      fromName: c.fromName,
      fromEmail: c.fromEmail,
      to,
      replyTo: c.replyTo,
      subject: `[TEST] ${c.subject}`,
      html,
      text: htmlToText(html),
      configurationSet: EMAIL_CONFIG.configurationSets.duyuru,
      tags: { campaign: 'test' },
    });
    if (c.status === 'draft')
      await this.prisma.emailCampaign.update({ where: { id }, data: { status: 'test_sent' } });
    return { messageId: r.messageId };
  }

  /**
   * Gönderimi başlat: kitle DONDURULUR (email_sends satırları), HTML dondurulur,
   * durum sending. Test postası gönderilmemiş kampanya başlatılamaz.
   */
  async start(id: string, confirm: { expectedCount: number }) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    if (!['test_sent', 'scheduled'].includes(c.status)) {
      throw new BadRequestException(
        c.status === 'draft'
          ? 'Önce test postası gönderilmeli.'
          : 'Kampanya bu durumda başlatılamaz.',
      );
    }
    this.assertFrom(c.fromEmail);
    if (!this.ses.enabled) throw new BadRequestException('SES yapılandırılmadı.');

    const where = this.audienceWhere(c.topic, c.audience as Audience);
    const count = await this.prisma.emailContact.count({ where });
    if (count !== confirm.expectedCount) {
      throw new BadRequestException(
        `Kitle değişti: onaylanan ${confirm.expectedCount}, şimdi ${count}. Yeniden gözden geçir.`,
      );
    }
    if (count === 0) throw new BadRequestException('Kitle boş.');

    const html = this.render(c);
    const CHUNK = 1000;
    let cursor: string | undefined;
    let inserted = 0;
    for (;;) {
      const batch = await this.prisma.emailContact.findMany({
        where,
        select: { id: true, email: true },
        orderBy: { id: 'asc' },
        take: CHUNK,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (batch.length === 0) break;
      const r = await this.prisma.emailSend.createMany({
        data: batch.map((b) => ({ campaignId: c.id, contactId: b.id, email: b.email })),
        skipDuplicates: true,
      });
      inserted += r.count;
      cursor = batch[batch.length - 1].id;
      if (batch.length < CHUNK) break;
    }
    await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'sending',
        startedAt: new Date(),
        htmlSnapshot: html,
        targetedCount: inserted,
        pausedReason: null,
      },
    });
    return { targeted: inserted };
  }

  async pause(id: string, reason: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c || c.status !== 'sending')
      throw new BadRequestException('Yalnız gönderimdeki kampanya duraklatılır.');
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'paused', pausedReason: reason },
    });
  }

  async resume(id: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c || c.status !== 'paused')
      throw new BadRequestException('Yalnız duraklatılmış kampanya sürdürülür.');
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'sending', pausedReason: null },
    });
  }

  async cancel(id: string) {
    const c = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!c || ['completed', 'cancelled'].includes(c.status))
      throw new BadRequestException('Kampanya iptal edilemez.');
    await this.prisma.$transaction([
      this.prisma.emailSend.updateMany({
        where: { campaignId: id, status: 'queued' },
        data: { status: 'skipped', error: 'iptal' },
      }),
      this.prisma.emailCampaign.update({
        where: { id },
        data: { status: 'cancelled', completedAt: new Date() },
      }),
    ]);
    return { ok: true as const };
  }

  /** İstanbul gününde bu kampanyadan gönderilen (Türkiye'de yaz saati yok: sabit +03). */
  async sentToday(id: string) {
    const ist = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(
      new Date(),
    );
    const dayStart = new Date(`${ist}T00:00:00+03:00`);
    return this.prisma.emailSend.count({ where: { campaignId: id, sentAt: { gte: dayStart } } });
  }

  /** Alıcı başına şablon doldurma (işçi çağırır). */
  personalize(
    template: string,
    contact: { unsubscribeToken: string; displayName: string | null },
    campaignId: string,
  ) {
    const html = fillRecipient(template, {
      unsubscribeUrl: this.contacts.unsubscribeUrl(contact.unsubscribeToken, campaignId),
      preferencesUrl: this.contacts.preferencesUrl(contact.unsubscribeToken),
      ad: contact.displayName ?? '',
    });
    return { html, text: htmlToText(html) };
  }
}
