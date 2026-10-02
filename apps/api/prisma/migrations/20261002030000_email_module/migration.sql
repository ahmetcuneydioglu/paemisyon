-- E-posta modülü (2 Eki 2026; docs/47-eposta-ses/02-tasarim.md §3).
--
-- Toplu bilgilendirme ve pazarlama postaları Amazon SES ile gönderilir. Yalnız
-- yeni tablolar eklenir; mevcut tablolara dokunulmaz (users'a yalnız ters ilişki).
-- email_contacts: projenin posta listesi (canlı kullanıcılar + paem705 eski adresleri).
-- email_sends: kampanya × kişi tekilliği ve çökme kurtarması (UNIQUE campaign+contact).
-- email_events: ham SES olayı; 90 günden eskiler günlük işle silinir.
-- CreateEnum
CREATE TYPE "EmailContactSource" AS ENUM ('live_user', 'legacy_paem705', 'manual');

-- CreateEnum
CREATE TYPE "EmailContactStatus" AS ENUM ('subscribed', 'unsubscribed', 'bounced', 'complained', 'suppressed');

-- CreateEnum
CREATE TYPE "EmailTopic" AS ENUM ('duyuru', 'kampanya');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('draft', 'test_sent', 'scheduled', 'sending', 'paused', 'completed', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "EmailSendStatus" AS ENUM ('queued', 'claimed', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('send', 'delivery', 'bounce', 'complaint', 'reject', 'delivery_delay', 'click', 'rendering_failure');

-- CreateTable
CREATE TABLE "email_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "user_id" UUID,
    "display_name" TEXT,
    "source" "EmailContactSource" NOT NULL,
    "legacy_year" INTEGER,
    "status" "EmailContactStatus" NOT NULL DEFAULT 'subscribed',
    "consent_at" TIMESTAMP(3),
    "consent_source" TEXT,
    "unsubscribed_at" TIMESTAMP(3),
    "unsubscribe_reason" TEXT,
    "unsubscribe_token" TEXT NOT NULL,
    "soft_bounce_count" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_topic_preferences" (
    "contact_id" UUID NOT NULL,
    "topic" "EmailTopic" NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_topic_preferences_pkey" PRIMARY KEY ("contact_id","topic")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "topic" "EmailTopic" NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "from_name" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "reply_to" TEXT,
    "body_markdown" TEXT NOT NULL,
    "html_snapshot" TEXT,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'draft',
    "audience" JSONB NOT NULL DEFAULT '{}',
    "daily_cap" INTEGER NOT NULL DEFAULT 150,
    "send_rate_per_sec" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "paused_reason" TEXT,
    "created_by" UUID NOT NULL,
    "targeted_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "bounced_count" INTEGER NOT NULL DEFAULT 0,
    "complained_count" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sends" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "status" "EmailSendStatus" NOT NULL DEFAULT 'queued',
    "ses_message_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ses_message_id" TEXT NOT NULL,
    "send_id" UUID,
    "type" "EmailEventType" NOT NULL,
    "subtype" TEXT,
    "recipient" TEXT NOT NULL,
    "payload" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_contacts_email_key" ON "email_contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_contacts_unsubscribe_token_key" ON "email_contacts"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "email_contacts_status_idx" ON "email_contacts"("status");

-- CreateIndex
CREATE INDEX "email_contacts_source_legacy_year_idx" ON "email_contacts"("source", "legacy_year");

-- CreateIndex
CREATE INDEX "email_contacts_user_id_idx" ON "email_contacts"("user_id");

-- CreateIndex
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "email_sends_ses_message_id_key" ON "email_sends"("ses_message_id");

-- CreateIndex
CREATE INDEX "email_sends_campaign_id_status_idx" ON "email_sends"("campaign_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "email_sends_campaign_id_contact_id_key" ON "email_sends"("campaign_id", "contact_id");

-- CreateIndex
CREATE INDEX "email_events_type_occurred_at_idx" ON "email_events"("type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_events_ses_message_id_type_occurred_at_key" ON "email_events"("ses_message_id", "type", "occurred_at");

-- AddForeignKey
ALTER TABLE "email_contacts" ADD CONSTRAINT "email_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_topic_preferences" ADD CONSTRAINT "email_topic_preferences_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "email_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "email_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_send_id_fkey" FOREIGN KEY ("send_id") REFERENCES "email_sends"("id") ON DELETE SET NULL ON UPDATE CASCADE;

