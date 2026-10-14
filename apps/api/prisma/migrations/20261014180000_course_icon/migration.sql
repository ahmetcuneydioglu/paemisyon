-- Derse özel ikon (Doc 48 Faz 6.3, 14 Eki 2026 — görsel dil kararı): renk TEK
-- vurgu olarak kalır; dersleri birbirinden renk değil ikon ayırır (terazi,
-- kalkan, bayrak…). İkon KODDA değil VERİDE yaşar: istemci ders adından ikon
-- tahmin etmez, bu kolonu okur. Böylece yeni ya da adı değişen ders uygulama
-- sürümü beklemeden ikonunu alır ve admin ikonu panelden (İçerik Ağacı)
-- değiştirebilir. Değer bir Lucide anahtarıdır; izinli liste API'de
-- (src/common/course-icons.ts). NULL = atanmamış: istemci açık kitap çizer.
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "icon" TEXT;

-- Onaylı ilk atama: canlıdaki ders adlarıyla birebir, yalnız silinmemiş
-- satırlar. Eşleşmeyen ders NULL kalır (açık kitap) ve panelden atanır.
UPDATE "courses" SET "icon" = 'lightbulb' WHERE "name" = 'Genel Kültür ve Analitik Düşünme' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'shield' WHERE "name" = 'Polis Mevzuatı' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'scale' WHERE "name" = 'Ceza Muhakemesi Hukuku' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'gavel' WHERE "name" = 'Ceza Hukuku' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'landmark' WHERE "name" = 'Anayasa Hukuku' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'building-2' WHERE "name" = 'İdare Hukuku' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'flag' WHERE "name" = 'Atatürk İlkeleri ve İnkılap Tarihi' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'hand-heart' WHERE "name" = 'İnsan Hakları' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'handshake' WHERE "name" = 'Protokol Bilgisi' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'crosshair' WHERE "name" = 'Silah Bilgisi' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'newspaper' WHERE "name" = 'Güncel ve Kültürel Konular' AND "deleted_at" IS NULL;
UPDATE "courses" SET "icon" = 'languages' WHERE "name" = 'Yabancı Dil' AND "deleted_at" IS NULL;
