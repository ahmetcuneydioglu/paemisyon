# Yayındaki 6458 md 102 ve 7201 sorularının denetimi (23 Kas 2026)

## Kapsam ve kaynak

22 Kas 2026 Doc 39 turunun (6458 + 3071 + 7201) analistleri, yayındaki altı soruda kusur şüphesi raporladı. Bu belge o altı soruyu resmî metne karşı denetler. Düzeltmeler ve geri çekme, kullanıcının "Evet, uygula" onayıyla 23 Kas 2026'da uygulandı (son bölüm).

Denetim yöntemi:

1. Sorular veritabanından salt okunur çekildi: kök, şıklar, açıklama, künye, deneme kullanımı.
2. Resmî metinler mevzuat.gov.tr tam metin ucundan ve resmigazete.gov.tr'den betikle indirildi. Dökümler scratchpad'de, `banka-kusur/indir/` altında.
3. Esasa ilişkin kusur iddiası olan sorular iki bağımsız çürütücüye verildi:
   - savunucu: iddiayı çürütmeye çalışır;
   - savcı: iddiayı doğrulamaya çalışır.
4. Karar yayındaki soru düzeltme ilkesine göre verildi: çekme kararı için iki çürütücünün ikisi de esasa ilişkin kusur görmeli.

Kaynaklar:

- **6458 sayılı Kanun:** mevzuat.gov.tr, dipnotlu konsolide metin. Md 102 ve dipnot [27]–[30].
- **TCK md 79, Kabahatler Kanunu md 15, 34 ve 42/A, 1774 Ek md 1, 7201 md 32–33:** mevzuat.gov.tr.
- **4207 md 5:** mevzuat.gov.tr (`MevzuatNo=4207&MevzuatTur=1&MevzuatTertip=5`).
- **Tebligat Kanununun Uygulanmasına Dair Yönetmelik:**
  - Resmî Gazete aslı: 25/1/2012, sayı 28184, `eskiler/2012/01/20120125-7.htm`.
  - Konsolide metin: mevzuat.gov.tr, `MevzuatNo=15828&MevzuatTur=7&MevzuatTertip=5`.
  - Md 53–55 iki kaynakta da aynı; değişiklik izi yok.
- **7587 sayılı Kanun:** Resmî Gazete 1/7/2026, sayı 33297 (`eskiler/2026/07/20260701-1.htm`).
- **Üretim kaynağı:** kullanıcının "2026 İPC Tablosu.xlsx" dosyası (2.297 satır, uygulama tablosu). Dört "Özgün soru" etiketli soru, yani üç 6458 sorusu ile 5326 karşılaştırma sorusu, buradan üretilmiştir. Bu bir hukuki dayanak değildir.

## Arka plan: dört "Özgün soru" nereden geliyor

Üç 6458 sorusu ile 5326 karşılaştırma sorusu aynı kaynaktan üretildi. Etiketleri "Özgün soru · … · 2026 İPC uygulama tablosu"; yayın tarihi 24 Ağu 2026. Kaynak, kullanıcının sağladığı "2026 İPC Tablosu.xlsx"'tir. Tablonun 6458 satırları şunlar:

| Tablo satırı | Cezaya karar veren makam | Tekerrür |
|---|---|---|
| Md. 102/1-a … 102/1-e | KOLLUK | "1 takvim yılı içerisinde yarı oranda arttırılır" |
| Md. 102/2 ("barınma imkân sağlamak") | KOLLUK | aynı |
| Md. 102/6 ("DÜZENSİZ GÖÇÜ ÖNLEMEK AMACIYLA BAKANLIKÇA BELİRLENEN YÜKÜMLÜLÜKLERE UYMAMAK") | VALİ | aynı |

Tablo kolluğun uygulama tablosudur. Üç noktada resmî metinden ayrılıyor:

1. 102/6 satırı 2019 öncesi ibareyi taşıyor. 7196 md 88 o ibareyi metinden çıkardı (6458 dipnot [30]).
2. Makam sütunu kanunun seçimli mercilerini tek merciye indiriyor:
   - 102/5: "valilik veya Genel Müdürlük ya da kolluk birimlerince uygulanır";
   - 102/6: "Genel Müdürlük veya valilikler tarafından".
