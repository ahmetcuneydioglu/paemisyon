# Doc 48 / Faz 3 — Tasarım Sistemi v2 (mobil)

> Durum: **onaylandı** (14 Eki 2026; vurgu rengi #1F55C0 / #8DB6F7 kullanıcı seçimi). Kanonik metin Doc 26 §3–§5'e işlendi; bu dosya gerekçe ve ölçüm kaydıdır.
> Figma: https://www.figma.com/design/qHrLLOXtJSIqpKxTx2FrYi
> Sayfalar: "Tasarım sistemi" (değişkenler, stiller, ikonlar, 18 bileşen) ve
> "Hi-fi — Bugün" (B1 açık/koyu, B2 koyu, O1 ile O3 koyu).
> Kod kaynağı: `packages/tokens/design-tokens.json` → `v2`. Eklemeli bir değişiklik:
> v1 anahtarları web için aynen korunuyor.
> Bu doküman Doc 26'yı **revize eder** (§8). Doc 26'nın ton rehberi (§1) aynen geçerli.

## 0. v1'den ne değişti, neden

| v1 (Doc 26) | v2 | Neden |
|---|---|---|
| 4 vurgu ailesi (session/live/streak/atlas) + brand | **Tek vurgu** (`accent`) + anlamsal renkler | Mevcut anasayfada 4 rakip renk vardı. Kullanıcı talebi: tek vurgu. |
| Açık temada CTA beyaz / `#378ADD` (**3,59:1**, AA altı) | `onAccent` / `accent` **6,73:1** | Ölçüldü (§1). |
| 6 basamaklı ölçek; `caption` BÜYÜK HARF + %6 izleme | iOS Dynamic Type'ın 11 basamağı; büyük harf + izleme kalıbı yok | Ekran görüntülerindeki "havalı" metin |
| `ThemeData(textTheme:)` yalnız 6 rol; kalanlar M3'ten **+0,25…+0,5** harf aralığı devralıyor | 15 rolün **hepsi** açık tanımlı, izleme bu tablodan | Kök neden: M3 `englishLike2021` merge'i |
| Dynamic Type 1,3×'e kadar | **En büyük boyuta kadar** (AX5), kesilme yok | Kullanıcı talebi |
| CupertinoIcons + Lucide (iki set) | **Yalnız Lucide** | Tek set kuralı; Android'de de aynı |

## 1. Renk (Figma "Renk" koleksiyonu, modlar Açık/Koyu)

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `bg` | #F3F5F8 | #0E1014 | Sayfa zemini |
| `surface` | #FFFFFF | #171A20 | Kart |
| `surfaceSunken` | #EEF1F5 | #1F232B | Kart içi gömülü satır |
| `ink` | #141821 | #ECEEF2 | Birincil metin ve ikon |
| `inkSecondary` | #4A5161 | #B4BAC6 | Gerekçe, alt satır |
| `inkTertiary` | #626A79 | #9097A5 | Alt yazı, pasif |
| `line` | #E2E6EC | #2A2F38 | Ayırıcı (dekoratif) |
| `lineStrong` | #8A919E | #6B7280 | Etkileşimli kontrol çerçevesi |
| `track` | #E3E7ED | #2A2F38 | İlerleme izi |
| `accent` | #1F55C0 | #8DB6F7 | **Tek vurgu:** birincil eylem, bağlantı, seçim |
| `onAccent` | #FFFFFF | #0B1426 | Vurgu üstündeki metin |
| `accentSoft` | #E8EFFC | #1B2A45 | Rozet, seçili ikon kutusu |
| `success` / `successSoft` | #1C7A50 / #E5F4EC | #5FD3A6 / #123128 | Hedef tamam, doğru |
| `warning` / `warningSoft` | #8A5A00 / #FCF1DC | #F2C46B / #33280F | Zayıf konu, çevrimdışı |
| `danger` / `dangerSoft` | #B42318 / #FDECEA | #F28B80 / #3B1A17 | Yanlış cevap |

**Kontrast ölçümü.** Betikle iki temada 44 çift ölçüldü, hepsi AA. En düşük değerler:
- `inkTertiary` / `surfaceSunken`: 4,81 (açık tema)
- `success` / `successSoft`: 4,68 (açık tema)
- `lineStrong` / `surface`: 3,17 (kontrol çerçevesi, eşik 3)

**Kurallar**
1. Bir ekranda tek vurgu rengi bulunur. Anlamsal renkler yalnız durum bildirir, süs değildir.
2. Renk tek başına anlam taşımaz. "Zayıf" hem uyarı rengiyle hem kelimeyle; seçim hem
   radyoyla hem Semantics ile verilir.
3. Koyu tema bir ters çevirme değildir. Koyuda gölge yoktur, katman farkı `surface` ile `bg`
   arasındaki farktan gelir.
4. v1'deki `accentLive`, `accentStreak` ve `accentAtlas` mobilde emekli olur. Kategori
   ayrımı gerekirse ikon ve metinle yapılır.

## 2. Tipografi

Font ailesi platforma göre değişir:
- **iOS:** sistem fontu (SF Pro).
- **Android:** Inter.
- **Figma:** Inter. SF Pro bu ortamda render edilemiyor (`hasMissingFont`), bu yüzden
  Figma'da Inter kullanılıyor; Android'i birebir, iOS'u çok yakın gösterir.

| Token | Flutter rolü | Boyut / satır | Ağırlık | İzleme iOS (pt) | İzleme Android/Figma (px) | Kullanım |
|---|---|---|---|---|---|---|
| largeTitle | displaySmall | 34/41 | 700 | +0,37 | −0,74 | Selam |
| title1 | headlineLarge | 28/34 | 700 | +0,36 | −0,59 | Sonuç başlığı |
| title2 | headlineMedium | 22/28 | 700 | +0,35 | −0,40 | Görev kartı, sheet başlığı |
| title3 | headlineSmall | 20/25 | 600 | +0,38 | −0,33 | Bölüm başlığı |
| headline | titleLarge | 17/22 | 600 | −0,41 | −0,22 | Satır başlığı, düğme |
| body | bodyLarge | 17/22 | 400 | −0,41 | −0,22 | Gövde, soru kökü |
| callout | titleMedium | 16/21 | 400 / 600 | −0,32 | −0,18 | Ders ve konu adı |
| subheadline | bodyMedium | 15/20 | 400 / 600 | −0,24 | −0,13 | Gerekçe; pil, eylem metni |
| footnote | bodySmall | 13/18 | 400 / 600 | −0,08 | −0,04 | Alt yazı, ilerleme etiketi |
| caption1 | labelMedium | 12/16 | 500 | 0 | +0,01 | Rozet |
| caption2 | labelSmall | 11/13 | 500 | +0,07 | +0,05 | Sekme etiketi |

**İzleme değerlerinin kaynağı**
- iOS değerleri Apple HIG Dynamic Type tablosundan alındı. Flutter'ın Cupertino kaynağıyla
  örtüşüyor: 17pt −0,41, 15pt −0,23, 34pt +0,38.
- Android/Figma değerleri Inter'in dinamik metrik formülünden hesaplandı:
  `em = −0,0223 + 0,185·e^(−0,1745·px)`.
- `displayLarge`, `displayMedium` ve `labelLarge` da açıkça tanımlanır:
  - display: skor için 48/40, 700
  - labelLarge: düğme, 17/22, 600

**Dynamic Type kuralları**
1. `textScaler` kısılmaz.
2. Metin kesilmez, sarar. Pil satırı alt satıra kayar.
3. Eylem çubuğu, ölçek 1,35'in üstüne çıkınca dikey yığına döner: odak düğmesi üstte tam
   genişlik, birincil düğme altta.
4. Görev kartı ve satırlar yükseklik sabitlemez.

## 3. Ölçüler (Figma "Ölçü" koleksiyonu)

| Grup | Değerler |
|---|---|
| Boşluk | xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 |
| Yarıçap | sm 8 (pil iç öğe) · md 12 (düğme, satır kutusu) · lg 16 (kart, liste kartı) · xl 20 (görev kartı, sheet) · full |
| Boyut | dokunma ≥ 44 · kontrol 52 · eylem çubuğu 76 · sekme çubuğu 83 |
| Gölge | `Elevation/Card` (yalnız açık tema) · `Elevation/Overlay` (sheet) |

Ekran ritmi:
- Yatay kenar boşluğu lg (16).
- Bloklar arası xl (24).
- Blok içi md (12).
- Kart dolgusu lg (16).

## 4. İkon

- **Set:** Lucide 1.56.0 (ISC). Çizgi kalınlığı 2.
- **Boyutlar:** 16 (satır içi), 20 (satır), 24 (sekme).
- **Figma:** 23 ikon bileşeni var. Her biri tek `Vector` katmanına düzleştirildi; bu sayede
  renk ayarı ikon değiştirildiğinde korunur.
- **Flutter:** paket seçimi Faz 4'te yapılacak. Lucide'ın bakımlı bir Flutter paketi ya da
  SVG + `flutter_svg`.
- **Kural:** yeni ekranlarda Material ikonu kullanılmaz.

## 5. Bileşenler (Figma ↔ Flutter)

Hepsi değişkenlere bağlı. Açık/koyu tema değişken moduyla çözülür.

| Figma | Flutter (öneri) | API (özellikler / varyantlar) | Yerine geçtiği |
|---|---|---|---|
| Button | `AppButton` | `label`, `style: primary/secondary/tertiary`, `enabled`, `icon?` · yükseklik 52 | `PrimaryButton`, `SessionButton` |
| Pill | `StatusPill` | `label`, `icon?`, `dashed` (eksik bilgi daveti) | `_ExamCountdownPill` |
| Haftalık gün | `WeeklyActivityPill` | `activeDays`, `goalDays` · metin anlamı taşır | `StreakBadge` + nokta satırı (D1) |
| Bölüm başlığı | `SectionHeader` | `title`, `actionLabel?`, `onAction` | `_SectionHeader` |
| İlerleme çubuğu | `ProgressBar` | `value 0..1`, `tone: accent/success` | `GoalProgress`, `MasteryBar`, `AnimatedFillBar` |
| İlerleme halkası | `ProgressRing` | `value`, `size`, `label` | `AnimatedGoalRing` |
| Bant | `StatusBanner` | `tone: warning/info`, `message`, `icon` | `OfflineBanner` (görsel) |
| Ders satırı | `CourseRow` | `name`, `accuracy`, `caption`, `state: normal/weak/sparse`, `showChevron` | Odak drill-down satırı |
| Konu satırı | `TopicRow` / `TopicChip` | `name`, `meta`, `actionLabel` ("10 soru") | `weak_topic` kartı |
| Seçim satırı | `SelectionRow` + `SelectionList` | `title`, `subtitle`, `selected`, `badge?`, `icon` · tek kontrol tipi | `focus_sheet.dart` satırları |
| İkincil öneri | `SuggestionRow` | `title`, `subtitle`, `actionLabel`, `icon` | koç destek kartları (D4) |
| Odak düğmesi | `FocusButton` | `value` · ayar, başlatıcı değil | "Odak: Koç seçiyor" chip'i |
| Görev kartı | `TaskCard` | `title`, `reason`, `progress?` (`label`, `value`), `link?`, `suggestion?` | `_TodayHero`, `_ActiveSessionCard` |
| Eylem çubuğu | `ActionBar` | `primary: AppButton`, `focus?: FocusButton` · sabit, sekme çubuğu üstü | hero CTA |
| Alt sayfa başlığı + kabuk | `AppSheet` | `title`, `subtitle`, sayfa içi yığın (`Navigator`), sabit alt eylem alanı | `showFocusSheet` + `showFocusDrillDown` |
| Madde satırı | `ArticleRow` | `overline?`, `article` ("CMK md. 91 — Gözaltı"), `law` (tam ad), `icon` | `MevzuatHeroCard` |
| Sekme çubuğu | `AppTabBar` | 5 sekme, `selectedIndex` | M3 `NavigationBar` |

Her bileşen için kabul ölçütü (Doc 26 §4'ten devralındı):
- iki tema;
- uzun ve boş içerik;
- Semantics etiketi;
- dokunma hedefi ≥ 44;
- en büyük Dynamic Type'ta kırılmama;
- bileşen galerisinde önizleme + golden test (Faz 5).

### Semantics örnekleri (VoiceOver)

| Bileşen | Okunacak metin |
|---|---|
| TaskCard | "Bugünün turu. Ağırlık Anayasa'da, iki haftadır yüzde 48. Bugün 0 / 20 soru." |
| ActionBar birincil | "Başla, 10 soru, düğme" |
| ActionBar odak | "Odak: Koç seçiyor. Değiştirmek için iki kez dokun." |
| WeeklyActivityPill | "Bu hafta 2 gün çalıştın, hedef 5 gün." |
| TopicRow | "Temel Haklar ve Ödevler, Anayasa, yüzde 38 doğru. 10 soruluk tur başlat, düğme." |

**Okuma sırası:** durum satırı → görev kartı → **eylem çubuğu** → hazırlık → mevzuat.
- Eylem çubuğu görsel olarak altta durur ama anlamca görev kartının devamıdır.
- Flutter'da `Semantics(sortKey: OrdinalSortKey)` ile bu sıra kurulur.

## 6. Hareket

v1 süreleri geçerli: quick 150, standard 250, celebrate 600 ms. Bu ekrana özgü kurallar:
- **Eylem çubuğu etiketi değişince** (odak seçimi, yarım tur): `quick` çapraz geçiş. Düğme
  boyutu zıplamaz.
- **İlerleme çubuğu:** `standard`.
- **Hedef tamamlanınca:** `celebrate` ve haptik (`AppHaptics.celebrate`). Yalnız gerçek dönüm
  noktasında.
- **Sheet içi iniş** (ders → konu): `standard`, yatay kayma. Geri hareketi iOS kenar
  kaydırmasıyla da çalışır.
- **Azaltılmış hareket** açıksa geçişler sönümlenir, kutlama statik gösterilir.

## 7. Bilinçli olarak dışarıda bırakılanlar

- **iOS 26+ "Liquid Glass" sekme çubuğu.** Flutter yerel cam efektini birebir üretemiyor.
  Opak `AppTabBar` bilinçli bir seçim; Flutter tarafında olgun bir çözüm çıkınca yeniden
  değerlendirilir.
- **Code Connect eşlemesi.** Flutter bileşenleri Faz 4'te yazılınca yapılabilir.
- **Web'in v2'ye geçişi.** Ayrı iş. `design-tokens.json` v1 web için korunuyor.

## 8. Doc 26'ya işlenecek değişiklikler (onaylanırsa)

| Bölüm | Değişiklik |
|---|---|
| §3.1 Renk | v2 tablosu. 4 vurgu ailesi emekli; "tek vurgu + anlamsal" kuralı. |
| §3.2 Tipografi | 11 basamak, rol eşlemesi, platform izleme tablosu. `caption` büyük harf kuralı kalkar. |
| §3.3 Ölçüler | Yarıçap ölçeği sm 8 / md 12 / lg 16 / xl 20; boyut token'ları. |
| §3.5 İkon | Yalnız Lucide. |
| §4 Bileşenler | §5'teki eşleme tablosu. `CoachCard` → `TaskCard`, `SessionButton` → `ActionBar`, `StreakBadge` → Performans. |
| §5 Erişilebilirlik | Dynamic Type 1,3× yerine en büyük boyut. VoiceOver okuma sırası kuralı. |
