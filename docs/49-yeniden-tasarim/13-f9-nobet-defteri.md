# F9 — "Nöbet defteri" derisi (plan, onay bekliyor)

Tarih: 20 Eki 2026. Kaynak: Figma "PaemisyonNew"
<https://www.figma.com/design/91lHqxSXl25Gz585TnXqfi/PaemisyonNew> — üç yön turu (A/B/C),
yerleşim turu (Büyük sayı / Poster / Nöbet çizelgesi) ve **nihai Bugün** (koyu `7:1442`,
açık `7:1523`, kaydırılmış `7:1604`, görev tamam `7:1949`, tam akış `7:1689`/`7:1819`).
Kullanıcı kararı: A / Nöbet defteri kimliği + "Büyük sayı × Nöbet çizelgesi" birleşimi.

## 0. Neden

Nöbet v3 (krem/terakota/adaçayı, Bricolage) işlevsel ama "göze hitap etmiyor"; rakip
uygulamalardan ayrışmıyor. Yeni yön: lacivert zemin, tek altın vurgu, serif (Lora) başlıklar,
editoryal boşluk; ekranın karakteri dev geri sayım rakamı ve 7 günlük nöbet çizelgesi.
Bilgi mimarisi (Doc 24/25) ve koç sözleşmesi DEĞİŞMEZ; değişen deri ve Bugün'ün yerleşimi.

## 1. Kimlik değişikliği (token v4)

Tek kaynak `packages/tokens/design-tokens.json` → css/ts/dart üretimi aynı. Değerler nihai
Figma ekranından okundu; uygulamada kontrast testine göre ince ayar yapılır.

| Token | Koyu (v3 → v4) | Açık (v3 → v4) | Not |
|---|---|---|---|
| `bg` | #17161A → **#121A26** | #F1EDE9 → **#FFFCF6** | lacivert gece / kağıt |
| `surface` | #221F25 → **#1E2B3C** | #FFFFFF → #FFFFFF | kart |
| `surfaceAlt` | #2C2830 → **#28374A** | #E8E2DC → **#EAE5DA** | rozet, ray, boş gün kutusu |
| `line` | #34303A → **#394657** | #DBD4CE → **#D9D7CF** | |
| `ink` | #F4EEE6 → **#F5F0E5** | #1F1C21 → **#1B293B** | açıkta metin lacivert |
| `inkSoft` | #A79F96 → **#BAC4D0** | #6A6269 → **#596371** | |
| `inkSubtle` | #908880 → **#8E9AAA** | #6F676E → **#6B7482** | AA kontrol edilecek |
| `accent` | #E3804F → **#E8B46C** | #B5532E → **#E8B46C** | altın; açıkta YALNIZ dolgu/çizgi |
| `accentSoft` | #3A281F → **#2E3447** | #F8E1D4 → **#F6E9D2** | |
| `accentInk` | #F2A47C → **#E8B46C** | #9C4827 → **#8B5E23** | açıkta altın metin yerine kahve |
| `onAccent` | #17161A → **#1B293B** | #FFFFFF → **#1B293B** | altın düğme üstü lacivert |
| `panel` (YENİ) | **#1E2B3C** | **#1B293B** | açık temada da lacivert kalan blok (geri sayım kartı) |
| `panelInk` (YENİ) | **#F5F0E5** | **#F5F0E5** | panel üstü metin |
| `panelSoft` (YENİ) | **#BAC4D0** | **#BAC4D0** | panel üstü ikincil metin |
| `success*` | adaçayı kalır, lacivertle uyumlu tonlanır | | tamamlanan gün ✓ kutusu `surfaceAlt`+`ink` |
| `warning*`, `danger*` | v3 değerleri korunur, kontrast yeniden test | | |

