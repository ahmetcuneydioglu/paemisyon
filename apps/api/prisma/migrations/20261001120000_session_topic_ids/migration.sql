-- Seçili mevzuat turu (1 Eki 2026, kullanıcı talebi).
--
-- Kütüphanedeki "karışık çöz" dersin TÜM konularından havuz kuruyordu; tek konu
-- ile tüm ders arasında kapsam yoktu. Kullanıcı çalıştığı 10 kanunu seçip yalnız
-- onlardan karışık çözmek istiyor. Seçim oturumda saklanır: geçmiş etiketi
-- ("4 mevzuat") ve "aynı seçimle yeni tur" bu kolona dayanır. Devam etme
-- question_order ile zaten bağımsızdır.
ALTER TABLE "quiz_sessions" ADD COLUMN "topic_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
