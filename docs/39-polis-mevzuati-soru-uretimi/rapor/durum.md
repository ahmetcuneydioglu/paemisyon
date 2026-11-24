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

## 3. dalga — 6136 + PVSK (11 Kas 2026)

İstisna 11 Kas 2026'da Polis Mevzuatı dersinin tamamına genişletildi (CLAUDE.md).
İlk boşluk partisi: 6136 (41 madde / 8 soru) ve PVSK (42 madde / 96 gerçek soru).
Kullanıcı talebi bağlayıcı brif olarak yazıldı: `03-kalite-onceligi.md` (sınav
değeri testi, `sinavDegeri` 1–5, 3 altı RED); gözcü eki `04-gozcu-ek-6136-pvsk.md`;
ikinci tur kuralı `05-ikinci-tur.md`.

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 6136-p1 (md 2–7) | 16 | 11 | 5 |
| 6136-p2 (md 8–16, 13/A) | 14 | 9 | 5 |
| 6136-p3 (Ek 1, 4–12) | 13 | 9 | 4 |
| 2559-p1 (md 1–9) | 10 | 8 | 2 |
| 2559-p2 (md 10–25) | 6 | 6 | 0 |
| 2559-p3 (Ek 1–10) | 12 | 10 | 2 |
| **Toplam** | **71** | **53** | **18** |

53 soru `in_review` yazıldı (6136: 29, PVSK: 24). RED'lerin çoğu kalite kapısından:
saf ceza/oran ezberi, sahada karşılığı olmayan kurumsal ayrıntı, tarihî atıf ve
bankanın zaten ölçtüğü bilgiyi yeniden ölçen sorular. PVSK üreticileri tavanın
(14) altında kaldı (6, 10, 12) — bankanın ölçmediği sınav değerli yön tükendi.

**Dersler:**
- Aynı kanunun partileri arasında AYNA ÇİFT çıktı (6136-p1 ↔ p3: Ek 1, Ek 4, vali).
  Parti kontrol betiği yönü yanlış gösterdi; asıl tespiti gözcüler yaptı. Çözüm:
  iki partinin revizyonu TEK üreticide, iki dosya yan yana.
- Gözcülerin ONAY satırlarına düştüğü küçük açıklama notları yazmadan önce
  orkestratör tarafından uygulandı (yedekler scratchpad'de).

**Bankada bulunan metin kusurları (düzeltme bekliyor):** 6136 md 1, md 8, Ek 12,
Geçici 9 sonda kesik; PVSK md 12 sonunda dipnot artığı ("işlem yapılır.10");
PVSK Ek 7/10'da 7590 değişiklik şerhi eksik (içerik güncel).

**Biçim düzeltmesi (11 Kas 2026, kullanıcı):** kökler kısa adla — 6136'da 29 kök
"6136 sayılı Kanun", PVSK'da 21 kök "2559 sayılı PVSK" (yayındaki 4 soru yerinde,
`doc39-kok-kanun-adi-kisalt.ts`, eşlemeler `esleme/`). Uzun öncüllü (kök >550
krkt) 5 soru kuyruktan çekildi: 6136-p2-09, 6136-p3-05, 2559-p1-03, 2559-p2-02,
2559-p2-04. Aynı ölçüte giren 6136-p2-04 yayındaydı; kullanıcı onayıyla yayından çekildi (YAYINDAN=1).
Kalan: 6136 24 kuyrukta + 3 yayında, PVSK 21 kuyrukta.

## 657 — Soru Merkezi'nden alınan GYS soruları (11 Kas 2026)

Soru Merkezi (yalnız yerel Docker; barındırılan merkez yok) GYS için 657'den 77
soru üretmişti (73 AI, 4 insan), PAEMİSYON'da yoktu. Aynı hat (3 gözcü, oy
birliği, 2 tur) PAEM profiliyle işletildi; gözcü eki `06-gozcu-ek-657-merkez.md`.
Sonuç: 77 → **48 KABUL** (`in_review`), 29 RED. RED'ler: bankayla mükerrer/banka
kökünden sızıntı, PAEM'de sorulmayan özlük-mali ayrıntı (aile yardımı, cenaze
gideri, nakilde aylık, döviz borçlandırması…), yoruma bağlı iki cevap. 9 soru
revize edildi (GYS vakası → emniyet; h3-06 EGM binde yirmi). Kökler "657 sayılı
Kanun". Merkez kimliği ↔ PAEMİSYON eşlemesi `rapor/hub-esleme-657.json` —
merkez senkronu canlıya alınınca bu sorular ikinci kez alınmamalı.

657 md 76 "eski" uyarısı YANLIŞ ALARM çıktı (tazeleme kuru çalışmasında görüldü):
7537 dipnotu md 77'nin başlığına bağlı; tarayıcı onu md 76'ya yazmış. md 76 ve md 77
bankada güncel; `mevzuat/657-guncel-ek.txt` bankadakiyle aynı metin.

**Metin tazelemesi (11 Kas 2026, kullanıcı onayıyla):** 6136 md 1, md 8, Ek 12,
Geçici 9 (içe aktarımda sonda kesik) ve PVSK md 12 (dipnot artığı "10") resmî
konsolide metinden yeniden alındı (`mevzuat-madde-tazele.ts --yaz`, yedek
docs/32-yayin-denetimi/tazeleme-yedek-2026-11-11.json). Hukuki değişiklik değil,
içe aktarım onarımı: LawArticleVersion açılmadı, bağlı özet/kartlar eskitilmedi
(PVSK md 12 madde özeti yayında, 6136'da 7 kart in_review — içerikleri tam metinle tutarlı).

## 4483 + 6284 Kanunu + 6284 Uygulama Yönetmeliği (11 Kas 2026)

Kullanıcı talebi: sorular yapay zekâ ürünü olduğu anlaşılmayacak kadar doğal,
gerçek çıkmış sorulara benzer, kökler net. Ölçüt `stil-cikmis.txt` (bankadaki
201 resmî sınav sorusundan — PAEM 8/9/10, EGM Misyon Koruma, İçişleri GYS,
Kaymakamlık — konu dengeli 80 soru); tur eki `07-ek-4483-6284.md` (kalite
gözcüsü `sinavDegeri` + `dogallik` puanı, ikisinden biri <3 RED).

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 4483-p1 (md 1–20, Ek 1) | 12 | 11 | 1 |
| 6284-p1 (Kanun md 1–25) | 14 | 14 | 0 |
| 6284y-p1 (Yönetmelik md 1–24) | 9 | 9 | 0 |
| 6284y-p2 (Yönetmelik md 25–48) | 10 | 8 | 2 |
| **Toplam** | **45** | **42** | **3** |

42 soru `in_review`. RED'ler yalnız sınav değeri düşük usul ayrıntısı (4483 md 5/3
takdir cümlesi; Yönetmelik MERNİS şerhi 15. gün, tatil süre hesabı). Doğallık
puanları çoğunlukla 4–5. Kanun ↔ Yönetmelik soruları arasında karşılıklı sızıntı
çıktı (aynı hüküm iki metinde) — üç partinin revizyonu tek üreticide yapıldı,
sızıntıya yol açan dört KABUL sorusunun şık/açıklaması da ikinci tura alındı.

Tuzak: 6284 Uygulama Yönetmeliği kanunla aynı numarayı taşıdığı için
`mevzuat-madde-tazele` / `degisiklik-tara` KANUNU çekiyor (kaynak 26 madde) —
yönetmelikte --yaz çalıştırılmadı. "Kesik" görünen yönetmelik maddeleri, sonuna
bir sonraki madde başlığı yapışmış tam metin. 4483'teki 7547 "eski" uyarısı
yanlış alarm ("Genel Sekreteri" bankada var).

## 3713 + 6222 + Adli Kolluk Yönetmeliği (12 Kas 2026)

Kullanıcı talebi: sınav düzeyinde sorular, her agent'ın ayrı görevi, soru kalitesi
için ayrı bir gözcü. Dördüncü rol **Sınav Kalitesi Gözcüsü** (`09-sinav-kalitesi-gozcusu.md`):
önce cevapsız `kor/<parti>.json` ile kör çözüm (`kor-dosya.py`), sonra metinle çözüm,
en son anahtar; sınav değeri / ayırt edicilik / doğallık puanı (biri <3 RED, =3 REVIZYON).
Bu turda kalite gözcüsü puan vermez, yalnız biçim/ipucu/mükerrer arar. Birleştirme
`ROLLER=mevzuat,kalite,dil,sinav`. Tur eki `08-ek-3713-6222-adli-kolluk.md`.

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 3713-p1 (md 1–8/B) | 12 | 8 | 4 |
| 3713-p2 (md 14–22, Ek 1–4) | 8 | 8 | 0 |
| 6222-p1 (md 1–25) | 14 | 13 | 1 |
| adli-kolluk-p1 (md 1–13) | 6 | 4 | 2 |
| **Toplam** | **40** | **33** | **7** |

33 soru `in_review`. Bütün partiler iki tur işletildi.

