import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationEventSource,
  NotificationEventType,
  NotificationPriority,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { DecisionService } from './decision.service';
import { allowedChannels, ALL_CATEGORIES, CATEGORY_POLICY } from './notification.categories';
import { NOTIFICATIONS_CONFIG } from './notifications.config';
import { resolveDeepLink, webPathFromRoute, type DeepLink } from './deep-links';
import { fillTemplate, firstName, templateWarnings, type TemplateVars } from './template';

export type EnqueueInput = {
  userId: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  /** Hedef kayıt defterinden (tercih edilen) ya da eski rota dizgesi. */
  deepLink?: DeepLink | null;
  route?: string | null;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
  /** (userId, dedupeKey) tekil; tekrar girişte 'duplicate' düşer. */
  dedupeKey?: string | null;
  campaignId?: string | null;
  variantId?: string | null;
  templateId?: string | null;
  automationCode?: string | null;
  conversionEvent?: string | null;
  attributionWindowHours?: number;
  respectQuietHours?: boolean;
  countTowardCaps?: boolean;
  ttlHours?: number;
  cooldownActive?: boolean;
  /** Şablon değişkenleri; `ad` verilmezse kullanıcının adından doldurulur. */
  variables?: TemplateVars;
  emailSubject?: string | null;
  emailBody?: string | null;
  now?: Date;
};

export type EnqueueResult =
  | { status: 'dropped'; reason: string }
  | {
      status: 'queued' | 'inbox_only' | 'suppressed';
      notificationId: string;
      channels: Record<string, string>;
      scheduledAt: Date;
    };

const touched = new Map<string, number>();

