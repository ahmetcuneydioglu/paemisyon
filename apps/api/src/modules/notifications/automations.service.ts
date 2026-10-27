import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  NotificationAutomationStatus,
  Prisma,
  type NotificationAutomation,
  type NotificationChannel,
  type NotificationPriority,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuditService } from '../admin/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { EMAIL_CONFIG } from '../email/email.config';
import { maskEmail } from '../email/email-contacts.service';
import {
  automationVars,
  parseSchedule,
  resolveAutomationLink,
  scheduleDue,
  scheduleSummary,
  effectiveReminderTime,
  trDayKey,
  userTimeTarget,
} from './automation.logic';
import { AUTOMATION_PRESETS, PRESET_BY_CODE, type AutomationPreset } from './automation.presets';
import { isDeepLinkTarget, resolveDeepLink } from './deep-links';
import { allowedChannels, CATEGORY_POLICY } from './notification.categories';
import { notificationsWorkerEnabled } from './notifications.config';
import { NotificationsService } from './notifications.service';
import { rulesSummary, rulesToWhere, validateRules, type Group } from './segment-dsl';
import { fillTemplate, firstName, templateWarnings } from './template';

type Counts = { evaluated: number; matched: number; queued: number; suppressed: number };
type EventRow = {
  id: bigint;
  user_id: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
};

const BATCH = 250;
const MAX_PER_RUN = 20_000;
const EVENTS_PER_SWEEP = 300;
const MAX_CONSECUTIVE_ERRORS = 3;

export type UpdateAutomationInput = {
  name?: string;
  description?: string | null;
  title?: string;
  body?: string;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  deepLink?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  conditions?: Record<string, unknown> | null;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  delayMinutes?: number;
  cooldownHours?: number;
  maxPerUserPerDay?: number;
  respectQuietHours?: boolean;
  countTowardCaps?: boolean;
  ttlHours?: number;
  conversionEvent?: string | null;
};

/**
 * Otomasyon değerlendiricisi (Doc 52 §4.4, §8). Dakikada bir: zamanlı otomasyonlar için vade,
 * olay otomasyonları için yeni `AppEvent` satırları; her koşu `NotificationAutomationRun`
 * olarak kaydedilir; her gönderim `NotificationsService.enqueue` ile karar akışından geçer.
 * Hazır set koddan tohumlanır (kapalı doğar); açılış anından önceki olaylar işlenmiş sayılır.
 * Üç üst üste hata otomasyonu duraklatır. Tek `running` kilidi (pooler disiplini).
 */
@Injectable()
export class AutomationsService implements OnModuleInit {
  private readonly logger = new Logger(AutomationsService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.seed().catch((e) =>
      this.logger.error(`Otomasyon seti tohumlanamadı: ${(e as Error).message}`),
    );
  }

  /** Eksik preset satırlarını ekler; panelde düzenlenmiş mevcut satırlara dokunmaz. */
  async seed(): Promise<number> {
    const existing = new Set(
      (await this.prisma.notificationAutomation.findMany({ select: { code: true } })).map(
        (r) => r.code,
      ),
    );
    let added = 0;
    for (const p of AUTOMATION_PRESETS) {
      if (existing.has(p.code)) continue;
      await this.prisma.notificationAutomation.create({ data: this.presetData(p) });
      added++;
    }
    if (added) this.logger.log(`Otomasyon seti: ${added} yeni preset eklendi.`);
    return added;
  }

  private presetData(p: AutomationPreset): Prisma.NotificationAutomationCreateInput {
    return {
      code: p.code,
      name: p.name,
      description: p.description,
      category: p.category,
      priority: p.priority,
      channels: p.channels,
      triggerType: p.triggerType,
      schedule: (p.schedule ?? {}) as Prisma.InputJsonValue,
      eventType: p.eventType ?? null,
      delayMinutes: p.delayMinutes ?? 0,
      conditions: (p.conditions ?? {}) as Prisma.InputJsonValue,
      title: p.title,
      body: p.body,
      ctaLabel: p.ctaLabel ?? null,
      deepLink: p.deepLink as unknown as Prisma.InputJsonValue,
      emailSubject: p.emailSubject ?? null,
      emailBody: p.emailBody ?? null,
      conversionEvent: p.conversionEvent ?? null,
      attributionWindowHours: p.attributionWindowHours ?? 24,
      cooldownHours: p.cooldownHours,
      maxPerUserPerDay: p.maxPerUserPerDay,
      respectQuietHours: p.respectQuietHours,
      countTowardCaps: p.countTowardCaps ?? true,
      ttlHours: p.ttlHours,
      status: p.initialStatus,
      activatedAt: p.initialStatus === 'active' ? new Date() : null,
    };
  }

