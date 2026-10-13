-- Günün odağı (Doc 48 A5, 14 Eki 2026; Doc 25 §5): "konuyu sen seç, soruları
-- koç seçsin". Odak GEÇİCİDİR — kayıt yalnız yazıldığı gün geçerli; ertesi gün
-- okunurken koça döner (kalıcı manuel mod koçun veri çarkını söndürür). Kullanıcı
-- başına tek satır. Web ve mobil aynı odağı görür.
-- CreateEnum
CREATE TYPE "FocusKind" AS ENUM ('coach', 'course', 'topic', 'wrongs');

-- CreateTable
CREATE TABLE "daily_focus" (
    "user_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "kind" "FocusKind" NOT NULL,
    "course_id" UUID,
    "topic_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_focus_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
