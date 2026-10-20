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
- **F9-B Bugün yeniden (20 Eki 2026):** **API:** `coach/hafta-gunleri.ts` (saf, 3 spec) —
  `gamification.weekly.days` Pzt→Paz `done|missed|today|future` (DailyUsage günleri, uygulama
  günü TR 04:00; `HomeRaw.weekDays` üzerinden brief'e, kurallara girmez); `PlanBrief.items`
  (bu haftanın kompakt kalemleri — vardiya listesi için); `GUN_MS` dışa açıldı; 452 test.
  **Expo:** `CountdownHero` (panel, `hero` rolü, SE'de 96 pt; Lora üst çıkıntısı için satır
  1,04×boy — 0,9'da rakamın tepesi kırpılıyordu; tarih yoksa "Tarih bekleniyor" + Ayarlar
  bağlantısı), `WeekStrip7` (7 kutu, 44 pt; ✓ / altın bugün / boş), günlük hedef satırı,
  `TaskHero compact` (meta rozeti yok; eylem alt çubukta), `PlanShiftList` (sol altın çizgi,
  kalan dk / Tamam, ince ilerleme; davet hâli korunur), Hazırlık yalnız zayıf konu varken
  çizgili liste, "Derslerin" + "Az ama her gün.", üstte `brand` sözcüğü + "Seri · N gün",
  serif selam; kaydırınca hero RN `Animated` ile ince başlığa çöker ("235 gün · PAEM",
  150→230 pt); `AppText` tonları `panelInk`/`panelSoft`; eski sunucu için `yedekGunler`
  türetimi. Ben sekmesi ikonu kodda zaten lucide `user` (bozukluk yalnız Figma'daydı).
  **Doğrulama:** tsc/eslint temiz; iPhone 17 ve SE, açık+koyu, geçici hesap (plan 26 hafta,
  5→15 cevap): `first` ve `start` durumları, ikincil "9 çözülmemiş yanlış · Tekrar et",
  çöken başlık, vardiya listesi 2 kalem, çizelge Pzt ✓. `done` durumu ücretsiz günlük kota
  (15) yüzünden üretilemedi — görsel P-D turunda beta hesabında bakılacak. Push yok.
- **F9-D Web Bugün (20 Eki 2026):** `components/bugun/CountdownHero` (panel, `type-hero`
  clamp 72–120 px, tarih yoksa "Tarih bekleniyor" + `/profil`), `WeekStrip7`, `HeroCollapse`
  (istemci; IntersectionObserver, afiş çıkınca `top-14` yapışkan ince satır "235 gün · PAEM" —
  kabuk başlığının altına), `components/plan/PlanShiftList` (vardiya listesi; davet hâli
  korunur), `type-brand` marka sözcüğü + serif selam; sol kolon: afiş → çizelge → hedef satırı
  → görev kartı (başlık `type-title` Lora, CTA sunucu etiketi + Odak) → plan → koç kartları;
  eski "son 7 gün" kartı ve `/progress/activity` çağrısı kalktı (çizelge `weekly.days`;
  eski sunucu için `yedekGunler`). Tipler: `CoachBrief.exam`, `weekly.days`,
  `PlanBrief.items`, `WeekDayState`. Tailwind: `panel`/`panel-ink`/`panel-soft` renkleri,
  `rounded-panel`. Mobilde mağaza rozetleri `md:` altında gizli, marka satırı tek satır.
  **Doğrulama:** tsc 0, eslint 0, tokens-check 213/0, vitest 80/80; panelde geçici hesapla
  masaüstü + 375 px, açık + koyu; çöken başlık çalışıyor; `/kanunlar`, `/paem-cikmis-sorular`,
  `/kanun/2559` yeni paletle sorunsuz. Kit galerisi `/tasarim` admin/beta rolü istiyor —
  geçici hesapla açılamadı (canlıda kullanıcı hesabıyla bakılacak). **axe (WCAG 2.1 AA,
  axe-core 4.10.2 enjekte):** `/bugun` koyu 0, `/planim` koyu 0; açıkta tek bulgu `KeyHint`
  (⌘K) `inkSubtle`/`surfaceAlt` 3,76 → `inkSoft` yapıldı. Lighthouse canlıda (dev sunucu
  temsilî değil) deploy sonrası koşulacak. Push yok — A+B+D birlikte.
- **Ara deploy 1 (20 Eki 2026, 02:45 TR):** `claude/f9-defter-derisi` tek push'la `origin/main`'e
  (58500d1 → 3b13318: plan + A + B + D + F8 docs). CI yeşil; Vercel READY (fra1, ~40 sn);
  Railway yeni brief alanlarını veriyor. **Canlı (Lukas, Chrome):** `/bugun` yeni deri — 235
  gün afişi, çizelge (Pzt ✓), 1/40 hedef, görev kartı, 4 kalemli vardiya listesi, çöken başlık;
  `/planim` (hafta 2/26, Pazartesi cron'u 1. haftayı kapatmış) ve `/kutuphane` yeni paletle.
  **Lighthouse (canlı, mobil):** landing 100/100/100/100, LCP 1,5 s, CLS 0 (F7'de 95–97);
  `/kanun/5302` 100/100/100/100, LCP 1,9 s; `/giris` perf 89 (LCP 3,7 s), SEO 66 (giriş sayfası
  noindex — beklenen). Landing'de `label-content-name-mismatch` tek uyarı (F7'den kalma,
  mağaza rozeti; F9-C web geçişinde bakılacak). Not: Kütüphane kapı kartları 1280 px'te dört
  kolon dar kalıyor (F9-C). Mobil yeni deri için beta build gerekli (F9-E, kullanıcı koşar).
- **F9-C Diğer mobil ekranlar (20 Eki 2026):** iPhone 17 (açık) + SE (koyu), yerel API,
  geçici hesap. Gezilen: Bugün, Kütüphane, Mevzuat listesi, Denemeler, Performans, Liderlik,
  Ben, Ayarlar, Planım, Seans (soru + geri bildirim), Paywall; onboarding tamamlanmış
  hesapta Bugün'e döner. Palet/font geçişi kit üzerinden otomatik; iki kusur bulundu ve
  düzeltildi: (1) **Altın metin açık temada okunmuyordu** (paywall fiyatı, liderlik sırası,
  deneme sonucu, tanıtım, giriş etiketi — `tone="accent"`): `AppText` `accent` tonu artık
  `accentInk`'e çözülür (koyuda altın, açıkta kahve; §4 kuralı kodda); ham altın için yeni
  `gold` tonu yalnız panel üstünde (`CountdownHero`). (2) **StatTile etiketi** dar kutuda
  ortadan kırılıyordu ("DOĞRULU K", SE Performans): tek satır + `adjustsFontSizeToFit`
  (%85). Ayrıca `Button` ghost ve `ProgressBar` zaten `accentInk`/dolgu kullanıyor — dokunulmadı.
  Not: dev client bir kez asıldı (deep link ve dokunuş yanıtsız), `simctl terminate` ile
  yeniden açıldı — uygulama kusuru değil. Kalan: Sonuç ve deneme-sonuç ekranları gerçek
  turla görülmedi (altın rakam düzeltmesi tip düzeyinde geçerli), web Kütüphane kapı
  kartları 1280 px'te dar (F9-E'de), mobil beta build (kullanıcı koşar). Push yok.
