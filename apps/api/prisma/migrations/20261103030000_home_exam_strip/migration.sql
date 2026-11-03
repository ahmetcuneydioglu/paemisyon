-- Bugün: haftalık deneme randevu şeridi tercihi (3 Kas 2026)
ALTER TABLE "user_notification_settings" ADD COLUMN "home_exam_strip_enabled" BOOLEAN NOT NULL DEFAULT true;
