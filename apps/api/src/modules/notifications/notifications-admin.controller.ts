import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { AuditService } from '../admin/audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { maskEmail } from '../email/email-contacts.service';
import { AudienceService } from './audience.service';
import { CampaignsService } from './campaigns.service';
import { DEEP_LINKS, DEEP_LINK_TARGETS, resolveDeepLink } from './deep-links';
import { DeliveryWorker } from './delivery.worker';
import {
  CampaignStatusDto,
  CampaignsQueryDto,
  EstimateDto,
  HistoryQueryDto,
  KillSwitchDto,
  LegacySendDto,
  NotificationSettingsAdminDto,
  SegmentEstimateDto,
  TesterDto,
  UpsertCampaignDto,
  UpsertSegmentDto,
  UpsertTemplateDto,
} from './dto/notifications.dto';
import { LeaderboardNudgeService } from './leaderboard-nudge.service';
import { ALL_CATEGORIES, CATEGORY_POLICY } from './notification.categories';
import {
  NOTIFICATIONS_CONFIG,
  notificationsEnv,
  notificationsProvider,
} from './notifications.config';
import { RollupService } from './rollup.service';
import { rulesSummary, rulesToWhere, SEGMENT_FIELDS, validateRules } from './segment-dsl';
import { TEMPLATE_VARIABLES, templateWarnings } from './template';
import { TestersService } from './testers.service';
import { trDayStart } from './decision.service';