Tipografi: `display` ailesi **Lora** (Google Fonts, latin-ext; 400/500/600), gövde **Inter**
(400/500/600/700) — Instrument Sans emekli. Roller: `hero` (YENİ: Lora 500, 120/104, tabular,
tracking −0.03; SE'de 96) geri sayım rakamı; `display` 64 kalır (sonuç ekranı vb.); `title`
Lora 600 24/29; `heading` Lora 600 20/27; `subhead`/`body`/`bodySm`/`label` Inter. Marka
sözcüğü "paemisyon" küçük harf Lora 600 20 (metin, logo görseli değil). Köşe yarıçapları: kart
4 (sayı kartı, görev kartı — Figma'da keskin), kontrol 10, hap 999; `radius.card` 14 → **10**,
yeni `radius.panel` 4.

## 2. Bugün (mobil) yeni yerleşim — `app/(tabs)/index.tsx`

Yukarıdan aşağı (Figma `7:1442`):
1. Üst satır: "paemisyon" (Lora) · sağda "Seri · 3 gün".
2. "Merhaba, Lukas" (Lora 400 20).
3. **CountdownHero** (panel): `hero` rakam, altında "PAEM 2027'ye · 12 Haziran" · sağda
   "3/5 gün". Tarih yoksa "Tarih bekleniyor" ve rakam yerine "—" değil, "Hedef tarihini seç"
   bağlantısı (Doc 48 kuralı korunur).
4. **WeekStrip7**: Pzt–Paz 7 kutu; geçmiş aktif gün ✓ (`surfaceAlt`+`ink`), bugün altın
   dolgu (nokta; görev bitince ✓), gelecek boş (`line` kenarlı). Veri: `gamification.weekly`
   gün gün dizi gerekir → API `weekly.days: ('done'|'missed'|'today'|'future')[7]` eklenir
   (uygulama günü TR 04:00, Pzt başlangıçlı).
5. Günlük hedef satırı: sol altın çizgi + "Bugünkü hedef 2/40 soru".
6. **TaskHero** düğmesiz varyant (`compact`): etiket, Lora başlık, gerekçe. Eylem yalnız alt
   çubukta. `done` türünde "Bugünkü görev tamam · yarın görüşürüz" + alt çubuk ikincil
   "Ekstra tur". `resume`/`exam`/`comeback` türleri mevcut davranışı korur (kartta düğme
   yok, alt çubuk etiketi sunucudan).
7. Kaydırınca: hero 7:1604'teki gibi ince başlığa çöker ("184 gün · PAEM 2027"), Reanimated
   ile; FlatList/ScrollView `onScroll` eşik 160 pt.
8. Akış: "Yanlışlarını temizle" satırı → **PlanShiftList** (haftalık plan kalemleri, sol altın
   dikey çizgi, kalan dk, ince ilerleme; `PlanWeekCard` yerine Bugün'de bu) → "Hazırlık · En
   zayıf 3 konu" çizgili liste → "Derslerin" → kapanış "Az ama her gün." (Lora 400 18).
9. Sekme çubuğu: aynı beş sekme; **Ben ikonu lucide `user`** (Figma'da bozuk kalan ikon
   kodda düzeltilir).

## 3. Aşamalar

| Aşama | İş | Kabul |
|---|---|---|
| F9-A Token v4 | JSON v4 (§1), `kontrast.test.mjs` çiftleri (altın açıkta metin DEĞİL; `accentInk` açık #8B5E23 bg/surface üstünde ≥4.5; `panelInk`/`panelSoft` panel üstünde), build css/ts/dart; web `globals.css` ve `layout.tsx` fontları (next/font Lora + Inter); Expo `_layout.tsx` fontları (`@expo-google-fonts/lora`, `/inter`), `tokens.ts` aileleri | kontrast testi yeşil; üç hedef build; web ve app açılıyor |
| F9-B Bugün yeniden | §2 bileşenleri (`CountdownHero`, `WeekStrip7`, `TaskHero compact`, `PlanShiftList`, çöken başlık), API `weekly.days`, Ben ikonu | iPhone SE / 17 / 17 Pro Max koyu+açık; görev tamam ve dönüş durumları; beta hesabında tur |
| F9-C Diğer mobil ekranlar | Kit üzerinden otomatik palet/font geçişi; her sekme + Planım, Seans, Sonuç, Onboarding, Paywall göz testi; altın vurgunun fazla olduğu yerler sadeleştirilir (tek vurgu kuralı) | sekme başına açık/koyu ekran görüntüsü, kusur listesi kapalı |
| F9-D Web | CSS token'lar otomatik; `/bugun` hero + çizelge yeni yerleşime; public sayfalar ve kit galerisi kontrol; axe + Lighthouse | axe 0, Lighthouse ≥ 95, canlı doğrulama |
| F9-E Kapanış | Figma Nöbet dosyası değişken/stil güncellemesi (betikle), docs, beta build (kullanıcı koşar) | Figma = kod, TestFlight'ta yeni deri |

Sıra: A → B → D (web Bugün) → C → E. Her aşama ayrı commit, A+B birlikte ara deploy (web
token değişimi B'den bağımsız yayınlanmaz — hero yoksa yarım deri olur).

## 4. Riskler ve kararlar

- **Altın metin açıkta okunmaz** (#E8B46C / #FFFCF6 ≈ 1.9:1): açık temada altın yalnız dolgu,
  çizgi ve düğme zemini; metin `accentInk` kahve. Kontrast testi bunu zorlar.
- **SE'de 120 pt rakam**: genişliğe göre ölçek (96) ve tabular rakam; "1000+ gün" durumu için
  3 hane tavanı (999+).
- **Lora Türkçe**: latin-ext var (ğ ş İ ı); İ/ı dar ekranda kontrol.
- **Tek vurgu**: altın hem accent hem "bugün" kutusu; success adaçayı yalnız tamamlanan
  sonuçlarda. Terakota tamamen emekli.
- **Android**: aynı token'lar; durum çubuğu rengi `bg`.
- Açık karar (kullanıcı): Lora başlık ağırlığı 600 mü 500 mü (Figma 600; 500 daha "defter").

## 5. İlerleme

- **Onay (20 Eki 2026):** plan onaylandı; Lora başlık ağırlığı 600.
- **F9-A Token v4 (20 Eki 2026):** `design-tokens.json` 4.0.0 — kimlik "Nöbet defteri", §1
  paleti (+ `panel`/`panelInk`/`panelSoft`), kontrast çiftleri yeniden (altın metin çifti yok;
  `accentInk`, `panel*`, `accent/panel` eklendi), aileler Lora 400/500/600 + Inter
  400/500/600/700, roller `hero` (120/108, test 0,9 kuralı: Figma'daki 136/113 oranı
  test tarafından reddedildi) ve `brand`; `display` 500, `title` 24/29 600, `heading` 20/27,
  `stat` 600; `radius.card` 10, `radius.panel` 4. Build css/ts/dart yenilendi, kontrast testi
  47/47. **Web:** `layout.tsx` next/font Lora+Inter (`--font-lora`/`--font-inter`),
  `globals.css` aile bağları + `type-hero`/`type-brand` yardımcıları + `--radius-panel`;
  tsc 0, tokens-check 209/0, vitest 80/80; :3012'de ana sayfa lacivert zemin, altın vurgu,
  Lora başlık doğrulandı. **Expo:** `@expo-google-fonts/lora` + `inter` (eski iki paket
  kaldırıldı; kilit docker node:22'de yenilendi, @emnapi girdisi yerinde), `_layout.tsx`
  yükleme listesi, `tokens.ts` aile haritası (display 400/500/600), mevzuat ekranındaki sabit
  font adı haritaya bağlandı; tsc/eslint temiz; SE simülatöründe giriş ekranı Lora başlık +
  Inter gövde + kağıt zemin ile açıldı. Push yok — plan gereği A, B ile birlikte yayınlanır.
