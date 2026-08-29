# Soru Bankası Üretimi — Devir Notu

Bu dosya, çıkmış sınav sorularının PDF soru bankalarından çıkarılıp Paemisyon
veritabanına `in_review` olarak aktarılması işinin devri içindir. İşi devralan
ajan **yalnızca bu dosyayı okuyarak** kaldığı yerden devam edebilmelidir.

Son güncelleme: 27 Ağustos 2026

---

## 1. İş nedir

Yayınevlerinin (Müessir, Themis) hâkimlik/kaymakamlık soru bankası PDF'lerinden
**gerçek çıkmış sınav sorularını** transkribe edip, her birinin cevabını güncel
kanun metninden doğrulayarak veritabanına aktarmak.

Ürünün varlık nedeni "gerçek, kaynaklı çıkmış soru" güvenidir. Bu yüzden:
- **AI ile soru uydurulmaz.** Sorular ya PDF'teki çıkmış sorulardır ya da
  DB'deki kanun metnine dayanan, madde referanslı özgün sorulardır.
- Çıkmış sorularda `sourceLabel` gerçek sınav etiketidir (örn. `2023 KAYMAKAMLIK SINAVI`).
- **Yayınevinin çözüm metni asla kopyalanmaz.** Açıklamalar kanun metninden
  yeniden yazılır. (Kullanıcı yayınevi ve Themis ile görüşüp çıkmış soruların
  kullanımı için onay aldığını bildirmiştir; onay çıkmış sorularla sınırlıdır.)

---

## 2. KALDIĞIN YER

**Müessir - İdari Yargılama Hukuku.pdf** (120 yaprak) işleniyor. Kitap 4 bölüm:

| Bölüm | Sayfa | Yaprak | Durum |
|---|---|---|---|
| Genel İlkeler ve Mahkemeler | 7–70 | 5–36 | ✅ bitti (12 soru) |
| Dava Türleri ve Süreler | 71–118 | 37–60 | ✅ bitti (7 soru) |
| **Dava Süreci ve Muhtelif Konular** | **119–206** | **61–104** | ✅ bitti (15 soru; yaprak 79–104 yalnız 2017 ve öncesi) |
| Karma Olay Soruları | 207–231 | 105–117 | ✅ bitti (2020+ soru yok; tamamı 2015 ve öncesi) |
| Önemli Süreler tablosu | 232+ | 118+ | ⬜ (soru değil; özgün soru kaynağı olabilir) |

Yaprak → sayfa dönüşümü: **yaprak S = sayfa 2S-3 ve 2S-2** (her tarama yaprağı
iki kitap sayfası içerir). Bu kitap için doğrulanmıştır.

---

## 3. Ortam ve komutlar

Monorepo: `/Users/ahmetcnd/Developer/paemisyon`. Çalışma dizini `apps/api`.

### Veritabanı komut kalıbı (ZORUNLU)
Supabase pooler'ın 15 bağlantı limiti var ve prod ile ortak. Her komutta
`connection_limit=1` şarttır:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && \
DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" npx tsx <script>
```

Notlar:
- Shell'in cwd'si komutlar arasında sıfırlanır → her seferinde `cd` yaz.
- `npx tsx -e` ile inline kod yazarken top-level await ÇALIŞMAZ (CJS).
  `(async () => { ... })();` ile sar.
- `.env` asla commit edilmez.

### Import scripti
`apps/api/scripts/import-ozgun-sorular.ts`

```bash
# kuru çalışma (varsayılan)
npx tsx scripts/import-ozgun-sorular.ts scripts/ozgun-sorular/<dosya>.json
# yazma
npx tsx scripts/import-ozgun-sorular.ts scripts/ozgun-sorular/<dosya>.json --yaz
```

Script: 4 veya 5 şıkkı (A–D / A–E, sırayla) ve tam 1 doğru cevabı doğrular, `sourceLabel`
zorunlu tutar, `questionFingerprint` ile mükerrerleri eler ve **her zaman
`status: 'in_review'` yazar**. Yayına alma yetkisi yalnızca kullanıcıdadır;
doğrudan `published` yazılmaz.

### Kısaltma scripti
`apps/api/scripts/kisalt-kanun-adlari.ts` — incelemede bekleyen soru köklerinde
ve şıklarında uzun kanun adlarını kısaltır (`5271 sayılı Ceza Muhakemesi
Kanunu'na göre` → `5271 sayılı CMK'ya göre`, `Türkiye Büyük Millet Meclisi` →
`TBMM` vb.). **Her import'tan sonra `--yaz` ile çalıştır** (ekranda taşma
önlemi, kullanıcı talebi).

---

## 4. Topic ID'leri

| Konu | topicId |
|---|---|
| 2559 PVSK | `65aef8de-07cb-49f6-8665-00adc0ef5754` |
| 5326 Kabahatler | `569628d2-5e1c-4788-ad66-1ef20d9374f6` |
| 5237 Türk Ceza Kanunu | `81500d64-b141-4d67-a1cc-f34f42b5869b` |
| 5271 CMK | `25ddf5a1-9364-4c66-bd74-5d5bb71b21ff` |
| T.C. Anayasası | `716f57ed-9618-41e0-8079-74d264f33abc` |
| İdare Hukuku | `b396a7c3-6f30-490e-9401-4be88e87a91b` |
| 2577 İYUK | `e22d1f78-8191-4099-9134-044c59114bd7` |
| 1774 Kimlik Bildirme | `14c06c01-9386-40c3-b566-766f8f344bfc` |
| 6458 Yabancılar | `18c6184c-6f45-4501-a075-0614a48ab77e` |

Not: "İdare Hukuku" adında iki topic var; **dolu olan** yukarıdakidir
(diğeri `483e7c4a-...` boş, kullanma). Bir soru hangi kanuna dayanıyorsa o
konuya yazılır — İdare kitabındaki bir PVSK sorusu PVSK topic'ine gider.

---

## 5. JSON şeması

`apps/api/scripts/ozgun-sorular/<tarih>-<konu>-<NN>.json`

```json
[
  {
    "topicId": "e22d1f78-8191-4099-9134-044c59114bd7",
    "articleNo": "7",
    "stem": "Soru kökü. Olay + soru cümlesi.\nÇok satırlı ise \\n kullan.",
    "options": [
      { "label": "A", "text": "..." },
      { "label": "B", "text": "...", "isCorrect": true },
      { "label": "C", "text": "..." },
      { "label": "D", "text": "..." },
      { "label": "E", "text": "..." }
    ],
    "explanation": "Kanun metninden yazılmış açıklama. Doğru cevabın neden doğru, ayırt edici çeldiricilerin neden yanlış olduğunu göster. Kritik ibareleri BÜYÜK HARFLE vurgula.",
    "difficulty": "easy | medium | hard",
    "sourceLabel": "2023 KAYMAKAMLIK SINAVI",
    "citation": "2577 sayılı İdari Yargılama Usulü Kanunu md. 7, 20/B",
    "citationUrl": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2577.pdf"
  }
]
```

`articleNo` opsiyoneldir; kanun maddesi net ise yaz. Şıklar **A–D veya A–E
sırasıyla** ve tam biri `isCorrect: true` olmalıdır. Kaynaktaki şık sayısı
korunabilir; sırf beş şık olsun diye yapay seçenek eklenmez.

Dosyayı Bash heredoc ile yazmak pratiktir:
`cat > <yol> <<'JSONEOF' ... JSONEOF` (tek tırnaklı heredoc, içerideki
tırnaklar bozulmaz), ardından `python3 -c "import json;json.load(open(...))"`
ile doğrula.

---

## 6. BAĞLAYICI KALİTE KURALLARI

Bunlar kullanıcının açık talimatlarıdır; istisnasız uygulanır.

1. **2020 filtresi yalnız çıkmış sorular içindir.** Sınav adı/yılı açıkça
   belirtilen çıkmış sorulardan 2020 öncesi olanlar sisteme HİÇ alınmaz.
   Yayınevinin kendi test soruları ise baskı/kaynak etiketiyle alınabilir;
   bunlarda esas ölçüt güncel mevzuat doğrulaması ve mükerrerliktir. Kitaplar
   çıkmış soru bölümlerinde konu içinde yeniden→eskiye sıralıysa 2019'a düşünce
   o konu biter, sonraki konu başlığına geç.
2. **Her cevap DB'den doğrulanır.** Soruyu almadan önce ilgili kanun maddesini
   `lawArticle` tablosundan çek ve cevabın güncel metinle uyuştuğunu gör.
   Mülga/değişmiş hükümlere dayanan sorular elenir.
   ```bash
   npx tsx -e '(async () => {
     const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();
     const r=await p.lawArticle.findMany({where:{articleNo:{in:["7","9"]},topicId:"<id>"},
       select:{articleNo:true,title:true,text:true}});
     r.forEach(x=>console.log("=== m."+x.articleNo+" "+x.title+"\n"+x.text.slice(0,1500)));
     await p.$disconnect();})();'
   ```
   `lawArticle` alanları: `articleNo`, `title`, `text`, `sortKey`, `status`,
   `lastVerifiedAt`. (`content`/`sortOrder` DEĞİL.)
3. **Şüpheli soru alınmaz.** "Bir soru konusunda tereddüt varsa o soruyu
   kullanma." Çift cevaplı, cevap anahtarı kanunla çelişen sorular elenir.
   İstisna: kitabın çözüm gerekçesi net ama basılı cevap harfi dizgi hatalıysa,
   gerekçenin gösterdiği şık alınır ve açıklamada dayanak yazılır (bu birkaç kez
   yaşandı).
4. **Cumhurbaşkanlığı kararnamesi (CBK) soruları ALINMAZ.** Kullanıcı: "bizim
   sınavda çok seçilen konulardan değil". Stem'i "1 sayılı CBK'ye göre..." diye
   başlayan veya ayırt edici bilgisi CBK olan sorular atlanır. (Geriye dönük 13
   soru `archived` yapıldı.)
5. **Parasal tutar soran sorular ALINMAZ.** İdari para cezası tutarları, İYUK
   istinaf/temyiz parasal sınırları her yıl yeniden değerlemeyle değişir ve
   soru bayatlar. Bunun yerine yetkili makam / itiraz mercii / süre / tekerrür
   rejimi gibi kalıcı yapıyı soran sorular alınır.
   **Süre soruları alınabilir:** güncel mevzuat veritabanındaki hükümden açıkça
   doğrulanan gün, ay ve yıl süreleri kapsam içindedir. Süre olması tek başına
   eleme sebebi değildir.
6. **Mükerrer eleme.** Yalnız birebir aynı veya pratikte aynı kök ve aynı
   seçeneklerden oluşan sorular tekrar alınmaz. Aynı hükmü ölçse bile şıkları,
   vaka örgüsü ya da sınanan ayrımı farklı olan soru alınabilir. Kullanıcının
   26 Ağustos 2026 tarihli açık düzeltmesi budur. Aynı maddenin farklı
   fıkralarını test eden sorular zaten mükerrer değildir.
7. **Kalite > nicelik.** Soru sayısını şişirmek için zorlanmaz.

---

## 7. PDF iş akışı

PDF'ler taranmış görüntüdür, metin katmanı yoktur → **render edip görsel oku**.

```bash
# 1) Drive'dan indir (büyük dosya, virüs taraması onayı gerekir)
cd <scratchpad>
ID=<drive_file_id>
curl -sL -c ck.txt "https://drive.usercontent.google.com/download?id=$ID&export=download" -o pre.html
U=$(grep -o 'name="uuid" value="[^"]*"' pre.html | head -1 | sed 's/.*value="//;s/"//')
curl -sL -b ck.txt "https://drive.usercontent.google.com/download?id=$ID&export=download&confirm=t&uuid=$U" -o kitap.pdf

