# Doc 49 / 09 — F6: Beta (TestFlight) ve 2.0 yayını

Tarih: 16 Ekim 2026. Dal `claude/f6-beta`. Plan: `00-plan.md` §3 F6.
Kapanış ölçütü: iki mağazada 2.0 (iOS önce), çökme oranı < %0,5; Flutter arşivlenir.

## 1. Yayın kimliği

- Bundle/package `com.paemisyon.paemisyon`, ASC uygulama id 6802087692 (Education, 4+).
- Sürüm **2.0.0**; build numarası EAS'ta uzaktan (remote, autoIncrement). Flutter 1.x
  (1.0.0+1 mağazada; 1.1.0+4 dalda bekliyordu, ÇIKMAZ — 2.0 onun yerine geçer).
- Apple takımı 3U4QPG9Q82. EAS hesabı `canahmettt@gmail.com` (gys-mobil ile aynı).
- Derleme: **EAS Build** (bulut), `eas.json` profilleri development / preview / production;
  gönderim `eas submit` (ASC). Yerel Xcode arşivi yedek yol.

## 2. Ortam

- Derleme zamanı değişkenleri (`EXPO_PUBLIC_*`) EAS ortam değişkenlerinde (`production`):
  API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (yayımlanabilir), GOOGLE_IOS_CLIENT_ID.
  Repoya yazılmaz; `eas env:list --environment production` ile görülür.
- Sentry: `SENTRY_AUTH_TOKEN` olmadan kaynak haritası atlanır (yapılandırma hazır, DSN
  sahibinden — `02-a1-temel.md`). 2.0 için DSN girilmesi önerilir (çökme oranı ölçütü).
- Firebase: `GoogleService-Info.plist` repoda (Flutter ile aynı proje); APNs anahtarı
  Firebase'de tanımlı (1.x push'u çalışıyor).

## 3. Mağaza kontrol listesi (Doc 28 ASC kuralları + 2.0 farkları)

- [ ] App Store açıklaması: abonelik bilgileri + Kullanım Koşulları/Gizlilik bağlantıları
      (3.1.2 — 1.0'da metadata reddi sebebiydi) korunur; "2.0 yenilendi" notu.
- [ ] Ekran görüntüleri: yeni Nöbet ekranları (6.9" ve 6.5" setleri; Figma'dan üretilebilir),
      IAP ekran görüntüleri için 1284×2778.
- [ ] IAP ürünleri zaten onaylı (yıllık abonelik + ömürlük); yeni ürün yok → sürümle birlikte
      gönderim zorunluluğu yok.
- [ ] Uygulama Gizliliği formu: 1.x'teki cevaplara ek **yok** (push FCM ve çökme raporu aynı);
      Sentry DSN girilirse "Crash Data" zaten işaretli olmalı.
- [ ] İnceleme notu + demo hesap: neilonlukas@gmail.com (ücretsiz katman; paywall ve sandbox
      satın alma görülebilsin).
- [ ] Yayın tipi: Manually release (1.0'daki gibi).
- [ ] Sign in with Apple yetkisi profil ve yetkilendirmede (dev build'de doğrulandı).
- [ ] `aps-environment: production` entitlement (app.config'te).
- [ ] İhracat uyumluluğu: `usesNonExemptEncryption: false` (app.config'te).
- [ ] Sürüm notları (TR): "Paemisyon 2.0 — baştan tasarlandı…" (aşağıda taslak).

Sürüm notu taslağı:
> Paemisyon 2.0 baştan tasarlandı. Bugün ekranında koçun tek görevi ve odak seçimi; Kütüphane'de
> dersler, Madde Atlası ve mevzuat okuyucu; Denemeler'de canlı sınav, kişisel deneme ve çıkmış
> sorular; Performans'ta ısı haritası ve net eğrisi. Koyu tema birincil. Çevrimdışı cevaplar
> bağlantı gelince gönderilir.

## 4. Beta akışı

1. `eas build --platform ios --profile production` → TestFlight (dahili test grubu: sahibi +
   beta kullanıcıları; harici grup için Apple ön incelemesi).
2. Geri bildirim kanalı: TestFlight ekran görüntüsü geri bildirimi + Telegram grubu.
3. Beta ölçütleri (1 hafta): çökme yok (Sentry), giriş/tur/deneme/satın alma uçtan uca,
   push tıklaması doğru ekrana.
4. 2.0 gönderimi: `eas submit -p ios` + ASC metadata; Manually release.
5. Android: `google-services.json` (Firebase konsolundan) + upload keystore (Play App Signing;
   1.x anahtarı kullanıcıda) → ayrı adım, iOS'tan sonra.
6. Flutter arşivi: `apps/mobile` main'de kalır, README'ye "bakımda, 2.0 Expo" notu; CI'dan
   çıkarılır (zaten yok).

## 5. İlerleme

- 16 Eki 2026: EAS projesi @ahmetcnd/paemisyon (1c502a04-…); production/preview ortam
  değişkenleri EAS'ta; Apple kimlik bilgileri EAS'ta (dağıtım sertifikası + profil yeni,
  push anahtarı W94LUR5B6Y gys-mobil ile ortak — FCM için Firebase'deki anahtar geçerli).
- İlk derleme (build 1) "Install dependencies"te düştü: Mac'te `expo install --fix` kilidi
  yeniden yazınca `@emnapi/core|runtime` (wasm isteğe bağlı) girdileri düşmüş; EAS'ın npm 10.9
  `npm ci` reddetti. Kural: **kilit yalnız node:22 konteynerinde üretilir, Mac'te npm install
  sonrası yeniden üretilir.** Build 2 kuyruğa alındı.
- Build 2 Xcode aşamasında düştü: Sentry kaynak haritası yükleme betiği `SENTRY_AUTH_TOKEN`
  yokken derlemeyi kırıyor. EAS ortamına `SENTRY_DISABLE_AUTO_UPLOAD=true` eklendi (DSN/token
  girilince kaldırılır; çökme raporu yine çalışır, yalnız kaynak haritası yüklenmez). Build 3.
- Build 3 (2.0.0 / 3) EAS'ta BAŞARILI. `eas submit` için ASC API anahtarı üretimi Apple'da 500
  verdi; ASC › Users and Access › Integrations › App Store Connect API paneli de yüklenmiyor
  (Apple tarafı). Geçici yol: IPA indirildi (`~/Downloads/paemisyon-2.0/`), **Transporter** ile
  yüklendi. API anahtarı panel düzelince kurulur (`eas credentials` → ASC API Key) ve sonraki
  gönderimler `eas submit` ile.
- 16 Eki 2026: 2.0.0 (3) TestFlight'ta "Ready to Submit"; iç test grubu **paemisyon** (1 test
  kullanıcısı) otomatik aldı; What to Test (6 madde) girildi. Harici grup ve davetler sonraki adım.
