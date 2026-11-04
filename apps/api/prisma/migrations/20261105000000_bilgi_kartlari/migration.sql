-- Doc 56 — Bilgi Kartları (4 Kas 2026). EKLEMELİ: mevcut kolon silinmez, mevcut uçların yanıt şekli
-- değişmez. İçerik (flashcards, flashcard_articles) + kullanıcı durumu (reviews, events, bookmarks,
-- sessions) + users.flashcard_daily_goal. Backfill yok (soğuk başlangıç). Deste tablosu yok: kapsam
-- hesaplanır (ders / konu / ünite etiketi).

CREATE TYPE "FlashcardKind" AS ENUM ('qa', 'cloze', 'numeric', 'trap');
CREATE TYPE "FlashcardRating" AS ENUM ('again', 'known', 'easy');

ALTER TABLE "users" ADD COLUMN "flashcard_daily_goal" INTEGER NOT NULL DEFAULT 20;

CREATE TABLE "flashcards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "topic_id" UUID NOT NULL,
  "summary_unit_id" UUID,
  "legislation_id" UUID,
  "kind" "FlashcardKind" NOT NULL DEFAULT 'qa',
  "front" TEXT NOT NULL,
  "back" TEXT NOT NULL,
  "explanation" TEXT,
  "difficulty" INTEGER NOT NULL DEFAULT 2,
  "derived_numbers" JSONB,
  "counter_numbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "source_label" TEXT NOT NULL,
  "generated_by" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
  "verified_at" TIMESTAMP(3),
  "stale_since" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "published_by" UUID,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "flashcards_topic_id_status_sort_order_idx" ON "flashcards"("topic_id", "status", "sort_order");
CREATE INDEX "flashcards_summary_unit_id_idx" ON "flashcards"("summary_unit_id");
CREATE INDEX "flashcards_stale_since_idx" ON "flashcards"("stale_since");
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_summary_unit_id_fkey"
  FOREIGN KEY ("summary_unit_id") REFERENCES "summary_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_legislation_id_fkey"
  FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "flashcard_articles" (
  "flashcard_id" UUID NOT NULL,
  "law_article_id" UUID NOT NULL,
  "article_version_no" INTEGER,
  "relation" TEXT NOT NULL DEFAULT 'primary',
  CONSTRAINT "flashcard_articles_pkey" PRIMARY KEY ("flashcard_id", "law_article_id")
);
CREATE INDEX "flashcard_articles_law_article_id_idx" ON "flashcard_articles"("law_article_id");
ALTER TABLE "flashcard_articles" ADD CONSTRAINT "flashcard_articles_flashcard_id_fkey"
  FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_articles" ADD CONSTRAINT "flashcard_articles_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "flashcard_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "mode" TEXT NOT NULL,
  "scope" JSONB NOT NULL,
  "source" TEXT,
  "queue" UUID[] DEFAULT ARRAY[]::UUID[],
  "cursor" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "flashcard_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "flashcard_sessions_user_id_last_activity_at_idx" ON "flashcard_sessions"("user_id", "last_activity_at");
ALTER TABLE "flashcard_sessions" ADD CONSTRAINT "flashcard_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "flashcard_reviews" (
  "user_id" UUID NOT NULL,
  "flashcard_id" UUID NOT NULL,
  "ease" DECIMAL(3,2) NOT NULL DEFAULT 2.5,
  "interval_days" INTEGER NOT NULL DEFAULT 0,
  "reps" INTEGER NOT NULL DEFAULT 0,
  "lapses" INTEGER NOT NULL DEFAULT 0,
  "due_at" TIMESTAMP(3) NOT NULL,
  "last_reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_rating" "FlashcardRating" NOT NULL,
  "review_count" INTEGER NOT NULL DEFAULT 0,
  "known_count" INTEGER NOT NULL DEFAULT 0,
  "again_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("user_id", "flashcard_id")
);
CREATE INDEX "flashcard_reviews_user_id_due_at_idx" ON "flashcard_reviews"("user_id", "due_at");
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey"
  FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "flashcard_review_events" (
  "id" BIGSERIAL NOT NULL,
  "user_id" UUID NOT NULL,
  "flashcard_id" UUID NOT NULL,
  "session_id" UUID,
  "client_event_id" UUID NOT NULL,
  "rating" "FlashcardRating" NOT NULL,
  "prev_state" JSONB,
  "undone_at" TIMESTAMP(3),
  "time_spent_ms" INTEGER,
  "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcard_review_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "flashcard_review_events_user_id_client_event_id_key" ON "flashcard_review_events"("user_id", "client_event_id");
CREATE INDEX "flashcard_review_events_user_id_reviewed_at_idx" ON "flashcard_review_events"("user_id", "reviewed_at");
CREATE INDEX "flashcard_review_events_user_id_flashcard_id_reviewed_at_idx" ON "flashcard_review_events"("user_id", "flashcard_id", "reviewed_at");
CREATE INDEX "flashcard_review_events_session_id_idx" ON "flashcard_review_events"("session_id");
ALTER TABLE "flashcard_review_events" ADD CONSTRAINT "flashcard_review_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_review_events" ADD CONSTRAINT "flashcard_review_events_flashcard_id_fkey"
  FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "flashcard_review_events" ADD CONSTRAINT "flashcard_review_events_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "flashcard_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "flashcard_bookmarks" (
  "user_id" UUID NOT NULL,
  "flashcard_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcard_bookmarks_pkey" PRIMARY KEY ("user_id", "flashcard_id")
);
ALTER TABLE "flashcard_bookmarks" ADD CONSTRAINT "flashcard_bookmarks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_bookmarks" ADD CONSTRAINT "flashcard_bookmarks_flashcard_id_fkey"
  FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
