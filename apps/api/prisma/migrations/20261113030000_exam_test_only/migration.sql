-- Prova denemesi: yalnız test hesaplarına (admin, beta) görünür (13 Kas 2026).
ALTER TABLE "exams" ADD COLUMN "test_only" BOOLEAN NOT NULL DEFAULT false;
