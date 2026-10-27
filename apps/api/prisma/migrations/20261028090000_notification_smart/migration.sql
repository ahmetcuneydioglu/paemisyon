-- Doc 52 F3 — akıllı saat (28 Eki 2026). EKLEMELİ: kampanya penceresi ve kitle en iyi saati. Mevcut veri değişmez.

-- AlterTable
ALTER TABLE "notification_audience" ADD COLUMN     "best_engagement_hour" INTEGER;

-- AlterTable
ALTER TABLE "notification_campaigns" ADD COLUMN     "smart_window_end" TEXT,
ADD COLUMN     "smart_window_start" TEXT;
