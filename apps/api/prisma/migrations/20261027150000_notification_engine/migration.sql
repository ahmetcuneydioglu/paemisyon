-- Doc 52 F1 — Bildirim Merkezi motoru (26 Eki 2026). EKLEMELİ: 11 yeni tablo, 12 tip; users.last_active_at,
-- push_tokens genişletmesi (mevcut satırlar is_active=true ile kalır). Mevcut veri değişmez.

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('daily_question', 'study_reminder', 'streak', 'exam', 'exam_countdown', 'new_content', 'achievement', 'statistics', 'leaderboard', 'question_report', 'marketing', 'system');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('push', 'inbox', 'email');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'failed', 'suppressed', 'no_device', 'expired');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('queued', 'sending', 'sent', 'failed', 'suppressed', 'expired');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('opened', 'clicked', 'read', 'converted', 'dismissed');

-- CreateEnum
CREATE TYPE "NotificationEventSource" AS ENUM ('push', 'inbox', 'web', 'email');

-- CreateEnum
CREATE TYPE "NotificationTemplateStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "NotificationAudienceMode" AS ENUM ('all', 'segment', 'users', 'testers');

-- CreateEnum
CREATE TYPE "NotificationSendMode" AS ENUM ('now', 'scheduled', 'smart');

-- CreateEnum
CREATE TYPE "NotificationCampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_active_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "push_tokens" ADD COLUMN     "app_version" TEXT,
ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "disabled_reason" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_error_at" TIMESTAMP(3),
ADD COLUMN     "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_label" TEXT,
    "route" TEXT,
    "web_path" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channels" "NotificationChannel"[],
    "campaign_id" UUID,
    "variant_id" UUID,
    "template_id" UUID,
    "automation_code" TEXT,
    "dedupe_key" TEXT,
    "conversion_event" TEXT,
    "attribution_until" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "delivery_status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "suppression_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "target" TEXT NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'queued',
    "suppression_reason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "provider_message_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "email_send_id" UUID,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" "NotificationEventType" NOT NULL,
    "source" "NotificationEventSource" NOT NULL,
    "platform" TEXT,
    "app_version" TEXT,
    "payload" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_daily_stats" (
    "day" DATE NOT NULL,
    "campaign_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    "automation_code" TEXT NOT NULL DEFAULT '',
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "platform" TEXT NOT NULL DEFAULT '',
    "queued" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "suppressed" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "converted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_daily_stats_pkey" PRIMARY KEY ("day","campaign_id","automation_code","category","channel","platform")
);

