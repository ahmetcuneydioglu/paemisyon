-- Doc 57 — Konu anlatımı (7 Kas 2026). EKLEMELİ: bölüm → ders → sürümlü içerik parçaları, kaynaklar,
-- bağlar ve kullanıcı okuma konumu. Mevcut tablo/kolon değişmez; backfill yok.

CREATE TYPE "LessonSourceKind" AS ENUM ('book', 'url', 'article');

CREATE TABLE "lesson_sections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "course_id" UUID NOT NULL,
  "topic_id" UUID,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_premium" BOOLEAN NOT NULL DEFAULT false,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "lesson_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lesson_sections_slug_key" ON "lesson_sections"("slug");
CREATE INDEX "lesson_sections_course_id_status_sort_order_idx" ON "lesson_sections"("course_id", "status", "sort_order");
CREATE INDEX "lesson_sections_topic_id_idx" ON "lesson_sections"("topic_id");
ALTER TABLE "lesson_sections" ADD CONSTRAINT "lesson_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_sections" ADD CONSTRAINT "lesson_sections_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lessons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "section_id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "reading_minutes" INTEGER NOT NULL DEFAULT 8,
  "status" "ContentStatus" NOT NULL DEFAULT 'in_review',
  "source_label" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "published_at" TIMESTAMP(3),
  "published_by" UUID,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");
CREATE INDEX "lessons_section_id_status_sort_order_idx" ON "lessons"("section_id", "status", "sort_order");
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "lesson_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lesson_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lesson_id" UUID NOT NULL,
  "version_no" INTEGER NOT NULL,
  "body" JSONB NOT NULL,
  "review_note" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lesson_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lesson_versions_lesson_id_version_no_key" ON "lesson_versions"("lesson_id", "version_no");
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lesson_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lesson_id" UUID NOT NULL,
  "kind" "LessonSourceKind" NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT,
  "page" TEXT,
  "law_article_id" UUID,
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "lesson_sources_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lesson_sources_lesson_id_idx" ON "lesson_sources"("lesson_id");
ALTER TABLE "lesson_sources" ADD CONSTRAINT "lesson_sources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lesson_links" (
  "lesson_id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  CONSTRAINT "lesson_links_pkey" PRIMARY KEY ("lesson_id", "kind", "target_id")
);
CREATE INDEX "lesson_links_kind_target_id_idx" ON "lesson_links"("kind", "target_id");
ALTER TABLE "lesson_links" ADD CONSTRAINT "lesson_links_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lesson_progress" (
  "user_id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "version_no" INTEGER NOT NULL,
  "offset" INTEGER NOT NULL DEFAULT 0,
  "read_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("user_id", "lesson_id")
);
CREATE INDEX "lesson_progress_user_id_updated_at_idx" ON "lesson_progress"("user_id", "updated_at");
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
