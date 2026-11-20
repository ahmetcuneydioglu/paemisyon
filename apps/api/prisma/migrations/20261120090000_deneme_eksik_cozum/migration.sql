-- Deneme: eksik çözüm (20 Kas 2026). Resmî çözümde soruların %20'sinden azını cevaplayan
-- sıralama ve toplu istatistiğe girmez; kayıt ve adayın kendi sonucu durur.
ALTER TABLE "exams" ADD COLUMN "min_answer_percent" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "quiz_sessions" ADD COLUMN "rank_eligible" BOOLEAN NOT NULL DEFAULT true;

-- Geriye dönük: tamamlanmış resmî deneme çözümlerinde işaretlenen şık sayısı eşiğin altındaysa.
UPDATE "quiz_sessions" qs
SET "rank_eligible" = false
WHERE qs."mode" = 'deneme'
  AND qs."attempt_role" = 'official'
  AND qs."status" = 'completed'
  AND qs."total_questions" > 0
  AND (
    SELECT COUNT(*) FROM "quiz_answers" qa
    WHERE qa."session_id" = qs."id" AND qa."selected_option_id" IS NOT NULL
  ) < CEIL(qs."total_questions" * 0.20);

CREATE INDEX "quiz_sessions_exam_ranked_idx" ON "quiz_sessions" ("exam_id") WHERE "attempt_role" = 'official' AND "status" = 'completed' AND "rank_eligible";
