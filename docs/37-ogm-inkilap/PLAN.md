# Doc 37 — OGM Materyal İnkılap Tarihi Partisi

Başlangıç: 8 Eylül 2026 · Kaynak: MEB **OGM Materyal** soru bankasından
yazdırılmış 10 soruluk test (`ogmmateryal.eba.gov.tr`, id 251…22683).
Ders: Atatürk İlkeleri ve İnkılap Tarihi.

Kullanıcı isteği: *"bu soruları in review'e alabilir misin. soruları incelesin
denetçi ve yanlış varsa tespit etsin ve açıklama oluştursun. ardından ben
onaylayacağım."*

## 0. Kaynak — metin katmanı SAĞLAM

Doc 34'ün aksine bu bir tarama değil, tarayıcıdan yazdırılmış PDF (Skia/PDF).
OCR hattı gerekmedi; `pdftotext` doğrudan çalıştı. İki tuzak vardı:

- **İki sütun.** `-layout` çıktısında yan yana duran iki farklı sorunun
  satırları birbirine giriyor. Çözüm: sütunları piksel olarak kırpmak
  (`-x 0 -W 300` / `-x 300 -W 300`), yani karışmayı kaynağında kesmek.
- **Yazdırma altbilgisi.** Sayfa dibindeki uzun URL tam sayfa genişliğinde tek
  bir "kelime"; sütun kırpması onu ikiye bölünce sağ yarısı, sağ sütundaki son
  şıkkın devamı gibi metne yapışıyordu (8. ve 10. soruda E şıkkına). Çözüm:
  gövdeyi `-H 790`'da kesmek — altbilgi y≈819, soru metni y≈721'de bitiyor.

`ogm-ayristir.ts` bu iki kesimi yapar ve yazmadan önce doğrular: sıra atlaması,
eksik şık, kısa kök, eksik/fazla anahtar, metne karışmış altbilgi. Sorun varsa
dosya ÜRETMEZ — yarım parti üretmek, yanlış anahtarla soru yazmaya giden yoldur.

Sonuç: **10 soru · 10 anahtar · 0 sorun.**

## 1. Mükerrer taraması

`ogm-mukerrer-tara.ts` iki tur çalışır:

- **Tam eşleşme** — `questionFingerprint` (bankanın kendi parmak izi).
- **Yakın eşleşme** — bu parti hazır bir soru bankasından geliyor ve klasik
  ders kitabı soruları bankada başka bir dizgiyle durabilir. İnkılap Tarihi
  sorularıyla kelime kümesi benzerliği (Jaccard ≥ 0,55) ölçülür. Eşiği aşan
  SİLİNMEZ, insana gösterilir.

Sonuç: tam eşleşme 0, yakın eşleşme 0 → **10 aday**.

## 2. Kör çift denetim

İki bağımsız denetçi, cevap anahtarını görmeden (`parti/ogm-1-kor.json`) her
soruyu kendi çözer. Talimat: `DENETCI-TALIMATI.md`.

Bu partinin Doc 34'ten farkı: **eskime ekseni yok** (tarih sorusu eskimez),
onun yerine **anahtar tartışması** var. MEB'in anahtarı burada bir veri, kutsal
bir doğru değil. İnkılap Tarihi'nde iki soru tipi kronik olarak tartışmalıdır:
ilke eşleştirme ("bu söz hangi ilkeyle ilgilidir" — iki ilke birden
savunulabilir) ve kök-şık uyuşmazlığı (kökteki tanım, doğru şıkkın gerçekte
düzenlediği konuyu karşılamıyor).

`ogm-denetim-birlestir.ts` kararı üretir:

| Karar | Anlamı | Bankaya |
|---|---|:--:|
| `ONAY` | iki denetçi + anahtar aynı, uyarı yok, güven yüksek | ✓ |
| `ZAYIF` | aynı, ama bir denetçinin güveni düşük | ✓ |
| `UYARI` | aynı, ama soruda kusur bildirilmiş | ✗ |
| `ANAHTAR-SUPHELI` | denetçiler hemfikir, **anahtardan farklı** | ✗ |
| `CELISKI` | denetçiler birbirinden farklı | ✗ |