3. Tekerrür sütununda, 7196'nın 102/3'e eklediği "gerçek kişiler tarafından" kaydı yok (dipnot [29]).

Soruların kusurları bu üç noktadan doğuyor. Doc 32 denetimi 5326 sorusunu aynı tabloyla doğrulamıştı (`docs/32-yayin-denetimi/ilerleme.jsonl`, d254b76e, 28 Ağu 2026). Bu yüzden B şıkkındaki eksik görülmedi.

İPC tablosundan üretilen sorular (23 Kas 2026):
- 20 soru yayında, hiçbiri bir denemede kullanılmamış:
  - 5326: 13;
  - 1774: 4;
  - 6458: 3.
- Yayındaki "Özgün soru" etiketli soru sayısı: 214.
- Kalan 17 soru bu denetimin kapsamında değil. Ama aynı üç sapma örüntüsü (eski ibare, tek merciye indirgeme, eksik kayıt) onlarda da aranmalı.

## Çürütücü sonuçları

| Soru | Savcı | Savunucu | Karar (ilkeye göre) |
|---|---|---|---|
| 068897c3 — 6458 md 102/6, "yetkili makam" | AÇIKLAMA DÜZELTİLMELİ (yüksek) | AÇIKLAMA DÜZELTİLMELİ (orta) | Soru kalır; açıklama düzeltilir. Kökteki eski ibare için düzeltme önerilir (kullanıcı kararı). |
| bff6766d — 6458 md 102/2, apart işletmecisi | ÇEKİLMELİ (orta) | AÇIKLAMA DÜZELTİLMELİ (orta) | 1-1: soru kalır, açıklama düzeltilir, kullanıcıya bildirilir. |
| 1eb06eb0 — 6458 md 102/3, tekerrür | AÇIKLAMA DÜZELTİLMELİ (orta) | BİLDİRİLİR (yüksek) | Açıklamaya ve köke "gerçek kişiler tarafından" kaydı eklenmesi önerilir (kök: kullanıcı kararı). |
| 5e57ed04 — 5326 tekerrür karşılaştırması | BİLDİRİLİR (yüksek) | BİLDİRİLİR (yüksek) | Soru doğru. B şıkkına dokunulmaz. Açıklamadaki tablo atfı çıkarılır. |
| fde12df0 — Tebligat Yönetmeliği [309] | AÇIKLAMA DÜZELTİLMELİ (yüksek) | AÇIKLAMA DÜZELTİLMELİ (yüksek) | Soru doğru (tek cevap E); açıklama düzeltilir. |
| 90abc862 — 7587 güncel olay | KUSURSUZ (orta) | KUSURSUZ (yüksek) | Dokunulmaz. |

Çürütücü raporları scratchpad'de, `banka-kusur/` altında:
- `curutucu-savci.md`
- `curutucu-savunucu.md`

Düzeltme metinlerinin bağımsız denetimi aynı klasörde:
- `denetci-duzeltme.md`
- `denetci-duzeltme-2.md`

## Soru soru

### fde12df0 — Tebligat Kanununun Uygulanmasına Dair Yönetmelik, usulsüz tebliğ ve tatil (resmî: Adalet Bakanlığı GYS, 19 Ağu 2023)

**Analist iddiası.** B önermesinin Yönetmelikteki karşılığı doğrulanmalı; açıklamanın son cümlesi B'nin tersini söylüyor. B yanlışsa soru iki cevaplı olur.

