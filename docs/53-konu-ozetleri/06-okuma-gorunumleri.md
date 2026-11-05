# Konu oku — iki görünüm

5 Kasım 2026. Figma: 1YZRWO3azniW8NU5CvV1BZ / 121:1542.

Expo'da ders odasının Konu oku seçimi artık `/(tabs)/kutuphane/uniteler/[topicId]` okuma listesine gider. Liste performans paneli ve genel soru düğmelerinden ayrıdır. Konu anlatımı / Hızlı tekrar seçimi, kilitler ve hata/boş durumları içerir. Okuma tercihi hesap bazında cihazda saklanır.

Okuyucu: yayınlı içerikler konu anlatımı düzeninde başlık ve gövde olarak; kısa sürüm kart olarak gösterilir. İçindekiler başlığın gerçek konumuna kaydırır. Madde sheet'i, kilit ve madde kapsamlı gerçek soru seansı korunur. Açık/koyu tema mevcut token'lardan gelir. Okundu durumu kullanıcı tarafından işaretlenir.

Sunucu `hasQuickReview` ve `quickReview` alanlarını ekler. Kısa içerik şu aşamada yalnız doğrulanmış Genel esaslar pilotunda vardır; diğer üniteler için modelle otomatik kısaltma yapılmaz. Kilitli yanıta kısa içerik girmez; kaynak maddeler yayınlı yanıtta yoksa pilot dönmez. Veritabanı değişikliği yoktur.

Anlatım mevcut yayınlı metinleri kullanır; PDF'den yeni bir ders kitabı aktarılmadı. Diğer ünitelerin kısa içerik üretimi bu teslimin dışında kalan editoryal iştir.

Konumlar iki görünümde ayrı, kullanıcı/ünite/görünüm anahtarıyla SecureStore'da saklanır. Anlatım mevcut sunucu ilerlemesini de günceller; kısa tekrar ilerlemesi cihaz yereldir, cihazlar arasında eşitlenmez.

Kontroller: Expo ve API TypeScript; Expo lint; summaries.service ve quick-review 10/10 Jest testi; iOS Expo export. Gerçek cihazla uçtan uca kullanım ve görsel karşılaştırma bu turda yapılmadı. API'nin yeni alanlarının görünmesi için API dağıtımı ve uygulama güncellemesi gerekir; prod dağıtımı yapılmadı.

## Gezinme entegrasyonu düzeltmesi

Ünite listesi Çalış sekmesinin iç yığınına taşındı; sekme çubuğu korunur. Dersin Konu oku seçimi, konu odası ve Mevzuat detayı aynı listeyi açar. Okuyucu kök Stack kaydı başlık ve geri gezinme ile açılır; geçmişi olmayan doğrudan girişte Çalış bağlantısı vardır. Telefon yeniden normal ana ekrandan başlatılır. API yayını henüz yapılmadığı için hızlı tekrar verisi canlıda mevcut değildir.
