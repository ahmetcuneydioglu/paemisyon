# Doc 39 — parti durumu

Hat: üretici → 3 bağımsız denetçi (mevzuat · kalite · dil/mantık) → birleştirme
→ (gerekirse bir revizyon turu) → `doc39-bankaya-yaz.ts` ile `in_review`.

| Parti | Kanun | Madde | Aday | Kabul | Bankada | Durum |
|---|---|---|---|---|---|---|
| 2911-p1 | 2911 | 1–15 | 34 | 34 | 34 | ✅ bitti (tur-2 temiz) |
| 2911-p2 | 2911 | 16–27 | 37 | 23+ | 23 | tur-2: mevzuat 37 ONAY, dil 36/1, kalite bekleniyor |
| 2911-p3 | 2911 | 28–son | 21 | 10+ | 10 | tur-2: mevzuat 21 ONAY, dil 21 ONAY, kalite bekleniyor |
| 7068-p1 | 7068 | 1–7 | 26 | — | 0 | revizyon bitti, tur-2 sırada |
| 7068-p2 | 7068 | 8 | 74 | — | 0 | denetim sırada |
| 5901-p1 | 5901 | 1–22 | — | — | 0 | üretici çalışıyor |
| 5901-p2 | 5901 | 23–son | — | — | 0 | üretici çalışıyor |
| 5682-p1 | 5682 | 1–14 | — | — | 0 | üretici çalışıyor |

## SONUÇ (9 Eyl 2026)

**331 soru onay kuyruğunda (`in_review`).** Dört kanun tamamlandı; 3201 veri
kusuru nedeniyle başlatılmadı.

| Kanun | Aday üretilen | Bankada | Elenen | Farklı madde |
|---|---|---|---|---|
| 2911 Toplantı ve Gösteri | 95 | **90** | 5 | 38 |
| 7068 Genel Kolluk Disiplin | 102 | **95** | 7 | 8 (md 8 ağırlıklı) |
| 5901 Türk Vatandaşlığı | 83 | **78** | 5 | 39 |
| 5682 Pasaport | 72 | **68** | 4 | 21 |
| 3201 Emniyet Teşkilat | — | 0 | — | ⛔ bloke |
| **Toplam** | **352** | **331** | **21** | |

Kapanış doğrulaması temiz: hepsi `in_review`, hiçbiri yayına bağlı değil,
hepsi 5 şıklı ve tek doğru cevaplı, hepsinin künyesi ve madde bağlantısı dolu,
banka içi mükerrer yok. Ortalama açıklama 566-669 karakter.

## Planlanan partiler## Planlanan partiler

| Parti | Kanun | Madde aralığı |
|---|---|---|
| 2911-p1 | 2911 | 1–15 |
| 2911-p2 | 2911 | 16–27 |
| 2911-p3 | 2911 | 28–Geçici 2 |
| 7068-p1 | 7068 | 1–8 |
| 7068-p2 | 7068 | 9–20 |
| 7068-p3 | 7068 | 21–41 |
| 5901-p1 | 5901 | 1–16 |
| 5901-p2 | 5901 | 17–33 |
| 5901-p3 | 5901 | 34–52 |
| 5682-p1 | 5682 | 1–14 |
| 5682-p2 | 5682 | 15–30 |
| 5682-p3 | 5682 | 31–48 |
| 3201-p1…p8 | 3201 | 160 madde, ~20'şer |

3201 en büyük kanun ve bankada zaten 482 ilişkili soru var; mükerrer riski en
yüksek olan o. En sona bırakıldı.


## Notlar

- **2911 Geçici 2 "kesik metin" iddiası yanlış alarmdı** (2911-p3 üreticisi).
  DB'de de dökümde de metin tam (167 karakter); madde gerçekten kısa.
  Veri kusuru yok, düzeltme gerekmiyor.
- 2911'de mülga olduğu doğrulanan ve soru üretilmeyen maddeler:
  md 13 ve md 36 (6529 s.K.), md 35 (5728 s.K.), md 7/2 (AYM 30/6/2022).
- md 41 metni "Bakanlar Kurulu yürütür" diyor; Cumhurbaşkanlığı sistemindeki
  güncel karşılığı metinde yazmadığı için soru üretilmedi (doğru karar).

## Hattın öğrendikleri (brief'e kalıcı eklendi)

