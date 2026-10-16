# Doc 49 / 08 — F5: Altyapı tamamlama (IAP, push, çevrimdışı, derin bağlantı, onboarding, paywall)

Tarih: 16 Ekim 2026. Dal `claude/f5-altyapi`. Plan: `00-plan.md` §3 F5.
Kapanış ölçütü: mağaza kontrol listesi (Doc 28 ASC kuralları) yeşil; telefonda gerçek
push ve sandbox satın alma turu.

## 1. Envanter sonuçları (16 Eki 2026, koddan)

- **Push sunucusu FCM** (`notifications/push.service.ts`, firebase-admin, proje
  paemisyon-29523). `POST /me/push-token {token, platform}` FCM kayıt jetonu bekler; iOS'ta
  Expo'nun APNs jetonu ya da Expo push jetonu KABUL EDİLMEZ (invalid-argument → silinir).
  Karar: `@react-native-firebase/app` + `messaging` ile FCM jetonu (Flutter ile aynı;
  Firebase projesinde APNs anahtarı zaten tanımlı). `GoogleService-Info.plist` Flutter'dan
  kopyalanır. Sunucu değişmez.
- Push `data.route` sözlüğü: `daily-quiz`, `denemeler`, `leaderboard`, `question:<uuid>`,
  boş (uygulamayı aç). Panelden gönderilir; cron: liderlik dürtmesi 20:30.
- **Billing**: `POST /billing/verify {platform:'apple', transactionJws}` — StoreKit 2 imzalı
  işlem (expo-iap `purchase.purchaseToken`). Yalnız 400/422 kalıcı hata (işlem bitirilir);
  ağ/401/403/5xx geçici (işlem açık kalır). Geri yükleme = mevcut işlemleri yeniden doğrulama.
  Canlı planlar: yearly 599,99 ₺ (`com.paemisyon.premium.annual`), lifetime 1699,99 ₺
  (`com.paemisyon.premium.lifetime`), quarterly (elle satış). Ürün kimlikleri `GET
  /billing/plans`'tan okunur; sabit kodlanmaz.
- **Çevrimdışı kuyruk** (Flutter): `{sessionId, questionId, versionId, selectedOptionId,
  timeSpentMs, createdAt}`; (session, question) tekil; sırayla gönderim; NetworkError'da dur,
  diğer hatalarda düşür. Yalnız alıştırma (deneme değil).
- **Onboarding** 3 adım (modül · tarih · günlük süre → 10/20/40 soru) → `POST /me/onboarding`
  → İlk Devriye (10 soru). **Tanıtım** 5 slayt (kodla çizilmiş kahramanlar, görsel yok);
  bayrak cihazda (`intro_seen_v1`), çıkışta kalır.
- **Paywall** metinleri Flutter'dan alınır (değer satırları, yasal metin, geri yükle);
  elle satış bölümü yalnız web.

## 2. Kararlar

1. Yerel paketler: `expo-notifications`, `expo-device`, `expo-iap`, `@react-native-firebase/app`,
   `@react-native-firebase/messaging`, `expo-build-properties` (iOS `useFrameworks: static`,
   RNFirebase şartı), `expo-network` (çevrimdışı algısı). Dev client yeniden derlenir
   (simülatör + telefon). `ios.appleTeamId = 3U4QPG9Q82` app.config'e yazılır.
2. Kuyruk deposu: SecureStore değil (boyut sınırı) — `expo-file-system` JSON dosyası.
3. Paywall tek ekran, kök Stack'te modal: `PREMIUM_REQUIRED`, `DAILY_LIMIT_REACHED`,
   `PERSONAL_EXAM_LIMIT` hatalarında oynatıcı/ekranlar buraya yönlendirir.
4. Push izni tanıtımda değil, ilk anlamlı anda (ilk tur sonucu) ya da Ayarlar'dan istenir;
   kayıt oturum açılınca ve jeton yenilenince.
5. Derin bağlantı: push `route` → uygulama yolu eşlemesi tek tabloda (`src/lib/deep-links.ts`,
   testli); `paemisyon.com/bildirim?git=` evrensel bağlantısı aynı tabloyu kullanır.
6. Günlük hatırlatma: yerel bildirim, 19:00 varsayılan, 5 günlük pencere, teaser metni
   `GET /public/daily-quiz/teasers?days=5` (en iyi çaba).

## 3. Sıra

A. Paketler + config + prebuild + dev client (sim ve telefon) — kapı.
B. Tanıtım + onboarding (yeni kullanıcı yolu), bayrak ve yönlendirme kapısı.
C. Paywall + IAP + geri yükleme + bekleyen işlem senkronu + hata yönlendirmeleri + Üyelik ekranı.
D. Push kaydı + tıklama yönlendirmesi + derin bağlantı + günlük hatırlatma (Ayarlar).
E. Çevrimdışı cevap kuyruğu (alıştırma) + Bugün'de bekleyen sayacı.
F. Doğrulama (sandbox hesabı gerekir — kullanıcı), Figma (tanıtım, onboarding, paywall), belge.

## 4. Uygulama ve doğrulama (16 Eki 2026)

Yazılanlar: `app/tanitim.tsx`, `app/onboarding.tsx`, `app/paywall.tsx`; `src/features/billing/
{queries,store}.ts` (expo-iap, doğrula-sonra-bitir, geri yükle, bekleyen senkron); `src/lib/
{push,deep-links,reminders,offline-queue,intro-seen}.ts`; kök `AppServices` (mağaza senkronu,
push kaydı/yönlendirme, kuyruk boşaltma, hatırlatma penceresi); `plugins/with-firebase-configure.js`
(SDK 58 Swift AppDelegate'e `FirebaseApp.configure()`); RNFirebase `ios.disableSPM`.

- Dev client yeni yerel modüllerle simülatöre ve telefona yeniden derlendi (takım 3U4QPG9Q82).
- Tanıtım: 5 slayt, Atla → giriş; bayrak cihazda kaldı (yeniden açılışta tanıtım gelmedi).
- Paywall: planlar sunucudan (yearly/lifetime, ürün kimlikleri dolu), fiyat StoreKit'ten
  ($9.99 / $34.99 — simülatörde ABD vitrini), yıllık ön seçili, aylık karşılık hesaplandı.
- Ayarlar › Bildirimler: hatırlatma açıldı, saat çipleri; "Koç bildirimleri: Açık".
- Deep-link testi `node --test src/lib/deep-links.test.mjs` yeşil; tip/lint temiz.

**Doğrulanmadı (kullanıcı gerekir):** sandbox satın alma ve geri yükleme (App Store sandbox
hesabı); telefonda FCM jeton kaydı ve panelden gönderilen push'un tıklanması; çevrimdışı kuyruk
(simülatörde ağ kesilemedi). Onboarding yalnız yeni hesapla görünür (beta hesabı tamamlamış).

## 5. Açık işler

- Android: `google-services.json` repoda yok (Flutter'da da yok) → Android derlemesi F6'da.
- Evrensel bağlantı için `apps/web` `.well-known/apple-app-site-association` henüz yok.
- Soru içi favori/hata bildir/AI açıklama (alıştırma oynatıcısı araç satırı) → F6 öncesi.