-- CreateTable
CREATE TABLE "notification_audience" (
    "user_id" UUID NOT NULL,
    "refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_active" BOOLEAN NOT NULL DEFAULT true,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "registered_days" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3),
    "last_active_days" INTEGER,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "premium_until" TIMESTAMP(3),
    "preferred_module_id" UUID,
    "target_exam_date" DATE,
    "exam_days_left" INTEGER,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "email_subscribed" BOOLEAN NOT NULL DEFAULT false,
    "streak_current" INTEGER NOT NULL DEFAULT 0,
    "streak_best" INTEGER NOT NULL DEFAULT 0,
    "daily_goal" INTEGER NOT NULL DEFAULT 20,
    "answered_today" INTEGER NOT NULL DEFAULT 0,
    "daily_goal_done_today" BOOLEAN NOT NULL DEFAULT false,
    "daily_question_done_today" BOOLEAN NOT NULL DEFAULT false,
    "study_seconds_today" INTEGER NOT NULL DEFAULT 0,
    "answered_total" INTEGER NOT NULL DEFAULT 0,
    "answered_7d" INTEGER NOT NULL DEFAULT 0,
    "answered_30d" INTEGER NOT NULL DEFAULT 0,
    "accuracy_30d" DECIMAL(5,2),
    "last_exam_at" TIMESTAMP(3),
    "last_exam_net" DECIMAL(5,2),
    "exam_count" INTEGER NOT NULL DEFAULT 0,
    "open_exam_session_id" UUID,
    "weak_topic_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "plan_active" BOOLEAN NOT NULL DEFAULT false,
    "engagement_tier" INTEGER NOT NULL DEFAULT 0,
    "last_push_opened_at" TIMESTAMP(3),
    "notifications_sent_today" INTEGER NOT NULL DEFAULT 0,
    "marketing_sent_today" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_audience_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "user_id" UUID NOT NULL,
    "categories" JSONB NOT NULL DEFAULT '{}',
    "reminder_time" TEXT NOT NULL DEFAULT '19:00',
    "quiet_start" TEXT NOT NULL DEFAULT '23:00',
    "quiet_end" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "smart_timing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notification_testers" (
    "user_id" UUID NOT NULL,
    "added_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_testers_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_label" TEXT,
    "deep_link" JSONB NOT NULL DEFAULT '{}',
    "email_subject" TEXT,
    "email_body" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "status" "NotificationTemplateStatus" NOT NULL DEFAULT 'active',
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL,
    "status" "NotificationTemplateStatus" NOT NULL DEFAULT 'active',
    "last_count" INTEGER,
    "last_counted_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "channels" "NotificationChannel"[],
    "audience_mode" "NotificationAudienceMode" NOT NULL DEFAULT 'all',
    "segment_id" UUID,
    "segment_rules_snapshot" JSONB,
    "user_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "send_mode" "NotificationSendMode" NOT NULL DEFAULT 'now',
    "scheduled_at" TIMESTAMP(3),
    "conversion_event" TEXT,
    "attribution_window_hours" INTEGER NOT NULL DEFAULT 24,
    "respect_quiet_hours" BOOLEAN NOT NULL DEFAULT true,
    "count_toward_caps" BOOLEAN NOT NULL DEFAULT true,
    "ttl_hours" INTEGER NOT NULL DEFAULT 24,
    "create_in_app_banner" BOOLEAN NOT NULL DEFAULT false,
    "status" "NotificationCampaignStatus" NOT NULL DEFAULT 'draft',
    "estimated_recipients" INTEGER,
    "materialized_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "suppressed_count" INTEGER NOT NULL DEFAULT 0,
    "materialize_cursor" UUID,
    "materialized_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" UUID,
    "cancel_reason" TEXT,
    "sent_by_id" UUID,
    "sent_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_campaign_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'A',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_label" TEXT,
    "deep_link" JSONB NOT NULL DEFAULT '{}',
    "email_subject" TEXT,
    "email_body" TEXT,
    "template_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_campaign_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_campaign_id_idx" ON "notifications"("campaign_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_dedupe_key_key" ON "notifications"("user_id", "dedupe_key");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_next_attempt_at_idx" ON "notification_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_user_id_sent_at_idx" ON "notification_deliveries"("user_id", "sent_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_email_send_id_idx" ON "notification_deliveries"("email_send_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_notification_id_channel_target_key" ON "notification_deliveries"("notification_id", "channel", "target");

-- CreateIndex
CREATE INDEX "notification_events_notification_id_event_type_idx" ON "notification_events"("notification_id", "event_type");

-- CreateIndex
CREATE INDEX "notification_events_user_id_occurred_at_idx" ON "notification_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "notification_events_occurred_at_idx" ON "notification_events"("occurred_at");

-- CreateIndex
CREATE INDEX "notification_daily_stats_day_idx" ON "notification_daily_stats"("day");

-- CreateIndex
CREATE INDEX "notification_audience_last_active_days_idx" ON "notification_audience"("last_active_days");

-- CreateIndex
CREATE INDEX "notification_audience_refreshed_at_idx" ON "notification_audience"("refreshed_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_category_status_idx" ON "notification_templates"("category", "status");

-- CreateIndex
CREATE INDEX "notification_campaigns_status_scheduled_at_idx" ON "notification_campaigns"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "notification_campaigns_created_at_idx" ON "notification_campaigns"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_campaign_variants_campaign_id_key_key" ON "notification_campaign_variants"("campaign_id", "key");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_is_active_idx" ON "push_tokens"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_audience" ADD CONSTRAINT "notification_audience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_testers" ADD CONSTRAINT "notification_testers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_campaigns" ADD CONSTRAINT "notification_campaigns_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "notification_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_campaign_variants" ADD CONSTRAINT "notification_campaign_variants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_campaign_variants" ADD CONSTRAINT "notification_campaign_variants_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