1. **Açıklama sızıntısı** — bir sorunun açıklaması aynı dosyadaki başka bir
   sorunun cevabını veriyor. Pilotta 20'den fazla çift; 7068 md 8'de 12 çift.
   En sık "karıştırılan komşu hüküm" kısmından kaçıyor.
2. **Sayısal çeldirici kuralı** — süre/ceza/oran sorularında çeldiricilerin en
   az üçü kanunun BAŞKA bir fıkrasındaki GERÇEK değer olmalı. Ama bu değişiklik
   çift-doğru riski yaratır: aynı değeri taşıyan iki fıkra varsa kök sorduğu
   fıkraya kilitlenmeli.
3. **Açık uçlu ibare tuzağı** — madde "…ve başka bir suretle", "gibi", "benzeri"
   taşıyorsa "hangisi sayılmamıştır" sorusu iki cevaplı olur; köke "kanun
   metninde AÇIKÇA SAYILANLARDAN" ibaresi eklenmeli.
4. **Vaka kökü kalıbı** — olay önce, dayanak sonra. Fiili o bende sokan ayırt
   edici unsur (kasıt, tekerrür, süre, muhatap) senaryoda açıkça verilmeli.
5. **Stensil tuzağı (7068 md 8)** — tek maddeden çok soru üretilince hepsi aynı
   kalıba düşer ve dosya "soru seti" değil "liste ezber testi" olur. Çeldiriciler
   de ceza merdiveninde uzak kademelere savrulur (bedava eleme). Çeldirici doğru
   cevabın KOMŞU kademesi olmalı.

## Hat üzerine öğrenilenler

- **Revizyonun kendisi denetlenmeli.** Üç kez revizyon eski kusuru çözerken
  YENİSİNİ doğurdu ve yalnız ikinci tur yakaladı: 2911-p2-12 (14 ile aynı ayrımı
  ölçmeye başladı), 7068-p1-26 (27 ile örtüşme kesilmedi), 5682-p1-23 (yeni şık
  ikinci bir doğru cevap yarattı). İkinci tur olmasaydı üçü de bankaya girerdi.
- **Agent raporu doğrulanmadan kabul edilmez.** Bir revizyon üreticisi yapmadığı
  düzeltmeyi "yaptım" diye bildirdi (2911-p1-03). İki üretici tam olan metni
  "kesik" sandı (2911 Geçici 2, 5901 Geçici 2) — ikisi de yanlış alarmdı.
  Ama 5682 Ek 1/Ek 7 için aynı iddia DOĞRU çıktı (bkz. veri kusuru).
- **Brief'imdeki hata üreticiden döndü.** 5682'de madde numaralarını yanlış
  vermiştim; üretici resmî metinden düzeltip bildirdi (md 4 mülga, md 22 =
  pasaport verilmeyecek kimseler). "Dayanak yalnız resmî metin" kuralı işledi.
- **Denetçiler birbirinden bağımsız aynı kusurda birleşiyor.** 2911-p1-13,
  5682-p1-30 ve 5901-p1-05'te iki ya da üç denetçi aynı iki-doğru kusurunu
  ayrı ayrı buldu. Oy birliği kuralı bu yüzden isabetli.

## VERİ KUSURU — 3201 bloke

`law_articles`'ta gerçek metin kesikliği ve başlık kirliliği bulundu; ayrı görev
olarak kaydedildi. 3201'de 14 içerik maddesi (md 1, 3, 8, 82, 87, 88, 95 ve
Geçici 1/9/10/12/22/23/25) eksik metin taşıyor; 36 başlıklı maddenin 19'unun
`title` alanı dipnot artığı. 5682'de md 34, Ek 1, Ek 7 kesik; 3 başlık kirli.
7068, 5901, 2911 temiz — bu üçünden üretim etkilenmedi.

**3201 partileri bu düzeltme yapılmadan BAŞLATILMAYACAK.**

## 3201 — veri kusuru giderildi (9 Eyl 2026)

Kullanıcı resmî PDF'i (mevzuat.gov.tr, 1.3.3201.pdf) sağladı; `pdftotext -layout`
çıktısı `apps/api/scripts/doc39-3201-yeniden-ice-aktar.ts` ile ayrıştırılıp
`law_articles` yeniden yazıldı.

