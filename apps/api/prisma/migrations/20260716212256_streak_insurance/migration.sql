-- AlterTable
ALTER TABLE "streaks" ADD COLUMN     "freeze_week_start" DATE,
ADD COLUMN     "freezes_used" INTEGER NOT NULL DEFAULT 0;
