-- Doc 54 — madde özetleri (28 Eki 2026). EKLEMELİ: bir enum, bir tablo (law_articles'a 1:1).
CREATE TYPE "VerificationStatus" AS ENUM ('pending_review', 'verified', 'needs_refresh');

CREATE TABLE "article_summaries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "law_article_id" UUID NOT NULL,
  "repealed" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT NOT NULL,
  "short_summary" TEXT NOT NULL,
  "detailed" TEXT,
  "key_points" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "conditions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "exceptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "time_limits" JSONB,
  "numerical_values" JSONB,
  "authority_and_limits" JSONB,
  "related_legislation" JSONB,
  "exam_reminders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "derived_numbers" JSONB,
  "counter_numbers" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "article_version_no" INTEGER,
  "stale_since" TIMESTAMP(3),
  "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
  "verified_at" TIMESTAMP(3),
  "source_label" TEXT NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "version" INTEGER NOT NULL DEFAULT 1,
  "generated_by" TEXT,
  "published_at" TIMESTAMP(3),
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "article_summaries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "article_summaries_law_article_id_key" ON "article_summaries"("law_article_id");
CREATE INDEX "article_summaries_status_idx" ON "article_summaries"("status");
CREATE INDEX "article_summaries_stale_since_idx" ON "article_summaries"("stale_since");
ALTER TABLE "article_summaries" ADD CONSTRAINT "article_summaries_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
