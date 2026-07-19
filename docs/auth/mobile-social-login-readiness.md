# Mobil Sosyal Giriş — Hazırlık ve Mimari Plan

> Bu doküman **yalnızca hazırlık/plan** içerir. Şu an mobil kod YAZILMADI.
> Amaç: web tarafını yeniden tasarlamadan Android + iOS entegrasyonunu eklemek.
> Mobil uygulama **Flutter**'dır (SwiftUI/React Native değil — bkz. kök CLAUDE.md).

## 1. Mevcut web kimlik doğrulama mimarisi

- **Merkez:** Supabase Auth. Web, Android, iOS **aynı Supabase projesini** kullanır
  (`yhkiuzevyqdqtofrmroj`). Kullanıcı hangi platformdan girerse girsin **tek
  `auth.users` kaydı**.
- **App kullanıcı id'si = Supabase uid (`sub`).** Ayrı `profiles` tablosu YOK.
  App verisi Postgres'te Prisma `User` modelinde tutulur ve **ilk authed API
  çağrısında JWT `sub`'tan JIT (lazy) provisioning** ile oluşur
  (`apps/api/src/modules/auth/user-sync.service.ts` → `ensureUser`).
- **Sonuç:** OAuth ile giren kullanıcı da tam olarak aynı akıştan geçer; platforma
  göre ayrı kullanıcı/profil AÇILMAZ. Mükerrer kullanıcı riski mimaride yok.
- Web akışı: istemci `signInWithOAuth` (PKCE) → sağlayıcı → `/auth/callback`
  (`exchangeCodeForSession`, sunucuda) → cookie session. Tüm sağlayıcılar aynı
  callback'i kullanır.
- Session: `@supabase/ssr` cookie'de (SSR). Token localStorage'a elle yazılmaz.

## 2. Supabase provider yapılandırması (web + mobil ortak)

Tek yerde açılır, üç platform paylaşır. Dashboard → Authentication → Providers:
- **Google**: Google Cloud OAuth Client (Web) ID+Secret. Mobilde native akış için
  ek olarak Android + iOS OAuth Client ID'leri (aşağıda).
- **Apple**: Apple Services ID + Key. iOS native için ayrıca bundle id ile
  yapılandırma.
- **Redirect URLs** allowlist'i hem web hem mobil deep-link'leri içerir (§8).

## 3. Ortak kullanıcı ve profil yapısı

- Kimlik: `auth.users` (Supabase). Ad/e-posta/avatar → `user_metadata`.
- App verisi: Prisma `User` (id = uid). Rol/yetki alanları bu projede **acente/
  tenant değil**; basit kullanıcı + premium bayrağı (`isPremium`). OAuth kullanıcıya
  otomatik yetki YÜKSELTİLMEZ — varsayılan normal kullanıcı.
