# Doc 49 / 11 — F7: Web yeni deri ("Nöbet" dili paemisyon.com'da) — KAPSAM VE PLAN

Tarih: 17 Ekim 2026. Durum: **onaylandı (17 Eki 2026, altı öneri olduğu gibi).** Dal: `claude/f7-web-derisi`.
Kaynaklar: `00-plan.md` F7 satırı ("`apps/web` token v3 ve bileşen diliyle — koç kartları,
seans oynatıcı, Bugün; 2–3 hafta; ölçüt: web ve mobil aynı dil"), Doc 27 (web UX mimarisi:
dört layout, omurga sistemleri, sayfa kararları, responsive, W1–W4), `03-f0-token-v3.md`
(web sözleşmesi: `globals.css` → `tokens.css` import + `@theme inline` köprüsü; fontlar
`next/font`), `05-f2-bilesen-galerisi.md` (Expo kiti — web eşdeğerinin referansı).

## 0. Amaç ve kapanış ölçütü

F7 **özellik eklemez**; web'in görsel dilini mobil 2.0 ile aynı kaynağa bağlar. Kapanış:
1. `apps/web` renk/tipografi/boşluk/köşe/hareket değerlerini YALNIZ `packages/tokens`'tan
   alır (ham hex ve eski palet 0 dosya; CI'da grep kapısı).
2. Web bileşen kiti Expo kitiyle **ad ve varyant düzeyinde** eşleşir (§2.2 tablo); her yeni
   ekran bu kitle yazılır.
3. Dört layout (L1 Kapı, L2 Çalışma alanı, L3 Odak, L4 Okuma) v3 diliyle, dört kırılımda
   (≥1440 / 1024 / 768 / <768) kırıksız; koyu birincil + açık tema; klavye odağı `focusRing`.
4. Doc 27 §5'in W1–W3 sayfaları (Bugün, Seans+Sonuç, Kütüphane, Mevzuat L4, Denemeler,
   Performans, Ben) ve W4 Kapı sayfaları (landing, kanun public, çıkmış sorular, rehberler,
   hesaplayıcı, fiyat) yeni deride; gerçek veriyle tarayıcıda doğrulanmış, ekran görüntüleri
   belgede.
5. Mevcut URL'ler, veri uçları ve SEO (ISR/statik ayrımı, şema markup, canonical) DEĞİŞMEZ.

## 1. Mevcut durum (17 Eki 2026 ölçümü, `apps/web/src`, 139 tsx)

| Katman | Durum |
|---|---|
| Kabuk | Doc 27 W1–W3 **yapılmış**: `(app)/(shell)` sidebar + üst şerit + koç rayı + ⌘K + `three-pane` (L4), `(dual)` "aynı URL iki derinlik", `(site)` üst nav/footer, `(auth)` tek kolon. Yapı kalır; deri değişir. |
| Token | İki palet yan yana: **v2 (Doc 26)** `--tk-*` + `@theme inline` köprüsü — 80 dosya `bg-surface/text-ink/border-line`; **4 ayrı vurgu** (`session/live/streak/atlas`) 42 dosyada — v3 "tek vurgu" kuralıyla çelişir. **Miras "Denemeler" paleti** (`navy/grey-bg/text-text/border-border`, `shadow-card`) 21 dosya, 14'ü `(site)` public sayfaları; `font-heading/font-body` (Rubik/Open Sans) 72 dosya. Ham hex 3 dosya. |
| Tema | `data-theme` + saat tabanlı "auto" (19–07 koyu); koyu tema yalnız `.tk-scope` alt ağaçlarında (miras sayfalar açıkta kalsın diye). v3 `tokens.css` koyu-birincil ve `data-theme="light|dark"` + sistem tercihi bekliyor. |
| Bileşen | `components/ui` 20 parça (Button 5 varyant, Card, OptionRow 5 durum, MasteryBar, HeatBar, ConquestGrid, CoachCard, GoalProgress, SegmentedControl, SelectableCard, PlanCard, SourceTag…) v2 adlarıyla; Expo kitiyle ad/varyant eşleşmesi yok. |
| Font | Rubik 700 + Open Sans; v3: Bricolage Grotesque (display/title/heading) + Instrument Sans (subhead/body/label/caption) — ikisi de Google Fonts'ta, `next/font` ile paketlenir. |
| Araç | Next 16 + Tailwind v4 + vitest; `launch.json` `web` (:3002) ve `web-e2e` (:3005 API). Worktree'den önizlemede Tailwind v4 cwd taraması ve Turbopack symlink notu (hafıza) geçerli. |

