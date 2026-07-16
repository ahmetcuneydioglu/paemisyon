-- Doc 21 Faz A (EXPAND — kırılım yok):
-- müfredat katmanı tabloları + konu ağacı + courses.module_id nullable.

-- AlterTable: dersler küresel havuza hazırlanıyor (Faz D'de kolon düşer)
ALTER TABLE "courses" ALTER COLUMN "module_id" DROP NOT NULL;

-- AlterTable: konu ağacı (Konu/Alt Konu aynı tabloda)
ALTER TABLE "topics" ADD COLUMN "parent_id" UUID;
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateTable: müfredat bölümleri
CREATE TABLE "exam_sections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "exam_type_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "weight_percent" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "exam_sections_exam_type_id_idx" ON "exam_sections"("exam_type_id");
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_type_id_fkey"
  FOREIGN KEY ("exam_type_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: bölüm ↔ ders bağlantısı
CREATE TABLE "exam_section_courses" (
  "section_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "exam_section_courses_pkey" PRIMARY KEY ("section_id", "course_id")
);
CREATE INDEX "exam_section_courses_course_id_idx" ON "exam_section_courses"("course_id");
ALTER TABLE "exam_section_courses" ADD CONSTRAINT "exam_section_courses_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_section_courses" ADD CONSTRAINT "exam_section_courses_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
