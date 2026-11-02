-- Doc 55 F3: soru bildirimlerinin Soru Merkezi'ne iletim izi. Yalnız EKLEME; adaptör kapalıyken alanlar boş kalır.

ALTER TABLE "question_reports"
  ADD COLUMN "hub_forwarded_at" TIMESTAMP(3),
  ADD COLUMN "hub_report_id" UUID,
  ADD COLUMN "hub_flagged" BOOLEAN,
  ADD COLUMN "hub_forward_error" TEXT,
  ADD COLUMN "hub_forward_tries" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "question_reports_hub_forwarded_at_idx" ON "question_reports"("hub_forwarded_at");
