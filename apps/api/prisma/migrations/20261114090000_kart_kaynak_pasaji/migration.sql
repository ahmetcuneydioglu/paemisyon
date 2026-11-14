-- Doc 56 §12 — Bilgi kartı kaynak pasajı (14 Kas 2026). EKLEMELİ: mevzuatı olmayan derslerde kartın dayandığı
-- kaynak metin (source_documents → source_passages) ve kart → pasaj referansı. Mevcut tablolarda yalnız
-- flashcards'a boş geçilebilir bir kolon eklenir; backfill yok, mevcut kartlar etkilenmez.

CREATE TABLE "source_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "topic_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'book',
  "url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "source_documents_slug_key" ON "source_documents"("slug");
CREATE INDEX "source_documents_topic_id_idx" ON "source_documents"("topic_id");
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "source_passages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "passage_no" TEXT NOT NULL,
  "heading" TEXT,
  "page" TEXT,
  "text" TEXT NOT NULL,
  "sort_key" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "source_passages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "source_passages_document_id_passage_no_key" ON "source_passages"("document_id", "passage_no");
CREATE INDEX "source_passages_document_id_sort_key_idx" ON "source_passages"("document_id", "sort_key");
ALTER TABLE "source_passages" ADD CONSTRAINT "source_passages_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "flashcard_passages" (
  "flashcard_id" UUID NOT NULL,
  "passage_id" UUID NOT NULL,
  "relation" TEXT NOT NULL DEFAULT 'primary',
  CONSTRAINT "flashcard_passages_pkey" PRIMARY KEY ("flashcard_id", "passage_id")
);
CREATE INDEX "flashcard_passages_passage_id_idx" ON "flashcard_passages"("passage_id");
ALTER TABLE "flashcard_passages" ADD CONSTRAINT "flashcard_passages_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_passages" ADD CONSTRAINT "flashcard_passages_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "source_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "flashcards" ADD COLUMN "source_document_id" UUID;
CREATE INDEX "flashcards_source_document_id_idx" ON "flashcards"("source_document_id");
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
