import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationCampaignStatus, NotificationChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuditService } from '../admin/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { createHash } from 'node:crypto';
import { maskEmail } from '../email/email-contacts.service';
import { smartSendAt } from './automation.logic';
import { allowedChannels } from './notification.categories';
import { NOTIFICATIONS_CONFIG } from './notifications.config';
import { NotificationsService } from './notifications.service';
import { resolveDeepLink, type DeepLink } from './deep-links';
import { rulesSummary, rulesToWhere, validateRules } from './segment-dsl';
import { fillTemplate, firstName, templateWarnings } from './template';
import { TestersService } from './testers.service';
import type { UpsertCampaignDto } from './dto/notifications.dto';

export type CampaignAction = 'schedule' | 'send_now' | 'pause' | 'resume' | 'cancel';
type CampaignRow = Prisma.NotificationCampaignGetPayload<{
  include: { variants: true; segment: true };
}>;

/**
 * Kampanya yaşam döngüsü (Doc 52 §7): CRUD, tahmin, prova, test gönderimi,
 * durum geçişleri (ikinci onay alıcı sayısıyla), kitleye parti parti açma.
 * Gönderme yetkisi admin; editor hazırlar ve testerlara gönderir.
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly testers: TestersService,
    private readonly audit: AuditService,
  ) {}

  private isAdmin(actor: AuthenticatedUser) {
    return actor.roles.includes('admin');
  }

  async list(q: { status?: NotificationCampaignStatus; page?: number; pageSize?: number }) {
    const page = Math.max(q.page ?? 1, 1);
    const pageSize = Math.min(Math.max(q.pageSize ?? 25, 1), 100);
    const where: Prisma.NotificationCampaignWhereInput = q.status ? { status: q.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { variants: true, segment: { select: { id: true, name: true } } },
      }),
      this.prisma.notificationCampaign.count({ where }),
    ]);
    return { items: items.map((c) => this.view(c)), total, page, pageSize };
  }

  async get(id: string) {
    const c = await this.prisma.notificationCampaign.findUnique({
      where: { id },
      include: { variants: true, segment: true },
    });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    return this.view(c);
  }

  private view(
    c:
      | CampaignRow
      | (Omit<CampaignRow, 'segment'> & { segment: { id: string; name: string } | null }),
  ) {
    const sorted = [...c.variants].sort((a, b) => a.key.localeCompare(b.key));
    const v = sorted[0];
    return {
      ...c,
      variants: sorted.map((x) => ({ ...x, warnings: templateWarnings(x.title, x.body) })),
      variant: v ?? null,
      warnings: v ? templateWarnings(v.title, v.body) : [],
    };
  }

  private normalize(dto: UpsertCampaignDto) {
    const channels = allowedChannels(
      dto.category,
      dto.channels as NotificationChannel[] | undefined,
    );
    if (channels.length === 0) throw new BadRequestException('Bu kategori için seçilen kanal yok.');
    let deepLink: DeepLink = { target: 'home' };
    if (dto.deepLink) {
      deepLink = { target: dto.deepLink.target, params: dto.deepLink.params ?? {} };
      resolveDeepLink(deepLink); // parametre doğrulaması
    }
    let rules: unknown = null;
    if (dto.audienceMode === 'segment') {
      if (dto.segmentRules) rules = validateRules(dto.segmentRules);
      else if (!dto.segmentId) throw new BadRequestException('Segment ya da kural gerekli.');
    }
    if (dto.audienceMode === 'users' && (!dto.userIds?.length || dto.userIds.length > 500))
      throw new BadRequestException('Kullanıcı listesi 1–500 kişi olmalı.');
    const hard = templateWarnings(dto.title, dto.body).filter(
      (w) => w.code === 'emoji' || w.code === 'forbidden',
    );
    if (hard.length) throw new BadRequestException(hard.map((w) => w.message).join(' '));
    if (dto.sendMode === 'scheduled' && !dto.scheduledAt)
      throw new BadRequestException('Zamanlı gönderim için tarih gerekli.');
    if (dto.sendMode === 'smart') {
      if (!dto.smartWindowStart || !dto.smartWindowEnd)
        throw new BadRequestException('Akıllı gönderim için pencere (başlangıç/bitiş) gerekli.');
      if (dto.smartWindowStart >= dto.smartWindowEnd)
        throw new BadRequestException('Akıllı pencere başlangıcı bitişten önce olmalı.');
    }
    const variants = this.variantRows(dto, deepLink);
    return { channels, deepLink, rules, variants };
  }

  /** A/B (F3): `variants` verilmişse ağırlık toplamı 100 ve anahtarlar tekil; yoksa tek A varyantı. */
  private variantRows(dto: UpsertCampaignDto, deepLink: DeepLink) {
    if (!dto.variants || dto.variants.length === 0) {
      return [
        {
          key: 'A',
          weight: 100,
          title: dto.title,
          body: dto.body,
          imageUrl: dto.imageUrl ?? null,
          ctaLabel: dto.ctaLabel ?? null,
          deepLink: deepLink as unknown as Prisma.InputJsonValue,
          emailSubject: dto.emailSubject ?? null,
          emailBody: dto.emailBody ?? null,
          templateId: dto.templateId ?? null,
        },
      ];
    }
    if (dto.variants.length > 4) throw new BadRequestException('En çok 4 varyant.');
    const keys = new Set(dto.variants.map((v) => v.key.toUpperCase()));
    if (keys.size !== dto.variants.length)
      throw new BadRequestException('Varyant anahtarları tekil olmalı.');
    const total = dto.variants.reduce((s, v) => s + v.weight, 0);
    if (total !== 100)
      throw new BadRequestException(`Varyant ağırlıkları toplamı 100 olmalı (şu an ${total}).`);
    return dto.variants.map((v) => {
      const hard = templateWarnings(v.title, v.body).filter(
        (w) => w.code === 'emoji' || w.code === 'forbidden',
      );
      if (hard.length)
        throw new BadRequestException(`Varyant ${v.key}: ${hard.map((w) => w.message).join(' ')}`);
      const link = v.deepLink
        ? resolveDeepLink(v.deepLink as DeepLink) && (v.deepLink as DeepLink)
        : deepLink;
      return {
        key: v.key.toUpperCase(),
        weight: v.weight,
        title: v.title,
        body: v.body,
        imageUrl: v.imageUrl ?? null,
        ctaLabel: v.ctaLabel ?? null,
        deepLink: link as unknown as Prisma.InputJsonValue,
        emailSubject: v.emailSubject ?? null,
        emailBody: v.emailBody ?? null,
        templateId: dto.templateId ?? null,
      };
    });
  }

  /** Deterministik varyant seçimi: md5(campaignId + userId) ilk 8 hex → [0,100) ağırlık aralığı. */
  private pickVariant<V extends { weight: number }>(
    c: { id: string; variants: V[] },
    userId: string,
  ): V {
    if (c.variants.length <= 1) return c.variants[0];
    const h = createHash('md5').update(`${c.id}${userId}`).digest('hex').slice(0, 8);
    const x = (parseInt(h, 16) % 10_000) / 100; // 0.00 … 99.99
    let acc = 0;
    for (const v of c.variants) {
      acc += v.weight;
      if (x < acc) return v;
    }
    return c.variants[c.variants.length - 1];
  }

  async create(dto: UpsertCampaignDto, actor: AuthenticatedUser) {
    const { channels, rules, variants } = this.normalize(dto);
    const c = await this.prisma.notificationCampaign.create({
      data: {
        name: dto.name,
        category: dto.category,
        priority: dto.priority ?? 'normal',
        channels,
        audienceMode: dto.audienceMode ?? 'all',
        segmentId: dto.segmentId ?? null,
        segmentRulesSnapshot: rules as Prisma.InputJsonValue | undefined,
        userIds: dto.userIds ?? [],
        sendMode: dto.sendMode ?? 'now',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        conversionEvent: dto.conversionEvent ?? null,
        attributionWindowHours: dto.attributionWindowHours ?? 24,
        respectQuietHours: dto.respectQuietHours ?? true,
        countTowardCaps: dto.countTowardCaps ?? true,
        ttlHours: dto.ttlHours ?? 24,
        createInAppBanner: dto.createInAppBanner ?? false,
        smartWindowStart: dto.sendMode === 'smart' ? (dto.smartWindowStart ?? null) : null,
        smartWindowEnd: dto.sendMode === 'smart' ? (dto.smartWindowEnd ?? null) : null,
        createdById: actor.id,
        variants: { create: variants },
      },
      include: { variants: true, segment: true },
    });
    await this.audit.log(actor, 'notification.campaign.create', 'notification_campaign', c.id, {
      name: c.name,
      category: c.category,
      channels,
    });
    return this.view(c);
  }

  async update(id: string, dto: UpsertCampaignDto, actor: AuthenticatedUser) {
    const c = await this.prisma.notificationCampaign.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    if (!['draft', 'scheduled'].includes(c.status))
      throw new BadRequestException('Yalnız taslak ve planlı kampanya düzenlenir.');
    const { channels, rules, variants } = this.normalize(dto);
    const u = await this.prisma.notificationCampaign.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        priority: dto.priority ?? 'normal',
        channels,
        audienceMode: dto.audienceMode ?? 'all',
        segmentId: dto.segmentId ?? null,
        segmentRulesSnapshot: rules as Prisma.InputJsonValue | undefined,
        userIds: dto.userIds ?? [],
        sendMode: dto.sendMode ?? 'now',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        conversionEvent: dto.conversionEvent ?? null,
        attributionWindowHours: dto.attributionWindowHours ?? 24,
        respectQuietHours: dto.respectQuietHours ?? true,
        countTowardCaps: dto.countTowardCaps ?? true,
        ttlHours: dto.ttlHours ?? 24,
        createInAppBanner: dto.createInAppBanner ?? false,
        smartWindowStart: dto.sendMode === 'smart' ? (dto.smartWindowStart ?? null) : null,
        smartWindowEnd: dto.sendMode === 'smart' ? (dto.smartWindowEnd ?? null) : null,
        updatedById: actor.id,
        // Taslak/planlı kampanyada varyant seti yeniden yazılır (henüz gönderim yok, atama yok).
        variants: { deleteMany: {}, create: variants },
      },
      include: { variants: true, segment: true },
    });
    await this.audit.log(actor, 'notification.campaign.update', 'notification_campaign', id, {
      name: u.name,
    });
    return this.view(u);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const c = await this.prisma.notificationCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    if (c.status !== 'draft')
      throw new BadRequestException('Yalnız taslak silinir; diğerleri iptal edilir.');
    await this.prisma.notificationCampaign.delete({ where: { id } });
    await this.audit.log(actor, 'notification.campaign.delete', 'notification_campaign', id, {
      name: c.name,
    });
    return { ok: true };
  }

  // ── Kitle ──

  async audienceWhere(c: {
    audienceMode: string;
    segmentId: string | null;
    segmentRulesSnapshot: Prisma.JsonValue | null;
    userIds: string[];
  }): Promise<Prisma.NotificationAudienceWhereInput> {
    const base: Prisma.NotificationAudienceWhereInput = { accountActive: true };
    switch (c.audienceMode) {
      case 'all':
        return base;
      case 'users':
        return { ...base, userId: { in: c.userIds } };
      case 'testers':
        return { ...base, userId: { in: await this.testers.userIds() } };
      case 'segment': {
        let rules = c.segmentRulesSnapshot;
        if (!rules && c.segmentId)
          rules =
            (await this.prisma.notificationSegment.findUnique({ where: { id: c.segmentId } }))
              ?.rules ?? null;
        if (!rules) throw new BadRequestException('Segment kuralı bulunamadı.');
        return { ...base, ...rulesToWhere(validateRules(rules)) };
      }
    }
    return base;
  }

  async estimate(c: {
    audienceMode: string;
    segmentId: string | null;
    segmentRulesSnapshot: Prisma.JsonValue | null;
    userIds: string[];
    channels: NotificationChannel[];
  }) {
    const where = await this.audienceWhere(c);
    const [total, push, email, refreshed] = await Promise.all([
      this.prisma.notificationAudience.count({ where }),
      c.channels.includes('push')
        ? this.prisma.notificationAudience.count({ where: { ...where, pushEnabled: true } })
        : Promise.resolve(0),
      c.channels.includes('email')
        ? this.prisma.notificationAudience.count({ where: { ...where, emailSubscribed: true } })
        : Promise.resolve(0),
      this.prisma.notificationAudience.aggregate({ _max: { refreshedAt: true } }),
    ]);
    return {
      total,
      push,
      inboxOnly: c.channels.includes('inbox') ? total - push : 0,
      email,
      refreshedAt: refreshed._max.refreshedAt,
    };
  }

  async estimateDraft(dto: {
    audienceMode: string;
    segmentId?: string | null;
    segmentRules?: unknown;
    userIds?: string[];
    channels?: string[];
    category: string;
  }) {
    const channels = allowedChannels(
      dto.category as never,
      dto.channels as NotificationChannel[] | undefined,
    );
    return this.estimate({
      audienceMode: dto.audienceMode,
      segmentId: dto.segmentId ?? null,
      segmentRulesSnapshot: dto.segmentRules
        ? (validateRules(dto.segmentRules) as unknown as Prisma.JsonValue)
        : null,
      userIds: dto.userIds ?? [],
      channels,
    });
  }

  /** Prova: tahmin + 10 maskeli örnek + çözülmüş metin + uyarılar. */
  async preview(id: string) {
    const c = await this.prisma.notificationCampaign.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    const where = await this.audienceWhere(c);
    const [est, sample] = await Promise.all([
      this.estimate(c),
      this.prisma.notificationAudience.findMany({
        where,
        take: 10,
        orderBy: { refreshedAt: 'desc' },
        include: { user: { select: { email: true, displayName: true } } },
      }),
    ]);
    const v = c.variants[0];
    const first = sample[0]?.user.displayName;
    const link = resolveDeepLink(v.deepLink as unknown as DeepLink);
    return {
      estimate: est,
      sample: sample.map((s) => ({
        email: maskEmail(s.user.email),
        lastActiveDays: s.lastActiveDays,
        isPremium: s.isPremium,
        platforms: s.pushPlatforms,
      })),
      rendered: {
        title: fillTemplate(v.title, { ad: firstName(first) }),
        body: fillTemplate(v.body, { ad: firstName(first) }),
        ...link,
      },
      warnings: templateWarnings(v.title, v.body),
      segmentSummary: c.segmentRulesSnapshot
        ? rulesSummary(validateRules(c.segmentRulesSnapshot))
        : null,
    };
  }

  /** Test gönderimi: yalnız testerlara; dedupe anahtarı denemeye özgü (tekrar gönderilebilir). */
  async testSend(id: string, actor: AuthenticatedUser) {
    const c = await this.prisma.notificationCampaign.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    const ids = await this.testers.userIds();
    if (ids.length === 0)
      throw new BadRequestException('Tester listesi boş (Ayarlar › Testerlar).');
    const results = [];
    for (const userId of ids)
      results.push(await this.enqueueFor(c, userId, `campaign-test:${id}:${Date.now()}`, true));
    await this.audit.log(actor, 'notification.test_send', 'notification_campaign', id, {
      testers: ids.length,
      results: results.map((r) => r.status),
    });
    return { sent: results.filter((r) => r.status === 'queued').length, results };
  }

  private async enqueueFor(
    c: Prisma.NotificationCampaignGetPayload<{ include: { variants: true } }>,
    userId: string,
    dedupeKey: string,
    test = false,
  ) {
    const v = this.pickVariant(c, userId);
    // Akıllı saat (F3): alıcının en iyi saati (yoksa hatırlatma saati) pencere içinde; test gönderimi hemen.
    let scheduleAt: Date | null = null;
    if (c.sendMode === 'smart' && !test) {
      const [aud, settings] = await Promise.all([
        this.prisma.notificationAudience.findUnique({
          where: { userId },
          select: { bestEngagementHour: true },
        }),
        this.prisma.userNotificationSettings.findUnique({
          where: { userId },
          select: { reminderTime: true, smartTimingEnabled: true },
        }),
      ]);
      const best = (settings?.smartTimingEnabled ?? true) ? aud?.bestEngagementHour : null;
      scheduleAt = smartSendAt(
        new Date(),
        best,
        settings?.reminderTime ?? '19:00',
        c.smartWindowStart,
        c.smartWindowEnd,
      );
    }
    return this.notifications.enqueue({
      scheduleAt,
      userId,
      category: c.category,
      priority: c.priority,
      title: v.title,
      body: v.body,
      imageUrl: v.imageUrl,
      ctaLabel: v.ctaLabel,
      deepLink: v.deepLink as unknown as DeepLink,
      channels: c.channels,
      dedupeKey,
      // Test gönderimi kampanya sayaçlarına ve analizine girmez; izi automationCode'da.
      campaignId: test ? null : c.id,
      variantId: v.id,
      templateId: v.templateId,
      automationCode: test ? `campaign_test:${c.id}` : null,
      conversionEvent: c.conversionEvent,
      attributionWindowHours: c.attributionWindowHours,
      respectQuietHours: c.respectQuietHours,
      countTowardCaps: !test && c.countTowardCaps,
      ttlHours: c.ttlHours,
      emailSubject: v.emailSubject,
      emailBody: v.emailBody,
    });
  }

  // ── Durum geçişleri ──

  async transition(
    id: string,
    action: CampaignAction,
    actor: AuthenticatedUser,
    confirmedRecipients?: number,
    scheduledAt?: string,
  ) {
    if (!this.isAdmin(actor))
      throw new ForbiddenException('Gönderme, zamanlama ve iptal yalnız admin.');
    const c = await this.prisma.notificationCampaign.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!c) throw new NotFoundException('Kampanya bulunamadı.');
    if (c.priority === 'critical' && c.category !== 'system')
      throw new BadRequestException('critical yalnız system kategorisinde.');
    const now = new Date();
    let data: Prisma.NotificationCampaignUpdateInput = { updatedById: actor.id };
    switch (action) {
      case 'schedule':
      case 'send_now': {
        if (!['draft', 'scheduled', 'paused'].includes(c.status))
          throw new BadRequestException(`Bu durumda ${action} yapılamaz: ${c.status}`);
        const est = await this.estimate(c);
        if (confirmedRecipients !== est.total)
          throw new BadRequestException(
            `Alıcı sayısı değişti: güncel tahmin ${est.total}. Yeniden onayla.`,
            { cause: { estimate: est } },
          );
        if (action === 'schedule') {
          const at = scheduledAt ? new Date(scheduledAt) : c.scheduledAt;
          if (!at || at.getTime() < now.getTime() - 60_000)
            throw new BadRequestException('Geçerli bir gelecek tarih gerekli.');
          data = {
            ...data,
            status: 'scheduled',
            scheduledAt: at,
            sendMode: 'scheduled',
            estimatedRecipients: est.total,
            sentById: actor.id,
          };
        } else {
          data = {
            ...data,
            status: 'sending',
            scheduledAt: now,
            // Akıllı saat (F3) korunur: kitle hemen açılır, her alıcı kendi saatine planlanır.
            sendMode:
              c.sendMode === 'scheduled' ? 'scheduled' : c.sendMode === 'smart' ? 'smart' : 'now',
            estimatedRecipients: est.total,
            startedAt: c.startedAt ?? now,
            sentById: actor.id,
            sentAt: now,
          };
        }
        break;
      }
      case 'pause':
        if (c.status !== 'sending' && c.status !== 'scheduled')
          throw new BadRequestException('Yalnız gönderilen/planlı kampanya duraklatılır.');
        data = { ...data, status: 'paused' };
        break;
      case 'resume':
        if (c.status !== 'paused') throw new BadRequestException('Kampanya duraklatılmış değil.');
        data = {
          ...data,
          status: c.materializedAt
            ? 'sending'
            : c.scheduledAt && c.scheduledAt > now
              ? 'scheduled'
              : 'sending',
        };
        break;
      case 'cancel':
        if (['sent', 'cancelled'].includes(c.status))
          throw new BadRequestException('Kampanya zaten bitmiş.');
        data = { ...data, status: 'cancelled', cancelledAt: now, cancelledById: actor.id };
        break;
    }
    const u = await this.prisma.notificationCampaign.update({
      where: { id },
      data,
      include: { variants: true, segment: true },
    });
    if (action === 'cancel') {
      await this.prisma.notificationDelivery.updateMany({
        where: { status: 'queued', notification: { campaignId: id } },
        data: { status: 'expired', suppressionReason: 'campaign_cancelled' },
      });
    }
    await this.audit.log(actor, `notification.campaign.${action}`, 'notification_campaign', id, {
      name: c.name,
      estimatedRecipients: u.estimatedRecipients,
      scheduledAt: u.scheduledAt,
    });
    return this.view(u);
  }

  // ── İşçi tarafı: parti parti açma ──

  async dueCampaigns(now: Date) {
    return this.prisma.notificationCampaign.findMany({
      where: {
        OR: [
          { status: 'scheduled', scheduledAt: { lte: now } },
          { status: 'sending', materializedAt: null },
        ],
      },
      include: { variants: true },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });
  }

  /** `budget` kullanıcıya kadar açar; tamamlanınca materializedAt yazılır. Dönüş: açılan sayısı. */
  async materialize(
    c: Prisma.NotificationCampaignGetPayload<{ include: { variants: true } }>,
    budget: number,
  ): Promise<number> {
    if (c.status === 'scheduled') {
      await this.prisma.notificationCampaign.update({
        where: { id: c.id },
        data: { status: 'sending', startedAt: c.startedAt ?? new Date() },
      });
    }
    const where = await this.audienceWhere(c);
    let cursor = c.materializeCursor;
    let opened = 0;
    let suppressed = 0;
    while (opened < budget) {
      const batch = await this.prisma.notificationAudience.findMany({
        where: { ...where, ...(cursor ? { userId: { gt: cursor } } : {}) },
        orderBy: { userId: 'asc' },
        take: Math.min(NOTIFICATIONS_CONFIG.materializeBatch, budget - opened),
        select: { userId: true },
      });
      if (batch.length === 0) {
        await this.prisma.notificationCampaign.update({
          where: { id: c.id },
          data: {
            materializedAt: new Date(),
            materializeCursor: cursor,
            // Parti başına zaten artırıldı; burada yalnız kapanış damgası (çift sayım düzeltmesi, F3).
            suppressedCount: { increment: suppressed },
          },
        });
        return opened;
      }
      for (const row of batch) {
        const r = await this.enqueueFor(c, row.userId, `campaign:${c.id}`).catch((e) => {
          this.logger.warn(`Kampanya ${c.id} kullanıcı ${row.userId}: ${(e as Error).message}`);
          return { status: 'dropped' as const, reason: 'error' };
        });
        if (r.status !== 'queued' && r.status !== 'inbox_only') suppressed++;
        opened++;
        cursor = row.userId;
      }
      await this.prisma.notificationCampaign.update({
        where: { id: c.id },
        data: {
          materializeCursor: cursor,
          materializedRecipients: { increment: batch.length },
          suppressedCount: { increment: suppressed },
        },
      });
      suppressed = 0;
    }
    return opened;
  }

  /** Teslimleri bitmiş, kitlesi açılmış kampanyaları `sent` yapar ve sayaçları günceller. */
  async settle() {
    const sending = await this.prisma.notificationCampaign.findMany({
      where: { status: 'sending', materializedAt: { not: null } },
      select: { id: true },
    });
    for (const { id } of sending) {
      const [pending, sent, failed] = await Promise.all([
        this.prisma.notificationDelivery.count({
          where: { status: { in: ['queued', 'sending'] }, notification: { campaignId: id } },
        }),
        this.prisma.notificationDelivery.count({
          where: { status: 'sent', notification: { campaignId: id } },
        }),
        this.prisma.notificationDelivery.count({
          where: { status: 'failed', notification: { campaignId: id } },
        }),
      ]);
      await this.prisma.notificationCampaign.update({
        where: { id },
        data: {
          sentCount: sent,
          failedCount: failed,
          ...(pending === 0 ? { status: 'sent', completedAt: new Date() } : {}),
        },
      });
    }
  }

  async analytics(id: string) {
    const c = await this.get(id);
    const [byStatus, opened, clicked, converted, byPlatform] = await Promise.all([
      this.prisma.notificationDelivery.groupBy({
        by: ['channel', 'status'],
        where: { notification: { campaignId: id } },
        _count: { _all: true },
      }),
      this.prisma.notification.count({ where: { campaignId: id, openedAt: { not: null } } }),
      this.prisma.notification.count({ where: { campaignId: id, clickedAt: { not: null } } }),
      this.prisma.notification.count({ where: { campaignId: id, convertedAt: { not: null } } }),
      this.prisma.$queryRaw<{ platform: string | null; n: number }[]>`
        SELECT p.platform, count(*)::int AS n FROM notification_deliveries d
        JOIN notifications n ON n.id = d.notification_id LEFT JOIN push_tokens p ON p.token = d.target
        WHERE n.campaign_id = ${id}::uuid AND d.channel = 'push' AND d.status = 'sent' GROUP BY p.platform`,
    ]);
    const suppression = await this.prisma.notificationDelivery.groupBy({
      by: ['suppressionReason'],
      where: { notification: { campaignId: id }, status: 'suppressed' },
      _count: { _all: true },
    });
    const variantStats = await Promise.all(
      c.variants.map(async (v) => {
        const base = { campaignId: id, variantId: v.id };
        const [total, sent, opened, clicked, converted] = await Promise.all([
          this.prisma.notification.count({ where: base }),
          this.prisma.notificationDelivery.count({ where: { status: 'sent', notification: base } }),
          this.prisma.notification.count({ where: { ...base, openedAt: { not: null } } }),
          this.prisma.notification.count({ where: { ...base, clickedAt: { not: null } } }),
          this.prisma.notification.count({ where: { ...base, convertedAt: { not: null } } }),
        ]);
        return {
          id: v.id,
          key: v.key,
          weight: v.weight,
          title: v.title,
          total,
          sent,
          opened,
          clicked,
          converted,
        };
      }),
    );
    return {
      campaign: c,
      variants: variantStats,
      deliveries: byStatus.map((r) => ({
        channel: r.channel,
        status: r.status,
        count: r._count._all,
      })),
      opened,
      clicked,
      converted,
      platforms: byPlatform,
      suppression: suppression.map((s) => ({ reason: s.suppressionReason, count: s._count._all })),
    };
  }

  /** Eski üreticiler (deneme yayın duyurusu, admin formu) için tek adımlı gönderim. */
  async quickSend(
    input: {
      name: string;
      category: UpsertCampaignDto['category'];
      title: string;
      body: string;
      deepLink?: DeepLink;
      channels?: NotificationChannel[];
      audienceMode?: 'all' | 'segment';
      segmentRules?: unknown;
      priority?: UpsertCampaignDto['priority'];
    },
    actor: AuthenticatedUser,
  ) {
    const c = await this.create(
      {
        name: input.name,
        category: input.category,
        title: input.title,
        body: input.body,
        deepLink: input.deepLink,
        channels: input.channels,
        audienceMode: input.audienceMode ?? 'all',
        segmentRules: input.segmentRules,
        sendMode: 'now',
        priority: input.priority,
      } as UpsertCampaignDto,
      actor,
    );
    const est = await this.estimate({ ...c, channels: c.channels });
    return this.transition(c.id, 'send_now', actor, est.total);
  }
}