**Bulgu.** B, Yönetmelik md 53/3'ün birebir metnidir. Soru tek cevaplıdır.
- Md 53/3: "Tebliğin usulüne aykırı yapılmış olması halinde, muhatabın tebliği öğrendiğinin ve bunun tarihinin iddia ve ispatı mümkün değildir."
- Md 55/1: "Resmî ve adli tatil günlerinde de tebligat yapılabilir." Bu yüzden E yanlıştır, aranan cevap E'dir.
- Resmî kitapçığın cevap anahtarında soru 69 için "E" yazıyor (ODSGM, 1. Grup Yazı İşleri Müdürü, A kitapçığı).
- Kanun md 32'de 53/3'ün karşılığı yok. Doc 32 denetçisi Yönetmelik metnine bakmadan açıklamayı yeniden yazmış (ilerleme.jsonl, 8ed1552c, 29 Ağu 2026). Kusurlu son cümle o turdan geliyor.

**Açıklama kusuru.** "Muhatabın tebliği öğrendiğini ve bunun tarihini iddia ve ispat etmesi de mümkündür." Bu cümle 53/3'ün tam tersidir ve doğru önermeyi yanlış gösterir. Ayrıca "tebliğ tarihi muhatabın öğrenme tarihine kayar" ifadesi kesin değil: tebliğ tarihi, muhatabın beyan ettiği tarihtir (md 53/2; Kanun md 32).

**Karar.** Soru kalır; açıklama iki yerden düzeltilir:
1. «yalnızca tebliğ tarihi muhatabın öğrenme tarihine kayar.» → «yalnızca tebliğ tarihi, muhatabın tebliği öğrendiğini beyan ettiği tarihe kayar.»
2. Son cümle şöyle değişir: «Yönetmelik bu iki kuralı 53 ve 55 inci maddelerinde tekrarlar; muhatabın hangi hâlde tebliği öğrenmiş sayılacağını da tanımlar (md 53/1) ve usulsüz tebliğe bir ispat sınırı ekler: tebliğ usulüne aykırı yapılmışsa muhatabın tebliği öğrendiğinin ve bunun tarihinin iddia ve ispatı mümkün değildir (md 53/3). Bu yüzden ispata ilişkin önerme doğrudur; yanlış olan, tatil günlerinde tebligatın yapılamayacağını söyleyen önermedir.»

Künye boş. Eklenmesi isteğe bağlıdır; mevcut araçla eklenemiyor.

### 90abc862 — 7587 sayılı Kanun (güncel olaylar)

**Analist iddiası.** 7587, 7201'i değiştirmedi; "elektronik tebligat kapsamını genişleten" nitelemesi yanlış ya da yanıltıcı olabilir.

**Bulgu.** Kök 7201'den söz etmiyor; nitelemesi doğru. 7587'nin madde başlarında 7201 yok (RG 1/7/2026, 33297). Değişiklikler:
- Md 1: 3201 md 55'teki rütbe oranları tablosu.
- Md 7: 195 sayılı Kanuna md 35/A, internet haber sitelerinin vasıfları.
- Md 9: VUK md 107/A yeniden yazıldı. Elektronik tebligat sistemini kullanmak zorunda olan gruplar kanunda sayıldı; ÖTV (II) sayılı listedeki malların ilk iktisabında adına tescil yapılanlar gibi yeni gruplar eklendi.

Açıklamadaki 7594 bilgisi de doğru (RG 18/8/2026). Soru bir denemede kullanılmış (1).

**Karar.** Kusursuz, dokunulmaz.

### 068897c3 — 6458 md 102/6, "yetkili makam" (doğru: B "Vali")

**Analist iddiaları ve sonuçları:**

