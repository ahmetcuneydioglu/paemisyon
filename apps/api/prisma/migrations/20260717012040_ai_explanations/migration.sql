-- AlterTable
ALTER TABLE "daily_usage" ADD COLUMN     "ai_explanations_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_explanations" (
    "question_version_id" UUID NOT NULL,
    "chosen_option_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_explanations_pkey" PRIMARY KEY ("question_version_id","chosen_option_id")
);
