import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { gunAnahtari, gunBaslangici } from '../../common/gun';
import { notificationsWorkerEnabled } from './notifications.config';
import { trDayStart } from './decision.service';

/**
 * Kitle tablosu (Doc 52 §4.2): kullanıcı başına bir satır, saat başı tek
 * set-tabanlı SQL ile yenilenir (pooler için tek bağlantı, tek ifade).
 * Segment DSL yalnız bu tabloyu okur. Zayıf konu eşiği mevcut koç eşiğidir
 * (solved ≥ 3, mastery < 0.7). Sönüm katmanı (Doc 24): 7 gün açılmamış ve
 * ≥ 5 push → 1; 30 gün → 2.
 */
@Injectable()
export class AudienceService {
  private readonly logger = new Logger(AudienceService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('7 * * * *')
  async hourly() {
    if (!notificationsWorkerEnabled()) return;
    const n = await this.refresh(null).catch((e) => {
      this.logger.error(`Kitle yenilenemedi: ${(e as Error).message}`);
      return -1;
    });
    if (n >= 0) this.logger.log(`Kitle tablosu yenilendi: ${n} kullanıcı.`);
  }

  async refreshUser(userId: string) {
    return this.refresh(userId);
  }

  /** userId null → tüm kullanıcılar. Döndürdüğü sayı yazılan satır. */
  async refresh(userId: string | null): Promise<number> {
    const now = new Date();
    const dayKey = gunAnahtari(now); // @db.Date sayaçları (daily_usage)
    const dayStart = gunBaslangici(now); // uygulama günü başlangıcı (TR 04.00)
    const trMidnight = trDayStart(now); // takvim günü (bildirim kapıları)
    const scope = userId ? Prisma.sql`AND u.id = ${userId}::uuid` : Prisma.empty;
    const result = await this.prisma.$executeRaw`
      INSERT INTO notification_audience (
        user_id, refreshed_at, account_active, registered_at, registered_days, last_active_at, last_active_days,
        is_premium, premium_until, preferred_module_id, target_exam_date, exam_days_left,
        push_enabled, push_platforms, email_subscribed,
        streak_current, streak_best, daily_goal, answered_today, daily_goal_done_today, daily_question_done_today, study_seconds_today,
        answered_total, answered_7d, answered_30d, accuracy_30d,
        last_exam_at, last_exam_net, exam_count, open_exam_session_id,
        weak_topic_ids, onboarding_done, plan_active,
        engagement_tier, last_push_opened_at, notifications_sent_today, marketing_sent_today
      )
      SELECT
        u.id, now(), u.status = 'active', u.created_at, GREATEST(0, (CURRENT_DATE - u.created_at::date)),
        u.last_active_at, CASE WHEN u.last_active_at IS NULL THEN NULL ELSE (CURRENT_DATE - u.last_active_at::date) END,
        COALESCE(e.is_premium, false), e.valid_until, u.preferred_module_id, COALESCE(u.target_exam_date, cal.exam_date),
        CASE WHEN COALESCE(u.target_exam_date, cal.exam_date) IS NULL THEN NULL ELSE (COALESCE(u.target_exam_date, cal.exam_date) - CURRENT_DATE) END,
        COALESCE(pt.cnt, 0) > 0, COALESCE(pt.platforms, '{}'::text[]), COALESCE(ec.subscribed, false),
        COALESCE(s.current_streak, 0), COALESCE(s.longest_streak, 0), u.daily_goal,
        COALESCE(du.total_answered, 0), COALESCE(du.total_answered, 0) >= u.daily_goal, COALESCE(dq.done, false), COALESCE(du.study_seconds, 0),
        COALESCE(us.total_solved, 0), COALESCE(a7.n, 0), COALESCE(a30.n, 0), a30.acc,
        ex.last_exam_at, ex.last_net, COALESCE(ex.cnt, 0), oe.session_id,
        COALESCE(wt.ids, '{}'::uuid[]), u.onboarding_completed_at IS NOT NULL, COALESCE(sp.active, false),
        CASE
          WHEN COALESCE(ps.sent30, 0) >= 5 AND (po.last_open IS NULL OR po.last_open < now() - interval '30 days') THEN 2
          WHEN COALESCE(ps.sent7, 0) >= 5 AND (po.last_open IS NULL OR po.last_open < now() - interval '7 days') THEN 1
          ELSE 0
        END,
        po.last_open, COALESCE(nt.n, 0), COALESCE(nt.m, 0)
      FROM users u
      LEFT JOIN entitlements e ON e.user_id = u.id
      LEFT JOIN streaks s ON s.user_id = u.id
      LEFT JOIN user_stats us ON us.user_id = u.id
      LEFT JOIN daily_usage du ON du.user_id = u.id AND du.usage_date = ${dayKey}::date
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS cnt, array_agg(DISTINCT p.platform) AS platforms
        FROM push_tokens p WHERE p.user_id = u.id AND p.is_active
      ) pt ON true
      LEFT JOIN LATERAL (
        SELECT true AS subscribed FROM email_contacts c WHERE c.user_id = u.id AND c.status = 'subscribed' LIMIT 1
      ) ec ON true
      LEFT JOIN LATERAL (
        SELECT true AS done FROM quiz_sessions q
        WHERE q.user_id = u.id AND q.mode = 'daily' AND q.status = 'completed' AND q.started_at >= ${dayStart} LIMIT 1
      ) dq ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS n FROM quiz_answers a JOIN quiz_sessions q ON q.id = a.session_id
        WHERE q.user_id = u.id AND a.answered_at >= now() - interval '7 days'
      ) a7 ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS n,
               CASE WHEN count(a.is_correct) = 0 THEN NULL ELSE round(100.0 * sum(CASE WHEN a.is_correct THEN 1 ELSE 0 END) / count(a.is_correct), 2) END AS acc
        FROM quiz_answers a JOIN quiz_sessions q ON q.id = a.session_id
        WHERE q.user_id = u.id AND a.answered_at >= now() - interval '30 days'
      ) a30 ON true
      LEFT JOIN LATERAL (
        SELECT max(q.completed_at) AS last_exam_at, count(*)::int AS cnt,
               (SELECT q2.score FROM quiz_sessions q2 WHERE q2.user_id = u.id AND q2.exam_id IS NOT NULL AND q2.status = 'completed' ORDER BY q2.completed_at DESC NULLS LAST LIMIT 1) AS last_net
        FROM quiz_sessions q WHERE q.user_id = u.id AND q.exam_id IS NOT NULL AND q.status = 'completed'
      ) ex ON true
      LEFT JOIN LATERAL (
        SELECT q.id AS session_id FROM quiz_sessions q
        WHERE q.user_id = u.id AND q.exam_id IS NOT NULL AND q.status = 'in_progress' ORDER BY q.started_at DESC LIMIT 1
      ) oe ON true
      LEFT JOIN LATERAL (
        SELECT array_agg(t.topic_id) AS ids FROM (
          SELECT topic_id FROM user_topic_progress p
          WHERE p.user_id = u.id AND p.solved_count >= 3 AND p.mastery < 0.7 ORDER BY p.mastery ASC LIMIT 20
        ) t
      ) wt ON true
      LEFT JOIN LATERAL (
        SELECT true AS active FROM study_plans sp WHERE sp.user_id = u.id AND sp.status = 'active' LIMIT 1
      ) sp ON true
      LEFT JOIN LATERAL (
        -- Sınav takvimi (Doc 52 F2): kullanıcının kendi tarihi yoksa modülünün en yakın kesin tarihi.
        SELECT c.exam_date FROM exam_calendar c
        WHERE c.is_active AND c.is_confirmed AND c.exam_date >= CURRENT_DATE
          AND (c.exam_type_id = u.preferred_module_id OR c.exam_type_id IS NULL)
        ORDER BY (c.exam_type_id IS NULL), c.exam_date ASC LIMIT 1
      ) cal ON true
      LEFT JOIN LATERAL (
        SELECT count(*) FILTER (WHERE d.sent_at >= now() - interval '7 days')::int AS sent7,
               count(*) FILTER (WHERE d.sent_at >= now() - interval '30 days')::int AS sent30
        FROM notification_deliveries d WHERE d.user_id = u.id AND d.channel = 'push' AND d.status = 'sent'
      ) ps ON true
      LEFT JOIN LATERAL (
        SELECT max(ev.occurred_at) AS last_open FROM notification_events ev
        WHERE ev.user_id = u.id AND ev.event_type IN ('opened', 'clicked')
      ) po ON true
      LEFT JOIN LATERAL (
        SELECT count(*) FILTER (WHERE n.category <> 'system' AND 'push' = ANY(n.channels) AND n.delivery_status IN ('queued','sent'))::int AS n,
               count(*) FILTER (WHERE n.category = 'marketing' AND n.delivery_status IN ('queued','sent'))::int AS m
        FROM notifications n WHERE n.user_id = u.id AND n.created_at >= ${trMidnight}
      ) nt ON true
      WHERE u.status <> 'deleted' AND u.deleted_at IS NULL ${scope}
      ON CONFLICT (user_id) DO UPDATE SET
        refreshed_at = EXCLUDED.refreshed_at, account_active = EXCLUDED.account_active, registered_at = EXCLUDED.registered_at,
        registered_days = EXCLUDED.registered_days, last_active_at = EXCLUDED.last_active_at, last_active_days = EXCLUDED.last_active_days,
        is_premium = EXCLUDED.is_premium, premium_until = EXCLUDED.premium_until, preferred_module_id = EXCLUDED.preferred_module_id,
        target_exam_date = EXCLUDED.target_exam_date, exam_days_left = EXCLUDED.exam_days_left, push_enabled = EXCLUDED.push_enabled,
        push_platforms = EXCLUDED.push_platforms, email_subscribed = EXCLUDED.email_subscribed, streak_current = EXCLUDED.streak_current,
        streak_best = EXCLUDED.streak_best, daily_goal = EXCLUDED.daily_goal, answered_today = EXCLUDED.answered_today,
        daily_goal_done_today = EXCLUDED.daily_goal_done_today, daily_question_done_today = EXCLUDED.daily_question_done_today,
        study_seconds_today = EXCLUDED.study_seconds_today, answered_total = EXCLUDED.answered_total, answered_7d = EXCLUDED.answered_7d,
        answered_30d = EXCLUDED.answered_30d, accuracy_30d = EXCLUDED.accuracy_30d, last_exam_at = EXCLUDED.last_exam_at,
        last_exam_net = EXCLUDED.last_exam_net, exam_count = EXCLUDED.exam_count, open_exam_session_id = EXCLUDED.open_exam_session_id,
        weak_topic_ids = EXCLUDED.weak_topic_ids, onboarding_done = EXCLUDED.onboarding_done, plan_active = EXCLUDED.plan_active,
        engagement_tier = EXCLUDED.engagement_tier, last_push_opened_at = EXCLUDED.last_push_opened_at,
        notifications_sent_today = EXCLUDED.notifications_sent_today, marketing_sent_today = EXCLUDED.marketing_sent_today`;
    return result;
  }

  async lastRefreshedAt(): Promise<Date | null> {
    const r = await this.prisma.notificationAudience.aggregate({ _max: { refreshedAt: true } });
    return r._max.refreshedAt;
  }
}
