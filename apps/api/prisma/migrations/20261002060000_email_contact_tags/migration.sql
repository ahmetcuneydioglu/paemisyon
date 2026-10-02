-- E-posta kişilerine serbest etiket (2 Eki 2026): Brevo first300 gibi alt kümeleri kitle
-- süzgecinde seçmek için. GIN dizini `tags && ARRAY[...]` sorguları için.
-- AlterTable
ALTER TABLE "email_contacts" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "email_contacts_tags_idx" ON "email_contacts" USING GIN ("tags");
