# Doc 49 — Paemisyon 2.0: yeniden tasarım, Expo geçişi ve ürün genişlemesi (plan v2)

Tarih: 16 Ekim 2026 (v2, denetim sonrası). Durum: **onay bekliyor**. Sınava yaklaşık bir yıl var.
Denetim raporu: `01-denetim.md`. Kullanıcı talimatı (16 Eki) bu planın kapsam kaynağıdır:
ürün, IA, görsel kalite, öğrenme akışları ve teknik altyapı bütüncül; admin panel dahil.

## 0. Karar özeti

| Karar | Sonuç | Tarih |
|---|---|---|
| Kapsam | Görsel dil ve bilgi mimarisi sıfırdan; API, soru bankası, koç kuralları, IAP ve denetim hattı korunur | 15 Eki |
| Görsel dil | PAEM'e özgü ve sıcak; jsps/gys'nin kurumsal petrol-kehribar dilinin kardeşi değil | 16 Eki |
| Mobil çatı | **Expo (React Native)**; Flutter yalnız bakımda kalır, yeni uygulama yan yana gelişir ve 2.0 olarak aynı kimlikle çıkar | 16 Eki |
| Yön | **Yön 2 "Nöbet"** — keşif tuvali: https://claude.ai/artifact/C4gQyAEo9ufoNaoYttZXFc | 16 Eki |
| İlk özellikler | Geri sayımlı haftalık plan · gerçek aralıklı tekrar · dönemlik deneme serisi · mevzuat ↔ soru çift yönlü geçiş | 16 Eki |
| Kapsam genişlemesi | Admin panel de yenilenir; talimatın 5–13. bölümleri (soru çözme, deneme, gelişim, yanlışlar defteri, koç, AI açıklama, mevzuat güncelliği, oyunlaştırma) kapsamda | 16 Eki |
| Sekmeler | Anayasal beş sekme korunur: **Bugün · Kütüphane · Denemeler · Performans · Ben** (Doc 25 §1, Doc 29 §5). Mevzuat Kütüphane içindedir; v1'deki "Mevzuat sekmesi" geri alındı | 16 Eki (v2) |

Neden Expo: web ile tek token kaynağı ve aynı bileşen dili; gys-mobil ve jsps-mobil'de
Supabase oturumu, Apple/Google girişi, `expo-iap`, `expo-notifications`, derin bağlantı ve
EAS dışı yerel arşiv akışı zaten çalışıyor; zaten her ekran yeniden yazılacağı için geçişin
ek maliyeti yalnız altyapı katmanıdır. Doc 48'in (Flutter Bugün v2) zayıflığı araç değil
süreçti: yazılı görsel kimlik yoktu ve göz testi yapılmadı. Bu belge o iki eksiği kapatır.

## 1. Görsel kimlik — "Nöbet"

Gece nöbetinde, loş ışıkta çalışan birinin uygulaması. Koyu tema birincil, açık tema türev.
Sıcak kömür zemin, bakır ışık, adaçayı yeşili. Rakamlar büyük ve net, metin kısa. Enerjik
ama bağırmayan bir ciddiyet; spor saati hissi, ofis hissi değil. Gölge yok; yüzey tonu farkı
ve 1 px çizgi ayrıştırır.

### 1.1 Renk (semantik token → değer)

| Token | Koyu (birincil) | Açık | Kullanım |
|---|---|---|---|
| `bg` | #17161A | #F1EDE9 | Ekran zemini |
| `surface` | #221F25 | #FFFFFF | Kart, satır, sayfa |
| `surfaceAlt` | #2C2830 | #E8E2DC | Rozet zemini, ikincil kutu, ilerleme rayı |
| `ink` | #F4EEE6 | #1F1C21 | Birincil metin |
| `inkSoft` | #A79F96 | #6A6269 | İkincil metin |
| `inkSubtle` | #7C746C | #8D858C | Üçüncü ton: etiket, pasif sekme |
| `line` | #34303A | #DBD4CE | Çizgiler, kart kenarı |
| `accent` | #E3804F | #B5532E | Tek vurgu: birincil eylem, aktif, görev |
| `accentSoft` | #3A281F | #F8E1D4 | Vurgu zemini (seçili şık, zayıf rozeti) |
| `accentInk` | #F2A47C | #9C4827 | Vurgu zemini üstünde metin |
| `onAccent` | #17161A | #FFFFFF | Vurgu dolgu üstünde metin |
| `success` | #8FB39A | #5F8A6B | Doğru, tamamlanan gün, başarı |
| `successSoft` | #243029 | #E3EEE6 | Başarı zemini |
| `warning` | #E0B15A | #A87530 | Zayıf ilerleme, dikkat |
| `danger` | #E07A6B | #B8453A | Yanlış cevap, geri dönüşsüz eylem |
| `focusRing` | #F2A47C | #B5532E | Klavye odağı halkası |

