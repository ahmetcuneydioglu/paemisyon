-- F8-A Planım (Doc 49/12 §4, 18 Eki 2026). EKLEMELİ: kalem türü, sınav türü, ufuk.
CREATE TYPE "StudyPlanItemKind" AS ENUM ('topic', 'review', 'mock');

ALTER TABLE "study_plan_items"
  ADD COLUMN "kind" "StudyPlanItemKind" NOT NULL DEFAULT 'topic',
  ALTER COLUMN "topic_id" DROP NOT NULL;

ALTER TABLE "study_plans"
  ADD COLUMN "exam_type_id" UUID,
  ADD COLUMN "horizon_weeks" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_exam_type_id_fkey"
  FOREIGN KEY ("exam_type_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Gerçek süre sayacı saniye; done_minutes türetilmiş (floor/60).
ALTER TABLE "study_plan_items" ADD COLUMN "done_seconds" INTEGER NOT NULL DEFAULT 0;