## 2. Kapsam — altı iş paketi

### 2.1 W-A Token köprüsü ve tema (temel; 2 gün)
- `globals.css`: `@import "../../../../packages/tokens/build/tokens.css"` (paket yolu
  `@paemisyon/tokens` alias'ı ile), `@theme inline` köprüsü v3 adlarına: `bg/surface/
  surface-alt/ink/ink-soft/ink-subtle/line/accent/accent-soft/accent-ink/on-accent/
  success(+soft/ink)/warning(+soft/ink)/danger(+soft/ink)/focus-ring`; `radius-control/card/
  pill/sheet`; `space-*`; `font-display/font-body`; tipografi rolleri utility olarak
  (`type-display … type-caption`, Expo `AppText variant` ile aynı sekiz ad).
- v2 `--tk-*` bloğu ve dört vurgu **kaldırılır**; geçiş süresince `session/live/streak/atlas`
  → `accent` (tek vurgu), `brand` → `accent` eşlemesi; miras "Denemeler" paleti ayrı
  `legacy.css` dosyasına taşınır ve W-F sonunda silinir.
- Tema: `tokens.css` seçicileriyle uyum — `data-theme` ThemeProvider'dan, **varsayılan sistem
  tercihi** (koyu birincil), kullanıcı seçimi kalıcı; saat tabanlı "auto" kalkar (§5 karar 1).
  `.tk-scope` sınırı kalkar: gövde v3 zeminini alır (miras sayfalar W-F'de aynı anda
  taşındığı için "beyaz kart üstünde açık metin" hatası oluşmaz; W-F bitene kadar `(site)`
  sayfaları `legacy.css` ile kendi açık zeminini zorlar).
- Fontlar `next/font/google` (Bricolage Grotesque 600/700, Instrument Sans 400/500/600),
  `font-display: swap`, CSS değişkenleri token ailesine bağlanır.
- CI kapısı: `apps/web` için `npm run lint` yanına `tokens:check` betiği — ham hex, `--tk-`,
  miras sınıflar ve dört vurgu adı için grep; `packages/tokens` kontrast testi zaten var.

### 2.2 W-B Bileşen kiti v3 (web) ve galeri (3 gün)
Expo kitiyle **aynı ad, aynı varyant**; web farkları yalnız etkileşim (hover, klavye, popover).

| Expo (05) | Web (`components/ui`) | Not |
|---|---|---|
| `AppText` 8 rol / 8 ton | `Text` + `type-*` utility | sunucu bileşeni; `as` prop |
| `Screen` | `Page` (başlık şeridi + içerik genişliği) | L2 içerik sütunu |
| `Card` surface/alt/accent | `Card` (mevcut, varyant eklenir) | gölge yok, `line` |
| `Button` primary/secondary/ghost/destructive, loading | `Button`/`ButtonLink` (atlas kalkar, danger→destructive) | 40/44/48 px boylar; klavye odağı |
| `IconButton` | `IconButton` | 44 px, zorunlu `aria-label` |
| `TextField` | `TextField` | form sayfaları (auth, ayarlar) |
| `Notice` info/success/warning/error | `Notice` | `*Soft` zemin + `*Ink` metin |
| `Badge` 5 ton | `Badge` (PremiumBadge, TurRozeti bunun üstüne) | metin zorunlu |
| `Chip` | `Chip` (SegmentedControl bunun üstüne) | filtreler, odak seçici |
| `ProgressBar`, `SegmentBar`, `WeekDots` | aynı adlar (GoalProgress/MasteryBar bunlara iner) | `role="progressbar"` |
| `ListRow` | `ListRow` | tablo satırı değil; tablo ayrı (`DataTable`, web'e özgü) |
| `StatTile` | `StatTile` | Performans metrik kartları |
| `Sheet` | `Dialog` + `Popover` (web karşılığı) | odak seçici popover (Doc 27 §3.2) |
| `EmptyState`, `Skeleton`, `ActionBar`, `SectionHeader` | aynı adlar | |
| `CountdownHeader`, `TaskHero`, `CourseTile` | aynı adlar (`features/`) | Bugün |
| `QuestionStem`, `QuestionOption` 6 durum | `QuestionStem`, `QuestionOption` (OptionRow → bu ad; `missed` durumu eklenir) | kaynak etiketi gösterilmez |
| `LegislationRow` | `LegislationRow` | Doc 29 §13 meta |
| — (web'e özgü) | `DataTable`, `Breadcrumb`, `CommandPalette`, `Sidebar`, `CoachRail`, `ThreePane`, `KeyHint` | Doc 27 §2 omurga |

Galeri: `/(app)/(shell)/tasarim` (yalnız `beta`/`admin` rolü; prod'da 404 yerine 403 değil,
rota gizli) — her bileşen bütün varyantlarıyla, koyu/açık anahtarı; göz testi burada.

### 2.3 W-C Kabuk (L1/L2/L3/L4 çerçeveleri) (3 gün)
- L2: sidebar 240/64 px (v3 yüzey tonu + `line`, aktif öğe `accentSoft`+`accentInk`), üst şerit
  (breadcrumb, ⌘K, seri, "devam et" pili), koç rayı 320 px (≤2 kart, kapanır, kalıcı), mobil
  (<768) alt sekme çubuğu — Expo TabBar ile aynı 5 bölge ve ikonlar.
- L3: ince şerit + ≤65ch soru alanı + yardımcı panel; sidebar/ray gizli; klavye kısayolları
  Doc 27 §2.2 (`1–5/A–E` beş şık — Beş Şık Kuralı; `F` favori, `M` madde, `Esc` çıkış).
- L4: `three-pane` yeniden derilenir (ağaç/makale/inspector; ≤1439 inspector overlay, ≤1023
  ağaç çekmece).
- L1: `site-header/site-footer` v3; üst nav public'te kalır (Doc 27 §0 revizyonu).
- ⌘K: görünüm v3; kapsam değişmez (eylemler · maddeler · konular · sayfalar).

### 2.4 W-D Bugün + Seans oynatıcı + Sonuç (F7 çekirdeği; 4 gün)
- Bugün (L2, 12 kolon): durum makinesi hero'su `TaskHero` + `ActionBar` (web'de kartın altında
  sabit değil, hero içinde), odak seçici `Popover`, destek kartları 2 kolon, sağ sütun
  `StatTile`/`WeekDots`/geri sayım/rütbe; "nöbet çizelgesi" şeridi. Koç kartı dili Doc 26.
- Seans oynatıcı (L3): `QuestionStem` + `QuestionOption` ×5, klavye, cevap sonrası açıklama +
  madde köprüsü (`M` → inspector), yardımcı panel: ilerleme listesi + not alanı
  (S1-C `PUT /me/questions/:id/note` ile **kalıcı** — tek ek veri bağı; ekran değil alan).
- Deneme oynatıcı varyantı: optik form paneli (soru haritası, "emin değilim" = S1-C `flagged`),
  kalan süre `warning` son 10 dk.
- Sonuç: skor `type-display`, koç yorumu, konu kırılımı mini tablo, "Bugün'e dön".
- Günün sorusu / çıkmış soru çalışma modu aynı `QuestionOption`'ı kullanır.

### 2.5 W-E Çalışma sayfaları yeniden deri (4 gün)
Kütüphane ana + ders detay (3 sekme), Mevzuat L4 (ısı/fetih/inspector), Yanlışlarım, Favoriler,
Denemeler (takvim + lobi + analiz tabloları `DataTable`), Performans (metrik `StatTile`, konu
haritası genişleyebilir tablo), Ben (profil/rozet/premium/ayarlar — ayarlara **tema seçici** ve
S1-D `dailyMinutes` alanı; yalnız mevcut alanların v3 görünümü). v2 sınıf → v3 sınıf dönüşümü
dosya dosya, elle (otomatik sed yok: dört vurgunun her kullanımı tek vurguya **anlamıyla**
indirgenir; durum renklerine metin/ikon eşlik eder).

### 2.6 W-F Kapı cilası (public) ve miras paletin emekliliği (3 gün)
Landing (çözülebilir hero `QuestionOption`), kanun/madde public, kanunlar listesi, PAEM çıkmış
sorular (liste/detay/quiz), rehberler `/paem` `/misyon`, hesaplayıcı, günün sorusu, lider
tablosu/sıralama, SSS/yasal/fiyat, auth sayfaları, e-posta abonelik sayfası. `legacy.css`,
Rubik/Open Sans ve icomoon ikon fontu silinir (ikonlar `lucide-react`, Expo ile aynı set).
Statik/ISR sınıflandırması korunur (hafıza: `(site)` layout `headers()` okumaz).

### 2.7 W-G Doğrulama ve kapanış (2 gün, her paketin sonunda kısmen)
- Göz testi: galeri + her sayfa koyu/açık, 4 kırılım (built-in browser `resize_window`),
  gerçek veriyle beta hesabı (kullanıcı kendisi giriş yapar).
- Erişilebilirlik: klavye ile tam tur (sidebar → Bugün → seans → sonuç), odak halkası, kontrast
  (token testi + axe taraması), `prefers-reduced-motion`.
- Performans: Lighthouse landing/kanun (LCP, CLS; font swap), bundle farkı.
- CI: lint + typecheck + vitest + `tokens:check` yeşil; Vercel preview; deploy = push main
  (onayla), deploy sonrası canlı tur ve ekran görüntüleri `docs/49/11`'e.
- Figma aynası: F3–F6'daki gibi kapanan ekranlar aktarılır (Figma bağlantısı yetki istiyor;
  yetki verilince, aktarım kodu geciktirmez).

## 3. Kapsam dışı (bilerek)
- Yeni özellik/ekran (SRS tekrar ekranı, listeler, plan, deneme serisi): F8.
- Admin paneli: S2. Web ödeme sağlayıcısı: ayrı iş. Soru metni araması (⌘K V2).
- Flutter: dokunulmaz.

## 4. Sıra ve süre
W-A → W-B → W-C → W-D → W-E → W-F → W-G; toplam ~21 iş günü (3 hafta üst sınır). Her paket
ayrı commit dizisi; **W-D sonunda ilk deploy adayı** (kabuk + Bugün + seans v3; `(site)`
miras paletle açık temada çalışmaya devam eder), W-F sonunda ikinci. Push öncesi onay, diğer
dalların bekleyen commit'lerine dokunulmaz.

## 5. Açık kararlar (onayla birlikte)
1. **Tema varsayılanı:** saat tabanlı "auto" (19–07 koyu) kalksın, **sistem tercihi + kalıcı
   kullanıcı seçimi** olsun (Expo ve `tokens.css` ile aynı). Öneri: evet.
2. **Miras "Denemeler" paleti:** tamamen emekli (tek dil) — Doc 18 §4 "sadakat planı" eski
   siteye görsel sadakatti, 2.0 ile kapanır. Öneri: evet, W-F'de.
3. **Dört vurgunun tek vurguya inmesi:** `session/live/streak/atlas` ayrımı kalkar; canlı
   deneme ve seri gibi durumlar rozet metni/ikonla ayrışır. Öneri: evet (v3 kuralı).
4. **İkon seti:** icomoon kalkar, `lucide-react` (Expo ile aynı). Öneri: evet.
5. **Galeri rotası** `/tasarim` yalnız beta/admin rolüne. Öneri: evet.
6. **Deploy ritmi:** W-D sonunda ara deploy mu (kullanıcılar iki dili geçici görür: app v3,
   public miras), yoksa tek seferde W-F sonunda mı? Öneri: **W-D sonunda ara deploy** —
   girişli kullanıcı (beta) yeni dili erken görür, public SEO sayfaları riske girmez.

## 6. Riskler
- 139 dosya, 80'i v2 sınıflı: dönüşüm mekanik görünse de her dosya anlam denetimi ister
  (tek vurgu). Azaltma: paket paket, galeriyle göz testi, grep kapısı.
- Global koyu zemin + miras açık sayfalar aynı anda yaşarsa okunmazlık (21 Eyl'de bildirilen
  hata). Azaltma: W-F bitene kadar `(site)` `legacy.css` ile kendi zeminini zorlar.
- Font değişimi CLS/LCP: `next/font` + `swap` + alt yazı tipi ölçüleri; Lighthouse kapısı.
- Vercel sessiz durma (hafıza): deploy sonrası canlı tur zorunlu.
