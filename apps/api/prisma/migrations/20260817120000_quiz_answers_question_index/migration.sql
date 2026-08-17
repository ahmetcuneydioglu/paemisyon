-- Tazelik seçimi (görülmemiş soru önceliği) question_id üzerinden sorgular.
CREATE INDEX IF NOT EXISTS "quiz_answers_question_id_idx" ON "quiz_answers"("question_id");
