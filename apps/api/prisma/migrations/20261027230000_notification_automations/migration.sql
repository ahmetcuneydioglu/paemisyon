-- Doc 52 F2 — olay omurgası, otomasyonlar, sınav takvimi (26 Eki 2026). EKLEMELİ: 5 yeni tablo, 2 tip. Mevcut veri değişmez.

-- CreateEnum
CREATE TYPE "NotificationTriggerType" AS ENUM ('schedule', 'event');

-- CreateEnum
CREATE TYPE "NotificationAutomationStatus" AS ENUM ('draft', 'active', 'paused');

-- CreateTable
CREATE TABLE "app_events" (
    "id" BIGSERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "app_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_automations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "NotificationCategory" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "channels" "NotificationChannel"[],
    "trigger_type" "NotificationTriggerType" NOT NULL,
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "event_type" TEXT,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta_label" TEXT,
    "image_url" TEXT,
    "deep_link" JSONB NOT NULL DEFAULT '{}',
    "email_subject" TEXT,
    "email_body" TEXT,
    "template_id" UUID,
    "conversion_event" TEXT,
    "attribution_window_hours" INTEGER NOT NULL DEFAULT 24,
    "cooldown_hours" INTEGER NOT NULL DEFAULT 48,
    "max_per_user_per_day" INTEGER NOT NULL DEFAULT 1,
    "respect_quiet_hours" BOOLEAN NOT NULL DEFAULT true,
    "count_toward_caps" BOOLEAN NOT NULL DEFAULT true,
    "ttl_hours" INTEGER NOT NULL DEFAULT 24,
    "status" "NotificationAutomationStatus" NOT NULL DEFAULT 'paused',
    "activated_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "consecutive_errors" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_automation_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "automation_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "trigger_type" "NotificationTriggerType" NOT NULL,
    "evaluated" INTEGER NOT NULL DEFAULT 0,
    "matched" INTEGER NOT NULL DEFAULT 0,
    "queued" INTEGER NOT NULL DEFAULT 0,
    "suppressed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "notification_automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_automation_events" (
    "automation_id" UUID NOT NULL,
    "event_id" BIGINT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,

    CONSTRAINT "notification_automation_events_pkey" PRIMARY KEY ("automation_id","event_id")
);

-- CreateTable
CREATE TABLE "exam_calendar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exam_type_id" UUID,
    "name" TEXT NOT NULL,
    "exam_date" DATE NOT NULL,
    "countdown_days" INTEGER[] DEFAULT ARRAY[60, 30, 14, 7, 3, 1]::INTEGER[],
    "is_confirmed" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_events_event_type_occurred_at_idx" ON "app_events"("event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "app_events_processed_at_id_idx" ON "app_events"("processed_at", "id");

-- CreateIndex
CREATE INDEX "app_events_user_id_occurred_at_idx" ON "app_events"("user_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_automations_code_key" ON "notification_automations"("code");

-- CreateIndex
CREATE INDEX "notification_automations_status_trigger_type_idx" ON "notification_automations"("status", "trigger_type");

-- CreateIndex
CREATE INDEX "notification_automation_runs_automation_id_started_at_idx" ON "notification_automation_runs"("automation_id", "started_at");

-- CreateIndex
CREATE INDEX "notification_automation_events_event_id_idx" ON "notification_automation_events"("event_id");

-- CreateIndex
CREATE INDEX "exam_calendar_is_active_exam_date_idx" ON "exam_calendar"("is_active", "exam_date");

-- AddForeignKey
ALTER TABLE "notification_automations" ADD CONSTRAINT "notification_automations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_automation_runs" ADD CONSTRAINT "notification_automation_runs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "notification_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_automation_events" ADD CONSTRAINT "notification_automation_events_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "notification_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_automation_events" ADD CONSTRAINT "notification_automation_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "app_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_calendar" ADD CONSTRAINT "exam_calendar_exam_type_id_fkey" FOREIGN KEY ("exam_type_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
