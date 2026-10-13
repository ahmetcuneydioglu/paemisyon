# Doc 26 — Tasarım Dili ve Koç Ton Rehberi

> Statü: TASLAK — onay bekliyor
> Girdi: Doc 24 (yolculuk), Doc 25 (IA + wireframe seti), CLAUDE.md kalite standartları
> Kapsam: koçun sesi (UX yazımı) + tasarım token sistemi + component library envanteri.
> Bu doküman onaylanınca kod fazı bu sisteme UYARAK başlar — ekran başına stil kararı verilmez.

---

## 1. Koçun sesi — kim konuşuyor?

Koç, kullanıcının **kıdemli meslektaşıdır**: sınavı kazanmış, yolu bilen, nöbetin
ne demek olduğunu anlayan biri. Ne bir "uygulama bildirimi" ne bir "eğitmen robotu".

**Kişilik üç sıfat:** Sakin · Net · Yanında.
**Asla olmayacak dört şey:** suçlama, panik dili, boş motivasyon lafı ("Harikasın!
Süpersin!"), kurumsal mesafe ("Sayın kullanıcımız").

### Dil kuralları

1. **Rakam konuşur, sıfat susar.** "Çok geliştin" değil → "CMK'da 3 haftada %38 → %52."
2. **Tek mesaj, tek eylem.** Her kart bir şey söyler ve bir şey ister. İki fikir = iki kart.
3. **Sen dili, kısa cümle.** En fazla 2 cümle + 1 eylem etiketi. Devrik/edebi cümle yok.
4. **Kayıp dili yalnız seri ve süre için** (Doc 24 §2): "serin bozuluyor" ✓,
   "başarını kaybediyorsun" ✗.
5. **Suç sistemde olur, kullanıcıda olmaz.** Dönüşte "neredeydin?" değil →
   "Ortalık sakin — 3 dakikalık dönüş seansı hazır."
6. **Emoji dozu:** kart başına en fazla 1, yalnız durum işareti olarak
   (🔥 seri, 🏆 deneme, 🔁 tekrar, ⚠️ risk). Cümle içinde emoji yok.
7. **Hitap:** varsayılan isimle ("Merhaba, Ahmet"). "Komiserim" gibi mesleki hitap
   yalnız kutlama anlarında (terfi, sınav sabahı) — samimiyet dozunda kalır.

### Durum → ton tablosu (Doc 25 §3 durum makinesiyle birebir)

| Durum | Ton | Örnek (DOĞRU) | Anti-örnek (YANLIŞ) |
|---|---|---|---|
| normal | Antrenör: net, işlek | "Bugünkü hedef 20 soru. Salı'nın 4 yanlışından tekrar hazır — 5 dk." | "Bugün de harika bir gün olacak! 💪" |
| streak_risk | Acil ama sakin | "Serin 3 saat içinde bozuluyor. 5 soru yeter." | "SERİN BOZULMAK ÜZERE!!! Hemen gir!" |
| slump_watch | Yoldaş, esnek | "Bu hafta yoğunsun galiba — hedefi 10'a çektim. Sen iste, artıralım." | "3 gündür hedefini tutturamıyorsun." |
| comeback | Karşılayıcı, hafif | "Hoş geldin. Güçlü konundan 3 dakikalık seans hazırladım." | "10 gündür yoktun. Rakiplerin çalışıyor." |
| exam_mode | Sakin komutan | "23 gün. Bugün: deneme + yanlış turu. Yeni konu yok — pekiştirme dönemi." | "Az kaldı, panik yok ama ACELE ET." |
| taper | Güven veren | "Hazırsın. 11.400 soru çözdün. Yarın sabah görüşürüz." | "Son gece! Şu 50 soruyu da çöz." |
| post_exam (kazandı) | İnsan, kutlayan | "Tebrikler Komiserim. 🏆 Bu rozet artık senin." | "Tebrikler! Şimdi premium'u yenile." |
| post_exam (kazanamadı) | Empatik, somut | "Emeğin sıfırlanmadı — haritan ve 11.400 sorun gelecek döneme aktarıldı." | "Üzülme, seneye kesin olur!" |

### Bildirim dili (push + e-posta)

- Günde ≤1 push; kullanıcının kendi saatinde (Doc 24 §7.6). Başlık ≤40 karakter,
  eylem imalı: "Serin 19.00'da bozuluyor" / "Günün sorusu hazır" / "Pazar 10.00 — prova".
- Jenerik yasak listesi: "Seni özledik", "Geri dön", "Fırsatları kaçırma".
- Premium teklifi push ile YAPILMAZ — premium anları ürün içidir (Doc 24 §11).

---

## 2. Tasarım dili kararı: tek palet, iki miras

Elimizde iki ayrı görsel dünya var:

- **Mobil (`app_colors.dart`):** seed lacivert `#1B3A6B` + semantic + accent
  ramp'leri (blue/teal/amber/purple, 50→800) + açık/koyu kuralı. Modern, token'lı. ✔
- **Web (`globals.css @theme`):** eski sitenin birebir korunmuş paleti
  (`#173f71`, `#60b500` btn'ler, icomoon) — Doc 18 "sadakat planı"nın ürünü.

**Karar:** Mobil palet **ürünün tasarım dili** olur (koç, seans, atlas, performans —
tüm yeni ekranlar, iki platformda). Web'deki eski tema **"Denemeler mirası"** olarak
sadece mevcut deneme ekranlarında yaşar ve kademeli emekli edilir. İki dili aynı anda
büyütmek CLAUDE.md'deki "tek tasarım sistemi" kuralıyla çelişir.

**Tek kaynak:** `design-tokens.json` (repo kökü `packages/tokens/` veya `docs/`)
→ Flutter `ThemeExtension` sınıfları + web CSS custom property'leri bu dosyadan
üretilir/elle eşitlenir. Token adları iki platformda birebir aynıdır.

---

## 3. Token sistemi

### 3.1 Renk — v2 (Doc 48 Faz 3, 14 Eki 2026; gerekçe ve ölçümler: Doc 48/03)

**Tek vurgu + anlamsal renkler.** Bir ekranda tek vurgu rengi (`accent`) bulunur. Kullanıldığı yerler:
- birincil eylem;
- bağlantı;
- seçim.

`success`, `warning` ve `danger` yalnız durum bildirir. v1'deki `accentSession`, `accentLive`,
`accentStreak` ve `accentAtlas` mobilde emekli oldu. Kategori ayrımı ikon ve metinle yapılır.

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `bg` | #F3F5F8 | #0E1014 | sayfa zemini |
| `surface` | #FFFFFF | #171A20 | kart |
| `surfaceSunken` | #EEF1F5 | #1F232B | kart içi gömülü satır |
| `ink` / `inkSecondary` / `inkTertiary` | #141821 / #4A5161 / #626A79 | #ECEEF2 / #B4BAC6 / #9097A5 | metin katmanları |
| `line` / `lineStrong` / `track` | #E2E6EC / #8A919E / #E3E7ED | #2A2F38 / #6B7280 / #2A2F38 | ayırıcı, kontrol çerçevesi, ilerleme izi |
| `accent` / `onAccent` / `accentSoft` | #1F55C0 / #FFFFFF / #E8EFFC | #8DB6F7 / #0B1426 / #1B2A45 | TEK vurgu ailesi |
| `success` / `successSoft` | #1C7A50 / #E5F4EC | #5FD3A6 / #123128 | başarı |
| `warning` / `warningSoft` | #8A5A00 / #FCF1DC | #F2C46B / #33280F | uyarı (zayıf konu, çevrimdışı) |
| `danger` / `dangerSoft` | #B42318 / #FDECEA | #F28B80 / #3B1A17 | hata |

**Kurallar**
- 44 metin–zemin çiftinin tamamı WCAG AA.
- Renk tek başına anlam taşımaz.
- Koyu tema ters çevirme değildir; koyuda gölge yok, katman farkı `surface`/`bg` ile kurulur.
- Kaynak: `packages/tokens/design-tokens.json` → `v2` ve Figma "Renk" koleksiyonu
  (Açık/Koyu). Web v1'de kalır; geçişi ayrı iştir.

### 3.2 Tipografi — v2

Font ailesi:
- **iOS:** sistem fontu (SF Pro).
- **Android ve Figma:** Inter.
- **Web:** Rubik + Open Sans (değişmedi).

Ölçek iOS Dynamic Type'ın 11 basamağıdır:

| Basamak | Boyut / satır yüksekliği | Ağırlık |
|---|---|---|
| largeTitle | 34/41 | 700 |
| title1 | 28/34 | 700 |
| title2 | 22/28 | 700 |
| title3 | 20/25 | 600 |
| headline | 17/22 | 600 |
| body | 17/22 | 400 |
| callout | 16/21 | 400 / 600 |
| subheadline | 15/20 | 400 / 600 |
| footnote | 13/18 | 400 / 600 |
| caption1 | 12/16 | 500 |
| caption2 | 11/13 | 500 |

Flutter rol eşlemesi ve platform izleme tablosu Doc 48/03 §2'de.

**Kurallar**
1. Flutter `TextTheme`'in 15 rolünün hepsi açıkça tanımlanır, Material 3 varsayılanıyla merge
   edilmez. v1'de gövde metni M3'ten +0,25…+0,5 harf aralığı devralıyordu.
2. Harf aralığı yalnız izleme tablosundan gelir. Ad hoc `letterSpacing` yasak.
3. BÜYÜK HARF + izleme kalıbı yoktur.
4. Rakamlar `tabular-nums`. Web satır genişliği ≤ 65ch.

### 3.3 Spacing · radius · boyut · elevation — v2

**Boşluk** (4pt ızgarası):

| xs | sm | md | lg | xl | 2xl | 3xl |
|---|---|---|---|---|---|---|
| 4 | 8 | 12 | 16 | 24 | 32 | 48 |

Ekran ritmi:
- kenar boşluğu lg;
- bloklar arası xl;
- blok içi md.

Kardeş aralıkları `gap` ile verilir.

**Yarıçap:**

| Basamak | Değer | Kullanım |
|---|---|---|
| sm | 8 | iç öğe |
| md | 12 | düğme, satır kutusu |
| lg | 16 | kart |
| xl | 20 | görev kartı, sheet |
| full | — | pil |

**Boyut:**
- dokunma ≥ 44;
- kontrol 52;
- eylem çubuğu 76;
- sekme çubuğu 83.

**Elevation:**
- `card` yalnız açık temada;
- `overlay` sheet ve eylem çubuğunda;
- koyuda gölge yok.

### 3.4 Motion

| Token | Süre | Easing | Kullanım |
|---|---|---|---|
| `quick` | 150ms | easeOut | dokunma geri bildirimi, çip seçimi |
| `standard` | 250ms | easeInOutCubic | sayfa içi geçiş, kart açılışı, sheet |
| `celebrate` | 600ms | spring | seri artışı, rozet/terfi, hedef tamamlama |

Kurallar: her etkileşimin `quick` geri bildirimi vardır (ilk günden — CLAUDE.md);
`celebrate` yalnız gerçek dönüm noktalarında (enflasyon = duyarsızlaşma);
`prefers-reduced-motion`/`disableAnimations` saygısı zorunlu; doğru/yanlış
renk değişimi animasyonla değil ANINDA verilir (öğrenme anında gecikme olmaz).

### 3.5 Icon sistemi — v2

- **Tek set:** Lucide (ISC, 1.56.0). Çizgi kalınlığı 2.
- **Boyutlar:** 16, 20, 24.
- **Kapsam:** iOS, Android ve web'in yeni ekranları için aynı set. Yeni ekranlarda Material
  ve Cupertino ikonları kullanılmaz.
- **Durum işareti:** UI ikonu çizgiseldir. Koç kartı içindeki durum işareti emojidir; ikisi
  aynı satırda kullanılmaz.

---

## 4. Component Library envanteri (öncelik sırasıyla)

> **v2 (Doc 48 Faz 3):** mobil Bugün ekranı için bileşen seti ve Figma ↔ Flutter eşlemesi
> Doc 48/03 §5'te. Değişen eşlemeler:
> - `CoachCard` (hero) → `TaskCard`
> - `SessionButton` → `ActionBar`
> - `GoalProgress` / `MasteryBar` → `ProgressBar`
> - `FocusSheet` → `AppSheet` + `SelectionList`
> - `StreakBadge` Bugün'den Performans'a iner.
>
> Aşağıdaki tablo kalan ekranların envanteri olarak geçerli.

Her bileşen: Flutter widget + web eşdeğeri, aynı token'lar, aynı ad. İlk dalga
(çekirdek 8 ekranı karşılar):

| # | Bileşen | Kullanıldığı yer | Not |
|---|---|---|---|
| 1 | `CoachCard` | Bugün, sonuçlar | varyant: hero / support; tip ikonlu, tek CTA |
| 2 | `SessionButton` | Bugün hero | "Bugün Çalış" — altında Odak ucu |
| 3 | `GoalProgress` | Bugün, sonuç | çubuk + `8/20` etiketi, celebrate animasyonu |
| 4 | `StreakBadge` | üst bar, sonuç | 🔥 + gün; risk halinde `warning` durumu |
| 5 | `OptionRow` | Seans, deneme | durumlar: idle/selected/correct/wrong/dim |
| 6 | `ExplanationBox` | Seans | açıklama + kaynak etiketi + madde köprüsü |
| 7 | `SourceTag` | soru her yerde | "2019 PAEM" — caption stili, hep görünür |
| 8 | `FocusSheet` | Odak seçici | radio listesi + kalıcılık notu |
| 9 | `SessionResultHeader` | Seans/deneme sonucu | display skor + alt etiket |
| 10 | `MasteryBar` | ders/konu satırı | % + renk eşiği (danger<40, warning<60) |
| 11 | `ListRowStat` | ders detay, performans | başlık + sağda pil/π değer |
| 12 | `HeatBar` | kanun detay | madde ısısı; girişsizde de çalışır |
| 13 | `ConquestGrid` | kanun detay | fetih hücreleri; dokunulabilir |
| 14 | `ArticleCard` | madde detay | resmî metin / AI özeti iki yüz |
| 15 | `EmptyState` | her liste | ikon + tek cümle + tek eylem (placeholder YASAK — boş durum da tasarlanır) |

İkinci dalga: `RankInsignia` (rütbe), `BadgeTile`, `WeeklyReportCard`,
`CountdownPill`, `SectionBreakdownTable`.

Kabul kriteri (her bileşen için): iki tema ✓ · boş/uzun içerik ✓ · a11y etiketi ✓
· dokunma hedefi ≥44pt ✓ · widget/story önizlemesi ✓ — biri eksikse bileşen "bitmedi".

---

## 5. Accessibility + responsive taban çizgisi

- Kontrast: metin ≥4.5:1, büyük metin/ikon ≥3:1 — iki temada da ölçülür.
- Her etkileşimli öğe: `Semantics` etiketi (Flutter) / görünür odak durumu (web). Okuma sırası anlam sırasıdır: sabit eylem çubuğu görev kartından hemen sonra okunur (Doc 48/03 §5).
- Renk tek başına anlam taşımaz: doğru/yanlış renk + ikon + metinle verilir
  (renk körü kullanıcı sınav kaybetmez).
- Dynamic Type / font ölçekleme **en büyük boyuta (AX5) kadar** kırılmadan (v2; metin kesilmez, sarar); responsive: 320pt
  telefon → tablet iki kolon (Bugün'de kartlar grid'e döner); web 360px → masaüstü.

---

## 6. Kod fazına giriş sırası (onay sonrası)

1. `design-tokens` tek kaynağı + Flutter `ThemeExtension` + web CSS vars eşitleme.
2. İlk dalga component library (15 bileşen) — her biri kabul kriterinden geçer.
3. Çekirdek ekranlar bileşenlerle: Bugün (durum makinesi genişletmesiyle birlikte)
   → Seans Oynatıcı/Sonuç → Odak → Ders/Kanun/Madde → Deneme sonucu.
4. Koç kartı metinleri bu dokümanın ton tablosundan; yeni metin gerektiren her
   kural PR'ında ton tablosuna satır eklenir (rehber yaşayan dokümandır).
