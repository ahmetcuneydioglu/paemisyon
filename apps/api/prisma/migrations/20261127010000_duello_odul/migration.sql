-- Doc 59 Aşama 4 — Düello ödülleri ve bildirim (27 Kas 2026). EKLEMELİ.
-- Yeni enum değerleri aynı işlemde KULLANILAMAZ; rozet satırları bir sonraki migration'da.

ALTER TYPE "BadgeKind" ADD VALUE IF NOT EXISTS 'duel_wins';
ALTER TYPE "BadgeKind" ADD VALUE IF NOT EXISTS 'duel_streak';
ALTER TYPE "BadgeKind" ADD VALUE IF NOT EXISTS 'room_wins';
ALTER TYPE "BadgeKind" ADD VALUE IF NOT EXISTS 'duel_weekly';
ALTER TYPE "NotificationCategory" ADD VALUE IF NOT EXISTS 'duel';

-- Boş geçilebilir / varsayılanlı iki kolon: mevcut satırlar etkilenmez, tablo yeniden yazılmaz.
ALTER TABLE "users" ADD COLUMN "duel_seen_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "duel_discoverable" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "users_preferred_module_id_duel_seen_at_idx" ON "users"("preferred_module_id", "duel_seen_at");
