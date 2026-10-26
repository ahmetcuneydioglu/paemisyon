-- Doc 53 — Konu Özetleri (26 Eki 2026). EKLEMELİ: dört tablo, bir tip; mevcut veri değişmez.
CREATE TYPE "SummaryBlockType" AS ENUM ('concept', 'rule', 'numbers', 'compare', 'trap', 'exam_stats', 'bridge');

CREATE TABLE "summary_units" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "topic_id" UUID NOT NULL,
  "legislation_id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "article_from" TEXT NOT NULL,
  "article_to" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_premium" BOOLEAN NOT NULL DEFAULT false,
  "reading_minutes" INTEGER NOT NULL DEFAULT 10,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "source_label" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "generated_by" TEXT,
  "published_at" TIMESTAMP(3),
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "summary_units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "summary_units_slug_key" ON "summary_units"("slug");
CREATE INDEX "summary_units_topic_id_status_sort_order_idx" ON "summary_units"("topic_id", "status", "sort_order");
CREATE INDEX "summary_units_legislation_id_idx" ON "summary_units"("legislation_id");
ALTER TABLE "summary_units" ADD CONSTRAINT "summary_units_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "summary_units" ADD CONSTRAINT "summary_units_legislation_id_fkey"
  FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "summary_blocks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "unit_id" UUID NOT NULL,
  "type" "SummaryBlockType" NOT NULL,
  "title" TEXT,
  "body" TEXT,
  "rows" JSONB,
  "derived_numbers" JSONB,
  "counter_numbers" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "generated" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "stale_since" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "summary_blocks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "summary_blocks_unit_id_sort_order_idx" ON "summary_blocks"("unit_id", "sort_order");
CREATE INDEX "summary_blocks_stale_since_idx" ON "summary_blocks"("stale_since");
ALTER TABLE "summary_blocks" ADD CONSTRAINT "summary_blocks_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "summary_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "summary_block_articles" (
  "block_id" UUID NOT NULL,
  "law_article_id" UUID NOT NULL,
  "article_version_no" INTEGER,
  CONSTRAINT "summary_block_articles_pkey" PRIMARY KEY ("block_id", "law_article_id")
);
CREATE INDEX "summary_block_articles_law_article_id_idx" ON "summary_block_articles"("law_article_id");
ALTER TABLE "summary_block_articles" ADD CONSTRAINT "summary_block_articles_block_id_fkey"
  FOREIGN KEY ("block_id") REFERENCES "summary_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "summary_block_articles" ADD CONSTRAINT "summary_block_articles_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "summary_progress" (
  "user_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "last_block_index" INTEGER NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "summary_progress_pkey" PRIMARY KEY ("user_id", "unit_id")
);
CREATE INDEX "summary_progress_user_id_updated_at_idx" ON "summary_progress"("user_id", "updated_at");
ALTER TABLE "summary_progress" ADD CONSTRAINT "summary_progress_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "summary_progress" ADD CONSTRAINT "summary_progress_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "summary_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
