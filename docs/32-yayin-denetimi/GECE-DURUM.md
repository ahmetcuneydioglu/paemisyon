# GECE OTOMASYONU — DURUM

Bu dosya isin TEK KALICI DEVIR NOTUDUR. Oturum degistiginde once bu dosya okunur.
(2 Eyl 2026'da scratchpad'den buraya tasindi: scratchpad oturuma bagli gecici bir
dizindir, oturum kapaninca silinir. Durum notu orada tutulmaz.)

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
- `<scratchpad>/mukerrer-tara.py <aday.json> [...]` — alt ajan ciktisini 907 soruyla
  UC KADEMEDE karsilastirir: (1) TAM parmak izi (kok+tum siklar), (2) salt kok,
  (3) YAKIN — kok kelime kumesi %60+ ortusuyor. Ucuncu katman, isim/yas/rakam
  degistirilerek yeniden yazilmis varyantlari yakalar; Ozel Hukumler'de alti mukerrerin
  bankaya girmesine yol acan bosluk tam buydu. Kendi kendine test edildi.
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

#### SIRADAKI HEDEFLER (bos bloklara gore, oncelik sirasi)
1. s-112..s-116 — ozel muhakeme usulleri / uzlastirma (m.254-259 bos)
2. s-092..s-103 — istinaf ve temyiz usulu (m.277-282 ve m.300-307 bos)
3. s-075..s-091 — durusmada delillerin ortaya konulmasi (m.207-216 bos, 10 madde)
4. s-053..s-074 — koruma tedbirleri (m.113-126 bos: guvence, arama usulu, elkoyma)
5. s-042..s-052 — ispat (m.164-169 adli kolluk, m.177-184 savunma delilleri)
Denetim esigi: 30-40 soru birikince `hedefli-kume.ts --inceleme` -> denetim-hat.js
-> `denetim-yayinla.ts --sonuc <task .output> --yaz`.

#### HAT KULLANIRKEN DIKKAT (2 Eyl 2026'da yasandi)
- **Harita anahtari SURUM id'sidir, soru id'si degil.** kuyruk-arsivle.ts de sürüm id'si ister.
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

## KONU ANLATIM KITABI YASAGI (kullanici karari — kesin)
Drive'da "Themis Konu - ..." adli KONU ANLATIM kitaplari da var.
BUNLARDAN ASLA SORU URETILMEYECEK. Yalnizca "Themis Soru - ..." ve
"Muessir - ... SB" gibi SORU kitaplarindaki gercek sorular alinir.
