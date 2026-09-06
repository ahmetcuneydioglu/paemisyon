-- Doc 36: çıkmış sınav vitrini. Yalnız EKLEME — mevcut tablolara dokunulmaz.

CREATE TYPE "PastExamKind" AS ENUM ('resmi', 'analiz');

CREATE TABLE "past_exams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "term" INTEGER,
    "held_on" DATE,
    "kind" "PastExamKind" NOT NULL,
    "summary" TEXT,
    "exam_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "past_exams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "past_exams_slug_key" ON "past_exams"("slug");
CREATE UNIQUE INDEX "past_exams_exam_id_key" ON "past_exams"("exam_id");
CREATE INDEX "past_exams_status_sort_order_idx" ON "past_exams"("status", "sort_order");

CREATE TABLE "past_exam_questions" (
    "past_exam_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "order_no" INTEGER NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "publicly_visible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "past_exam_questions_pkey" PRIMARY KEY ("past_exam_id", "question_id")
);

CREATE UNIQUE INDEX "past_exam_questions_past_exam_id_order_no_key" ON "past_exam_questions"("past_exam_id", "order_no");
CREATE INDEX "past_exam_questions_question_id_idx" ON "past_exam_questions"("question_id");

ALTER TABLE "past_exam_questions" ADD CONSTRAINT "past_exam_questions_past_exam_id_fkey"
    FOREIGN KEY ("past_exam_id") REFERENCES "past_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "past_exam_questions" ADD CONSTRAINT "past_exam_questions_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
