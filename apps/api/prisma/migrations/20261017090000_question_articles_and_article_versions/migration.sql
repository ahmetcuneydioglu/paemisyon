-- Mevzuat ↔ soru (Doc 49 S1-B, 17 Eki 2026). EKLEMELİ: mevcut kolon silinmez;
-- `questions.article_no` ve `law_articles.text` yetkili kalır. Backfill betikle.
CREATE TYPE "QuestionArticleRelation" AS ENUM ('primary', 'related');
CREATE TYPE "QuestionArticleSource" AS ENUM ('legacy_article_no', 'editor', 'script');

CREATE TABLE "question_articles" (
  "question_id" UUID NOT NULL,
  "law_article_id" UUID NOT NULL,
  "relation" "QuestionArticleRelation" NOT NULL DEFAULT 'primary',
  "source" "QuestionArticleSource" NOT NULL DEFAULT 'legacy_article_no',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_articles_pkey" PRIMARY KEY ("question_id", "law_article_id")
);
CREATE INDEX "question_articles_law_article_id_idx" ON "question_articles"("law_article_id");
ALTER TABLE "question_articles" ADD CONSTRAINT "question_articles_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_articles" ADD CONSTRAINT "question_articles_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "law_article_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "law_article_id" UUID NOT NULL,
  "version_no" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "source_name" TEXT NOT NULL,
  "source_url" TEXT,
  "effective_from" DATE,
  "effective_to" DATE,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "law_article_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "law_article_versions_law_article_id_version_no_key"
  ON "law_article_versions"("law_article_id", "version_no");
ALTER TABLE "law_article_versions" ADD CONSTRAINT "law_article_versions_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
