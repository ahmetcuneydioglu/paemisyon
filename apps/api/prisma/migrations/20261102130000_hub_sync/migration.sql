-- Doc 55: Soru Merkezi bağlantısı. Yalnız EKLEME; adaptör kapalıyken uygulama bugünkü gibi çalışır.

ALTER TABLE "questions" ADD COLUMN "hub_question_id" UUID, ADD COLUMN "hub_code" TEXT;
CREATE UNIQUE INDEX "questions_hub_question_id_key" ON "questions"("hub_question_id");

ALTER TABLE "question_versions" ADD COLUMN "hub_version_id" UUID;
CREATE UNIQUE INDEX "question_versions_hub_version_id_key" ON "question_versions"("hub_version_id");

ALTER TYPE "QuestionArticleSource" ADD VALUE IF NOT EXISTS 'hub';

CREATE TABLE "hub_sync_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "stream_epoch" INTEGER,
    "last_acked_seq" BIGINT NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hub_sync_state_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hub_sync_state_single_row" CHECK ("id" = 1)
);

CREATE TABLE "hub_topic_map" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hub_topic_id" UUID NOT NULL,
    "hub_code" TEXT NOT NULL,
    "hub_name" TEXT NOT NULL,
    "topic_id" UUID,
    "article_from" INTEGER,
    "article_to" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hub_topic_map_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hub_topic_map_hub_topic_id_topic_id_key" ON "hub_topic_map"("hub_topic_id", "topic_id");
CREATE INDEX "hub_topic_map_hub_topic_id_idx" ON "hub_topic_map"("hub_topic_id");
ALTER TABLE "hub_topic_map" ADD CONSTRAINT "hub_topic_map_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "hub_legislation_map" (
    "hub_legislation_id" UUID NOT NULL,
    "hub_number" TEXT,
    "hub_type" TEXT,
    "hub_name" TEXT NOT NULL,
    "hub_short_name" TEXT,
    "legislation_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hub_legislation_map_pkey" PRIMARY KEY ("hub_legislation_id")
);
ALTER TABLE "hub_legislation_map" ADD CONSTRAINT "hub_legislation_map_legislation_id_fkey" FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "hub_sync_log" (
    "id" BIGSERIAL NOT NULL,
    "seq" BIGINT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "detail" TEXT,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hub_sync_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hub_sync_log_created_at_idx" ON "hub_sync_log"("created_at");
CREATE INDEX "hub_sync_log_result_created_at_idx" ON "hub_sync_log"("result", "created_at");