| İddia | Sonuç |
|---|---|
| (1) Kök, 7196'nın 2019'da çıkardığı "düzensiz göçü önlemek maksadıyla" ibaresini kullanıyor (dipnot [30]). | Doğrulandı, ama esasa ilişkin değil. Kökün tarif ettiği yükümlülükler bugünkü kapsamın içinde, sorulan makam değişmedi. İbare İPC tablosunun satır başlığından geliyor. |
| (2) A "Kolluk", 102/5 yüzünden ikinci doğru olabilir. | İki çürütücü de reddetti. 102/6 yetkili makamı kendisi sayıyor: "Genel Müdürlük veya valilikler tarafından". Bu bir özel hüküm. Aynı KHK (694 md 171) 102/5'e Genel Müdürlüğü eklerken 102/6'yı da getirdi; 102/5 102/6'yı kapsasaydı bu sayım anlamsız kalırdı. 5326 md 22/1 karar yetkisini kanunda "açıkça gösterilen" makama veriyor. Uygulama da 102/6'yı valiliğe bağlıyor. Kalan risk 102/5'in "bu maddedeki" lafzı; çürütücülerin ikisi de bunu iki doğru eşiğinde görmedi. |
| (3) Anahtar "Vali", metin "valilikler" diyor. | Reddedildi. Valiliğin makamı validir. Genel Müdürlük (bugün Başkanlık) şıklarda yok. |
| (4) C "Göç İdaresi il müdürü" de savunulabilir. | Reddedildi. İl müdürü kanunda sayılmıyor; ancak yetki devriyle imza atar. |
| (5) Açıklama metne aykırı. | İki çürütücü de doğruladı. Açıklama genel cezaları yalnız kolluğa, 102/6'yı yalnız valiye veriyor; 102/5'teki üç makamı ve 102/6'daki Genel Müdürlüğü yok sayıyor. Bu ayrımı "sınav tuzağı" diye öğretiyor, ama metinde yok. |

**Karar.** Soru kalır, açıklama baştan yazılır. Önerilen yeni açıklama:

> 102 nci maddenin beşinci fıkrasına göre maddedeki idari para cezalarını valilik, Genel Müdürlük (bugün Göç İdaresi Başkanlığı) ya da kolluk birimleri uygular. Altıncı fıkra ise Bakanlıkça bu Kanun kapsamında yürürlüğe konulan düzenlemelerde belirtilen yükümlülüklere uymayanlara verilecek ceza için yetkili makamları kendisi sayar: Genel Müdürlük veya valilikler. Kolluk bu sayımda yer almaz; Göç İdaresi il müdürü de fıkrada sayılan bir makam değildir. Seçeneklerde bu iki makamdan yalnız valilik (vali) yer aldığından doğru cevap validir. Fıkradaki "düzensiz göçü önlemek maksadıyla" kaydı 2019'da 7196 sayılı Kanunla kaldırılmış ve fıkraya "bu Kanun kapsamında" ibaresi eklenmiştir; fıkra artık bu amaçla sınırlı değildir.

Denetçi (ikinci tur): kök ONAY (karar kullanıcıda), açıklama ONAY. Son cümle eski kökle de yeni kökle de doğru. Yukarıdaki metin denetçinin "makamları kendisi sayar" ve dipnot [30] lafzı önerileriyle son hâlidir.

**Kök düzeltmesi önerisi (kullanıcı kararı).** «düzensiz göçü önlemek amacıyla Bakanlıkça belirlenen yükümlülüklere uymayanlara» → «Bakanlıkça bu Kanun kapsamında yürürlüğe konulan düzenlemelerde belirtilen yükümlülüklere uymayanlara». Kanunun çıkardığı bir kaydı kaldırır; ölçülen şey ve cevap değişmez. Ad/unvan/terim istisnasının dışında, ama aynı mantıkta. Kök değişmezse yeni açıklamanın son cümlesi eski ibareyi açıklar.

### bff6766d — 6458 md 102/2, apart işletmecisi (doğru: B "kabahat; kolluk İPC verir")

**Analist iddiaları ve sonuçları:**

| İddia | Sonuç |
|---|---|
| (1) "Ücret karşılığı barınma" vakası TCK 79/1-a ile iki okumalı; bu okumayla A savunulabilir. | Bölündü. |
| (2) Açıklamadaki "suç hükümleri saklıdır; ancak idarî boyut m.102'de düzenlenmiştir" cümlesi, 102/2'nin "kanunlarda ayrıca suç olarak tanımlanmayan eylemler" kaydıyla ve 5326 md 15/3 ile çelişiyor: suç ile kabahat birlikte uygulanmaz. | İki çürütücü de doğruladı. |
| (3) Açıklama makamı 102/2'ye bağlıyor (doğrusu 102/5) ve üç makamdan yalnız kolluğu sayıyor. Tekerrürde "gerçek kişiler" kaydı yok. | Doğrulandı; eksik ama B için yanlış değil, çünkü kolluk yetkili makamlardan biri. |
| (4) A ve C'de "yalnızca", E'de "tek yaptırım" geçiyor; kökte madde numarası var. | Biçimsel. |

