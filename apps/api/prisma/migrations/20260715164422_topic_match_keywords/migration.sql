-- AlterTable
ALTER TABLE "topics" ADD COLUMN "match_keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
