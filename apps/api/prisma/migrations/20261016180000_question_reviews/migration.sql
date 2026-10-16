-- Aralıklı tekrar hafızası (Doc 49 S1-A, 16 Eki 2026). EKLEMELİ: mevcut tablolara
-- dokunmaz; WrongAnswer korunur. Satır her cevapta upsert edilir (boş cevap hariç).
CREATE TABLE "question_reviews" (
  "user_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "ease" DECIMAL(3,2) NOT NULL DEFAULT 2.5,
  "interval_days" INTEGER NOT NULL DEFAULT 0,
  "reps" INTEGER NOT NULL DEFAULT 0,
  "lapses" INTEGER NOT NULL DEFAULT 0,
  "due_at" TIMESTAMP(3) NOT NULL,
  "last_reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_result" BOOLEAN NOT NULL,
  CONSTRAINT "question_reviews_pkey" PRIMARY KEY ("user_id", "question_id")
);
CREATE INDEX "question_reviews_user_id_due_at_idx" ON "question_reviews"("user_id", "due_at");
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