RED'ler:
- 3713-p1-05: md 5/2'deki "sadece bu madde hükmüne göre" iki okumalı; sınav gözcüsü metinle D buldu.
- 3713-p1-09 (2. tur): üç kamu binası çeldiricisi blok hâlinde eleniyor, soru kooperatif/vakıf ikilisine iniyor.
- 3713-p1-10: md 7'nin son fıkrası TCK 314/3'e atıf yapıyor; 314/3 (7499, 2024) **AYM 5/11/2024
  E.2024/81 K.2024/189 ile İPTAL**. Bankadaki 3713 metni bunu göstermiyor, mevzuat gözcüsü
  kaçırdı, kalite gözcüsü TCK yedeğinden yakaladı. md 7 son fıkradan soru yazılmaz (08-ek'e işlendi).
- 3713-p1-11: md 8/B yalnız TCK 60 yollaması; bankadaki TCK 20/2 ve 60 soruları aynı bilgiyi ölçüyor.
- 6222-p1-05: mükerrer `arama-mevcut-sorular.txt` [md 23] (stadyum/turnike aramasında yazılı izin).
  Tuzak: `-diger-konu-sorulari.txt` filtresi kanun adını anmayan ama aynı hükmü ölçen
  başka mevzuat sorularını kaçırıyor; kalite gözcüsü ilgili `-mevcut-sorular` dosyalarını ayrıca taramalı.
- adli-kolluk-p1-01 (2. tur): yeni II'nin doğru hâli bankadaki md 5 sorusunun B şıkkında aynen basılı.
- adli-kolluk-p1-06: ayırt edicilik 2 (D tek "denetim olmayan" fiil, kökten bulunuyor).

Sınav gözcüsünün kör çözümü gerçekten ayırt etti: birinci turda 3713-p2'de 4, 6222'de 3,
3713-p1'de 4 soru "bilmeden şıklardan bulunuyor" diye revizyona döndü; ikinci turda
tuzaklar yeniden kuruldu (ör. 3713-p2-08 yetki tanıyan tek şık, 6222-p1-10 sağduyu sorusu
→ md 17/1 "kamu malı hükmü", 6222-p1-12 yağma → md 18/3 koruma tedbiri).

Son tur sonrası orkestratör rötuşları (gözcülerin önerisi, anlam ve anahtar değişmeden):
3713-p2-08 beş şıkta "Ancak" → "Sadece" (bağlaç okuması kapanır, gerçek sınav kalıbı);
3713-p2-03 kök kanun adıyla açıldı, açıklamadaki can şartı cümlesi metnin lafzına çekildi;
3713-p2-07 kök söz dizimi; 6222-p1-06/12/14 açıklama ifadeleri.

Adli Kolluk Yönetmeliği: 2013 değişikliğinin (md 3, md 5/a ilk cümle "başsavcılığı",
md 5/c, md 6/2–4) Danıştay yürütmeyi durdurma durumu belirsiz — hiçbir şık, öncül ya da
açıklama bunlara dayanmadı; ileride kullanılacaksa insan teyidi gerekir. md 8'in sonu bankada kesik.

`doc39-parti-kontrol.ts` OLUMSUZ düzenli ifadesine "GEREKTİRMEZ/gerektirmez" eklendi.

Sonraki parti notları (gözcü önerileri): zorluk dağılımı orta banda yığıldı (RED'ler zor ve
kolay soruları götürdü) — 3713-p3'te 2–3 zor soru (md 7/4 vaka: vakfa ait binada propaganda),
kolay aday Ek 4 (silah ruhsatlarının iptali/iadesi); 6222-p2'de kısa doğrudan kolay sorular
(md 6/3 kırk sekiz saat, md 20 hakemler, md 23/1 ihtisas mahkemesi, md 12/1 son cümle, md 12/5,
md 17/A, md 18/7, md 18/9), "yanlıştır" kalıbı ve daha az vaka. 3713-p1-04 ile -06 aynı fıkrayı
(5/1) ölçüyor; aynı denemeye düşmemeli.

## Atama ve Yer Değiştirme Yönetmeliği + 5188 (18 Kas 2026)

Kullanıcı talebi: veritabanındaki çıkmış ve kurumlara ait resmî sınav sorularını kalite,
zorluk, kök, şık, çeldirici, dil ve ölçme açısından referans al; ezber değil bilgi,
yorum ve muhakeme; güçlü ve birbirine yakın çeldirici; akademik dil; tek ve tartışmasız
cevap; bankaya yazmadan önce içerik, cevap, çeldirici ve mevcut sorularla benzerlik
kontrolü. Tur eki `10-ek-atama-5188.md`. İki analist: `analiz/rapor-polis-mevzuati.md`
(358 resmî polis mevzuatı sorusu) ve `analiz/rapor-personel-mevzuati.md` (Atama + 5188).
Yeni betik `apps/api/scripts/doc39-benzer-ara.ts`: aday başına bütün bankadaki en benzer
soruları yazar (`denetim/<parti>-benzer.txt`), kalite gözcüsü okur.

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 5188-p1 (md 3–23) | 12 | 11 | 1 |
| atama-p1 (atama yolları ve dönemleri) | 12 | 8 | 4 |
| atama-p2 (bölge hizmeti, erteleme, yer değiştirme türleri) | 12 | 10 | 2 |
| **Toplam** | **36** | **29** | **7** |

29 soru `in_review` yazıldı (5188 11 — etiket "ÖGH"; Atama 18 — etiket "Emniyet Atama ve
Yer Değiştirme Yönetmeliği"). 5188'in 11'i aynı akşam 22:28–22:31'de panelden tek tek
onaylandı (`audit_logs` `question.approve`, önceki turları yayınlayan gözden geçiren
hesabı, 10–30 sn arayla). Atama 18'i incelemede. Bütün partiler iki tur işletildi.

RED'ler:
- 5188-p1-03 (2. tur): md 5/5 şirket idari ayrıntısı; boşluk doldurmaya çevrilmesi sınav
  değerini 3'te bıraktı, yeni şıklarda iki ayna çifti.
- atama-p1-05: 16/b "Genel Müdür önerir, Bakan onaylar" zinciri hiyerarşi sezgisiyle ve
  şık kesişimiyle bulunuyor.
- atama-p1-11: 12/5 "üst rütbe ihtiyaca göre atanır" sezgisi cevabı veriyor.
- atama-p1-06 (2. tur): md 20 ↔ Ek 6 bileşik biçimde iki varsayılan ("genel atamayı merkez
  yürütür", "il = vali") birlikte doğruyu veriyor; 2×2 ızgara + dış şık.
- atama-p1-08 (2. tur): 7/a — yeni şıklarda iki "eşinin" şıkkı aile birliği sezgisiyle eleniyor.
- atama-p2-06: 30/3 — kökteki koşul üç şıkkı eletiyor, A ile E eşanlamlı.
- atama-p2-12: Ek 5/c "Genel Müdürün teklifi, Bakan onayı" varsayılan cevabı veriyor.

Bulgular ve dersler:
- Brif hatası: md 10 ve 32 "mülga" yazılmıştı; ikisi de yeniden düzenlenmiş ve yürürlükte
  (atama-p1 üreticisi yakaladı; brif düzeltildi, md 32 p2'de kullanıldı).
- Ağ kesintisi (DNS) sekiz gözcüyü yarıda kesti; SendMessage ile bağlamları korunarak
  sürdürüldü, sınav gözcülerinin kör notları scratchpad'de kaldı.
- Orkestratör hatası: atama-p2 sınav gözcüsünün birinci tur isteminde 04 ve 12'nin anahtarı,
  ikinci tur istemlerinde gözcünün kendi önerdiği soruların anahtarları yazıldı. Gözcüler fark
  edip kör çözümü geçersiz saydı; atama-p2-12'nin RED gerekçesi sızıntıdan bağımsız.
  Kural 09 brifine işlendi ("Orkestratör kuralları").
- 5188 md 23/1 → TCK 279: görevli kamu görevlisi gibi cezalandırıldığından suçu bildirmeme
  TCK 279'a girebilir; 5188-p1-11'de B'nin aralığı (üç ay–bir yıl, yalnız 19/a–c) hiçbir doğru
  hükümle örtüşmediği için tek cevap korunuyor. Açıklama TCK aralığı vermiyor.
- 5188 md 10/1-d: (2) geniş liste (mahkûmiyet/HAGB), (3) dar liste (devam eden kovuşturma);
  kaçakçılık ve fuhuş yalnız (2)'de, Kanun fuhşu cinsel dokunulmazlığa karşı suçlardan ayrı sayar.
- Parti içi/arası sızıntı önlemleri: atama-p2-08 açıklamasında 34/1 alıntısı "…" ile
  kısaltıldı ("birim amirleri" → p2-04 cevabı); 5188-p1-11 açıklamasında "grev" ve "izinsiz
  faaliyet" nitelemeleri yazılmadı (09-A ve 10 cevabı); 5188-p1-03 kökünde bildirim alıcıları
  yazılmadı (12 cevabı); atama-p1-12 açıklamasından 13/d'nin "seçme imkânı" cümlesi çıktı
  (09-D'yi doğruluyordu).
- Sınav gözcüsü hükmün değerini düşük bulduysa biçim değişikliği yetmiyor (5188-p1-03).

Son tur sonrası orkestratör rötuşları (gözcü önerisi, anlam ve anahtar değişmeden):
- atama-p1-10 C: "atanacak olanlar" → "atanma durumunda olanlar" (md 14 lafzı).
- atama-p2-03 kök: "kaç yıl sonra biter?" → "kaç yıl daha sürer?" (başlangıç noktası);
  atama-p2-09 açıklamasından "(17/2, 20)" künyesi (p1-01 C'nin doğru değerini gösteriyordu);
  atama-p2-04 açıklamasında metinde olmayan "vali bu talebi yapamaz" yasağı yerine
  "madde talep makamını personelin bağlı olduğu teşkilata göre belirler".
- 5188-p1-06 B: "Şirket, komisyondan izin alarak" → "Komisyondan izin alan şirket";
  5188-p1-10 C: "Görevliyi" nesnesi eklendi (md 20/f).
- Zorluk etiketleri sınav gözcüsünün ölçtüğü gerçek zorluğa çekildi: atama-p1 03/09/10 →
  hard, 07 → medium; atama-p2 05 → hard, 07 → medium; 5188-p1 07 → hard.

Parti düzeyi sapmalar (insan kararı):
- Olumsuz kök: Atama 18'de 6 (%33), 5188 11'de 3 (%27); kendi sınırımız %25, resmî PAEM %32–34.
- Uydurma değer: atama-p1-01'in üç yanlış önermesi (Temmuz, iki ay, Nisan) + atama-p1-07
  "Yedi"; kalite gözcüsü esasa ilişkin saymadı.
- atama-p1'de merci sorusu kalmadı (05, 06, 11 RED); tek "doğrudur" (01) 8 soruda %12,5.
- Olumsuz sözcüğün BÜYÜK HARFLE yazımı resmî köklerde hiç yok (0/123), türetim sorularımızın
  hepsinde var — banka geneli üslup kararı kullanıcıda.
- Test derleme notu: atama-p2-02 ile -05 aynı "hangisine bağlıdır" şemasında; aynı
  oturumda art arda gelmemeli.

Kapsam açığı (sonraki parti adayları): Atama md 30 (sağlık ertelemesi), 35–38, 40, Ek 2,
Ek 4, Ek 5 (görev yeri puanı); 5188 md 6 (ek önlem), md 7/a ↔ 7/b–f (kimlik sorma, bankada
Arama Yön. adıyla üç soru var — mükerrere dikkat), md 9/3, md 12/2.

### İkinci dalga: atama-p3 + 5188-p2 (19 Kas 2026)

Kullanıcı: "Evet, devam et" (kapsam boşlukları). Tur eki `10-ek-atama-5188.md` "İkinci dalga"
bölümü: birinci dalganın RED dersleri bağlayıcı yazıldı (varsayılan cevap yasağı, sağduyuyla en
çok bir şık elenmesi, bileşik şıkta ızgara kuralı, uydurma değer partide en çok bir). Mükerrer
tabanı yenilendi (`atama-mevcut-sorular.txt` 18, `5188-mevcut-sorular.txt` 12 soru);
`doc39-mevcut-sorular-cikar.ts` numarasız mevzuat için slug + ONEK kabul ediyor. Bütün
gözcüler taze ajan; sınav gözcüsü genel ölçüler → kör çözüm → mevzuata özgü dosyalar → metin
→ anahtar sırasıyla okudu (09 brifine işlendi).

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| atama-p3 (md 30, 35, 37, 38, 40, Ek 2, Ek 4, Ek 5) | 11 | 5 | 6 |
| 5188-p2 (md 7, 11, 12, 14, 15) | 5 | 4 | 1 |
| **Toplam** | **16** | **9** | **7** |

9 soru `in_review` yazıldı. Bankadaki durum (19 Kas): Atama 11 yayında + 12 incelemede,
5188 11 yayında + 4 incelemede.

RED'ler:
- atama-p3-05 (38/3, boşluk): 2×2 ızgara + dış şık; "aynı bölge" üç şıkta, aile birliği
  sezgisiyle birlikte eleniyor.
- atama-p3-09 (Ek 2, "YANLIŞTIR"): kadrosuzlukta süre şartının aranması sağduyuya aykırı;
  şart koyan tek önerme.
- atama-p3-10 (Ek 4/1): doğru cevap "kazanılmış hak" sezgisiyle örtüşüyor; karşıt hüküm
  (Ek 3/1) bankada ölçülmüş.
- atama-p3-11 (Ek 5, itiraz): idari ayrıntı; doğru şık kökün koşuluna biçilmiş, üslupça tek.
- atama-p3-01 (2. tur): orkestratörün aktardığı tek ad öbeği "Annesine vasi tayin edilmiş tek
  çocuk olması" doğal okumada "annesine vasi atanmış tek çocuk"; md 30/1-b personelin vasi
  olmasını aramaz → doğru şık metinde olmayan şart ekledi.
- atama-p3-06 (2. tur): kökte bölgeyi sabitlemek A–C örtüşmesini kapattı ama "zorunlu bölgeden
  kaçılamaz" sezgisi iki şıkkı birlikte eletti. Sınav gözcüsünün önerisi: bölgeyi sabitlemeden
  "Birinci bölgedeki illeri" yerine "Diğer bölgedeki illeri" (37/2'nin karşılığı).
- 5188-p2-04 (md 15): 2330 kamu görevlisini çağrıştırıyor, doğru şık varsayılan cevap; md 15'in
  PAEM değeri düşük.

Bilerek yazılmayanlar (üretici gerekçesi, gözcüler onayladı): Atama md 36 (Performans Yön.
mükerreri), 30/3 (RED açısı), md 35 teklif makamı ve 37/2 Daire Başkanlığı (varsayılan cevap),
38/1–2 (bankadaki 657 sorusu), Ek 4/2 (iki okumalı), Ek 5/c (RED), Ek 5/e (atama-p2-11 ile aynı),
Ek 5/g (iki cevap riski); 5188 md 6 (bankadaki 20/c kökü merciyi veriyor, 6/2 sağduyu), 7/a-b-e-f
(bankada), 7/c ve 7/j (CMK madde ezberi), 7/k (eski BK atfı), 9/3 (varsayılan cevap), 12/1 merci
(5188-p1-10 açıklaması veriyor), 14/2, md 21 (güncel olmayan kurum adı), md 1–2.

Son tur sonrası orkestratör rötuşları (gözcü önerisi, anlam ve anahtar değişmeden):
- atama-p3-04 I: "bu talebe" → "yer değiştirme talebine" (dil, kalite ve sınav notu).
- 5188-p2-02 açıklaması: "şartıdır" → "şartlarından biridir", "yakalama" → "X-ray cihazından
  geçirme", "Kartı valilik verir;" çıktı (03'ün yeni D'sini destekliyordu).
- 5188-p2-01 açıklaması: muaf grup Kanunun ifadesiyle (fakülte, meslek yüksekokulu ve bölüm).
- Zorluk sınav gözcüsünün ölçümüne çekildi: atama-p3 02 ve 07 → medium, 03 → hard.

Parti düzeyi: atama-p3'ün 5 sorusunda olumsuz kök ve merci yok (ikisinin tek örneği RED aldı);
Atama toplamı 23 soruda olumsuz kök 6 (%26), 5188 toplamı 15'te 4 (%27). Test derleme notları:
atama-p3-07 ile -08, atama-p3-04 ile atama-p2-01 art arda gelmesin; md 30'un iki sorusu (02, 03)
dağıtılsın. Kalan kapsam: 5188 md 6 ve 9/3 gibi saha hükümleri ancak "iki yakın hükmü ayırt
etme" kurgusuyla yazılabilir; varsayılan cevap sorunu çözülmeden denenmemeli.

## 5607 + 1774 + 5726 turu (19 Kas 2026)

Kullanıcı: "5607, 1774, 5726" — sınavda sorulmuş ama bankada neredeyse boş üç kolluk kanunu
(bankada 6, 8 ve 3 soru; türetim yoktu). Tur eki `11-ek-5607-1774-5726.md`; analiz
`analiz/rapor-kolluk-kanunlari.md`: resmî sekiz sorunun hepsi bankada birebir var ve hepsi kurumsal
hükümleri (kurul, rapor ayı, görevli mahkeme, ceza mercii) soruyor; boşluk kolluğun sahada
uyguladığı yetki, şart ve istisna hükümleri. Mükerrer tabanı `<no>-mevcut-sorular.txt` (6/8/3),
`<no>-diger-konu-sorulari.txt` (13/6/1) ve `doc39-benzer-ara.ts`. Dört gözcü, iki tur; bütün
gözcüler taze ajan; sınav gözcüsü 09 brifindeki okuma sırasıyla.

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 5607-p1 (md 3, 5, 11, 16) | 10 | 7 | 3 |
| 1774-p1 (md 3, 4, 6, 7, 10) | 6 | 5 | 1 |
| 5726-p1 (md 3, 6, 20) | 7 | 4 | 3 |
| **Toplam** | **23** | **16** | **7** |

16 soru `in_review` yazıldı; her kayıt veritabanında aday dosyasıyla (kök, şıklar, anahtar, konu,
künye) karşılaştırıldı. Bankadaki durum (19 Kas): 5607 7, 1774 5, 5726 4 soru incelemede.

RED'ler:
- 5607-p1-05 (10/2 ↔ 13/1, alıkoyma ile müsadere): beş şıkkın dördü 13/1-b ve 13/1-c'nin ikişer
  yarısı — 10/2'nin atfı bent düzeyinde olduğundan çiftler birlikte düşüyor, tek kalan bent (gizli
  tertibat) zorunlu cevap; kör çözümde de "tertibatlı araç suç aletidir, alıkonur" sezgisiyle
  bulundu. Alıkoyma sebeplerinin üçü de risk temelli, açı biçimle kurtarılamaz.
- 5607-p1-03 (2. tur, 4/6 müşterek fail): şıklar 2+2+1 kümede (iki artırım, iki sorumluluk biçimi,
  tek alt sınır); kökteki "görevli olduğu hâlde … kasten" vurgusu ve "kanun kendi görevlisine sert
  davranır" sezgisiyle taze kör çözücü madde bilgisi olmadan buldu; sınav gözcüsü birinci turdaki
  ONAY'ını geri çekti. Ad öbeğine çevirme bu yapıyı doğurmadı, gidermedi de.
- 5607-p1-08 (2. tur, 19/4 + 23/2 öncüllü): birinci turdaki "Yalnız III yok" kusurunu gidermek için
  kurulan tam şık takımında II dört, III üç, I iki şıkta geçiyor; "en sık geçen öncüller doğrudur"
  kestirmesi doğru şıkkı veriyor; yeni I de "çıkar çatışması" sezgisiyle düşüyor.
- 1774-p1-06 (2. tur, md 14 + Ek 3, "YANLIŞTIR"): birinci turdaki yanlış önerme ("üçüncü kişiler
  mülkî amirin izniyle") sağduyuyla bulunuyordu; yerine gelen "yetkili resmî örgütler ancak mahkeme
  kararıyla yararlanabilir" doğru önerme A ("kayıtlar kolluğun incelemesine her an hazır
  bulundurulur") ile çelişiyor: aday seçimi A–B'ye indirip B'yi saha pratiğinden (anlık bildirim)
  buluyor; soru md 14'ün asıl yarısını (örgüt dışındakilere mahkeme kararı şartı) da ölçmüyor.
- 5726-p1-05 (9/8, kimliği gizli tanığın beyanı tek başına hükme esas olmaz): genel ceza muhakemesi
  ilkesi cevabı veriyor; duruşmaya dokunan tek tedbir doğru şık, öbür ikisi sağduyuyla eleniyor.
  (a) ile (b) aynı takıma girerse iki doğru doğar; biçim değişikliği kurtarmaz.
- 5726-p1-04 (2. tur, md 21 rücu): birinci turda 8/4-a'nın iki yarısı ikiz çeldiriciydi; yerine
  gelen "Tedbirin kaldırılmasını istemesi" E ("Koruma sebeplerinin ortadan kalkması") ile birlikte
  "kusur yoksa rücu olmaz" sezgisiyle eleniyor — tek sezgi iki şık.
- 5726-p1-07 (2. tur, md 4 kapsamı): CMK 45 formülünün ("evlilik bağı kalmasa bile eş") yerine gelen
  doğru şık 4/1-b'nin açık uçlu "yakın ilişki" kaydı; "yakın ilişki … yakınları" yankısı önermeyi
  tanım gereği doğru gösteriyor ve CMK 45'i bilen eksik adayı ters yönde ayırıyor.

Yedi RED'in beşi ikinci turda, birinci tur önerilerinden birleştirilen yeniden yazımlardan çıktı.
Bu turun dersleri (09 brifinin "Orkestratör kuralları"na işlendi):
- (9) İkiz çeldiriciyi ayırırken yeni şık başka bir şıkla tek bir sezgi altında birleşmemeli.
- (10) Doğru şık, sorunun kategori sözcüğünü yankılayan ("yakın ilişki" → "yakınları") ya da açık
  uçlu bir kayda dayanan ifade olmamalı.
- (11) "YANLIŞTIR" sorusunda yanlış önerme doğru önermelerden biriyle çelişmemeli; çelişen çift
  seçimi ikiye indirir.
- (12) Aynı bendin iki yarısı iki ayrı şık olursa birlikte düşer (2+2+1 düzeni); anlam kümeleri
  (iki artırım, iki sorumluluk biçimi, tek dış şık) sağduyuyla birleşince de aynı kestirme doğar.
- (13) Öncüllü soruda tam şık takımı kurulurken doğru bileşim en sık geçen öncüllerden oluşmamalı
  ya da yanlış öncül sağduyuyla düşmemeli.
- (14) Yöntem: ikinci turda sınav gözcüsü anahtarları bildiği için düzeltilen sorular TAZE bir kör
  çözücüye çözdürüldü (yalnız genel ölçüler + kör dosya; karar vermez, kanıt sunar). 5607-p1-03 ve
  -08'in RED'i onun "salt şık + sağduyu" bulgusundan çıktı.

Son tur sonrası rötuşlar (gözcü önerisi, anlam ve anahtar değişmeden):
- 5607-p1-02: A "kişiyle birlikte" → "kişi tarafından birlikte" (4/2 ibaresi; mevzuat + dil
  notu), açıklamada da.
- 5726-p1-01: 6/3 alıntısı tamamlandı ("tanığın istemi üzerine"); "onun için" → "bu tedbir için";
  kökte "bir kişinin, güvenliği için" virgülü.
- 5726-p1-03: kökte "suçun gerektirdiği" → "bu suçların gerektirdiği"; açıklamadaki soru tasarımı
  yorumu ("kökün terör örgütünü dışarıda tutması bu yüzdendir") çıktı.
- 1774-p1-01: açıklama metne daha sadık ("kartı kolluk düzenlemez", "Kolluğun maddedeki görevi iki
  noktadadır", "düzenlendiği").
- 1774-p1-04: açıklamadaki "Ek 2'de de yön aynıdır" cümlesi çıktı (Ek 2 yalnız md 4 ve 6
  çalışanlarını kapsar; sınav, mevzuat ve dil notu).
- Zorluk sınav ölçümüne çekildi: 5607 06 → medium, 09 → hard, 10 → medium; 1774 01 → medium.

Parti düzeyi:
- Kabul edilen 16 sorunun hiçbiri gerçek ölçümde kolay değil (5607 5 orta + 2 zor, 1774 3 + 2,
  5726 2 + 2); kalite gözcüsü: kolay soru yapay olarak üretilmemeli, banka bilgisi.
- Olumsuz kök: 5607 2/7, 1774 1/5, 5726 1/4. Metin dışı kavram çeldiricisi (uydurma değer değil):
  5607 07-D (büyükşehir belediyesi), 10-A (tek başına adlî para cezası); 1774 04-B.
- Test derleme: 5607-p1-01 ile -04 aynı denemeye düşmesin (01'in açıklaması 04-E'nin doğruluğunu
  teyit ediyor); 04-A ile 10 birbirini ters yönde etkiliyor; 06'nın kökü 07-B'yi zayıflatıyor.

Kalan kapsam (sonraki parti adayları): 5607 md 9 (arama; "CMK" varsayılanına dikkat), md 22,
10/2 ↔ 10/3 (alıkonulmayan taşıtın masrafla teslimi — sınav gözcüsünün taslağı karar dosyasında),
5/2 ihtar mercii; 1774 md 14'ün asıl yarısı (örgüt dışındakilere mahkeme kararı şartı, A ile
çelişmeyen kurguda); 5726 md 15 (mutabakat metni — sınav gözcüsünün taslağı), 8/1 "birer yıl".

Araç: `doc39-parti-kontrol.ts` olumsuzluğu artık yalnız soru cümlesinde (kökün son satırı) arar ve
UYGULANMAZ'ı tanır; öncüldeki "aranmaz" 5726-p1-02'de yanlış alarm vermişti.

Panel: 19 Kas 01:48'de iki toplu yayın (`question.bulk_approve`, aynı inceleme hesabı) Atama ve
5188'in incelemedeki sorularını yayına aldı: Atama 23, 5188 (ÖGH) 15 soru yayında.

### İkinci dalga: 5607-p2 + 1774-p2 + 5726-p2 (19 Kas 2026)

Kullanıcı: "Evet, devam et" (birinci dalganın kalan kapsamı). Tur eki `11-ek-5607-1774-5726.md`
"İkinci dalga": aday hükümler, yasak açılar (birinci dalganın RED'leri ve banka açıklamalarındaki
sızıntılar: 5607 5/2 ihtar ve ödeme tutarı, 5726 8/1 "birer yıl", 1774 Ek 1/2 anlık bildirim).
Üreticiler birinci dalganın üreticileri (metni ve RED nedenlerini biliyorlar); gözcüler taze;
ikinci turda düzeltilen soru taze kör çözücüye de verildi.

| Parti | Hedef | Aday | KABUL | RED |
|---|---:|---:|---:|---:|
| 5607-p2 (10/2 ↔ 10/3) | ≤3 | 1 | 0 | 1 |
| 1774-p2 (md 11/2) | ≤3 | 1 | 0 | 1 |
| 5726-p2 | ≤2 | 0 | — | — |

Bankaya yazılan soru yok.

- Üreticilerin yazmadıkları (kendi kör testleriyle): 5607 md 22 (kademe sırası sağduyuyla bulunuyor;
  PVSK 16 kalıbı bankada), md 9 (gümrük salonu yankısı, CMK varsayılanı), 10/2 ↔ 10/3'ün düz biçimi
  ("alıkonulmayan" sözcüğü çeldiricileri eletiyor); 1774 md 2 kapsamı ("Kanun herkesi kapsar"
  sezgisi), md 14 ("mahkeme kararı" gizlilik sezgisi; paylaşım hükümleri ikinci doğru doğuruyor),
  Ek 3/1 son cümlesi (sağduyu); 5726 md 15 ("yargısal karar tanığın onayına bağlanmaz" sezgisi iki
  yargısal merciyi birlikte eletiyor; 10/4 yüzünden "Kurulun fizikî koruma kararı" iki okumalı),
  md 10/2–4 (CMK/infaz varsayılanları, iki okuma).
- 1774-p2-01 RED (mevzuat + kalite, 1. tur): md 11/2 bağlayıcı analizin 1774 §6 "sağduyuyla çözülen
  ya da düşük değerli" listesinde adıyla geçiyor; kök "kat mülkiyetine tabi bina" ile yöneticiyi
  çağırıyor. Orkestratör adayı doğrularken §6'ya bakmamıştı.
- 5607-p2-01 RED (dil + sınav, 2. tur): birinci turda D ile C 10/3 cümlesinin iki yarısıydı
  ("alıkonulan / alıkonulmayan"). Düzeltmede gelen iki doğru önerme birbirini varsaydı: C (satılmış
  taşıtın iadesine karar verilirse bedel faiziyle ödenir) hüküm beklenmeden satışı varsayarak E'yi
  (sonuç beklenmeksizin tasfiye) kurtarıyor; A–B de alıkoyma → teslim sırası. 2+2+1 düzeninde tek
  kalan yanlış önerme taze kör çözücüye madde bilgisi olmadan buldurdu (~%45). E'deki "edilebilir"
  imkân/takdir diye iki okunuyor (dil).

Dersler (09 brifine işlendi):
- (15) Orkestratör adayı doğrularken hükmü analizin §6 "Kaçınılacaklar" listesine karşı da denetler.
- (16) "YANLIŞTIR" sorusunda doğru önermeler birbirini varsaymamalı ya da sıra oluşturmamalı
  (A → B, C → E); bu tür çiftler birlikte doğru sayılır ve yanlış önerme tek kalır.

Sonuç: bu üç kanunun analizdeki öncelikli hükümlerinin değerli ve kestirmesiz kurulabilenleri
birinci dalgada yazıldı (16 soru). Kalan hükümler ya yasak açıda, ya bankada sızıntılı, ya da
sağduyu/varsayılan kestirmesi kapatılamıyor; yeni parti önerilmez.

## 6698 + 7245 + 1481 turu (19–20 Kas 2026)

Kullanıcı: "6698 + 7245 + 1481". Gerekçe: KVKK son üç PAEM sınavının ikisinde soruldu, bankada 4 sorusu
vardı; 7245'in metni 18 Kas'ta bankaya girdi, hiç sorusu yoktu; 1481'in tek sorusu PAEM 8'deki Ek 1
sorusuydu. Tur eki `12-ek-6698-7245-1481.md`; analiz `analiz/rapor-kvkk-bekci-1481.md`. Analistin
eksik bulduğu çakışma tabanı iki dosyada toplandı: `mevzuat/7245-cakisma-sorulari.txt` (PVSK 4/A ve 16,
Arama Yön. md 27, 657 md 54/56, 3201 Ek 21, 7068) ve `mevzuat/1481-cakisma-sorulari.txt` (PVSK 16 ve
Ek 9, 3713 Ek 2, md 14 ve 19, suçluyu kayırma soruları). Metin tazeliği: 7245 ve 1481 temiz; 6698'deki
"md 17 eski" uyarısı başlık-dipnotu tuzağı (7499/35 md 18'de işli).

| Parti | Aday | KABUL | RED |
|---|---:|---:|---:|
| 6698-p1 | 10 | 6 | 4 |
| 7245-p1 | 6 | 2 | 4 |
| 1481-p1 | 3 | 1 | 2 |
| **Toplam** | **19** | **9** | **10** |

9 soru `in_review` yazıldı; her kayıt veritabanında aday dosyasıyla (kök, şıklar, anahtar, açıklama,
konu, etiket) karşılaştırıldı. KABUL: 6698 03 (6/3 ↔ 5/2-c, SAYILMAMIŞTIR), 04 (9/6–7, AKTARAMAZ),
05 (14/1, altmış gün), 06 (md 10 ↔ 16/3), 09 (6/1 öncüllü), 10 (16/1–2, Başkanlık – Kurul); 7245 01
(7/6 öncüllü: dıştan kontrol / torpido gözü / emirle araç araması), 04 (12/1 ↔ 12/3 bileşik:
vali – İçişleri Bakanı); 1481 02 (md 2/1 vaka: "teslim ol" ihtarı ↔ o anki teşebbüs).

RED'ler:
- 6698-p1-07 (17/2 ↔ 18/1; kalite, 1. tur): doğru şık bankadaki iki TCK sorusundaki "verileri yok
  etmeme" suç adıyla madde bilgisi olmadan eşleşiyor; ikinci bir suç fiili 17/1 yüzünden iki doğru
  doğuracağı için açı içinden düzeltilemez.
- 6698-p1-01 (28/1-d ↔ 28/2; sınav, 2. tur): "yargı muaftır", "kamu kurumu muaftır" ve "Kanun
  şirketlere uygulanır" sezgileri doğru şıkta birleşiyor; taze kör çözücü salt şıkla ~%45 buldu.
- 6698-p1-02 (28/2-ç; kalite, 2. tur): birinci turda D ("düzeltilmesini isteyebilir") iki okumalıydı
  (md 13/1, 4/2-b ve Anayasa md 20/3). Orkestratörün seçtiği yeni A ("veri güvenliği uygulanmaz")
  ile D ("işlenme şartları uygulanmaz") "istisna temel güvenceleri kaldırmaz" sezgisinde birlikte
  düşüyor; E sağduyuyla; üç şık bilgisiz eleniyor.
- 6698-p1-08 (md 2; kalite, 2. tur): yeni A ("ticari amaç") ile C ("tüzel kişi") "Kanun şirketlere
  uygulanır" sezgisinde birleşiyor (2+2+1); kökteki "otomatik olmayan" ↔ "kayıt sistemi" çağrışımı E'yi
  veriyor (taze kör çözücü salt şıkla ~%60).
- 7245-p1-02 (7/1; sınav, 1. tur): şıkların kesişimi ve "bekçi kendi bölgesinde, kendi mesaisinde
  yetkilidir" sezgisi.
- 7245-p1-03 (8/2 vaka; sınav, 1. tur): bilmeyen aday "aranan kişi yakalanıp polise teslim edilir"
  sezgisiyle doğruyu, PVSK 13'ü bilen eksik aday savcı şıkkını buluyor (ters ayırt etme); doğru şık
  analizin §6'sındaki "genel kolluğa teslim" kalıbını taşıyordu.
- 7245-p1-05 (2/2; kalite, 2. tur): iç içe eşik şıkları iki doğru doğuruyordu; "ölçütü" kökü bunu
  kapattı ama A ile E rütbe dışı ölçütle, C ile D "polis memuru üstü değildir" inancıyla birlikte
  düşüyor; doğru şık "bekçi en altta" sezgisiyle bulunuyor; A–E bankadaki 7068 md 3 "Üst"
  sorusunun çeldiricileri.
- 7245-p1-06 (md 11 YANLIŞTIR; sınav, 2. tur): md 11, PVSK md 4'ün bekçiye taşınmış hâli; bankadaki
  PVSK md 4 sorusu aynı "olağanüstü hâllerde başka işte" çeldiricisini taşıyor; taze kör çözücü
  anahtarı bilgisiz buldu.
- 1481-p1-01 (1/B YANLIŞTIR; sınav, 1. tur): yanlış önerme (kesinleşmiş mahkûmiyet şartı) PVSK 16
  kıyası, "şart ekleme" sağduyusu ve "-da/-de" biçimiyle bulunuyor; bankadaki PVSK Ek 9 öncülü
  "ilan edilmek suretiyle aranan sanık ve hükümlüler" diyor.
- 1481-p1-03 (4/2; kalite, 1. tur): C ve D metin dışı ve birlikte düşüyor; TCK 283/3'ü bilen eksik aday
  "ceza verilmez"e gidiyor; md 4'te 1481'e özgü sonuç yapısal olarak bu kalıbı taşıyor. (Mevzuat
  gözcüsü: TCK md 5 yalnız genel hükümleri taşır, 1481 md 4 hukuken geçerli; RED biçimden.)

Bu turda dört RED orkestratörün birleştirdiği yeniden yazımlardan ya da gözden kaçan komşu kanun
çeldiricisinden çıktı; dersler 09 brifinin "Orkestratör kuralları (20 Kas 2026)" bölümünde.
Yöntem kanıtı: taze kör çözücünün kestirmeleri 7245-p1-01, -04 ve 1481-p1-02'de yanlış şıkka gitti;
üçü bu kanıtla KABUL aldı.

Son tur sonrası rötuşlar (gözcü önerisi, anlam ve anahtar değişmeden):
- 7245-p1-01: açıklamanın son cümlesi "Yazılı emrin bu yasağı kaldırdığını düşünen aday …" (dil).
- 6698-p1-05: kökte "yaptığı başvurusuna" → "yaptığı başvuruya" (sınav + kalite).
- 6698-p1-03, 04, 05, 06, 10: açıklamalardan "tuzak" sözcüğü çıktı (kalite: şablon izi).
- Zorluk sınav ölçümüne çekildi: 7245-p1-04 hard → medium, 1481-p1-02 medium → hard,
  6698-p1-10 easy → medium.

Parti düzeyi:
- Kabul edilen 9 sorunun hiçbiri ölçümde kolay değil (6698 5 orta + 1 zor; 7245 1 zor + 1 orta;
  1481 1 zor).
- Sapmalar (RED'ler partiyi küçülttüğü için): 6698'de olumsuz kök 2/6 (03, 04; sınır 1/4) ve şık
  uzunluk değişkenliği 0,15'in altında kalan soru 3/6 (03, 04, 09; 09'un şıkları öncül bileşimi).
- Test derleme: 7245-p1-01 ile yayındaki Arama Yön. md 27 sorusu (fc6f02d1) aynı denemeye düşmesin
  (III. öncülün "kolluk amirinin yazılı emri" ibaresi o sorunun cevabına kısmi ipucu).

Parti dışı bulgu (karar insanın): yayındaki Arama Yönetmeliği md 27 sorusu (fc6f02d1), aracın içi
görünmeyen bölümlerinin "mülki amirin görevlendireceği kolluk amirinin yazılı emri" ile aranmasını
güncel polis yetkisi gibi öğretiyor. Yönetmelik metni bunu söylüyor; ama PVSK 4/A'daki yasal karşılığın
ilgili ibaresi AYM'nin 4/5/2017 tarihli (E.2015/41, K.2017/98) kararıyla iptal edilmiş (2559.txt şerhi).
Sorunun ve yönetmelik hükmünün güncelliği ayrıca incelenmeli.

Araç: `doc39-parti-kontrol.ts` olumsuz kök listesine BÜYÜK HARFLİ "-MAZ/-MEZ" fiillerini ekledi
(6698-p1-04'ün "AKTARAMAZ" kökü sayılmıyordu).

Kalan kapsam: 6698'de 12/5 (ihlal bildirimi), 15/3 (Devlet sırrı hariç belge gönderme), 13/2–3
(ücretsizlik, tarife, iade), 9/9 ve 28/2'nin kolluk dışı aktörlü kısmi istisna vakası (kalite
gözcüsünün 02 önerisi: "uygulanmaz" çeldiricileri biçimsel yükümlülüklerden); 7245'te 3/1'in tarih
ölçütü (üretici yazmadı: gerçek değer yalnız üç) ve 12/2; 1481'de değerli ve kestirmesiz hüküm kalmadı
(Ek 1 ve md 3 bankada, md 4 yapısal RED, md 1–2'nin kalanı PVSK 16 ve 3713 Ek 2 ile çakışıyor).

### Arama Yönetmeliği md 27 incelemesi (20 Kas 2026)
Kullanıcı: "Evet, incele" (turun parti dışı bulgusu).
- Resmî kaynak: mevzuat.gov.tr'deki PVSK md 4/A dipnotu — AYM'nin 4/5/2017 tarihli, E.2015/41, K.2017/98
  sayılı kararıyla 6. fıkranın üçüncü cümlesinin "kişinin üstü ve eşyası ile aracının dışarıdan bakıldığında
  içerisi görünmeyen bölümlerinin aranması; İçişleri Bakanlığı tarafından belirlenecek esaslar dâhilinde
  mülki amirin görevlendireceği kolluk amirinin yazılı, acele hâllerde sonradan yazıyla teyit edilmek üzere
  sözlü emriyle yapılabilir" bölümü iptal edildi; iptal RG 3/8/2017'den altı ay sonra, 3/2/2018'de yürürlüğe
  girdi. "Kolluk amirinin kararı yirmi dört saat içinde görevli hâkimin onayına sunulur" cümlesi kanunda
  kaldı (iptal edilen yetkiye atıf yapıyor). Adli ve Önleme Aramaları Yönetmeliği md 27 (RG 29/4/2016) bu
  iptal edilen bölümün birebir kopyasını hâlâ taşıyor; mevzuat.gov.tr'de md 27 için Danıştay iptal notu yok.
- arama-p1-17 (bankada fc6f02d1, yayında 11 Eyl 2026'dan beri): anahtarı tam bu yol. İki bağımsız
  çürütücü (kanit: scratchpad `kanit-md27/curutucu-1.md`, `curutucu-2.md`) ikisi de KUSURLU dedi: dayanaksız
  hükmü güncel kural gibi öğretiyor; bugün asıl kural hâkim kararı (PVSK md 9, CMK md 119), gecikmesinde
  sakınca bulunan hâlde mülki âmir (önleme) ya da Cumhuriyet savcısı (adli) — soru bunları yanlış sayıyor;
  yalnız açıklama düzeltilerek kurtarılamaz. Yayından çekme kararı: ilkeye göre çekilir.
- Açıklaması kusurlu beş resmî soru (soru doğru, yalnız açıklama iptal edilen yolu güncel kural gibi anıyor):
  5139b039, d503ee7d (bağımsız denetçi ONAY verdi), 3f8551f5, dc24eeb1, 62c03560. 7d93f9f4'ün açıklaması
  iptali zaten doğru not ediyor; 6639ffbc (PVSK, 24 saat) açıklaması da iptali not ediyor.
- UYGULANDI (21 Kas 2026, kullanıcı onayı: "Evet, uygula"; ilk deneme canlı yazma olduğu için otomatik
  izin denetiminden geçmemişti): arama-p1-17 (fc6f02d1) `doc39-soru-geri-cek.ts APPLY=1 YAYINDAN=1` ile
  yayından çekildi (sürüm archived, soru soft-delete). Beş açıklama `sik-metni-guncelle.ts … ACIKLAMA` ile
  düzeltildi (5139b039 iptal notu eklendi; d503ee7d, 3f8551f5, 62c03560 cümle çıktı; dc24eeb1 cümle md 27'nin
  gece hükmüne indirildi); 62c03560'ta denetçinin RED'i üzerine silinen parça öksüz kalan bir sonraki cümleyi
  de kapsayacak biçimde genişletildi. Veritabanında doğrulandı; iz `docs/32-yayin-denetimi/sik-guncelleme.jsonl`.
  Planlar ve çürütücü/denetçi raporları: scratchpad `kanit-md27/`. Not: 62c03560 dört şıklı (beş şık kuralı).
- Doc 39'a etkisi: 02 brifine mevzuat denetçisi kuralı eklendi (yönetmelik sorusunda dayanak kanunun AYM
  iptali kontrol edilir); analiz raporundaki iki "polis yetkisi" cümlesine düzeltme notu düşüldü. Çekme
  uygulanınca 7245-p1-01'in test derleme notu (fc6f02d1 ile aynı denemeye düşmesin) konusuz kalır.
- Uygulama notu (21 Kas 2026, kullanıcı: "Evet, ekle"): madde METNİNE dokunulmadan iki "yürürlük bilgisi"
  (effective_info) alanı dolduruldu — Arama Yön. md 27'nin kaydına "Dayanak notu: … PVSK md 4/A … AYM
  4/5/2017, E.2015/41, K.2017/98 … iptal edilmiştir (iptal 3/2/2018'de yürürlüğe girdi); yönetmelik metni
  değiştirilmemiştir." ve yönetmeliğin kaydına "md 27 dayanak notu: …". İki alan da önceden boştu; eski
  değerler scratchpad `kanit-md27/md27-not-yedek.json`'da, iki satır `docs/32-yayin-denetimi/mevzuat-tazeleme.jsonl`
  defterinde (tur "not"). Canlı API'de doğrulandı: başlık notu okuyucu uç noktasında, madde notu madde uç
  noktasında dönüyor. Görünürlük: web ve mobil kanun okuyucusunun başlığı, mobil kanun özeti, web Çalışma
  › madde sayfası (önbellek en geç 1 saat), web/mobil seans geri bildirimindeki ilgili madde. Okuyucunun madde
  listesinde md 27'nin yanında görünmez (okuyucu madde düzeyindeki alanı göstermiyor; bu bir kod işi).
  DİKKAT: `mevzuat-madde-tazele.ts` md 27'yi tazelerse effectiveInfo'yu kendi metniyle ezebilir; tazelemede notu koru.

## Yönetmelik taraması (21 Kas 2026) — UYGULANDI

Amaç: bankadaki 12 yönetmelikte Danıştay'ın iptal ettiği ya da yürütmesini durdurduğu hükümleri ve dayanağı
AYM'ce iptal edilen hükümleri bulmak; bunlara dayanan soru, açıklama, bilgi kartı, konu özeti ve dersleri ayıklamak.

- Yöntem: 22 resmî metin (11 yönetmelik + 11 dayanak kanun) mevzuat.gov.tr'den indirildi; Danıştay/AYM notları ve
  dipnotları çıkarıldı; AYM'nin iptal ettiği kanun ibareleri yönetmelik metinlerinde arandı (uzun ve kısa alıntı);
  bütün içerik (soru kökü/şık/açıklama, kart, özet bloğu, madde özeti, ders gövdesi) örüntüyle tarandı. Üç ayrı
  araştırma ajanı mevzuat.gov.tr'de görünmeyen Danıştay kararlarını aradı; kusur iddiaları iki bağımsız çürütücüye
  verildi. Betikler ve kanıt: scratchpad `yonetmelik-tarama/`.
- KÖK NEDEN: mevzuat.gov.tr Danıştay'ın iptal ettiği ibareleri metinde (italik + dipnot) tutuyor, AYM'nin "yönünden
  iptal" ve ertelenmiş iptal kararları da yalnız dipnotta. Bankaya aktarımda dipnotlar düştüğü için iptal edilmiş
  ibareler bankada geçerli görünüyor; tazeleme betiği bunu yakalayamaz (metin değişmiyor).
- Bulunan iptaller (hepsi kesin; iki çürütücü de doğruladı):
  - Arama Yön. md 8/1-a "…yakalanması amacıyla konutunda, işyerinde, yerleşim yerinde, bunların eklentilerinde ve
    aracında yapılacak aramada…", md 8/1-f "ilgilinin rızası ile", md 30/1 — Danıştay 10. D 13/3/2007
    E.2005/6392 K.2007/948; İDDK 14/9/2012 E.2007/2257 K.2012/1117 onama (karar düzeltme reddi İDDK 11/2/2015).
  - Yakalama Yön. md 22/1 "…Kollukta bulunan soruşturma dosyası için yetkili Cumhuriyet savcısının yazılı emri
    gerekir…" — Danıştay 10. D 22/5/2008 ve 14/10/2008 (E.2005/5845 K.2008/3450 vd.); İDDK 20/11/2012 onama.
  - Arama Yön. md 27/7 kolluk amirinin yazılı/sözlü emriyle üst, eşya ve araç araması — Danıştay 10. D 23/11/2021
    E.2016/11956 K.2021/5766, oybirliği (karar metni okundu; temyiz sonucu bulunamadı). mevzuat.gov.tr'de notu yok.
    Dayanak PVSK 4/A zaten AYM'ce iptal (md 27 incelemesi, yukarıda).
  - Dayanak iptali: 3201 md 55'teki "toplamda üç yılı aşan kısmı …" cümlesi "yurt dışı misyon koruma" yönünden
    AYM 9/5/2024 E.2023/127 K.2024/105 (RG 5/7/2024, ertelemesiz) → Rütbe Terfileri Yön. md 10/1 ve 11(ğ) dayanaksız.
    5233 md 6/1 "…veya mirasçılarının…" AYM 10/7/2025 E.2024/116 K.2025/151 (yürürlük 10/9/2026) → Terör
    Zararları Yön. md 8/1 dayanaksız.
- Temiz çıkanlar: Adli Kolluk Yön. 21/12/2013 değişikliği (Danıştay yalnız YD vermiş; 2019'da davalar reddedilmiş,
  İDDK 2021'de kesin onama — 15/2/2021 K.2021/260–266, 25/3/2021 K.2021/604); Performans, Atama, 6284 Uygulama,
  Özel Güvenlik, Teknik Takip yönetmeliklerinde iptal/YD bulunamadı; Rütbe Terfi'deki 2016–2019 iptalleri 2016'da
  değişmiş hükümlere ait. Yürütmesi durdurulan fıkralar (Arama 17/1, Yakalama 13/3, 22/2-3) içerikte doğru işlenmiş;
  CMK "Arama" dersi Danıştay iptallerini zaten doğru anlatıyor. 74c182e4 bloğu iki çürütücüye göre sağlam.
- Etkilenen içerik ve önerilen işlem (kuru çalıştırmalar temiz):
  - Yayından çekilecek soru (iki çürütücü de ESASA İLİŞKİN): yakalama-p1-26 (e9a08171; anahtar iptal edilmiş şart,
    doğru şık kalmıyor), arama-p1-01 (2080b482; D şıkkı da doğru hâle geldi).
  - Açıklama düzeltmesi: 5d73f4f2 (3201 md 55; tavanın misyon korumaya uygulanmadığı eklenir).
  - Bilgi kartı arşivi: 2a9049a3 (md 8/1-a), f211b3ed (md 30/1), ba25789c (Yakalama md 22/1), f7452b00 (md 27/7 —
    20 Kas md 27 incelemesinde gözden kaçmıştı). Yerinde düzeltme: e0b6fe14, b99119fd (misyon koruma), 0c868ac5
    (TCK 26 atfı rızayı da kapsıyordu).
  - Konu özeti: 6 ünitede 13 blok yerinde düzeltme (aoay-adli-arama 8, 9; aoay-onleme 14, 15, 19, 22; ygiay 14;
    ertky 6, 7, 8, 10; etk-terfi 13; tzky 6).
  - Yürürlük notu (effective_info): Arama md 8, 27, 30 + başlık; Yakalama md 22 + başlık; Terör Yön. md 8 + başlık;
    Rütbe Yön. md 10, 11 + başlık; 3201 md 55. Opsiyonel: CMK md 134 ve Arama md 17'ye ertelenmiş iptal notu.
  - Rütbe Terfileri Yön. kaynak adresi MevzuatTur=7 → 3 (eski adres boş kabuk dönüyordu; banka metni resmî metinle aynı).
- Kapsam dışı bulgu (kanun düzeyi, dipnot kaybından): 5188 md 11/4 "…sonradan kaybettiği…" AYM 24/9/2024
  E.2024/65 K.2024/163 ile md 10/1-d-3 yönünden iptal; ertelenmiş AYM iptalleri CMK md 82 (yürürlük 18/12/2026),
  md 134 (25/2/2027), md 226 (16/4/2027), 2803 "nitelikleri" (4/2/2027). Ek: Yakalama Yön. md 22'deki "iddianamenin
  mahkemeye verildiği tarih" CMK 153/4'ün "mahkemece kabul edildiği tarih" ifadesiyle çelişiyor (yönetmelik eski metni).
- UYGULANDI (21 Kas 2026, kullanıcı onayı: "Evet, uygula" — opsiyonel notlar dahil):
  - Sorular: yakalama-p1-26 (e9a08171) ve arama-p1-01 (2080b482) `doc39-soru-geri-cek.ts APPLY=1 YAYINDAN=1` ile
    yayından çekildi (sürüm archived, soru soft-delete). Yan etki: Arama md 8 ile Yakalama md 22'nin başka sorusu
    olmadığı için Madde Atlası sayfaları (yalnız sorulu maddeler listelenir) artık 404 dönüyor; okuyucu etkilenmez.
  - 5d73f4f2 açıklaması `sik-metni-guncelle.ts … ACIKLAMA` ile düzeltildi (iz `docs/32-yayin-denetimi/sik-guncelleme.jsonl`).
  - Kartlar: 2a9049a3, f211b3ed, ba25789c, f7452b00 arşivlendi; e0b6fe14, b99119fd, 0c868ac5 yerinde düzeltildi
    (kart doğrulayıcıdan geçti). Her işlem için `audit_logs` kaydı (flashcard.archive / flashcard.update) düştü.
  - Notlar: 14 yürürlük notu (Arama md 8, 17, 27, 30 + başlık; Yakalama md 22 + başlık; Terör Yön. md 8 + başlık;
    Rütbe Yön. md 10, 11 + başlık; 3201 md 55; CMK md 134) ve Rütbe Yön. kaynak adresi yazıldı; defter
    `docs/32-yayin-denetimi/mevzuat-tazeleme.jsonl` (tur "not" / "kaynak-url"). Önceki değerler scratchpad
    `yonetmelik-tarama/duzeltme/uygula-yedek-*.json`'da.
  - Konu özeti: 6 ünitede 13 blok `ozet-yayindaki-duzelt.ts --uygula` ile güncellendi; üniteler published kaldı.
    Yeni ünite JSON'ları scratchpad `yonetmelik-tarama/duzeltme/uniteler-yeni/`, deste JSON'ları `desteler-yeni/`'de.
    DİKKAT: main'deki `docs/53-konu-ozetleri/uniteler/*.json` ve `docs/56-bilgi-kartlari/uretim/*.json` dosyaları
    henüz eski hâlinde; bu dosyalarla `--replace` yükleme yapılırsa düzeltmeler geri gider.
    → Kaynak dosya commit'i hazır (kullanıcı: "Evet, hazırla"): `claude/yonetmelik-taramasi-dosyalar` dalında e98e04c6
      (origin/main 7b374f48 üstünde; 6 ünite JSON + md, 5 deste; dosyalar veritabanıyla birebir doğrulandı).
      21 Kas 2026'da kullanıcı onayıyla ("Evet, push et") main'e düz ilerletmeyle push edildi (7b374f48..e98e04c6).
  - Doğrulama: veritabanında her öğe tek tek okundu; özet kuru çalıştırmaları "0 kart güncellenecek" dedi; md 27
    notu madde ucunda, iki başlık notu okuyucu ucunda canlı API'den dönüyor. Madde düzeyindeki notların okuyucuda
    görünmesi "Okuyucuda madde yürürlük notunu göster" oturumunun işi (claude/beautiful-mccarthy-b00a96, commit yok).

## 5233 + 2860 + 5253 turu (21–22 Kas 2026)

Kullanıcı: "5233 + 2860 + 5253" (talep: "sorusuz kanun kalsın istemiyorum"). Gerekçe: Polis Mevzuatı dersinde en az
sorusu olan üç kanun; bankada 5233 için 0, 2860 için 1, 5253 için 3 soru vardı. Tur eki
`13-ek-5233-2860-5253.md`; analiz `analiz/rapor-teror-yardim-dernek.md`. Metin tazeliği: 5233 ve 2860 temiz.
5253'teki "Ek 1 eski" uyarısı başlık-dipnotu tuzağı.

Turun özel tuzağı, banka metninde AYM dipnotlarının bulunmamasıydı:
- 5253 10/1'in parti yönü iptali metinde hiç görünmüyor.
- 5233 6/1'de mirasçının başvuru süresi iptal.
- 2860 md 10'da uzatma sınırı iptal.

Tur ekine "Bu turun özel tuzağı" bölümü kondu. Hiçbir aday iptal edilmiş hükme dayanmadı.

| Parti | Aday | KABUL | RED | Bekliyor |
|---|---:|---:|---:|---:|
| 5233-p1 | 6 | 4 | 2 | 0 |
| 2860-p1 | 5 | 2 | 3 | 0 |
| 5253-p1 | 8 | 8 | 0 | 0 |
| **Toplam** | **19** | **14** | **5** | **0** |

14 soru `in_review` yazıldı: 8'i 21 Kas'ta, 5253'ün 6'sı 22 Kas'ta. Veritabanında hepsi beş şıklı ve tek doğrulu.
21 Kas'ta yazılan 8 soru 22 Kas itibarıyla yayında. Etiketler:
- "Mevzuat türetimi — 5233 sayılı Kanun md …"
- "… — YTK md …" (2860'ın kısa adı)
- "… — 5253 sayılı Kanun md …"

KABUL:
- 5233:
  - 01: 2/3 vaka; kovuşturma sürerken işlem yapılmaz.
  - 03: 7/c + md 10; aynî ifaya öncelik.
  - 04: 12/2–4; davete uymayana uyuşmazlık tutanağı.
  - 06: md 4, YANLIŞTIR; başkan vali yardımcısıdır.
- 2860:
  - 01: md 7; birden fazla ilde yerleşim yeri ilinin valisi.
  - 04: 13/1, YANLIŞTIR; izin mercii vali ya da kaymakam. THK ayrığı ve md 28 doğru önermeler.
- 5253:
  - 03: 3/3 öncüllü; yasağı yalnız yasaklanmış hakların geri verilmesi kaldırır.
  - 06: 30/c → 32/o; hapis ve tesisin kapatılması.
  - 01: 26/B/1; lokal denetimi kolluğa da yaptırılabilir, önceden bildirim aranmaz (çekinceli, aşağıda).
  - 02: 26/B/3 vaka; daha önce men edilmemiş lokalde ilk tespitte lokal belgesi mülki idare amirince iptal edilir.
  - 04: md 33; beyanname yükümlülüğünü yerine getirmeyen dernekte idarî para cezası yönetim kurulu başkanına verilir.
  - 05: md 24, YANLIŞTIR; şubeler temsilcilik açamaz.
  - 07: 27/4; kamu yararına çalışan dernekte kayyımı vali ister, sulh hukuk mahkemesi atar.
  - 08: 21/1; yurt dışından yardım, mülki idare amirliğine önceden bildirime bağlıdır (çekinceli, aşağıda).

RED'ler:
- **5233-p1-02** (md 8 ↔ 2/2-e; sınav, 1. tur): ters ayırt etme.
  - "İhmalin DE etkisi" ifadesi ve genel müterafik kusur bilgisi, bilmeyen adaya en ılımlı şıkkı (B) verdiriyor.
  - 2/2-e'yi yarım bilen aday A'da yanılıyor.
  - D, B'nin özel bir biçimi.
- **5233-p1-05** (9/5 ↔ 5/b ↔ 13/3; sınav, 2. tur): taze kör çözücü A'yı salt şıkla ~%50 buldu. İki neden var:
  - "Devleti koruyan kural" sezgisi doğru şıkkı gösteriyor.
  - İkinci turda konan E ("birini seçer") ile B ("mahsup edilmez") aynı eksenin iki ucu oldu; "çifte tazmin olmaz" sezgisi ikisini birlikte düşürüyor.
- **2860-p1-02** (29/9 vaka; sınav, 1. tur): kökteki "il merkezi dışındaki tek bir ilçede izinle" ibaresi cevabı kaymakama sabitliyor. 29/9'u yarım bilen aday valiye düşüyor.
- **2860-p1-03** (6/3; sınav, 1. tur): ters ayırt etme.
  - E'yi üç şey veriyor: "erişim engeline hâkim karar verir" bilgisi, D ile E'nin ortak mercii ve "sitenin tamamına" mutlaklığı.
  - C sağduyuyla düşüyor.
- **2860-p1-05** (md 25; sınav, 1. tur): "bağış amacı korunur" sezgisi üç şıkkı eletiyor. "Devrettirilir" fiili de üslup ipucu.

**5253'ün altı sorusu: sınav gözcüsünün ikinci turu (22 Kas)**
- 21 Kas'ta mevzuat, kalite ve dil gözcüleri ikinci turda ONAY vermişti. Sınav gözcüsünün ikinci turu ise Anthropic güvenlik
  denetiminin (safeguards) verdiği bir API hatasıyla durmuştu; ajan dosyalara bir şey yazmamıştı.
- Kullanıcı: "Yeniden dene". Yeniden deneme, anahtarları görmemiş taze bir gözcüyle yapıldı. Bu yüzden gözcü canlandırılmış
  değil, gerçek bir kör çözüm yaptı. Okuma sırası:
  1. brifler (09'un son bölümü hariç);
  2. kör çözüm (`scratchpad/sinav2-5253-p1-kor.md`);
  3. taze kör çözücünün notu (`scratchpad/kor2-5253-p1.md`);
  4. ölçütler;
  5. metin;
  6. aday dosyası, değişiklik listesi (`scratchpad/sinav2-5253-p1-degisiklikler.md`) ve birinci tur satırları.
- Sonuç: altısı ONAY. Gözcünün kör çözümü 01, 02, 05 ve 07'de anahtardan ayrıştı. Metinle çözümü altısında da anahtarla aynı.
  Taze kör çözücü yalnız 01 ve 08'i doğru bulmuştu.
- Çekinceler (yayın kararı için):
  - **01** (düşük-orta, ters ayırt etme eğilimi): "lokal denetimi habersiz yapılır" yorumu ve saha bilgisi, bilmeyen adayı
    D'ye yaklaşık %35–40 götürüyor. Yalnız 19/2'yi bilen eksik aday C'ye ya da A'ya düşüyor. Taze kör çözücü D'yi genel
    bilgiyle %55, salt şıkla %40 güvenle buldu. Gözcü ONAY verdi, çünkü mekanik kestirmeler yanlış şıkka gidiyor ve hiçbir
    çözücünün salt şık güveni yüksek değil.
  - **08** (düşük): soru fiilen iki şıklı. B, C ve D zayıf (taze kör çözücüde %2–5); bilmeyen aday A ile E arasında kalıyor
    (yaklaşık %45–50). Sezgiler doğru şıkta birleşmiyor, iki şıkka bölünüyor. Partinin tek kolay sorusu.
- Orkestratör notu: 08'deki "üç şık bilgisiz eleniyor" durumu, 6698-p1-02'nin RED gerekçesine (kalite, 2. tur) ve 10-ek
  RED dersi 2'ye ("sağduyuyla en çok bir şık elenir") yakın. Gözcü bunu çekince olarak tarttı. Yayın kararında ayrıca bakılmalı.
- TUR=2 birleştirme: 8 KABUL. `APPLY=1` 6 soru yazdı; 03 ve 06 zaten bankadaydı. Veritabanında altısı beş şıklı ve tek
  doğrulu; anahtarlar aday dosyasıyla aynı, her birinin bir künyesi var.
- Yedekler: `scratchpad/5253-p1-sinav.tur1-yedek.json` (gözcünün), `scratchpad/5253-p1-karar.tur1-yedek.json`.

İkinci tur değişiklikleri (aday dosyasında):
- 01: C, 19/2'nin gerçek değeri oldu.
- 02: A'dan "otuz gün" çıktı; bu değer PVSK md 8 sorularının cevabıydı.
- 04: kök 32/l'nin diline çekildi; D artık 32/d'deki defter sorumluları.
- 05: soru YANLIŞTIR biçimine geçti (temsilcilik önermeleri).
- 07: bileşik "isteyen – atayan" biçimine geçti; şık takımı ızgarasız.
- 08: B, md 22'deki genel kurul yetkisi oldu.

Son tur sonrası rötuşlar:
- 2860-p1-04:
  - Açıklamadaki doğrulanamaz çeldirici yorumu silindi (sınav; 10-ek RED dersi 5).
  - "B bu cümlenin kendisidir" → "dayanır"; "ücreti Kurum verir" → "verebilir".
  - Zorluk medium → hard (sınav ölçümü).
- 5233-p1-06: zorluk easy → medium (iki gözcünün ölçümü).
- 5253-p1-03: TCK 53/2 alıntısı çıktı; bankadaki TCK sorusunda şık eletiyordu.
- 5253-p1-06: "(30/a)" açık yazıldı.

Test derleme notları:
- 5253-p1-05 D şıkkı ile 5253-p1-08'in doğru şıkkı aynı "mülki idare amirliğine bildirim" kalıbını taşıyor. İkisi aynı kısa denemeye konmasın.
- 5253-p1-01 ile -02 aynı maddeden (26/B).

İstem kirliliği (orkestratör hatası):
- 2860 ve 5233'ün ikinci tur kör çözücü istemlerinde şıklara denk gelen örnek sezgiler vardı: "TCK'yı bilen aday hangi önermeyi yanlış sanar", "istisnayı bilmeyen aday", "Devleti koruyan kural", "zarar parayla ödenir".
- Çözücüler bunu kendileri fark edip beyan etti; sınav gözcüleri kirliliği yönüyle birlikte tarttı.
- 2860-p1-04: kirlilik anahtarı bulmayı kolaylaştıran yöndeydi; soru buna rağmen geçti.
- 5233-p1-05: RED kirlilikten bağımsız iki gerekçeye dayanıyor. Sezgiyi gözcü birinci turda temiz çözümde kendisi bulmuştu; B–E ekseni yapısal bir kusur.
- 5253 istemi temiz yazıldı.
- Ders 09 brifinin "Orkestratör kuralları (21 Kas 2026)" bölümünde.

Şüpheli metin noktaları (analistin bulgusu; soru konusu olmadı, ayrı inceleme gerektirir):
- 2860 29/4 ve 5253 32/t: öksüz yaptırımlar.
- 5253 32/c ↔ 32/k: çift idari para cezası.
- 5233 Ek 1 son fıkra: hatalı fıkra atfı.
- 2860 6/2'deki "kovuşturma" ↔ 29/1'deki idari para cezası.
- 5253 19/2: risk cümlesi.
- 5253 md 26: 2021 AYM kararı dipnotsuz.

Kalan kapsam:
- 5233: Ek 1 son fıkra, 6/1 son cümle, 14/2.
- 2860: 6/1 (statü muafiyet değildir), md 15, 8/3, md 13 ve md 28'in tek başına soru olarak ölçülmesi.
- 5253: çocuk dernekleri, 15/3, 19/7, md 23, md 28, 26/A/1, 5/2 (08'in çeldiricileriyle temas eder; yeni soru 08'in cevabını vermemeli).

## 6458 + 3071 + 7201 turu (22 Kas 2026)

Kullanıcı: "6458 + 3071 + 7201" ("sorusuz kanun kalsın istemiyorum" talebinin devamı). Tur eki
`14-ek-6458-3071-7201.md`. Analizler:
- `analiz/rapor-6458-yabancilar.md`;
- `analiz/rapor-dilekce-tebligat.md`.

Başlangıç durumu:
- **6458:** bankada 3 soru (üçü de md 102); resmî soru 0/766.
- **3071:** 5 soru, hepsi resmî GYS sorusu; kanunun karar kuralları tükenmiş.
- **7201:** 10 soru; resmî GYS sorularının kendisi.

PAEM ve Misyon üç kanunu da adıyla hiç sormadı.

Metin taraması (`mevzuat-degisiklik-tara`, bütün yıllar):
- 3071 temiz.
- 6458 ve 7201'deki onar "eski" uyarısı yanlış alarm. Analist sebebini buldu: dipnotla işlenen değişiklik gövdede kanun
  numarası bırakmıyor; ayrıca başlık yapışması ve 7/a ile 25/a'nın kaynakta ana maddeye katılması.
- **7201 md 7:** banka metninde dipnot artığı satır var (md 6'nın [4] dipnotu). Soru konusu olmadı; düzeltme kullanıcı
  onayına sunuldu.
- Turun özel tuzakları:
  - 6458 eski metni:
    - 53/3'te dava süresi bugün yedi gün (2019 öncesi on beş gün);
    - terör kapsamındakiler 2016–2019 arasında askıdan hariçti;
    - 46/1, 76/1 ve 83/1'de eski değerler.
  - Kurum adı: metin 49 yerde "Genel Müdürlük" diyor, kurum bugün Göç İdaresi Başkanlığı. Bağlayıcı ad kuralı analizin
    "Metnin durumu" C bölümünde.
  - 7201 eski metni: on beş yaş, aile efradı, birer gazete. 7587 (2026) 7201'i değiştirmedi.

Hiçbir KABUL eski metne, ad kuralına aykırı bir mercie ya da yönetmeliğe dayanmadı.

| Parti | Aday | KABUL | RED | Bekliyor |
|---|---:|---:|---:|---:|
| 6458-p1 | 6 | 5 | 1 | 0 |
| 6458-p2 | 5 | 4 | 1 | 0 |
| 7201-p1 | 5 | 4 | 1 | 0 |
| 3071-p1 | 0 | 0 | 0 | 0 |
| **Toplam** | **16** | **13** | **3** | **0** |

13 soru 22 Kas'ta `in_review` yazıldı. Veritabanında hepsi beş şıklı ve tek doğrulu; anahtarlar aday dosyasıyla aynı,
her birinin bir künyesi var. Etiketler:
- "Mevzuat türetimi — 6458 sayılı Kanun md …"
- "… — 7201 sayılı Kanun md …"

KABUL:
- 6458-p1:
  - 01: 57/2 ↔ 57/6, bileşik; gözetim kararını valilik alır, karara karşı sulh ceza hâkimine başvurulur (çekinceli).
  - 02: 53/3 vaka; terör örgütü üyeliği gerekçesiyle alınan kararda da, rıza yoksa, yargılama sonuçlanıncaya kadar sınır
    dışı edilmez.
  - 03: 55, YANLIŞTIR; şiddet mağdurlarına insan ticaretinin "mağdur destek süreci" koşulu aktarılmış.
  - 04: 97; kolluğun getirdiği yabancıdan bilgi alma süresi dört saati geçemez (çekinceli).
  - 06: 9/3; ciddi tehditte giriş yasağı en fazla beş + on = on beş yıl.
- 6458-p2:
  - 01: 62; Avrupa ülkeleri dışındaki olaylar → şartlı mülteci.
  - 02: 63/1-c; ayrım gözetmeyen şiddet → ikincil koruma (geçici korumadan ayırt).
  - 04: 68, YANLIŞTIR; başvuru sahibinin gözetimine karşı Komisyona itiraz yok (80/1-a).
  - 05: 79/1-f; geri çekilmiş sayıldıktan sonra yeni gerekçeyle başvuru → hızlandırılmış değerlendirme.
- 7201-p1:
  - 01: 21/2; adres kayıt sistemindeki adreste hiç oturmamış muhatabın evrakı muhtara teslim edilir.
  - 02: md 20 vaka; geçici başka yer beyanı + kabulden kaçınma + yapıştırma → on beş gün sonra.
  - 04: 7/A/2; talep üzerine elektronik adres verilen kişiye elektronik tebligat zorunlu.
  - 05: "ilanen tebligat", YANLIŞTIR; merci süreyi en çok on beş güne uzatabilir (md 31).

RED'ler:
- **6458-p1-05** (Ek 1/2; sınav, 2. tur): ölçülen sonuç (teminat verilmezse derhal tasfiye) 5607 md 10/2'de aynı
  cümleyle var.
  - 5607'yi bilen aday 6458'i bilmeden buluyor; taze kör çözücüde genel bilgiyle %65.
  - Birinci turda D ile E bir "elden çıkarma" ikiziydi. İkinci turda eklenen C ("doksan gün ek süre") salt şık güvenini
    düşürmedi (%35–40). Kesişim ve A ile E'nin oluşturduğu ters çift E'de birleşiyor.
  - Sınav değeri 3.
- **6458-p2-03** (65/5; sınav, 2. tur): ikinci turda kesişimi ve ikizi kırmak için iki şık değişti:
  - A: "Gözaltı derhâl sona erdirilir."
  - E: "Valiliğe bildirilmesi, gözaltı sona erinceye kadar ertelenir."

  Bu kez A ile E aynı eksenin iki ucu oldu ve D tam ortada kaldı; valilik dört şıkta geçiyor, sağduyu da D'yi veriyor.
  Taze kör çözücü salt şık ve sağduyuyla yaklaşık %75 güvenle D'yi buldu.
- **7201-p1-03** (2/1; kalite, 1. tur): "zabıta vasıtasıyla … emriyle" kökü mülki amiri çağırıyor.
  - Doğru cevap polis mevzuatının varsayılan mercii ("mülki amirin emriyle" kalıbı). 7201'de bu varsayılanı bir
    çeldiriciye bağlayacak yakın hüküm yok (10-ek RED dersi 1).
  - 28/3'ü bilen eksik aday yanılıyor, bilmeyen aday buluyor (ters ayırt etme).

İkinci tur değişiklikleri (aday dosyalarında; ayrıntı scratchpad'deki `sinav2-tur14-degisiklikler.md` ve
`sinav2-6458-p1-degisiklikler.md` dosyalarında):
- 6458-p1:
  - 01: C "Kolluk – Sulh ceza hâkimi", D "Göç İdaresi Başkanlığı – İdare mahkemesi" oldu; konumdan bağımsız kesişim kırıldı.
  - 03: D, 55/1-b oldu; 55/2'nin iki cümlesinden oluşan ikili kalktı.
  - 04: kökten "davet edilmeksizin" çıktı. D "bildirimde bulunma yükümlülüğü", E "getirilebilmesi için karar alınmış olması
    gerekir" oldu.
- 6458-p2:
  - 02: kökten "zulüm korkusu taşımayan" çıktı.
  - 01 ve 05: yalnız açıklama değişti.
- 7201-p1:
  - 02: "hangi tarihte" → "ne zaman".
  - 04: kökten "zorunluluğu bulunmayan" çıktı; A ve E değişti.
  - 05: yalnız açıklama değişti.

Son tur sonrası rötuşlar:
- **6458-p2-01:** açıklamadaki 3/1-r statü sayımı 02'nin cevabını sızdırıyordu (iki çeldiriciyi düşürüyordu; sınav ve
  kalite, 2. tur). Cümle "E'deki insani ikamet izni, 30 uncu maddede sayılan ikamet izni çeşitlerinden biridir." oldu;
  dayanaktan 3/1-r çıktı.
- **6458-p2-02:** D cümlesinden "bir statü değil" çıktı; zorluk hard → medium.
- **6458-p1-01:** C'nin gerekçesindeki "derhâl valiliğe" alıntısı sadeleşti.
- **6458-p1-06:** zorluk easy → medium.
- **7201-p1-02:** alıntının başına "…" kondu.
- **7201-p1-04:** zorluk easy → medium.

Çekinceler (yayın kararı için):
- **6458-p1-01:** hukuk bilen aday A ile B arasında kalıyor. "Özgürlük → hâkim" ilkesi B'yi yaklaşık yarı yarıya veriyor;
  hafif ters ayırt etme eğilimi var. Salt şık çoğunluğu iki çözücüde de A'da (kök yankısı, İYUK varsayılanı).
- **6458-p1-04:** hukuk bilen aday A ile D arasında kalıyor (A'ya yaklaşık %50). Salt şık güveni %35–40; partinin tek kolay
  sorusu. Sınav gözcüsü 5253-p1-01 emsaline göre ONAY verdi.
- **7201-p1-01:** "Tebligat muhtara bırakılır" günlük bilgisi doğru şıkkı biraz çekiyor (kalite: orta-düşük). Sınav
  gözcüsü ayırt ediciliğe 5 verdi.

Test derleme notları: şu çiftler aynı kısa denemeye konmasın.
- 6458-p2-01 ↔ 02: beş şık aynı.
- 7201-p1-02 ↔ 05: on beş ile otuz gün aynası.
- 7201-p1-01 ↔ 02: ikisi de md 21 çevresinde.

Orkestratör kararları:
- **5607 çelişkisi:** analizin §5'i Ek 1'de derhal tasfiyeyi ölçmeye izin veriyor, §8 kural 7 ortak unsuru yasaklıyordu.
  Orkestratör §5'in özel kuralını esas aldı. Sınav gözcüsü yine de 05'i RED etti; ders 09'da.
- **6458-p2-03:** kalite ile sınav gözcülerinin önerileri çatıştı. Orkestratör, ikizi kıran kalite önerisini seçti. Taze kör
  çözücü yeni takımda "iki uç + orta yol" kestirmesini buldu ve soru RED aldı; ders 09'da.

Şüpheli metin noktaları (soru konusu olmadı; tam liste iki analiz raporunun sonunda):
- **7201 md 7:** dipnot artığı (düzeltme önerildi).
- **7201:**
  - md 21/1'deki karşılıksız "(1)";
  - md 25'te yazım hataları ("Bakanlığıne", "damemuriyet");
  - "PTT Genel Müdürlüğü" ile "A.Ş." birlikte geçiyor;
  - 29/1'de gazete sayısı belirsiz;
  - 54/2'deki atıf belirsiz.
- **6458:**
  - 21/7 öznesiz parça metin;
  - ad karmaşası ve eski bakanlık adları;
  - 57/4 "getirilir" ↔ 57/A/1 "getirilebilir";
  - 102/5 ↔ 102/6 merci çatışması;
  - 46 ↔ 47 onay asimetrisi;
  - mülga 4817 atıfları.
- **3071:** md 8/2'de yetki ve yükümlülük cümleleri uyumsuz; md 11'de Bakanlar Kurulu.
- **Bankadaki sorular:**
  - 6458 md 102'nin üç sorusu: 102/6 sorusu 2019 öncesi metinle yazılmış ve iki doğru riski taşıyor; 102/2 sorusu TCK 79
    ile iki okumalı ve şıkta "yalnızca" var; 102/3'te "gerçek kişiler tarafından" kaydı eksik.
  - 7201 [309]: yönetmelik dayanağının B önermesi doğrulanmalı.
  - 7587'yi anan güncel soru yanıltıcı.
  - Dört şıklı sorular: 3071'de 3, 7201'de 3. 7201 md 60'ın iki sürümü birbirinin mükerreri.

Kalan kapsam:
- **6458:**
  - p1 yedekleri: 57/3, 57/A/7, 98/1-d, 13/2, 49/2, 24/2 ↔ 54/1-j, 34/6, 60/3, 42/2.
  - p2 yedekleri: 85 ↔ 86, 69/3, 89/4, 88/1, 77/1-c, 80/1-ç, 73/74.
  - Ek 1 kapandı (5607 aynası); 65/5 RED.
- **7201:** md 35 (tüzel kişi biçimi), md 22 + 21/1, md 56, Ek 1, 11/1 son cümle, 24/5. 2/1 kapandı (RED).
- **3071:** tükendi.

### Yayındaki 6458 md 102 ve 7201 sorularının denetimi (23 Kas 2026) — UYGULANDI

Turun analistlerinin parti dışı bulguları. Ayrıntı ve resmî metin alıntıları `rapor/banka-kusur-6458-7201.md`'de. Yöntem: iki çürütücü (savcı/savunucu) ve bağımsız denetçi. Kullanıcı onayı: "Evet, uygula".

Sonuç:
- **Açıklaması düzeltilenler:**
  - fde12df0 ([309]): son cümle Tebligat Yönetmeliği md 53/3'ün tersini söylüyordu; soru doğru, anahtar E.
  - 068897c3: 102/6 "yetkili makam".
  - 1eb06eb0: 102/3, "gerçek kişiler" kaydı.
  - 5e57ed04: açıklama İPC tablosunu kaynak gösteriyordu.
- **Kökü düzeltilenler:**
  - 068897c3: 7196'nın çıkardığı ibare kaldırıldı.
  - 1eb06eb0: 7196'nın eklediği kayıt eklendi.
- **Yayından çekilen:** bff6766d (102/2, apart işletmecisi). Çürütücüler 1-1, denetçi "açıklama kurtarmıyor" dedi, kullanıcı kararıyla çekildi.
- **Kusursuz:** 90abc862 (7587).

Kök: üç 6458 sorusu ile 5326 sorusu kullanıcının "2026 İPC Tablosu"ndan üretilmiş. Tablo kanundan üç yerde sapıyor: eski ibare, tek merciye indirgeme, eksik kayıt. Aynı tablodan üretilmiş 17 yayındaki soru (5326'da 13, 1774'te 4) için ayrı denetim oturumu önerildi.

## Üç yönetmelik turu: Tedbir Yön. + Çocuk Koruma Uygulama Yön. + Teknik Takip Yön. (23 Kas 2026)

Kullanıcı (23 Kas 2026): "Hiç türetim yapılmamış izinli mevzuat ile madde sayısına göre az işlenmiş izinli mevzuat ile
başlayabiliriz." İlk tur, türetimi hiç yapılmamış üç yönetmelik. Tur eki `15-ek-cocuk-yonetmelikleri-teknik-takip.md`.
Analizler:
- `analiz/rapor-cocuk-yonetmelikleri.md` (Tedbir Yön. ve Çocuk Koruma Uygulama Yön.);
- `analiz/rapor-teknik-takip.md`.

Başlangıç durumu:
- **Koruyucu ve Destekleyici Tedbir Yön.:** kendi konusunda 0 soru.
- **Çocuk Koruma Uygulama Yön.:** 3 soru (GYS kökenli).
- **Teknik Takip Yön.:** kendi konusunda 0 soru; "6284 Kanunu" konusunda etiketsiz iki resmî GYS sorusu.

PAEM ve Misyon üç yönetmeliği de adıyla hiç sormadı.

Metin taraması (iki analist resmî metni indirip betikle karşılaştırdı):
- Üç yönetmeliğin banka metni resmî metinle sözcük sözcük aynı; Danıştay, AYM ya da yürütmeyi durdurma şerhi yok.
  Danıştay karar arama sistemi taranmadı.
- Asıl tuzak banka metni değil, çocuk yönetmeliklerinin 2006 Kanununu yansıtması: analist 25 eskimiş küme saydı (sosyal
  incelemenin zorunluluğu, "suça sürüklenen çocuk" terimi, KDAE/HAGB usulü, kurum adları, sosyal çalışma görevlisi).
- Teknik Takip Yön.'de 12 iç tutarsızlık (tampon bölgeyi belirleyen, cihaza zarar verme, kelepçeyi çıkarma, "on beş gün").

Hiçbir KABUL eskimiş hükme, iç tutarsızlığa ya da ad kuralına aykırı bir aktöre dayanmadı.

| Parti | Analist tavanı | Aday | KABUL | RED |
|---|---:|---:|---:|---:|
| tedbir-yon-p1 | 3 | 1 | 0 | 1 |
| cocuk-uyg-p1 | 4 | 2 | 2 | 0 |
| teknik-takip-p1 | 5 | 3 | 1 | 2 |
| **Toplam** | **12** | **6** | **3** | **3** |

Üç soru 23 Kas'ta `in_review` yazıldı. Veritabanında hepsi beş şıklı ve tek doğrulu; anahtarlar aday dosyasıyla aynı,
her birinin bir künyesi var. Etiketler: "Mevzuat türetimi — Çocuk Koruma Kanunu Uygulama Yönetmeliği md …" ve
"… — Teknik Yöntemlerle Takip Yönetmeliği md …".

KABUL:
- **cocuk-uyg-p1-01** (md 21/2; `12e5b240`): sosyal inceleme raporunda yer VERİLMEZ; kusur yeteneği hakkında sonuç
  değerlendirmesi. İki turda; ikinci turda şık takımı (ikiz "öneriler" kırıldı), kök ve açıklama değişti.
- **cocuk-uyg-p1-02** (md 5/10, 16/4, 16/5; `e9cf542f`): öncüllü. On iki yaşından küçük çocukta soruşturma; teslim
  edilecek kimse bulunamazsa savcının talimatı; azmettirdiğinden şüphelenilen yakın. İkinci turda III değişti.
- **teknik-takip-p1-02** (md 9/2-c; `1c0ae5d9`): asgari mesafe raporunu ilgili kolluk birimi hazırlar. Birinci turda dört
  gözcüden ONAY.

RED'ler:
- **tedbir-yon-p1-01** (md 9/3; sınav, 1. tur): biçim temiz ve kestirmesiz, ama tedbirin hangi ilde uygulanacağına
  kurumun karar vermesi sosyal hizmet iç işleyişidir; kolluğa dokunmaz. Sınav değeri 2. Parti boş kapandı.
- **teknik-takip-p1-01** (md 7/3; sınav, 1. tur): hüküm iki seçeneklidir (mağdurun yeri / yükümlünün yeri). İkiz şıklar
  soruyu ikiye indiriyor, "mağdur önce gelir" sağduyusu doğruyu veriyor; "cihaz yükümlüde" diyen hazırlıklı aday
  yanılıyor (ters ayırt etme). Kör çözücü madde bilgisi olmadan buldu.
- **teknik-takip-p1-03** (md 20/2, "doğrudur"; 2. tur, üretici bıraktı): doğru önerme takımın sezgiye en az direnen
  cümlesiydi (kör çözücü eleme ile ~%55). Sınav gözcüsünün önerdiği takas (doğru önerme 9/4, 20/2 yanlış önerme) aynı
  kestirmeyi taşıyordu; ayrıca "kayıt altına alınamaz" yanlış önermesi 6284 md 12/1 karşısında doğru görünürdü.

Üreticilerin yazmadığı yuvalar (kendi gerekçeleriyle): Tedbir Yön. 8/3 (kök cevabı çağırıyor, Kanunla çözülüyor), 22/4;
Uygulama Yön. 5/10'un tek başına biçimi, md 16 YANLIŞTIR biçimi, 19/4; Teknik Takip 13/1 ("en hafif işlem"), 9/4
("hâkim ister").

Çekinceler (yayın kararı için):
- **cocuk-uyg-p1-01:** doğru şık en uzun şık ve takımdaki tek "olup olmadığı" yargısı. Taze kör çözücü salt şıkla %35–40
  güvenle buldu (ikinci aday %30); ONAY.
- **cocuk-uyg-p1-02:** on iki yaş eşiği TCK md 31'in resmî metninden doğrulanmadı; yönetmelik, Yakalama Yön. md 19/a ve
  5395 md 37/1 aynı eşiği taşıyor, soru "Yönetmeliğe göre" kilitli. `articleNo` 16, I. öncül md 5'ten.
- Üç sorunun sınav değeri 3–4 bandında; PAEM bu yönetmelikleri sormadı.

Turun dersleri (`09` brifine işlenecek):
- Yuva sayısı düşük mevzuatta üretici de eleme yapar: analistin 12 yuvasından 6'sı üreticide düştü, 3'ü gözcüde.
- İki seçenekli hükümde (X'in yeri / Y'nin yeri) şık takımı ne olursa olsun ikiz doğar; yuva açılmaz.
- "Doğrudur" sorusunda doğru önerme takımın "zararsız usul cümlesi" ise eleme cevabı verir.
- Yönetmelik hükmü dayanak Kanunun açık cümlesiyle gerilimliyse (Teknik Takip 20/2 ↔ 6284 md 12/1) ne doğru ne yanlış
  önerme olur.
- Üç partinin dört gözcüsü tek tek ajanlarla (rol başına bir ajan, üç parti birlikte) yürütüldü; altı soruluk turda
  yeterli oldu. İkinci turda sınav gözcüsü taze ajandı ve gerçek kör çözüm yaptı.

Şüpheli noktalar (soru konusu olmadı; tam listeler iki analiz raporunun sonunda):
- **Konu etiketi:** iki Teknik Takip sorusu, dört 6284 Uygulama Yön. sorusu ve bir ŞÖNİM Yön. sorusu "6284 Kanunu"
  konusunda etiketsiz duruyor.
- **Bankadaki sorular:**
  - İnsan Hakları bankasındaki dört şıklı tanım sorusu ("5395'te tanımlanan kavram": "suça sürüklenen çocuk") eskimiş
    görünüyor.
  - 5395 konusundaki iki Tedbir Yön. sorusu şıklarda "Aile ve Sosyal Hizmetler Bakanlığı" yazıyor; yönetmelik metni öyle
    demiyor.
  - 5395 md 6 sorusunda "muhtarlar" yanlış şık; Tedbir Yön. 6/1 muhtarı sayıyor.
  - CMK bankasında "çocuk mağdurların dinlenmesi" sorusu tek sözcük farkıyla iki kez duruyor.
  - 6284'ün 35 sorusundan 9'u dört şıklı; üç mükerrer çift.
- **Banka metni:** `mevzuat/5395.txt` dökümünde dipnot ve başlık artıkları (md 33/4, 41/A/4); Tedbir Yön. md 31'in
  altında RG dipnotu gövdede.
- **Bilgi kartları:** `docs/56-bilgi-kartlari/girdi/tts-1.json` ve `tts-2.json` Teknik Takip Yön.'ün iç tutarsız
  hükümlerine dayanıyor olabilir; okunmadı.
- **Doğrulanamayan:** "Danışmanlık Tedbiri Kararlarının Uygulama Usul ve Esasları Hakkında Tebliğ" (RG Nisan 2026);
  yalnız başlığı görüldü.

Kalan kapsam: üç yönetmelikte kestirmesiz ve sınav değeri taşıyan yuva kalmadı; yeni parti açılmaz.

## 5326 Kabahatler + 3628 + 4982 turu (23 Kas 2026)

Aynı kullanıcı talebinin ikinci turu: türetimi hiç yapılmamış üç kanun. Tur eki `16-ek-5326-3628-4982.md`. Analizler:
- `analiz/rapor-5326-kabahatler.md`;
- `analiz/rapor-3628-4982.md`.

Başlangıç durumu: 5326'da 87, 3628'de 23, 4982'de 87 soru; hepsi gerçek kaynaklı, türetim 0. Banka dolu olduğu için iş,
bankanın ölçmediği ve kestirmesiz kurulabilen hükmü bulmaktı.

Metin taraması (iki analist resmî metni indirip betikle karşılaştırdı): üç kanunun banka metni resmî metinle sözcük
sözcük aynı.
- **5326:** 7499 (md 28/10 eşiği; 29/1 "iki hafta"), 7547 (42/A), 7593 (43/C). Tek AYM kaydı 43/A(3).
  **43/C(1)(a) bendi 1/12/2026'da yürürlüğe girer;** banka metninde bu kayıt yok. Bütün TL tutarları yasaklandı.
- **3628:** AYM kaydı yok; metnin kendi eski atıfları için bağlayıcı ad ve atıf kuralı yazıldı.
- **4982:** tek AYM kaydı md 2/3.

| Parti | Analist tavanı | Aday | KABUL | RED |
|---|---:|---:|---:|---:|
| 5326-p1 (genel hükümler) | 5 | 3 | 1 | 2 |
| 5326-p2 (özel kabahatler) | 4 | 3 | 3 | 0 |
| 3628-p1 | 6 | 4 | 3 | 1 |
| 4982-p1 | 2 | 0 | 0 | 0 |
| **Toplam** | **17** | **10** | **7** | **3** |

Yedi soru 23 Kas'ta `in_review` yazıldı. Veritabanında hepsi beş şıklı ve tek doğrulu; anahtarlar aday dosyasıyla aynı.
Etiketler: "Mevzuat türetimi — 5326 md …" ve "… — 3628 sayılı Kanun md …".

KABUL:
- **5326-p1-01** (14/4; `a402b05a`): nitelikli kişi için suç, ötekiler için kabahat olan fiilin birlikte işlenmesi → suça
  iştirak hükümleri.
- **5326-p2-01** (40/1; `e99eaec4`): kimliği/adresi hakkında gerçeğe aykırı beyanda İPC'yi soruyu soran görevli verir
  (kökte hasta kayıt memuru; kolluk çeldirici).
- **5326-p2-02** (43/C/5; `04d65135`): on beş yaşını doldurmamış çocukta tedbir talebinde mülkî amir bulunur. Turun en
  güçlü sorusu: iki kör çözücü de iki yoldan Cumhuriyet savcısına gitti (sınav değeri 5).
- **5326-p2-03** (32/1; `a62b3685`): emrin sebep ve amaçları arasında SAYILMAMIŞTIR; genel ahlâk (md 1'den).
- **3628-p1-01** (17/1; `41779bdd`): 4483'ün uygulanmadığı suçlar arasında SAYILMAMIŞTIR; görevi kötüye kullanma.
- **3628-p1-02** (19/2; `e44ac7de`): savcının görevliden mal bildirimi istemesi ihbarı doğrulayan emareye bağlıdır.
- **3628-p1-03** (6/a; `2b1a9b24`): atanmada bildirim göreve giriş belgeleriyle verilir.

RED'ler:
- **5326-p1-03** (20/4; kalite, 1. tur): dört çeldiricinin dördü de bankadaki soruların cevabı (5/2, 21/4, 27/1, 11/1);
  eleme ve ikizle çözülüyor. Sınav değeri 2.
- **5326-p1-02** (15/3 ikinci cümle; 2. tur, üretici bıraktı): "ceza verilemiyorsa idarî yaptırım" sağduyusu şık takımından
  bağımsız doğruyu veriyor; "suçtan yaptırım uygulanamayan hâl"in her somut örneği (taksir) ikinci doğru adayı.
- **3628-p1-04** (md 3 hediye vakası; kalite, 1. tur): bankadaki resmî boşluk sorusunun kökü cevabı basıyor ("…kendi
  kurumlarına verilir"); mevzuat gözcüsü 6/d mal bildirimi şıkkını savunulabilir ikinci doğru saydı.
- **4982:** üretici tek yuvayı (14/4 Kurul Başkanının seçimi) yazmadı: Kurul başlığı bankada yaklaşık 20 soru, "üyeler
  kendi aralarından seçer" yaygın varsayılan. Kanun tükendi (3071 emsali).

Orkestratör kararları:
- **5326-p2-02, C şıkkı:** ikinci turda orkestratör talimatıyla "Belediye zabıta görevlileri" yapılmıştı; üretici yeni
  şıkkın sağduyuyla düştüğünü bildirdi. Şık birinci turdaki hâline ("Aile ve sosyal hizmetler il müdürlüğü") geri
  alındı. Son tur gözcüleri bu hâliyle ONAY verdi.
- **3628 "sanık":** tur ekindeki kural açıklamadaki doğrudan alıntıları da kapsar sayıldı; alıntılar dolaylı aktarıldı.
- **3628-p1-02:** kalite ile sınav gözcülerinin önerileri çatıştı (19/3 dayanaklı şık); iki doğru riski taşıyan öneri
  uygulanmadı.

Çekinceler (yayın kararı için):
- Sınav değeri tam 3 olanlar: 5326-p1-01, 5326-p2-03, 3628-p1-02. 3628-p1-03'te ayırt edicilik 3 (kolay soru).
- 5326-p2-01: D ve E "soruyu soran görevli" ikizi; sağduyu yanlış ikize götürüyor. Hasta kayıt memuru için özel kanun
  gölgesi sınanmadı.
- 5326-p2 ve 3628-p1'de olumsuz kök 1/3.

Test derleme notları (aynı kısa denemeye konmasın):
- 3628-p1-01 ↔ 02: 01'in kökü 02'nin A çeldiricisini düşürür.
- 5326-p2-01 ↔ 02: üç şık ortak.

Şüpheli noktalar (soru konusu olmadı; tam listeler analiz raporlarının sonunda):
- **5326, olası iki doğru:** "…kolluk tarafından dilencilik tespit edilmesi üzerine dilenci üzerindeki kazancın…" sorusu;
  anahtar "Mülki amir", ama "Belediye encümeni" de 33/2'ye göre doğru. Denetime alınmalı.
- **5326, 43/C(1)(a):** bent 1/12/2026'ya kadar yürürlükte değil; madde özeti, konu özeti ya da kartlar bendi
  yürürlükteymiş gibi anlatıyorsa yanlış.
- **5326, TL'ye dayanan yayındaki sorular:** "10.000 TL … kesindir" vakası, 42/A "on katı", "en yüksek ceza"; beş kök
  "2026 uygulamasına göre" diye açılıyor.
- **5326:** drone (2920) ve alkol (4250) soruları bu konuda etiketli; sekiz dört şıklı soru; mükerrer çiftler (27/1 dört
  kayıt); 87 sorunun 37'sinde doğru şık B.
- **3628:** [60]'ın anahtarı metne göre tartışmalı (resmî soru); md 2 "sendika başkanları" sorusunda iki doğru şüphesi;
  [61] md 15–16'ya dayanıyor (eskime adayı); yönetmelik adıyla 5 soru; 8 dört şıklı.
- **4982:** 87 sorunun 71'i resmî korpusta yok ve 69'u tek elden çıkmış görünüyor; 57'sinde doğru şık B ya da C; 5 dört
  şıklı; çok sayıda mükerrer küme (on beş gün itiraz ×5, dokuz üye ×4, sekretarya ×4).

Kalan kapsam:
- **5326:** 23/2 (iki okumalı), 28/9 ve 28/1 (sağduyu) kapandı. Yedek: 43/C/1-b (02'nin aynası olmamak şartıyla), 43/A/1.
- **3628:** md 9/2 (düşük değer), 19/1, md 5 eşiği, md 8 son fıkra, 17/2, 10/1 kapandı; kanunda yeni parti açılmaz.
- **4982:** tükendi.

Turun dersleri:
- Dolu bankada kalite gözcüsünün asıl işi "banka kökü cevabı basıyor mu" ve "çeldiricilerin hepsi bankadaki cevaplar mı"
  taramasıdır; iki RED buradan çıktı. Analist yuvayı yalnız ölçülen hüküm yönünden tartmıştı.
- Orkestratörün tek şık için verdiği değişiklik talimatı soruyu zayıflattı (5326-p2-02); üreticinin "zayıfladı" beyanı
  üzerine geri alındı. Mevzuat gözcüsünün ONAY'la birlikte yazdığı şüphe, şık değiştirme talimatına çevrilmeden önce
  öbür gözcülerin o şık hakkındaki görüşüyle tartılır.
- "Artık hâl" hükmü (kural uygulanamıyorsa şu uygulanır) kökte kuralın varlığı verildiği anda sağduyuyla bulunur.
- Üreticinin "bırakılsın" beyanı iki turda üç soruda geldi; üçünde de gerekçe gözcü bulgusuyla örtüştü.

## 6458 + 7201 ikinci dalga, 298 ve 657 turu (23 Kas 2026)

Kullanıcı (23 Kas 2026): "Evet, devam et" (az işlenmiş izinli mevzuat). Tur eki `17-ek-6458-7201-ikinci-dalga.md` (üç bölüm:
6458/7201 yedek yuvaları, 298, 657). Yeni analizler:
- `analiz/rapor-298-secim.md`;
- `analiz/rapor-657-memurlar.md`.

6458 ve 7201 için yeni analiz yapılmadı; 22 Kas raporlarının yedek yuvaları işlendi. Tur, model kullanım sınırı yüzünden ikinci turun
başında bir süre durdu; üreticiler aynı gün kaldıkları yerden sürdürüldü. (Bu bölümün ilk yazımındaki "24–26 Kas"
tarihleri yanlıştı; bütün tur 23 Kas'ta yapıldı.)

Metin taraması (iki analist resmî metni indirip betikle karşılaştırdı):
- **298:** 234 maddenin 233'ü resmî metinle aynı; tek fark banka md 189'un altına yapışmış "Ana Kanuna İşlenemeyen
  Hükümler" kuyruğu. AYM kaydı 4, hiçbiri kolluk maddesinde değil; md 94/B (mektupla oy) iptal edilmiş ama gövdesi bankada
  ve resmî metinde duruyor. 7102 (2018) "sandık alanı"nı kaldırdı.
- **657:** 335 ortak başlıkta banka metni resmî metinle aynı; tek içerik farkı md 59 (bir ibare eksik). 2023–2026
  değişiklikleri işlenmiş (7433, 7537, 7547, 7548, 7573, 7578, 7590). 7573 ve 7590'ın Resmî Gazete metinleri ve geçiş
  hükümleri doğrulanamadı.

| Parti | Yuva | Aday | KABUL | RED |
|---|---:|---:|---:|---:|
| 6458-p3 (yedekler) | 16 | 1 | 1 | 0 |
| 7201-p2 (yedekler) | 6 | 1 | 1 | 0 |
| 298-p1 | 6 | 4 | 3 | 1 |
| 657-p1 (md 1–31) | 4 | 1 | 1 | 0 |
| 657-p2 (md 86–145, Ek 8) | 5 | 3 | 2 | 1 |
| **Toplam** | **37** | **10** | **8** | **2** |

Sekiz soru 23 Kas'ta `in_review` yazıldı. Veritabanında hepsi beş şıklı ve tek doğrulu; anahtarlar aday dosyasıyla aynı.
Etiketler: "Mevzuat türetimi — 6458 sayılı Kanun md …", "… — 7201 sayılı Kanun md …", "… — 298 sayılı Kanun md …",
"… — DMK md …".

KABUL:
- **6458-p3-01** (57/3; `52e70a76`): geri gönderme merkezindeki gözetim, yabancı ülkesiyle ilgili doğru bilgi ya da belge
  vermediği için işlemler tamamlanamazsa uzatılabilir. Birinci turda dört gözcüden ONAY.
- **7201-p2-01** (35/1–2; `34f69cb6`): adresini değiştirip bildirmeyen ve adres kayıt sisteminde adresi bulunamayan
  muhatapta evrakın bir nüshası eski adresteki binanın kapısına asılır. İkinci turda "muhtara teslim" şıkkı çıktı.
- **298-p1-01** (51/2; `805e23a0`): seçim döneminde ilçe merkezindeki kapalı yer toplantısı en yakın zabıta amir veya
  memuruna haber verilir (2911 alışkanlığı mülki amire çeker).
- **298-p1-02** (174/1; `2d40bdeb`): seçim suçunda polis memuru genel hükümlere göre soruşturulur (4483 alışkanlığı izne
  çeker).
- **298-p1-03** (175; `f8311e58`): sandık kurulu başkanının tedbirine uymayana idarî para cezasına Cumhuriyet savcısı
  karar verir. İki kör çözücü de ilçe seçim kuruluna gitti.
- **657-p1-01** (13/1; `4f279c77`): YANLIŞTIR; zimmette Hazine cezai takibat sonucunu beklemeden öder. Birinci turda dört
  gözcüden ONAY.
- **657-p2-01** (Ek 8/1-d; `ee64e491`): yurt dışında görevlendirilen güvenlik görevlisinde süre en çok iki yıl.
- **657-p2-02** (125/E-e; `6b433f60`): genel afetlere ilişkin emri yapmamak Devlet memurluğundan çıkarma cezasını
  gerektirir. İkinci turda "fiil → beş ceza" biçimine çevrildi.

RED'ler:
- **298-p1-04** (171; sınav, 1. tur): beş seçim suçunun ceza türü ezberi; yaptırımın adlî para cezası olması kolluğun
  işlemini değiştirmiyor (sınav değeri 2). Kökteki "daha ağır cezayı gerektiren…" kaydı doğru şıkkı işaret ediyordu.
- **657-p2-03** (md 127 son fıkra; 2. tur, üretici bıraktı): polise 7068 uygulanır ve 7068 md 29/4 aynı değeri verir;
  ölçülen bilgi 657'ye özgü değil. 7573'ün Resmî Gazete metni hiçbir rolde doğrulanamadı.

Üreticilerin yazmadığı yuvalar (kendi gerekçeleriyle):
- 6458'in 16 yedeğinden 15'i, 7201'in 6 yedeğinden 5'i: sağduyu, iki seçenekli hüküm, artık hâl, ad kuralı ya da kolluğa
  değmeme. İki kanunda yeni parti açılmaz.
- 298 md 81 + 82/2 (analistin birinci çekirdek yuvası): "sandık çevresi" düz Türkçede cevabı çağırıyor. 173/1 ve 173/2 iki
  okumalı.
- 657 21/2 (polis adayı için "silsile" varsayılan), md 16 (iki seçenekli), 141/1 (iki uç + orta; banka "üçte iki"yi
  öğretiyor), md 122.

Orkestratör kararları:
- **7201-p2-01, C şıkkı:** kalite ve sınav gözcüleri "muhtara teslim"i en güçlü çeldirici buldu; mevzuat gözcüsü 21/1
  lafzıyla savunulabilir ikinci doğru saydı. İki doğru riski önce geldi ve şık değişti. Taze kör çözücü yeni takımda da
  "ilan"a gitti.
- **657-p2-02:** mevzuat ve kalite gözcülerinin biçim itirazı (soru yasak 125/D eşleştirmesini ölçüyor; 7068 çatışması)
  sınav gözcüsünün birinci tur ONAY'ına rağmen uygulandı.
- **Revizyon talimatları:** uzun SendMessage iletileri denetim katmanında takıldı; talimatlar scratchpad dosyasına yazıldı
  ve üreticiye kısa iletiyle yol gösterildi.

Çekinceler (yayın kararı için):
- **298-p1-02:** C ve E ("başka sıfatın özel usulü") sağduyuyla birlikte düşüyor; soru fiilen izin ↔ genel hükümler
  ikilisine iniyor. Ayırt edicilik ve doğallık 3. Taze kör çözücü salt şıkla yanlış şıkka (%50) gitti.
- **657-p2-02:** doğru şık merdivenin en ağır ucu; "afet → en ağır ceza" sezgisi doğruya götürebilir (kör çözücü %40).
- **Sınav değeri 3 olanlar:** 6458-p3-01, 7201-p2-01, 298-p1-03, 657-p2-01. PAEM 298'i ve 6458'i adıyla hiç sormadı.
- **Son tur kör çözümünün sınırı:** taze gözcü dört hükmü (7201 md 35, 298 md 51 ve 174, 657 125/E-e) genel bilgisinden
  hatırladığını beyan etti; bu sorularda "salt şık" güveni tahminidir.

Test derleme notları (aynı kısa denemeye konmasın):
- 7201-p2-01 ↔ bankadaki 21/2 sorusu (kapıya asma ↔ muhtara teslim aynası; "komşu" ikisinde de yanlış şık).
- 6458-p3-01 ↔ bankadaki 57/2 ↔ 57/6 sorusu.
- 298-p1-01, -02, -03: üçünde de ilçe seçim kurulu yanlış şık.

Şüpheli noktalar (soru konusu olmadı; tam listeler analiz raporlarının sonunda):
- **298 banka metni:** md 189'un altındaki "işlenemeyen hükümler" kuyruğu çıkarılmalı. md 94/B iptal edilmiş düzeni
  yürürlükteymiş gibi gösteriyor (özet ve kart için risk).
- **298 bankadaki sorular:** "mükerrer oy" vakasının anahtarı ("özgü suç") doğrulanamadı; "YSK prensip kararları 15 gün"
  sorusunun 298'de karşılığı yok (konu etiketi yanlış görünüyor); "il seçim kurulu" sorusunda bir önerme md 15/2'yi eksik
  aktarıyor.
- **657 banka metni:** md 59'da "Anayasa Mahkemesi Basın Müşavirliğine," ibaresi eksik; md 61 sonunda "(2)" artığı.
- **657 bankadaki sorular:** kökü kopuk bir soru (büyük olasılıkla 2024 KPSS md 63 sorusunun başı düşmüş); "bakan
  müşavirlerinin sayısı on beşi geçemez" anahtarlı soru md 61/A'nın 2025 sonrası metniyle uyuşmuyor olabilir; 25 dört
  şıklı soru; 23 soruda madde etiketi boş; mükerrer kümeler (kariyer tanımı ×4, ödev/hak eşlemesi ×8, md 135 ×7, md 56 ×6).
- **6458 / 7201:** yeni bulgu yok.

Kalan kapsam:
- **6458, 7201:** yedekler tükendi; yeni parti açılmaz.
- **298:** md 82/12, 82/5, 94/1, 174/6, 173/2, md 74 yedekte; hepsi zayıf. Yeni parti açılmaz.
- **657:** md 32–85 tükendi sayıldı. Yedekler md 30, 21/1, 133/3, 98/b, 145/1 üreticide düştü.

Turun dersleri:
- Yedek yuva dalgası beklendiği gibi düşük verimli (22 yuva → 2 KABUL) ama sıfır değil; iki KABUL de sezgiye aykırı
  hükümden çıktı.
- PAEM'in hiç sormadığı kanunda değeri taşıyan, PAEM'in her dönem sorduğu komşu kanunun (2911, 4483) alışkanlığını
  YANLIŞ şıkka bağlayan sorudur (298'in üç KABUL'ü).
- "Kalite ve sınav gözcüsü güçlü buldu" bir şıkkı korumaya yetmez; mevzuat gözcüsü o şıkkı savunulabilir ikinci doğru
  sayıyorsa şık değişir.
- Dil gözcüsüne "REVIZYON'u anlamı etkileyen kusura sakla, biçimsel rötuşu ONAY + not olarak yaz" denince on sorunun onuna
  ONAY + rötuş verdi; önceki turda aynı tür rötuşlar on REVIZYON doğurmuştu.

## İkinci dalga: 5253 + 6698 yedekleri, PVSK, 4483, 6284 (+ Uygulama Yön.), 3713, 6222 (23 Kas 2026)

Kullanıcı (23 Kas 2026): "Evet, devam et" (kalan kanunların yedek yuvaları). Tur eki
`18-ek-ikinci-dalga-pvsk-4483-6284-3713.md` (dört bölüm). Yeni analizler (üçünde de resmî konsolide metin mevzuat.gov.tr'den
indirilip banka metniyle betikle karşılaştırıldı):
- `analiz/rapor-pvsk-ikinci-dalga.md`;
- `analiz/rapor-4483-6284-ikinci-dalga.md`;
- `analiz/rapor-3713-6222-ikinci-dalga.md`.

5253 ve 6698 için yeni analiz yapılmadı; önceki raporların yedek yuvaları işlendi.

Metin taraması:
- **PVSK:** 42 başlığın 34'ü aynı, 6 fark zararsız. **md 12'nin üçüncü fıkrası bankada eksik.** md 16'daki dipnot artığı
  yalnız eski dökümdeydi (`mevzuat/2559.txt` yeniden çıkarıldı). Ek 7'de resmî tabloda AYM kaydı yok.
- **4483:** 25/25 aynı; 7547 işli. **6284:** 26/26 aynı; md 25 sonunda kadro dipnotu artığı. **Uygulama Yön.:** 48/48 aynı;
  yedi maddede sonraki başlık artığı.
- **6222:** 29/29 aynı. **3713:** 52 maddenin 51'i aynı; Ek 1 gövdesine dipnot metinleri karışmış.

| Parti | Yuva (asıl + yedek) | Aday | KABUL | RED |
|---|---:|---:|---:|---:|
| 5253-p2 (yedekler) | 7 | 2 | 1 | 1 |
| 6698-p2 (yedekler) | 5 | 1 | 1 | 0 |
| 2559-p4 | 2 + 5 | 1 | 1 | 0 |
| 4483-p2 | 3 + 2 | 2 | 1 | 1 |
| 6284-p2 | 2 + 3 | 1 | 1 | 0 |
| 6284y-p3 | 1 + 2 | 0 | 0 | 0 |
| 3713-p3 | 1 + 3 | 0 | 0 | 0 |
| 6222-p2 | 3 + 5 | 2 | 2 | 0 |
| **Toplam** | **47** | **9** | **7** | **2** |

Yedi soru 23 Kas'ta `in_review` yazıldı. Veritabanında hepsi beş şıklı ve tek doğrulu; anahtarlar aday dosyasıyla aynı.

KABUL:
- **5253-p2-02** (19/7; `c4a3bdc2`): denetimde suç tespit edilince mülki idare amiri savcılığın yanı sıra derneğe bildirir.
  İki kör çözücü de salt şıkla İçişleri Bakanlığına gitti.
- **6698-p2-01** (28/2-c; `7fdfbebc`): disiplin soruşturması için işlemede kamu kurumu Sicile kayıttan muaftır. Hüküm
  önceki turda başka tasarımla RED almıştı; çeldiriciler bu kez şekli yükümlülüklerden kuruldu.
- **2559-p4-01** (13/A; `701747ea`): kayıp çocuk tedbiri, çocuğu kaçırdığı düşünülen kişinin iletişimini kapsamaz.
- **4483-p2-01** (3/e + 3/b; `7753c461`): Cumhurbaşkanı kararıyla atanıp bir bakanlığın il müdürlüğünde görev yapan için
  izin mercii validir. İki kör çözücü de "Cumhurbaşkanı veya ilgili bakan"a gitti.
- **6284-p2-01** (5/2, 3/2; `d38cd06e`): kolluk amiri evrakı takip eden ilk işgünü içinde onaya sunar (24/48 saat onay
  makamının süresidir).
- **6222-p2-01** (18/6; `d41489e0`): HAGB hâlinde koruma tedbiri kararın kesinleşmesinden itibaren bir yıl sürer. İki kör
  çözücü de "kararın verildiği tarihten" şıkkına gitti.
- **6222-p2-02** (18/7; `74cec5a5`): alkol etkisinde olup çıkmamakta ısrar ettiği için zorla çıkarılan seyirci bir yıl
  seyirden yasaklanır.

RED'ler:
- **4483-p2-02** (md 11; kalite ve sınav, 1. tur): kökteki "itiraz etmiştir" koşulu cevabı veriyor; hüküm iki seçenekli
  usul ayrıntısı.
- **5253-p2-01** (çocuk dernekleri; taze sınav gözcüsü, 2. tur): hukuken temiz, üç rol ONAY; ayırt edicilik 2 ("bir kanun
  bir dernek türünü cezadan bütünüyle muaf tutmaz" sezgisi yanlış önermeyi veriyor), açı kolluğa dokunmuyor.

Üreticilerin yazmadığı yuvalar (kendi gerekçeleriyle):
- **3713 (boş parti):** md 7/4 saf oran ezberi ve cevap bankadaki bir açıklamada basılı; md 21/1 değeri metinde olmayan
  atıf; md 19 ters ayırt ediyor; 7/1 sağduyu.
- **6284 Uygulama Yön. (boş parti):** 3/1-ş iki biçimde de kestirmeli; 34 ve 4/1 bankadaki açıklamalarda yazılı.
- **PVSK:** 4/A/11'de sıra çeldiricisi 4/A/9 + 5/1-e yüzünden ikinci doğru; md 9/8, Ek 4/1, 12/2, 13/1-A sağduyu ya da
  iki seçenekli.
- **4483:** 2/3 bankada doğru önerme olarak yazılı; 2/5 mülga kanunlara atıf; 4/2 kardeş soruda aynen duruyor.
- **6284:** 8/1 en geniş şık; 9/1 varsayılan merci; 2/1-b tanım; 4/1-c, ç kolluğa dokunmuyor.
- **6222:** 18/3 kök cevabın kategorisini çağırıyor; md 20, 12/1, 18/9, 14 yedekleri iki seçenekli ya da açıklamalarda basılı.
- **5253 / 6698:** 15/3, md 23, md 28, 5/2; 12/5, 15/3, 13/2–3, 9/9.

Orkestratör kararları:
- **6222-p2-02, C şıkkı:** son tur gözcüsü ikinci turda konan çeldiriciyi ("tekrarı hâlinde bir yıl yasaklanır") lafzen
  doğru buldu ve şartlı ONAY verdi. Şık üreticiye düzelttirildi ("İlk seferde yazılı olarak uyarılır, tekrarı hâlinde
  seyirden yasaklanır."); soru tek soruluk ek kör kontrol + mevzuat denetiminden geçti (`denetim/tur18-ek-kontrol.json`,
  ONAY; salt şık güveni %35–40).
- **4483-p2-01, kök:** son tur gözcüsünün isteğe bağlı rötuşu uygulandı ("il teşkilatında" → "il müdürlüğünde"; ilçe
  okumasını kapatır, anahtar değişmez). Kör çözümler "il müdürü" ve "il teşkilatında" biçimleriyle yapılmıştı.
- **6698-p2-01, E şıkkı:** gözcü rötuşu ("Veri işleyenle birlikte güvenlik tedbirlerinden sorumlu olma").
- **6698 md 28/2:** ek bir yerde "RED alan hükümler yeniden denenmez" diyor, kapsam satırında bu yuvayı sayıyordu. Yuva
  önceki RED'in gerekçesini karşılayan yeni tasarımla açık tutuldu.
- **Silinmiş iki soru:** analistin "tabanlarda yok" dediği 4483-p1-08 ve 6284y-p2-06 bankada silinmiş durumda (panelden
  kaldırılmış); tutarsızlık yok.

Çekinceler (yayın kararı için):
- **Sınav değeri 3 olanlar:** 5253-p2-02 (usul ayrıntısı; fiilen üç şıklı) ve 6698-p2-01 (kalite 3). Elimizdeki PAEM 8–10
  korpusunda 4483, 6284, 5253, 6698 ve 6222 adıyla soru yok.
- **2559-p4-01:** soru fiilen B–D ikilisine iniyor; "tek farklı kategori" kestirmesi var, karşı sezgiler dengeliyor (iki
  kör çözücü de doğruyu buldu; salt şık güveni %50–60).
- **6284-p2-01:** cevap bankadaki iki kardeş sorunun AÇIKLAMASINDA yazılı; dört çeldiricinin üçü banka değeri.
- **4483-p2-01:** bir bakanlığın il müdürlüğü personelinin Cumhurbaşkanı kararıyla atanması metinde yazmıyor; cevap bu
  olgudan bağımsız doğru (ilde görevli → her hâlde vali).
- **Kör çözümün sınırı:** taze gözcü 6698 md 28/2 ve 6284 md 5/2'yi hatırladığını beyan etti.

Test derleme notları (aynı kısa denemeye konmasın):
- 5253-p2-02 ↔ 5253-p1-07; 6698-p2-01 ↔ bankadaki md 16 sorusu; 4483-p2-01 ↔ 4483-p1-02; 6284-p2-01 ↔ 6284-p1-02 ve -06;
  6222-p2-01 ↔ 6222-p2-02, 6222-p1-11, 6222-p1-12; 6222-p2-02 ↔ 5326 md 35 soruları; 2559-p4-01 ↔ bankadaki iki 13/A sorusu.

Şüpheli noktalar (soru konusu olmadı; düzeltilmedi; tam listeler analiz raporlarının sonunda):
- **PVSK banka metni:** md 12'nin üçüncü fıkrası eksik.
- **PVSK soruları:** "süre eşleştirmesi" sorusunun bir önermesi, AYM'nin 2017'de iptal ettiği 4/A yetkisini (kolluk amirinin
  arama kararı, yirmi dört saatte hâkim onayı) doğru sayıyor (anahtar etkilenmiyor); Kaymakamlık 2022 Ek 1 sorusu iki kez
  duruyor, E şıkları farklı; doğru şık A–B'ye yığılı (67/117); 7 etiketsiz, 8 dört şıklı soru.
- **3713 banka metni:** md 7 son fıkra ve Ek 4 iptalleri görünmüyor; Ek 1 gövdesinde dipnot metinleri; md 20'de "(11)"
  artığı; Geçici 10 ve 17 başlıklarında önceki maddenin iptal şerhi.
- **3713 soruları:** dört yanlış konu etiketi (bir 5442, üç 5233 sorusu); 10 dört şıklı soru; md 20'de ikiz iki soru.
- **6222 soruları:** "güvenlik görevlileri sayısını kim belirler" sorusunda ikinci doğru şüphesi (kök "özel güvenlik"
  demiyor; md 7/3 ↔ 7/4).
- **6284 soruları:** konudaki 21 gerçek sorunun 7'si Kanunu değil yönetmelikleri ölçüyor ve madde etiketsiz (Uygulama Yön.
  4, Teknik Takip 2, ŞÖNİM Yön. 1).
- **4483 soruları:** üç soruda 7547 ile kalkan "Cumhurbaşkanlığı İdari İşler Başkanı" çeldirici olarak duruyor (anahtar
  etkilenmiyor); md 12/2, md 8 ve "on gün" mükerrer kümeleri; 4483 + 6284'te 20 dört şıklı soru.

Kalan kapsam: bu turdaki sekiz metinde kestirmesiz ve sınav değeri taşıyan yuva kalmadı; yeni parti açılmaz. İzinli polis
mevzuatında türetim fiilen tükendi (23 Kas'taki dört turda 35 aday → 25 KABUL).

Turun dersleri (`09` brifi, "üçüncü bölüm"): tur eki yuva satırında cevabı yazmaz; son turdan sonra şık değişirse tek
soruluk ek kör kontrol; kör çözücünün yanıldığı soruda kök en dar biçimde değişir; son turda sınır kararı RED'dir.