İddia (1)'de iki çürütücünün görüşü:
- **Savcı (çekilmeli, orta güven):** Yargıtay CGK'nin 22/11/2023 tarihli, E.2020/270, K.2023/620 sayılı kararının gerekçesinde, doktrine atıfla şu örnek var: "ev sahibi evini rayiç bedelden kaçak olduklarını bildiği göçmenlere kiraya vermiş olsa … suç işlenmiş kabul edilecektir". Yargıtay 4. CD'nin 2020/7843 E. sayılı kararı da aynı yönde. Kök failin bilip bilmediğini söylemiyor; bildiyse A, bilmediyse B doğru.
- **Savunucu (soru kalabilir, orta güven):** Kökte "bilme" unsuru yok ve suç varsayılamaz. 7196 2019'da "kiralayanlar"ı bilinçli olarak 102/2'ye ekledi; ücretli barındırma kendiliğinden suç olsaydı bu ibare boşa düşerdi. Kök çerçeveyi 102 olarak kuruyor. A'nın mutlak hükmü ("yalnızca", "idarî yaptırım uygulanamaz") de bu kökle kurulamaz.

**Denetçi (ikinci tur): ilk açıklama önerisine RED.** Gerekçeler:
- Öneri, fiil suçsa "idarî para cezası verilmez" diyerek A'nın içeriğini neredeyse aynen kuruyordu. Bu mutlaklığı 5326 md 15/3'e de yüklüyordu; oysa 15/3'ün ikinci cümlesi istisna içerir.
- Eksik unsur olarak yalnız "bilme"yi gösteriyordu. Bu, TCK 79'un öteki unsurlarının kökte bulunduğunu zımnen kabul etmek demek: "ücret karşılığı" maddi menfaati karşılıyor.
- Denetçinin hükmü: **açıklama soruyu kurtarmıyor.** Ayırıcı olgu (failin kastı) kökte yok. Kimlik kaydı yükümlülüğü (1774 md 2) ve Yargıtay CGK gerekçesi, failin bildiği okumasını kolaylaştırıyor.
- Tek kurtarma yolu kökte failin bilgi durumunu belirtmek; bu da "kök değişmez" ölçütünün dışında.

**Karar.**
- İlke gereği (1-1) soru kendiliğinden çekilmez.
- Önerim çekmek. Gerekçe: bölünmüş çürütücüler ve açıklamanın soruyu kurtaramaması. Çekme kararı kullanıcınındır.
- Soru tutulursa denetçinin birebir açıklama önerisi uygulanır:

> 6458 sayılı Kanun m.102/2, geçerli belgesi olmayan yabancıların ülkeye girmesine, ülkeden çıkarılmasına, ülke içinde seyahat etmesine, barınmasına ya da konaklamasına imkân sağlayan kişilere ve mülkiyetindeki gayrimenkulü kiralayanlara, tespit edilen her bir yabancı sayısınca idarî para cezası öngörür. Bu cezayı valilik, Genel Müdürlük (bugün Göç İdaresi Başkanlığı) ya da kolluk birimleri uygular ve ceza tebliğ tarihinden itibaren otuz gün içinde ödenir (m.102/5); bir takvim yılı içinde gerçek kişiler tarafından tekrarında ceza yarı oranında artırılır (m.102/3). Hüküm yalnız kanunlarda ayrıca suç olarak tanımlanmayan eylemlere uygulanır. TCK m.79/1-a, maddi menfaat elde etmek maksadıyla, yasal olmayan yollardan bir yabancının ülkede kalmasına imkân sağlayanı cezalandırır; suçun oluşması kastın, yani unsurların bilerek ve istenerek gerçekleştirilmesinin varlığına bağlıdır (TCK m.21). Fiil bu suçu oluşturuyorsa m.102/2 uygulanmaz ve sadece suçtan dolayı yaptırım uygulanabilir (Kabahatler Kanunu m.15/3). Kök, failin yabancıların ülkede kanunsuz bulunduğunu bildiğine ya da bunu öngördüğüne dair bir olgu içermez; bu olgu olmadan suç kurulamaz ve fiili yalnızca suç sayan önerme, kökte olmayan bu olguyu varsayar. Kabahat taksirle de işlenebildiğinden (Kabahatler Kanunu m.9/1), kökte tespit edilen olgu m.102/2'deki kabahate uyar.

