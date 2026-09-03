# GECE OTOMASYONU — DURUM

Bu dosya isin TEK KALICI DEVIR NOTUDUR. Oturum degistiginde once bu dosya okunur.
(2 Eyl 2026'da scratchpad'den buraya tasindi: scratchpad oturuma bagli gecici bir
dizindir, oturum kapaninca silinir. Durum notu orada tutulmaz.)

## !!! 3 EYL 2026 CRON TURU ICIN: **GECE-TALIMATI-3.md** OKU
20 dakikada bir calisan cron turu bu dosyaya gore isler. Sira: CMK'nin kalani ->
Idare Hukuku -> Idari Yargilama Hukuku. Kullanici karari: **kapsam degil kalite**;
supheli/mukerrere yakin soru ALINMAZ, bir sayfadan sifir soru cikmasi normaldir.

## !! ONCE OKU: GECE-AKIS.md  (kota-optimize is akisi, 2 Eyl 2026)
Sayfa gorsellerini ANA DONGUDE OKUMA — GECE-SAYFA-OKUYUCU.md'deki alt ajan sablonunu kullan.
Denetimi her partide degil, 30-40 soru birikince tek turda calistir.
Oturumu uzun tutma; ~30-40 soruda bir kapat, yeni oturumda bu dosyayla devam et.

### Gecici dosyalar — yeni oturumda yeniden uretilir
`<scratchpad>` = o oturumun kendi scratchpad dizini. Icindekiler kaybolursa:
- Sayfa gorselleri (200 dpi):
  `pdftoppm -png -r 200 ~/Downloads/"Themis Soru - Ceza Hukuku Özel Hükümler.pdf" <scratchpad>/ozel-png/s`
- Tek sayfayi cevap kutusu icin 500 dpi basmak:
  `pdftoppm -png -r 500 -f <N> -l <N> ~/Downloads/"Themis Soru - Ceza Hukuku Özel Hükümler.pdf" <scratchpad>/hi-s<N>`
- `kirp` araci (kirp.swift'ten): `swiftc -O kirp.swift -o kirp`
  Kullanim: `./kirp <kaynak.png> <cikti.png> <x> <y> <genislik> <yukseklik>`
- `denetim-hat.js` (denetim workflow scripti) scratchpad'de tutulur; kaybolursa
  Workflow tool'unun oturum dizinindeki kayitli script kopyasindan geri alinir.

## Nerede kaldim
### GENEL HUKUMLER KITABI — **BITTI** (s-001..s-104 tamamlandi, s-104 kaynakca)
### AKTIF KITAP: **Themis Soru - Ceza Muhakemesi Hukuku** (Ismail Ercan) — 2 Eyl 2026 basladi
- PDF: ~/Downloads/Themis Soru - Ceza Muhakemesi Hukuku.pdf (116 sayfa, taranmis, metin katmani YOK)
- Gorseller: `<scratchpad>/cmk-png/s-001..s-116.png` (200 dpi)
  Yeniden uretmek icin:
  `pdftoppm -png -r 200 ~/Downloads/"Themis Soru - Ceza Muhakemesi Hukuku.pdf" <scratchpad>/cmk-png/s`
- Konu id (CMK): `25ddf5a1-9364-4c66-bd74-5d5bb71b21ff`
- sourceLabel: "THEMIS 2025 CEZA MUHAKEMESI HUKUKU SORU KITABI" (her partide temizlenir)

#### KAPSAM KURALI (kullanici karari, 2 Eyl 2026) — BAGLAYICI
**Yalnizca bankada HIC KARSILIGI OLMAYAN sorular alinir.** Dolu bolgeler sayfa sayfa
taranmaz. Ozel Hukumler kitabinda ogrenilen ders: verim, bankadaki mevcut yogunlukla
ters orantili (bos bolum %50, dolu bolum %0-15).

#### KUYRUKTAKI 454 SORUYA DOKUNULMAYACAK (kullanici karari)
CMK kuyrugunda 13 Agustos'tan kalma 454 soru var; parmak izi karsilastirmasi bunlarin
**397'sinin yayindaki bir soruyla BIREBIR ayni** oldugunu (kok + tum sik metinleri),
295'inin de kuyrugun kendi icinde tekrar oldugunu gosterdi. Kullanici ARSIVLENMEMESINE
karar verdi — dokunma, sadece mukerrer filtresi olarak kullan.

#### MUKERRER TARAMASI ARTIK ELLE DEGIL, BETIKLE
- `<scratchpad>/cmk-mevcut.json` — bankadaki TUM CMK sorulari (yayinda 453 + kuyrukta 454
  = 907), kok + sik metinleriyle. Yenilemek icin prisma sorgusu (bkz. oturum gecmisi).
- `<scratchpad>/mukerrer-tara.py <aday.json> [...]` — alt ajan ciktisini bankadaki
  TUM CMK sorulariyla UC KADEMEDE karsilastirir:
  (1) TAM parmak izi (kok + tum sik metinleri), (2) salt kok,
  (3) YAKIN — kok kelime ortusmesi >=%60 **VE** sik kelime ortusmesi >=%35.
  Ucuncu katman isim/yas/rakam degistirilerek yeniden yazilmis varyantlari yakalar;
  Ozel Hukumler'de alti mukerrerin bankaya girmesine yol acan bosluk tam buydu.

  **IKI DUZELTME (2 Eyl 2026, yanlis pozitiflerden sonra):**
  a) Kalip kelimeler (GURULTU listesi) elenir: "5271 sayili Ceza Muhakemesi Yasasi'na
     gore ... asagidakilerden hangisi yanlistir?" kalibi alakasiz iki soruyu %60+
     benzer gosteriyordu.
  b) YAKIN katmani artik SIK BENZERLIGI de arar. Ayni kurali ayni kurguyla olcen
     sorular siklarini da paylasir; kok benzerligi tek basina yetmez.
  Bu iki duzeltmeden once s-092..s-095 partisinde 4 isaretin 3'u YANLIS POZITIFTI
  (iddianamenin iadesi <-> yargilama giderleri gibi). Duzeltme sonrasi 1 gercek
  mukerrer kaldi ve temiz sayisi 10 -> 13 yukseldi.

  **REGRESYON TESTI:** yayina alinmis bir partinin okunan-JSON'unu yeniden tara;
  o partideki her soru [TAM] olarak yakalanmali. b01 icin dogrulandi (30/30 TAM).
  Ayrica `oz-test.json` sentetik testi: birebir kopya + isim degistirilmis varyant
  yakalanmali, gercekten yeni soru gecmelidir.
- Alt ajanlara "YIGILMA KONTROLU YAPMA" denir; onlar yalniz doktrin/celiski/eskime eler,
  mukerrer islemini betik yapar. Boylece geri cagirma (recall) yuksek kalir.

#### BANKADA HIC SORUSU OLMAYAN CMK BLOKLARI (hedef sirasi)
335 maddenin 190'inda soru yok. Buyuk bloklar ve konulari:
- m.113-126 guvence, arama usulu (gece aramasi, hazir bulunacaklar), elkoyma, Devlet sirri
- m.164-169 adli kolluk ve gorevi
- m.177-184 sanigin savunma delilleri, durusmanin acikligi
- **m.207-216 durusmada okunacak/okunmayacak belgeler, onceki ifadenin okunmasi**
- m.254-259 mahkemede uzlastirma, musadere usulu
- m.277-282 istinaf usulu · **m.300-307 temyiz usulu, Yargitay'in esasa hukmedecegi haller**
- m.312-323 yargilamanin yenilenmesi · m.324-330 yargilama giderleri

#### KITAP BOLUM HARITASI (gorsel tarama, 2 Eyl 2026)
1.Kisim Giris s-006 · 2.Kisim Sujeler s-033 · 3.Kisim Ispat s-042 · 4.Kisim Koruma tedbirleri s-053
5.Kisim Evreler s-075 · **6.Kisim Yasa yollari s-092** (olaganustu yasa yollari s-100..s-107)
**7.Kisim Muhakeme giderleri s-107** · 8.Kisim Ozel muhakeme usulleri s-112 · SON s-116

#### NEREDE KALDIM
**PARTI b01 KAPANDI (2 Eyl 2026).** s-104..s-111 okundu: 37 soru -> 3 alt ajan elemesi,
4 mukerrer -> 30 soru bankaya girdi (`themis-cmk-b01.json`), denetimden **28'i yayimlanabilir**
cikti ve YAYINA ALINDI. Run: wf_3a65dbab-c5d.

Kalan 2 soru KURTARILDI (run wf_4ae2f71f-673) ve yayina alindi:
- `7069ffbf` (m.306 bozmanin sirayeti) — kusur degildi: iki denetciden biri bu soruyu
  hic dondurmedi (11/12), birlestirmede dustu. Ayni kume ile yeniden calistirildi -> yayimlanabilir.
- `686c3a04` (m.256 musadere muhakemesi) — belirsizdi; denetci "III'teki madde bakimindan
  yetkisizlik hali m.256 metninde duzenlenmemis" demisti. **m.5 kumeye elle enjekte edilince
  cozuldu**: denetci III'u m.5/1 ile curutup yayimlanabilir dedi. Bu, hedefli-kume'nin
  varlik nedeninin tipik ornegi — sorunun dayanagi kendi maddesinde degil komsu kurumda.