## 3. Denetim sonucu

| Karar | Soru | |
|---|--:|---|
| `ONAY` | 7 | s1 s2 s3 s6 s7 s8 s10 |
| `UYARI` | 2 | s4 (kök kusuru) · s9 (ikinci savunulabilir şık) |
| `CELISKI` | 1 | s5 (ilke eşleştirmesi tartışmalı) |
| `ANAHTAR-SUPHELI` | 0 | — |

Denetçiler **anahtarın hiçbirinde** yanılmadı: 10 sorunun 9'unda ikisi de MEB
anahtarını buldu. Ama üç soruda kusur çıkardılar ve **ikisinde birbirinden
bağımsız aynı kusuru** yazdılar — çift denetimin işe yaradığı yer tam burası:

- **s4 — Kabotaj.** Kök "kıta sahanlığını (deniz kıyı güvenliği) garanti altına
  alan yasa" diyor. 815 sayılı Kanun kabotaj hakkını, yani Türk limanları
  arasında taşımacılık ve liman hizmetlerini millî egemenliğe bağlar; kıta
  sahanlığı deniz yatağı ve toprak altı kaynaklarına ilişkin ayrı bir kavram ve
  Türkiye gündemine 1970'lerde girdi. Parantez içindeki "deniz kıyı güvenliği"
  tanımı da yanlış. Doğru şık değişmiyor — **kusur kökte.**
- **s9 — sağlık kurumları.** Anahtar C (Etfal Hastanesi, 1899 — Osmanlı), ama D
  şıkkındaki Sıhhiye Müdüriyet-i Umumiyesi de Osmanlı kurumu (1913, Dahiliye
  Nezareti). Cumhuriyet'in organı 3 Mayıs 1920'de kurulan Sıhhiye ve
  Muavenet-i İçtimaiye Vekâleti. "Yer almaz" ölçütünü **iki şık** karşılıyor.
- **s5 — Ankara'nın başkent oluşu.** Denetçiler ayrıştı: biri Milliyetçilik
  (anahtarla aynı), diğeri İnkılapçılık dedi. İkisi de sözün iki ilkeyle birden
  okunabildiğini yazdı. Kök zaten "daha çok" diyerek belirsizliği kabul ediyor.

Üçü de bankaya girmedi.

## 4. Bankaya yazım

`ogm-bankaya-yaz.ts` — `ONAY`/`ZAYIF` + açıklaması yazılmış sorular,
`status: in_review`. Konu: **Atatürk İlkeleri ve İnkılap Tarihi**
(`23d22785…`) — dersin tek konusu (bkz. §5).

`sourceLabel` bu partide **DOLU**: soru MEB'in açık soru bankasından geliyor ve
"her sorunun kaynağı bankada kayıtlıdır" kuralı bunu gerektiriyor. Etiket son
kullanıcıya gösterilmez (`SettingsService.showQuestionSource`, varsayılan
kapalı); yalnız admin panelde görünür.

Onay kullanıcıda: sorular admin panelin onay kuyruğuna düşer.

## 5. Yan iş — üç İnkılap konusu tek konuda birleşti (8 Eyl 2026)

Bu parti yazılacak konuyu ararken çıktı: **Atatürk İlkeleri ve İnkılap Tarihi**
dersinin altında neredeyse aynı adı taşıyan ÜÇ kök konu vardı.

| Konu | Ad | Soru |
|---|---|--:|
| `181c590f…` | Atatürk İlkeleri ve İnkılap Tarihi | 30 |
| `e699f23d…` | Atatürk İlkeleri ve İnkılap Tarihi | 161 |
| `23d22785…` | İnkilap Tarihi *(yazım hatası)* | 437 |

Sınavın kendi başlığı tek ve müfredat Trablusgarp'tan I. Dünya Savaşı'na tek bir
bütün; üçe bölünmüş konu ağacı kütüphaneyi, konu bazlı alıştırmayı ve
ilerleme/mastery kayıtlarını da üçe bölüyordu. Kullanıcı kararı: birleştir.

`inkilap-konu-birlestir.ts` en çok soruyu tutan konuyu HEDEF aldı (en az satır
taşınsın), adını düzeltti ve `e699f23d`'nin 26 `matchKeywords` birikimini
hedefe taşıdı.

