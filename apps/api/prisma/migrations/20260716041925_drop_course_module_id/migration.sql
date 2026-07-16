-- Doc 21 Faz D (CONTRACT): dersler tamamen küresel — module_id kolonu düşürülür.
-- Artık hiçbir kod okumaz (kapsam müfredat bölümleri üzerinden).
DROP INDEX IF EXISTS "courses_module_id_idx";
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_module_id_fkey";
ALTER TABLE "courses" DROP COLUMN IF EXISTS "module_id";
