-- Doc 36: konu analizi ve toplam soru sayısı (yalnız ekleme).
ALTER TABLE "past_exams" ADD COLUMN "question_count" INTEGER;
ALTER TABLE "past_exams" ADD COLUMN "analysis" JSONB;
