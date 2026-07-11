# Doc 10 — Mobil Uygulama Modülleri

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 2 (PRD/MVP kapsamı), Doc 3 (feature-first mimari), Doc 7 (API), Doc 8 (auth).
> **Kapsam:** MVP'deki her Flutter feature modülünün sorumluluğu, ekranları, durumları, bağımlılıkları. Akışlar Doc 11, ekran taslakları Doc 12.

---

## 1. Modül Haritası (MVP)

```
app kabuğu (router, tema, DI)
core (network, storage, theme, error, config, localization)
│
features/
├─ onboarding      → ilk açılış tanıtımı
├─ auth            → giriş/kayıt/göç
├─ home            → ana ekran (giriş noktası)
├─ catalog         → modül→ders→konu keşfi
├─ quiz            → çözüm motoru (çekirdek)
├─ result          → oturum sonucu
├─ progress        → istatistik/ilerleme
├─ review          → yanlışlarım/favoriler/tekrar
├─ subscription    → paywall/premium
├─ notifications   → bildirim merkezi
└─ profile         → profil/ayarlar
```

Her modül kendi `domain / data / presentation` dilimini taşır (Doc 3 §3.2). Modüller arası doğrudan bağımlılık yok; ortak şey `core`/`shared`'da.

---

## 2. Modül Detayları

### 2.1 `onboarding`
- **Amaç:** İlk açılışta değer önermesini anlatan 3-4 ekran + hedef sınav seçimi.
- **Ekranlar:** Karşılama slaytları, hedef sınav seçimi (PAEM/POMEM/PMYO), bildirim izni isteği.
- **Durum:** yalnızca ilk kez (`onboarding_completed_at`); sonra atlanır.
- **API:** `GET /catalog/modules` (hedef seçimi için).
- **Not:** Bildirim/ATT izinleri **doğru zamanda** istenir (değer gösterildikten sonra), açılışta değil.

### 2.2 `auth`
- **Amaç:** Kimlik doğrulama ve eski kullanıcı göçü.
- **Ekranlar:** Giriş, Kayıt, Şifremi unuttum, Şifre sıfırla, E-posta doğrulama bekleme, **Hesap taşındı → yeni şifre belirle** (göç claim).
- **Durum:** `unauthenticated / authenticating / authenticated / migrationRequired / needsEmailVerification`.
- **API:** `/auth/*` (Doc 7 §4.1). Supabase Auth + Apple/Google.
- **Güvenlik:** token secure storage; Doc 8 akışı.

### 2.3 `home`
- **Amaç:** Uygulamanın kalbi; kullanıcıyı çalışmaya yönlendiren giriş noktası.
- **İçerik:** Günün durumu (streak, günlük hedef ilerlemesi), "Kaldığın yerden devam et", günün sorusu (V1), önerilen konu (V1 AI), hızlı erişim (deneme sınavı, yanlışlarım).
- **Durum:** özet verilerin yüklenmesi (skeleton loader ile).
- **API:** `GET /progress/summary`, `/progress/streak`, `/daily/question`.
- **Premium:** premium olmayanlar için günlük limit göstergesi + ince paywall ipucu (rahatsız etmeden).