**PARTI b01 NIHAI: 30/30 yayimlanabilir, kusurlu 0, belirsiz 0.**
Banka: CMK 453 -> **483 yayinda**, toplam 5.500 -> **5.530**. CMK kuyrugu bos.
Hedeflenen bos bloklarin son durumu: m.324-330 giderler 6 soru (once 0),
m.312-323 yenileme 3 (once 0), m.300-307 temyiz usulu 1 (once 0),
m.254-259 uzlastirma/musadere 1 (once 0).

**VERIM: s-104..s-111 -> okunan 37, bankaya giren 30 (%81).** Onceki kitabin dolu
bolgelerinde bu oran %4-19'du. Bos bolge hedeflemesi dogrulandi.

#### PARTI b02 KAPANDI (2 Eyl 2026)
s-092..s-095 + s-112..s-116 okundu: 34 soru -> 1 eskime elemesi (HAGB m.231/5, AYM
iptali 1/8/2024), 1 mukerrer -> 32 soru bankaya girdi (`themis-cmk-b02.json`).
Denetim: **31 yayimlanabilir, 1 KUSURLU** (run wf_7d4a4887-3f9). 31'i yayina alindi.

**KUSURLU — `e8b6c891`, kuyrukta bekliyor, YAYINA ALINMADI:**
Uzlastirma teklifi sorusu ("hangisi yanlistir"). Isaretli A gercekten yanlis (m.253/8:
teklif delil toplanmasina ve koruma tedbirlerine engel DEGILDIR). Ama D sikki da yanlis:
"3 gun icinde bildirmezse reddetmis sayilir" diyor, oysa m.253/4 **7/11/2024 tarihli 7531
sayili Kanunla YEDI GUNE cikarilmis**. Iki yanlis sik -> soru kusurlu. Uc karsi-dogrulayici
da onayladi (0 curuten). Talimat geregi otomatik uygulanmadi; kullanici karari bekliyor.
Secenekler: (a) D sikkindaki "3 gun" -> "7 gun" duzeltilip soru saglamlastirilir
(o zaman tek yanlis sik A kalir), (b) `kuyruk-arsivle.ts` ile elenir.

**DIKKAT — ayni hata benim aciklamamda da vardi:** b02 icin yazdigim aciklamada
m.253/4 suresini "UC GUN" diye yazmistim; eski metne guvenmistim. Denetim hatti
hem sorudaki hem benim aciklamamdaki hatayi yakaladi. DERS: sure iceren her
aciklamayi madde metninden BIREBIR dogrula, hafizadan yazma.

#### PARTI b03 KAPANDI (2 Eyl 2026)
s-084..s-091 okundu: 37 soru -> 3 eleme (1 celiski, 1 dizgi hatasi, 1 eskime),
4 mukerrer -> 30 soru girdi. Denetim: **29 yayimlanabilir, 1 belirsiz** (run wf_5a82f607-2e4).
29'u yayina alindi; belirsiz olan `248af4ee` arsivlendi.

**ARSIVLENEN `248af4ee`** — "kapali yapilmasi gereken durusma acik yapilirsa yasa
yolunda sonucu ne olur?" Iki denetci anlasmadi. Cevap, m.289/1-f'deki "ACIKLIK
KURALININ ihlali" ibaresinin kapsamina iliskin bir YORUMA dayaniyor; ibarenin ters
yonu (kapaliliga aykirilik) metinden kesin cikarilamiyor ve baska hicbir hukum
kesinlestirmiyor. Dayanak kanun metninde olmadigi icin hedefli-kume ile kurtarma
da mumkun degildi.

**GERI ALINAN `s-084 S.5`** — alt ajan "m.231/5'teki 2 yil siniri AYM iptaliyle kalkti"
diye elemisti; bu bilgi BENIM TALIMATIMDAN geliyordu ve ESKIMISTI. Gercek zincir:
5560 (2006) -> AYM iptali (1/8/2024) -> **7589 s.K. (16/7/2026) YENIDEN yururluge
koydu** -> AYM 10/7/2025 karari 30/9/2026'da yeniden iptal edecek. Soru geri alindi
ve denetimden yayimlanabilir cikti.

#### !!! ZAMANLI RISK — HAGB 30 EYLUL 2026'DA DUSUYOR
Anayasa Mahkemesinin **10/7/2025 tarihli E:2024/98, K:2025/149** karari CMK m.231'in
**5-14. fikralarinin TAMAMINI** iptal etti; karar **30/9/2026'da yururluge giriyor**.
Yasama yeniden duzenlemezse HAGB'nin tum kosullari, denetim suresi ve sonuclari
o tarihte yururlukten kalkacak.
**Maruziyet: bankada YAYINDA 10 HAGB sorusu** (m.231 etiketli) + TCK'da 1 soru.
YAPILACAK: 30 Eylul'de `eskime-tara.ts` calistir (ajan kullanmaz, maliyeti sifir);
yasama yeniden duzenlemediyse m.231 etiketli sorulari gozden gecir.

#### PARTI b04 KAPANDI (2 Eyl 2026)
s-096..s-103 okundu: 31 soru -> 5 eleme, 1 mukerrer -> 25 soru girdi.
Denetim: **25/25 yayimlanabilir** (run wf_2e0ab045-806 + kurtarma wf_2e0fda1f-b74).
Elemeler: 2 eskime (m.308 itiraz suresi 7589 s.K. ile UC AY oldu, kitap "1 ay" diyor),
1 IBK kaynakli kural, 1 doktrin, 1 DIZGI HATASI (s-098 S.6'nin III. onculu KENDINE atif
yapiyor: "III numaralı öncül yanlış olurdu"; cevap ancak "II" okunursa tutuyor).

**HAT DAVRANISI — SAYIM KONTROLU YINE IS GORDU:** 25 gonderildi, sonucta 24 geldi;
`6b8c465a` iki denetciden biri tarafindan hic dondurulmedi. Kurtarma turunda
yayimlanabilir cikti. Bu, b01'de de yasanmisti — **her denetimden sonra
"haritada N = sonucta N" kontrolu SART.**

#### CMK KITABI — TOPLAM (2 Eyl 2026)
| parti | sayfalar | okunan | giren | yayinlanan |
|---|---|---|---|---|
| b01 | s-104..s-111 | 37 | 30 | 30 |
| b02 | s-092..s-095, s-112..s-116 | 34 | 32 | 31 |
| b03 | s-084..s-091 | 37 | 30 | 29 |
| b04 | s-096..s-103 | 31 | 25 | 25 |
| **toplam** | **36 sayfa** | **139** | **117** | **115** |
Banka: CMK 453 -> **568**, toplam 5.500 -> **5.615**.

#### !! m.277-282 HALA BOS (istinaf usulu)
b04 istinaf/temyiz sayfalarini okudu ama sorular m.286, m.291, m.294, m.306-311
etrafinda toplandi; **m.277-282 (BAM'da tevzi, on inceleme, durusma hazirligi,
istisnalar) icin kitapta soru CIKMADI**. Bu bosluk bu kitaptan doldurulamiyor
gorunuyor; baska bir kaynak gerekebilir.

#### PARTI b05 KAPANDI — KORUMA TEDBIRLERI (2 Eyl 2026)
s-060..s-067 okundu: 36 soru -> 3 eleme + 1 supheli -> 32 girdi. Mukerrer SIFIR.
Denetim (run wf_f5aa989d-77d + kurtarma wf_a2abb456-3ba):
**28 yayimlanabilir · 2 kusurlu · 2 kaynaksiz/belirsiz** — hepsi arsivlendi.
Bu, kitabin EN COK KUSUR CIKAN bolgesi: sure, merci ve katalog ayrintisi yogun.

**Arsivlenenler ve sebepleri:**
- `cfe44cb8` KUSURLU — "hangisi dogrudur"da IKI dogru sik: m.128/3 tapu serhi dogru,
  ama D de dogru cunku guveni kotuye kullanma m.128/2-a-5'te katalog sucu.
- `f30e5b75` KUSURLU — isaretli D metne aykiri (karar mercii hakim, agir ceza degil)
  ama B ve C de onay merciini "mahkeme" gostererek m.135/1'e aykiri; coklu yanlis sik.
- `2171a3f5` KAYNAKSIZ — dayanagi 6384 s.K. m.5 (gorev uyusmazligini Ankara BAM cozer);
  **6384 BANKADA YOK**. Eklenirse arsiv-geri-al.ts ile geri alinir.
- `eff07887` BELIRSIZ — "tutuklama kararini kendiliginden hukumsuz kilmayan". Isaretli E
  (durma) m.223/8 ile savunulabiliyor ama celdiricilerin dogrulugu (beraat/erteleme/KYOK'un
  tutuklulugu kendiliginden bitirmesi) CMK'da tek hukumle duzenlenmemis. Kurtarma turunda
  m.101/103/104/109/223 enjekte edildi, yine kesinlesmedi.

**KURTARILANLAR:** `53e54705` (bir denetci dondurmemisti) ve `7ae3ac73` (Anayasa m.83
enjekte edilince cozuldu — milletvekili dokunulmazligi ARAMAYI kapsamaz).

#### !! MEVZUAT EKSIGI: 6384 sayili Tazminat Komisyonu Kanunu bankada yok.
Koruma tedbirleri tazminat sorulari bu kanuna dayaniyor. mevzuat.gov.tr arama API'si ile
cekilip `mevzuat-json-import.ts` ile eklenebilir.

