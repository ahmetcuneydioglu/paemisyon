-- Haftalık plan iskeleti (Doc 49 S1-E, 17 Eki 2026). EKLEMELİ; servis F8'de dolar.
CREATE TYPE "StudyPlanStatus" AS ENUM ('active', 'archived');
CREATE TYPE "StudyPlanItemStatus" AS ENUM ('pending', 'done', 'skipped');

CREATE TABLE "study_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "exam_date" DATE,
  "weekly_minutes" INTEGER NOT NULL,
  "status" "StudyPlanStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revised_at" TIMESTAMP(3),
  CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "study_plans_user_id_status_idx" ON "study_plans"("user_id", "status");
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "study_plan_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_id" UUID NOT NULL,
  "week_start" DATE NOT NULL,
  "topic_id" UUID NOT NULL,
  "target_questions" INTEGER NOT NULL DEFAULT 0,
  "target_minutes" INTEGER NOT NULL DEFAULT 0,
  "done_questions" INTEGER NOT NULL DEFAULT 0,
  "done_minutes" INTEGER NOT NULL DEFAULT 0,
  "status" "StudyPlanItemStatus" NOT NULL DEFAULT 'pending',
  CONSTRAINT "study_plan_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "study_plan_items_plan_id_week_start_idx" ON "study_plan_items"("plan_id", "week_start");
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
