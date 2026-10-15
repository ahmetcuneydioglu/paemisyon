# Doc 49 / 02 — A1 Temel: kök orkestrasyon, CI, Sentry, kök temizliği

Tarih: 16 Ekim 2026. Dal `claude/a1-temel`. Plan: `00-plan.md` §3 A1.

## Ne yapıldı

### Kök orkestrasyon (pnpm workspace YERİNE npm ile, bilinçli)
- Kökte `package.json`: `install:all`, `typecheck`, `lint`, `test`, `check` üç uygulamayı
  sırayla çalıştırır. Her app kendi `typecheck` script'ini aldı (`tsc --noEmit`; API'de
  `tsconfig.build.json`, betikler dışarıda).
- **Neden pnpm değil:** üç uygulama Railway (apps/api) ve Vercel (apps/admin, apps/web)
  üstünde kendi kök dizini ve kendi `package-lock.json`'ıyla kuruluyor. pnpm çalışma
  alanına geçmek kilit dosyasını köke taşır ve üç deploy'un kurulum komutunu birden
  değiştirir; bunu doğrulamadan yapmak canlıyı riske atar. Paylaşılan paket gerektiğinde
  (F0 token paketi üretim betiğiyle dosya YAZAR, bağlantı istemez) ihtiyaç yok. pnpm'e
  geçiş, Railway ve Vercel kök/kurulum ayarlarıyla birlikte ayrı bir adımda yapılır.
- Admin `package-lock.json` yeniden üretildi: main'deki kilit `npm ci` ile kurulamıyordu
  (`@emnapi` sürüm uyuşmazlığı). Artık temiz kurulum çalışıyor.

### CI (`.github/workflows/ci.yml`)
- `main`'e push ve her PR'da üç iş: API (npm ci, prisma generate, typecheck, eslint, jest),
  Admin (npm ci, typecheck, lint), Web (npm ci, typecheck, lint, vitest). Node 22, npm
  önbellekli, aynı dalda yeni koşu eskisini iptal eder.
- Derleme (`next build`, `nest build`) CI'da yok: ortam değişkeni ister; Vercel ve Railway
  zaten derliyor.
- **Lint şimdilik engellemez** (`continue-on-error`). main'de eslint-config-next'in React
  Compiler kurallarından 6 eski hata var; ekranlarıyla birlikte düzeltilecek:
  - web: `sinav/arsiv/[examId]` ve `sinav/kisisel` (render'da `Date.now()` ile bitiş anı),
    `cikmis/sinav-quiz`, `push-opt-in`, `shell/command-palette` (effect içinde setState);
  - admin: `exams/[id]` (effect içinde setState ile tohumlama).
  Sahibi: F7 web yeni deri ve S2 admin 2.0. Tip denetimi ve testler ENGELLER.

### Sentry (hata raporlama; DSN yoksa tamamen pasif)
- API: `src/instrument.ts` `main.ts`'in ilk satırında; `SentryModule.forRoot()`;
  `AllExceptionsFilter` yalnız 5xx'i `captureException` ile gönderir (4xx beklenen akış).
  `beforeSend` çerez, gövde ve `authorization` başlığını siler.
- Web ve admin: `src/instrumentation.ts` (sunucu/edge), `src/instrumentation-client.ts`
  (tarayıcı; replay yok, izleme %5), `sentry.server.config.ts`, `sentry.edge.config.ts`;
  `next.config.ts` `withSentryConfig` ile sarıldı (kaynak haritası yalnız
  `SENTRY_AUTH_TOKEN` varsa, telemetri kapalı).
- Sürüm bağı: Railway `RAILWAY_GIT_COMMIT_SHA`, Vercel `VERCEL_GIT_COMMIT_SHA`.

**Açılış için sahibin yapacakları (koda hiçbir değer yazılmaz):**
1. sentry.io'da üç proje: `paemisyon-api` (Node), `paemisyon-web` (Next.js),
   `paemisyon-admin` (Next.js).
2. Railway → API: `SENTRY_DSN` (+ isteğe bağlı `SENTRY_ENVIRONMENT=production`).
3. Vercel → web ve admin: `NEXT_PUBLIC_SENTRY_DSN`; kaynak haritası istenirse
   `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
4. Değişken girilmeden önce deploy güvenli: SDK `enabled: false` ile çalışır.

### Kök temizliği
- `paem701.sql`, `paem705.sql`, `paemmisy_mvc.sql` (27 MB, kişisel veri) ile eski
  `paemisyonIOS705/` (293 MB) ve `paemisyoncom/` (81 MB) repo klasöründen
  `~/Developer/paemisyon-arsiv/` altına taşındı (git'te zaten yoklardı; disk kopyası
  yer değiştirdi). Şifreleme sahibine bırakıldı; öneri:
  `cd ~/Developer && zip -er paemisyon-arsiv.zip paemisyon-arsiv && rm -rf paemisyon-arsiv`.
- Dökümü okuyan iki betiğin varsayılan yolu güncellendi
  (`migrate-paem705-users.ts`, `import-email-contacts.ts`; `--dump` ile her zaman ezilebilir).
- `.gitignore` kuralları yerinde kaldı (yanlışlıkla geri kopyalanırsa yine dışarıda).

## Doğrulama
- API: typecheck temiz, 398 test geçti.
- Admin ve web: typecheck temiz, lint yalnız eski hatalar, web 80 test geçti.
- `next build --webpack` admin ve web için Sentry sarmalayıcısıyla derlendi. Web'de tek uyarı
  Next'in kendi `constants.js` dosyasından (`process.features` Edge Runtime'da); derlemeyi
  etkilemiyor, Sentry edge içe aktarımının izinde görünüyor; davranış değişikliği yok.
- Admin `npm ci` yeni kilit dosyasıyla temiz kurulum yaptı.

## Dışarıda bırakılanlar
- pnpm çalışma alanı (yukarıdaki gerekçeyle).
- Expo uygulamasına Sentry: F1'de `@sentry/react-native` ile.
- Lint hatalarının düzeltilmesi: F7 / S2.