#### PARTI b06 KAPANDI — ISPAT (3 Eyl 2026)
s-042..s-052 okundu: **49 soru -> 33 bankaya girdi**, denetim 33/33 yayimlanabilir,
kusurlu 0, belirsiz 0. Run: wf_b066664d-d65. Banka: CMK 596 -> **629 yayinda**.
Elemeler: 2 kural disi (1 doktrin "sanik tanik olamaz", 1 ictihat "rizayla arama"),
1 supheli (s-045 S.10 cevap kutusu kesik), **8 banka mukerreri**, **5 parti ici tekrar**.
Bosalan bloklar: m.43-73 (taniklik/yemin/bilirkisi/m.73 sahte para), m.83-89
(kesif, yer gosterme, olu muayenesi, otopsi).

Bu partide ogrenilen uc sey ARACA DONUSTU:
- `ic-tarama.py` — PARTI ICI mukerrer taramasi. `mukerrer-tara.py` yalniz bankayla
  karsilastiriyordu; ardisik sayfalarda ayni kurali soran ciftler temiz gecip
  partiyle birlikte iceri giriyordu. 5 tekrar bu betikle ve elle yakalandi.
- `karsilastir.py` — aday ile bankadaki esini yan yana doker. Tarayici YANLIS esi
  isaretleyebiliyor (bir soruda oyle oldu; gercek es elle bulundu), o yuzden her
  isaret elle bakilir.
- Harita eslestirmesi artik **kok+SIK** anahtariyla. Iki otopsi sorusunun kokU
  birebir aynidir; kok bazli eslestirme birini sessizce eziyordu (33 -> 32).

#### PARTI b07 KAPANDI — KORUMA TEDBIRLERI Test-II/III (3 Eyl 2026)
s-053..s-059 ve s-068 okundu: **35 soru -> 26 bankaya girdi**, denetim 26/26
yayimlanabilir, kusurlu 0, belirsiz 0. Run: wf_79f1526d-244. CMK 629 -> **655**.
Banka toplam 5.557.

9 eleme. Cogu ayni turden: **cevap disindaki bir sik da yanlisti** (belirsiz soru).
- s-058 S.2 — m.100/3 katalogu. Kitap "kamu gorevlisine hakaret"i cevap saymis ama
  "KADINA KARSI kasten yaralama" da katalogda YOK: CMK m.100/3-a-4, TCK m.86/3'un
  b, e ve f bentlerine atif yapar; f bendi CANAVARCA HISLE'dir. "Kadina karsi"
  m.86/3'un hicbir bendinde gecmez, yalniz m.86/2 son cumlede alt sinir artisi olarak
  vardir. Iki dogru cevap -> elendi.
- s-057 S.13 — m.248/5'te yurt ici/yurt disi ayrimi YOK ("Kacak hakkinda ... yoklugunda
  tutuklama karari verilebilir"); soru bu ayrimi dogru varsayiyor.
- s-056 S.7 — m.120/1 "hazir BULUNABILIR" derken sik "bulundurulur" diyor (hak -> yukumluluk).
- s-055 S.4 — cevabin yanlisligi Adli ve Onleme Aramalari Yonetmeligi'nden cikiyor,
  kokteki kanundan degil.
- 2 banka mukerreri (m.102 cocuk orani aynadan, m.98 ayni bes olguyla), 1 supheli (6384),
  2 kapsam ortusmesi (m.94/3 ve m.140 zaten kapli).

**YAYINDA HATA DUZELTILDI:** `2b9645f7` (published, m.100) aciklamasi m.86/3-b bendini
"kadina karsi" diye tanitiyordu; dogrusu "beden veya ruh bakimindan kendisini
savunamayacak durumda bulunan kisiye karsi". Sorunun cevabi (irtikap) etkilenmedi ama
aciklama yanlis bilgi ogretiyordu. Duzeltildi, eski metin
`aciklama-duzeltme-yedek-2b9645f7.json`'a yedeklendi, deftere islendi.