# 2) yaprak sayısı
python3 -c "from pypdf import PdfReader;print(len(PdfReader('kitap.pdf').pages))"

# 3) tam çözünürlükte render (okunabilir asgari: 110 dpi)
pdftoppm -png -r 110 -f <ilk> -l <son> kitap.pdf onek

# 4) hızlı tarama / bölüm başlığı arama için düşük çözünürlük
pdftoppm -png -r 45 -f <ilk> -l <son> kitap.pdf lowres/x
```

Sonra üretilen `.png` dosyalarını görsel olarak oku. Bir yaprakta genelde 2–4
soru + çözümleri bulunur. **Cevap harfi çoğu zaman sonraki yaprağın çözüm
metnindedir** — cevabı görmeden soruyu alma.

Kitaplar konu bazlı bölümlere ayrılır; her bölüm içinde sorular yeniden→eskiye
sıralıdır. Bölüm başlıklarını bulmak için önce düşük çözünürlüklü tarama yap.

---

## 8. Şu ana kadar yapılanlar (Drive klasöründen)

Klasör: https://drive.google.com/drive/folders/1c6eCsTBKTvWVlWXunYwQn1nrelbHX1Cc
(50 PDF; 8'i işlendi + Themis CMK sürüyor, toplam **1154 soru** üretildi)

| Kitap | Yaprak | Durum | Soru | Parti dosyaları |
|---|---|---|---|---|
| Müessir – Ceza Hukuku Genel Hükümler | 114 | ✅ 4/4 bölüm | 110 | `tck-hakimlik-01..07` |
| Müessir – Ceza Hukuku ve CMK SB | 192 | ✅ TCK Özel + CMK tamamı | 94 | `tck-ozel-01..02`, `cmk-01..04` |
| Müessir – Anayasa Hukuku SB | 248 | ✅ 6/6 bölüm | 125 | `anayasa-01..08` |
| Müessir – İdare Hukuku SB | 194 | ✅ 7/7 bölüm | 162 | `idare-01..08` |
| Müessir – İdari Yargılama Hukuku | 120 | ✅ 4/4 bölüm | 34 | `iyuk-01..04` |
| Themis – Anayasa Hukuku Soru Kitabı (2025) | 128 | ✅ tamamlandı; son bölüm 6271 sayılı Cumhurbaşkanı Seçimi Kanunu (PDF yaprak 125–127) | 166 | `themis-anayasa-01..24` |
| Themis – Ceza Hukuku Genel Hükümler Soru Kitabı (2025) | 104 | ✅ Alınabilir kapsam tamamlandı (PDF yaprak 6–104) | 220 | `themis-tck-gh-01..18` |
| Themis – Ceza Hukuku Özel Hükümler Soru Kitabı (2025) | 96 | ✅ tamamlandı (PDF yaprak 1–96 tarandı) | 269 | `themis-tck-oh-01..23` |
| Themis – Ceza Muhakemesi Hukuku Soru Kitabı (2025) | 116 | 🔄 Ceza mahkemelerinin yargılama yetkisi işleniyor (PDF yaprak 1–16 tarandı) | 36 | `themis-cmk-01..03` |

Bu turun dışında üretilmiş özgün soru partileri (kitaptan değil, DB kanun
metninden): `pvsk-01..02`, `kabahatler-01..02`, `ipc-tablo-01`,
`bilgi-edinme-01..02`, `dortalan-01`.

Konu bazında durum (27 Ağustos 2026):

| Konu | Yayında | İncelemede |
|---|---|---|
| Türk Ceza Kanunu | 237 | 202 |
| CMK | 474 | 454 |
| T.C. Anayasası | 194 | 69 |
| İdare Hukuku | 193 | 91 |
| İYUK | 24 | 34 |

---

## 9. Sıradaki iş listesi

### Son Themis Anayasa partisi (26 Ağustos 2026)

- `2026-08-themis-anayasa-24.json`: 6271 sayılı Cumhurbaşkanı Seçimi Kanunu
  bölümünden 12 soru `in_review` eklendi. Genel ilkeler, seçimlerin yenilenmesi,
  savaş nedeniyle erteleme, siyasi parti ve seçmenlerce aday gösterme,
  göreve dönüş, propaganda, seçim hesabı ve andiçme işlendi.
  Toplam Themis Anayasa: **166**; kitap tamamlandı.
- Tarihsel cevaplar AYM'nin resmî önceki anayasa metinlerinden doğrulandı;
  soru bankasında anahtar ibarelerle anlamca mükerrerlik tarandı.
- 1924 Cumhurbaşkanının görev süresi ve kanunları geri gönderme süresini
  birleştiren soru ile terminolojisi tartışmalı ilkler soruları elendi. Güncel
  Anayasadaki kanunsuz emir sorusuyla aynı bilgiyi tekrarlayan aday alınmadı.
- Bankada bulunan parti kuruluş sayısı, sicil dosyası ve Yasakları İnceleme
  Kurulunun bulunduğu yer soruları mükerrer olduğu için alınmadı. 2820 sayılı
  Kanun bölümü tamamlandı.
- 6271 bölümündeki seçmen başvurusunun reddine itiraz ve adaylara yardım/bağış
  soruları bankadaki mevcut sorularla anlamca mükerrer oldukları için alınmadı.
  Değişken adaylık başvuru tutarını merkeze alan adaylar da alınmadı.
- Themis Ceza Hukuku Genel Hükümler kitabına geçildi. Kitap 104 PDF yaprağı ve
  197 kitap sayfasıdır. İçindekiler PDF yaprak 4–5'tedir; kitap sayfası dönüşümü
  yaprak S için yaklaşık `2S-11` ve `2S-10` şeklindedir.
- `2026-08-themis-tck-gh-01.json`: Ceza hukuku ve işlevi ile ceza normunun kişi,
  yer ve zaman bakımından uygulanması bölümlerinden 9 soru `in_review` eklendi.
  Süreli kanun, sabit platform, infaz rejimi istisnaları, konsolosluk, faile göre
  kişisellik, vatandaşın yurt dışı suçu, kıyas, yer bakımından uygulama ve yabancı
  failin rüşvet suçu işlendi.
- İlk testlerdeki salt doktrin soruları ile bankadaki mevcut kanunilik, evrensellik,
  mahsup, TCK tanımları ve kesintisiz suç sorularıyla aynı bilgiyi ölçen adaylar
  alınmadı.
- `2026-08-themis-tck-gh-02.json`: Normun kişi ve yer bakımından uygulanması
  ile geri verme bölümünden 13 soru `in_review` eklendi. Evrensellik kataloğu,
  yabancının Türkiye zararına suçu, iade eşikleri, ret nedenleri, özellik kuralı,
  geçici tutuklama, görevli mahkeme, siyasi suç ve rızaya dayalı iade işlendi.
- Kullanıcının yeni mükerrerlik ölçütü uygulandı: aynı hükmü ölçen fakat farklı
  şık veya vaka örgüsüne sahip sorular korundu; yalnız birebir/pratikte aynı
  kök ve seçenekler elenecek.
- 6706 sayılı Kanun Mevzuat Merkezi veritabanında ayrı kayıtlı değildir. Bu
  bölüm Adalet Bakanlığının resmî güncel kanun metnindeki m.10-21 üzerinden
  doğrulandı.
- `2026-08-themis-tck-gh-03.json`: Geri Verme Test II'nin sonu ve Suçun
  Unsurları Test I'in başlangıcından 6 soru `in_review` eklendi. Geçici
  tutuklama süresi, iade kararının icrası, kesinleşmiş mahkûmiyetin iadeye
  etkisi, dolandırıcılığın hareket yapısı, görünüşte özgü suç ve sözde suç işlendi.
- `2026-08-themis-tck-gh-04.json`: Tipikliğin Maddi Unsurları Test II-III ve
  Manevi Unsurlar Test I'in başlangıcından 12 soru `in_review` eklendi.
  İtiyadi suç, kesintisiz suç, somut tehlike, doğrudan kast, seçimlik hareket,
  kesintisiz suçta süre/iştirak, kast-taksir, maddi unsur hatası, çok failli
  taksir, eklenen kast ve netice sebebiyle ağırlaşmış suç işlendi.
- `2026-08-themis-tck-gh-05.json`: Tipikliğin Manevi Unsurları Test I-II ve
  Hukuka Aykırılık Unsuru Test I'in başlangıcından 13 soru `in_review` eklendi.
  Eklenen kast, bilinçli taksir, çok failli taksir, amaç-saik, doğrudan/olası
  kast, maddi unsur hatası, netice sebebiyle ağırlaşmış suç, haksız tahrik,
  taksirle öldürme ve meşru savunma işlendi.
- `2026-08-themis-tck-gh-06.json`: Hukuka Aykırılık Unsuru Test I'in devamı ve
  Suçun Unsuru Sayılmayan Olgular Test I'in başlangıcından 13 soru `in_review`
  eklendi. Hukuka uygunluk nedenlerinin etkisi, üçüncü kişi lehine meşru savunma,
  yetkili merci emri, saldırı ve savunma koşulları, ilgilinin rızası, sınırın
  aşılması, haksız tahrik, kamu görevlisine görevinden dolayı hakaret ve şahsi
  cezasızlık sebebi işlendi.
- Kaynaktaki iki aday, basılı cevap/çözüm uyuşmazlığı ve olay örgüsündeki hukuki
  belirsizlik nedeniyle elendi. Meşru savunmada sınırın mazur görülebilecek
  heyecan, korku veya telaşla aşılmasında ceza indirimi değil cezasızlık olduğu
  güncel TCK m.27/2 üzerinden düzeltildi.
- `2026-08-themis-tck-gh-07.json`: Suçun Unsuru Sayılmayan Olgular Test I'in
  sonu ile Ceza Sorumluluğu (Kusurluluk) Test I-II'nin başlangıcından 16 soru
  `in_review` eklendi. Şahsi cezasızlık, kovuşturma şartı, taksirli iflas,
  iradi alkol, cebir-tehdit, yaş küçüklüğü, sağır ve dilsizlik, haksız tahrik,
  amirin emri, zorunluluk hâli ve kişide yanılma işlendi.
- TCK m.32'nin 24.12.2025 tarihli değişik metni ayrıca kontrol edildi; kitapta
  önceki metne dayanan akıl hastalığı ceza oranı soru olarak alınmadı. Salt
  doktrinsel ayrımlara dayanan veya olay bilgisi kesin cevap için yetersiz kalan
  adaylar elendi.
- `2026-08-themis-tck-gh-08.json`: Ceza Sorumluluğu (Kusurluluk) Test II-III ile
  Suçun Özel Görünüm Biçimleri/Teşebbüs Test I'in başlangıcından 16 soru
  `in_review` eklendi. Haksız tahrik, maddi unsur ve nitelikli hâl yanılması,
  kişide yanılma, zorunluluk hâli, yaş küçüklüğü, teşebbüs, işlenemez suç,
  gönüllü vazgeçme, zorlayıcı neden ve nedensellik bağında sapma işlendi.
- Kitabın akıl hastalığı sorusu, TCK m.32'nin 24.12.2025 değişikliği sonrasında
  iki yanlış şıklı hâle geldiği için elendi. Zorunluluk hâlindeki zararın medeni
  hukuk bakımından tazmini ve olay bilgisi yetersiz tahrik adayları da alınmadı.
- `2026-08-themis-tck-gh-09.json`: Teşebbüs Test I-II ile İştirak Test I'in
  başlangıcından 16 soru `in_review` eklendi. İcra hareketi, doğrudan doğruya
  icraya başlama, bağımsız nedensel müdahale, gönüllü vazgeçme, işlenemez suç,
  iştirak türleri, azmettirme, yardım etme ve zincirleme suç işlendi.
- Aynı gönüllü vazgeçme ve elverişsiz araç bilgisini tekrar ölçen iki aday parti
  içinden çıkarıldı. Güncel TCK m.35'te 4.6.2025 tarihinde değişen teşebbüs ceza
  aralıkları kontrol edildi; bu partide değişken oran/ceza aralığı sorusu alınmadı.
- `2026-08-themis-tck-gh-10.json`: İştirak Test I-II ile İçtima Test I'in
  başlangıcından 13 soru `in_review` eklendi. Müşterek faillik, teşvik, ortak
  planın aşılması, zincirleme suç, azmettirenin sorumluluğu, yardım etme,
  tekerrür, bileşik suç ve gerçek içtima işlendi.
- Aynı müşterek faillik bilgisini tekrarlayan bir aday parti içinden çıkarıldı.
  Suç ortaklarının rolü veya ortak planın kapsamı olay metninden kesin
  belirlenemeyen doktrinel adaylar da alınmadı.
- `2026-08-themis-tck-gh-11.json`: İçtima Test I-III'ten 17 soru `in_review`
  eklendi. Mağdur ve hareket sayısına göre suç sayısı, zincirleme suçta zamanaşımı,
  bileşik suç, cinsel saldırıda zincirleme suç, fikrî ve gerçek içtima, aynı
  neviden fikrî içtima, kesintisiz suç ve bilişim yoluyla hırsızlık işlendi.
- Aynı hırsızlık-içtima bilgisini tekrar ölçen iki aday parti içinden çıkarıldı.
  Cinsel saldırının TCK m.43/3'teki güncel yasak listesinde bulunmadığı ayrıca
  doğrulandı.
- `2026-08-themis-tck-gh-12.json`: İçtima Test III'ün sonu ile Yaptırım Türleri
  Test I'in başlangıcından 18 soru `in_review` eklendi. Hedefte sapma, konutta
  yağma, gerçek içtima, zincirleme suç, kusur-yaptırım ilişkisi, ceza türleri,
  temel cezanın ölçütleri, yabancı hükümde tekerrür, kısa süreli hapsin seçenek
  yaptırıma çevrilmesi, takdiri indirim ve güvenlik tedbirleri işlendi.
- TCK m.53'teki AYM iptalleri nedeniyle birden fazla cevaba açılan hak yoksunluğu
  adayı elendi. TCK m.50, 51, 53, 58, 61 ve 62 güncel veritabanı metninden
  ayrıca doğrulandı.
- `2026-08-themis-tck-gh-13.json`: Yaptırım Türleri Test I-III'ten 18 soru
  `in_review` eklendi. Seçenek yaptırımlar, mükerrirlere özgü infaz, eşya
  müsaderesi, ceza türleri, süreli hapis, ceza hesaplama sırası, hak yoksunluğu,
  mahsup, tekerrür süreleri, tüzel kişi güvenlik tedbirleri ve zorunlu çevirme
  işlendi.
- Adlî para cezasının gün başına TL tutarı ile mahsup hesabındaki TL değerini
  soran parasal adaylar değişiklik riski nedeniyle elendi. Güncel TCK m.54'e göre
  iki doğru şıklı hâle gelen müsadere adayı da alınmadı. Kitaptaki seçenek tedbire
  başlama süresi eski on gün yerine güncel m.50/6'daki otuz gün esas alınarak
  düzeltildi.
- `2026-08-themis-tck-gh-14.json`: Yaptırım Türleri Test III-IV'ten 7 soru
  `in_review` eklendi. Takdiri indirim ile temel ceza ölçütlerinin ayrımı,
  sürücü belgesinin geri alınma süresi, ceza hesabı, tekerrürde infaz şartı,
  taksirli suçta uzun süreli hapsin adlî paraya çevrilmesi, seçimlik cezada
  hapsin seçilmesinin sonucu ve adlî para cezasının taksit süresi işlendi.
- Değişken adlî para tutarı ve CGTİHK'ye dayanan infaz seçenekleri alınmadı.
  Hak yoksunluğu sorusu AYM iptalleri nedeniyle, akıl hastalarına özgü güvenlik
  tedbiri sorusu ise TCK m.57/6'nın 24.12.2025'te mülga olması nedeniyle elendi.
- `2026-08-themis-tck-gh-15.json`: Yaptırım Türleri Test IV-VI'dan 9 soru
  `in_review` eklendi. Tüzel kişilere özgü güvenlik tedbirleri, müsaderenin
  niteliği, kazanç müsaderesi, TCK-CMK tedbir ayrımı, yabancı mahkeme hükmünde
  tekerrür istisnaları, adlî para cezasında asgari taksit sayısı, bağımlılara
  özgü tedavi ve takdiri indirim oranı işlendi.
- Parasal mahsup hesabı ve aynı süre bilgisini birebir tekrarlayan adaylar
  elendi. Kitabın bağımlının serbest bırakılmasını hükmü veren mahkemeye bağlayan
  eski ifadesi, güncel TCK m.57/7'deki **infaz hâkimi** esas alınarak düzeltildi.
- `2026-08-themis-tck-gh-16.json`: Yaptırım Türleri Test VI'nın sonu ile
  Erteleme Test I'in başlangıcından 9 soru `in_review` eklendi. Eşya ve kazanç
  müsaderesi, yabancı mahkeme hükmünde tekerrür, kamuya yararlı işte çalışma,
  hapis cezasının erteleme sınırları, denetim süresi ve ertelenen kısa süreli
  hapsin hak yoksunluğuna etkisi işlendi.
- 5275 sayılı Kanun'a dayanan koşullu salıverme ve denetimli serbestlik adayları,
  sistemdeki güncel infaz metni ayrıca doğrulanmadan alınmadı. Aynı zorunlu
  çevirme bilgisini tekrarlayan yaş-ceza kombinasyonları da elendi.
- `2026-08-themis-tck-gh-17.json`: Erteleme Test II ile Dava ve Ceza
  İlişkisini Düşüren Nedenler Test I-II'den 9 soru `in_review` eklendi.
  Ertelemeye engel mahkûmiyet, genel ve özel af, dava zamanaşımının durması ve
  kesilmesi, ceza zamanaşımı, ön ödeme ve ölümün dava-cezaya etkisi işlendi.
- Koşullu salıvermenin suçlara göre değişen infaz oranları ile 2024-2025'te
  değişen ön ödeme özel suç listesini ölçen adaylar alınmadı. Dava ve ceza
  zamanaşımını kesen işlemler güncel TCK m.67 ve m.71 ayrımıyla doğrulandı.
- `2026-08-themis-tck-gh-18.json`: Dava ve Ceza İlişkisini Düşüren Nedenler
  Test II-III'ten 6 soru `in_review` eklendi. Yurt dışında işlenen suçlarda
  zamanaşımı, ön ödemenin özel kapsamı ve sonuçları, çocuklara karşı suçlarda
  zamanaşımının başlangıcı ile ceza zamanaşımı sınırları işlendi.
- PDF yaprak 99-100'deki 5352 sayılı Adli Sicil Kanunu soruları, bu kanun
  sistemin güncel mevzuat kayıtlarında bulunmadığı için doğrulanamayıp alınmadı.
  Yaprak 101-103'teki 6706 sayılı Kanun soruları PAEM kapsamı dışındaki
  uluslararası adli iş birliği alanında olduğundan atlandı; yaprak 104 kaynakçadır.
- **Themis Ceza Hukuku Genel Hükümler tamamlandı.** Sıradaki kitap:
  **Themis Ceza Hukuku Özel Hükümler Soru Kitabı**
  (`1_yUAqGBHjHd21lTk025BYOOx2MWSKe0r`).
- `2026-08-themis-tck-oh-01.json`: Themis Ceza Hukuku Özel Hükümler kitabına
  geçildi; Giriş Test I'den 6 soru `in_review` eklendi. Kamu görevlisi, yargı
  görevi yapan kişi, silah, vatandaş, gece vakti ve basın-yayın tanımları
  güncel TCK m.6 üzerinden doğrulandı. Aynı silah bilgisini farklı nesnelerle
  tekrarlayan adaylar çoğaltılmadı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **8** (kitap sayfası 5-6),
  Uluslararası Suçlar Test I'in başlangıcı. Bu başlık TCK özel hükümlerindeki
  soykırım, insanlığa karşı suçlar, göçmen kaçakçılığı ve insan ticaretiyle
  sınırlı işlenecek; uluslararası hukuk doktrini kapsam dışı bırakılacak.
- `2026-08-themis-tck-oh-02.json`: Uluslararası Suçlar Test I'den 11 soru
  `in_review` eklendi. Soykırımın özel amacı ve seçimlik hareketleri,
  insanlığa karşı suçlar, soykırım örgütü, göçmen kaçakçılığında teşebbüs ve
  nitelikli hâller ile insan ticaretinin amaç-araç-hareket ayrımı işlendi.
- Göçmen kaçakçılığının 2023'te değişen temel ceza aralığı soru seçeneklerine
  alınmadı. İhmali davranışla soykırım gibi yalnız doktrinden çözülebilen
  tereddütlü aday elendi; cevaplar güncel TCK m.76-80 ile sınırlandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **11** (kitap sayfası 11-12),
  Kişilere Karşı Suçlar / Yaşama ve Vücut Dokunulmazlığı Test I.
- `2026-08-themis-tck-oh-03.json`: Yaşama ve Vücut Dokunulmazlığına Karşı
  Suçlar Test I ile Test II'nin ilk kısmından 14 soru `in_review` eklendi.
  Kasten öldürmenin nitelikli hâlleri, intihara yönlendirme, teşebbüs,
  müşterek faillik ve neticesi sebebiyle ağırlaşmış yaralama ayrımları işlendi.
- Düğünde havaya ateş etme, hemofili ve nedensellik gibi yalnız olayın ayrıntılı
  kusur değerlendirmesiyle çözülebilen üç tereddütlü aday alınmadı. Kitaptaki
  güncelliğini yitirmiş ceza miktarları seçeneklere taşınmadı; tüm cevaplar
  güncel TCK m.21, 35, 37, 81-87, 89 ve 108 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **16** (kitap sayfası
  21-22), Yaşama ve Vücut Dokunulmazlığına Karşı Suçlar Test II'nin devamı.
- `2026-08-themis-tck-oh-04.json`: Yaşama ve Vücut Dokunulmazlığına Karşı
  Suçlar Test II'nin devamı ve Test III'ten 13 soru `in_review` eklendi.
  Basit tıbbi müdahaleyle giderilebilir yaralama, öldürmenin nitelikli hâlleri,
  insan üzerinde deneyin yaralama sonucu, gönüllü vazgeçme, organ ticaretinde
  özel zorunluluk, intihara yönlendirme ve taksirle yaralama ayrımları işlendi.
- Aynı hükmü farklı seçenek ve olay örgüsüyle ölçen sorular kullanıcı talebi
  doğrultusunda alındı; birebir tekrar bulunmadı. Cevaplar güncel TCK m.21,
  25, 35-36, 82, 84, 86-90 ve 92 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **19** (kitap sayfası
  27-28), İşkence ve Eziyet - Koruma, Gözetim, Yardım veya Bildirim
  Yükümlülüğünün İhlali bölümünün başlangıcı.
- `2026-08-themis-tck-oh-05.json`: İşkence ve Eziyet bölümünün Test I'i ile
  Test II başlangıcından 13 soru `in_review` eklendi. İşkence ve eziyetin fail,
  mağdur, hareket ve nitelikli hâl ayrımları; çocuk düşürtme/düşürme, terk ve
  yardım-bildirim yükümlülüğünün ihlali işlendi.
- Çoğul gebelik, suç sonucu gebelikte yirmi haftalık sınır, işkencede
  zamanaşımının işlememesi ve boşanılan eşe karşı eziyet güncel TCK m.94-100
  üzerinden ayrıca doğrulandı. Kısırlaştırma sorusundaki tartışmalı içtima
  önermesi ile işkencenin nitelikli sonuçlarını terminolojik olarak karıştıran
  aday alınmadı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **24** (kitap sayfası
  37-38), İşkence ve Eziyet bölümünün Test II devamı.
- `2026-08-themis-tck-oh-06.json`: Cinsel Dokunulmazlığa Karşı Suçlar Test I
  ile Test II başlangıcından 13 soru `in_review` eklendi. Cinsel saldırı,
  çocukların cinsel istismarı, reşit olmayanla cinsel ilişki ve cinsel taciz
  suçlarının yaş, rıza, şikâyet, temas ve nitelikli hâl ayrımları işlendi.
- Mağdurun beden veya ruh sağlığının bozulmasına dayanan eski ağırlaştırıcı
  hüküm güncel TCK m.103'te bulunmadığından bu ifade yalnız 'yanlıştır'
  sorusunda güncel hâli ölçmek üzere kullanıldı. Tüm cevaplar DB'deki güncel
  TCK m.102-105 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **28** (kitap sayfası
  45-46), Cinsel Dokunulmazlığa Karşı Suçlar Test II devamı.
- `2026-08-themis-tck-oh-07.json`: Cinsel Dokunulmazlığa Karşı Suçlar Test II
  sonu ile Özgürlüğe Karşı Suçlar Test I'in ilk kısmından 14 soru `in_review`
  eklendi. Tehdit, şantaj, ısrarlı takip, konut dokunulmazlığı, haksız arama,
  dilekçe hakkı, huzur ve sükûnu bozma ile nefret ve ayrımcılık işlendi.
- Güncelliğini yitiren beden/ruh sağlığının bozulması ağırlaştırıcısı yalnız
  yanlış önermeyi ölçmek üzere kullanıldı. İş ve çalışma hürriyeti sorusundaki
  iki yanlış seçeneğe yol açan basım sorunu nedeniyle aday elendi. Cevaplar
  güncel TCK m.102-123/A ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **32** (kitap sayfası
  53-54), Özgürlüğe Karşı Suçlar Test I devamı.
- `2026-08-themis-tck-oh-08.json`: Özgürlüğe Karşı Suçlar Test I sonu ve Test
  II'den 10 soru `in_review` eklendi. Siyasi hakların engellenmesi, kişiyi
  hürriyetinden yoksun kılma, tehdit, iş ve çalışma özgürlüğü, huzur ve sükûnu
  bozma, şantaj ve haberleşmenin engellenmesi işlendi.
- Israrlı takipte seçimlik hareketin bir kez yapılmasını yeterli sayan eski ve
  hatalı önerme ile tartışmalı mağdur ehliyeti önermeleri alınmadı. Cevaplar
  güncel TCK m.106-124 ve 132 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **36** (kitap sayfası
  61-62), Özgürlüğe Karşı Suçlar Test III devamı.
- `2026-08-themis-tck-oh-09.json`: Özgürlüğe Karşı Suçlar Test III'ün devamı
  ve sonundan 10 soru `in_review` eklendi. Cebir, kişiyi hürriyetinden yoksun
  kılma, siyasi haklar, konut dokunulmazlığı, haksız arama, ısrarlı takip ve
  haberleşmenin engellenmesi işlendi.
- Israrlı takipte farklı seçimlik hareketlerin ısrarı sağlayabileceği ve
  üçüncü kişiler üzerinden temasın güncel TCK m.123/A kapsamına girdiği ayrıca
  doğrulandı. Tartışmalı içtima ve mağdur ehliyeti adayları alınmadı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **39** (kitap sayfası
  67-68), Şerefe ve Özel Hayata Karşı Suçlar Test I başlangıcı.
- `2026-08-themis-tck-oh-10.json`: Şerefe ve Özel Hayata Karşı Suçlar Test I
  ile Test II başlangıcından 10 soru `in_review` eklendi. Hakaret, kişinin
  hatırasına hakaret, haberleşme ve özel hayat gizliliği, konuşmaların
  dinlenmesi ve hassas kişisel verilerin kaydı işlendi.
- Basın-yayın yoluyla ifşanın güncel TCK m.132 ve m.134'te ayrıca artırım değil
  aynı cezayı doğurduğu; kamu görevlisine hakaretin yalnız görevden dolayı
  işlenirse nitelikli olduğu özellikle doğrulandı. Cevaplar m.125-137 ile
  karşılaştırıldı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **43** (kitap sayfası
  75-76), Şerefe ve Özel Hayata Karşı Suçlar Test II devamı.
- `2026-08-themis-tck-oh-11.json`: Şerefe ve Özel Hayata Karşı Suçlar Test II
  devamı ve sonundan 10 soru `in_review` eklendi. Özel hayat-haberleşme ayrımı,
  konuşmaların dinlenmesi, kişisel veri kaydı, gıyapta hakaret, kurul hâlindeki
  kamu görevlilerine hakaret ve haksız fiile tepki işlendi.
- Gıyapta hakarette üç kişiyle ihtilat, kişinin hatırasına hakarette şikâyetçi
  yakınlar ve rızaya dayalı veri kaydının hukuka aykırılığı ortadan kaldırması
  güncel TCK m.125-140 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **45** (kitap sayfası
  79-80), Malvarlığına Karşı Suçlar Test I başlangıcı.
- `2026-08-themis-tck-oh-12.json`: Malvarlığına Karşı Suçlar Test I ve Test II
  başlangıcından 12 soru `in_review` eklendi. Yağma, güveni kötüye kullanma,
  kaybolmuş veya hata sonucu ele geçmiş eşya, zorunluluk hâlindeki hırsızlık,
  aile bireyleri arasındaki cezasızlık ve karşılıksız yararlanmada etkin
  pişmanlık işlendi.
- Hayvan hırsızlığındaki eski yer/sürü koşulunun güncel TCK m.142'de bulunmadığı
  doğrulandı; 2025'te değişen araç bağlantılı cezalar soru kapsamına alınmadı.
  Aile bireylerine ilişkin m.167 ile soruşturma tamamlanmadan tam gidermeye
  ilişkin m.168 hükümleri güncel metinden ayrıca kontrol edildi.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **49**, Malvarlığına
  Karşı Suçlar Test II devamı.
- `2026-08-themis-tck-oh-13.json`: Malvarlığına Karşı Suçlar Test II sonu ve
  Test III'ün ilk kısmından 12 soru `in_review` eklendi. Nitelikli yağma ve
  ağırlaşmış yaralama içtimaı, senet yağması, hırsızlık-dolandırıcılık ayrımı,
  karşılıksız elektrik kullanımı, hata sonucu ele geçen eşya, gece vakti,
  zincirleme hırsızlık ve yağmada etkin pişmanlık işlendi.
- Kitaptaki gece vakti hırsızlık artırımını üçte bir gösteren eski açıklama
  güncel TCK m.143 uyarınca **yarı oranı** esas alınarak düzeltildi. Posta
  görevlisinin mektubu açması örneği, haberleşme gizliliği yönünden ek madde
  değerlendirmesi gerektirdiği ve seçenekleri tartışmalı olduğu için alınmadı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **53**, Malvarlığına
  Karşı Suçlar Test III devamı.
- `2026-08-themis-tck-oh-14.json`: Malvarlığına Karşı Suçlar Test III sonu,
  Test IV ve Test V başlangıcından 12 soru `in_review` eklendi. Dolandırıcılığın
  daha az cezayı gerektiren hâli, yağma tehdidinin kapsamı, teslim-zilyetlik
  ayrımına dayalı hırsızlık ve güveni kötüye kullanma, kapkaç, özel zorunluluk,
  akrabalık hükümleri ve senet yağması işlendi.
- Kusur yeteneği olmayan kişinin araç olarak kullanıldığı patlayıcı örneğinde
  yaralama kastı olaydan kesin çıkarılamadığı hâlde kaynak doğrudan kasten
  yaralama kabul ettiği için soru şüpheli bulunarak elendi. Benzer zilyetlik
  soruları farklı teslim biçimleri ve seçenek ayrımları ölçtüğünden alındı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **57**, Malvarlığına
  Karşı Suçlar Test V devamı.
- `2026-08-themis-tck-oh-15.json`: Malvarlığına Karşı Suçlar Test V sonu ile
  Genel Tehlike Yaratan Suçlar Test I'in ilk kısmından 12 soru `in_review`
  eklendi. Unutulan eşya-hırsızlık ayrımı, nitelikli yağma, genel güvenliğin
  kasten ve taksirle tehlikeye sokulması, izinsiz tehlikeli madde ve trafik
  güvenliği suçları işlendi.
- TCK m.170'in 24.12.2025 değişikliğiyle kişilerin toplu bulunduğu yerlerde
  işlenmeye ilişkin yeni artırım ikinci fıkra olmuş; eski ikinci fıkradaki somut
  tehlike şekli üçüncü fıkraya taşınmıştır. Soruların madde atıfları güncel
  numaralandırmaya göre yazıldı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **61**, Genel Tehlike
  Yaratan Suçlar Test I devamı.
- `2026-08-themis-tck-oh-16.json`: Kamunun Sağlığına Karşı Suçlar Test I'in
  ilk kısmından 12 soru `in_review` eklendi. Uyuşturucu imal-ticareti,
  kullanma amacıyla bulundurma, kullanmayı kolaylaştırma, erteleme-denetimli
  serbestlik ve etkin pişmanlık hükümleri işlendi.
- TCK m.191/3'ün 2023 değişikliği güncel metinden doğrulandı: denetimli
  serbestliğin asgari süresi bir yıl, uzatılabilecek toplam ek süre iki yıldır.
  Erteleme dönemindeki tekrar kullanımın bağımsız soruşturma değil ihlal nedeni
  olduğu ayrıca kontrol edildi.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **65**, Kamunun Sağlığına
  Karşı Suçlar Test I devamı.
- `2026-08-themis-tck-oh-17.json`: Kamu Güvenine Karşı Suçlar Test I'den ve
  Kamu Barışına Karşı Suçlar başlangıcından 12 soru `in_review` eklendi.
  Resmî-özel belge ayrımı, açığa imza, kambiyo senedi ve vasiyetnamenin belge
  niteliği, sahte belgenin başka suçta kullanılması, suçu övme ve suç örgütü
  hükümleri işlendi.
- TCK m.220'nin 24.12.2025 değişikliği güncel metinden kontrol edildi: örgüt
  yöneticilerinin faaliyette işlenen suçlardan ayrıca fail olarak sorumluluğu
  korunmuş, çocukların araç olarak kullanılması için yeni artırım eklenmiştir.
  Eski ceza miktarlarına dayanan seçenekler alınmadı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **69**, Kamu Barışına
  Karşı Suçlar Test I devamı.
- `2026-08-themis-tck-oh-18.json`: Kamu Barışına Karşı Suçlar Test I sonu ve
  Test II'den 12 soru `in_review` eklendi. Suç işlemeye tahrik, halkı kin ve
  düşmanlığa tahrik, kanunlara uymamaya tahrik, halkı yanıltıcı bilgi, suçu
  övme, örgüt suçu ve etkin pişmanlık işlendi.
- TCK m.220/6'nın AYM kararıyla iptal edildiği ve 9.7.2025'ten beri yürürlükte
  olmadığı gözetildi; örgüt adına suç işleyene otomatik üyelik cezası öngören
  eski seçenek düzeltilerek kullanılmadı. PDF yaprak 72'de başlayan Ekonomi,
  Sanayi ve Ticarete İlişkin Suçlar bölümü PAEM kapsamı dışında tutulacak.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **73**; ekonomi bölümünü
  tarayarak sonraki PAEM kapsamındaki bölüme geç.
- PDF yaprak **73–75** arasındaki Ekonomi, Sanayi ve Ticarete İlişkin Suçlar
  bölümü PAEM kapsamı dışında olduğu için bütünüyle atlandı.
- `2026-08-themis-tck-oh-19.json`: Bilişim Alanında Suçlar Test I ile Kamu
  İdaresinin Güvenilirliğine ve İşleyişine Karşı Suçlar başlangıcından 12 soru
  `in_review` eklendi. Sisteme girme, veri bozma, sistem aracılığıyla yarar,
  banka kartı, zimmet, direnme ve görevi kötüye kullanma işlendi.
- Belediye veznedarına hata sonucu fazla verilen paranın alıkonulması, kamu
  görevlisinin hatayı doğuran hilesi veya zorlaması bulunmadığından irtikâp
  değil zimmet olarak güncel TCK m.247 ve m.250 ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **81**, Kamu İdaresinin
  Güvenilirliğine ve İşleyişine Karşı Suçlar Test I devamı.
- `2026-08-themis-tck-oh-20.json`: Kamu İdaresinin Güvenilirliğine ve
  İşleyişine Karşı Suçlar Test I sonu ile Test II'nin ilk kısmından 12 soru
  `in_review` eklendi. Rüşvet anlaşması ve teşebbüs, icbar-ikna irtikâbı,
  nüfuz ticareti, nitelikli zimmet ve zimmetin teslim şartları işlendi.
- Görevin gereklerine uygun bir iş için menfaat anlaşmasının da güncel TCK
  m.252 kapsamında rüşvet oluşturduğu; kabul edilmeyen teklif veya talepte
  genel teşebbüs yerine özel yarı oranlı indirim uygulandığı doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **85**, Kamu İdaresinin
  Güvenilirliğine ve İşleyişine Karşı Suçlar Test II devamı.
- `2026-08-themis-tck-oh-21.json`: Kamu İdaresinin Güvenilirliğine ve
  İşleyişine Karşı Suçlar Test II sonu ile Test III'ten 12 soru `in_review`
  eklendi. Rüşvete aracılık, icbar irtikâbı, kamu görevlisinin ticareti,
  zimmette etkin pişmanlık, nüfuz ticareti ve denetim görevinin ihmali işlendi.
- Zimmette etkin pişmanlık için kısmi iadenin yeterli olmadığı, zararın tamamen
  giderilmesi gerektiği; rüşvetin resmî makamlar öğrenmeden bildirilmesinde
  cezasızlık bulunduğu güncel TCK m.248 ve m.254 ile doğrulandı. Bankacılık
  Kanunu'na özgü zimmet sorusu PAEM kapsamı dışında bırakıldı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **89**, Kamu İdaresinin
  Güvenilirliğine ve İşleyişine Karşı Suçlar Test III devamı.
- `2026-08-themis-tck-oh-22.json`: Adliyeye Karşı Suçlar Test I ile Test II
  başlangıcından 12 soru `in_review` eklendi. İftira, suç uydurma, suç üstlenme,
  yalan tanıklık, yalan yere yemin, suçu bildirmeme ve suçluyu kayırma işlendi.
- Öğretmenin reşit olmayanla cinsel ilişki suçundaki konumuna ilişkin tartışmalı
  soru, suçsuz kişilere makul şüpheyle yapılan ihbar örneği ve aynı hukuki ayrımı
  tekrarlayan iftira soruları elendi. İftiranın infaz başladıktan sonraki etkin
  pişmanlık hükmünün hâlen uygulanabildiği güncel TCK m.269/3-c ile doğrulandı.
- Sıradaki tarama noktası: Themis Ceza ÖH PDF yaprak **93**, Adliyeye Karşı
  Suçlar Test II devamı.
- `2026-08-themis-tck-oh-23.json`: Adliyeye Karşı Suçlar Test II sonu ile
  Anayasal Düzene ve Bu Düzenin İşleyişine Karşı Suçlar bölümünden 13 soru
  `in_review` eklendi. Suç uydurma, tanıklıktan çekinme, iftira, Anayasayı
  ihlal, Cumhurbaşkanına suikast ve fiilî saldırı, yasama organına ve Hükûmete
  karşı suç, silahlı isyan, silahlı örgüt, silah sağlama ve suç için anlaşma
  işlendi.
- İşlenmediği bilinen suçu kişinin kendisinin işlediğini bildirmesine ilişkin,
  suç üstlenme ile suç uydurma arasında tereddüt doğuran soru ve tekrar eden
  reşit olmayanla cinsel ilişki sorusu elendi. TCK m.314/3'ün AYM E.2024/81,
  K.2024/189 kararıyla iptal edilip 9.7.2025'te yürürlükten kalktığı gözetildi;
  eski örgüt adına suç işleme seçeneği güncel hükme göre düzeltildi.
- **Themis Ceza Hukuku Özel Hükümler kitabı tamamlandı.** Sıradaki kitap:
  Themis Ceza Muhakemesi Hukuku Soru Kitabı; Drive id
  `1izSsEOhqlG8ZtTDS0QJ-Zl5mkBCZ9TtR`.
- Themis CMK kitabı `/tmp/paemisyon-themis-cmk.pdf` yoluna indirildi; 116 PDF
  yaprağı ve 523 soru içeriyor. `2026-08-themis-cmk-01.json` ile Ceza
  Muhakemesinin Ana Yapısı Test I ve Test II başlangıcından 12 soru
  `in_review` eklendi.
- Şüpheli-sanık, malen sorumlu, suçüstü, toplu suç, müdafi, disiplin hapsi,
  aleniyet, kamu davasının mecburiliği, yazılı bilgiye on günlük cevap süresi
  ve bozmanın sirayeti işlendi. Güncel CMK m.2, 171, 182, 185, 266, 306 ve
  332 ile doğrulandı.
- Sıradaki tarama noktası: Themis CMK PDF yaprak **9**, Ceza Muhakemesinin Ana
  Yapısı Test II devamı.
- `2026-08-themis-cmk-02.json`: Ceza Muhakemesinin Ana Yapısı Test II sonu ile
  Ceza Mahkemelerinin Yargılama Yetkisi Test I başlangıcından 12 soru
  `in_review` eklendi. İfade-sorgu ayrımı, görev ve görevsizlik, suç yeri,
  yedek yetki, yabancı ülkede işlenen suçlar, gemilerde yetki, davanın nakli
  ve yetkisizlik iddiası işlendi.
- Doktriner yoruma açık kamu düzeni-nakil sorusu elendi. Yetkisizlik iddiasının
  CMK m.18'deki aşamalardan sonra ileri sürülemeyeceği ve mahkemenin de resen
  karar veremeyeceği güncel metinle doğrulandı.
- Sıradaki tarama noktası: Themis CMK PDF yaprak **13**, Ceza Mahkemelerinin
  Yargılama Yetkisi Test I devamı.
- `2026-08-themis-cmk-03.json`: Ceza Mahkemelerinin Yargılama Yetkisi Test II
  ile Test III başlangıcından 12 soru `in_review` eklendi. Görevli mahkemenin
  belirlenmesi, kesintisiz suçlarda yetki, yedek yetki sırası, yetkisizlik
  zamanı ve kanun yolu, görevsiz mahkeme işlemleri, görsel-işitsel yayınlar,
  yabancı ülkede işlenen suçlar ve alt mahkemeye gönderme yasağı işlendi.
- Görevli mahkemenin sevk maddesine değil iddianamedeki olay anlatımına göre
  belirlendiği; duruşmada hukuki nitelik değişti diye dosyanın alt dereceli
  mahkemeye gönderilemeyeceği güncel CMK m.4-6 ile doğrulandı.
- Sıradaki tarama noktası: Themis CMK PDF yaprak **17**, Ceza Mahkemelerinin
  Yargılama Yetkisi Test III devamı.

1. Themis'in PAEM'e giren **Soru** ciltleri (kullanıcı izin teyidini aldı):
   Anayasa, Ceza GH, Ceza ÖH, CMK, İdare, İYUK.
2. Gerekirse Themis **Konu** anlatım ciltleri (çıkmış soru içermiyorsa atla).

**PAEM müfredatı dışında olduğu için ATLANACAK kitaplar:** Borçlar, Medeni,
Medeni Usul, Eşya, Miras, Ticaret/Şirketler/Kıymetli Evrak, İcra-İflas, İş,
Milletlerarası Özel Hukuk, Uluslararası Hukuk, Vergi, Maliye-İktisat.

### Drive dosya id'leri (sıradakiler)

| Dosya | id |
|---|---|
| Müessir – İdari Yargılama Hukuku | `1XsnwfAdTaa1OnoCc5EbKNZDcAHI-bT2h` |
| Themis Soru – Anayasa Hukuku | `1FkI4pbgYmk4dOMo7cLDtBABl1h3n3lKX` — ✅ tamamlandı; yayınevi soruları `THEMIS 2025 ANAYASA HUKUKU SORU KİTABI` etiketiyle alındı |
| Themis Soru – Ceza Hukuku Genel Hükümler | `1tWPLSz1c8WFCEQ2pEjSakj-b7V0iG9NZ` |
| Themis Soru – Ceza Hukuku Özel Hükümler | `1_yUAqGBHjHd21lTk025BYOOx2MWSKe0r` |
| Themis Soru – Ceza Muhakemesi Hukuku | `1izSsEOhqlG8ZtTDS0QJ-Zl5mkBCZ9TtR` |
| Themis Soru – İdare Hukuku | `1JBIT_wGbRLmdCehEeUiVHnQDkIwNU2eL` |
| Themis Soru – İdari Yargılama Hukuku | `147qzuye_6TNLMTBiunbARM61r3mx08Dv` |

İşlenmiş olanlar (yeniden indirmeye gerek yok): Müessir Ceza GH
`1EXafK_XC_FvQkmWG0yBBrw8Qvvo412hS`, Müessir Ceza+CMK
`1xleGpM72szzWqSgFqiAHadVFlAtA9kMn`, Müessir Anayasa
`1Cjmk9242POv3xVmC51bO0iFyktOsKoK7`, Müessir İdare
`1Ma38vbPFUglWZ2plI-Xzs_6BA3rncQEV`.

---

## 10. Yol boyunca yakalanan tuzaklar

Bunlar gerçekten yaşandı; benzerleri tekrar çıkabilir:

- **Anayasa m.164 (Kesinhesap) 2017'de tümüyle mülga.** Hükümler m.161'e
  taşınmış. Kitabın atfı eski; doğru maddeyi yaz.
- **Anayasa m.84 son fıkra 2010'da mülga.** Partisinin kapatılmasına sebep olan
  milletvekilinin milletvekilliği artık düşmez.
- **Kabahatler m.42/A 8 Mayıs 2025'te (7547) başlığıyla birlikte değişti.**
  Yetkili makam (il valileri) ve tekerrürde iki kat kuralı korundu, tutarlar
  değişti.
- **İYUK istinaf/temyiz parasal sınırları** 2024 (9. Yargı Paketi) ve AYM'nin
  11.02.2025 kararıyla değişti; iptal 6.12.2025'te yürürlüğe girdi. Bu yüzden
  parasal sınır soruları alınmıyor (bkz. kural 5).
- **Kitapta dizgi hatalı cevap harfi** birkaç kez görüldü (örn. 5302 sayılı
  Kanun'un iş yeri kapatma sorusunda gerekçe "il encümeni" derken harf "il genel
  meclisi" basılmış). Gerekçe nettse gerekçeyi esas al.
- **Çift cevaplı / kanunla çelişen sorular** elendi (2009 KPSS kast sorusu,
  2007 Ziraat süreli kanun sorusu vb.).
- Prisma ilişkileri: `questionVersion` üzerinde `status` ve `stem` var;
  `question` üzerinde `topicId`. Filtrelerken
  `where:{status:"in_review", question:{topicId:"..."}}` kullan.
  `questionOption` → `questionVersion` ilişkisi `questionVersion` adıyla.

---

## 11. Kullanıcıyla çalışma biçimi

- İletişim **Türkçe**. Kullanıcı solo geliştirici; teknik ortak gibi konuş.
- Her partiden sonra kısa rapor: kaç soru, hangi bölüm, ne elendi ve neden,
  mevzuatta yakalanan bir şey varsa onu belirt.
- Sorular `in_review` düşer; **yayınlama kullanıcının işidir**. Kullanıcı peyder
  peyder onaylıyor.
- Büyük özelliklerde plan → onay → uygulama. Soru partileri için bu döngü
  gerekmiyor; kullanıcı "devam et" dedikçe sıradaki bölüm işlenir.