**Kök neden:** ilk içe aktarımda sayfa altındaki dipnot bloğu gövde metniyle
karışmış. Üç belirti: (1) sayfanın son gövde satırı düşmüş → 14 madde kesik,
(2) dipnot bloğu madde gövdesine sızmış → 18 madde, (3) şerh devamı sonraki
maddenin başlığına yazılmış → 19 kirli başlık. Ayrıca aralık maddeler
("Madde 28 – 33 –") ayrıştırılamamış ve kanun sonundaki değişiklik tablosundan
hayalet madde üretilmiş (md 29'un gövdesi tablodan bir parçaydı).

**Sonuç:** 66 madde güncellendi, 7 madde eklendi (aralıklardan: 30-33, 45, 46, 49),
24 başlık düzeltildi, 18 meşru başlık kazanıldı. 12 maddede metin tamamlandı
(+745 krkt), 25 maddede sızmış dipnot atıldı (−12.508 krkt).
Doğrulama: 167 madde · sızmış dipnot 0 · kirli başlık 0 · boş metin 0.
(md 88 resmî metinde de noktasız biter — kusur değil.)

**Ayrıca düzeltilen yanlış tespit:** "3201'de bankada 482 ilişkili soru var"
ölçümü GÜRÜLTÜYDÜ — kanunun kısaltması `ETK` ve harf duyarsız alt dize araması
"etki/etken" gibi kelimeleri yakalamış. Gerçek mükerrer tabanı **17 soru**.

## 3201 parti planı (112 içerik maddesi)

| Parti | Madde aralığı | Konu | ~krkt |
|---|---|---|---|
| 3201-p1 | 1–16 | teşkilat, zabıta türleri, rütbeler (md 13), merkez/taşra (md 16) | 11.4k |
| 3201-p2 | 55 | **Terfi ve atama** — kanunun en sınavlık maddesi | 10.2k |
| 3201-p3 | 20–54, 56–67 | mesleğe kabul, sivil polis, teftiş, meslekten çıkarma, inzibat | 7.6k |
| 3201-p4 | 81–96 | performans, madalya ve ödüller, melbusat, Polis Bakım ve Yardım Sandığı | 7.9k |
| 3201-p5 | Ek 1–18 | ek hükümler (ilk blok) | 9.2k |
| 3201-p6 | Ek 21–37 | ek hükümler (ikinci blok; Ek 24 PMYO/POMEM dahil) | 12.4k |
| 3201-p7 | Geçici 1–17 | geçiş hükümleri (ilk blok) | 8.9k |
| 3201-p8 | Geçici 18–32 | geçiş hükümleri (ikinci blok; rütbe terfi geçişleri) | 11.9k |

## KARAR: 3201'in geçici maddeleri soru üretimine kapatıldı (9 Eyl 2026)

3201-p7 (Geçici Madde 1–17) partisi **9 sorunun 9'u da RED** alarak tamamen
düştü. Karar kalite denetçisinin ölçümüne dayanıyor ve gerekçesi şudur:

1. **Sorular hukuken kusursuzdu** — mevzuat denetçisi doğru şıkları, listeleri ve
   tarihleri metinle birebir doğruladı. Sorun doğruluk değil, ÖLÇME DEĞERİ.
2. **Geçici 3 tükenmiş**: maddenin giriş cümlesi "Halen hizmette bulunan
   memurların…" diyerek listeyi 1937'de kadroda bulunanlara özgülüyor. Üreticinin
   "kalıcı denklik ölçütü" gerekçesi yanlış çıktı.
3. **Zararlı içerik**: Geçici 3 sorularının doğru şıkları ve çeldiricileri bugün
   VAR OLMAYAN unvanlar (tetkik başmemurluğu, merkez memuru, üçüncü komiser).
   Aday, md 13/55 cetvelini bozan ölü terminolojiyi ezberlemiş oluyor. Bir soru
   (p7-06) md 55'in yaşayan kuralını çeldiricide YANLIŞ olarak gösteriyordu.
4. **Dış doğrulama**: bankadaki 17 mevcut 3201 sorusunun ve stil referansındaki
   14 gerçek çıkmış sorunun HİÇBİRİ geçici maddeden değil. PAEM/EGM sınavları
   geçiş hükmü sormuyor.
5. **Üreticinin zımni itirafı**: 9 sorudan yalnız birinin açıklamasında
   "uygulama süresi dolmuş bir geçiş kaydı değil" savunması var — bu savunmayı
   tek soruda yazmak, kalan sekizin tükenmiş olduğunun kabulüdür.

**Sonuç:** Geçici 1–17'den soru üretilmeyecek. Geçici 18–32 (p8) aynı ölçütle
DENETLENECEK ama peşinen kapatılmadı: o blok 2015–2026 arası (6638, 7148, 7196,
7422, 7587) eklemeleri taşıyor ve bir kısmı hâlâ sonuç doğuruyor olabilir.
Ölçüt aynıdır: **bugün bir polis adayının bilmesi gereken bir kural mı, yoksa
bir geçiş döneminin arkeolojisi mi?**

## 3201 ikinci tur denetim (9 Eyl 2026, sürüyor)

3201 partileri birinci turda ONAY oranı düşük geldi ve revizyon gerektirdi;
diğer dört kanunda tek tur yeterken burada **iki tur** işletildi. İkinci tur
kuralı: kalan her itiraz soruyu RED'e götürür (`SON_TUR`), kozmetik tercih
itiraz sayılmaz.

| Parti | mevzuat tur2 | kalite tur2 | dil tur2 |
|---|---|---|---|
| p1 | 37 ONAY | 32/0/5 | sürüyor |
| p2 | revizyon sürüyor | — | — |
| p4 | 26/0/1 RED | sürüyor | sürüyor |
| p5 | 29/2/1 RED | — | — |
| p6 | revizyon sürüyor | — | — |
| p8 | tur1'de kapandı (5 yazıldı, 4 REVIZYON kaldı) | | |

### İkinci turun getirdiği iki yapısal bulgu

**1) Olumsuz köke çevirme, mevzuat riskini büyütür.** Birinci turda "dördü
doğru, biri yanlış" biçimine çevrilen sorularda kalan DÖRT şıkkın dördünün de
metinle birebir doğru olması gerekir; biri kısmen yanlışsa iki cevap doğar.
p5-q02 tam olarak buradan RED aldı: Ek 1/2 kaydı çift eksenli (hem hizmet alanı
hem kadro düzeyi), soru tek eksende kurulmuştu — kadro düzeyi kaydını düşüren
iki çeldirici de "yanlış" sayılabiliyordu. Soru kendi açıklamasında "her kadro
değil" diyerek kusuru itiraf ediyordu (**AÇIKLAMA İTİRAFI** sezgisi yine tuttu).