**Kullanıcı verisi toplandı, silinmedi.** 39 kullanıcının birden fazla konuda
ilerlemesi, 98 (kullanıcı, hafta) çiftinin birden fazla mastery fotoğrafı vardı:

- `user_topic_progress`: solved/correct toplandı, `mastery = correct/solved` —
  `progress.service.ts`teki `ON CONFLICT` formülünün birebir aynısı.
- `topic_mastery_snapshots`: solved toplandı, mastery solved ile ağırlıklı
  ortalama. Snapshot'ta `correct_count` yok; ağırlıklı ortalama, mastery
  zaten `correct/solved` olduğu için o oranın **birebir** yeniden kurulmuş hâli.

Kaynak konular en son, satırları boşaldıktan sonra silindi — FK'ler `RESTRICT`
olduğu için gözden kaçan bir referans olsaydı silme hata verecek ve işlem geri
alınacaktı. Emniyet supabı script'te değil, veritabanında.

Doğrulama (yedekle karşılaştırmalı):

| | Önce | Sonra |
|---|--:|--:|
| ilerleme satırı | 121 | 65 |
| toplam çözülen / doğru | 776 / 447 | **776 / 447** |
| mastery fotoğrafı | 295 | 168 |
| benzersiz (kullanıcı, hafta) | 168 | **168** |
| konu | 3 | **1** |

`mastery = correct/solved` bağıntısı 65 satırın 65'inde tutuyor. Geri dönüş
yedeği repo DIŞINA yazıldı (kullanıcı verisi commit edilmez).

## 6. İkinci parti — test2…test8 (8 Eyl 2026)

Kullanıcı yedi test daha indirdi (70 soru, hepsi aynı ders). Aynı hat, iki
farkla: parti çok, o yüzden kimlik `t<test>s<no>` (soru numarası testler
arasında tekrar ediyor); ve uyarılar için **hakem turu** eklendi.

### 6.1 Ayrıştırıcıdaki sabit kesme — düzeltildi

İlk turda gövdeyi sabit `790` pt'de kesiyordum (altbilgi metne karışmasın
diye). test7'de son şık y≈799'da basılmış ve o sabit sınır **E şıkkını
yutmuştu**. Doğrulama yakaladı, parti kurulmadı — ama asıl ders şu: sabit
sayı, bir örnekten genellenmiş bir varsayımdı.

`govdeAlti()` artık altbilginin **kendi konumunu** `pdftotext -bbox` ile okuyup
2 pt üstünden kesiyor. Testten teste değişen şey artık ölçülüyor, varsayılmıyor.

### 6.2 Metin katmanında olmayan tablo

test3'ün 2. sorusu "Yukarıda verilen tablo" diyor ama tablo resim olarak
basılmış — soru metin hâliyle çözülemez. `pdfimages -list` yedi testte **tek
bir** görsel buluyor ve o da tam bu tablo, yani başka gizli görsel yok.

Tablo `ogm-gorsel-cikar.ts` ile kırpıldı, `mediaUrl` ile bağlandı. Denetçilere
de PNG'nin yolu verildi: görmeden bakan denetçi soruyu haklı olarak
"çözülemez" sayardı ve kusur sorunun değil bizim olurdu. İki denetçi de
doğru cevabı verdi — yani görseli gerçekten açtılar.

### 6.3 Mükerrer

Tam eşleşme (banka + parti içi): 0. Yakın eşleşme 2, ikisine de bakıldı:

- **t7s6** (Doğu Cephesi komutanı) — bankada aynı soru **iki kez** var, ikisi
  de Kazım Karabekir. Üçüncüsü adaya tekrardan başka bir şey vermez. Elendi.
- **t2s9** — benzerlik yalnız kalıp sözlerden; bankadaki soru San Remo'yu
  soruyor. Kaldı.

### 6.4 Denetim: 69 soru, sıfır çelişki

Sekiz denetçi (parti başına iki), 69 sorunun **69'unda** hem birbiriyle hem
MEB anahtarıyla aynı şıkta. Çelişki de anahtar şüphesi de çıkmadı.

