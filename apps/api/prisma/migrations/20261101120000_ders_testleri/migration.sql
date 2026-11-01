-- Doc 49/18: ders testleri — 20'şerlik sabit setler. Yalnız ekleme (iki tablo + nullable kolon).

-- CreateTable
CREATE TABLE "course_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "topic_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_test_questions" (
    "test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "course_test_questions_pkey" PRIMARY KEY ("test_id","question_id")
);

-- AlterTable
ALTER TABLE "quiz_sessions" ADD COLUMN "course_test_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "course_tests_course_id_number_key" ON "course_tests"("course_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "course_test_questions_question_id_key" ON "course_test_questions"("question_id");

-- CreateIndex
CREATE INDEX "course_test_questions_test_id_position_idx" ON "course_test_questions"("test_id", "position");

-- CreateIndex
CREATE INDEX "quiz_sessions_user_id_course_test_id_idx" ON "quiz_sessions"("user_id", "course_test_id");

-- AddForeignKey
ALTER TABLE "course_tests" ADD CONSTRAINT "course_tests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tests" ADD CONSTRAINT "course_tests_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_test_questions" ADD CONSTRAINT "course_test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "course_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_test_questions" ADD CONSTRAINT "course_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_course_test_id_fkey" FOREIGN KEY ("course_test_id") REFERENCES "course_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