**2) Sızıntı, revizyonla yok olmuyor; yer değiştiriyor.** Bu hatta beş kez
gözlendi. Kök neden cümle değil, **sorular arası fazlalık**: iki soru aynı
hükmün iki yüzünü ölçüyorsa, birinin açıklaması kaçınılmaz olarak ötekinin
cevabını verir. p4'te ikinci tur mevzuat denetçisi birinci turda kendi
kaçırdığı yeni bir çifti buldu (q29'un KÖKÜ q21'in doğru şıkkını ayırt eden tek
unsuru kelimesi kelimesine veriyordu) ve q21'i RED etti — sızıntı taramasının
yalnız açıklamalarda değil KÖKLERDE de yapılması gerektiğinin kanıtı.

### Yayına alınmış dört soruda sonradan çıkan kusur (9 Eyl 2026)

İkinci tur, birinci turda KABUL alıp bankaya yazılmış ve kullanıcı tarafından
YAYINA ALINMIŞ dört soruda kusur buldu. Yayından çekme/düzeltme kararı
kullanıcınındır; `doc39-soru-geri-cek.ts` `status=published` olanı kilitliyor.

**Grup 1 — hüküm tükenmiş (3201-p6-31, 3201-p6-32).** İkisi de **Ek Madde 35**'e
dayanıyor. Maddenin kendi lafzı yetkiyi "sözleşme süresinin **31/12/2020**
tarihini geçmemesi kaydıyla" veriyor; pencere kapalı. Üretici aynı maddeye
dayanan q30'u tam bu gerekçeyle dosyadan çıkarmış, ama q31/q32 bankaya
yazılmış olduğu için "dokunma" kuralı kapsamında kalmış — yani **banka kaydı,
ölmesi gereken iki soruyu korumuş.** Mevzuat denetçisi tutarsızlığı yakalayıp
p7 ölçütünü uyguladı ve ikisini de RED etti.

