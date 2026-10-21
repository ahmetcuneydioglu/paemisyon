# F10 — Seans oynatıcı (soru çözme ekranı) yeni deri (plan, onaylı 22 Eki 2026)

Tarih: 22 Eki 2026. Önceki oturumda (yerel, 21:50) istenmiş; haftalık sınır yüzünden
cevapsız kalmış, buluttan devam edildi. Referans: GYSROTA'nın Figma ile yapılmış soru
çözüm ekranı (kullanıcı görseli, 22 Eki — §0a'da çözümlendi). Hedef: Figma
"PaemisyonNew" (`91lHqxSXl25Gz585TnXqfi`) dosyasında v4 "Nöbet defteri" diliyle Seans
ekranı çizmek; sonra Expo `app/seans.tsx` ve web `components/session/session-player.tsx`
bu çizime göre yenilenir. Bilgi mimarisi (Doc 25 Karar 1: TEK çalışma odası, 2 dokunuş)
ve sunucu sözleşmesi DEĞİŞMEZ; değişen deri ve yerleşim.

## 0. Bugünkü ekran (kod)

- **Mobil** `apps/app/app/seans.tsx`: üst satır X + `SegmentBar` (en çok 20 dilim) + "3/10";
  gövde `QuestionStem` + 5 `QuestionOption` (A–E); cevap sonrası aynı kartta
  Doğru/Yanlış etiketi, açıklama, yasal dayanak, "Maddeyi oku · md. N" (Sheet), not alanı,
  favori; altta yapışkan "Sonraki soru / Turu bitir". Deneme modu: sayaç, Bitir, bayrak,
  optik form ızgarası (Sheet), önceki/sonraki.
- **Web** `session-player.tsx`: L3 Odak çerçevesi (kabuk yok), klavye 1-4/Enter/Esc,
  sağ panelde "M ile aç" madde, F favori, AI koç (yanlışta çeldirici analizi), hata bildir.
- Sorun: v3'ten kalan "liste + kart" dizilişi; Bugün'deki editoryal karakter (Lora,
  panel, altın tek vurgu, boşluk) seansa taşınmadı; ilerleme, geri bildirim ve açıklama
  hiyerarşisi düz.

## 0a. GYSROTA görselinden alınanlar / alınmayanlar

Görsel (koyu, yeşil vurgu, "1 sayılı CBK" alıştırması, "..." menüsü açık):
- **Alınır:** başlıkta kapsam adı (ders/mevzuat) + "Soru 2 / 10 · ✓0 ✗1" sayaçları;
  soru üstünde meta satırı (zorluk + madde bağı "M. 30/A ›"); şık harfi kare kutuda;
  alt çubukta **Önceki**; "..." menüsü (Paylaş, Bildir); yazı boyu "Aa".
- **Alınmaz:** sağ üstte dört ikon (Aa, favori, paylaş, ...) — tek vurgu/boşluk kuralına
  aykırı, hepsi "..." altına ve geri bildirim araç satırına iner; sürekli ince ilerleme
  çubuğu yerine 10 dilimli çizelge; iOS sistem action sheet yerine kit `Sheet`.
- **Veri gereksinimi (API, F10-0):** `SessionQuestion`'a `difficulty` (DB'de var,
  sözleşmede yok) ve cevap ÖNCESİ madde bağı (`relatedArticleRef: {lawSlug, no}` —
  metin yok, yalnız referans; bugün yalnız feedback'te geliyor). **Kararlar (kullanıcı,
  22 Eki):** madde bağı alıştırmada cevaptan önce gösterilir, denemede gizlenir; "Atla"
  YOK (alıştırmada her soru cevaplanır, boş bırakma yalnız denemede). Çizimi kullanıcı
  Figma agent'a yaptırır; bu oturum yalnız promptu verir.

## 1. Figma agent promptu (kopyala-yapıştır)

Aşağıdaki metin PaemisyonNew dosyasında Figma agent'a (First Draft / Make) verilir.
Değişkenler ve stiller dosyada hazır: Nöbet v4 renkleri (`bg`, `surface`, `surfaceAlt`,
`line`, `ink`, `inkSoft`, `inkSubtle`, `accent`, `accentSoft`, `accentInk`, `onAccent`,
`panel`, `panelInk`, `panelSoft`, `success*`, `danger*`, `warning*`), metin stilleri
(`Nöbet/hero`, `Nöbet/brand`, title, heading, subhead, body, bodySm, label), `radius/card`
10, `radius/panel` 4, kontrol 10, hap 999.

---

