# Doc 49 / 04 — F1: Expo iskeleti (`apps/app`)

Tarih: 16 Ekim 2026. Dal `claude/f1-expo-iskelet`. Plan: `00-plan.md` §2.2 ve §3 F1.
Kapanış ölçütü: telefonda/simülatörde giriş yapılıp `/me/coach` çekiliyor.

## Ne kuruldu

- **Uygulama:** Expo SDK 58, React Native 0.88, `expo-router` (typed routes), development
  build (Expo Go değil). Kimlik Flutter ile aynı: `com.paemisyon.paemisyon`, sürüm 2.0.0.
  Şema `paemisyon://`, universal link `paemisyon.com` (AASA F5'te doğrulanır).
- **Token bağı:** `packages/tokens/build/tokens.ts` doğrudan içe aktarılır (`@tokens`;
  Metro `watchFolders`). `src/theme/tokens.ts` yalnız RN türevlerini ekler: yüklü font adları,
  `typeRoles` → `TextStyle` (letterSpacing = tracking × size, tabular), dar ekran ölçeği.
  `ThemeProvider`: Nöbet koyu birincil, tercih `system|light|dark` cihazda saklanır.
- **Fontlar:** `@expo-google-fonts/bricolage-grotesque` (600/700) ve `instrument-sans`
  (400–700), `useFonts` ile; splash fontlar yüklenince kalkar.
- **Kimlik:** Supabase yalnız oturum için (SecureStore parçalı depo, PKCE, ön planda token
  yenileme). E-posta + şifre, Apple (iOS) ve Google (`signInWithIdToken`, tarayıcı yok).
  Google için `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` gerekir; yoksa düğme görünmez.
- **API istemcisi** (`src/lib/api.ts`): Doc 7 zarfı, Bearer, 20 sn zaman aşımı, 401'de bir
  kez oturum tazele ve yinele, yine 401 ise çıkış (Flutter interceptor davranışı korundu).
  `ApiError` (status, code, trace_id) ve `NetworkError` (çevrimdışı kuyruk F5'te bunu tanır).
- **Sekmeler:** anayasal beş (Bugün · Kütüphane · Denemeler · Performans · Ben), Lucide
  ikonları 24/1.75. Bugün gerçek `/me/coach` ile durum satırı, görev kartı, hazırlık özeti;
  diğer üçü F4 yer tutucusu; Ben: hesap, tema seçimi, çıkış.
- **Bileşen kiti (alt küme):** `AppText` (`variant` = tipografi rolü; RN'nin kendi `role`
  prop'uyla çakışmasın diye bu ad), `Screen`, `Card`, `Button`, `TextField`, `Notice`,
  `Skeleton`. F2'de galeriyle tamamlanır.
- **Hata:** `AppErrorBoundary` + `@sentry/react-native` (DSN yoksa pasif; config plugin kaynak
  haritasını yalnız `SENTRY_AUTH_TOKEN` ile yükler).
- **Ortam:** `.env.example`; yalnız `EXPO_PUBLIC_*`, zod ile doğrulanır, service role reddedilir,
  release'te http adres reddedilir.

## Komutlar

```bash
cd apps/app && cp .env.example .env.local   # değerleri doldur
npx expo prebuild --platform ios --no-install && (cd ios && LANG=en_US.UTF-8 pod install)
npx expo run:ios --device <udid>            # development build
npm run typecheck && npx eslint .
```

Tuzaklar: CocoaPods `LANG=en_US.UTF-8` ister (yoksa sessizce düşer, workspace üretilmez);
`react-dom` sürümü `react` ile aynı olmalı (`npx expo install react-dom`), yoksa npm ERESOLVE
ile sonraki kurulumlar sessizce boşa gider.

## Doğrulama (16 Eki 2026)

- `tsc --noEmit` ve `eslint .` temiz; token testleri 39/39.
- `expo prebuild` + `pod install` + `expo run:ios` iPhone 17 simülatöründe derlendi ve kuruldu
  (Xcode 27). Metro paketledi (4070 modül), giriş ekranı açıldı.
- Açık ve koyu temada Nöbet paleti ve Bricolage/Instrument fontları ekranda doğrulandı
  (simülatör görünümü değiştirilerek canlı geçiş).
- Ürün sahibi simülatörde beta hesabıyla giriş yaptı: Bugün ekranı gerçek `/me/coach`
  verisini çizdi (dönüş görevi "Kısa bir dönüş turu", çözülmemiş yanlış sayısı, dört dersin
  hazırlık yüzdeleri ve zayıf renk durumu, haftalık 0/5). Geri sayım "—": `ExamType.examDate`
  canlıda girili değil (denetim §7); panelden tarih girilince dolar. **F1 kapandı.**

## Dışarıda bırakılanlar (plan gereği)

- Push, IAP, çevrimdışı kuyruk, derin bağlantı yönlendirmesi, zorunlu güncelleme kapısı: F5.
- Onboarding, tanıtım, kayıt ve şifre sıfırlama ekranları: F4.
- Android derlemesi: F5 öncesi; `google-services.json` Flutter projesinden taşınır.
