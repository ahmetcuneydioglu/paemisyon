# Doc 8 — Authentication & Authorization Yapısı

> **Durum:** Onaya sunuldu (göç kaynağı kararı bekliyor) · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 3, 4, 6, 7. Eski analiz: iOS = Firebase Auth (`paem-45a67`), web = MySQL `ekip_uyeler` (MD5 parola).
> **Kapsam:** Kimlik doğrulama mimarisi, token yaşam döngüsü, sosyal giriş, RBAC, kullanıcı göçü.

---

## 1. İlkeler
1. **Hiçbir secret istemcide yok.** Token'lar sunucudan; imza anahtarı sunucuda.
2. **Kimlik ≠ Yetki.** Kimlik doğrulama (kimsin) ile yetkilendirme (ne yapabilirsin) ayrı katman.
3. **Kripto elle yazılmaz.** Parola hash'leme, e-posta doğrulama, sıfırlama gibi güvenlik-kritik akışlar hataya çok açık → olgun bir sağlayıcıya bırakılır (solo geliştirici için güvenlik kazancı).

## 2. Karar: Supabase Auth (kimlik) + NestJS (yetki & iş mantığı)

**Neden bu ayrım:** Kimlik primitifleri (kayıt, parola hash, e-posta doğrulama, sıfırlama, OAuth) olgun ve managed bir sistemde; iş mantığı ve yetkilendirme tümüyle NestJS'te. Bu, "backend tek gerçek kaynak" ilkesini bozmaz — çünkü **iş kararları (rol, abonelik, erişim) NestJS'te**; Supabase yalnızca "bu kişi gerçekten bu e-posta mı" sorusunu güvenle cevaplar.

| Yaklaşım | Elle yazılan kripto | Solo güvenlik riski | Kontrol |
|---|---|---|---|
| **Supabase Auth + NestJS yetki** ✅ | Yok | Düşük | İş mantığı tam bizde |
| Tam özel NestJS auth | Çok (hash, reset, OAuth doğrulama) | Yüksek | Tam ama riskli |
| Firebase Auth | Yok | Düşük | Vendor lock-in + veri Firebase'de |

**Akış:**
```
Flutter (supabase_flutter — YALNIZCA auth)
  → Supabase Auth: signup/login/OAuth → access + refresh token (JWT)
  → Token secure storage'da (Keychain/Keystore)
Her API isteği:
  Flutter → NestJS  (Authorization: Bearer <supabase_access_token>)
  NestJS → Supabase JWKS ile imza doğrular
         → auth.uid → users satırını yükler
         → roles + entitlements ekler (yetki kararı NestJS'te)
```
> Kritik: Flutter, Supabase SDK'yı **yalnızca kimlik için** kullanır. Veri/iş mantığı için asla doğrudan Supabase'e gitmez — hep NestJS API. (Doc 3 altın kuralı.)

## 3. Desteklenen Giriş Yöntemleri (MVP)
| Yöntem | Not |
|---|---|
| E-posta + parola | E-posta doğrulama zorunlu |
| **Sign in with Apple** | App Store zorunluluğu (sosyal giriş varsa Apple da olmalı) |
| Google ile Giriş | |
| ~~Facebook~~ | MVP'de yok (eski template kalıntısı; gerekirse sonra) |

## 4. Token Yaşam Döngüsü
- **Access token:** kısa ömürlü (~1 saat), her istekte gönderilir.
- **Refresh token:** uzun ömürlü, secure storage'da, **rotasyonlu** (her yenilemede yenisi).
- Dio interceptor: `401` → otomatik refresh → başarısızsa oturum kapat + login.
- **Logout:** refresh token iptal (Supabase session revoke) + yerel token temizliği.
- **Çok cihaz:** her cihaz kendi session'ı; `devices` tablosu push için.