### 1eb06eb0 — 6458 md 102/3, tekerrür (doğru: B "yarı oranında artırılır")

**İddia.** Kök ve açıklamada, 7196'nın 2019'da eklediği "gerçek kişiler tarafından" kaydı yok (dipnot [29]).

**Bulgu.**
- B yine tek doğru. A ("tekerrür hükmü yoktur") yanlış; C, D ve E'nin dayanağı yok. Kayıt eksikliği başka bir şıkkı doğru yapmıyor.
- Ama kök ve açıklama kuralı tüzel kişilere de genişletiyor. Tüzel kişi ihtimali şu fiillerde var: 102/1-d'de taşıyıcı, 102/2'de kiralayan, 102/6'da yükümlülüğe uymayan.
- Açıklamadaki karşılaştırmalar doğru:
  - 5326 md 42/A(3): "bir yıl içinde tekrarı halinde idari para cezası iki katı";
  - 1774 Ek md 1: "en son kesilen para cezasının iki katı".

**Karar.**
- Soru kalır.
- Açıklamaya kayıt eklenir: «fiillerin bir takvim yılı içinde tekrarı hâlinde» → «fiillerin bir takvim yılı içinde gerçek kişiler tarafından tekrarı hâlinde».
- Kök için aynı ekleme önerilir (kullanıcı kararı; istisna dışı ama aynı mantıkta): «bir takvim yılı içinde tekrarı hâlinde» → «bir takvim yılı içinde gerçek kişiler tarafından tekrarı hâlinde».
- Denetçi onayı: iki değişiklik de ONAY; doğru cevap ve ölçülen şey değişmiyor.

### 5e57ed04 — 5326, tekerrür rejimleri karşılaştırması (yanlış olan: E)

**İddia.** B şıkkında ("6458 m.102 – takvim yılı içinde tekrarda yarı oranında artırılır") "gerçek kişiler" kaydı yok.

**Bulgu.** Eksik kayıt B'yi ikinci bir "yanlış" eşleştirme yapmıyor; rejimin özü (oran ve dönem) doğru. Öteki şıklar resmî metinle doğrulandı:

| Şık | Dayanak | Sonuç |
|---|---|---|
| A | 5326 md 42/A(3), iki katı | doğru eşleştirme |
| C | 1774 Ek md 1 (7565 ile değişik cümle) | doğru eşleştirme |
| D | 4207 md 5/16, "bir kat; ikinci tekerrürü hâlinde iki kat" | doğru eşleştirme |
| E | 5326 md 34'te tekerrür hükmü yok | yanlış; anahtar doğru |

**Açıklama kusuru.** "Diğer eşleştirmeler doğrudur ve 2026 uygulama tablosunda kabahat kabahat işlenmiştir". Bu cümle üretim kaynağını, yani panel etiketindeki tabloyu, hem gerekçe gösteriyor hem kullanıcıya açıyor. Kaynak etiketi kuralına aykırı.

**Karar.** Soru kalır; B şıkkına dokunulmaz (şık değiştirmek yasak; eksik bildirilir). Açıklama: «Diğer eşleştirmeler doğrudur ve 2026 uygulama tablosunda kabahat kabahat işlenmiştir: 42/A'da iki kat, 6458'de yarı oranında,» → «Diğer eşleştirmeler doğrudur: 42/A'da iki kat, 6458'de gerçek kişilerin tekrarında yarı oranında,». Denetçi ONAY.

## Uygulama planı

