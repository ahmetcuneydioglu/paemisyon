-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('practice', 'exam', 'daily', 'review');

-- CreateEnum
CREATE TYPE "QuizSessionStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "mode" "QuizMode" NOT NULL,
    "topic_id" UUID,
    "status" "QuizSessionStatus" NOT NULL DEFAULT 'in_progress',
    "total_questions" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "blank_count" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(5,2),
    "duration_seconds" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_version_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_spent_ms" INTEGER,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_sessions_user_id_idx" ON "quiz_sessions"("user_id");

-- CreateIndex
CREATE INDEX "quiz_answers_session_id_idx" ON "quiz_answers"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answers_session_id_question_id_key" ON "quiz_answers"("session_id", "question_id");

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
