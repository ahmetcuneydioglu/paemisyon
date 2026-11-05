-- Doc 56 §3f — Bilgi kartı hata bildirimleri (6 Kas 2026). EKLEMELİ: yeni tablo, mevcut tablolara dokunmaz.
-- question_reports'un kart eşi; Soru Merkezi iletim alanları yok (kart bizim üretimimiz).

CREATE TABLE "flashcard_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "flashcard_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'open',
  "resolved_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "flashcard_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "flashcard_reports_status_created_at_idx" ON "flashcard_reports"("status", "created_at");
CREATE INDEX "flashcard_reports_flashcard_id_idx" ON "flashcard_reports"("flashcard_id");

ALTER TABLE "flashcard_reports" ADD CONSTRAINT "flashcard_reports_flashcard_id_fkey"
  FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_reports" ADD CONSTRAINT "flashcard_reports_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
