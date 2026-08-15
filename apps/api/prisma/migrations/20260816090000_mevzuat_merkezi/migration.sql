-- Mevzuat Merkezi P0 (Doc 29 §11-12): kanun birinci sınıf varlık + FTS.

-- Arama uzantıları (Supabase'de mevcut, açılmamıştı).
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent IMMUTABLE değil → generated column için sarmalayıcı.
-- lower() + unaccent: "İ/ı" farkları aksan düşümünde 'i'de buluşur; sorgu
-- tarafı da aynı fonksiyondan geçer (tutarlılık şart).
CREATE OR REPLACE FUNCTION public.tr_unaccent(t text) RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', lower(t))
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- enum
CREATE TYPE "LegislationType" AS ENUM ('kanun', 'cbk', 'yonetmelik', 'genelge', 'yonerge');

-- legislation
CREATE TABLE "legislation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "type" "LegislationType" NOT NULL DEFAULT 'kanun',
    "number" TEXT,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "official_source_url" TEXT,
    "effective_info" TEXT,
    "last_verified_at" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "topic_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "legislation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "legislation_slug_key" ON "legislation"("slug");
CREATE UNIQUE INDEX "legislation_topic_id_key" ON "legislation"("topic_id");
CREATE INDEX "legislation_type_status_sort_order_idx" ON "legislation"("type", "status", "sort_order");
ALTER TABLE "legislation" ADD CONSTRAINT "legislation_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ad/kısaltma/numara üzerinde typo-toleranslı arama (trigram).
CREATE INDEX "legislation_name_trgm_idx" ON "legislation"
  USING GIN (public.tr_unaccent("name" || ' ' || COALESCE("short_name",'') || ' ' || COALESCE("number",'')) gin_trgm_ops);

-- legislation_sections
CREATE TABLE "legislation_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legislation_id" UUID NOT NULL,
    "parent_id" UUID,
    "heading" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "legislation_sections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "legislation_sections_legislation_id_sort_order_idx"
  ON "legislation_sections"("legislation_id", "sort_order");
ALTER TABLE "legislation_sections" ADD CONSTRAINT "legislation_sections_legislation_id_fkey"
  FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legislation_sections" ADD CONSTRAINT "legislation_sections_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "legislation_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- law_articles genişlemesi
ALTER TABLE "law_articles"
  ADD COLUMN "legislation_id" UUID,
  ADD COLUMN "section_id" UUID,
  ADD COLUMN "title" TEXT,
  ADD COLUMN "sort_key" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "law_articles" ADD CONSTRAINT "law_articles_legislation_id_fkey"
  FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "law_articles" ADD CONSTRAINT "law_articles_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "legislation_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "law_articles_legislation_id_sort_key_idx" ON "law_articles"("legislation_id", "sort_key");

-- Tam-metin arama vektörü: başlık ağırlıklı (A) + gövde (B).
ALTER TABLE "law_articles" ADD COLUMN "search" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', public.tr_unaccent(COALESCE("title",''))), 'A') ||
    setweight(to_tsvector('simple', public.tr_unaccent("text")), 'B')
  ) STORED;
CREATE INDEX "law_articles_search_idx" ON "law_articles" USING GIN ("search");

-- article_bookmarks
CREATE TABLE "article_bookmarks" (
    "user_id" UUID NOT NULL,
    "law_article_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_bookmarks_pkey" PRIMARY KEY ("user_id", "law_article_id")
);
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_law_article_id_fkey"
  FOREIGN KEY ("law_article_id") REFERENCES "law_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- reading_progress
CREATE TABLE "reading_progress" (
    "user_id" UUID NOT NULL,
    "legislation_id" UUID NOT NULL,
    "article_no" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("user_id", "legislation_id")
);
CREATE INDEX "reading_progress_user_id_updated_at_idx" ON "reading_progress"("user_id", "updated_at");
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_legislation_id_fkey"
  FOREIGN KEY ("legislation_id") REFERENCES "legislation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