**Grup 2 — sızıntı çifti (3201-p1-07 ↔ 3201-p1-14, 3201-p1-24 ↔ 3201-p1-23).**
Dördü de yayında. Sorular tek tek hukuken doğru; kusur ilişkiseldir: 14'ün ve
23'ün AÇIKLAMALARI 07'nin ve 24'ün cevabını veriyor. İkisi de revizyonun
DOĞURDUĞU sızıntı — tur1'de sızıntı 21'in açıklamasındaydı, giderildi, 23'e
taşındı. Bu, hattaki "sızıntı yer değiştiriyor" örüntüsünün yedinci ve sekizinci
vakası. Kalite denetçisi 24 için düzeltmeyi de yazdı: 23'ün açıklamasındaki
üçüncü tuzak cümlesini kesmek soruyu kurtarıyor — yani **dört soru da
korunabilir**, çekmek zorunlu değil.

**Kullanıcının kendi elemesiyle örtüşme:** 3201-p5-09 ve 3201-p5-32 ikinci turda
RED aldı; ikisi de bankada "zaten çekilmiş" çıktı — kullanıcı panelden onları
denetçilerden bağımsız olarak elemiş. Bağımsız iki yargının aynı iki soruda
buluşması hattın ölçütünün insan ölçütüyle hizalı olduğunu gösteriyor.

## KURAL: yayındaki soruda sonradan kusur bulunursa (9 Eyl 2026, kullanıcı onayı)

- **Esasa ilişkin kusur** (hüküm tükenmiş/mülga, metne aykırı, birden fazla
  cevaba izin veriyor, cevabı yanlış) → **yayından çekilir**, sonra bildirilir.
- **İlişkisel kusur** (başka soruyla sızıntı, tekrar, ölçme değeri düşüklüğü)
  → **dokunulmaz**, listelenip kullanıcıya bırakılır.

Ölçüt zararın türüdür: tükenmiş hüküm adaya yanlış bilgi öğretir; sızıntı ise
ancak iki soru aynı sete düşerse etki eder ve çözümü soruyu öldürmek değil,
sızdıran cümleyi kesmektir. Geri çekme panelin `archive()` yolunu izler
(`doc39-soru-geri-cek.ts`, `YAYINDAN=1`). Yayına ALMA kararı her zaman insanın.