- Ad/e-posta/avatar gerekiyorsa `user_metadata`'dan okunur; sağlayıcı farklarını
  (Google `full_name`/`picture`, Apple `name` yalnız ilk girişte) normalize eden
  ortak bir dönüştürücü mobilde de kullanılmalı (web'de `display_name` yeterliydi).

## 4. Android — Google Login akışı (planlanan)

- Paket: `supabase_flutter` + `google_sign_in`.
- Önerilen: **native `google_sign_in` → `supabase.auth.signInWithIdToken(
  provider: google, idToken, accessToken)`** (redirect'siz, en iyi UX).
  Alternatif: `signInWithOAuth(OAuthProvider.google, redirectTo: <deepLink>)`.
- Google Cloud'da **Android OAuth Client** (SHA-1 + package name) gerekir.

## 5. Android deep link yapısı

- App Link (önerilen): `https://www.paemisyon.com/auth/callback` — Digital Asset
  Links (`assetlinks.json`) ile doğrulanır; web callback'iyle aynı URL.
- Alternatif custom scheme: `com.paemisyon.app://login-callback`.
- Supabase Redirect URLs allowlist'ine eklenmeli.

## 6. iOS — Apple Login akışı (planlanan)

- Paket: `supabase_flutter` + `sign_in_with_apple`.
- Önerilen: **native `sign_in_with_apple` → `supabase.auth.signInWithIdToken(
  provider: apple, idToken, nonce)`**. Apple ad/soyadı **yalnız ilk yetkilendirmede**
  döner → ilk girişte yakalanıp app tarafında saklanmalı; sonraki girişlerde eksik
  metadata gelirse **mevcut ad üzerine boş yazma**.
- Apple gizli e-posta (relay) desteklenmeli; e-posta değişebilir, **uid sabittir** —
  eşleştirme her zaman uid ile yapılır, e-posta metniyle değil.

## 7. iOS universal link / custom scheme

- Universal Link (önerilen): `https://www.paemisyon.com/auth/callback` +
  `apple-app-site-association`.
- Alternatif custom scheme: `com.paemisyon.app://login-callback`.

## 8. Mobil callback adresleri (Supabase allowlist'e eklenecek — sonra)

- Web: `https://www.paemisyon.com/auth/callback`, `https://paemisyon.com/auth/callback`,
  `http://localhost:3002/auth/callback` (dev), `https://*.vercel.app/auth/callback` (preview).
- Android App Link: `https://www.paemisyon.com/auth/callback` (paylaşımlı) veya
  `com.paemisyon.app://login-callback`.
- iOS Universal Link: aynı web URL veya `com.paemisyon.app://login-callback`.
- **Merkezi tut:** redirect adresleri web'de `lib/auth/providers.ts` +
  `lib/auth.ts`'te; mobilde de tek bir sabitler dosyasında toplanmalı.

## 9. Web ve mobil hesap eşleştirme mantığı

- **Tek kural: eşleştirme uid ile.** Aynı kişi web'de e-posta/şifreyle, mobilde
  Google ile girse bile Supabase aynı doğrulanmış e-postayı tek `auth.users`'a
  bağlarsa uid aynıdır → app'te tek `User`.
- Supabase Dashboard'da **"link identities" / aynı e-postayı birleştirme** ayarının
  durumu doğrulanmalı: doğrulanmamış sağlayıcı e-postasıyla otomatik birleştirme
  YAPILMAMALI (güvenlik). Bu ayar tek yerde; üç platform paylaşır.

## 10. Mobilde saklanacak session yapısı

- `supabase_flutter` session'ı **kendi güvenli deposunda** tutar (iOS Keychain /
  Android EncryptedSharedPreferences üzeri `flutter_secure_storage`).
- Access token kısa ömürlü + refresh token ile sessiz yenileme (paket otomatik).

## 11. Güvenli token saklama yöntemi

- Token'ları düz `SharedPreferences`/dosyaya YAZMA. `flutter_secure_storage`
  (Keychain/Keystore) kullan. Service role key mobile'a KONMAZ (yalnız anon key).

## 12. Flutter uyumluluk notları

- `supabase_flutter` (resmi) yeterli; ekstra OAuth SDK'sı şart değil.
- Native id-token akışı (google_sign_in / sign_in_with_apple) redirect akışından
  daha akıcı — mobilde bunu tercih et.

## 13. Native build gerektiren noktalar

- Google: `google-services.json` (Android), URL scheme (iOS), SHA-1 kaydı.
- Apple: Sign in with Apple capability, Services ID, associated domains.
- Deep link: Android intent-filter + assetlinks.json; iOS associated domains + AASA.

## 14. Android ve iOS için sonra yapılacak işler

1. Supabase'e mobil OAuth client id'leri + deep-link redirect'leri ekle.
2. Flutter'da ortak `AuthService` (web'deki `lib/auth/providers.ts` mantığının
   Dart karşılığı): provider listesi, redirect sabitleri, hata normalizasyonu.
3. Native google_sign_in + sign_in_with_apple → `signInWithIdToken`.
4. Deep link handler + session restore.
5. Apple ilk-giriş ad/soyad yakalama + "boş üzerine yazma" koruması.

## 15. Mobil entegrasyon kontrol listesi

- [ ] Aynı Supabase projesi bağlı (anon key, service role DEĞİL).
- [ ] Google native giriş → uid web ile aynı hesabı açıyor.
- [ ] Apple native giriş → uid sabit, relay e-posta destekli.
- [ ] Web'de açılan hesaba mobilde giriş / tersi çalışıyor.
- [ ] Deep link callback dönüşü çalışıyor.
- [ ] Session güvenli depoda, sessiz yenileme çalışıyor.
- [ ] Apple ilk-giriş ad bilgisi kaybolmuyor, eksik metadata üzerine yazmıyor.
- [ ] OAuth kullanıcıya otomatik yetki yükseltmesi YOK (varsayılan rol).