  // ── Değerlendirici ──

  @Cron('* * * * *')
  async tick() {
    if (!notificationsWorkerEnabled()) return;
    await this.sweep(new Date());
  }

  /** Bir tur: atıf + zamanlı + olaylı. Panelden de çağrılır (`worker/tick`). */
  async sweep(now = new Date()): Promise<{ automations: number; attributed: number }> {
    if (this.running) return { automations: 0, attributed: 0 };
    this.running = true;
    try {
      const attributed = await this.attributeNewEvents(now).catch((e) => {
        this.logger.warn(`Atıf turu: ${(e as Error).message}`);
        return 0;
      });
      const active = await this.prisma.notificationAutomation.findMany({
        where: { status: 'active' },
        orderBy: { code: 'asc' },
      });
      let n = 0;
      for (const a of active) {
        try {
          const ran =
            a.triggerType === 'schedule'
              ? await this.runSchedule(a, now, {})
              : await this.runEvents(a, now, {});
          if (ran) n++;
        } catch (e) {
          await this.recordError(a, (e as Error).message);
        }
      }
      return { automations: n, attributed };
    } finally {
      this.running = false;
    }
  }

  /** Dönüşüm atfı (§7): yeni olaylar `conversionEvent` eşleşen son bildirime yazılır; olay damgalanır. */
  private async attributeNewEvents(now: Date): Promise<number> {
    const rows = await this.prisma.appEvent.findMany({
      where: { processedAt: null },
      orderBy: { id: 'asc' },
      take: 500,
      select: { id: true, userId: true, eventType: true },
    });
    if (rows.length === 0) return 0;
    let hits = 0;
    for (const r of rows) {
      if (await this.notifications.attribute(r.userId, r.eventType).catch(() => false)) hits++;
    }
    await this.prisma.appEvent.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { processedAt: now },
    });
    return hits;
  }

  private async recordError(a: NotificationAutomation, message: string) {
    const errors = a.consecutiveErrors + 1;
    const pause = errors >= MAX_CONSECUTIVE_ERRORS;
    this.logger.error(`Otomasyon ${a.code}: ${message}${pause ? ' — duraklatıldı' : ''}`);
    await this.prisma.notificationAutomation.update({
      where: { id: a.id },
      data: {
        consecutiveErrors: errors,
        lastError: message.slice(0, 500),
        ...(pause ? { status: 'paused' } : {}),
      },
    });
    await this.prisma.notificationAutomationRun.create({
      data: {
        automationId: a.id,
        triggerType: a.triggerType,
        finishedAt: new Date(),
        error: message.slice(0, 500),
      },
    });
  }

  private baseWhere(a: NotificationAutomation): Prisma.NotificationAudienceWhereInput {
    const conditions = a.conditions as unknown;
    const hasRules =
      conditions && typeof conditions === 'object' && Array.isArray((conditions as Group).rules);
    return {
      accountActive: true,
      ...(hasRules ? rulesToWhere(validateRules(conditions)) : {}),
    };
  }

  /** Zamanlı otomasyon: vadesi geldiyse kitleyi süzer ve parti parti kuyruğa verir. */
  async runSchedule(
    a: NotificationAutomation,
    now: Date,
    opts: { force?: boolean; dryRun?: boolean },
  ): Promise<Counts | null> {
    const schedule = parseSchedule(a.schedule);
    if (!schedule) throw new Error('Takvim tanımsız.');
    const due = scheduleDue(schedule, a.lastRunAt, now);
    if (!due.due && !opts.force) return null;
    const dayKey = trDayKey(now);
    const where = this.baseWhere(a);

    if (schedule.kind === 'user_time') {
      const target = userTimeTarget(now, schedule.offsetMinutes);
      const [settings, smartRows] = await Promise.all([
        this.prisma.userNotificationSettings.findMany({
          select: { userId: true, reminderTime: true, smartTimingEnabled: true },
        }),
        // Akıllı saat (F3): en iyi saati bilinenler; tercih satırı yoksa akıllı saat açık sayılır.
        target.endsWith(':00')
          ? this.prisma.notificationAudience.findMany({
              where: { bestEngagementHour: Number(target.slice(0, 2)) },
              select: { userId: true },
            })
          : Promise.resolve([] as { userId: string }[]),
      ]);
      const best = new Map<string, number>();
      for (const r of smartRows) best.set(r.userId, Number(target.slice(0, 2)));
      const smartUsers = new Set(smartRows.map((r) => r.userId));
      const match = settings
        .filter(
          (s) =>
            effectiveReminderTime(
              s.reminderTime,
              s.smartTimingEnabled,
              best.get(s.userId) ?? null,
            ) === target,
        )
        .map((s) => s.userId);
      const withSettings = new Set(settings.map((s) => s.userId));
      // Tercih satırı olmayanlar: en iyi saati biliniyorsa o saat, yoksa 19:00.
      const smartDefault = [...smartUsers].filter((u) => !withSettings.has(u));
      if (target === '19:00') {
        where.OR = [
          { userId: { in: match } },
          { userId: { notIn: [...withSettings, ...smartUsers] } },
        ];
      } else if (smartDefault.length) {
        where.userId = { in: [...match, ...smartDefault] };
      } else {
        if (match.length === 0 && !opts.force) {
          if (!opts.dryRun)
            await this.prisma.notificationAutomation.update({
              where: { id: a.id },
              data: { lastRunAt: due.fireAt ?? now },
            });
          return null;
        }
        where.userId = { in: match };
      }
    }

    const counts: Counts = { evaluated: 0, matched: 0, queued: 0, suppressed: 0 };
    const startedAt = new Date();
    let cursor: string | null = null;
    while (counts.evaluated < MAX_PER_RUN) {
      const batch: { userId: string }[] = await this.prisma.notificationAudience.findMany({
        where,
        select: { userId: true },
        orderBy: { userId: 'asc' },
        take: BATCH,
        ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
      });
      if (batch.length === 0) break;
      cursor = batch[batch.length - 1].userId;
      counts.evaluated += batch.length;
      counts.matched += batch.length;
      const ids = batch.map((b) => b.userId);
      const cooled = await this.cooledDown(a, ids, now);
      for (const userId of ids) {
        if (cooled.has(userId)) {
          counts.suppressed++;
          continue;
        }
        if (opts.dryRun) {
          counts.queued++;
          continue;
        }
        const r = await this.enqueueFor(a, userId, {}, dayKey, now);
        if (r === 'queued') counts.queued++;
        else counts.suppressed++;
      }
      if (batch.length < BATCH) break;
    }
    if (!opts.dryRun) {
      await this.prisma.$transaction([
        this.prisma.notificationAutomationRun.create({
          data: {
            automationId: a.id,
            triggerType: 'schedule',
            startedAt,
            finishedAt: new Date(),
            ...counts,
          },
        }),
        this.prisma.notificationAutomation.update({
          where: { id: a.id },
          data: { lastRunAt: due.fireAt ?? now, consecutiveErrors: 0, lastError: null },
        }),
      ]);
    }
    return counts;
  }

  /** Olay otomasyonu: açılıştan sonraki, vadesi gelmiş, bu otomasyonun görmediği olaylar. */
  async runEvents(
    a: NotificationAutomation,
    now: Date,
    opts: { dryRun?: boolean; limit?: number },
  ): Promise<Counts | null> {
    if (!a.eventType) throw new Error('Olay türü tanımsız.');
    const preset = PRESET_BY_CODE.get(a.code);
    const since = a.activatedAt ?? a.createdAt;
    const dueBefore = new Date(now.getTime() - a.delayMinutes * 60_000);
    const limit = opts.limit ?? EVENTS_PER_SWEEP;
    const events = await this.prisma.$queryRaw<EventRow[]>`
      SELECT e.id, e.user_id, e.payload, e.occurred_at
      FROM app_events e
      WHERE e.event_type = ${a.eventType}
        AND e.occurred_at >= ${since}
        AND e.occurred_at <= ${dueBefore}
        AND NOT EXISTS (
          SELECT 1 FROM notification_automation_events x
          WHERE x.automation_id = ${a.id}::uuid AND x.event_id = e.id
        )
      ORDER BY e.id ASC
      LIMIT ${limit}`;
    if (events.length === 0) return null;

    const counts: Counts = { evaluated: events.length, matched: 0, queued: 0, suppressed: 0 };
    const startedAt = new Date();
    const dayKey = trDayKey(now);
    const where = this.baseWhere(a);
    const outcomes: { eventId: bigint; outcome: string }[] = [];
    for (const ev of events) {
      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      let outcome: string;
      if (preset?.when && !preset.when(payload)) outcome = 'filtered';
      else if (preset?.broadcast) {
        // Yayın olayı: koşulu sağlayan bütün kitleye (dedupe anahtarı olay başına tekil).
        const b = await this.broadcast(a, payload, where, dayKey, now, opts.dryRun ?? false);
        counts.matched += b.matched;
        counts.queued += b.queued;
        counts.suppressed += b.suppressed;
        outcome = `broadcast:${b.queued}/${b.matched}`;
      } else {
        const audience = await this.prisma.notificationAudience.findFirst({
          where: { ...where, userId: ev.user_id },
          select: { userId: true },
        });
        if (!audience) outcome = 'conditions';
        else if ((await this.cooledDown(a, [ev.user_id], now)).has(ev.user_id))
          outcome = 'cooldown';
        else {
          counts.matched++;
          outcome = opts.dryRun
            ? 'dry_run'
            : await this.enqueueFor(a, ev.user_id, payload, dayKey, now, ev.id);
        }
      }
      if (outcome === 'queued' || outcome === 'dry_run') counts.queued++;
      else if (outcome !== 'filtered' && outcome !== 'conditions') counts.suppressed++;
      outcomes.push({ eventId: ev.id, outcome });
    }
    if (!opts.dryRun) {
      await this.prisma.$transaction([
        this.prisma.notificationAutomationEvent.createMany({
          data: outcomes.map((o) => ({
            automationId: a.id,
            eventId: o.eventId,
            outcome: o.outcome,
          })),
          skipDuplicates: true,
        }),
        this.prisma.notificationAutomationRun.create({
          data: {
            automationId: a.id,
            triggerType: 'event',
            startedAt,
            finishedAt: new Date(),
            ...counts,
          },
        }),
        this.prisma.notificationAutomation.update({
          where: { id: a.id },
          data: { lastRunAt: now, consecutiveErrors: 0, lastError: null },
        }),
      ]);
    }
    return counts;
  }

  /** Yayın olayını kitleye açar (kampanya materialize kalıbı: parti parti, tek cooldown sorgusu). */
  private async broadcast(
    a: NotificationAutomation,
    payload: Record<string, unknown>,
    where: Prisma.NotificationAudienceWhereInput,
    dayKey: string,
    now: Date,
    dryRun: boolean,
  ): Promise<Counts> {
    const counts: Counts = { evaluated: 0, matched: 0, queued: 0, suppressed: 0 };
    let cursor: string | null = null;
    while (counts.matched < MAX_PER_RUN) {
      const batch: { userId: string }[] = await this.prisma.notificationAudience.findMany({
        where,
        select: { userId: true },
        orderBy: { userId: 'asc' },
        take: BATCH,
        ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
      });
      if (batch.length === 0) break;
      cursor = batch[batch.length - 1].userId;
      counts.evaluated += batch.length;
      counts.matched += batch.length;
      const ids = batch.map((b) => b.userId);
      const cooled = await this.cooledDown(a, ids, now);
      for (const userId of ids) {
        if (cooled.has(userId)) {
          counts.suppressed++;
          continue;
        }
        if (dryRun) {
          counts.queued++;
          continue;
        }
        const r = await this.enqueueFor(a, userId, payload, dayKey, now);
        if (r === 'queued') counts.queued++;
        else counts.suppressed++;
      }
      if (batch.length < BATCH) break;
    }
    return counts;
  }

  /** Cooldown: aynı otomasyondan `cooldownHours` içinde bildirim almış kullanıcılar. */
  private async cooledDown(a: NotificationAutomation, userIds: string[], now: Date) {
    if (a.cooldownHours <= 0 || userIds.length === 0) return new Set<string>();
    const rows = await this.prisma.notification.findMany({
      where: {
        automationCode: a.code,
        userId: { in: userIds },
        createdAt: { gte: new Date(now.getTime() - a.cooldownHours * 3_600_000) },
        deliveryStatus: { in: ['queued', 'sent'] },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    return new Set(rows.map((r) => r.userId));
  }

  private async enqueueFor(
    a: NotificationAutomation,
    userId: string,
    payload: Record<string, unknown>,
    dayKey: string,
    now: Date,
    eventId?: bigint,
  ): Promise<string> {
    const preset = PRESET_BY_CODE.get(a.code);
    const audience = await this.prisma.notificationAudience.findUnique({
      where: { userId },
      select: {
        streakCurrent: true,
        examDaysLeft: true,
        answered7d: true,
        accuracy30d: true,
        dailyGoal: true,
        answeredToday: true,
        weakTopicIds: true,
      },
    });
    if (preset?.enrich) {
      const extra = await preset.enrich({ prisma: this.prisma, userId, audience });
      if (!extra) return 'no_payload';
      payload = { ...payload, ...extra };
    }
    const link = resolveAutomationLink(a.deepLink as Record<string, unknown>, payload);
    if (!link) return 'no_link';
    const resolved = resolveDeepLink(link);
    const vars = automationVars(
      audience,
      payload,
      `${EMAIL_CONFIG.publicBaseUrl}${resolved.webPath}`,
    );
    const dedupeKey = preset?.dedupe
      ? preset.dedupe(payload, dayKey)
      : eventId != null
        ? `${a.code}:${eventId.toString()}`
        : `${a.code}:${dayKey}`;
    const r = await this.notifications.enqueue({
      userId,
      category: a.category,
      priority: a.priority,
      title: a.title,
      body: a.body,
      ctaLabel: a.ctaLabel,
      imageUrl: a.imageUrl,
      deepLink: link,
      channels: a.channels,
      dedupeKey,
      automationCode: a.code,
      templateId: a.templateId,
      conversionEvent: a.conversionEvent,
      attributionWindowHours: a.attributionWindowHours,
      respectQuietHours: a.respectQuietHours,
      countTowardCaps: a.countTowardCaps,
      ttlHours: a.ttlHours,
      variables: vars,
      emailSubject: a.emailSubject,
      emailBody: a.emailBody,
      data: { automation: a.code, ...(eventId != null ? { eventId: eventId.toString() } : {}) },
      now,
    });
    if (r.status === 'dropped') return `dropped:${r.reason}`;
    return r.status === 'suppressed' ? 'suppressed' : 'queued';
  }

  // ── Panel ──

  async list() {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const [rows, counts, sent, opened, lastRuns] = await Promise.all([
      this.prisma.notificationAutomation.findMany({
        orderBy: [{ triggerType: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.notification.groupBy({
        by: ['automationCode'],
        where: { automationCode: { not: null }, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.notification.groupBy({
        by: ['automationCode'],
        where: {
          automationCode: { not: null },
          createdAt: { gte: since },
          deliveryStatus: { in: ['queued', 'sent'] },
        },
        _count: { _all: true },
      }),
      this.prisma.notification.groupBy({
        by: ['automationCode'],
        where: {
          automationCode: { not: null },
          createdAt: { gte: since },
          openedAt: { not: null },
        },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<
        {
          automation_id: string;
          started_at: Date;
          queued: number;
          evaluated: number;
          error: string | null;
        }[]
      >`
        SELECT DISTINCT ON (automation_id) automation_id, started_at, queued, evaluated, error
        FROM notification_automation_runs ORDER BY automation_id, started_at DESC`,
    ]);
    const by = (g: { automationCode: string | null; _count: { _all: number } }[]) =>
      new Map(g.map((x) => [x.automationCode, x._count._all]));
    const c = by(counts),
      s = by(sent),
      o = by(opened);
    const lr = new Map(lastRuns.map((r) => [r.automation_id, r]));
    return rows.map((a) =>
      this.shape(a, {
        total7d: c.get(a.code) ?? 0,
        sent7d: s.get(a.code) ?? 0,
        opened7d: o.get(a.code) ?? 0,
        lastRun: lr.get(a.id)
          ? {
              startedAt: lr.get(a.id)!.started_at,
              queued: Number(lr.get(a.id)!.queued),
              evaluated: Number(lr.get(a.id)!.evaluated),
              error: lr.get(a.id)!.error,
            }
          : null,
      }),
    );
  }

  private shape<E extends Record<string, unknown>>(a: NotificationAutomation, extra: E = {} as E) {
    const schedule = a.triggerType === 'schedule' ? parseSchedule(a.schedule) : null;
    const conditions = a.conditions as unknown;
    const hasRules =
      conditions && typeof conditions === 'object' && Array.isArray((conditions as Group).rules);
    const preset = PRESET_BY_CODE.get(a.code);
    return {
      ...a,
      scheduleSummary:
        a.triggerType === 'schedule'
          ? scheduleSummary(schedule)
          : `Olay: ${a.eventType}${a.delayMinutes ? ` (+${a.delayMinutes} dk)` : ''}`,
      conditionsSummary: hasRules ? rulesSummary(validateRules(conditions)) : 'Koşulsuz',
      hasPayloadFilter: !!preset?.when,
      isPreset: !!preset,
      policyChannels: CATEGORY_POLICY[a.category].channels,
      warnings: templateWarnings(a.title, a.body),
      ...extra,
    };
  }

  async get(id: string) {
    const a = await this.prisma.notificationAutomation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Otomasyon bulunamadı.');
    const runs = await this.prisma.notificationAutomationRun.findMany({
      where: { automationId: id },
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
    return { ...this.shape(a), runs };
  }

  async runs(id: string, take = 50) {
    return this.prisma.notificationAutomationRun.findMany({
      where: { automationId: id },
      orderBy: { startedAt: 'desc' },
      take,
    });
  }

  async update(id: string, dto: UpdateAutomationInput, actor: AuthenticatedUser) {
    const a = await this.prisma.notificationAutomation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Otomasyon bulunamadı.');
    const data: Prisma.NotificationAutomationUpdateInput = { updatedById: actor.id };
    if (dto.name != null) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.title != null) data.title = dto.title;
    if (dto.body != null) data.body = dto.body;
    if (dto.ctaLabel !== undefined) data.ctaLabel = dto.ctaLabel;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.emailSubject !== undefined) data.emailSubject = dto.emailSubject;
    if (dto.emailBody !== undefined) data.emailBody = dto.emailBody;
    if (dto.conversionEvent !== undefined) data.conversionEvent = dto.conversionEvent;
    if (dto.priority) data.priority = dto.priority === 'critical' ? 'high' : dto.priority;
    if (dto.channels) {
      const ok = allowedChannels(a.category, dto.channels);
      if (ok.length === 0 && !dto.channels.includes('inbox'))
        throw new BadRequestException('Bu kategori seçilen kanallara izin vermiyor.');
      data.channels = dto.channels;
    }
    if (dto.deepLink) {
      if (!isDeepLinkTarget(dto.deepLink.target))
        throw new BadRequestException('Derin bağlantı hedefi geçersiz.');
      data.deepLink = dto.deepLink as Prisma.InputJsonValue;
    }
    if (dto.schedule) {
      if (a.triggerType !== 'schedule')
        throw new BadRequestException('Olay otomasyonunda takvim düzenlenmez.');
      data.schedule = parseSchedule(dto.schedule) as unknown as Prisma.InputJsonValue;
    }
    if (dto.conditions !== undefined) {
      data.conditions = (dto.conditions && Array.isArray((dto.conditions as Group).rules)
        ? validateRules(dto.conditions)
        : {}) as unknown as Prisma.InputJsonValue;
    }
    for (const k of ['delayMinutes', 'cooldownHours', 'maxPerUserPerDay', 'ttlHours'] as const) {
      const v = dto[k];
      if (v != null) {
        if (!Number.isInteger(v) || v < 0 || v > 24 * 60 * 30)
          throw new BadRequestException(`${k} geçersiz.`);
        data[k] = v;
      }
    }
    if (dto.respectQuietHours != null) data.respectQuietHours = dto.respectQuietHours;
    if (dto.countTowardCaps != null) data.countTowardCaps = dto.countTowardCaps;
    const title = dto.title ?? a.title;
    const body = dto.body ?? a.body;
    const hard = templateWarnings(title, body).filter(
      (w) => w.code === 'emoji' || w.code === 'forbidden',
    );
    if (hard.length) throw new BadRequestException(hard.map((w) => w.message).join(' '));
    const updated = await this.prisma.notificationAutomation.update({ where: { id }, data });
    await this.audit.log(actor, 'notification.automation.update', 'notification_automation', id, {
      code: a.code,
      fields: Object.keys(dto),
    });
    return this.shape(updated);
  }

  /** active: açılış anı yazılır (önceki olaylar işlenmiş sayılır); paused: durur. */
  async setStatus(id: string, status: NotificationAutomationStatus, actor: AuthenticatedUser) {
    const a = await this.prisma.notificationAutomation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Otomasyon bulunamadı.');
    if (status === 'draft') throw new BadRequestException('Otomasyon taslağa alınmaz; duraklat.');
    const updated = await this.prisma.notificationAutomation.update({
      where: { id },
      data: {
        status,
        updatedById: actor.id,
        ...(status === 'active'
          ? { activatedAt: new Date(), consecutiveErrors: 0, lastError: null }
          : {}),
      },
    });
    await this.audit.log(
      actor,
      `notification.automation.${status}`,
      'notification_automation',
      id,
      { code: a.code },
    );
    return this.shape(updated);
  }

  /** Prova: kitle tahmini + 10 örnek + çözülmüş metin + uyarılar; olaylıda bekleyen olay sayısı. */
  async preview(id: string) {
    const a = await this.prisma.notificationAutomation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Otomasyon bulunamadı.');
    const where = this.baseWhere(a);
    const now = new Date();
    let pendingEvents = 0;
    let payload: Record<string, unknown> = {};
    if (a.triggerType === 'event' && a.eventType) {
      const since = a.activatedAt ?? a.createdAt;
      const [cnt, last] = await Promise.all([
        this.prisma.appEvent.count({
          where: { eventType: a.eventType, occurredAt: { gte: since } },
        }),
        this.prisma.appEvent.findFirst({
          where: { eventType: a.eventType },
          orderBy: { id: 'desc' },
        }),
      ]);
      pendingEvents = cnt;
      payload = (last?.payload as Record<string, unknown>) ?? {};
    }
    const [total, sample] = await Promise.all([
      this.prisma.notificationAudience.count({ where }),
      this.prisma.notificationAudience.findMany({
        where,
        take: 10,
        orderBy: { refreshedAt: 'desc' },
        include: { user: { select: { email: true, displayName: true } } },
      }),
    ]);
    const first = sample[0] ?? null;
    const preset = PRESET_BY_CODE.get(a.code);
    if (preset?.enrich && first) {
      const extra = await preset
        .enrich({ prisma: this.prisma, userId: first.userId, audience: first })
        .catch(() => null);
      if (extra) payload = { ...payload, ...extra };
    }
    const link = resolveAutomationLink(a.deepLink as Record<string, unknown>, payload);
    const resolved = link ? resolveDeepLink(link) : null;
    const vars = {
      ad: firstName(first?.user.displayName),
      ...automationVars(
        first,
        payload,
        resolved ? `${EMAIL_CONFIG.publicBaseUrl}${resolved.webPath}` : null,
      ),
    };
    return {
      estimate: { total, pendingEvents, refreshedAt: first?.refreshedAt ?? null },
      sample: sample.map((s) => ({
        email: maskEmail(s.user.email),
        lastActiveDays: s.lastActiveDays,
        streak: s.streakCurrent,
        platforms: s.pushPlatforms,
      })),
      rendered: {
        title: fillTemplate(a.title, vars),
        body: fillTemplate(a.body, vars),
        emailSubject: a.emailSubject ? fillTemplate(a.emailSubject, vars) : null,
        ...(resolved ?? { route: null, webPath: null, minAppVersion: null }),
        linkResolved: !!resolved,
      },
      warnings: templateWarnings(a.title, a.body),
      samplePayload: payload,
      schedule:
        a.triggerType === 'schedule'
          ? scheduleDue(parseSchedule(a.schedule)!, a.lastRunAt, now)
          : null,
    };
  }

  /** Şimdi çalıştır (admin): dryRun yalnız sayar; gerçek koşu kuyruğa verir ve run kaydı yazar. */
  async runNow(id: string, dryRun: boolean, actor: AuthenticatedUser) {
    const a = await this.prisma.notificationAutomation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Otomasyon bulunamadı.');
    const now = new Date();
    const counts =
      a.triggerType === 'schedule'
        ? await this.runSchedule(a, now, { force: true, dryRun })
        : await this.runEvents(a, now, { dryRun, limit: 1000 });
    await this.audit.log(actor, 'notification.automation.run_now', 'notification_automation', id, {
      code: a.code,
      dryRun,
      counts,
    });
    return counts ?? { evaluated: 0, matched: 0, queued: 0, suppressed: 0 };
  }
}
