-- Mevzuat P2 (Doc 29 §17-18): highlight + kişisel not.
CREATE TABLE "article_highlights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "law_article_id" UUID NOT NULL,
    "start_offset" INTEGER NOT NULL,
    "end_offset" INTEGER NOT NULL,
    "snippet" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_highlights_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "article_highlights_user_id_law_article_id_idx"
  ON "article_highlights"("user_id", "law_article_id");
ALTER TABLE "article_highlights" ADD CONSTRAINT "article_highlights_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_highlights" ADD CONSTRAINT "article_highlights_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "article_notes" (
    "user_id" UUID NOT NULL,
    "law_article_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_notes_pkey" PRIMARY KEY ("user_id", "law_article_id")
);
ALTER TABLE "article_notes" ADD CONSTRAINT "article_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_notes" ADD CONSTRAINT "article_notes_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