/**
 * Tek giriş noktası (Doc 52 §2): her bildirim burada doğar, karar akışından
 * geçer, kutu satırı + teslim satırları tek işlemde yazılır. Gönderilmeyen
 * de nedeniyle iz bırakır. PushService/SES doğrudan çağrılmaz.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decision: DecisionService,
  ) {}

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    const now = input.now ?? new Date();
    const priority = input.priority ?? 'normal';
    const channels = allowedChannels(input.category, input.channels);
    const requested =
      input.channels && input.channels.length
        ? input.channels
        : [...CATEGORY_POLICY[input.category].channels];
    if (channels.length === 0 && !requested.includes('inbox')) {
      return { status: 'dropped', reason: 'channel_policy' };
    }
    const { decision, ctx } = await this.decision.decideFor(
      input.userId,
      {
        category: input.category,
        priority,
        channels: requested,
        respectQuietHours: input.respectQuietHours ?? true,
        countTowardCaps: input.countTowardCaps ?? true,
        ttlHours: input.ttlHours ?? 24,
        cooldownActive: input.cooldownActive ?? false,
      },
      input.dedupeKey ?? null,
      now,
    );
    if (decision.dropAll) return { status: 'dropped', reason: decision.dropAll };
    if (!ctx.user) return { status: 'dropped', reason: 'account_inactive' };

    const vars: TemplateVars = { ad: firstName(ctx.user.displayName), ...(input.variables ?? {}) };
    const title = fillTemplate(input.title, vars).trim();
    const body = fillTemplate(input.body, vars).trim();
    const hard = templateWarnings(title, body).filter(
      (w) => w.code === 'emoji' || w.code === 'forbidden',
    );
    if (hard.length) throw new BadRequestException(hard.map((w) => w.message).join(' '));

    let route: string | null = null;
    let webPath: string | null = null;
    let minAppVersion: string | null = null;
    if (input.deepLink) {
      const r = resolveDeepLink(input.deepLink);
      route = r.route;
      webPath = r.webPath;
      minAppVersion = r.minAppVersion;
    } else if (input.route != null) {
      route = input.route;
      webPath = webPathFromRoute(input.route);
    }

    const sendPush =
      decision.channels.push?.action === 'send' || decision.channels.push?.action === 'defer';
    const sendEmail =
      decision.channels.email?.action === 'send' || decision.channels.email?.action === 'defer';
    const effectiveChannels: NotificationChannel[] = [];
    if (decision.inbox) effectiveChannels.push('inbox');
    if (requested.includes('push') && CATEGORY_POLICY[input.category].channels.includes('push'))
      effectiveChannels.push('push');
    if (requested.includes('email') && CATEGORY_POLICY[input.category].channels.includes('email'))
      effectiveChannels.push('email');

    const anyDelivery = sendPush || sendEmail;
    const pushDropped =
      decision.channels.push?.action === 'drop' ? decision.channels.push.reason : null;
    const deliveryStatus = anyDelivery
      ? 'queued'
      : pushDropped === 'no_device' && !sendEmail
        ? 'no_device'
        : decision.inbox
          ? 'sent'
          : 'suppressed';
    const suppressionReason = anyDelivery
      ? null
      : (Object.values(decision.channels).find(
          (c) => c?.action === 'drop' && c.reason !== 'channel_policy',
        )?.['reason' as never] ?? null);
    if (!anyDelivery && !decision.inbox) {
      // Hiçbir kanal gitmiyor ve kutu da yok: yalnız iz (suppressed satırı) — analiz "neden gitmedi" sorusuna cevap verir.
    }

    const data: Record<string, unknown> = {
      ...(input.data ?? {}),
      ...(input.deepLink
        ? { target: input.deepLink.target, params: input.deepLink.params ?? {} }
        : {}),
      ...(minAppVersion ? { minAppVersion } : {}),
      ...(input.emailSubject ? { emailSubject: fillTemplate(input.emailSubject, vars) } : {}),
      ...(input.emailBody ? { emailBody: fillTemplate(input.emailBody, vars) } : {}),
    };
    const ttlHours = input.ttlHours ?? 24;

    const created = await this.prisma.$transaction(async (tx) => {
      const n = await tx.notification.create({
        data: {
          userId: input.userId,
          category: input.category,
          priority: decision.priority,
          title,
          body,
          imageUrl: input.imageUrl ?? null,
          ctaLabel: input.ctaLabel ?? null,
          route,
          webPath,
          data: data as Prisma.InputJsonValue,
          channels: effectiveChannels,
          campaignId: input.campaignId ?? null,
          variantId: input.variantId ?? null,
          templateId: input.templateId ?? null,
          automationCode: input.automationCode ?? null,
          dedupeKey: input.dedupeKey ?? null,
          conversionEvent: input.conversionEvent ?? null,
          attributionUntil: input.conversionEvent
            ? new Date(now.getTime() + (input.attributionWindowHours ?? 24) * 3_600_000)
            : null,
          scheduledAt: decision.scheduledAt,
          expiresAt: new Date(decision.scheduledAt.getTime() + ttlHours * 3_600_000),
          deliveryStatus,
          suppressionReason: suppressionReason as string | null,
        },
        select: { id: true },
      });
      const rows: Prisma.NotificationDeliveryCreateManyInput[] = [];
      const pushDec = decision.channels.push;
      if (sendPush && pushDec) {
        const at = pushDec.action === 'defer' ? pushDec.until : now;
        for (const t of ctx.activeTokens)
          rows.push({
            notificationId: n.id,
            userId: input.userId,
            channel: 'push',
            target: t.token,
            nextAttemptAt: at,
          });
      }
      const emailDec = decision.channels.email;
      if (sendEmail && emailDec) {
        const at = emailDec.action === 'defer' ? emailDec.until : now;
        rows.push({
          notificationId: n.id,
          userId: input.userId,
          channel: 'email',
          target: ctx.user!.email,
          nextAttemptAt: at,
        });
      }
      // Bastırılan kanallar da iz bırakır (teslim geçmişi "neden gitmedi" sorusuna cevap verir).
      for (const ch of ['push', 'email'] as const) {
        const d = decision.channels[ch];
        if (d?.action === 'drop' && d.reason !== 'channel_policy' && requested.includes(ch))
          rows.push({
            notificationId: n.id,
            userId: input.userId,
            channel: ch,
            target: `—${ch}`,
            status: 'suppressed',
            suppressionReason: d.reason,
          });
      }
      if (rows.length)
        await tx.notificationDelivery.createMany({ data: rows, skipDuplicates: true });
      return n;
    });

    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(decision.channels))
      if (v) out[k] = v.action === 'drop' ? `drop:${v.reason}` : v.action;
    return {
      status: anyDelivery ? 'queued' : decision.inbox ? 'inbox_only' : 'suppressed',
      notificationId: created.id,
      channels: out,
      scheduledAt: decision.scheduledAt,
    };
  }

  // ── Aday kutusu ──

  async inbox(userId: string, q: { cursor?: string; limit?: number; unreadOnly?: boolean }) {
    const limit = Math.min(Math.max(q.limit ?? 30, 1), 100);
    const now = new Date();
    const where: Prisma.NotificationWhereInput = {
      userId,
      channels: { has: 'inbox' },
      scheduledAt: { lte: now },
      dismissedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(now.getTime() - 180 * 86_400_000) } }],
      ...(q.unreadOnly ? { readAt: null } : {}),
    };
    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: [{ scheduledAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        category: true,
        priority: true,
        title: true,
        body: true,
        imageUrl: true,
        ctaLabel: true,
        route: true,
        webPath: true,
        data: true,
        readAt: true,
        openedAt: true,
        scheduledAt: true,
        createdAt: true,
      },
    });
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? items[items.length - 1].id : null };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        channels: { has: 'inbox' },
        readAt: null,
        dismissedAt: null,
        scheduledAt: { lte: new Date() },
      },
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true, readAt: true },
    });
    if (!n) throw new NotFoundException('Bildirim bulunamadı.');
    if (!n.readAt) {
      await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
      await this.prisma.notificationEvent.create({
        data: { notificationId: id, userId, eventType: 'read', source: 'inbox' },
      });
    }
    return { ok: true };
  }

  async readAll(userId: string) {
    const r = await this.prisma.notification.updateMany({
      where: { userId, readAt: null, channels: { has: 'inbox' } },
      data: { readAt: new Date() },
    });
    return { ok: true, count: r.count };
  }

  /** opened: push dokunma · clicked: hedefe gidildi · dismissed: kutuda "kapat". */
  async recordEvent(
    userId: string,
    id: string,
    ev: {
      type: NotificationEventType;
      source: NotificationEventSource;
      platform?: string;
      appVersion?: string;
      payload?: Record<string, unknown>;
    },
  ) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true, openedAt: true, clickedAt: true, dismissedAt: true, readAt: true },
    });
    if (!n) throw new NotFoundException('Bildirim bulunamadı.');
    if (ev.type === 'converted') throw new BadRequestException('Dönüşüm olayını sunucu üretir.');
    const now = new Date();
    const data: Prisma.NotificationUpdateInput = {};
    if (ev.type === 'opened' && !n.openedAt) data.openedAt = now;
    if (ev.type === 'clicked' && !n.clickedAt) data.clickedAt = now;
    if (ev.type === 'dismissed' && !n.dismissedAt) data.dismissedAt = now;
    if ((ev.type === 'opened' || ev.type === 'clicked' || ev.type === 'read') && !n.readAt)
      data.readAt = now;
    await this.prisma.$transaction([
      this.prisma.notification.update({ where: { id }, data }),
      this.prisma.notificationEvent.create({
        data: {
          notificationId: id,
          userId,
          eventType: ev.type,
          source: ev.source,
          platform: ev.platform,
          appVersion: ev.appVersion,
          payload: (ev.payload ?? undefined) as Prisma.InputJsonValue | undefined,
          occurredAt: now,
        },
      }),
    ]);
    return { ok: true };
  }

  /** Dönüşüm atfı (son dokunuş, §7 attribution): ilgili servis olay adıyla çağırır. */
  async attribute(userId: string, conversionEvent: string): Promise<boolean> {
    const now = new Date();
    const n = await this.prisma.notification.findFirst({
      where: {
        userId,
        conversionEvent,
        convertedAt: null,
        attributionUntil: { gt: now },
        deliveryStatus: { in: ['sent', 'queued'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!n) return false;
    await this.prisma.$transaction([
      this.prisma.notification.update({ where: { id: n.id }, data: { convertedAt: now } }),
      this.prisma.notificationEvent.create({
        data: {
          notificationId: n.id,
          userId,
          eventType: 'converted',
          source: 'inbox',
          occurredAt: now,
        },
      }),
    ]);
    return true;
  }

  // ── Tercihler ──

  async settings(userId: string) {
    const s = await this.prisma.userNotificationSettings.findUnique({ where: { userId } });
    const cats = (s?.categories as Record<string, boolean>) ?? {};
    const categories = Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c, CATEGORY_POLICY[c].optional ? cats[c] !== false : true]),
    );
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
      select: { platform: true, lastSeenAt: true },
    });
    return {
      categories,
      reminderTime: s?.reminderTime ?? '19:00',
      quietStart: s?.quietStart ?? '23:00',
      quietEnd: s?.quietEnd ?? '08:00',
      timezone: s?.timezone ?? 'Europe/Istanbul',
      pushEnabled: s?.pushEnabled ?? true,
      smartTimingEnabled: s?.smartTimingEnabled ?? true,
      devices: tokens,
      policy: Object.fromEntries(
        ALL_CATEGORIES.map((c) => [
          c,
          {
            label: CATEGORY_POLICY[c].label,
            optional: CATEGORY_POLICY[c].optional,
            channels: CATEGORY_POLICY[c].channels,
          },
        ]),
      ),
    };
  }

  async updateSettings(
    userId: string,
    patch: {
      categories?: Record<string, boolean>;
      reminderTime?: string;
      quietStart?: string;
      quietEnd?: string;
      pushEnabled?: boolean;
      smartTimingEnabled?: boolean;
    },
  ) {
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const k of ['reminderTime', 'quietStart', 'quietEnd'] as const)
      if (patch[k] != null && !hhmm.test(patch[k]!))
        throw new BadRequestException(`${k} HH:MM biçiminde olmalı.`);
    const current = await this.prisma.userNotificationSettings.findUnique({ where: { userId } });
    const cats = { ...((current?.categories as Record<string, boolean>) ?? {}) };
    for (const [k, v] of Object.entries(patch.categories ?? {})) {
      if (!ALL_CATEGORIES.includes(k as NotificationCategory))
        throw new BadRequestException(`Bilinmeyen kategori: ${k}`);
      if (!CATEGORY_POLICY[k as NotificationCategory].optional && v === false)
        throw new BadRequestException(
          `${CATEGORY_POLICY[k as NotificationCategory].label} kapatılamaz.`,
        );
      cats[k] = !!v;
    }
    await this.prisma.userNotificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        categories: cats,
        reminderTime: patch.reminderTime ?? '19:00',
        quietStart: patch.quietStart ?? '23:00',
        quietEnd: patch.quietEnd ?? '08:00',
        pushEnabled: patch.pushEnabled ?? true,
        smartTimingEnabled: patch.smartTimingEnabled ?? true,
      },
      update: {
        categories: cats,
        ...(patch.reminderTime != null ? { reminderTime: patch.reminderTime } : {}),
        ...(patch.quietStart != null ? { quietStart: patch.quietStart } : {}),
        ...(patch.quietEnd != null ? { quietEnd: patch.quietEnd } : {}),
        ...(patch.pushEnabled != null ? { pushEnabled: patch.pushEnabled } : {}),
        ...(patch.smartTimingEnabled != null
          ? { smartTimingEnabled: patch.smartTimingEnabled }
          : {}),
      },
    });
    return this.settings(userId);
  }

  /** `last_active_at`: uygulama açılışında saatte en çok bir yazım (süreç içi kısıt). */
  async touchLastActive(userId: string): Promise<{ ok: true; touched: boolean }> {
    const last = touched.get(userId) ?? 0;
    const now = Date.now();
    if (now - last < NOTIFICATIONS_CONFIG.touchThrottleMs) return { ok: true, touched: false };
    touched.set(userId, now);
    await this.prisma.user
      .update({ where: { id: userId }, data: { lastActiveAt: new Date(now) } })
      .catch(() => undefined);
    return { ok: true, touched: true };
  }
}