Soft/Ink türevleri (`successSoft/Ink`, `warningSoft/Ink`, `dangerSoft/Ink`) ve kontrast çiftleri
`packages/tokens/design-tokens.json` içinde; 16 Eki kontrast testi açık temada üç değeri
(accent, accentInk, warning) koyulaştırdı.

Kurallar: ekranda tek vurgu (`accent`); ders rengi YOK, ders farkı ikonla (Doc 48 kararı
korunur); durum yalnız renkle anlatılmaz, rozet metni ya da ikon eşlik eder; bütün metin
çiftleri ≥ 4.5:1, 24 px üstü ≥ 3:1 (token paketinde test edilir).

### 1.2 Tipografi

Başlık: **Bricolage Grotesque** (600/700, optik boyut değişkeni). Gövde: **Instrument Sans**
(400–700). İkisi de Google Fonts, `latin-ext` alt kümesi; Expo'da `expo-font` ile
paketlenir, webde `next/font` ile.

| Rol | Boy/satır | Ağırlık | Not |
|---|---|---|---|
| `display` | 64/60 | 700 | Geri sayım rakamı; harf aralığı −0.04em, tabular |
| `title` | 28/30 | 700 | Görev başlığı; −0.02em |
| `heading` | 20/26 | 600 | Bölüm başlığı |
| `subhead` | 15/20 | 600 | Satır başlığı |
| `body` | 16/25 | 400 | Soru metni ve mevzuat okuma |
| `bodySm` | 14/20 | 400 | Açıklama |
| `label` | 11/14 | 600 | Büyük harf, +0.10em |
| `stat` | 22/24 | 700 | Kutu içi yüzde, tabular |

iOS Dynamic Type: Doc 48/05'teki eğri korunur (17 pt üstü HIG satırına iner, hiçbir boy
doğrusal büyümez). Android: sistem yazı ölçeği 1.3'e kadar doğrusal, üstü kırpılır.

### 1.3 Ölçü, köşe, hareket

- Boşluk 4 tabanlı: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48. Ekran yan boşluğu 20.
- Köşe: kontrol 10 · kart 14 · sayfa/sheet 20 · pill.
- Dokunma hedefi ≥ 44 pt; sekme çubuğu 5 sekme (Bugün · Kütüphane · Denemeler · Performans · Ben).
- Hareket: 180 ms giriş / 140 ms çıkış, `easeOut`; liste satırları 24 ms kademeli; sayfa
  geçişleri platformun kendisi. `prefers-reduced-motion`'da yalnız opaklık.
- İkon: Lucide, 24 ızgara, 1.75 kontur (Doc 48 ile aynı set, isimler korunur).

### 1.4 Bileşen envanteri (v3)

Temel: `Screen`, `AppText`, `Button` (primary/secondary/ghost/destructive, loading),
`IconButton`, `Card`, `ListRow`, `StatTile`, `ProgressBar`, `SegmentBar` (görevdeki 12
dilim), `WeekDots`, `Badge`, `Chip`, `Sheet`, `Notice`, `EmptyState`, `Skeleton`.
Alan: `TaskHero`, `CountdownHeader`, `CourseTile`, `LegislationRow`, `QuestionStem`,
`QuestionOption` (default/selected/correct/incorrect/disabled), `ExamTimer`, `ExamMap`,
`ResultSummary`, `Paywall`.

Her bileşen varyant parametreli, tek ekrana özel bileşen yok (CLAUDE.md §3).

## 2. Mimari

### 2.1 Monorepo yerleşimi

