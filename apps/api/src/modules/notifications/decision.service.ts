import { Injectable } from '@nestjs/common';
import type { NotificationCategory } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SETTING_KEYS, SettingsService } from '../../infra/settings/settings.service';
import { CATEGORY_POLICY } from './notification.categories';
import { NOTIFICATIONS_CONFIG, notificationsEnv } from './notifications.config';
import {
  decide,
  trClock,
  type Decision,
  type DecisionContext,
  type DecisionInput,
} from './decision.logic';

export type UserContext = {
  user: { id: string; status: string; email: string; displayName: string } | null;
  settings: {
    categories: Record<string, unknown>;
    quietStart: string;
    quietEnd: string;
    pushEnabled: boolean;
    reminderTime: string;
  };
  activeTokens: { token: string; platform: string }[];
  emailConsent: boolean;
  engagementTier: number;
};

/** TR gece yarısı (takvim günü): kapı sayaçları bu günde sayılır (§6 not). */
export function trDayStart(now = new Date()): Date {
  const { h, m } = trClock(now);
  const d = new Date(now.getTime() - (h * 60 + m) * 60_000);
  d.setUTCSeconds(0, 0);
  return d;
}

/**
 * Karar bağlamını toplar ve saf karar akışını çalıştırır (Doc 52 §6, §7).
 * Kill switch 60 sn önbellekli SettingsService'ten okunur.
 */
@Injectable()
export class DecisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async globalGates(): Promise<{
    killSwitch: boolean;
    environmentOk: boolean;
    dailyCap: number;
    marketingDailyCap: number;
    decayWeeklyCap: number;
  }> {
    const [killSwitch, env, dailyCap, marketingDailyCap, decayWeeklyCap] = await Promise.all([
      this.settings.getBool(SETTING_KEYS.notificationsKillSwitch, false),
      this.settings.getString(SETTING_KEYS.notificationsEnvironment, ''),
      this.settings.getInt(
        SETTING_KEYS.notificationsDailyCap,
        NOTIFICATIONS_CONFIG.dailyCapDefault,
      ),
      this.settings.getInt(
        SETTING_KEYS.notificationsMarketingDailyCap,
        NOTIFICATIONS_CONFIG.marketingDailyCapDefault,
      ),
      this.settings.getInt(
        SETTING_KEYS.notificationsDecayWeeklyCap,
        NOTIFICATIONS_CONFIG.decayWeeklyCapDefault,
      ),
    ]);
    return {
      killSwitch,
      environmentOk: !env || env === notificationsEnv(),
      dailyCap,
      marketingDailyCap,
      decayWeeklyCap,
    };
  }

  async userContext(userId: string, category: NotificationCategory): Promise<UserContext> {
    const topic = CATEGORY_POLICY[category].emailTopic;
    const [user, settings, tokens, audience] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          email: true,
          displayName: true,
          emailContacts: {
            where: { status: 'subscribed' },
            select: {
              id: true,
              preferences: { where: { subscribed: false }, select: { topic: true } },
            },
            take: 1,
          },
        },
      }),
      this.prisma.userNotificationSettings.findUnique({ where: { userId } }),
      this.prisma.pushToken.findMany({
        where: { userId, isActive: true },
        select: { token: true, platform: true },
      }),
      this.prisma.notificationAudience.findUnique({
        where: { userId },
        select: { engagementTier: true },
      }),
    ]);
    const contact = user?.emailContacts[0];
    const emailConsent =
      !!topic && !!contact && !contact.preferences.some((p) => p.topic === topic);
    return {
      user: user
        ? { id: user.id, status: user.status, email: user.email, displayName: user.displayName }
        : null,
      settings: {
        categories: (settings?.categories as Record<string, unknown>) ?? {},
        quietStart: settings?.quietStart ?? '23:00',
        quietEnd: settings?.quietEnd ?? '08:00',
        pushEnabled: settings?.pushEnabled ?? true,
        reminderTime: settings?.reminderTime ?? '19:00',
      },
      activeTokens: tokens,
      emailConsent,
      engagementTier: audience?.engagementTier ?? 0,
    };
  }

  /** Kapı sayaçları `notifications` üzerinden TR takvim gününde (kitle gecikmesi kapıyı deldirmesin). */
  async counters(
    userId: string,
    now: Date,
  ): Promise<{ sentToday: number; marketingSentToday: number; pushesThisWeek: number }> {
    const dayStart = trDayStart(now);
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const [sentToday, marketingSentToday, pushesThisWeek] = await Promise.all([
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: dayStart },
          category: { not: 'system' },
          channels: { has: 'push' },
          deliveryStatus: { in: ['queued', 'sent'] },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: dayStart },
          category: 'marketing',
          deliveryStatus: { in: ['queued', 'sent'] },
        },
      }),
      this.prisma.notificationDelivery.count({
        where: { userId, channel: 'push', status: 'sent', sentAt: { gte: weekAgo } },
      }),
    ]);
    return { sentToday, marketingSentToday, pushesThisWeek };
  }

  async decideFor(
    userId: string,
    input: DecisionInput,
    dedupeKey: string | null,
    now = new Date(),
  ): Promise<{ decision: Decision; ctx: UserContext }> {
    const [gates, ctx] = await Promise.all([
      this.globalGates(),
      this.userContext(userId, input.category),
    ]);
    const duplicate = dedupeKey
      ? !!(await this.prisma.notification.findUnique({
          where: { userId_dedupeKey: { userId, dedupeKey } },
          select: { id: true },
        }))
      : false;
    const counters =
      gates.killSwitch || !ctx.user
        ? { sentToday: 0, marketingSentToday: 0, pushesThisWeek: 0 }
        : await this.counters(userId, now);
    const dctx: DecisionContext = {
      now,
      killSwitch: gates.killSwitch,
      environmentOk: gates.environmentOk,
      accountActive: ctx.user?.status === 'active',
      duplicate,
      settings: ctx.settings,
      emailConsent: ctx.emailConsent,
      hasActiveDevice: ctx.activeTokens.length > 0,
      sentToday: counters.sentToday,
      marketingSentToday: counters.marketingSentToday,
      dailyCap: gates.dailyCap,
      marketingDailyCap: gates.marketingDailyCap,
      engagementTier: ctx.engagementTier,
      pushesThisWeek: counters.pushesThisWeek,
      decayWeeklyCap: gates.decayWeeklyCap,
    };
    return { decision: decide(input, dctx), ctx };
  }
}