### 2.4 `catalog`
- **Amaç:** İçerik keşfi — modül → ders → konu.
- **Ekranlar:** Modül listesi, Ders listesi, Konu listesi (ilerleme + premium kilit rozeti), Konu detay (soru sayısı, "çözmeye başla").
- **Durum:** liste yükleme, arama, boş durum.
- **API:** `GET /catalog/*` (ETag cache; offline'da son cache).
- **Premium:** `is_premium` konular kilit rozetiyle; tıklanınca paywall.

### 2.5 `quiz` (ÇEKİRDEK — en kritik modül)
- **Amaç:** Soru çözme motoru; practice/exam/daily/review modlarını tek motorda birleştirir. (Eski uygulamadaki 8 kopya controller'ın yerine **tek yeniden kullanılabilir motor**.)
- **Ekranlar:** Quiz ekranı (soru kökü, şıklar, ilerleme çubuğu, süre [exam], lifeline yok-MVP), Çıkış onayı.
- **Modlar:**
  - `practice`: anlık geri bildirim + açıklama (öğrenme).
  - `exam`: süreli, geri bildirim sona ertelenir.
  - `daily`: günün sorusu.
  - `review`: yanlışlar/favorilerden.
- **Durum:** `loading / question(index) / answering / answered / paused / submitting / completed`. Kaldığı yerden devam (kesintiye dayanıklı).
- **API:** `POST /quiz/sessions`, `POST /sessions/:id/answers` (Idempotency-Key), `POST /sessions/:id/complete`.
- **Offline:** sorular cache'te; cevaplar yerel kuyruğa, senkron online olunca (Doc 3 §5.1).
- **Güvenlik:** exam modunda doğru cevap **istemciye hiç gelmez** (Doc 7 §3); değerlendirme sunucuda.
- **UX:** akıcı geçiş animasyonu, doğru/yanlış mikro-etkileşimi, haptik geri bildirim (premium his).

### 2.6 `result`
- **Amaç:** Oturum sonucu ve öğrenme çıktısı.
- **Ekranlar:** Sonuç özeti (skor, doğru/yanlış/boş, süre), soru-soru inceleme (açıklama + mevzuat referansı), "yanlışları tekrar et", paylaş.
- **API:** `complete` yanıtı + `GET /sessions/:id`.
- **UX:** motive edici sunum (başarı kutlaması ama moral bozmayan; zayıf konuları yapıcı gösterme).

### 2.7 `progress`
- **Amaç:** İlerleme ve istatistik görünürlüğü.
- **Ekranlar:** Genel istatistik (çözülen/başarı/trend), konu bazlı mastery (zayıf konular vurgulu), streak takvimi, geçmiş oturumlar.
- **API:** `GET /progress/summary|topics|history|streak`.
- **Premium:** detaylı analitik premium'a kısıtlanabilir (freemium kararına göre — şu an günlük-limit modeli, detaylı istatistik teşvik olabilir).

### 2.8 `review`
- **Amaç:** Hedefli tekrar — öğrenmeyi pekiştirme.
- **Ekranlar:** Yanlışlarım listesi, Favoriler listesi, buradan tekrar oturumu başlat.
- **API:** `GET /review/bookmarks|wrong-answers`, `POST /review/sessions`.
- **Bağımlılık:** `quiz` motorunu `review` modunda yeniden kullanır.

### 2.9 `subscription` (paywall & premium)
- **Amaç:** Freemium sınırında dönüşüm + premium erişim.
- **Ekranlar:** Paywall (planlar: aylık/yıllık, avantajlar), satın alma akışı, "aboneliğim" durumu, geri yükle.
- **Durum:** `free / purchasing / verifying / premium / expired`.
- **API:** `GET /subscription/plans|status`, `POST /verify|restore`. StoreKit 2 (iOS).
- **Güvenlik:** makbuz **sunucuda doğrulanır**; premium durumu `entitlements`'tan (Doc 6/7). İstemci asla kendi premium kararını vermez.
- **Tetikleyiciler:** günlük limit dolduğunda, premium konuya dokununca, detaylı analitik istenince.

### 2.10 `notifications`
- **Amaç:** Bildirim merkezi + push kaydı.
- **Ekranlar:** Bildirim listesi (okundu/okunmadı).
- **API:** `GET /notifications`, `POST /:id/read`, `POST /me/devices` (push token).
- **Push:** APNs (iOS); backend'den tetiklenir (çalışma hatırlatma, streak riski).

### 2.11 `profile`
- **Amaç:** Kullanıcı hesabı ve ayarlar.
- **Ekranlar:** Profil (ad, avatar, hedef sınav), Ayarlar (bildirim tercihleri, dil-ileride, tema), Abonelik kısayolu, Yasal (KVKK, gizlilik, kullanım şartları), **Hesabı sil** (KVKK), Çıkış.
- **API:** `GET/PATCH /me`, `DELETE /me`.

---

## 3. Modüller Arası İlişkiler
```
home ──► catalog ──► quiz ──► result ──► review
  │                    ▲                    │
  │                    └────────────────────┘ (tekrar oturumu)
  ├──► progress
  ├──► subscription (paywall — her premium tetikleyiciden)
  └──► profile ──► notifications
auth ──► (tüm korumalı modüllerin ön koşulu)
```
- `quiz` motoru **paylaşımlı**; catalog/review/daily/home hepsi onu farklı modda çağırır → sıfır kod tekrarı.
- `subscription` bir **kesişen tetikleyici**; herhangi bir premium duvarından açılır.

## 4. Ortak (shared/core) Bileşenler
- **Design system komponentleri:** buton, kart, quiz option kartı, ilerleme çubuğu, streak rozeti, skeleton loader, boş-durum, hata-durum, paywall bileşenleri.
- **Bunlar tek yerde** (`core/theme` + `shared/widgets`) → tutarlı premium his + tek noktadan bakım.

## 5. MVP'de Kasıtlı Olarak Yok
Battle/1v1/grup, robot rakip, coin store, refer&earn, lifeline'lar, leaderboard (V1'e), AI çalışma planı (V1), günlük soru (V1'e çekilebilir), çoklu dil UI (mimari hazır, MVP TR).

## 6. Her Modülün Testi (QA)
- Domain/use-case: unit (skor, limit, mod mantığı istemci tarafı gösterim).
- Presentation: widget test (özellikle `quiz` durum makinesi).
- Kritik akış: `auth → catalog → quiz → result` ve `subscription` satın alma → integration test.

## 7. Vizyona hizmet
| İlke | Modül karşılığı |
|---|---|
| Kod tekrarı minimum | Tek `quiz` motoru, paylaşımlı design system |
| Premium UX | Skeleton/boş-durum/haptik/animasyon çekirdekte |
| Modülerlik | Feature-first dilimler, bağımsız büyüme |
| Backend tek kaynak | Her modül yalnızca NestJS API'yi çağırır |
| Yeni sınav modülü kolay | catalog+quiz veri-sürümlü; yeni modül = içerik |