Denetçi eforu eşit değildi: araç çağrısı 3 ile 8 arasında. Ama hiçbir parti
"iki denetçi de yüzeysel" durumuna düşmedi — her partide en az biri TBMM ve
Dışişleri Bakanlığı kaynaklarına gitti. İlk partideki 17-19 çağrılık titizlik
yine de yakalanmadı; not düşülüyor.

### 6.5 Hakem turu — neden gerekti

13 soruya uyarı geldi, ama uyarıların ağırlığı çok farklıydı: kimi "birden
fazla şık savunulabilir", kimi "kökte çoğul kip kullanılmış". İlk parti kuralı
(uyarı = bankaya girmez) burada körü körüne uygulansa, adayın hiç fark
etmeyeceği dizgi pürüzü yüzünden kullanılabilir sorular elenecekti. Kuralı tek
başıma gevşetmek de çift denetimin anlamını boşa çıkarırdı.

Ayrı bir hakem turu (`HAKEM-TALIMATI.md`): iki hakem yalnız şu soruya cevap
verir — *bu kusur adayın haklı olarak itiraz edebileceği bir kusur mu?*

Kural: **iki hakem de `TEMIZ` demezse soru girmez.** Ayrışmanın kendisi,
kusurun tartışmaya açık olduğunun kanıtıdır; şüphe sorunun aleyhine.

Sonuç: 12 `ONAY-HAKEM`, 1 `KUSURLU` (**t5s9** — hakemler ayrıştı).

### 6.6 Sonuç

| | Soru |
|---|--:|
| Ayrıştırılan | 70 |
| Mükerrer elendi | 1 (t7s6) |
| Denetime giren | 69 |
| `ONAY` | 56 |
| `ONAY-HAKEM` | 12 |
| `KUSURLU` | 1 (t5s9) |
| **Bankaya yazıldı (`in_review`)** | **68** |

68 sorunun 68'inde açıklama, 54'ünde künye, 1'inde görsel.

## 7. Üçüncü ve dördüncü parti — test9…test20 (8 Eyl 2026)

Kullanıcı 12 test daha indirdi. İkiye ayrıldılar:

| | Test | Soru | Kaynak biçimi |
|---|---|--:|---|
| 3. parti | test9-14 | 60 | metin katmanı sağlam |
| 4. parti | test15-20 | 60 | **sorular resim olarak basılmış** |

### 7.1 Ayrıştırıcıda sabit sayı kalmadı

test7'de sabit `790` pt kesme son şıkkı yutmuştu (§6.1). Bu turda `govdeAlti()`
altbilginin konumunu `pdftotext -bbox` ile okuyor. 12 testin 6'sı sorunsuz
geçti; kalan 6'sında ayrıştırıcı "şık eksik (A,B,C,D,E)" diyerek durdu —
çünkü o sayfalarda gerçekten metin yoktu.

### 7.2 Resim olarak basılmış sorular — transkript hattı

test15-20'de kök, roma rakamlı öncüller ve beş şıkkın tamamı tek bir taranmış
görüntü. Doc 34'ün OCR hattı (macOS Vision) burada riskliydi: oradaki en
sistematik hasar **roma rakamlarındaydı** ve bu sorular baştan sona roma
rakamlı öncüllerden oluşuyor.

Onun yerine: sayfa 200 dpi PNG'ye basılıp **iki bağımsız ajana ayrı ayrı
transkribe ettirildi**, çıktılar `ogm-transkript-karsilastir.ts` ile
karşılaştırıldı.

**Kalibrasyon (test15):** bu testin ilk 5 sorusu metin, son 5'i resim. Yani
ajanların çıktısı `pdftotext`in verdiği KESİN doğruyla ölçülebildi:

| Ölçüm | Sonuç |
|---|---|
| İki transkript birbirine | 10/10 |
| A ↔ kesin doğru | 4/5 |
| B ↔ kesin doğru | 4/5 |

Tek fark ikisinde de aynı yerde: kaynakta kapanış tırnağı `’’` basılmış, ikisi
de `"` yazmış. Roma rakamlarında tek fark yok. Yol bu kanıtla açıldı.

