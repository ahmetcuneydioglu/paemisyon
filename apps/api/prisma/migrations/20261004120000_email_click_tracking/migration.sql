-- Birinci taraf tıklama ölçümü (4 Eki 2026): SES CLICK izlemesi bağlantıları ortak
-- awstrack.me alan adına çevirip Gmail itibarını bozduğu için kapatıldı; tıklamalar
-- api.paemisyon.com/email/c/:sendId yönlendirmesinden sayılır.
-- AlterTable
ALTER TABLE "email_campaigns" ADD COLUMN     "clicked_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "email_sends" ADD COLUMN     "first_clicked_at" TIMESTAMP(3);
