-- Faz 2 push: FCM cihaz token'ları
CREATE TABLE "push_tokens" (
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("token")
);
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