Kullanıcı onayı alındı; uygulandı (aşağıdaki "Uygulama" bölümü). Düzeltmeler mevcut araçla yapıldı:
- **Açıklama ve kök:** `apps/api/scripts/sik-metni-guncelle.ts`, `<sürüm> ACIKLAMA|KOK <eski> <yeni>`, `GEREKCE=… APPLY=1` ile. Her ibarenin tek geçtiği yerel dökümde doğrulandı. Eski ve yeni metin `docs/32-yayin-denetimi/sik-guncelleme.jsonl` defterine düşer; kök değişince `contentHash` yeniden hesaplanır.
- **Toplu yürütme:** birebir metinler scratchpad'de `banka-kusur/degisiklikler.json` (7 değişiklik) ve `banka-kusur/degisiklik-bff-kalirsa.json`. Yürütücü `banka-kusur/uygula.py`: `--yaz` olmadan kuru çalışır, `--kok-yok` kök değişikliklerini atlar.
- **bff6766d çekilirse:** `apps/api/scripts/soru-arsivle.ts`'in `A` listesine sürüm öneki `f8dcf576` ile, sınıfı `bozuk` olarak girilir. Önce kuru çalıştırma, sonra `--yaz`. Defter: `docs/32-yayin-denetimi/ilerleme.jsonl`.
  - `arsiv-yedek.json` her `--yaz`'da üzerine yazılır; önce kopyalanır.
  - Koşu bitince kayıt listeden silinir.

| Soru | Değişiklik | Durum |
|---|---|---|
| fde12df0 | açıklama, iki yer | iki çürütücü ve denetçi ONAY |
| 068897c3 | açıklama baştan | iki çürütücü ve denetçi ONAY |
| 068897c3 | kök: kanunla çıkarılan ibare | denetçi ONAY; istisna dışı, kullanıcı kararı |
| 1eb06eb0 | açıklama: "gerçek kişiler tarafından" | savcı ve denetçi ONAY |
| 1eb06eb0 | kök: "gerçek kişiler tarafından" | denetçi ONAY; istisna dışı, kullanıcı kararı |
| 5e57ed04 | açıklama: tablo atfı çıkar, kayıt eklenir | denetçi ONAY |
| bff6766d | çek (öneri) ya da açıklama baştan | çürütücüler 1-1; denetçi: açıklama kurtarmıyor |
| 90abc862 | — | kusursuz |

## Uygulama (23 Kas 2026)

Kullanıcı onayı: "Evet, uygula". Uygulanan değişiklikler:
- **Metin düzeltmeleri.** `sik-metni-guncelle.ts` ile 7 değişiklik yapıldı, önce kuru çalıştırıldı. İz `docs/32-yayin-denetimi/sik-guncelleme.jsonl`'a 7 satır olarak düştü.
  - fde12df0: açıklamada iki yer.
  - 068897c3: kök ve açıklama.
  - 1eb06eb0: kök ve açıklama.
  - 5e57ed04: açıklama.
- **bff6766d yayından çekildi.** `soru-arsivle.ts`'in `A` listesine sürüm öneki `f8dcf576` ile `bozuk` sınıfında girildi. Önce kuru çalıştırıldı (plan 1/11; eski on kayıt zaten arşivde olduğu için atlandı), sonra `--yaz`.
  - Defter: `docs/32-yayin-denetimi/ilerleme.jsonl` (+1).
  - Yedek: `arsiv-yedek.json`. Önceki 6 kayıt korunarak birleştirildi (+1).
  - Koşu bitince kayıt listeden silindi; betik değişmedi.
- **Veritabanı doğrulaması (salt okunur).**
  - Dört soru yayında ve güncel sürümde. Kök ve açıklama beklenen metinle birebir aynı. Şıklar ve doğru cevap değişmedi. Kökü değişen ikisinde `contentHash` yeni köke göre güncel.
  - bff6766d: sürüm `archived`, soru soft-delete, `currentVersionId` null. Hiçbir denemede kullanılmamıştı.
  - 90abc862'ye dokunulmadı.
