-- Günlük TOPLAM cevap (Doc 48 A9, 14 Eki 2026) — kota sayacından AYRI kolon.
-- questions_answered ücretsiz planın KOTASIDIR ve deneme/exam cevapları ondan
-- muaftır (2 Eyl 2026 canlı deneme kazası: kotası dolan ücretsiz kullanıcı
-- denemenin ortasında kesilmişti). Bugün halkası, aktif gün, tempo ve aktivite
-- şeridi ise denemede çözülen soruları da saymalı; ikisi tek kolonda
-- birleşirse deneme kotayı tüketir. Bu yüzden ayrı: total_answered her yeni
-- cevabı sayar, questions_answered yalnız kotaya tabi olanları.
-- AlterTable
ALTER TABLE "daily_usage" ADD COLUMN     "total_answered" INTEGER NOT NULL DEFAULT 0;

-- Geçmiş günler: o güne kadar sayılan tüm cevaplar kotaya tabi modlardandı.
UPDATE "daily_usage" SET "total_answered" = "questions_answered";
