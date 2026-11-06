-- Doc 57: mağaza değerlendirme istemi kayıtları. Yalnız ekleme (tek tablo).

-- CreateTable
CREATE TABLE "review_prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'shown',
    "session_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_prompts_user_id_created_at_idx" ON "review_prompts"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "review_prompts" ADD CONSTRAINT "review_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
