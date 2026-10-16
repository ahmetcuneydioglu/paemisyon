-- Günlük süre + soru kalitesi (Doc 49 S1-D, 17 Eki 2026). EKLEMELİ, üç kolon.
ALTER TABLE "users" ADD COLUMN "daily_minutes" INTEGER;
ALTER TABLE "daily_usage" ADD COLUMN "study_seconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "question_versions" ADD COLUMN "last_reviewed_at" TIMESTAMP(3);
