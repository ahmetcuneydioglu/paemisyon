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

## Figma karşılaştırması ve 01 ekranı (7 Kas 2026)

Simülatörde (iPhone 17, koyu tema) altı ekran Figma 121:1542 ile yan yana karşılaştırıldı; farklar kapatıldı:

- **01 / Okuma seçimi** eklendi: `kutuphane/konu-oku/[courseId]` — ders odasındaki Konu oku kutusu doğrudan bu
  ekranı açar (kullanıcı kararı 7 Kas 2026: aradaki "Konu oku" sheet'i kaldırıldı). "Nasıl okumak istersin?" altında
  iki bölüm: Ünite içerikleri (ünitesi olan konular → ünite listesi) ve Mevzuat metni (dersin kanunları → okuyucu);
  sonda "Tek ünite, iki okuma biçimi" kartı. Satırlar sunucu verisine göre; ikisi de boşsa not. Konu odasındaki
  "Ünite içerikleri" satırı ve Mevzuat detayı doğrudan listeye gitmeye devam eder.
- **02/03 / Üniteler:** çift üst boşluk (`Screen` güvenli alanı + Stack başlığı) kaldırıldı; ünite ve ders satırlarına
  kitap ikonu; "Kaldığın yer" kartı okuma biçiminin hemen altına alındı. Doc 57 ders bölümü ("Anayasa Türleri") tasarımda
  yok, bilinçli ek; madde özetleri başlığı "Üniteler" yerine "Madde özetleri".
- **04/05 / Okuyucu:** gezinme başlığı "Konu oku", İçindekiler sağ üst düğme (gövdedeki etiket satırı kalktı); üst
  etiket hızlı tekrarda "<kanun> · Hızlı tekrar". Kalan fark: tasarımdaki bölüm numaraları ("01  Devletin kimliği") ve
  "Resmî metni aç · md 1–3" düğmesi yerine madde yongaları; hızlı tekrarda "Ayrıntı için anlatıma geç" düğmesi yok.
- **06 / İçindekiler:** sheet olarak kaldı (tasarımda tam ekran); satırlara "Bölüm N" alt başlığı eklendi.