```
packages/tokens/            ← tek kaynak (var): design-tokens.json v3'e yükselir
  build/                    ← üretilen: tokens.css (web), tokens.ts (RN), tokens.dart (geçiş süresince)
apps/mobile/                ← Flutter, DONDURULUR (yalnız kritik bakım)
apps/app/                   ← YENİ Expo uygulaması (öneri; ad kararı §5)
apps/web/                   ← Next.js, tokens.css'e bağlanır (aşama 7)
apps/api/                   ← değişmez; yeni özellikler için yeni uçlar eklenir
```

Token paketi bir üretim betiğiyle üç hedefe yazar; elle eşitleme biter (bugünkü
`design-tokens.json` açıklaması "üç yerde birden elle" diyor, bu kalkar).

### 2.2 Expo uygulaması

- Expo SDK güncel kararlı sürüm, development build (Expo Go değil), `expo-router`.
- Durum ve veri: `@tanstack/react-query` + `fetch` ile NestJS API (`api.paemisyon.com/api/v1`);
  Supabase yalnız kimlik (oturum, Apple/Google, e-posta). JWT API'ye `Authorization` ile gider.
- Kimlik: `com.paemisyon.paemisyon` (iOS ve Android aynı). Aynı Apple Team, aynı Firebase
  projesi (FCM için `google-services.json` / `GoogleService-Info.plist` yeniden kullanılır).
- Push: `expo-notifications` + FCM/APNs; API'deki cihaz kaydı ucu değişmez, token biçimi
  (Expo push token yerine ham FCM/APNs token) ilk haftada doğrulanır.
- Satın alma: `expo-iap`; ürün kimlikleri Flutter'daki `monthly`/`yearly` ile birebir aynı,
  "Satın alımları geri yükle" ilk günden test listesinde.
- Çevrimdışı: `expo-sqlite` ile soru önbelleği ve yarım tur; Flutter `offline` modülünün
  sözleşmesi (hangi veri, ne kadar) olduğu gibi taşınır.
- Derin bağlantı: `paemisyon://` + `applinks:paemisyon.com` (AASA dosyası web'de var mı,
  F1'de kontrol).
- Test: `vitest` saf mantık; bileşen golden'ı yerine **göz testi protokolü** (§4).
- `.env` commit edilmez; `EXPO_PUBLIC_*` yalnız açık değerler.

### 2.3 Bilgi mimarisi (Doc 24/25 ve Doc 48 kararları üstüne)

Beş sekme, Doc 25 ağacı. **Bugün:** durum satırı (geri sayım + haftalık gün), görev kartı,
hazırlık, mevzuat kaldığın yer, sabit eylem çubuğu (Yerleşim B); Planım katmanı (haftalık
plan) üstüne gelir. **Kütüphane:** Dersler → Konu, Mevzuat (Atlas), Yanlışlarım, Tekrar
(SRS), Favoriler ve Listelerim. **Denemeler:** seri/dönem takvimi, lobi, oynatıcı, analiz,
sıralama, arşiv, çıkmış sınavlar. **Performans:** genel bakış, konu haritası, deneme eğrisi,
haftalık rapor, rekorlar. **Ben:** profil, rütbe, rozetler, premium, ayarlar, bildirim
tercihleri. D1–D4 ve Doc 25 K1–K3 (tek Seans Oynatıcı, 2 dokunuş, koç ekran değildir)
korunur; `01-denetim.md` §6'daki 15 kural bağlayıcıdır.

Soru ekranı 2.0'da yedi durumu tam karşılar (cevapsız, seçili, kontrol edilmiş, açıklama,
işaretli, tamamlanmış, yükleniyor/hata); alıştırmada anında kontrol, denemede sınav sonu
(mevcut davranış korunur). Eklenenler: işaretleme (sunucuda kalıcı), not, kişisel liste,
önceki soruya dönüş, çıkış onayı, favori tohumlama.

## 3. Aşamalar

İki iş kolu paralel yürür: **İstemci** (Expo, sonra web) ve **Sunucu+Admin** (veri katmanı,
panel). Tek geliştirici olduğundan paralel ancak haftalık dilimlerle; her aşama onayla kapanır.

