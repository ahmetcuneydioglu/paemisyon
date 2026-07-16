-- AlterTable
ALTER TABLE "question_versions" ADD COLUMN "content_hash" TEXT;

-- CreateIndex
CREATE INDEX "question_versions_content_hash_idx" ON "question_versions"("content_hash");
