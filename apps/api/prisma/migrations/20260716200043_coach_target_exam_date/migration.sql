-- AlterTable
ALTER TABLE "topics" ALTER COLUMN "match_keywords" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "target_exam_date" DATE;
