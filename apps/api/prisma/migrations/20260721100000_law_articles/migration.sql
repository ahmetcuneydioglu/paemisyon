-- CreateTable
CREATE TABLE "law_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "article_no" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source_name" TEXT NOT NULL DEFAULT 'mevzuat.gov.tr',
    "source_url" TEXT,
    "effective_info" TEXT,
    "last_verified_at" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "law_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "law_articles_topic_id_article_no_key" ON "law_articles"("topic_id", "article_no");

-- CreateIndex
CREATE INDEX "law_articles_topic_id_status_idx" ON "law_articles"("topic_id", "status");

-- AddForeignKey
ALTER TABLE "law_articles" ADD CONSTRAINT "law_articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
