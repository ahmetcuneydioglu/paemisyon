-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "article_no" TEXT;

-- CreateIndex
CREATE INDEX "questions_topic_id_article_no_idx" ON "questions"("topic_id", "article_no");
