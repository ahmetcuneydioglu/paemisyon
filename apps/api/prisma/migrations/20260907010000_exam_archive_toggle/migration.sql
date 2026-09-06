-- Denemenin sınav sonrası ARŞİVDEN ÇÖZÜLEBİLİRLİĞİ ayrı bir anahtar olur.
--
-- Neden: aynı deneme birden çok kez yayınlanıyor (katılım artırmak için). Arşiv
-- kapısı yalnız "deneme bitti mi" diye bakıyordu; 6 Eylül 2026'da bir kullanıcı
-- akşam 21:00'deki TEKRAR sınavından yedi saat önce, öğlen 13:48'de aynı 100
-- soruyu arşivden çözebildi. Katılımcıların hiçbiri bunu yapmamıştı (kontrol
-- edildi) ama engelleyen bir şey de yoktu.
--
-- VARSAYILAN KAPALI: tekrarlanacak deneme kuralın istisnası değil, normali.
-- Tek seferlik bir deneme için admin panelden açar.
ALTER TABLE "exams" ADD COLUMN "archive_open_after_end" BOOLEAN NOT NULL DEFAULT false;

-- Arşiv oturumunun hangi denemeden geldiği. Şimdiye kadar bağ YOKTU: arşivde
-- çözen kullanıcı sonucunu bir kez görüyor, sonra ona dönmenin hiçbir yolu
-- kalmıyordu. Bir kullanıcı sonucunu ararken 40 dakika boyunca 20'den fazla boş
-- oturum açtı ve her seferinde 0/100 gördü.
--
-- exam_id KULLANILAMAZ: orada (user_id, exam_id) tekildir — canlı katılım tek
-- olmalı, arşiv çözümü ise tekrarlanabilir.
ALTER TABLE "quiz_sessions" ADD COLUMN "archive_exam_id" UUID;
CREATE INDEX "quiz_sessions_archive_exam_id_idx" ON "quiz_sessions"("archive_exam_id");
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_archive_exam_id_fkey"
    FOREIGN KEY ("archive_exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