#### PARTI b08 KAPANDI — koruma tedbirlerinin kalani + MUHAKEMENIN EVRELERI (3 Eyl 2026)
s-069..s-076 okundu: **29 aday -> 15 bankaya girdi**, denetim 16/16 yayimlanabilir
(1'i yigilma nedeniyle kuyruktan elendi). Run: wf_a4d3262d-d97. CMK 655 -> **670**.
Banka toplam 5.572.

**KENDI ELEMEMI GERI ALDIM — bunu bir daha yapma:** b07'de `s-058 S.2`yi
"kadina karsi kasten yaralama da katalog disi, iki dogru cevap var" diye elemistim.
YANLISTI. CMK m.100/3'un katalogu TCK m.86/3'e yapilan atifla BITMIYOR; maddenin
kendi bentleri var ve bunlar sonradan eklendi:
  (i) 7406 s.K. (12/5/2022) — KADINA KARSI islenen kasten yaralama
  (j) 7406 s.K. (12/5/2022) — saglik personeline karsi kasten yaralama
  (k) 7528 s.K. (10/10/2024) — ogretmenlere karsi kasten yaralama
DERS: bir maddenin katalogunu "atif yapilan yerden" okuyup birakma; maddenin
KENDI bentlerinin sonuna kadar in. Ucunun de konusu KASTEN YARALAMADIR — ayni
kisilere karsi TEHDIT veya hakaret katalogda YOKTUR (s-071 S.13 bunu olcuyor).

**YAYINDA IKI DUZELTME (ikisi de `2b9645f7`, published, m.100):**
1. Aciklama m.86/3-b bendini "kadina karsi" diye tanitiyordu; dogrusu "beden veya
   ruh bakimindan kendisini savunamayacak durumda bulunan kisiye karsi".
2. Katalog dokumu (h) bendinde bitiyordu; (i), (j), (k) bentleri eklendi.
Yedekler: `aciklama-duzeltme-yedek-2b9645f7.json`, `aciklama-tamamlama-yedek-2b9645f7.json`.

#### BOS MADDE SINYALI (b08'de olculdu)
m.95, m.122, m.219, m.221 -> bankada **0 soru**. m.191 ve m.229 -> 1'er soru.
Buna karsilik m.223 -> 18, m.135 -> 13, m.142 -> 7, m.119 -> 6 soru.
**s-075 sonrasi bolge (Besinci Kisim, muhakemenin evreleri) BAKIR:** 13 adaydan
tarama yalnizca 1 mukerrer buldu. Cron oradan verimli devam eder.

#### ZAMANLI RISKLER (eskime-tara.ts ile izlenecek)
- **30 Eylul 2026** — AYM, CMK m.231 5-14. fikralari (HAGB) iptali yururluge girer.
  s-076 S.6 bu yuzden "supheli" birakildi, alinmadi.
- **16 Nisan 2027** — AYM E.2025/18 karariyla iptal edilen hukum yururluge girer
  (m.229-230 civari; dipnot 74). Tarih gelmeden dokuman uzerinden dogrulanmali.

#### PARTI b09 KAPANDI — MUHAKEMENIN EVRELERI (3 Eyl 2026)
s-077..s-080 okundu: **20 soru -> 11 bankaya girdi**, denetim 11/11 yayimlanabilir,
kusurlu 0. Run: wf_1ab6bc4a-7d2. CMK 670 -> **681**. Banka 5.583.

9 eleme (1 supheli HAGB, 1 kitap kendi cozumuyle celisiyor, 7 ana dongude):
- m.171 bankada 11 soruyla dolu: "kac yil erteleme" (ed381efd) ve ayni senaryonun
  diger yarisi (03435956) zaten vardi -> 2 eleme.
- m.223 bankada 18 soruyla dolu; iki aday "zorunluluk hali" noktasinda kesisiyordu,
  ucu birden ayirt eden zengin olani tutuldu -> 1 eleme.
- **2 soru ozunde TCK'ydi** (m.64 hukumlunun olumu, m.33 sagir-dilsiz). CMK
  konusuna dosyalanirsa articleNo/topic bagi bozulur; denetim articleNo'yu
  dogrulanan dayanaga bagliyor, "TCK m.64" bir CMK sorusunda tutarsiz kalir.
  Ileride TCK gecisi yapilirsa oradan alinabilir.
- 1 soru cevabini kanundan degil doktrin teriminden aliyordu ("hukuksal kesinti");
  m.225/2 mahkemeyi hukuki nitelendirmeyle baglamadigi icin terim tartismali.

**DOGRULANAN SEY:** "takdiri KYOK'a itiraz edilemez" kuralini doktrin sandim,
kanunda acikca yaziyor — **CMK m.173/5**. Ezberden eleme yapma, maddeyi ac.

#### BOS MADDE DOLDURULDU (b09)
m.182 (durusmanin acikligi), m.194, m.195, m.204 -> hepsi 0 soruydu.
m.170, m.201, m.207, m.216, m.232 -> 1'er soruydu.
Ozellikle degerli iki ayrim bankaya girdi:
- m.182/3 (kapalilik karari ve HUKUM ACIK durusmada aciklanir) ile m.185
  (sanik 18 yasini doldurmamissa HUKUM DE KAPALI durusmada aciklanir) karsitligi.
- m.201/2: heyet uyeleri DOGRUDAN soru sorar; baskan aracaligi yalnizca sanik
  ve katilan icindir.

#### !!! DOYGUNLUK ESIGINE ULASILDI — s-081..s-083 ve s-006 (3 Eyl 2026)
**21 soru okundu, YALNIZ 4'U ALINDI.** Bu, kitabin bu bolgesinde bankanin
DOLDUGUNU gosteriyor. Uc soru BIREBIR mukerrerdi (yalniz isimler degismis):
`s-006 S.1` -> ffe5bedc, `s-006 S.4` -> 29623d02, `s-081 S.2` -> c859f0bb.

Madde doygunluk sayilari (3 Eyl 2026, CMK 681 iken):
  m.2 -> 26 · m.223 -> 20 · m.135 -> 13 · m.171 -> 12 · m.174 -> 10
  m.142 -> 7 · m.173 -> 6 · m.119 -> 6
**m.223 tamamen doygun:** 6 aday geldi, ALTISI DA elendi. Bankada ayni kokle bir
soru (a5cbff23), m.223/4 icin ayri bir soru (037d4774), hukum listesi icin iki soru
(d3698d28, d458e184), zorunluluk/mesru savunma senaryolari icin uc soru
(5485ca93, fb35535e, 675b112d) zaten var.

**SONUC — s-001..s-041 BLOGU MUHTEMELEN DUSUK VERIMLI.** s-006'daki 5 sorudan
2'si birebir mukerrer, 1'i doktrin, 1'i doygun m.2'ye dustu; yalniz 1 soru gecti.
Kitabin giris bolumu bankaya buyuk olcude girmis gorunuyor. Bu blokta sayfa basina
0-1 soru beklenmeli; SIFIR SORU CIKMASI NORMALDIR, zorlanmayacak.

#### PARTI b10 KAPANDI (3 Eyl 2026) — denetim 4/4 yayimlanabilir, kusurlu 0.
Run: wf_17fcf3f7-5ef. CMK 681 -> **685**. Banka 5.587.

**DOGRULANAN GUVENLIK:** `513df6d1`in dayanagi TCK m.73 (sikayet suresi). Denetci
`dogruKanun: "Türk Ceza Kanunu"` dondurdu ve `denetim-yayinla.ts` articleNo'yu
YAZMADI — betikte zaten `dogruKanun === topic.name` kosulu var (satir 66,
"baska kanuna dayanan soruda articleNo yaniltici olurdu"). Aksi halde CMK
konusunda "m.73" yazacakti ve CMK m.73 SAHTE PARA INCELEMELERIDIR. Yani CMK
konusunda TCK dayanakli soru tutmak guvenli; articleNo bos kaliyor.

#### PARTI b10 — icerik
4 soru: m.226 (ek savunma — bankada 1 soru), m.4 (gorevsizlik her asamada resen;
m.18 yetkisizlik ve m.25 hakimin reddi ise sorgudan once — m.4 bankada 0),
m.225 (davasiz yargilama olmaz; CMK'da sozlu dava usulu YOK — m.225 bankada 0),
m.158 + TCK m.73 (sikayet suresi ALTI AY; sure CMK'da degil TCK'dadir).
harita-kur.py'ye TCK eslemesi eklendi (s-083 S.11'in dayanagi TCK m.73).

#### !!!! CMK KITABI KAPANDI — 3 Eyl 2026 !!!!
**Themis Soru - Ceza Muhakemesi Hukuku BITTI. Yeniden okumaya deger sayfa YOK.**

KARARIN DAYANAGI — tahmin degil, olcum:
1. **Dogrudan test:** s-007..s-016 (10 sayfa, 1. Kismin Giris ve Gorev-Yetki
   bolumleri) okundu -> **45 aday, ICE AKTARILABILIR SIFIR SORU.** Aday havuzunun
   tamami ya bankada zaten vardi, ya doktrine dayaniyordu, ya da bankada olmayan
   bir mevzuata (5235 s.K.) dayaniyordu.
2. **Tarayici bu bolgede YETERSIZ kaldi** — ders: `mukerrer-tara.py` senaryo
   sorularinda esikleri asamiyor, cunku adaylar "(A)/(B)" kullanirken banka ISIM
   kullaniyor. Bankadaki sorulari MADDEYE GORE listeleyince gercek ortaya cikti:
     m.18 -> 4 adayin 4'u de bankada (ucu "sorgudan once"yi ayri ayri soruyor)
     m.13 -> 3 adayin 3'u de bankada (biri ayni sehirle, Elazig, ayni senaryo)
     m.12 -> Eskisehir-Bursa-Isparta ve Kayseri-Ankara-Aksaray senaryolari BIREBIR
     m.14 -> 4 adayin 4'u de; m.19 -> 3'un 3'u; m.15, m.6, m.7, m.20, m.332 -> hepsi
   **YENI YONTEM: bir bolgeye girmeden once bankayi MADDEYE GORE dok, tarayiciya
   tek basina guvenme.** (`python3 -c` ile cmk-mevcut.json'u madde bazli grupla.)
3. **Kalan bolgelerin yogunlugu olculdu (CMK 685 iken):**
     temel kavramlar m.1-21 -> 71 soru
     sureler + adli tatil m.34-46, 331-333 -> 28 soru (m.39 tek basina 9)
     mudafi m.149-157 -> 16 · hakimin reddi m.22-31 -> 14 · magdur/katilan m.233-239 -> 14
   Bu bloklar s-017..s-041'in tamamini kapsiyor. Okunacak yeni sey yok.
4. Tek bos cep **m.164-169 (adli kolluk, 6 madde 0 soru)** ama bu 5. Kisma ait ve
   s-075..s-091 zaten okundu; kitapta bu maddelere soru YOK.

**CMK NIHAI: 453 -> 685 yayinda** (b01..b10, on parti). Banka 5.587.

---

## AKTIF KITAP (3 Eyl 2026'dan itibaren): **Themis Soru - Idare Hukuku**

- PDF: `~/Downloads/Themis Soru - Idare Hukuku.pdf` (118 sayfa)
- Gorseller: `<scratchpad>/idare-png/s-NNN.png` (uretiliyor)
  `pdftoppm -png -r 200 -f 1 -l 118 "$HOME/Downloads/Themis Soru - Idare Hukuku.pdf" <scratchpad>/idare-png/s`
- Sonraki kitap: `~/Downloads/Themis Soru - Idari Yargilama Hukuku.pdf` (88 sayfa)
- **Konu anlatimi ACIKLAMA icin kullanilabilir** (kullanici karari, 3 Eyl):
  `~/Downloads/Themis Konu - Idare Hukuku.pdf` (148 sayfa). SORU URETILMEZ.

### KESIF TAMAM (3 Eyl 2026) — asagidaki sabitler olculdu

**TOPIC:** `b396a7c3-6f30-490e-9401-4be88e87a91b` = "İdare Hukuku" — **262 soru var.**
Gorseller hazir: `<scratchpad>/idare-png/s-001..s-118.png` (118 sayfa).

**Bankadaki ilgili konularin soru sayilari:**
  Idare Hukuku 262 · 4982 Bilgi Edinme 106 · 657 DMK 99 · 2577 IYUK 58
  5442 Il Idaresi 32 · 4483 Memurlarin Yargilanmasi 30 · 5393 Belediye 19
  5302 Il Ozel Idaresi 12 · 2576 BIM 5 · 3071 Dilekce 5+2

**Bankadaki ilgili MEVZUAT (madde sayisi):**
  657 DMK 337 · 5393 Belediye 101 · 2577 IYUK 82 · 5442 Il Idaresi 77
  5302 Il Ozel Idaresi 78 · 2576 BIM 48 · 4982 Bilgi Edinme 33
  4483 Memurlarin Yargilanmasi 25 · 3071 Dilekce 12
  **2575 DANISTAY KANUNU -> 3 Eyl 2026'da EKLENDI: 138 madde, 10 bolum, yayinda.**
  slug `2575-danistay-kanunu`, topic `be738fb3-fc30-4d1e-9306-c1cb2eb7d0c3`.
  Kaynak: `~/Downloads/1.5.2575.pdf` (mevzuat.gov.tr konsolide metin).
  Kullanicinin istedigi ~20 temel Danistay sorusu artik DOGRULANABILIR:
  m.5 karar organlari · m.8 uye nitelikleri · m.13 on daire (dokuzu dava, biri idari)
  m.17 dava daireleri kurullari · m.52 Baskanlar Kurulu gorevleri.

**HALA EKSIK mevzuat:** 3194 Imar, 2942 Kamulastirma, 2886 Devlet Ihale,
4734 Kamu Ihale. Bu konularda soru cikarsa once kanunu cekmek gerekir
(`mevzuat-import.ts --slug <yeni> --file <pdf>`; legislation kaydi ONCE kurulmali,
betik findUnique yapiyor, kendisi olusturmuyor).

### KULLANICI KARARI (3 Eyl 2026): **TEORI BLOKLARI ALINMAYACAK**
> "Gerek yok alma bu kisimlari ve kaldigin yerden devam et"

Genel idare hukuku teorisi (idari islemin unsurlari, kamu hizmeti olcutleri,
hizmet kusuru/kusursuz sorumluluk, idari sozlesme turleri) **ALINMAYACAK.**
Yalnizca KANUNLA DOGRULANABILIR bloklar islenecek. Denetim hattinda degisiklik
yapilmayacak; konu anlatimi PDF'i aciklama yazarken basvuru kaynagi olarak kalir.

### !!! FIRSAT TABLOSU — IDARE MEVZUATI COK INCE (3 Eyl 2026 olcumu)

CMK'nin tersine burasi VERIMLI. Kanun basina madde / soru / soru bagli madde:

| kanun | madde | soru | bagli madde | BOS |
|---|---|---|---|---|
| **2575 Danistay** | 138 | **0** | 0 | **138** |
| 657 Devlet Memurlari | 337 | 94 | 46 | ~291 |
| 5393 Belediye | 101 | 18 | 15 | ~86 |
| 2577 IYUK | 82 | 58 | 29 | **50** |
| 5302 Il Ozel Idaresi | 78 | 10 | 7 | ~71 |
| 5442 Il Idaresi | 77 | 31 | 16 | ~61 |
| 2576 BIM | 48 | 5 | 3 | ~45 |
| 4483 Memurlarin Yarg. | 25 | 30 | 9 | ~16 |
| 3071 Dilekce | 12 | 5 | 4 | ~8 |
| 4982 Bilgi Edinme | 33 | 84 | 29 | ~4 (DOYGUN) |

**IYUK'ta sorusu olmayan sinav maddeleri:** m.1, 4, 12, **13** (idari eylemden dogan
zarar — cok sorulur), 21, 22, 23, 25, 29, 31, 32, 34-40, 42, 44 (yargilamanin
yenilenmesi), 46-49 (istinaf/temyiz), 54-65. (Gecici maddeler sayilmadi.)

**"Idare Hukuku" konusundaki 262 sorunun 241'inin MADDE BAGI YOK** — eski toplu
ice aktarimdan kalma, denetimden gecmemis. Bu da konunun doktrin agirligini
dogruluyor; yeni sorular madde bagli gelecegi icin karisma riski yok.

### (kapandi) yapisal sorun notu

Idare hukuku, CMK'dan farkli olarak **buyuk olcude KANUNA DAYANMAZ.** Idari islemin
unsurlari (yetki-sekil-sebep-konu-amac), idari islemin geri alinmasi, kamu hizmeti
olcutleri, hizmet kusuru / kusursuz sorumluluk, idari sozlesme turleri — bunlarin
hicbiri bir kanun maddesinde yazmaz; doktrin ve Danistay ictihadidir.

Denetim hatti "dayanak kanun metninde mi" diye bakiyor. Bu haliyle genel idare
hukuku sorularinin cogu **belirsiz** donerdi ve yayina alinamazdi.

**BU GECE UYGULANAN GUVENLI VARSAYILAN:** once KANUNLA DOGRULANABILIR bloklara
gidilecek — IYUK usulu (2577), Danistay/BIM teskilat (2575, 2576), memur hukuku
(657), belediye/il idaresi (5393, 5302, 5442), bilgi edinme (4982), dilekce (3071),
memurlarin yargilanmasi (4483). Bu bloklarda hat oldugu gibi calisir.

**Genel idare hukuku teorisi bloklari BEKLETILIYOR.** Kullanici konu anlatimini
aciklama kaynagi olarak yetkilendirdi (`~/Downloads/Themis Konu - Idare Hukuku.pdf`,
148 sayfa) ama denetimin bu sorulari NEYE KARSI dogrulayacagi kullanici karari:
  (a) bu bloklari hic almamak,
  (b) denetimi konu anlatimina karsi calistirmak (hatta degisiklik gerekir).
Kullanici uyaninca sorulacak.

### !!! KITAP KIMLIGI DUZELTMESI (3 Eyl 2026)
Dosya adi `Themis Soru - Idare Hukuku.pdf` ama **ICERIK THEMIS DEGIL**:
**"Idare Hukuku Soru Kitabi" — Muzeyyen Eroglu Durkal, Seckin Yayincilik,
4. Baski, Ocak 2025, 234 sayfa.** KAYNAK ETIKETI buna gore yazilacak, "THEMIS"
yazilmayacak. (Idari Yargilama kitabinin kimligi de acilinca DOGRULANMALI.)

### SAYFA FORMULU — CMK'dan FARKLI, DIKKAT
PNG'ler **acik kitap (spread)** taramasi: her dosyada IKI kitap sayfasi var.
  solKitapSayfa = 2N-1 · sagKitapSayfa = 2N · taramaNo = ceil(kitapSayfa/2)
Ornek: s-095 -> kitap s.189/190. Son icerik s-117; s-118 bos.
Sayfa basina 2 sutun, okuma sirasi sutun sutun. Test basina ~15-20 soru.
Ayri cevap anahtari YOK: her sorunun altinda cerceveli aciklama, dogru sik
aciklamanin sonunda koyu zeminde "Yanit, (D) secenegi".

### BOLUM HARITASI — 16 konu, 53 test, KISIM/BOLUM hiyerarsisi YOK
Harita: `<scratchpad>/idare-bolum-haritasi.json` (icindekiler tam olarak var).

**!!! BU KITAPTA DANISTAY VE IYUK BOLUMU YOK.** Kullanicinin istedigi ~20 temel
Danistay sorusu ile IYUK usul sorulari **Idari Yargilama Hukuku kitabindan**
gelecek (`~/Downloads/Themis Soru - Idari Yargilama Hukuku.pdf`, 88 sayfa).

**KANUNLA DOGRULANABILIR BLOKLAR (islenecek):**
| blok | tarama | test | dayanak kanun | bankada bos madde |
|---|---|---|---|---|
| **Memurlar ve diger kamu gorevlileri** | s-095..s-113 | 9 | 657 DMK | ~291 |
| Merkezden yonetim | s-018..s-030 | 7 | 5442 Il Idaresi | ~61 |
| Mahalli idareler | s-031..s-047 | 8 | 5393 Belediye, 5302 Il Ozel Id. | ~86 / ~71 |
| Idari usul | s-079..s-081 | 1 | 3071 Dilekce, 4982 Bilgi Edinme | ~8 / ~4 |

**TEORI BLOKLARI — KULLANICI KARARIYLA ALINMAYACAK:**
Genel olarak idare hukuku (s-005..s-008) · Idare hukukunun kaynaklari (s-009..s-017)
· Idari islemler (s-055..s-066) · Idarenin sozlesmeleri (s-067..s-071)
· Kamu hizmeti (s-072..s-078) · Kolluk faaliyetleri (s-082..s-083)
· Idarenin mallari (s-084..s-085) · Idarenin mali sorumlulugu (s-114..s-117)
Ayrica **Idarenin mal edinme yontemleri (s-086..s-094)** dayanagi 2942 Kamulastirma
ve 2886/4734 Ihale kanunlaridir; bunlar BANKADA YOK -> simdilik atlanacak.
Hizmet bakimindan yerinden yonetim (s-048..s-049), bagimsiz idari otoriteler
(s-050..s-052) ve meslek kuruluslari (s-053..s-054) kurulus kanunlarina dayanir;
o kanunlar da bankada yok -> atlanacak.

### PARTI i01 KAPANDI — MEMURLAR / 657 DMK (3 Eyl 2026)
s-095..s-098 (kitap s.189-196, TEST-I ve II) okundu: **30 soru -> 17 bankaya girdi.**
Denetim 17/17 yayimlanabilir, kusurlu 0. Run: wf_fa91e478-de2.
657 yayinda 94 -> **111**; soru bagli madde 46 -> **52**. Banka 5.604.

**KONU SECIMI:** sorular "Idare Hukuku" degil **"657 Sayili Devlet Memurlari
Kanunu"** konusuna (`8b68257c`) yazildi. Sebep: `denetim-yayinla.ts` articleNo'yu
yalnizca `dogruKanun === topic.name` oldugunda baglar. 657 konusuna yazilinca
madde bagi kuruluyor; Idare Hukuku konusuna yazilsaydi 241 bagsiz sorunun yanina
bir tane daha eklenirdi. **Kanun bazli sorular ilgili KANUN konusuna yazilacak.**

**KAYNAK ETIKETI:** `SEÇKİN 2025 İDARE HUKUKU SORU KİTABI (M. EROĞLU DURKAL)`.

13 eleme:
- 9'u alt ajan: 5 doktrin (memur kavraminin ogeleri, atamanin sart islem nitelig,
  kadro/rutbe sistemleri...), 4'u **3 sayili Cumhurbaskanligi Kararnamesi**
  (ust kademe yoneticileri) — CBK bankada yok, dayanak dogrulanamaz.