**Görev:** Paemisyon (polis amirliği sınavına hazırlık uygulaması) için "Seans" ekranını
çiz: kullanıcının 10 soruluk bir alıştırma turunu çözdüğü tek ekran. Bu dosyadaki
"Nöbet defteri" kimliğini ve mevcut Bugün ekranını (`7:1442` koyu, `7:1523` açık) referans
al; aynı aileden görünmeli. iPhone 17 (393×852) için koyu ve açık tema; kabuk yok
(sekme çubuğu yok), tam ekran odak.

**Kimlik kuralları (bağlayıcı):** Zemin `bg` (lacivert gece / kağıt beyazı). Tek vurgu
altın `accent`; açık temada altın yalnız dolgu, çizgi ve düğme zemini, metin olarak
`accentInk` (kahve). Gölge yok; yüzeyler ton farkı (`surface`/`surfaceAlt`) ve 1 px `line`
ile ayrışır. Başlıklar Lora (serif), gövde Inter. Köşeler: kart 10, kontrol 10, panel 4.
Durum yalnız renkle anlatılmaz; ikon ya da rozet metni eşlik eder. Dokunma hedefleri
≥44 pt. Metin kontrastı ≥4.5:1.

**Yerleşim (yukarıdan aşağı):**

1. **Üst satır (56 pt):** solda X (ghost ikon düğmesi); ortada `bodySm` `inkSoft`
   "Alıştırma"; sağda "..." (ghost; menü: Soruyu paylaş · Soruyu bildir · Yazı boyu · Vazgeç —
   kit Sheet, iOS action sheet değil). Altında **başlık bloğu**:
   kapsam adı Lora 600 24 ("Anayasa Hukuku" / "1 sayılı CBK"), altında tek satır
   `bodySm` `inkSoft` tabular "Soru 3 / 10 · ✓2 ✗0" (✓ `success`, ✗ `danger`; sıfırken
   `inkSubtle`). Hemen altında 2 pt kalınlığında **nöbet çizelgesi tarzı** ilerleme: 10 küçük dilim,
   çözülen doğrular `success`, yanlışlar `danger`, mevcut soru altın, kalanlar `line`.
   (Bugün'deki WeekStrip7 ile akraba; dilimler arası 3 pt boşluk.)

2. **Soru gövdesi (`surface` yok, doğrudan zemin üstünde — editoryal):** üstte **meta
   satırı** `label` `inkSubtle`: "ZOR · " + madde bağı "PVSK · md. 4/A ›" (`accentInk`,
   dokunulur, Madde sheet'ini açar; alıştırmada cevaptan önce de görünür, deneme
   modunda gizli); soru metni **Lora 400, 20/28** (`heading` stili, ağırlık
   400 varyantı; uzun hukuk cümlesi için okunaklı). Soru görseli varsa metnin altında
   `radius/card` ile. Öncül listesi (I, II, III) varsa girintili, aynı stil.

3. **Şıklar (5 adet, A–E):** her biri 56 pt yüksekliğinde satır; `surface` zemin,
   1 px `line` kenar, radius 10; solda 28 pt daire içinde harf (`surfaceAlt` zemin,
   `ink` harf), sağda Inter 16/24 `ink` metin. Satırlar arası 10 pt. Durumlar (hepsini
   bir component'in varyantları olarak çiz): **default**, **pressed** (`surfaceAlt`
   zemin), **seçili-bekliyor** (altın 1.5 px kenar, `accentSoft` zemin), **doğru**
   (`successSoft` zemin, `success` kenar, harf dairesi `success` dolgu + check ikonu),
   **yanlış** (`dangerSoft` zemin, `danger` kenar, harf dairesi `danger` + X ikonu),
   **pasif** (cevap verilmiş, diğer şıklar; `inkSubtle` metin, kenar `line`).

4. **Geri bildirim bloğu (cevap verildikten sonra, şıkların altında belirir):**
   bu ekranın karakter parçası — **`panel` laciverti** (açık temada da koyu kalır),
   radius 4, iç boşluk 16. Üstte satır: solda Lora 600 18 "Doğru" (`success`) ya da
   "Yanlış · doğru cevap C" (`danger` ikonu + `panelInk` metin); sağda küçük rozet
   "+12 sn" gibi süre (`panelSoft`). Altında açıklama Inter 15/22 `panelInk`
   (3–5 satır örnek metin). En altta **yasal dayanak satırı**: Scale ikonu + "2559 sayılı
   PVSK md. 4/A" `panelSoft` + sağda "Maddeyi oku →" `accent` (koyu) / `panelInk` altı
   çizili (açık, panel üstünde altın metin serbest: panel zemini her iki temada koyu).
   Altında ince araç satırı (ghost ikon düğmeleri, 44 pt): Favori (bookmark),
   Not (pencil), Koça sor (brain), Hata bildir (flag) — etiketleri `bodySm` `panelSoft`.

5. **Alt yapışkan çubuk:** zemin `bg` + üstte 1 px `line`, 52 pt düğmeler, radius 10.
   **Cevaptan önce:** tek ikincil düğme "Önceki" (`surface` + `line`; ilk soruda çubuk
   hiç görünmez). Atla yok: alıştırmada her soru cevaplanır. **Cevaptan sonra:** solda
   küçük "Önceki" (ghost, 44 pt), sağda esnek birincil "Sonraki soru" (altın dolgu,
   `onAccent` lacivert metin, Inter 600 16). Son soruda "Turu bitir". Şık seçmek cevaptır
   (2 dokunuş kuralı); "Önceki" cevaplanmış soruyu salt okunur gösterir.

**Çizilecek ekranlar (her biri koyu + açık):**
- S1 Soru açık, cevap yok (3. soru: çubukta yalnız "Önceki").
- S1b "..." menüsü açık (Sheet).
- S2 Doğru cevap verildi: şık durumları + panel + çubuk.
- S3 Yanlış cevap verildi: doğru şık yeşil, seçilen kırmızı, panelde "Yanlış · doğru cevap C".
- S4 Kaydırılmış hâl: geri bildirim paneli ekranın üstüne yaklaşınca üst satır ince
  başlığa çöker ("3 / 10 · Anayasa Hukuku"), Bugün'deki çöken hero gibi.
- S5 Tur sonu: `panel` içinde Lora `Nöbet/hero` stiliyle büyük "8/10", altında
  "Doğruluk %80 · 4 dk 12 sn", konu kırılımı listesi (konu adı + ince ilerleme +
  %), kazanılan rozet varsa `surfaceAlt` hap, iki düğme: "Yanlışları tekrar et"
  (altın) ve "Bugün'e dön" (ikincil, `surface` + `line`).
- S6 Deneme modu varyantı: üst satırda sayaç "47:12" tabular (son dakikada `danger`),
  sağda "Bitir" `accentInk`; geri bildirim paneli YOK; alt çubuk: Önceki · Bayrak ·
  optik form "12/40 · ⚑3" (`surfaceAlt` hap) · Sonraki.
- Madde sayfası (Sheet): başlık "Madde 4/A" Lora 600 24, resmî metin Inter 16/26,
  altta kaynak satırı `inkSubtle`.

**Bileşenler:** `Seans/ŞıkSatırı` (6 varyant), `Seans/İlerlemeDilimleri`,
`Seans/GeriBildirimPaneli` (doğru/yanlış/açıklamasız), `Seans/AraçSatırı`,
`Seans/AltÇubuk` (cevap öncesi / cevap sonrası / deneme), `Seans/BaşlıkBloğu`
(ad + sayaçlar), `Seans/MetaSatırı`, `Seans/SonuçPaneli`. Auto layout, değişkene
bağlı renkler (sabit hex yok), metin stilleri dosyadakilerden; "Seans" adlı yeni sayfa.

**Yapma:** ders rengi, gradyan, gölge, emoji, kart içinde kart, altın metin açık
temada zemin üstünde, 3'ten fazla farklı yazı boyu bir blokta, açıklama metnini
şıkların arasına sokmak.

---

## 2. Fikirler (GYSROTA'nın ötesine)

- **Çizelge ilerleme:** dilim renkleri turun tarihçesini gösterir; tur sonu paneli
  aynı dilimleri büyütüp kullanır — ekran içi süreklilik.
- **Panel = defter notu:** geri bildirim bloğunun lacivert kalması açık temada
  "defterden okunan dayanak" hissi verir; Bugün'deki geri sayım paneliyle aynı dil.
- **Süre rozeti:** soruya harcanan saniye (`+12 sn`) sunucuda zaten ölçülüyor
  (`questionShownAt`); hız alışkanlığını görünür kılar, yarış hissi vermez.
- **Çöken üst satır:** uzun açıklamalarda bağlam kaybolmaz.
- **Tek dokunuş cevap, ikinci dokunuş ileri:** değişmiyor; çubuk ancak cevaptan sonra
  belirdiği için ekran soruya odaklı kalır.

## 3. Sonraki adımlar

1. Kullanıcı promptu Figma agent'a verir, çizimi paylaşır; Figma düğümleri bu dosyaya
   işlenir.
2. Çizim onayı → F10-0 API (difficulty, relatedArticleRef) → F10-A Expo `seans.tsx` (kit: `ChoiceRow` varyantları, `FeedbackPanel`,
   `SessionProgress`), F10-B web `session-player.tsx` aynı dil, F10-C deneme modu.
