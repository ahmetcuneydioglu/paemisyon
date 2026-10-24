-- Doc 50 — Denemeler V2 (24 Eki 2026). EKLEMELİ + veri taşıma.
-- Serbest/takvimli yayın modu, resmî/tekrar çözüm rolü, mutlak son tarih,
-- donmuş sıralama, soru iptali, hatırlatma kuyruğu, teslim-sonrası iş kuyruğu.

CREATE TYPE "ExamPublishMode" AS ENUM ('serbest', 'takvimli');
CREATE TYPE "ExamDifficulty" AS ENUM ('kolay', 'orta', 'zor');
CREATE TYPE "AttemptRole" AS ENUM ('official', 'practice');
CREATE TYPE "SessionClosedReason" AS ENUM ('submitted', 'timeout');
CREATE TYPE "ExamAdjustmentAction" AS ENUM ('credit_all', 'exclude');
CREATE TYPE "ExamReminderKind" AS ENUM ('day_before', 'hour_before', 'result_ready');

-- ── exams ──
ALTER TABLE "exams"
  ADD COLUMN "publish_mode" "ExamPublishMode" NOT NULL DEFAULT 'takvimli',
  ADD COLUMN "end_at" TIMESTAMP(3),
  ADD COLUMN "difficulty" "ExamDifficulty",
  ADD COLUMN "exam_type_id" UUID,
  ADD COLUMN "practice_after_end" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "remind_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "question_pack" JSONB,
  ADD COLUMN "question_pack_built_at" TIMESTAMP(3),
  ADD COLUMN "rankings_computed_at" TIMESTAMP(3);

ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_type_id_fkey"
  FOREIGN KEY ("exam_type_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mevcut (takvimli) denemelerde pencere kapanışı açıkça yazılır.
UPDATE "exams" SET "end_at" = "start_at" + make_interval(mins => "duration_minutes") WHERE "end_at" IS NULL;
-- Eski arşiv anahtarı → pratik anahtarı (anlam aynı: bitince çözülebilir mi).
UPDATE "exams" SET "practice_after_end" = "archive_open_after_end";
-- Tek sınav türü varsa (PAEM) bütün denemeler ona bağlanır; birden fazlaysa panelden seçilir.
UPDATE "exams" e SET "exam_type_id" = m.id
  FROM (SELECT id FROM "modules" WHERE "is_active" = true ORDER BY "sort_order" LIMIT 1) m
  WHERE e."exam_type_id" IS NULL
    AND (SELECT COUNT(*) FROM "modules" WHERE "is_active" = true) = 1;
ALTER TABLE "exams" DROP COLUMN "archive_open_after_end";

CREATE INDEX "exams_status_publish_mode_end_at_idx" ON "exams"("status", "publish_mode", "end_at");

-- ── quiz_sessions ──
ALTER TABLE "quiz_sessions"
  ADD COLUMN "attempt_role" "AttemptRole",
  ADD COLUMN "closed_reason" "SessionClosedReason",
  ADD COLUMN "deadline_at" TIMESTAMP(3),
  ADD COLUMN "previous_score" DECIMAL(5,2),
  ADD COLUMN "score_updated_at" TIMESTAMP(3);

-- Mevcut canlı katılımlar RESMÎ çözümdür.
UPDATE "quiz_sessions" SET "attempt_role" = 'official' WHERE "exam_id" IS NOT NULL AND "attempt_role" IS NULL;
UPDATE "quiz_sessions" SET "closed_reason" = 'submitted' WHERE "exam_id" IS NOT NULL AND "status" = 'completed';
UPDATE "quiz_sessions" SET "deadline_at" = "started_at" + make_interval(secs => "planned_duration_seconds")
  WHERE "deadline_at" IS NULL AND "planned_duration_seconds" IS NOT NULL;

-- Eski tam tekil anahtar ÖNCE kalkar: aşağıdaki taşıma aynı (user, exam) için
-- resmî + tekrar satırı üretir; tekillik yalnız resmî çözüm için kısmi indeksle gelir.
ALTER TABLE "quiz_sessions" DROP CONSTRAINT IF EXISTS "quiz_sessions_user_id_exam_id_key";
DROP INDEX IF EXISTS "quiz_sessions_user_id_exam_id_key";

-- DENEME arşiv çözümleri (çıkmış sınav DEĞİL) → aynı denemenin tekrar çözümü.
-- Puanı yüzdeydi (mode=exam); net'e çevrilir ki geçmişte tek birim olsun.
UPDATE "quiz_sessions" qs
  SET "exam_id" = qs."archive_exam_id",
      "archive_exam_id" = NULL,
      "mode" = 'deneme',
      "attempt_role" = 'practice',
      "closed_reason" = CASE WHEN qs."status" = 'completed' THEN 'submitted'::"SessionClosedReason" ELSE NULL END,
      "score" = CASE WHEN qs."status" = 'completed' THEN (qs."correct_count" - qs."wrong_count" / 4.0) ELSE qs."score" END
  FROM "exams" e
  LEFT JOIN "past_exams" pe ON pe."exam_id" = e.id
  WHERE qs."archive_exam_id" = e.id AND pe.id IS NULL;

CREATE UNIQUE INDEX "quiz_sessions_official_once" ON "quiz_sessions"("user_id", "exam_id")
  WHERE "attempt_role" = 'official' AND "status" <> 'abandoned';
CREATE INDEX "quiz_sessions_user_id_exam_id_idx" ON "quiz_sessions"("user_id", "exam_id");
CREATE INDEX "quiz_sessions_exam_id_attempt_role_status_idx" ON "quiz_sessions"("exam_id", "attempt_role", "status");

-- ── exam_rankings ──
CREATE TABLE "exam_rankings" (
  "exam_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "wrong_count" INTEGER NOT NULL,
  "duration_seconds" INTEGER NOT NULL,
  "submitted_at" TIMESTAMP(3) NOT NULL,
  "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_rankings_pkey" PRIMARY KEY ("exam_id", "user_id")
);
CREATE INDEX "exam_rankings_exam_id_rank_idx" ON "exam_rankings"("exam_id", "rank");
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_exam_id_fkey"
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── exam_question_adjustments ──
CREATE TABLE "exam_question_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "exam_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "action" "ExamAdjustmentAction" NOT NULL,
  "reason" TEXT NOT NULL,
  "actor_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reverted_at" TIMESTAMP(3),
  CONSTRAINT "exam_question_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "exam_question_adjustments_exam_id_reverted_at_idx" ON "exam_question_adjustments"("exam_id", "reverted_at");
ALTER TABLE "exam_question_adjustments" ADD CONSTRAINT "exam_question_adjustments_exam_id_fkey"
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── exam_reminders ──
CREATE TABLE "exam_reminders" (
  "exam_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "kind" "ExamReminderKind" NOT NULL,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_reminders_pkey" PRIMARY KEY ("exam_id", "user_id", "kind")
);
CREATE INDEX "exam_reminders_exam_id_kind_sent_at_idx" ON "exam_reminders"("exam_id", "kind", "sent_at");
ALTER TABLE "exam_reminders" ADD CONSTRAINT "exam_reminders_exam_id_fkey"
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_reminders" ADD CONSTRAINT "exam_reminders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── exam_finalize_jobs ──
CREATE TABLE "exam_finalize_jobs" (
  "session_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  CONSTRAINT "exam_finalize_jobs_pkey" PRIMARY KEY ("session_id")
);
CREATE INDEX "exam_finalize_jobs_processed_at_created_at_idx" ON "exam_finalize_jobs"("processed_at", "created_at");