- 2 banka mukerreri: kariyer ilkesi tanimi (0ca66ed7), adalet hizmetleri sinifi
  (4e421ffa) — ikisi de birebir.
- **2 ESKIMIS HUKUM — bu kitabin en onemli riski:**
  Kitap Ocak 2025 baskisi; **657 m.56 23/1/2026'da degisti ve m.57 MULGA edildi
  (7573 s.K.).** Eski m.56'nin ilisik kesme sebepleri ("memuriyetle bagdasmayan
  hal ve hareketler", "gorevde devamsizlik") KALDIRILDI; yerine disiplin cezasi
  olcutu geldi. Bu yuzden `s-096 S.15` (o sebepleri sik olarak sayiyordu -> bugun
  UC dogru cevapli) ve `s-097 S.1` (kokunde artik var olmayan bir sebebi
  varsayiyor) elendi. `s-097 S.2` kurtuldu: uc yillik yasak yeni m.56'da AYNEN
  duruyor, yalniz madde numarasi degisti.
  **DERS: bu kitap 1 yil eski. Sure/rakam iceren her soruda maddeyi bankadan CEK.**

### YENI ARACLAR (3 Eyl 2026)
- `harita-kur-idare.py` — idare partileri icin harita. `hedefli-kume.ts` maddeyi
  **lawArticle.topic.name** icinde arar (legislation adinda DEGIL), o yuzden sol
  taraf topic adinin parcasi olmali: `657|48`, `Anayasa|128`. Ek maddeler bankada
  "Ek 8" bicimindedir; betik "ek m.8" -> "Ek 8" cevirir.