## 5. Yetkilendirme (RBAC)
- Roller: `user`, `editor`, `admin` (Doc 6 `roles`/`user_roles`).
- NestJS guard'ları:
  - `JwtAuthGuard` — geçerli kimlik.
  - `RolesGuard` — admin/editör endpoint'leri (admin paneli).
  - `SubscriptionGuard` — premium içerik (`entitlements`'tan okur).
- Rol/erişim kararı **her zaman sunucuda**; JWT içindeki claim'e körü körüne güvenilmez, kritik kararlar DB'den doğrulanır.

## 6. Güvenlik Sertleştirmeleri
- Giriş/sıfırlama endpoint'lerinde **rate limit** (brute-force).
- **Kullanıcı enumerasyonu yok:** "e-posta bulunamadı" yerine jenerik mesaj.
- E-posta doğrulaması zorunlu (spam/sahte hesap engeli).
- Parola politikası (min uzunluk, yaygın-parola reddi) Supabase Auth'ta.
- KVKK: **hesap silme** akışı (`DELETE /me`) — kimlik + kişisel veri anonimleştirme/silme.
- Tüm trafik HTTPS; token'lar loglara yazılmaz.

---

## 7. Kullanıcı Göçü (açık kararın burada çözülüyor)

**Taşınır:** kullanıcı hesapları. **Taşınmaz:** soru verisi (mevzuat).

### 7.1 Temel zorluk: parola hash'leri taşınamaz
- **Firebase Auth** parolaları: değiştirilmiş scrypt (Firebase'e özel) → Supabase Auth doğrudan doğrulayamaz.
- **Web MySQL** parolaları: **MD5, tuzsuz** → zaten güvenli değil, asla taşınmaz.

Sonuç: **parola tabanlı** eski kullanıcılar için **tek seferlik zorunlu şifre belirleme** kaçınılmaz (Doc 6 `password_reset_required`).

### 7.2 Önerilen strateji: "Lazy / kademeli göç"
1. **Ön-yükleme:** Eski kullanıcı kayıtları (e-posta, ad, varsa abonelik kıdemi) yeni sisteme `legacy_user_map` ile aktarılır; parola taşınmaz.
2. **Sosyal girişliler sorunsuz geçer:** Eski hesabını Google/Apple ile açmış kullanıcılar, aynı e-posta ile OAuth'a girince otomatik eşleşir — hiç sürtünme yok.
3. **Parola kullananlar:** İlk girişte "hesabın taşındı, güvenlik için yeni şifre belirle" akışı (`POST /auth/migrate/claim`) → e-posta doğrulama → yeni parola. Eski verisi (istatistik/kıdem) korunur.
4. **İletişim:** Lansmanda kullanıcılara bir kereye mahsus bilgilendirme (e-posta/uygulama içi) — "daha güçlü, yeni platform; ilk girişte şifreni yenile".

### 7.3 ÇÖZÜLDÜ (2026-07-11): Gerçek taban = mobil DB `paem705`
Kullanıcı eski DB dökümlerini sağladı (`paem701.sql`, `paem705.sql`, `paemmisy_mvc.sql`). Gerçek veri:

**`paem705` (en güncel mobil backend) — ~4.400 kullanıcı** (WRTeam quiz şeması, `users` tablosu):
| Sağlayıcı (`type`) | Sayı | Oran | Göç |
|---|---|---|---|
| Google (`gmail`) | 1.982 | %45 | ✅ OAuth, sorunsuz (e-posta eşleşmesi) |
| E-posta/şifre (`email`) | 1.977 | %45 | ⚠️ tek seferlik reset |
| Apple | 162 | %4 | ✅ OAuth, sorunsuz |
| Telefon (`mobile`) | 150 | %3 | ⚠️ e-posta varsa reset, yoksa özel |
| Facebook (`fb`) | 129 | %3 | ⚠️ FB kaldırılıyor → e-posta eşleşme + reset |

- 4.238/4.400 kaydın **geçerli e-postası var**; 3.738'inde `firebase_id` dolu.
- `paem701` daha eski bir snapshot (~3.075) — `paem705`'in alt kümesi; **kaynak = paem705**.
- Web `paemmisy_mvc.ekip_uyeler` ~1.356 üye (ayrı, daha küçük). Kullanıcı "userları paem705/paem701'den çekebiliriz" dedi → **mobil DB kanonik kaynak**; web üyeleri e-posta ile çakışırsa birleştirilir, aksi halde ikincil.

**`users` tablosunda parola YOK** — parolalar Firebase Auth'ta. Ama tablo `email + name + firebase_id + type` içeriyor.

### 7.3.1 🟢 KRİTİK DE-RİSK: Firebase konsolu erişimi göç için ZORUNLU DEĞİL
Önceki gating risk (eski sistemlere erişim belirsizdi) büyük ölçüde çözüldü: SQL dökümü zaten tüm **e-posta + sağlayıcı türü**nü içeriyor. Bu nedenle:
- Yeni kullanıcı tabanı **doğrudan SQL'den seed edilebilir** (e-posta, ad, hedef eşleme) — canlı Firebase export'a gerek yok.
- **Sosyal kullanıcılar (%49: Google+Apple)** yeni uygulamada aynı e-posta ile OAuth'a girince otomatik eşleşir — hiç sürtünme yok.
- **E-posta/telefon/FB kullanıcıları (~%51)** ilk girişte tek seferlik şifre belirleme akışına girer (`password_reset_required=true`). Parolayı taşımaya zaten çalışmıyoruz.
- Firebase erişimi yalnızca **doğrulanmış e-posta durumu** gibi ek metaveri için *iyi olur*, ama göçün ön koşulu değil.

### 7.4 KARAR (2026-07-11): Her iki taban birleştirilerek taşınacak
- Hem iOS Firebase Auth hem web MySQL `ekip_uyeler` kullanıcıları taşınır.
- **Çakışma çözümü:** e-posta anahtardır. Aynı e-posta her iki kaynakta varsa **tek kullanıcıya birleştirilir** (`legacy_user_map`'te iki satır, tek `new_user_id`). Kıdem/veri birleşiminde daha zengin/yeni olan kazanır.
- Sosyal-girişliler OAuth ile sorunsuz; parolalılar tek seferlik reset.

### 7.5 Göç uygulanabilirliği (güncellendi — düşük risk)
Elde SQL dökümleri olduğu için göç artık **veri açısından uygulanabilir** (önceki "erişim belirsiz" gating riski büyük ölçüde kalktı). Kalan yalnızca uygulama işi:
1. **ETL script'i:** `paem705.users` → yeni `users` + `auth_identities` + `legacy_user_map`. E-posta ile web `ekip_uyeler` çakışması birleştirilir.
2. **Sağlayıcı eşleme:** `type` alanı (`gmail→google`, `apple`, `fb`, `email`, `mobile`) yeni `auth_identities.provider`'a çevrilir; sosyal olanlar OAuth eşleşmesine hazır.
3. **Reset kohortu:** `email/mobile/fb` kullanıcıları `password_reset_required=true`.
4. **Lansman iletişimi:** e-posta/uygulama-içi bilgilendirme (bir kereye mahsus).

> Not: SQL dökümleri **PII içeriyor** (e-posta, telefon, IP) → repoya commit'lenmemeli, güvenli işlenmeli (Doc 14'te veri güvenliği riski).

---

## 8. Vizyona hizmet (özet)
| İlke | Auth karşılığı |
|---|---|
| Secret istemcide yok | Token tabanlı, imza sunucuda |
| Backend tek gerçek kaynak | Yetki/rol/abonelik kararı NestJS'te |
| Solo güvenli geliştirme | Kripto-kritik akışlar Supabase Auth'ta |
| 10 yıl sürdürülebilir | Standart OAuth/JWT, vendor-taşınabilir kimlik |
| Kullanıcıya saygı | Sorunsuz sosyal geçiş + tek seferlik güvenli reset + KVKK silme |
