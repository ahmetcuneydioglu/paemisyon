-- Beta test rolü (Doc 48, 14 Eki 2026): yeni anasayfayı panel anahtarı herkese
-- açılmadan önce görecek hesaplar. Admin rolünden ayrı — panel erişimi VERMEZ.
-- Veri migration'ı: rol her ortamda var olsun (seed.ts de içerir).
INSERT INTO "roles" ("key", "name") VALUES ('beta', 'Beta test') ON CONFLICT ("key") DO NOTHING;