- `mukerrer-tara.py`, `karsilastir.py`, `dok.py`, `aday-kur.py` artik **BANKA** ve
  **OKUNAN_DESEN** ortam degiskenleriyle herhangi bir konuya yoneltilebilir.
  GURULTU listesine idare kaliplari eklendi (657, devlet, memurlari, idari...).

### !!! TURKCE BUYUK I TUZAGI (3 Eyl 2026'da yasandi)
JavaScript `toLowerCase()` "İdare" -> "i̇dare" (birlesik noktali i) uretir ve
`/idare hukuku/i` ile ESLESMEZ. Ilk banka dokumunde Idare Hukuku'nun 262 sorusu
bu yuzden dusmustu. **Konu suzerken desen degil, TOPIC ID listesi kullan.**

### PARTI i02 KAPANDI — MEMURLAR TEST-III/IV (3 Eyl 2026)
s-099..s-102 (kitap s.197-204) okundu: **30 soru -> 19 bankaya girdi.**
Denetim 19/19 yayimlanabilir, kusurlu 0. Run: wf_a80d983f-98f.
657 yayinda 111 -> **130**; soru bagli madde 52 -> **56**. Banka 5.623.

11 eleme:
- **4'u DAYANAGI BANKADA OLMAYAN KANUN:** 2531 s.K. (ayrilanlarin yapamayacaklari
  isler) ve 4688 s.K. (Kamu Gorevlileri Sendikalari). Ikisi de bankada YOK.
- 3'u alt ajan: 3 sayili CBK (ust kademe yoneticileri) + 1 doktrin tasnifi.
- 1 birebir mukerrer (taksirli suc sorusu, yalniz suc degismis -> 035d2bd5).
- 1 AYNA soru: m.62'nin diger yarisi (ayni yer / baska yer) — 4a255001 az once
  ayni kitaptan yayinlanmisti.
- **1'i IKI YANLIS SIKLIYDI (alt ajan kacirdi):** analik izni sorusunda hem C
  ("dogumdan once BES hafta" — kanun IKI hafta) hem A ("8+8=16 hafta" — kanun
  m.104/A'ya gore 8+16=24 hafta) yanlis. Kitabin kendi sik metninde hata var.

**KURTARILAN SORU:** kitap "aday memurlukta hangi disiplin cezalari ilisik kesme
dogurur" sorusunu m.57'ye dayandiriyor, o madde MULGA. Kural yeni m.56'da duruyor
ve aciklamaya kanunun ince ayrimi eklendi: aylıktan kesme ile kademe ilerlemesinin
durdurulmasi TEK BASINA yeterli, uyarma/kinama ise ancak BIRDEN FAZLA olursa.

#### !! "MULGA" TESPITINDE TUZAK (3 Eyl 2026'da yasandi)
Madde metninin BASINDAKI "(Mülga: ...)" ibaresine bakip maddeyi yururlukten kalkmis
saymak YANLIS. Cok sayida madde once mulga edilip SONRA YENIDEN DUZENLENMISTIR ve
her iki serh de metnin basinda yan yana durur:
  657 m.22 -> "(Mülga: 23/12/1972 - KHK-2/5 md.; **Yeniden düzenleme: 12/6/1997
  4275/1 md.**) Devlet memurları ... sendikalar ve üst kuruluşlar kurabilir..."
Yani m.22 YURURLUKTEDIR. Regex ile `^\(Mülga` arayan bir tarama bu maddeleri
yanlislikla "mulga" listesine atar. **Karar vermeden once maddenin GOVDE metnini
oku**; serh degil, hukum belirleyicidir.

#### 657 DISIPLIN BOLUMU — HAZIRLIK OLCUMU (3 Eyl 2026)
m.124-145 araliginda 2023 sonrasi degisiklik tasiyan maddeler: **m.127**
(23/1/2026 - 7573/3), Ek m.40 (21/5/2025 - 7548), Ek m.41 (8/5/2025 - 7547).
m.127'deki 2026 degisikligi **iki yillik ceza verme zamanasimini DEGISTIRMEDI**;
eklenen sey, disiplin cezasi yargi kararıyla iptal edilirse kalan zamanasimi
suresi icinde (dolmus ya da alti aydan az kalmissa en gec alti ay icinde)
yeniden ceza tesis edilebilecegidir. Yani "ceza verme zamanasimi kac yil" tipi
sorular hala gecerli.
Ilgili madde metinleri `<scratchpad>/m657c.json` dosyasinda hazir
(m.94-101, 108-109, 124-145).

#### BU KITAPTA DAYANAGI BANKADA OLMAYAN KANUNLAR (buyuyen liste)
3 sayili CBK · 2531 · 4688 · 2942 Kamulastirma · 2886/4734 Ihale · 2547 YOK
Bunlara dayanan soru ALINMAZ. Ihtiyac olursa `mevzuat-import.ts` ile cekilir
(once topic + legislation kaydi ELLE kurulmali, betik findUnique yapiyor).

### PARTI i03 KAPANDI — MEMURLAR TEST-V/VI, izinler + disiplin (3 Eyl 2026)
s-103..s-106 (kitap s.205-212) okundu: **30 soru -> 20 bankaya girdi.**
Denetim 20/20 yayimlanabilir, kusurlu 0. Run: wf_34a998fc-85f.
657 yayinda 130 -> **150**; bagli madde 56 -> **61**. Banka 5.643.

10 eleme:
- 4'u ETIK KURUL (5176 s.K. bankada yok) — alt ajan eledi.
- 1 doktrin tasnifi, 1 belirsiz hastalik izni sorusu (kok hastalik turunu
  soylemiyor -> hem 12 hem 18 ay savunulabilir).
- **3'u AYNA SORU** — ayni kitaptan az once yayinlananlarin diger yarisi:
  sut izni (ilk/ikinci alti ay), yarim zamanli calisma (birinci/sonraki dogum),
  yedi gunluk izin (evlenme/kardes olumu).
- 1 belirsiz aylıksız izin sorusu: D sikki "yurtdisinda gorevlendirildigi sure
  boyunca" diyor ama m.108/D izni memurun KENDISINE degil ESINE veriyor;
  kitabin cozumu maddeyi yanlis aktariyor -> ikinci dogru cevap riski.

**IKI SORU SUPHELIDEN KURTARILDI:**
- Memurluktan cikarma sorusu: kitabin cozum metni fiilleri yanlis siniflandiriyor
  ama cevap dogru. m.125/E-l (teror orgutlerine yardim) ve m.125/E-h (gizli
  bilgileri aciklamak) dogrulandi; 3-9 gun gelmeme, sarhos gelme ve mal bildirimi
  ise m.125/D (kademe durdurma).
- Kademe ilerlemesi sorusu: supheli sik **m.158**'de cikti — "Aday memurlara,
  asaletleri tasdik edilinceye kadar kademe ilerlemesi uygulanmaz."

#### !! KENDI ACIKLAMA HATAM — m.77 (denetim yakaladi)
m.77 icin "yabanci memleketlerin resmi kurumlari VEYA uluslararasi kuruluslarda
on yila kadar" yazdim. **YANLIS:** m.77/1 ikisini AYIRIR — yabanci memleketlerin
resmi kurumlari ile Cumhurbaskaninca belirlenen yurtdisi kuruluslarinda ON YILA,
ULUSLARARASI KURULUSLARDA YIRMIBIR YILA kadar. Madde metni `m657d.json`'da
elimdeydi ama BASMADAN ezberden yazdim. Denetci duzeltti, yayindaki metin dogru.
**Kural: aciklamayi yazmadan once ilgili maddeyi EKRANA BAS, dosyada olmasi yetmez.**

