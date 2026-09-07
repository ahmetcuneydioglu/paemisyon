-- Çıkmış sınav dönemi Premium'a özel olabilsin (Doc 36, 7 Eyl 2026).
--
-- Anahtar PastExam üzerinde: bir dönemin iki modu var (sınav gibi çöz +
-- çalışma modu) ve gizli Exam kaydındaki is_premium yalnız birincisini
-- kapatıyordu. Varsayılan KAPALI — bugün bütün dönemler ücretsiz kalır.
ALTER TABLE "past_exams" ADD COLUMN "is_premium" BOOLEAN NOT NULL DEFAULT false;
