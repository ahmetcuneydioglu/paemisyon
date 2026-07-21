-- Fiyatlandırma: web'in TEK satılabilir planı 3 aylık 499,99 TL; ücretsiz limit 30.
--
-- Neden migration, neden script değil: plan satırları elle çalıştırılan bir scripte
-- bırakılsaydı, migration uygulanıp API ayağa kalktığı ama script henüz
-- çalıştırılmadığı pencerede /public/pricing eski 'monthly' planını (149,99 TL)
-- döndürür ve pazarlama sayfaları YANLIŞ FİYAT gösterirdi. Burada dağıtımla
-- birlikte atomik uygulanır.
--
-- AYRI DOSYA olması şart: 'quarterly' değeri bir önceki migration'da
-- ALTER TYPE ... ADD VALUE ile eklendi ve PostgreSQL yeni enum değerinin
-- eklendiği transaction içinde KULLANILMASINA izin vermez.

-- 1) Ücretsiz katman: günlük soru hakkı 30.
UPDATE "plans" SET "daily_question_limit" = 30 WHERE "key" = 'free';

-- 2) 3 aylık premium. Ödeme Telegram/Instagram üzerinden manuel yürür,
--    bu yüzden mağaza ürün kimliği YOK.
INSERT INTO "plans" ("key", "name", "price", "currency", "period", "daily_question_limit", "is_active")
VALUES ('quarterly', '3 Aylık Premium', 499.99, 'TRY', 'quarterly'::"PlanPeriod", NULL, true)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "currency" = EXCLUDED."currency",
  "period" = EXCLUDED."period",
  "daily_question_limit" = NULL,   -- premium = sınırsız
  "is_active" = true,
  "store_product_id_ios" = NULL,
  "store_product_id_android" = NULL;

-- 3) Eski satılabilir planlar (monthly 149,99 / yearly 999,99) listeden düşer.
--    SİLİNMEZ: mevcut/geçmiş abonelikler plan_id ile bu satırlara bağlı olabilir
--    ve is_active tek bayrakla geri alınabilir.
UPDATE "plans" SET "is_active" = false WHERE "key" NOT IN ('free', 'quarterly');
