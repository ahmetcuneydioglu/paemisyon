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

### 3.1 Renk (semantic katman — ham ramp'ler AppColors'ta kalır)

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `brand` | #1B3A6B | #85B7EB | marka vurgusu, aktif tab, halka |
| `surface` | #FFFFFF | #15171C | kart zemini |
| `surfaceAlt` | #F4F6F9 | #1D2027 | sayfa zemini, zebra |
| `ink` | #1A1C22 | #ECEEF2 | birincil metin |
| `inkSoft` | #5B6070 | #9BA1AF | ikincil metin |
| `line` | #E4E7EC | #2C3038 | ayırıcı, kart çerçevesi |
| `success` | #2E7D5B | #5DCAA5 | doğru cevap, tamamlanan hedef |
| `warning` | #B98900 | #FAC775 | seri riski, süre uyarısı |
| `danger` | #C0392B | #E08578 | yanlış cevap, bozulan seri |
| `accentSession` | blue400 | blue200 | seans/CTA ailesi |
| `accentLive` | teal400 | teal200 | canlı deneme ailesi |
| `accentStreak` | amber600 | amber100 | seri/rozet ailesi |
| `accentAtlas` | purple600 | purple100 | mevzuat/atlas ailesi |

Kurallar: koyu tema **naif ters çevirme değil** (ramp kuralı: açıkta 50 zemin/600
metin, koyuda 800 zemin/100-200 metin — mevcut `app_colors.dart` kuralı aynen).
Semantic renkler accent sayılmaz; bir ekranda en fazla 1 accent ailesi baskın olur.

### 3.2 Tipografi

Aile — mobil: iOS'ta SF Pro (sistem), Android'de Inter; web: mevcut Rubik
(başlık) + Open Sans (gövde) yeni ekranlarda da kalır (marka sürekliliği; harf
genişliği yakın). Ölçek (mobil pt / web rem):

| Token | Boyut | Ağırlık | Kullanım |
|---|---|---|---|
| `display` | 32 | 800 | seans sonucu skoru, net |
| `title` | 22 | 700 | ekran başlığı |
| `heading` | 17 | 650 | kart başlığı, soru kökü |
| `body` | 15 | 400 | gövde, şık metni |
| `label` | 13 | 600 | buton, sekme, rozet |
| `caption` | 11 | 500 | kaynak etiketi, alt bilgi (UPPERCASE + %6 tracking) |

Sayılar her yerde `tabular-nums`. Satır genişliği (web) ≤ 65ch.

### 3.3 Spacing · radius · elevation

- **Spacing:** 4pt ızgara — `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48`
  (mevcut `app_spacing.dart` bu ölçeğe eşitlenir). Kural: kardeş aralıkları
  `gap`/`SizedBox` ile, tek tük margin ile değil.
- **Radius:** `sm 8` (giriş alanı, çip) · `md 12` (kart) · `lg 20` (hero kart, sheet)
  · `full` (pil/rozet). Tek ekranda en fazla 2 kademe.
- **Elevation:** 2 seviye yeter — `card` (mevcut `--shadow-card` yumuşaklığında) ve
  `overlay` (sheet/dialog). Gölge enflasyonu yok; koyu temada gölge yerine
  `surface`↑ kontrastı.

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

### 3.5 Icon sistemi

- Mobil: **SF Symbols hissiyatlı tek set** — Flutter'da `CupertinoIcons` temel,
  eksikler için tek stil dış set (Lucide). Karışık set yasak.
- Web (yeni ekranlar): aynı Lucide seti inline SVG. Icomoon yalnız miras alanında.
- Durum ikonları ton rehberindeki emoji eşleriyle karışmaz: UI ikonu çizgisel,
  koç kartı içindeki durum işareti emoji — ikisi aynı satırda kullanılmaz.

---

## 4. Component Library envanteri (öncelik sırasıyla)

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
- Her etkileşimli öğe: `Semantics` etiketi (Flutter) / görünür odak durumu (web).
- Renk tek başına anlam taşımaz: doğru/yanlış renk + ikon + metinle verilir
  (renk körü kullanıcı sınav kaybetmez).
- Dynamic Type / font ölçekleme 1.3×'e kadar kırılmadan; responsive: 320pt
  telefon → tablet iki kolon (Bugün'de kartlar grid'e döner); web 360px → masaüstü.

---

## 6. Kod fazına giriş sırası (onay sonrası)

1. `design-tokens` tek kaynağı + Flutter `ThemeExtension` + web CSS vars eşitleme.
2. İlk dalga component library (15 bileşen) — her biri kabul kriterinden geçer.
3. Çekirdek ekranlar bileşenlerle: Bugün (durum makinesi genişletmesiyle birlikte)
   → Seans Oynatıcı/Sonuç → Odak → Ders/Kanun/Madde → Deneme sonucu.
4. Koç kartı metinleri bu dokümanın ton tablosundan; yeni metin gerektiren her
   kural PR'ında ton tablosuna satır eklenir (rehber yaşayan dokümandır).