### SIRADAKI ADIM
Memurlar blogunun kalani: **s-107..s-113** (TEST-VII..IX).
Sonra Mahalli idareler (s-031..s-047), sonra Merkezden yonetim (s-018..s-030).
Kitap bitince -> Idari Yargilama Hukuku (Danistay ~20 temel soru + IYUK 50 bos madde).
Memurlar bitince: Mahalli idareler (s-031..s-047), sonra Merkezden yonetim.
Kitap bitince -> Idari Yargilama Hukuku kitabi (Danistay + IYUK; IYUK'ta 50 bos madde).

### DANISTAY SINIRI (kullanici karari, 3 Eyl 2026)
Yalnizca TEMEL duzey, **hedef ~20 soru**. Ornek: Danistay uyeleri kim tarafindan
secilir, kurul kac uyeden olusur, daire sayisi. Derinlikli/istisnai Danistay
sorulari ALINMAZ. 20'ye ulasinca Danistay konusu KAPANIR.

#### (kapandi) CMK siradaki hedefler
ISLENEN: s-006, s-042..s-116.
KALAN: **s-001..s-005 (on sayfalar, muhtemelen icindekiler), s-007..s-041.**
CMK bitince -> Idare Hukuku -> Idari Yargilama Hukuku (GECE-TALIMATI-3.md).
CMK bitince -> Idare Hukuku -> Idari Yargilama Hukuku (GECE-TALIMATI-3.md).
CMK bitince -> Idare Hukuku -> Idari Yargilama Hukuku (bkz. GECE-TALIMATI-3.md).
Denetim esigi: 30-40 soru birikince `hedefli-kume.ts --inceleme` -> denetim-hat.js
-> `denetim-yayinla.ts --sonuc <task .output> --yaz`.

#### HAT KULLANIRKEN DIKKAT (2 Eyl 2026'da yasandi)
- **Harita anahtari SURUM id'sidir, soru id'si degil.** kuyruk-arsivle.ts de sürüm id'si ister.
  (cmk-mevcut.json ise SORU id'si tutar — mukerrer raporundaki id ile denetim ciktisindaki
  id ayni soruya ait olsa bile FARKLI gorunur, sasirtmasin.)
- **Haritada FIKRA numarasi yazma, yalniz MADDE numarasi yaz.** `hedefli-kume.ts`
  articleNo ile birebir eslesir; "253/19" diye yazarsan madde bulunamaz ve soru
  kumeye HIC girmez — ustelik cogu sessizce duser, yalnizca hicbir maddesi
  eslesmeyen soru icin uyari basar. b02'de 32 sorunun 15'i bu yuzden dusmustu.
  Harf ekli gercek maddeler korunur: "308/A", "217/A" gecerlidir, "253/19" degil.
  Kume uretiminden sonra MUTLAKA "kumede N = haritada N" kontrolu yap.
- **Eslestirmeyi PARMAK IZIYLE yap (kok + siklar), salt kokle degil.** Iki sorunun kokü
  birebir ayni olabiliyor; salt kokle eslestirince ikisi ayni sürüme baglanip biri kumeden
  dusuyor (30 yerine 29 soru islenmisti).
- Denetim ciktisinda soru sayisi gonderilenden azsa, bir denetci o soruyu dondurmemis
  olabilir; eksigi bul ve ayni kume ile yeniden calistir.

### ONCEKI KITAP (KAPANDI): **Ceza Hukuku OZEL HUKUMLER** (Ismail Ercan, THEMIS 2025)
- PDF: ~/Downloads/Themis Soru - Ceza Hukuku Ozel Hukumler.pdf
- Sayfa gorselleri: <scratchpad>/ozel-png/s-01..s-96.png
- s-01..s-05: kapak/onsoz/icindekiler. Sorular **s-06**'dan basliyor.
### KITAP KAPANDI — 2 Eylul 2026
Ozel Hukumler ikinci gecisi bitti. Islenen: s-06..s-37 · s-45 (ornek) · s-72..s-75 (Ekonomi,
bolumun tamami) · s-89..s-96 (Adliye + Anayasal duzen, kitabin sonu). Kitap s-96'da bitiyor.
Sayfa sayfa TARANMAYAN, kapsam disi birakilan bolgeler: s-38..s-44, s-46..s-71, s-76..s-88
— hepsi bankada dolu bolgeler, ornekleme yapmadan taranmasi onerilmez.
- **DENETIM TAMAMLANDI ve YAYINA ALINDI (2 Eyl 2026).** 19 soru denetimden gecti:
  **19 yayimlanabilir · 0 kusurlu · 0 belirsiz**, iki denetci de her soruda uzlasti.
  Harita: `harita-kitap-kapanis.json` · kume: `kume-kapanis/` · run: wf_15492098-606.
  Sonuc: **TCK 1.074 -> 1.093 · banka 5.481 -> 5.500 · TCK kuyrugu bos.**
  Ekonomi bolumu (m.235-242) 0 -> 6 madde-bagli soru; m.287 genital muayene 0 -> 1.
  (Iki bolum-katalogu sorusu denetcice `dogruMadde=null` isaretlendi — dogru davranis,
   soru bir bolume yayiliyor; yayinda ama articleNo'suz.)
- HAZIR OKUNMUS SAYFA: yok (s-27..s-37 islendi; s-45 malvarligi ornegi de alindi).
- CRON: kullanici 2 Eyl 2026'da durdurdu (b1f0284d silindi). Otomasyon elle surdurulecek.

### !!! BU KITAP ZATEN BIR KEZ ISLENMIS — IKINCI GECIS YAPIYORUZ (2 Eyl 2026)
Kitap 27 Agustos 2026'da TOPLU olarak bankaya girmis:
`ozgun-sorular/2026-08-themis-tck-oh-01..23.json` = 269 soru ("tck-oh" = TCK Ozel Hukumler).
Su anki sayfa sayfa tur, ayni kitabin IKINCI gecisidir. Mukerrer orani bu yuzden yuksek.
Kokler yeniden yazilmis (isim, yas, cumle dizilisi degistirilmis) oldugu icin import
scriptinin contentHash mukerrer kontrolu BUNU YAKALAMAZ.

**KURAL: import'tan ONCE, HER aday icin banka tarafinda MADDE BAZLI tarama yap.**
articleNo ile sorgula ve TAM METIN karsilastir; yalnizca kok benzerligine bakma.
b10 ve b11'de bu yeterince yapilmadi; 6 mukerrer ice girdi ve kuyruk-arsivle.ts ile geri
alindi (surum 5844e372, 220a0a3f, 169218e4, 63b66723, bd829ffa, 45c5f549).

**VERIM OLCUMU (2 Eyl 2026)**
| sayfa araligi | okunan | bankaya giren | oran |
|---|---|---|---|
| s-27..s-33 (Hurriyete karsi) | 26 | 1 | %4 |
| s-34..s-37 (Hurriyete karsi) | 20 | 3 | %15 |
| s-45 ornek (Malvarligi)      |  5 | 2 | %40 |
| **s-72..s-75 (EKONOMI — bankada 0 soru)** | 16 | **8** | **%50** |
| s-89..s-92 (Adliye — bankada 17 soru) | 20 | 3 | %15 |
| s-93..s-96 (Adliye + Anayasal duzen — dolu) | 15 | **0** | **%0** |

Sonuc net: verim, bankadaki mevcut yogunlukla ters orantili. Bos bolum %50, dolu bolum %0-15.

**IKINCI GECISIN TOPLAMI: 102 soru okundu, 19 soru bankaya girdi (%19).**
Bunun 8'i tek basina Ekonomi bolumunden (bankada hic sorusu olmayan tek bolge).
DERS: bir kitabin ikinci gecisinde sayfa sayfa taramak verimsizdir; once BANKA KAPSAMI
olculur, sadece bos bolgelerin sayfalari okunur.

**BANKA KAPSAMI (yayindaki soru / madde) — sayfa butcesi nereye gitmeli**
Cinsel dokunulmazlik 8,25 · Hayata karsi 6,40 · Iskence 4,67 · Hurriyete karsi 2,32 ·
Serefe karsi 2,14 · Kamu barisi 1,80 · Bilisim 1,75 · MALVARLIGI 1,66 · Kamu idaresi 1,50 ·
Ozel hayat 1,33 · Kamu guveni 0,75 · **Adliyeye karsi (m.267-298) 0,53** ·
**Genel ahlak + Aile duzeni + Ekonomi-ihale (m.225-242) = 0,00 — bankada HIC soru yok**
Mevcut bolumu sayfa sayfa taramak yerine bos bolumlere gecmek cok daha verimli.

**KITAP BOLUM HARITASI (2 Eyl 2026, gorsel tarama ile dogrulandi)**
- Malvarligina karsi suclar ........ s-45 (kitap s.79)
- Kamunun sagligina karsi .......... kitap s.111
- Kamu guvenine karsi .............. kitap s.122 civari
- Kamu barisina karsi .............. kitap s.130 civari
- **Ekonomi, sanayi ve ticaret ..... s-72 (kitap s.133), s-76'da biter** <- bankada 0 soru
- Bilisim alaninda suclar .......... s-77 (kitap s.144)
- **Adliyeye karsi suclar .......... s-89 (kitap s.167), Test-II s-92** <- bankada 17 soru (seyrek)
- Kitap sonu ....................... s-96 (kitap s.181, anayasal duzene karsi)

**DIKKAT:** Genel ahlaka karsi (m.225-229) ve Aile duzenine karsi (m.230-234) suclar icin
bu kitapta AYRI BOLUM YOK. Bankada bu 10 madde tamamen bos ama bu kitaptan doldurulamaz;
baska bir soru kaynagi gerekir. (Kumar/dilencilik sorulari bankada var, ama Kabahatler
Kanunu m.33-34 altinda — ceza hukuku degil kabahat.)

**KAPSAM KARARI (kullanici, 2 Eyl 2026):** Hurriyete karsi suclar bolumunu sayfa sayfa
taramayi BIRAK (s-38..s-44 atlandi), bos/seyrek bolumlere gec: once Ekonomi (s-72..s-75 BITTI),
sonra Adliyeye karsi (s-89..s-92 BITTI, s-93..s-96 kaldi).

**BU KITAPTAN ARTA KALAN (kitap bitince degerlendirilecek):** s-38..s-44 (Hurriyete karsi
kalani + Serefe/Ozel hayat), s-46..s-71 (Malvarligi + Genel tehlike + Kamu sagligi/guveni/barisi),
s-76..s-88 (Bilisim + Kamu idaresi). Bunlarin hepsi bankada dolu bolgeler; ornekleme yapmadan
sayfa sayfa taranmasi onerilmez.

Bankada ZATEN OLAN (yeni soru ALMA): ozgurluge karsi suclar/hakaret listesi (33890dd3);
m.119 ortak nitelikli hal listesi — iki ayri kurguda var (6f0fe1f5 siyasi hak, 572e51e4
is-calisma), UCUNCUSUNU ALMA; santaj I-IV (f85b7675); dilekce hakki yanlis-olan (d395e8dd);
tehdit I-IV dogru-olan (75db175a); nefret/ayrimcilik I-III (ee5c0663); konut dokunulmazligi
genel (395f85be); kamu gorevi nufuzu hangi suclarda (c512df3b + 27647811); m.123 ve m.123/A
ifade sorulari (bd43f266, ca115615, fa9b6728) VE olay sorusu (4ad7350c gece telefon) —
m.123 KAPALI, yeni soru alma; m.124 haberlesmenin engellenmesi "hangisi olusturmaz"
(a6666f69); m.103 yatili kurum muduru olayi (53151017); m.106 tehdit I-IV yanlis-olan
(a4e0a382); m.114+m.109 parti genel baskanini kacirma olayi (e2332133, 0de26162);
m.120 haksiz arama I-IV (caf28291) ve olay (61917890).
- ELENEN (in_review'de asili, silinebilir): 0fd7f7dd (m.94 nitelikli hal - 7aad3a7c ile yigilma).
- YIGILMA EKLENDI (Ozel Huk.): iskence mahkeme/zamanasimi (CMK 94/6+4483 m.2/5) alindi; kadina karsi
  nitelikli hal listesi alindi; iskence magduru kimdir alindi; m.94/4 istirak alindi -> tekrarini ALMA.
- YIGILMA EKLENDI: m.92/1 ozel zorunluluk durumu (Genel Hukumler'de ba829673 olarak yayinlandi).
- s-14 ELENENLER: S.3 (sahista hata), S.4 (vucut dokunulmazligi listesi yigilma),
  S.5 (kalp hastasi = hemofili kalibi, zaten arsivlendi).
- YIGILMA (Ozel Hukumler, bankada var): m.84/4 kasten oldurme sayilan haller; m.82/1 nitelikli
  hal listesi (iki kez soruldu, ucuncusunu ALMA); m.77/1 insanliga karsi suc eylem listesi.
- DERS: "sahista hata / hedefte sapma" temelli olay sorulari TCK metninde karsiligi olmadigi
  icin ELENIYOR (Genel Hukumler'de de ayni kural uygulanmisti).
- s-27 S.2 ELENDI (ergin olmayanla cinsel iliski / "hangisi yanlistir"): cevap kutusu 500 dpi
  ile A okundu, kitap A'yi "magdur erkek de olabilir" diye yanlis sayiyor; ama sikkin lafzi
  "bir kadin OLABILIR" oldugu icin ifade teknik olarak dogru. Ayrica B sikki (evlenmeyle
  erginlik) TCK m.6/1-b karsisinda ayrica tartismali. Birden fazla sik savunulabilir -> ALMA.
- s-33 II-4 ELENDI (siyasal haklardan yoksun birakma): "manevi unsuru kasttir" sikki ancak
  ozel kast/saik doktrinine dayanilarak yanlis sayilabiliyor; A ve B sikklari da 2820 s.K. ve
  m.53 gibi TCK m.114 METNI DISI dayanaklara oturuyor. Ayrica 736bffa4 ile yigilma.
- s-30 S.9 ve s-33 II-5 ELENDI: kitabin cevap harfi kendi cozum metniyle celisiyor.
- **OZEL HUKUMLER 1. KITAP HATASI**: s-08 T-I S.3 (gocmen kacakciligi oncülleri) — kitabin
  aciklamasi I ve II'nin yanlis oldugunu soyluyor ama cevabi A (Yalniz I) veriyor; C olmaliydi.
- s-07 TAMAMEN ELENDI: S.7/S.8 ictihat+TCK disi kanun (399 KHK, 5188, 1163, 6222) kaynakli;
  S.9/S.10 onceki partiyle yigilma (m.6/1-d ve m.6/1-f listeleri).
- ATLANAN: s-12 S.9 (taksirle yaralama) — cevap anahtari kesik, s-13'te de gorunmedi.
- YIGILMA (Ozel Hukumler): m.77/1 insanliga karsi suc eylem listesi zaten bankada (840f298c);
  ayni listeyi olcen yeni soru ALMA.
- OZEL HUKUMLER DERSI: "ihale usuluyle kamusal faaliyet yuruten kamu gorevlisi sayilmaz" gibi
  kurallar TCK m.6 METNINDE YOK (madde gerekcesi/ictihat). Bu tur sorulari ALMA.
- sourceLabel: "THEMIS 2025 CEZA HUKUKU OZEL HUKUMLER SORU KITABI"
- YIGILMA UYARISI (Genel Hukumler'den bankada olanlar; ayni kurali olcen yeni soru ALMA):
  dava zamanasimini DURDURAN nedenler; m.67/2 KESEN nedenler; musadere hukmu 20 yil;
  ozel affin davayi dusurmemesi; m.75/6 on odeme kapsam listesi; 18/65 yas erteleme 3 yil.

## Her turda yapilacak (parti dongusu)
1. Bekleyen denetim sonucu varsa: `denetim-yayinla.ts --sonuc <tasks/*.output> --yaz`
   Belirsiz/kusurlu cikanlari `kuyruk-arsivle.ts` ile gerekce yazarak arsivle.
2. Sonraki 3-4 sayfayi ALT AJANA okut (GECE-SAYFA-OKUYUCU.md sablonu; gorseller
   ana dongunun context'ine GIRMEZ). Alt ajan JSON'u dosyaya yazar.
3. Doktrin/TCK'da duzenlenmemis konulari ELE (sapma turleri, gecitli suc,
   beklenmeyen durum, tesvik-kararı kuvvetlendirme ayrimi, ihmali istirak...).
   Kitabin cevap harfi kendi cozum metniyle celisiyorsa da ELE.
4. **YIGILMA TARAMASI — IMPORT'TAN ONCE, BANKA UZERINDE.** Alt ajanin listesine
   guvenme; her aday icin konu/madde bazli sorgu cek ve yayindaki sorularla
   karsilastir. Kokler yeniden yazilmis oldugu icin import'un contentHash
   mukerrer kontrolu bunu YAKALAMAZ (2 Eyl 2026'da iki mukerrer bu yuzden ice girdi).
5. Kalan sorulardan parti -> python dosyasi -> ozgun-sorular/themis-ceza-bNN.json
   (Aciklamalar KANUN METNINDEN yeniden yazilir; yayinevi cozumu kopyalanmaz.
   Turkce diakritik zorunlu, >=200 karakter, kurali ogret.)
6. `import-ozgun-sorular.ts <json> --yaz` -> `kaynak-etiket-temizle.ts --yaz`
7. Yeni ID'leri cek (son 200 sn filtresi), harita-cNN.json yaz, `hedefli-kume.ts --inceleme`
8. `Workflow` ile denetim-hat.js calistir (Opus 5 + medium).
9. Bu dosyadaki "ISLENEN son sayfa" satirini guncelle.

## KURALLAR (kullanici karari — baglayici)
- AI SORU URETIMI YASAK. Yalnizca kitaptaki gercek sorular alinir.
- Kaynak etiketi (THEMIS vb.) her partide temizlenir.
- Degismis/mulga hukum sorusu alinmaz.
- Supheli soru bankaya girmez; supheliyse arsivle.
- Cevap anahtarini goremezsen 500 dpi kirp (`kirp` araci) ile dogrula.

## Kitap bitince (s-96 sonrasi) — SIRADAKI KITAP SECILMEDI
Ozel Hukumler kitabi 96 sayfadir; bitince siradaki kaynak kullaniciyla kararlastirilir.
Drive'daki "Themis Soru - ..." ve "Muessir - ... SB" soru kitaplari adaydir.

ONEMLI FARK — Ozel Hukumler bolumu TCK m.76-345 arasini kapsar:
- Bankada TCK zaten tam olarak var, ek mevzuat gerekmeyebilir.
- Ancak bazi sorular 5275 (bankada var), CMK (bankada var), 6136 (bankada var)
  disinda kanunlara dayanabilir; kume "BANKADA YOK" derse once kanunu
  mevzuat.gov.tr'den cek (User-Agent basligi SART, yoksa timeout):
  curl -sL -A "Mozilla/5.0 ... Chrome/120.0 Safari/537.36" -o X.pdf \
    "https://www.mevzuat.gov.tr/MevzuatMetin/1.5.<NO>.pdf"
  sonra mevzuat-json-import.ts ile bankaya ekle.

## KONU ANLATIM KITABI — 3 EYL 2026'DA DARALTILDI

Kullanici Idare Hukuku icin sunu soyledi: "idare hukukunun konu anlatimi olan
Themis Konu - Idare Hukuku.pdf downloads klasorunde. bu sorulari olustururken
buradaki konu anlatimini da baz alabilirsin."

Ayrim korunuyor: **SORU** yalnizca "Themis Soru - ..." kitabindan alinir;
konu anlatimi yalnizca **ACIKLAMA yazarken** basvuru kaynagidir. Konu anlatimindan
soru URETILMEZ. Asagidaki yasak bu yonuyle gecerliligini surdurur.

## KONU ANLATIM KITABI YASAGI (kullanici karari — kesin)
Drive'da "Themis Konu - ..." adli KONU ANLATIM kitaplari da var.
BUNLARDAN ASLA SORU URETILMEYECEK. Yalnizca "Themis Soru - ..." ve
"Muessir - ... SB" gibi SORU kitaplarindaki gercek sorular alinir.