/**
 * /api/v1/admin/notifications/* — Bildirim Merkezi (Doc 52 §10).
 * editor: hazırlar, test gönderir, okur. admin: gönderir, iptal eder, kill switch, testerlar.
 */
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
export class NotificationsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
    private readonly testers: TestersService,
    private readonly audience: AudienceService,
    private readonly worker: DeliveryWorker,
    private readonly rollup: RollupService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly leaderboardNudge: LeaderboardNudgeService,
  ) {}

  // ── Genel bakış ──
  @Get('overview')
  async overview() {
    const now = new Date();
    const day = trDayStart(now);
    const since30 = new Date(now.getTime() - 30 * 86_400_000);
    const [today, suppression, stats, scheduled, kill, env, lastRefresh, pendingQueue] =
      await Promise.all([
        this.prisma.notificationDelivery.groupBy({
          by: ['channel', 'status'],
          where: { queuedAt: { gte: day }, NOT: { target: { startsWith: '—' } } },
          _count: { _all: true },
        }),
        this.prisma.notificationDelivery.groupBy({
          by: ['suppressionReason'],
          where: { queuedAt: { gte: day }, status: 'suppressed' },
          _count: { _all: true },
        }),
        this.prisma.notificationDailyStat.findMany({
          where: { day: { gte: since30 } },
          orderBy: { day: 'asc' },
        }),
        this.prisma.notificationCampaign.findMany({
          where: { status: { in: ['scheduled', 'sending'] } },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
          select: {
            id: true,
            name: true,
            status: true,
            scheduledAt: true,
            estimatedRecipients: true,
          },
        }),
        this.settings.getBool(SETTING_KEYS.notificationsKillSwitch, false),
        this.settings.getString(SETTING_KEYS.notificationsEnvironment, ''),
        this.audience.lastRefreshedAt(),
        this.prisma.notificationDelivery.count({ where: { status: 'queued' } }),
      ]);
    const [openedToday, clickedToday, convertedToday] = await Promise.all([
      this.prisma.notification.count({
        where: { createdAt: { gte: day }, openedAt: { not: null } },
      }),
      this.prisma.notification.count({
        where: { createdAt: { gte: day }, clickedAt: { not: null } },
      }),
      this.prisma.notification.count({
        where: { createdAt: { gte: day }, convertedAt: { not: null } },
      }),
    ]);
    const series = new Map<string, { day: string; sent: number; opened: number }>();
    for (const s of stats) {
      const k = s.day.toISOString().slice(0, 10);
      const row = series.get(k) ?? { day: k, sent: 0, opened: 0 };
      row.sent += s.sent;
      row.opened += s.opened;
      series.set(k, row);
    }
    return {
      today: today.map((t) => ({ channel: t.channel, status: t.status, count: t._count._all })),
      openedToday,
      clickedToday,
      convertedToday,
      suppression: suppression.map((s) => ({ reason: s.suppressionReason, count: s._count._all })),
      series: [...series.values()],
      scheduled,
      killSwitch: kill,
      environment: {
        setting: env,
        worker: notificationsEnv(),
        ok: !env || env === notificationsEnv(),
        provider: notificationsProvider(),
      },
      audienceRefreshedAt: lastRefresh,
      pendingQueue,
    };
  }

  // ── Analizler (günlük özet + açılma saati histogramı) ──
  @Get('analytics')
  async analyticsOverview(@Query('days') daysRaw?: string) {
    const days = [7, 30, 90].includes(Number(daysRaw)) ? Number(daysRaw) : 30;
    const since = new Date(Date.now() - days * 86_400_000);
    const [stats, hours, segments] = await Promise.all([
      this.prisma.notificationDailyStat.findMany({ where: { day: { gte: since } } }),
      this.prisma.$queryRaw<{ h: number; n: number }[]>`
        SELECT extract(hour from (occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul'))::int AS h, count(*)::int AS n
        FROM notification_events WHERE event_type IN ('opened','clicked') AND occurred_at >= ${since}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.notificationCampaign.findMany({
        where: { status: 'sent', completedAt: { gte: since }, segmentId: { not: null } },
        select: { segment: { select: { id: true, name: true } }, sentCount: true, id: true },
      }),
    ]);
    const sum = (
      rows: typeof stats,
      k: 'queued' | 'sent' | 'failed' | 'suppressed' | 'opened' | 'clicked' | 'converted',
    ) => rows.reduce((a, r) => a + r[k], 0);
    const totals = {
      sent: sum(stats, 'sent'),
      failed: sum(stats, 'failed'),
      suppressed: sum(stats, 'suppressed'),
      opened: sum(stats, 'opened'),
      clicked: sum(stats, 'clicked'),
      converted: sum(stats, 'converted'),
    };
    const by = <K extends 'category' | 'channel' | 'platform'>(key: K) => {
      const m = new Map<
        string,
        {
          key: string;
          sent: number;
          opened: number;
          clicked: number;
          converted: number;
          failed: number;
        }
      >();
      for (const r of stats) {
        const k = String(r[key] || '—');
        const row = m.get(k) ?? { key: k, sent: 0, opened: 0, clicked: 0, converted: 0, failed: 0 };
        row.sent += r.sent;
        row.opened += r.opened;
        row.clicked += r.clicked;
        row.converted += r.converted;
        row.failed += r.failed;
        m.set(k, row);
      }
      return [...m.values()].sort((a, b) => b.sent - a.sent);
    };
    const series = new Map<string, { day: string; sent: number; opened: number }>();
    for (const r of stats) {
      const k = r.day.toISOString().slice(0, 10);
      const row = series.get(k) ?? { day: k, sent: 0, opened: 0 };
      row.sent += r.sent;
      row.opened += r.opened;
      series.set(k, row);
    }
    const segMap = new Map<string, { id: string; name: string; campaigns: number; sent: number }>();
    for (const c of segments)
      if (c.segment) {
        const r = segMap.get(c.segment.id) ?? {
          id: c.segment.id,
          name: c.segment.name,
          campaigns: 0,
          sent: 0,
        };
        r.campaigns++;
        r.sent += c.sentCount;
        segMap.set(c.segment.id, r);
      }
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      h,
      n: hours.find((x) => x.h === h)?.n ?? 0,
    }));
    return {
      days,
      totals,
      byCategory: by('category'),
      byChannel: by('channel'),
      byPlatform: by('platform'),
      series: [...series.values()].sort((a, b) => a.day.localeCompare(b.day)),
      hourly,
      segments: [...segMap.values()],
    };
  }

  // ── Kampanyalar ──
  @Get('campaigns') listCampaigns(@Query() q: CampaignsQueryDto) {
    return this.campaigns.list(q);
  }
  @Post('campaigns') createCampaign(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpsertCampaignDto,
  ) {
    return this.campaigns.create(dto, actor);
  }
  @Get('campaigns/:id') getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.get(id);
  }
  @Put('campaigns/:id') updateCampaign(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCampaignDto,
  ) {
    return this.campaigns.update(id, dto, actor);
  }
  @Delete('campaigns/:id') removeCampaign(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaigns.remove(id, actor);
  }
  @Post('campaigns/estimate') estimate(@Body() dto: EstimateDto) {
    return this.campaigns.estimateDraft(dto);
  }
  @Post('campaigns/:id/preview') preview(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.preview(id);
  }
  @Post('campaigns/:id/test') test(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaigns.testSend(id, actor);
  }
  @Post('campaigns/:id/status') @Roles('admin') status(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CampaignStatusDto,
  ) {
    return this.campaigns.transition(
      id,
      dto.action,
      actor,
      dto.confirmedRecipients,
      dto.scheduledAt,
    );
  }
  @Get('campaigns/:id/analytics') analytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.analytics(id);
  }

  // ── Şablonlar ──
  @Get('templates')
  async templates() {
    const items = await this.prisma.notificationTemplate.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
    return {
      items: items.map((t) => ({ ...t, warnings: templateWarnings(t.title, t.body) })),
      variables: TEMPLATE_VARIABLES,
      categories: ALL_CATEGORIES.map((c) => ({ code: c, ...CATEGORY_POLICY[c] })),
    };
  }
  @Post('templates')
  async createTemplate(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertTemplateDto) {
    if (dto.deepLink) resolveDeepLink(dto.deepLink);
    const t = await this.prisma.notificationTemplate.create({
      data: {
        ...dto,
        deepLink: (dto.deepLink ?? { target: 'home' }) as unknown as Prisma.InputJsonValue,
        createdById: actor.id,
      },
    });
    await this.audit.log(actor, 'notification.template.create', 'notification_template', t.id, {
      code: t.code,
    });
    return t;
  }
  @Put('templates/:id')
  async updateTemplate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertTemplateDto,
  ) {
    if (dto.deepLink) resolveDeepLink(dto.deepLink);
    const t = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...dto,
        deepLink: (dto.deepLink ?? { target: 'home' }) as unknown as Prisma.InputJsonValue,
        updatedById: actor.id,
      },
    });
    await this.audit.log(actor, 'notification.template.update', 'notification_template', id, {
      code: t.code,
    });
    return t;
  }

  // ── Segmentler ──
  @Get('segments')
  async segments() {
    const items = await this.prisma.notificationSegment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: items.map((s) => ({ ...s, summary: rulesSummary(validateRules(s.rules)) })),
      fields: SEGMENT_FIELDS,
    };
  }
  @Post('segments/estimate')
  async segmentEstimate(@Body() dto: SegmentEstimateDto) {
    const rules = validateRules(dto.rules);
    const where = { accountActive: true, ...rulesToWhere(rules) };
    const [total, push] = await Promise.all([
      this.prisma.notificationAudience.count({ where }),
      this.prisma.notificationAudience.count({ where: { ...where, pushEnabled: true } }),
    ]);
    return {
      total,
      push,
      summary: rulesSummary(rules),
      refreshedAt: await this.audience.lastRefreshedAt(),
    };
  }
  @Post('segments')
  async createSegment(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertSegmentDto) {
    const rules = validateRules(dto.rules);
    const count = await this.prisma.notificationAudience.count({
      where: { accountActive: true, ...rulesToWhere(rules) },
    });
    const s = await this.prisma.notificationSegment.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        rules: rules as unknown as Prisma.InputJsonValue,
        status: dto.status ?? 'active',
        lastCount: count,
        lastCountedAt: new Date(),
        createdById: actor.id,
      },
    });
    await this.audit.log(actor, 'notification.segment.create', 'notification_segment', s.id, {
      name: s.name,
      summary: rulesSummary(rules),
    });
    return s;
  }
  @Put('segments/:id')
  async updateSegment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertSegmentDto,
  ) {
    const rules = validateRules(dto.rules);
    const count = await this.prisma.notificationAudience.count({
      where: { accountActive: true, ...rulesToWhere(rules) },
    });
    const s = await this.prisma.notificationSegment.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description ?? null,
        rules: rules as unknown as Prisma.InputJsonValue,
        status: dto.status ?? 'active',
        lastCount: count,
        lastCountedAt: new Date(),
        updatedById: actor.id,
      },
    });
    await this.audit.log(actor, 'notification.segment.update', 'notification_segment', id, {
      name: s.name,
    });
    return s;
  }

  // ── Geçmiş ──
  @Get('history')
  async history(@Query() q: HistoryQueryDto) {
    const page = Math.max(q.page ?? 1, 1);
    const pageSize = Math.min(Math.max(q.pageSize ?? 50, 1), 200);
    const where: Prisma.NotificationDeliveryWhereInput = {
      ...(q.channel ? { channel: q.channel } : {}),
      ...(q.status ? { status: q.status as never } : {}),
      ...(q.from || q.to
        ? {
            queuedAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
      notification: {
        ...(q.campaignId ? { campaignId: q.campaignId } : {}),
        ...(q.email ? { user: { email: { contains: q.email.toLowerCase() } } } : {}),
      },
    };
    const [rows, total] = await Promise.all([
      this.prisma.notificationDelivery.findMany({
        where,
        orderBy: { queuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          notification: {
            select: {
              title: true,
              category: true,
              campaignId: true,
              automationCode: true,
              openedAt: true,
              clickedAt: true,
              convertedAt: true,
              user: { select: { email: true } },
              campaign: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.notificationDelivery.count({ where }),
    ]);
    const tokens = rows
      .filter((r) => r.channel === 'push' && !r.target.startsWith('—'))
      .map((r) => r.target);
    const platforms = new Map(
      (
        await this.prisma.pushToken.findMany({
          where: { token: { in: tokens } },
          select: { token: true, platform: true },
        })
      ).map((t) => [t.token, t.platform]),
    );
    return {
      items: rows.map((r) => ({
        id: String(r.id),
        queuedAt: r.queuedAt,
        sentAt: r.sentAt,
        channel: r.channel,
        status: r.status,
        suppressionReason: r.suppressionReason,
        errorCode: r.errorCode,
        attempts: r.attempts,
        platform: r.channel === 'push' ? (platforms.get(r.target) ?? null) : null,
        user: maskEmail(r.notification.user.email),
        source:
          r.notification.campaign?.name ?? r.notification.automationCode ?? r.notification.category,
        title: r.notification.title,
        category: r.notification.category,
        opened: !!r.notification.openedAt,
        clicked: !!r.notification.clickedAt,
        converted: !!r.notification.convertedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ── Cihazlar ──
  @Get('devices')
  async devices() {
    const [active, inactive, byPlatform] = await Promise.all([
      this.prisma.pushToken.count({ where: { isActive: true } }),
      this.prisma.pushToken.groupBy({
        by: ['disabledReason'],
        where: { isActive: false },
        _count: { _all: true },
      }),
      this.prisma.pushToken.groupBy({
        by: ['platform'],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);
    return {
      active,
      inactive: inactive.map((i) => ({ reason: i.disabledReason, count: i._count._all })),
      platforms: byPlatform.map((p) => ({ platform: p.platform, count: p._count._all })),
    };
  }

  // ── Testerlar (admin) ──
  @Get('testers') @Roles('admin') listTesters() {
    return this.testers.list(true);
  }
  @Post('testers')
  @Roles('admin')
  async addTester(@CurrentUser() actor: AuthenticatedUser, @Body() dto: TesterDto) {
    const r = await this.testers.add(dto.email, actor.id);
    await this.audit.log(actor, 'notification.tester.add', 'user', null, {
      email: maskEmail(dto.email),
    });
    return r;
  }
  @Delete('testers/:userId')
  @Roles('admin')
  async removeTester(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const r = await this.testers.remove(userId);
    await this.audit.log(actor, 'notification.tester.remove', 'user', userId);
    return r;
  }

  // ── Ayarlar ve kill switch ──
  @Get('settings')
  async getSettings() {
    const keys = [
      SETTING_KEYS.notificationsKillSwitch,
      SETTING_KEYS.notificationsDailyCap,
      SETTING_KEYS.notificationsMarketingDailyCap,
      SETTING_KEYS.notificationsDecayWeeklyCap,
      SETTING_KEYS.notificationsEnvironment,
      SETTING_KEYS.notificationsRetention,
    ];
    return {
      values: await this.settings.entries(keys),
      defaults: {
        dailyCap: NOTIFICATIONS_CONFIG.dailyCapDefault,
        marketingDailyCap: NOTIFICATIONS_CONFIG.marketingDailyCapDefault,
        decayWeeklyCap: NOTIFICATIONS_CONFIG.decayWeeklyCapDefault,
        retention: NOTIFICATIONS_CONFIG.retentionDefault,
      },
      worker: { env: notificationsEnv(), provider: notificationsProvider() },
      retention: await this.rollup.retention(),
    };
  }
  @Put('settings')
  @Roles('admin')
  async putSettings(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: NotificationSettingsAdminDto,
  ) {
    if (dto.dailyCap != null)
      await this.settings.set(SETTING_KEYS.notificationsDailyCap, String(dto.dailyCap));
    if (dto.marketingDailyCap != null)
      await this.settings.set(
        SETTING_KEYS.notificationsMarketingDailyCap,
        String(dto.marketingDailyCap),
      );
    if (dto.decayWeeklyCap != null)
      await this.settings.set(SETTING_KEYS.notificationsDecayWeeklyCap, String(dto.decayWeeklyCap));
    if (dto.environment != null)
      await this.settings.set(SETTING_KEYS.notificationsEnvironment, dto.environment.trim());
    if (dto.retention)
      await this.settings.set(SETTING_KEYS.notificationsRetention, JSON.stringify(dto.retention));
    await this.audit.log(actor, 'notification.settings.update', 'app_setting', 'notifications', {
      ...dto,
    });
    return this.getSettings();
  }
  @Post('kill-switch')
  @Roles('admin')
  async killSwitch(@CurrentUser() actor: AuthenticatedUser, @Body() dto: KillSwitchDto) {
    await this.settings.set(SETTING_KEYS.notificationsKillSwitch, dto.enabled ? 'true' : 'false');
    await this.audit.log(
      actor,
      'notification.kill_switch',
      'app_setting',
      SETTING_KEYS.notificationsKillSwitch,
      { enabled: dto.enabled },
    );
    return { enabled: dto.enabled };
  }

  // ── Yardımcılar ──
  @Get('link-options')
  async linkOptions(@Query('target') target?: string) {
    const targets = DEEP_LINK_TARGETS.map((t) => ({
      target: t,
      param: DEEP_LINKS[t].param ?? null,
      minAppVersion: DEEP_LINKS[t].minAppVersion,
    }));
    let options: { id: string; label: string }[] = [];
    if (target === 'exam' || target === 'exam_result') {
      options = (
        await this.prisma.exam.findMany({
          where: { deletedAt: null, status: 'published', pastExam: null },
          orderBy: { startAt: 'desc' },
          take: 50,
          select: { id: true, title: true },
        })
      ).map((e) => ({ id: e.id, label: e.title }));
    } else if (target === 'legislation') {
      options = (
        await this.prisma.legislation.findMany({
          orderBy: { name: 'asc' },
          take: 200,
          select: { id: true, name: true },
        })
      ).map((l) => ({ id: l.id, label: l.name }));
    }
    return { targets, options };
  }

  @Post('worker/tick') @Roles('admin') tick() {
    return this.worker.tick();
  }
  @Post('audience/refresh')
  @Roles('admin')
  async refreshAudience() {
    return {
      rows: await this.audience.refresh(null),
      refreshedAt: await this.audience.lastRefreshedAt(),
    };
  }

  /** Eski "Bildirim Gönder" formu: kampanyaya çevrilir ve hemen gönderilir (admin). */
  @Post('send')
  @Roles('admin')
  async legacySend(@CurrentUser() actor: AuthenticatedUser, @Body() dto: LegacySendDto) {
    const route = (dto.route ?? '').trim();
    const deepLink =
      route === 'daily-quiz'
        ? { target: 'daily_question' as const }
        : route === 'denemeler'
          ? { target: 'exams' as const }
          : route === 'leaderboard'
            ? { target: 'leaderboard' as const }
            : { target: 'home' as const };
    const inactive = dto.audience === 'inactive-today';
    return this.campaigns.quickSend(
      {
        name: `Panel: ${dto.title}`.slice(0, 120),
        category: inactive ? 'study_reminder' : 'daily_question',
        title: dto.title,
        body: dto.body,
        deepLink,
        channels: inactive ? ['push'] : ['push', 'inbox'],
        audienceMode: inactive ? 'segment' : 'all',
        segmentRules: inactive
          ? { op: 'and', rules: [{ field: 'answeredToday', cmp: 'eq', value: 0 }] }
          : undefined,
      },
      actor,
    );
  }

  /** "Bir basamak yükselebilirsin" dürtmesi (test/teşhis). dryRun=true → yalnız adaylar. */
  @Post('leaderboard-nudge')
  @Roles('admin')
  async triggerLeaderboardNudge(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: { dryRun?: boolean },
  ) {
    if (body.dryRun !== false && body.dryRun !== true)
      throw new BadRequestException('dryRun true/false olmalı.');
    const result = await this.leaderboardNudge.run(body.dryRun);
    if (!body.dryRun)
      await this.audit.log(actor, 'notification.nudge', 'push', 'leaderboard_climb', { ...result });
    return result;
  }
}
