-- CreateEnum
CREATE TYPE "BadgeKind" AS ENUM ('streak', 'solved', 'exam', 'accuracy');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "daily_goal" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "badges" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "BadgeKind" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_id" UUID NOT NULL,
    "badge_key" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id","badge_key")
);

-- CreateTable
CREATE TABLE "topic_mastery_snapshots" (
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "mastery" DECIMAL(4,3) NOT NULL,
    "solved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "topic_mastery_snapshots_pkey" PRIMARY KEY ("user_id","topic_id","week_start")
);

-- CreateIndex
CREATE INDEX "topic_mastery_snapshots_user_id_week_start_idx" ON "topic_mastery_snapshots"("user_id", "week_start");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_key_fkey" FOREIGN KEY ("badge_key") REFERENCES "badges"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_mastery_snapshots" ADD CONSTRAINT "topic_mastery_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_mastery_snapshots" ADD CONSTRAINT "topic_mastery_snapshots_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