| # | Aşama | Çıktı | Süre (tahmin) | Kapanış ölçütü |
|---|---|---|---|---|
| A0 ✅ 16 Eki (dal `claude/a0-guven-onarimi`, deploy bekliyor) | **Güven onarımı** (2.0'dan bağımsız, hemen) | T1 sourceLabel kaybı, T2 beş şık zorunlu, T3 pageSize, T4 durum filtresi, T5 ret notu soruda; kuyrukta kaynak türü filtresi; AI/türetilmiş sorulara toplu onay engeli | 2–3 gün | Panelden düzenlenen soru etiketini korur; kuyruk kaynağa göre ayrışır |
| A1 ✅ 16 Eki (canlıda; Sentry DSN sahibinden) | Temel | pnpm workspace + CI (lint, typecheck, test) + Sentry (API/web/admin, sonra Expo) + kök temizliği (SQL dökümleri ve eski projeler şifreli arşive) | 3 gün | CI yeşil; dökümler repo dışında |
| F0 ✅ 16 Eki (dal `claude/f0-token-v3`) | Kimlik belgesi + token v3 | Bu belge §1 onaylı; `packages/tokens` v3 ve üretim betiği (css/ts/dart); kontrast testi | 3–4 gün | Üç hedefe üretim çalışır |
| F1 ✅ 16 Eki (simülatörde gerçek girişle doğrulandı) | Expo iskelet | `apps/app`: router, tema, fontlar, Supabase oturumu, API istemcisi, hata/raporlama, 5 boş sekme | 1 hafta | Telefonda giriş yapılıp `/me/coach` çekiliyor |
| F2 ✅ 16 Eki (galeri açık/koyu, AX, SE) | Tasarım sistemi v3 | §1.4 temel bileşenler + bileşen galerisi ekranı (storybook yerine uygulama içi) | 1 hafta | Galeri açık/koyu, AX5 ve SE'de göz testinden geçti |
| F3 ✅ 16 Eki (beta hesabında tam tur; Figma aynası `06`) | Bugün + Çalış | Bugün (8 durum), soru oturumu, sonuç, yanlış tekrarı girişi | 2–3 hafta | Beta hesabında gerçek veriyle, kullanıcıyla telefon turu |
| F4 ✅ 16 Eki (dört sekme; eşitlik tablosu `07` §5; paywall/push/onboarding F5) | Denemeler + Kütüphane + Performans + Ben | Deneme listesi/koşucu/sonuç/sıralama/çıkmış sınavlar, dersler/konu/atlas, mevzuat okuyucu, yanlışlar/favoriler, performans ekranları, profil/ayarlar/rozetler/üyelik | 3–4 hafta | `01-denetim.md` mobil envanterine göre özellik eşitliği tablosu dolu |
| F5 ◐ 16 Eki (kod + sim doğrulaması; sandbox satın alma, telefonda push ve çevrimdışı kuyruk kullanıcı testi bekliyor — `08`) | Altyapı tamamlama | IAP + geri yükleme, push, çevrimdışı, derin bağlantı, paylaşım, tanıtım/onboarding, paywall | 2 hafta | Mağaza kontrol listesi (Doc 28 ASC kuralları) yeşil |
| F6 | Beta ve 2.0 | TestFlight/kapalı test, kullanıcı geri bildirimi, 2.0 yayın; Flutter arşivlenir | 2 hafta | İki mağazada 2.0, çökme oranı < %0.5 |
| F7 | Web yeni deri | `apps/web` token v3 ve bileşen diliyle (koç kartları, seans oynatıcı, Bugün) | 2–3 hafta | Web ve mobil aynı dil |
| S1 ✅ (17 Eki 2026, `10-s1-veri-katmani.md`) | Veri katmanı 2.0 (sunucu, F2–F4 ile paralel) | `QuestionReview` (SRS) + `GET /review/due` + due modu; `QuestionArticle` N:N + `LawArticleVersion`; `QuestionNote`, `UserList`, kalıcı bayrak; `DailyUsage.studySeconds` + `User.dailyMinutes` kullanımı; `QuestionVersion.lastReviewedAt`/`reviewNote`; migration ve spec'lerle | 3 hafta | Yeni uçlar spec'li; Flutter etkilenmez |
| S2 | Admin 2.0 | Ortak bileşen kiti (token v3, tablo/filtre/dialog; `prompt` kalkar); soru listesi filtreleri (zorluk, kaynak türü, madde, tarih, çözülme); mevzuat sağlığı (tarama cron'u, değişen madde → yeniden inceleme kuyruğu, dipnot temizliği paneli); madde bağlama ekranı (`madde-oner` kabul/ret); toplu işlemler (gerekçeli arşiv, etiket düzeltme, mükerrer tarama, 4 şıklı liste); kullanıcı detayı + rol/beta atama + tarih seçicili premium; sınav türü CRUD; içerik kalite metrikleri; betik koşuları audit'e | 4–5 hafta | Betikle yapılan rutin işlerin %80'i panelden yapılıyor |
| F8+ | Dört özellik + talimat 8–13 | Sırayla: haftalık plan (Planım) → aralıklı tekrar → deneme serisi → mevzuat↔soru; ardından gelişim yorumları, AI açıklama genişlemesi (diğer şıklar, basit anlatım, benzer soru; bütçe tavanı), oyunlaştırma (haftalık hedef kişisel, rozet türleri, bildirim tercihleri). Her biri kendi doc'u | Kalan süre | Her biri gerçek veriyle E2E, Doc 24 §13 üç sorusundan geçer |

Toplam A0–F7 ve S1–S2 yaklaşık 18–20 hafta; sınava kadar F8 için 7 aydan fazla kalır. Her
aşama sonunda durulur ve onay alınır (CLAUDE.md: plan → onay → uygulama). Test ve kalite
kontrolü (talimat §16) her aşamanın kapanış ölçütüne gömülüdür; çalıştırılamayan test
açıkça raporlanır.

## 4. Göz testi protokolü (Doc 48'den çıkarılan ders)

Her ekran kapanmadan önce:

1. Simülatörde iPhone SE ve iPhone 16 Pro Max, açık ve koyu, Dynamic Type varsayılan ve AX3.
2. Kullanıcının telefonuna development build; bir dakikalık serbest kullanım; "göze eski
   duran var mı" sorusu açıkça sorulur.
3. Golden/kontrast testleri yalnız gerileme için; kalite kararını göz verir.
4. Figma'ya **sonradan** ve yalnız kapanan ekran aktarılır (kaynak kod, ayna Figma).

## 5. Açık kararlar (onayla birlikte)

1. **Klasör adı:** `apps/app` mi, `apps/mobile-v2` mi? Öneri `apps/app` (geçiş bitince
   Flutter `apps/mobile-flutter-arsiv` olur, ad değişmez).
2. **Flutter dalları:** `claude/mobil-anasayfa-tasarim` (28 commit, Bugün v2) ve paralel üç dal
   artık yayınlanmaz; yalnız API/admin tarafı canlıda. Öneri: dalları arşiv etiketiyle
   bırak, mağazaya Flutter sürümü çıkma.
3. **Web zamanlaması:** F7 mobil 2.0'dan sonra mı (öneri), yoksa F2 ile paralel mi?
4. **Flutter bakım eşiği:** 2.0'a kadar Flutter'a yalnız çökme ve mağaza zorunluluğu
   düzeltmesi girer; yeni özellik girmez.
5. **A0 önce mi?** Öneri: evet, 2.0 beklemeden bu hafta; kaynak etiketi kaybı canlı bir
   güven açığı.
6. **Admin 2.0 ayrı uygulama mı, mevcut `apps/admin` evrimi mi?** Öneri: mevcut Next.js
   uygulaması yerinde evrilir (rota ve API korunur), yalnız bileşen katmanı ve sayfalar
   yenilenir.
7. **Belge düzeltmeleri:** Doc 26 §4 `SourceTag` maddesi, ücretsiz limit (15→30), Doc 49 v1
   sekme hatası; CLAUDE.md "mobil Flutter" satırı F1 ile güncellenir.

## 6. Riskler

- Kapsam (Doc 14 R3): talimat geniş; aşamalar kapanış ölçütüyle sınırlandı, her yeni istek
  F8 kuyruğuna girer.

- IAP geçişi: aynı ürün kimliği ve aynı Apple/Google hesabı; geri yükleme akışı F5'in
  ilk maddesi. Riskli nokta Android'de teklif (offer) seçimi (paywall memo'sunda açık).
- Push token biçimi değişirse API'de cihaz kaydı uyarlaması gerekir (F1'de ölçülür).
- Çevrimdışı modülün kapsamı belirsizse F5 uzar; F1'de Flutter modülü belgelenir.
- Tek geliştirici: F3–F4 paralel değil ardışık; süre tahminleri buna göre.
- Supabase pooler 15 bağlantı: geliştirme sırasında lokal API `connection_limit=4`.