`KISMI=1` kipi bu kalibrasyon için eklendi: bir testin sağlam çıkan soruları
ayrı dosyaya yazılır ama script **yine de hata verir ve parti kurmaz** — kısmi
çıktı hiçbir zaman tam parti yerine geçmemeli.

### 7.3 İki ajanın uyuşması ispat değil

t16s8'de ikisi de aynı kelimeyi aynı şekilde yanlış okudu (`hükümet` ↔ kaynakta
`hükûmet`) ve karşılaştırma bunu göremedi: **ortak eğilim uyuşmadan sağ
çıkıyor.**

Düzeltme tahminle değil ölçümle yapıldı — metin katmanı sağlam 13 testten MEB'in
kendi yazım tercihi çıkarıldı: **millî** 38'e 1, **askerî** 7'ye 0, **resmî**
1'e 0, ama **milliyetçilik** 15 kez düz. Bu ölçüye göre 9 geçiş düzeltildi.

Ayrışan 4 soruda fark içerikte değil, ajanların kendi ekledikleri parantez içi
düzen notlarındaydı (tablo hâlinde basılmış şıklar) — talimatın eksiği.
`transkript/karar.json` hangisinin kanonik olduğunu ve neyin gözle
doğrulandığını kayda geçirir.

### 7.4 Denetçilerin "bu bizim hatamız mı" tereddüdü — dördü de kaynağın

Denetçilere bu partinin metninin görüntüden çıkarıldığı söylendi ve şüpheli bir
şey görürlerse yazmaları istendi. Dört soruda "transkript kusuru olabilir"
dediler; dördünde de kaynak görüntüsüne bakıldı:

| Soru | Kaynakta |
|---|---|
| t16s6 | kök sayfada da aynen bozuk basılmış |
| t18s3 | "3 Ekim 1921" yazıyor (doğrusu 1922) |
| t19s2 | "Hailfeliğin" yazıyor |
| t20s6 | tabloda C ve E satırları birebir aynı |

**Dördü de MEB'in dizgi kusuru; transkript sadık.** Ajanlar bozuk cümleyi
düzeltmeye kalkmamış, olduğu gibi kopyalamışlar — talimatın "sen soru
YAZMIYORSUN, KOPYALIYORSUN" kuralı tuttu.

### 7.5 Sonuç

| | 3. parti | 4. parti |
|---|--:|--:|
| Denetime giren | 60 | 56 |
| `ONAY` | 48 | 38 |
| `ONAY-HAKEM` | 9 | 12 |
| `KUSURLU` | 2 | 6 |
| `ANAHTAR-SUPHELI` | 1 | 0 |
| **Bankaya yazıldı** | **57** | **49** |

Görselli 4 soru (t16s3, t17s2, t19s5, t20s10) **kullanıcı kararıyla alınmadı**.

`t20s6` hakemlerden "temiz" aldı ama bankaya GİRMEDİ: aynı metni taşıyan iki
şık, hangi karar verilirse verilsin sorunun bozuk olduğu anlamına gelir. Bu
kontrol `ogm-bankaya-yaz.ts`e son savunma hattı olarak konuldu. Hakemlere
"adayın kararını değiştiriyor mu" diye sorulmuştu; "ürün bozuk görünüyor mu"
diye sorulmamıştı — talimatın eksiği, hakemlerin değil.

### 7.6 `ANAHTAR-SUPHELI` ilk kez çıktı — t10s4

> Lozan ile elde edilen kazanımlar arasında hangisi **yer almaz**?
> A) Doğu Trakya'nın kurtarılması · B) Yabancı okulların MEB'e bağlanması

MEB anahtarı A; **iki denetçi de bağımsız olarak B** dedi. Lozan'da
kararlaştırılan, okulların Türk kanunlarına tabi olması ve Türk müfettişlerce
denetlenmesiydi; Bakanlığa bağlanmaları Tevhid-i Tedrisat'ın (1924) işi. Bir
denetçi daha ileri gitti: **aynı testin 1. sorusu** maddeyi doğru ifade ediyor,
demek ki bu soruda ifade bilinçli değiştirilmiş.

Hangisinin haklı olduğuna karar verilmedi — anahtarı tartışmalı soru bankaya
yazılmaz.
