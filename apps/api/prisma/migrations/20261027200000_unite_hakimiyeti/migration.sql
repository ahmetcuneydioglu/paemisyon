-- Doc 53 F5 — ünite hâkimiyeti (26 Eki 2026). EKLEMELİ: tek tablo; ünite etikettir, konu ağacı değişmez.
CREATE TABLE "user_unit_progress" (
  "user_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "solved_count" INTEGER NOT NULL DEFAULT 0,
  "correct_count" INTEGER NOT NULL DEFAULT 0,
  "mastery" DECIMAL(4,3) NOT NULL DEFAULT 0,
  "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_unit_progress_pkey" PRIMARY KEY ("user_id", "unit_id")
);
CREATE INDEX "user_unit_progress_user_id_last_activity_at_idx" ON "user_unit_progress"("user_id", "last_activity_at");
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "summary_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
