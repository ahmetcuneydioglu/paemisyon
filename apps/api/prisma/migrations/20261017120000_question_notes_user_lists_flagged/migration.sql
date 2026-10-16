-- Soru notu, kişisel liste, kalıcı bayrak (Doc 49 S1-C, 17 Eki 2026). EKLEMELİ.
ALTER TABLE "quiz_answers" ADD COLUMN "flagged" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "question_notes" (
  "user_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "question_notes_pkey" PRIMARY KEY ("user_id", "question_id")
);
ALTER TABLE "question_notes" ADD CONSTRAINT "question_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_notes" ADD CONSTRAINT "question_notes_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_lists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_lists_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "user_lists_user_id_sort_order_idx" ON "user_lists"("user_id", "sort_order");
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_list_items" (
  "list_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_list_items_pkey" PRIMARY KEY ("list_id", "question_id")
);
CREATE INDEX "user_list_items_list_id_added_at_idx" ON "user_list_items"("list_id", "added_at");
ALTER TABLE "user_list_items" ADD CONSTRAINT "user_list_items_list_id_fkey"
  FOREIGN KEY ("list_id") REFERENCES "user_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_list_items" ADD CONSTRAINT "user_list_items_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