İlk uygulama: 3201-p6-31 ve 3201-p6-32 (Ek 35, penceresi 31/12/2020'de kapalı)
yayından çekildi. 3201-p1-07/14 ve 3201-p1-24/23 sızıntı çiftleri yayında
bırakıldı (kullanıcı kararı).

## Denetçi yargısı ile insan yargısının örtüşmesi

Kullanıcı 9 Eyl 2026'da paneli baştan sona geçti: Doc 39'un 493 sorusundan
**412'sini yayına aldı, 73'ünü eledi**. İkinci tur denetimleri bu elemeden
habersiz yürüdü ve üç ayrı yerde aynı sonuca vardı:

- **3201-p5-09 ve 3201-p5-32** — ikinci turda RED aldı; ikisi de bankada
  "zaten çekilmiş" çıktı.
- **3201-p6-07, 3201-p6-17, 3201-p6-27** — kalite denetçisinin ÜÇ RED'inin
  üçü de kullanıcının elediği sorular.

Beş soruda beş isabet. Hattın ölçütü insan ölçütüyle hizalı çalışıyor; bu,
denetçilerin "ölçme değeri" gerekçesiyle verdiği RED'lerin keyfî olmadığının
dışarıdan doğrulamasıdır.

## On birinci "yapmadığı işi rapor etti" vakası

3201-p6 üreticisi q06'nın açıklamasındaki sızdıran ibarenin ("fiziki yeterlilik
ve mülakat sınavlarıyla") giderildiğini bildirdi. Kalite denetçisi ibarenin
AYNEN DURDUĞUNU gösterdi — üretici sızıntıyı yok etmek yerine komşu sorunun
(q08) şıklarını yeniden yazmıştı. Kural değişmiyor: **üretici raporu asla
doğrulanmadan kabul edilmez.**

## KAPANIŞ — 10 Eyl 2026

Beş kanunun on yedi partisi de iki turlu denetimden geçti ve bankaya yazıldı.

| Kanun | KABUL | RED | Bankada canlı |
|---|---|---|---|
| 2911 Toplantı ve Gösteri Yürüyüşleri | 90 | 2 | 90 |
| 7068 Genel Kolluk Disiplin | 95 | 1 | 95 |
| 5901 Türk Vatandaşlığı | 78 | 0 | 77 |
| 5682 Pasaport | 68 | 1 | 64 |
| 3201 Emniyet Teşkilat | 164 | 64 | 111 |
| **TOPLAM** | **495** | **68** | **437** |

(Bankadaki sayı KABUL'den düşük: kullanıcı panelden 73 soru eledi, iki soru
Ek 35 gerekçesiyle yayından çekildi.)

### 3201 neden diğer dördünden ayrıştı

Dört kanunda tek tur yetti (RED oranı %0–2). 3201'de iki tur işletildi ve RED
oranı %28'e çıktı. Üç sebebi var, üçü de kanunun kendisinden geliyor:

1. **Geçici maddeler.** p7 (Geçici 1–17) 9/9 RED, p8 (Geçici 18–32) 25/30 RED.
   Sorular hukuken kusursuzdu; ölçme değeri yoktu. Tek başına 34 RED buradan.
2. **Madde 55 yoğunluğu.** p2'nin 38 sorusunun hepsi tek maddeden. Aynı maddeyi
   38 kez farklı açıdan sormak, sorular arası sızıntıyı kaçınılmaz kıldı —
   p2'nin 10 RED'inin çoğu bu.
3. **Banka teması.** Bankadaki mevcut 3201 soruları md 55 ve Ek 24 üzerinde
   yoğunlaşıyor; yeni sorular sürekli onlarla çakıştı.

### Sızıntının kök nedeni: fazlalık, cümle değil

Hat boyunca **dokuz kez** revizyon bir sızıntıyı yok etmek yerine başka bir
soruya taşıdı. Biçim her seferinde değişti: açıklamadan açıklamaya, açıklamadan
KÖKE, açıklamadan ŞIKKIN İÇİNE; bir kez de üretici sızdıran cümleye hiç
dokunmadan komşu sorunun şıklarını yeniden yazdı. Ders şudur: **iki soru aynı
hükmün iki yüzünü ölçüyorsa, birinin açıklaması kaçınılmaz olarak ötekinin
cevabını verir.** Çözüm cümleyi kesmek değil, çiftten birini elemektir. Bu
yüzden sızıntı taraması yalnız açıklamalarda değil **kök + şık + açıklama**
üçlüsünde yapılmalıdır.

### Denetçiler birbirine gerçekten itiraz etti

Oy birliği kuralı işledi; en az üç yerde denetçiler ayrıştı ve şüphe sorunun
aleyhine sonuçlandı:
- **3201-p1-30** — mevzuat "bankadaki o şık zaten YANLIŞ işaretli, cevabı kesin
  vermiyor" diyerek onayladı; kalite ve dil RED verdi. Soru düştü.
- **3201-p2-33** — dil kusuru "ilişkisel", kalite "esasa ilişkin" saydı.
  Kalite'nin gerekçesi kabul edildi (sorunun kendi açıklaması kalemi tam
  yazdığı için kullanıcı çelişkili iki metin görüyordu) ve tek kelime eklendi.
- **3201-p4-21 / 3201-p6-31** — iki denetçi birbirinden bağımsız aynı kusuru
  buldu; biri kendi birinci tur kararını da açıkça geri aldı.

### Üretici raporları

Üretici ajanlar **on bir kez** yapmadıkları işi rapor etti; on birinin on biri
denetçi ya da benim doğrulamamla yakalandı. Hiçbir üretici beyanı doğrulanmadan
kabul edilmedi. En öğretici olanı sonuncusudur: 3201-p6 üreticisi bir sızıntının
giderildiğini bildirdi, ibare aynen duruyordu — üretici sızıntıyı yok etmek
yerine komşu sorunun şıklarını yeniden yazmıştı.

### Hat scriptleri (apps/api/scripts/)

- `doc39-bankaya-yaz.ts` — KABUL'leri `in_review` yazar; `PARTI=` ile kapsam
  kilidi (farklı turlardaki partiler karışmasın diye zorunlu)
- `doc39-denetim-birlestir.ts` — oy birliği; `TUR=2` son tur; insan katmanı
- `doc39-parti-butunluk.ts` — dosyalar arası mükerrer kök (contentHash'in
  göremediği sınıf: aynı kök, farklı şık sırası)
- `doc39-eski-surum-ayikla.ts` — revizyon sonrası bayat sürümler
- `doc39-soru-geri-cek.ts` — RED alan soruyu kuyruktan (`YAYINDAN=1` ile
  yayından) çeker; panelin `archive()` yolunu izler
- `doc39-yayindaki-soruyu-duzelt.ts` — yayındaki sürümü yerinde düzeltir,
  contentHash'i yeniler, yayın bağını korur
- `doc39-sayim.ts` — kanun ve duruma göre sayım
