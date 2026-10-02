import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailContactStatus, EmailTopic, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EMAIL_CONFIG } from './email.config';

export type PreferencesView = {
  emailMasked: string;
  status: EmailContactStatus;
  /** Kişi kendi başına yeniden abone olabilir mi (bounce/şikâyet değilse). */
  canResubscribe: boolean;
  topics: Record<EmailTopic, boolean>;
};

export const TOPIC_LABELS: Record<EmailTopic, { title: string; description: string }> = {
  duyuru: {
    title: 'Duyurular',
    description: 'Yeni özellikler, sınav takvimi ve mevzuat güncellemeleri.',
  },
  kampanya: { title: 'Kampanyalar', description: 'İndirim ve fırsat bildirimleri.' },
};

/** a***@gmail.com — tercih sayfası kimliği göstermez, hatırlatır. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

@Injectable()
export class EmailContactsService {
  constructor(private readonly prisma: PrismaService) {}

  unsubscribeUrl(token: string, campaignId?: string) {
    return `${EMAIL_CONFIG.apiBaseUrl}/email/unsubscribe/${token}${campaignId ? `?c=${campaignId}` : ''}`;
  }
  preferencesUrl(token: string) {
    return `${EMAIL_CONFIG.publicBaseUrl}/eposta/abonelik/${token}`;
  }

  private async byToken(token: string) {
    if (!token || token.length < 20 || token.length > 64)
      throw new NotFoundException('Bağlantı geçersiz.');
    const c = await this.prisma.emailContact.findUnique({
      where: { unsubscribeToken: token },
      include: { preferences: true },
    });
    if (!c) throw new NotFoundException('Bağlantı geçersiz.');
    return c;
  }

  async preferences(token: string): Promise<PreferencesView> {
    const c = await this.byToken(token);
    const topics = { duyuru: true, kampanya: true } as Record<EmailTopic, boolean>;
    for (const p of c.preferences) topics[p.topic] = p.subscribed;
    return {
      emailMasked: maskEmail(c.email),
      status: c.status,
      canResubscribe: c.status === 'unsubscribed',
      topics,
    };
  }

  /** Hepsinden çıkış (tek tık ya da sayfa). Zaten çıkmışsa sessizce başarılı. */
  async unsubscribeAll(
    token: string,
    reason: 'one_click' | 'web' | 'admin',
    campaignId?: string | null,
  ) {
    const c = await this.byToken(token);
    if (c.status === 'subscribed') {
      await this.prisma.$transaction(async (tx) => {
        await tx.emailContact.update({
          where: { id: c.id },
          data: { status: 'unsubscribed', unsubscribedAt: new Date(), unsubscribeReason: reason },
        });
        if (campaignId) {
          await tx.emailCampaign
            .update({ where: { id: campaignId }, data: { unsubscribedCount: { increment: 1 } } })
            .catch(() => undefined);
        }
      });
    }
    return { ok: true as const };
  }

  async updatePreferences(
    token: string,
    input: { topics?: Partial<Record<EmailTopic, boolean>>; aboneOl?: boolean },
  ) {
    const c = await this.byToken(token);
    await this.prisma.$transaction(async (tx) => {
      if (input.aboneOl === false && c.status === 'subscribed') {
        await tx.emailContact.update({
          where: { id: c.id },
          data: { status: 'unsubscribed', unsubscribedAt: new Date(), unsubscribeReason: 'web' },
        });
      } else if (input.aboneOl === true && c.status === 'unsubscribed') {
        await tx.emailContact.update({
          where: { id: c.id },
          data: {
            status: 'subscribed',
            unsubscribedAt: null,
            unsubscribeReason: null,
            consentAt: new Date(),
            consentSource: 'web_preferences',
          },
        });
      }
      for (const topic of Object.values(EmailTopic)) {
        const v = input.topics?.[topic];
        if (typeof v !== 'boolean') continue;
        await tx.emailTopicPreference.upsert({
          where: { contactId_topic: { contactId: c.id, topic } },
          create: { contactId: c.id, topic, subscribed: v },
          update: { subscribed: v },
        });
      }
    });
    return this.preferences(token);
  }

  // ── Admin ──
  async list(q: {
    status?: EmailContactStatus;
    source?: string;
    legacyYear?: number;
    tag?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, q.pageSize ?? 50));
    const where: Prisma.EmailContactWhereInput = {
      status: q.status,
      source: q.source as Prisma.EmailContactWhereInput['source'],
      legacyYear: q.legacyYear,
      ...(q.tag ? { tags: { has: q.tag } } : {}),
      ...(q.search
        ? {
            OR: [
              { email: { contains: q.search.toLowerCase() } },
              { displayName: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total, byStatus] = await Promise.all([
      this.prisma.emailContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { preferences: true },
      }),
      this.prisma.emailContact.count({ where }),
      this.prisma.emailContact.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    return {
      items: items.map((c) => ({
        id: c.id,
        email: c.email,
        displayName: c.displayName,
        source: c.source,
        legacyYear: c.legacyYear,
        status: c.status,
        topics: Object.fromEntries(c.preferences.map((p) => [p.topic, p.subscribed])),
        consentAt: c.consentAt,
        unsubscribedAt: c.unsubscribedAt,
        lastSentAt: c.lastSentAt,
        softBounceCount: c.softBounceCount,
        tags: c.tags,
      })),
      meta: {
        page,
        pageSize,
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      },
    };
  }

  async adminUnsubscribe(contactId: string) {
    const c = await this.prisma.emailContact.findUnique({ where: { id: contactId } });
    if (!c) throw new NotFoundException('Kişi bulunamadı.');
    if (c.status === 'subscribed') {
      await this.prisma.emailContact.update({
        where: { id: c.id },
        data: { status: 'unsubscribed', unsubscribedAt: new Date(), unsubscribeReason: 'admin' },
      });
    }
    return { ok: true as const };
  }
}
