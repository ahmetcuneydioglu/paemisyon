# PVSK ikinci dalga: kalan yuvaların analizi (2559)

Doc 39, 23 Kas 2026. Bu rapor soru yazmaz; yalnız yuva arar. Kaynaklar:
- `mevzuat/2559.txt` (42 başlık), `mevzuat/2559-mevcut-sorular.txt` (117 soru; 23 Kas'ta tazelendi), `2559-diger-konu-sorulari.txt` (1);
- `aday/2559-p1.json`, `-p2.json`, `-p3.json` (28 aday) ve `denetim/2559-p*-karar.json`; `rapor/durum.md` (3. dalga; Arama Yön. md 27 incelemesi);
- `analiz/resmi-polis-mevzuati.txt` ([4]–[19]: 16 resmî PVSK sorusu), `analiz/rapor-polis-mevzuati.md`, `analiz/rapor-kvkk-bekci-1481.md` (7245 ↔ PVSK eşlemesi);
- komşu tabanlar: `arama-mevcut-sorular.txt` (57) ve `arama.txt`, `yakalama-mevcut-sorular.txt` (39), `2911-` (103), `3201-` (126), `6136-` (34), `5326-` (87), `adli-kolluk-` (4), `1481-` (1), `7245-mevcut-sorular.txt` (0) ve `7245-cakisma-sorulari.txt`, `teknik-takip-` (0); `aday/arama-p1/p2`, `yakalama-p1/p2`, `7245-p1`, `adli-kolluk-p1`, `1481-p1`, `5326-p1/p2`.

Resmî metin mevzuat.gov.tr'den 23 Kas 2026'da indirildi (`MevzuatNo=2559, MevzuatTur=1, MevzuatTertip=3`). Dosyalar:
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/pvsk/indirilen/iframe-3.html` (ham),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/pvsk/cikti/resmi-3.txt` (düz metin),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/pvsk/cikti/karsilastirma.txt` (betik çıktısı),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/pvsk/betik/karsilastir.py` (betik).
Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **⚑ metinde yok**: metin dışı hukuk bilgisi. **[K→K]** koşul → kural. Fıkra numaraları (4/A/6, 9/8, Ek 6/9 …) bu raporun sayımıdır; metinde yazmaz, köke yazılmaz. "Bankada n" = `2559-mevcut-sorular.txt`'teki soru sayısı.

## 0. Özet ve dürüst değerlendirme

| Kanun | Resmî doğrudan soru | PAEM / Misyon / Kaymakamlık | Bankada | Önceki türetim (11 Kas) | Asıl çakışma tabanı |
|---|---|---|---|---|---|
| 2559 | **16** | PAEM 8: 2 · PAEM 9: 3 · PAEM 10: 1 · EGM Misyon 2023: 4 · Misyon 2020: 3 · JGK 2023: 1 · Kaymakamlık 2022: 1 (iki kopya) | **117** (110 madde etiketli, 7 etiketsiz) | 28 aday → 24 KABUL; 3'ü uzunluk nedeniyle çekildi (21 bankada); 4 RED | Arama Yön. md 19–27; Yakalama Yön. md 5–9; 5326 md 40; 7245 md 7–9; 1481; 2911 |

- **Banka gerçekten dolu.** 42 başlığın 31'inde soru var. Soru taşımayan 11 başlık: mülga 3 (md 3, 18, Ek 8), biçimsel 5 (md 26, 27, 28, Geçici 1, Geçici 2), eski dilli md 21 ve md 23, RED almış Ek 10. Ölçülmemiş *madde* kalmadı; kalan yalnız fıkra içi yönlerdir.
- **Fıkra düzeyinde tarama: ölçülmemiş yön taşıyan 25 hüküm bulundu** (§3). 15'i düşük değerli, varsayılan cevaplı ya da banka kökünden çözülür; 3'ü iptal bölgesinde ya da iki okumalıdır (4/A/6, 9/4-ç, 2/2 ↔ 2/3); 7'si yuva listesine girdi.
- **Kestirmesiz kurulabileceğini düşündüğüm yuva: 1** (§7 #1, 13/A'nın "kullanım ölçütü"). **Çekinceli asıl: 1** (#2, 4/A'nın "nüfusa kayıtlı olmayan" fıkrası). **Yedek: 5**, hepsi çekinceli.
- **Önerilen tavan: 2; en çok 3. Beklenen KABUL: 0–2.** Parti boş kapanırsa bu, bankanın doluluğunun doğal sonucudur. İki asıl yuvanın ikisi de 11 Kas'ta üç gözcüden KABUL almış, yalnız **uzun öncüllü biçim** yüzünden kuyruktan çekilmiş soruların (2559-p2-04, 2559-p1-03) çekirdeğidir; dördüncü gözcüden (kör çözüm) hiç geçmediler.
- **En güçlü görünen iki tuzak kullanılamıyor.** (a) "Mülki amirin önleme araması emri hâkim onayına sunulur mu?" ayrımı PAEM'e çok uygundur, ama Anayasa md 20'nin lafzı nedeniyle iki okumalıdır (§6). (b) 4/A'nın "bagajı açtırma" yarısı AYM iptal bölgesindedir, ayrıca 7245-p1-01 ve bankadaki elbise vakasıyla aynadır.
- **Metin:** resmî metne erişildi; 42 başlığın 34'ü sözcük sözcük aynı, 8'inde fark var. Farkların 6'sı zararsız (bir sonraki maddenin başlığı), **2'si gerçek**: md 12'nin üçüncü fıkrası banka dosyasında yok; md 16'nın gövdesine 13 numaralı dipnot karışmış.
- **Ters ayırt etme riski** (§8 kural 4). Bilmeyen adayı doğruya götüren sezgiler:
  - "en ağır/en acil işlem için en esnek usul" (13/A sözlü emir);
  - "eşik yükseldikçe işlem ağırlaşır" (makul sebep → yeterli şüphe → kuvvetli iz);
  - "branş dışı polis yetkili birime devreder" (Ek 4);
  - "sonuç, kararı verene bildirilir" (9/8);
  - "çocuk için en koruyucu şık" (md 12);
  - "kimliği belli olmayan kişinin kaydı alınır" (4/A/11).

**Yuva özeti**

| # | Hüküm | Durum | Tek cümleyle |
|---|---|---|---|
| 1 | 13/A, birinci fıkra (kapsam) | ASIL | Tedbir kimin hesabına/iletişimine uygulanır: çocuğa ait ya da başkasına ait olup çocuğun kullandığı |
| 2 | 4/A/11 (↔ 4/A/9, 4/A/12, md 5/1) | ASIL, çekinceli | Nüfusa kayıtlı olmadığı için kimliği tespit edilemeyen kişi: önce nüfus kaydı, sonra md 5'e göre fotoğraf ve parmak izi |
| Y1 | 9/8 | YEDEK | Önleme aramasının sonucu, kararı veya emri veren merci ya da makama tutanakla bildirilir |
| Y2 | Ek 4/1 | YEDEK | Branşı dışında suça el koyan polis sanık ve delilleri yetkili zabıtaya teslim eder |
| Y3 | 12/2 | YEDEK | Giriş yasağı içkili yerle sınırlı değil: kıraathane ve oyun oynatılan yerler |
| Y4 | 13/A (emrin biçimi) | YEDEK | Mülki idare amirinin emri sonradan yazılı hâle getirilmek üzere sözlü de olabilir |
| Y5 | 13/1-A | YEDEK (zayıf) | Suçüstü ve gecikmesinde sakınca hâlinde yakalama eşiği: kuvvetli iz, eser, emare veya delil |

---

## Metnin durumu (BAĞLAYICI)

### Resmî metne erişim ve karşılaştırma

- **Erişildi.** Konsolide metin, değişiklik tablosu ve 24 dipnot indirildi (151 KB).
- Resmî metin 43 başlık (40 madde ve ek madde + "işlenemeyen hükümler" altında 3 geçici madde); banka 42 başlık. Resmî sayfadaki 5397 sayılı Kanunun Geçici 1'i ile 5453 sayılı Kanunun Geçici 2'si aynı cümledir; bankada bir kez (Geçici 2) durur. Eksik değildir.
- Betik sözcük dizilerini karşılaştırdı (dipnot işaretleri, noktalama, şapka ve satır sonu bölünmeleri süzüldü). **34 başlık aynı, 8 başlık farklı.**

| Başlık | Fark | Değerlendirme |
|---|---|---|
| md 4, 4/A, 8, 13, 15, Ek 5 | Resmî metnin sonunda bir sonraki maddenin başlığı var ("Durdurma ve kimlik sorma", "Parmak izi ve fotoğrafların kayda alınması", "Önleme araması", "Kayıp çocukların araştırılması", "Zor ve silah kullanma", "Adli görev ve yetkiler") | Zararsız. Banka metninde madde başlığı hiç yok |
| **md 12** | Resmî üçüncü fıkra bankada **yok**: "Bu madde hükümlerine aykırı hareket edenler hakkında 17 nci, işyerleri hakkında da 6 ncı madde hükümlerine göre işlem yapılır." (dipnot [10]: 5259 ile "8 inci" → "6 ncı") | **Gerçek eksik** (dosyada). `durum.md` 11 Kas kaydı aynı fıkranın sonundaki dipnot artığından ("işlem yapılır.10") söz eder ve maddenin veritabanında resmî metinden tazelendiğini yazar. `2559.txt` 11 Kas 06:17 tarihlidir; tazelemeden önce ya da kırpan bir çıkarımla üretilmiş olabilir. Veritabanındaki güncel hâl **doğrulanamadı** (bu turda veritabanına bakılmadı) |
| **md 16** | Bankada 16/3-b'nin sonunda "araçlarını,13" ve sekizinci fıkranın ortasında dipnot metni: "13 27/3/2015 tarihli ve 6638 sayılı Kanunun 4 üncü maddesiyle, bu bentte yer alan “basınçlı” ibaresinden sonra gelmek üzere “ve/veya boyalı” ibaresi eklenmiştir." | **Dipnot artığı**; sekizinci fıkranın cümlesini ikiye böler. Hüküm içeriği etkilenmez. Veritabanındaki hâl **doğrulanamadı** |

- Kalan 34 başlıkta tek sözcük fark yok. 4/A/6'daki "(…)" iptal boşluğu, md 15/2 ve Ek 6/18 iptal şerhleri, md 20'deki "(...)" iki metinde aynıdır.

### Değişiklik ve AYM kayıtları (resmî tablo ve dipnotlar)

| Hüküm | Resmî şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| **4/A/6, üçüncü cümle** | Dipnot [8]: AYM 4/5/2017, E. 2015/41, K. 2017/98. "Kişinin üstü ve eşyası ile aracının dışarıdan bakıldığında içerisi görünmeyen bölümlerinin aranması; … mülki amirin görevlendireceği kolluk amirinin yazılı, acele hâllerde sonradan yazıyla teyit edilmek üzere sözlü emriyle yapılabilir" bölümü iptal; yürürlük 3/2/2018 | "Ancak, el ile dıştan kontrol hariç, (…) Kolluk amirinin kararı yirmi dört saat içinde görevli hâkimin onayına sunulur. Bu fıkra kapsamında yapılan araç aramalarına ilişkin olarak kişiye … belge verilir." Son iki cümle iptal edilen yetkiye bağlıdır; askıda kalmıştır | **KULLANILMAZ.** 4/A/6'nın 6638 ile eklenen cümlelerinin hiçbiri (el ile dıştan kontrol, kolluk amirinin kararı, yirmi dört saat, araç araması belgesi) doğru şık, çeldirici ya da açıklama dayanağı olmaz. "Kolluk amirinin emriyle arama" hiçbir biçimde yazılmaz |
| 4/A/6, ilk iki cümle | 5681 (2007) metni; dipnot [9] | Yürürlükte: yeterli şüphe → tedbir; elbise çıkarma ve aracın görünmeyen bölümlerini açtırma **istenemez** | Bankada (elbise vakası) ve 7245-p1-01'de (torpido gözü). Yeni yuva açılmaz (§6) |
| md 15/2 | AYM 26/11/1986, E. 1985/8, K. 1986/27: fıkra iptal | Yalnız şerh | KULLANILMAZ |
| md 20/3 | Dipnot [16]: AYM 25/4/1974, E. 1973/41, K. 1974/13: "(B) bendinde … kurumun yetkilileri teşebbüsten haberdar edilir" cümlesi iptal | "talep derhal yerine getirilir, (...)" | "Kurum yetkililerine haber verilir" önermesi ne doğru ne yanlış önerme olur |
| Ek 6/18 | AYM 19/2/2020, E. 2018/91, K. 2020/10: fıkra iptal; yürürlük 30/4/2020 | Yalnız şerh | KULLANILMAZ. İptal edilen fıkranın içeriği metinde yok; **doğrulanamadı**, yazılmaz |
| **Ek 7** | Resmî tabloda Ek 7 için **AYM kaydı yok.** Değişiklikler: 5397 (2005), 5651 (2007), 6638 (2015: 48 saat; Ankara ağır ceza mahkemesi üyesi; denetim fıkrası), KHK 671 → 6757 (2016), KHK 680 → 7072 (2017–2018: bilişim suçları, sanal ortam), KHK 700 (2018), **7590** (dipnot [23]: 24/7/2026; "Bilgi Teknolojileri ve İletişim Kurumu" → "Siber Güvenlik Başkanlığı"; yürürlük **31/7/2026**) | Banka metni günceldir ("Siber Güvenlik Başkanlığı bünyesinde tek bir merkezden"). Bankada 7590 şerhi yok, içerik doğru | Görev tanımında anılan "Ek 7'deki AYM iptalleri" resmî konsolide metinde ve tabloda **bulunamadı**; mevzuat.gov.tr'nin işlemediği bir karar olup olmadığı **doğrulanamadı**. Ek 7 ayrıca dolu (13 soru); yuva açılmaz |
| Ek 7/2 | "5271 sayılı Ceza Muhakemesi Kanununun, casusluk suçları hariç, 250 nci maddesinin birinci fıkrasının (a), (b) ve (c) bentleri" | CMK md 250 yürürlükte değildir (kaldırıldığı kanun ve tarih bu turda resmî kaynaktan **doğrulanmadı**); atıf resmî metinde aynen durur | Atfın içeriği ⚑; suç kataloğu sorulmaz. Bankadaki casusluk vakası lafza dayanır |
| Ek 7/9 | 6638 metni | "Başbakanlık Teftiş Kurulu tarafından da denetlenebilir" resmî metinde durur | Hiç yazılmaz |
| 13/A | KHK 680 (6/1/2017) → 7072 (8/3/2018) | Tabloda AYM kaydı yok | Kullanılır. "sulh ceza hâkiminin … emri" ile "mahkemenin onayı" arasındaki terim kayması resmî metindedir; onay mercii sorulmaz (bankada zaten var) |
| md 1, 2, 13/1-F, 26, Ek 7/12 | KHK 700 (9/7/2018): tüzük ve nizamname → Cumhurbaşkanlığı kararnamesi, yönetmelik | Güncel | — |
| md 13/1-H, 13 son paragraf | 6638 (2015): "başkalarının can güvenliğini tehlikeye düşürenler"; "koruma altına alır, uzaklaştırır ya da yakalar" | Güncel; ikisi de bankada | — |
| md 3, 18, Ek 8; md 17/2–5; Ek 2/1; Ek 9/3; md 11 son fıkra | Mülga | Yalnız şerh | Yazılmaz |

- **2024–2026:** tablonun son satırı 7590'dır (31/7/2026). Resmî Gazete ayrıca taranmadı; daha yeni bir değişiklik olup olmadığı **doğrulanamadı**.

### Eski ve ölü atıflar (resmî metinde de böyle; hiçbiri doğru şık, çeldirici ya da açıklama dayanağı olmaz)

| Yer | İbare | Not |
|---|---|---|
| 4/A/12 | "5683 sayılı Yabancıların Türkiye'de İkamet ve Seyahatleri Hakkında Kanun" | Yabancılar mevzuatı 6458'e geçti; 5683'ün bugünkü durumu bu turda resmî kaynaktan doğrulanmadı. #2'de kanun numarası yazılmaz |
| md 6/1 | "beşyüzmilyon … birmilyar Türk Lirası" | Tutar sorulmaz |
| md 14 | "Ceza Kanununun 546 ncı maddesi" | Eski TCK; md 14 yalnız bankadaki soruyla kalır |
| md 19, 21, 22, 25, 28 | "Seyrüsefer Talimatnamesi", "Matbuat Kanunu", "Dahiliye Vekili", "bucak jandarma komutanları", "İcra Vekilleri Heyeti" | Tarihî dil |
| md 20/1 | "ağır cezalı bir suç" | Kavram eski; bankada üç soru var, yenisi açılmaz |
| Ek 3/B | "bu Kanunun 17 nci maddesinde belirtilen kimlik tesbiti" | md 17'nin o fıkraları 2007'de kaldırıldı; ölü atıf |
| Ek 9/1-A | "Memurin Muhakematı Hakkında Kanun" | Hiç yazılmaz (doğru şık olarak). Ek 9/1-B'deki "hazırlık soruşturması", "yardımcıları" da eski terimdir |
| Ek 6/1 | "bu maddede yazılı görevlerinin yanında" | — |

### Ad ve terim kuralı

| İbare | Yer | Kural |
|---|---|---|
| mülkî âmir (md 9) · mülki idare amiri (13/A) · mahallin en büyük mülkî amiri (md 8, Ek 1, Ek 3, Ek 5) · en büyük mülkiye amirleri (md 22) | — | Hükmün kendi terimi korunur; birbirinin yerine yazılmaz |
| sulh ceza hâkimi (md 9, 13/A) ↔ mahkeme (13/A onayı) ↔ Ankara ağır ceza mahkemesi üyesi (Ek 7) ↔ görevli hâkim (4/A artığı) | — | Dördü ayrı tutulur |
| zabıta (md 20, 24, Ek 4) | "yetkili zabıta" (Ek 4) | Terim korunur; "yetkili kolluk birimi" yalnız açıklamada |
| makul sebep (4/A, 9/2) ↔ yeterli şüphe (4/A/6) ↔ kuvvetli iz, eser, emare veya delil (13/1-A) ↔ kuvvetli şüphe sebebi (Ek 6/8) | — | Eşikler karıştırılmaz. Arama Yönetmeliği'nin "umma derecesinde makul şüphe"si PVSK sorusuna yazılmaz |
| tutulur (4/A/9) ↔ gözaltına alınır ↔ yakalar (md 13) ↔ koruma altına alır | — | Fiiller metindeki gibi |

---

## §1 Resmî sorular

16 resmî soru (`resmi-polis-mevzuati.txt` [4]–[19]); hepsi bankadadır.

| No | Sınav | Hüküm | Açı | Kök tipi |
|---|---|---|---|---|
| 4 | EGM Misyon 2023 (4 şık) | md 7/3: ruhsat öncesi kolluk görüşü | Ş | "doğrudur" |
| 5 | EGM Misyon 2023 (4 şık) | md 6/2: belediye encümeni | M | doğrudan |
| 6 | EGM Misyon 2023 (4 şık) | md 5/1: parmak izi listesi ("kimliğini ibraz etmeyenler" sayılmamıştır) | K | olumsuz liste |
| 7 | EGM Misyon 2023 (4 şık) | md 9/1: gecikmesinde sakınca → mülki amir | M | doğrudan |
| 8 | PAEM 8 (2024) | md 5/10: on yıl, seksen yıl | S | boşluk |
| 9 | PAEM 8 (2024) | md 9/5: önleme araması yapılamayan yer | İ | olumsuz liste |
| 10, 11 | Kaymakamlık 2022 (aynı soru, iki kopya) | Ek 1/1: kırk sekiz saat, kaymakamlık | S+M | vaka, bileşik |
| 12 | PAEM 9 (2025) | 4/A/9: kimliğini ispatlayamayan kişi | Sn | kısa vaka |
| 13 | PAEM 9 (2025) | 4/A/2: makul sebep | Ş | kısa vaka |
| 14 | PAEM 9 (2025) | 16/9: silahlı saldırıya maruz kalan polis | Ş | "doğrudur" |
| 15 | PAEM 10 (2026) | md 9/5: önleme araması yapılamayan yer | İ | olumsuz liste |
| 16 | Misyon 2020 (4 şık) | md 5/11: Adalet Bakanlığının görüşü | M | doğrudan |
| 17 | Misyon 2020 (4 şık) | md 8: otuz gün | S | doğrudan |
| 18 | Misyon 2020 (4 şık) | 4/A/6 artığı: yirmi dört saat | S | doğrudan |
| 19 | JGK 2023 (4 şık) | Ek 6: teşhis | K | "yanlıştır" |

**Çıkarım.**
- PAEM dört dönemin üçünde PVSK sordu (8., 9., 10.); toplam 6 soru. Sorulan maddeler: **md 5, md 9 (iki kez, aynı açı), 4/A (iki kez), md 16.** PAEM'in PVSK'dan aradığı şey sahadaki dört yetkidir: durdurma ve kimlik, önleme araması, zor ve silah, parmak izi.
- PAEM 9'un üç sorusu kısa, tek koşullu vakadır ve kanun adını bile anmaz; çeldiricileri zayıftır (`rapor-kvkk-bekci-1481.md` satır 334). Biçim alınır, çeldirici alınmaz.
- PAEM aynı hükmü iki dönem üst üste sordu (md 9/5). Bu, "komisyon PVSK'da dar bir çekirdeğe döner" demektir: yeni bir PAEM sorusunun en olası yeri 4/A, md 9, md 13 ve md 16'nın *henüz sorulmamış fıkrasıdır*. #2 (4/A/11) ve Y1 (9/8) bu gerekçeyle listededir.
- Misyon ve JGK soruları süre, merci ve liste ezberidir; bu kalıptan yeni yuva çıkmaz (hepsi dolu).

## §2 Bankada ölçülenler (yeniden sorulmaz)

117 soru. Harf dağılımı: A 36, B 31, C 16, D 17, E 17. Dört şıklı 8 soru var; sekizi de dört şıklı resmî sınavlardan ([4]–[7], [16]–[19]).

| md | Soru | Ölçülen yönler | Ölçülmemiş kalan |
|---|---:|---|---|
| 1 | 1 | görev listesi (sayılmayan: infaz) | — |
| 2 | 4 | iki kısım; kanuna aykırı emir zinciri (yanlıştır); sözlü emrin sonucu; sözlü emir hâlleri (sayılmayan: önleme araması) | 2/2 ↔ 2/3 ilişkisi (iki okumalı) |
| 4 | 1 | başka işte kullanılamaz | — (7245 md 11 aynası) |
| 4/A | 8 + 2 etiketsiz (PAEM 9) | amaçlar; makul sebep (2); süreklilik ve keyfilik vakası; süre; elbise vakası; yirmi dört saat (artık); belge gösterip kimlik sorma; kimliği belirlenemeyen (2); belge talep hâlinde | 4/A/5 (ayrılma); 4/A/7 (saklı hükümler); **4/A/11**; 4/A/12 |
| 5 | 8 + 1 etiketsiz | liste (3); fotoğrafı alınanlar; sebep kaydedilmez; olay yeri izleri; kullanabilecekler; doğrudan bağlantı; gizlilik; silme süreleri (2); yönetmelik | 5/8 denetim güvenlik sistemi |
| 6 | 4 | encümenler (2); itiraz (yedi gün, idare mahkemesi, durdurmaz, kesin); tekrar; hâller | tutar (eski) |
| 7 | 4 + 1 etiketsiz | ruhsat mercii (2); kolluk görüşü; yedi gün, bir ay; izinsiz yer kapatılır; taşıma araçları; genel kolluk denetimi | 7/4 (RED); 7/6 ruhsat örneği |
| 8 | 4 | otuz gün (2); mülki amir; üç defa → iptal; lokal şartları | bent listesi (RED: md 6 sorusunun aynası) |
| 9 | 8 + 1 etiketsiz (PAEM 10) | yapılamayan yer (2); gecikmesinde merci (2); karar içeriği; var sayılan hâl; güvenliği sağlanan bina (emir aranmaz; kimlik sorulmaksızın); makam eşleştirmesi | 9/2 talep yazısı; 9/4-ç yükseköğretim; **9/8** |
| 10, 11, 12 | 1, 2, 2 | kama ve hançer; şikâyet olmasa da engelleme, evrak; giriş yasağı (veli); çalıştırma yasağı | **12/2'nin içkisiz yerleri**; 12/3 (dosyada yok) |
| 13 | 8 | bent listesi (2); üç işlem türü; yanlıştır (tedbir, sevk, teslim, serbest bırakma); sarhoş vakası; sebebin bildirilmesi; tabip raporu; yakınlara bildirim | 13/1-A'nın eşiği |
| 13/A | 2 | onay (derhal; yirmi dört saat); süre (bir ay + bir ay). Merci, makam eşleştirmesi sorusunda | **kapsam (kimin hesabı, kimin iletişimi)**; **emrin biçimi** |
| 14, 15 | 1, 1 | saat 24 ve istisna; ikamette ifade (şüpheli hariç) | — |
| 16 | 10 + 1 etiketsiz (PAEM 9) | maddî güç tanımı (2); kademe; ihtar; toplu kuvvette amir; meşru savunma; 2015 bendi; "dur" sırası; silahla saldırıya teşebbüs (2); direniş bitince zor (vaka) | 16/3-a "eşya üzerinde"; 16/7-c listesi |
| 17, 19 | 1, 1 | karakol ve adliye; sarhoş sürücüyü men | — |
| 20 | 3 | konuta girme hâlleri; acele hâlde dekan; kovuşturma için her zaman | 20/3 |
| 22, 24, 25 | 1, 1, 1 | İçişleri Bakanı; özel zabıta yoksa polis; jandarma | — |
| Ek 1 | 4 + 1 etiketsiz | kırk sekiz saat (3, ikisi aynı soru); kapsam ve bildirim içeriği; suç duyurusu | — |
| Ek 2, Ek 3 | 1, 2 | bütçe; yazılı istem ve mülki amirin izni; sayılmayan suç | — |
| Ek 4 | 2 | polise karşı suç; polisin işlediği suç (izinli trafik polisi vakası) | **4/1'in son işlemi: yetkili zabıtaya teslim** |
| Ek 5 | 1 | "yanlıştır" beş önermeyle maddeyi kapatır | "mülki amire karşı da sorumlu" |
| Ek 6 | 8 | teşhis (4 soru); sözlü ihbarın yazıya geçirilmesi; savcıya bildirim; olay yeri dışı → CMK; engelleyeni men | 6/5 kabahat; 6/7 |
| Ek 7 | 13 | hemen her fıkra | 7/6 ikinci cümle (RED); 7/8 |
| Ek 9 | 2 | savcı soruşturması; duruşmadan vareste, avukat ücreti, ödül, kimlik gizliliği | Ek 9/1-A (ölü atıf) |
| Ek 10 | 0 | — | RED (2559-p3-12) |

**Komşu adla ölçülmüş PVSK hükümleri (mükerrer sayılır).**

| PVSK hükmü | Komşu taban | Soru |
|---|---|---|
| 4/A/1–5 (durdurma) | Arama Yön. md 27 | eşik ("umma" derecesinde makul şüphe); cevap verme yükümlülüğü; yoklama biçiminde kontrol (2) |
| 4/A/6 ilk iki cümle | 7245 md 7 | 7245-p1-01 (el ile dıştan kontrol, torpido gözü, kolluk amirinin emri) |
| 4/A/9 | 5326 md 40; Yakalama Yön. md 5 | kimliği belirlenemeyen kişi: tutma, savcı, gözaltı, tutuklama (birebir aynı cümle) |
| md 9 | Arama Yön. md 19, 20, 25, 26 | yapılamayan yerler (3); karar içeriği; kararsız arama hâlleri (2); tutanak; sözlü icra emri |
| md 13/3, 13/4, 13/5 | Yakalama Yön. md 6, 8, 9 | sebebin bildirilmesi; yakına haber; hekim kontrolü |
| md 4 | 7245 md 11 | 7245-p1-06 (RED: PVSK md 4 çeldiricisiyle çakıştı) |
| md 16 | 7245 md 9; 1481 md 1–2 | 1481-p1-01, -02 |
| md 25 | 3201 | "diğer zabıta" sorusu |
| Ek 9/4 | 1481 md 3, Ek 1 | bankada PVSK adıyla |

**Önceki partilerde RED alanlar (yeniden önerilmez).**

| Aday | Hüküm | Gerekçe |
|---|---|---|
| 2559-p1-06 | 7/4: alan belirleme yetkisi | Ruhsat sorularının aynası (içeride belediye, dışarıda il özel idaresi) |
| 2559-p1-07 | md 8 bent listesi | Bankadaki md 6 "hâllerden biri değildir" sorusunun aynası; 8/F'de ikinci doğru |
| 2559-p3-09 | Ek 7/6: bilgi ve belge talebi | Çekirdek (hâkim kararı) bankada; kalan düz cümle, ikiz şık |
| 2559-p3-12 | Ek 10 | Personel sosyal destek hükmü; sınav değeri düşük |

**Uzunluk nedeniyle çekilenler (hükümleri RED değildir).** 2559-p1-03 (4/A/11–12 öncüllü), 2559-p2-02 (md 12 kıraathane vakası, dört öncül), 2559-p2-04 (13/A dört öncül). Üçü de 11 Kas'ta üç gözcüden KABUL aldı; kök 550 karakteri aştığı için kuyruktan çekildi. Bankada değiller (denetlendi: "kıraathane", "nüfusa kayıtlı", "sonradan yazılı" ibareleri `2559-mevcut-sorular.txt`'te geçmiyor). #1, #2, Y3 ve Y4 bu soruların kısa biçime indirgenebilen çekirdekleridir. Ayrım: o tarihte dördüncü gözcü (kör çözüm) yoktu; bu yuvalar o kapıdan ilk kez geçecek.

## §3 Madde madde değer tablosu

Yalnız ölçülmemiş yön taşıyan hükümler. "Vars.": bilmeyen adayın sezgisi doğruya (D), yanlışa (Y), iki yöne (—).

**Saha yetkileri (PAEM çekirdeği)**

| Hüküm | Ölçülmemiş yön | Değer | [K→K] | Vars. | Karar |
|---|---|---|---|---|---|
| 13/A, f.1 | K: tedbir çocuğa ait ya da **başkasına ait olmakla birlikte kayıp çocuk tarafından kullanılan** banka hesaplarının hareketlerini kapsar; denetlenen iletişim **çocuğun** iletişimidir | **Y** | evet (kimin hesabı → kapsam) | Y: "başkasının hesabına bakılamaz"; "kaçıranın telefonu dinlenir" | **#1** |
| 13/A, f.1 | Ş: emir "yazılı veya sonradan yazılı hale getirilmek üzere sözlü". PVSK'da gecikmesinde sakınca emri md 9 ve Ek 7'de yalnız yazılıdır | O | — | D: "en acil iş, en esnek usul" | Y4. İki seçenekli (yazılı ↔ sözlü de olur); karşılaştırmalı kök için beş gerçek seçenek yok (yalnız üç tedbir bu yapıdadır) |
| 4/A/11 | Sn: nüfusa kayıtlı olmadığı için kimliği tespit edilemeyen kişi: nüfus kaydının temini için işlemler yapıldıktan **sonra** md 5'e göre fotoğraf ve parmak izi | O/Y | evet (kimliğin belirlenememe sebebi → işlem) | —: "kaydı alınır" (D); "gözaltı sürer" ya da "yabancı gibi işlem" (Y) | **#2**, çekinceli |
| 4/A/12 | Sn: yabancı olduğu anlaşılırsa pasaport ve yabancılar mevzuatı | O | evet | D | Yazılmaz: ölü atıf (5683); 5682 ve 6458 bankalarıyla komşu. #2'de yalnız çeldirici |
| 4/A/5 | Sn: sebep kalkınca ayrılmaya izin | D | — | D | Yazılmaz |
| 4/A/6 | İ: aracın içi görünmeyen bölümlerini açtırma istenemez | Y | evet | Y | **Kullanılmaz**: iptal bölgesine bitişik; elbise vakasının ve 7245-p1-01'in aynası |
| 4/A/7 | K: başka kanunların durdurma hükümleri saklı | D | — | D | Yazılmaz |
| 9/8 | Sn: önleme aramasının sonucu, arama kararı veya emri veren merci veya makama bir tutanakla bildirilir | O | evet | D: "sonuç, kararı verene bildirilir" | Y1. En güçlü çeldirici ("hâkim onayına sunulur") kullanılamaz (§6) |
| 9/2 | Ş: talep yazısında makul sebeplerin gerekçeleriyle gösterilmesi | D/O | — | D | Yazılmaz: "makul sebep" 4/A'nın bankadaki cevabı; Arama Yön. md 20 sorusu komşu |
| 9/4-ç | Ş: yükseköğretim kurumlarının içinde önleme araması (idarecilerin talebi; 20/2-A koşulu) | O | — | — | **Kullanılmaz**: cümle iki okumalı (talep şartı hangi kuruma, "içinde" hangi kuruma bağlı) |
| 13/1-A | Ş: suçüstü ya da gecikmesinde sakınca + "kuvvetli iz, eser, emare veya delil" | O | — | D: "yakalama için en yüksek eşik" | Y5 (zayıf). Eşiklerin her biri bankada bir kökte ya da şıkta yazılı |
| 16/7-c ↔ 16/8 | A: "dur" çağrısı ve uyarı atışı yalnız (c) bendinde | Y | evet | D: "dur, kaçana denir" | Yazılmaz: bankadaki "dur" sırası sorusunun kökü bağı yazıyor (banka kökü sızıntısı) |
| 16/3-a | K: bedenî kuvvet "eşya üzerinde" de | D | — | — | Yazılmaz (sözcük ezberi) |
| Ek 4/1 | Sn: suça el koyan polis sanık ve delilleri tespit, muhafaza ve **yetkili zabıtaya teslim** eder | O/Y | evet (branş dışı → teslim) | D: "yetkili birime devreder"; eksik bilen "savcıya" der | Y2. Ek 6/4 ile ilişki iki okumalı (savcıya bildirim yükümlülüğü ayrıca doğar mı) |
| Ek 4/1 | Ş: "görevli bulunduğu mülki sınırlar içinde" | Y | evet | — | Yazılmaz: şart bankadaki iki sorunun kökünde yazılı; sınır dışındaki durum yokluktan yargıdır ⚑ |
| Ek 6/5 | Sn: bilgi kabahate ilişkinse "gerekli yasal işlem yapılır veya yapılması sağlanır" | O | evet | D (kapsayıcı şık) | Yazılmaz: doğru şık zararsız usul cümlesi; 5326 bankası dolu |
| Ek 6/7 | M: olay yeri incelemesi Cumhuriyet savcısının emriyle | D | — | D | Yazılmaz (varsayılan merci) |

**Umuma açık yerler ve genel hükümler**

| Hüküm | Ölçülmemiş yön | Değer | Vars. | Karar |
|---|---|---|---|---|
| 12/2 | K: giriş yasağı "içkili yerler **ile kıraathane ve oyun oynatılan benzeri yerler**" | O | D: "çocuk için en koruyucu sonuç"; eksik bilen "içkisiz yere veliyle girer" der | Y3. İki seçenekli sonuç (meneder ↔ girer) |
| 12/3 | Sn: aykırı davranan kişi → md 17; işyeri → md 6 | O | — | Yazılmaz: fıkra banka dosyasında yok; md 6'nın bankadaki sorusu "12 nci maddedeki yasaklar"ı şıkta taşıyor; madde numarası eşleştirmesi |
| 7/6 | Ş: ruhsatın bir örneği yetkili kolluğa gönderilir | D | D | Yazılmaz |
| 5/8 | K: kullanımın denetlenmesine imkân veren güvenlik sistemi | D | D | Yazılmaz |
| 20/3 | Sn: talep derhal yerine getirilir | D | D | Yazılmaz; iptal artığı |
| Ek 5/2 | Sn: ekipler mahallin en büyük mülki amirine karşı **da** sorumlu | D/O | D | Yazılmaz ("bilgi verme" bankada; 5607 19/2 komşusu) |
| Ek 7/8 | M: kararları yerine getirenler | D | — | Yazılmaz (kurum içi işleyiş) |
| 2/2 ↔ 2/3 | A: kanuna aykırı görülen emir, sayılan hâllerde sözlü verilmişse | Y | — | **Kullanılmaz**: iki okumalı (hangi fıkra önce gelir) |

**Kapsam dışı**

| Maddeler | Gerekçe |
|---|---|
| md 3, 18, Ek 8 | Mülga |
| md 21, 23, 26, 27, 28, Geçici 1–2 | Eski dil, yürürlük, yürütme, tarihî geçiş |
| md 6, 7, 8 | Dolu (13 soru); iki RED; tutarlar eski |
| md 5 | Dolu (9 soru) |
| md 14, 19, 22, 24, 25 | Tek satırlık hükümler; her biri bankada |
| Ek 2, Ek 3, Ek 5, Ek 9 | Bankada; ölü atıflar (Ek 3/B, Ek 9/1-A) |
| Ek 6 teşhis fıkraları | 4 soru; kalan önermeler bankadaki "yanlıştır" ve öncüllü sorularda geçiyor |
| Ek 7 | 13 soru; eski atıflar; bir RED |
| Ek 10 | RED |

## §4 Değer tablosu: PVSK'daki "karar – gecikmesinde sakınca emri – onay" düzenleri

Yuva seçimini ve çeldirici havuzunu bu tablo belirler. Koyu olmayan her hücre bankada ölçülmüştür.

| Tedbir | Olağan karar | Gecikmesinde sakınca | Emrin biçimi | Onay | Süre |
|---|---|---|---|---|---|
| Önleme araması (md 9) | sulh ceza hâkimi | mülkî âmir | yazılı | metinde yok (§6: sorulmaz) | kararda yazılır |
| Kayıp çocuk (13/A) | sulh ceza hâkimi | mülki idare amiri | **yazılı veya sonradan yazılı hâle getirilmek üzere sözlü** | derhal mahkeme; en geç yirmi dört saat | bir ay + bir ay |
| Önleme dinlemesi (Ek 7/2) | hâkim (Ankara ağır ceza mahkemesi üyesi) | Emniyet Genel Müdürü, İstihbarat Dairesi Başkanı; bilişimde ilgili daire başkanı | yazılı | yirmi dört saatte sunulur; kırk sekiz saatte karar | üç ay + 3 × üç ay; terörde müteaddit |
| Teknik araçlarla izleme (Ek 7/6) | hâkim | yok | — | — | — |
| Faaliyetten men (md 8) | mahallin en büyük mülkî amiri | — | — | — | otuz gün |
| Adresten ayrılmama (Ek 3) | polisin yazılı istemi | — | izin: mülki amirin yazılı emri | — | — |
| Durdurmada arama (4/A/6) | **iptal** | **iptal** | iptal | artık cümle (yirmi dört saat) | — |

## §5 Ayırt etme malzemesi

- **13/A'nın kapsamı ↔ Ek 7'nin kapsamı** [K→K]
  - Ek 7: hakkında tedbir uygulanacak **kişi** (kimliği kararda yazılır); amaç suçun önlenmesi.
  - 13/A: amaç kayıp çocuğun bulunması; ölçüt **kullanımdır**. Banka hesabı çocuğa ait olabilir ya da başkasına ait olup çocuk tarafından kullanılıyor olabilir. Denetlenen iletişim çocuğun iletişimidir.
  - Eksik aday iki yöne yanılır: "başkası adına kayıtlı hesap incelenemez" (dar) ya da "çocuğu son görenin, kaçırdığından şüphelenilenin iletişimi de denetlenir" (geniş).
- **Kimliği belirlenemeyen kişi: üç ayrı son** [K→K]
  - 4/A/9: belgesiz, açıklamadan kaçınan, yalan beyan → tutulur, savcı haberdar edilir, gözaltı, gerekirse tutuklama (bankada 2; 5326 md 40 ve Yakalama Yön. md 5 adıyla da).
  - 4/A/11: sebep **nüfusa kayıtlı olmamak** ise → nüfus kaydının temini, sonra md 5'e göre fotoğraf ve parmak izi.
  - 4/A/12: **yabancı** olduğu anlaşılırsa → pasaport ve yabancılar mevzuatı.
  - md 5/1 listesinde "kimliğini ibraz etmeyenler" yoktur (resmî [6]). 4/A/11 bu listeye başka bir kapıdan girer: md 5'e yollama.
- **Sonuç kime gider**
  - 9/8: önleme aramasının sonucu → kararı ya da emri veren merci, tutanakla.
  - Ek 6/4: suça el konulan olay → derhal Cumhuriyet savcısı (bankada).
  - Ek 4/1: branş dışı el koyma → yetkili zabıta.
  - Ek 5/2: merkez ekipleri → mahallin en büyük mülki amirine bilgi (bankada).
  - Ek 1/2: aykırı oyun → mülki amir Cumhuriyet savcılığına suç duyurusu (bankada).
- **Küçüklerin giremeyeceği yer ↔ çalıştırılamayacağı yer**
  - 12/1 (çalıştırma): eğlence, oyun, içki ve benzeri amaçlı, umuma açık ve açılması izne bağlı yerler; kanunî istisnalar saklı.
  - 12/2 (giriş): içkili yerler ile kıraathane ve oyun oynatılan benzeri yerler; veli ya da vasi yanında olsa bile.
  - md 7/1'in umuma açık yer listesi (otel, sinema, internet kafe …) daha geniştir; 12/2 bunların hepsini saymaz. "Sinema", "internet kafe", "elektronik oyun yeri" 12/2 bakımından iki okumalıdır.
- **Eşik basamakları:** makul sebep (durdurma) → yeterli şüphe (durdurulan kişide silah) → kuvvetli iz, eser, emare veya delil (yakalama, 13/1-A) → kuvvetli şüphe sebebi (olay yeri dışındaki konut; CMK araması). Dördü de bankada bir kökte ya da doğru şıkta yazılıdır; basamak sorusu elemeyle çözülür.

## §6 Kaçınılacaklar (BAĞLAYICI)

- **İptal ve artık metin**
  - 4/A/6'nın 6638 ile eklenen cümleleri: el ile dıştan kontrol istisnası, kolluk amirinin kararı, yirmi dört saat, araç araması belgesi. Hiçbir yerde.
  - Arama Yönetmeliği md 27'deki aynı cümle (yönetmelik metninde durur; kanunî dayanağı iptal). `durum.md` "Arama Yönetmeliği md 27 incelemesi" bağlayıcıdır.
  - md 15/2, md 20/3'ün iptal edilen cümlesi, Ek 6/18.
  - md 16'nın gövdesindeki dipnot satırı kanun metni değildir.
- **"Hâkim onayı" ekseni (iki okumalı; hiçbir soruda doğru ya da yanlış şık olmaz)**
  - md 9, mülki amirin önleme araması emri için onay öngörmez; 9/8 yalnız sonucun bildirilmesini düzenler.
  - Anayasa md 20 ve 21 ise "yetkili merciin kararı yirmidört saat içinde görevli hâkimin onayına sunulur" der ⚑ (Anayasa lafzı bu turda resmî kaynaktan yeniden okunmadı; analistin bilgisidir, mevzuat gözcüsü doğrular); bu cümlenin arama emrini mi yalnız el koymayı mı kapsadığı tartışmalıdır. Arama Yönetmeliği md 22 "el koyma söz konusuysa" kaydını taşır (bankada).
  - Sonuç: "önleme araması emri hâkim onayına sunulur" önermesi PVSK lafzına göre yanlış, Anayasa lafzına göre savunulabilir. **Y1'in en güçlü çeldiricisi bu yüzden yasaktır.**
- **Bankada ölçülmüş:** §2'nin bütün satırları. Değerleri açıklamada da içerikle yazılmaz: on ve seksen yıl; otuz gün; kırk sekiz saat (Ek 1); yirmi dört ve kırk sekiz saat (Ek 7); bir ay (13/A); üç ay; yedi gün; saat 24; mülki amir (md 9); belediye encümeni; Emniyet Genel Müdürü; Ankara ağır ceza mahkemesi üyesi; makul sebep.
- **RED almış hükümler:** 7/4; md 8 bent listesi; Ek 7/6 bilgi ve belge talebi; Ek 10.
- **Ayna:** 4/A/6 "bagaj" yarısı (elbise vakası; 7245-p1-01); md 4 (7245 md 11); 4/A/9 (5326 md 40; Yakalama Yön. md 5); 13/3–13/5 (Yakalama Yön. md 6, 8, 9); md 9 yer listesi (Arama Yön. md 19).
- **İki seçenekli ya da varsayılan cevaplı**
  - 12/2 "girer mi" biçimi; 13/A "emir sözlü olur mu" biçimi; Ek 4 "görevli memur sayılır mı" biçimi.
  - Cevabı mülki amir, Cumhuriyet savcısı ya da sulh ceza hâkimi olan her yeni merci sorusu (Ek 6/7, md 9/1, 13/A olağan karar).
- **İki okumalı**
  - 13/A: "başkasına ait … kullanılan" kaydı lafzen banka hesap hareketlerine bağlıdır; iletişim için "iletişimini" denir. "Annesi adına kayıtlı, çocuğun kullandığı hat" yorumla kapsamdadır, lafızla değil. #1'de başkasına ait unsur **banka hesabıyla** kurulur.
  - 13/A: "denetleyebilir" fiilinin dinlemeyi ve kayda almayı kapsayıp kapsamadığı; tedbir türü listesi sorulmaz.
  - 4/A/9 ↔ 4/A/11: nüfusa kayıtlı olmayan kişi, nüfus işlemleri sürerken tutulmaya devam eder mi. #2 "gözaltına son verilir" ya da "tutulmaya devam edilir" şıkkı taşımaz.
  - Ek 4/1 ↔ Ek 6/4: branş dışı polisin savcıya bildirim yükümlülüğü.
  - Ek 4/1: mülki sınır dışında karşılaşılan suç ⚑.
  - 9/4-ç; 2/2 ↔ 2/3; 12/2 bakımından sinema, internet kafe, elektronik oyun yeri.
  - 9/8 ↔ Arama Yön. md 26: yönetmelik tutanağı "suç unsuruna rastlandığında" arar; kanun sonucu her hâlde tutanakla bildirtir. Y1'de "tutanak" unsuru ölçülmez, yalnız muhatap ölçülür.
- **Sayı ve tarih:** süre, tutar, "2015'te eklenen bent" türü tarih soruları (bankada iki tane var; yenisi yazılmaz).
- **Metin dışı (⚑):** CMK md 90, 91, 119, 127, 135; Anayasa md 19–21; 5326 md 32, 35, 36, 40; 6458; 5490 (nüfus); Arama, Yakalama ve PVSK uygulama yönetmeliklerinin içeriği; iptal edilen fıkraların eski metni.

## §7 Parti önerisi: `2559-p4` (en çok 3; önerilen 2; beklenen KABUL 0–2)

Tek parti. Gerekçe: bankada ölçülmemiş *madde* yok; partinin tek dayanağı, 11 Kas'ta hukuken ve kalite yönünden kabul edilip yalnız biçim yüzünden bankaya girmemiş iki çekirdektir. Üretici her yuvayı yeniden sınar; yazmadığı yuvanın gerekçesini raporlar. **Boş parti başarısızlık değildir.** Parti 5 sorudan küçük olduğu için öncüllü (I-II-III) soru yazılmaz (1/5 sınırı). Kök "2559 sayılı PVSK'ya göre," ile açılır.

### Asıl

| # | Hüküm | Ölçülecek ayrım | Önerilen biçim | Yanlışa çeken alışkanlık / komşu hüküm | Risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | 13/A, birinci fıkra | Tedbirin kapsamını **kullanım** belirler: çocuğa ait ya da başkasına ait olup çocuğun kullandığı banka hesabı; çocuğun iletişimi ve sinyal bilgisi. Çocuğun kullanmadığı, üçüncü kişiye ait hesap ve iletişim 13/A'nın dışındadır [K→K] K, A | Olumsuz kök, kısa: kayıp çocuğun bulunması amacıyla 13/A'ya dayanılarak aşağıdakilerden hangisine başvurulamaz. Dört şık metindeki tedbirdir (çocuğa ait hesabın hareketleri; başkasına ait olup çocuğun kullandığı hesabın hareketleri; çocuğun telekomünikasyon yoluyla iletişiminin denetlenmesi; sinyal bilgilerinin değerlendirilmesi). Doğru şık: çocuğun kullanmadığı, üçüncü kişiye ait bir hesap ya da o kişinin kendi iletişimi | Bilmeyen aday "başkasına ait hesap incelenemez" diyerek metindeki tedbiri işaretler (lehte). Ek 7 alışkanlığı ("tedbir şüpheli kişiye uygulanır") ve "kaçıranın telefonu dinlenir" sağduyusu doğru şıkkı *kapsamda* gösterir (lehte) | (a) Doğru şık beş şıkta "çocuk kullanmıyor" diyen tek şıktır: tek farklı kategori kestirmesi; kör çözücü belirler. (b) Dayanak kapalı kapsam ifadesidir; mevzuat gözcüsü "yokluktan yargı" itirazını sınar (2559-p2-04'ün IV. önermesi aynı dayanakla kabul edilmişti). (c) Doğru şık "şüphelinin iletişimi" olursa CMK'daki adlî tedbir ⚑ akla gelir: kök "13/A'ya dayanılarak" kaydını taşır, açıklama CMK'yı anmaz. (d) "Başkasına ait" unsuru yalnız banka hesabıyla kurulur (§6). (e) Sinyal bilgisi ile iletişim denetimi iki ayrı şık olur; "aynı bendin iki yarısı" sayılıp sayılmayacağını gözcü tartar; gerekirse biri "banka hesap hareketlerinin talep edilmesi"nin iki türüne ayrılır | 13/A onay sorusu; 13/A süre sorusu; makam eşleştirmesi (C: mülki idare amiri). Hiçbiri kapsamı ölçmez |
| 2 | 4/A/11 (↔ 4/A/9, 4/A/12, md 5/1) — **çekinceli** | Kimliğin belirlenememe **sebebi** işlemi değiştirir: nüfusa kayıtlı olmayan kişide önce nüfus kaydının temini için işlem yapılır, sonra md 5'e göre fotoğraf ve parmak izi kayda alınır [K→K] Sn, A | Kısa vaka (PAEM 9 kalıbı, 1–2 cümle): kimliği belirlenemediği için tutulan kişinin nüfusa kayıtlı olmadığı anlaşılmıştır; kimlik tespiti bakımından yapılacak işlem. Doğru şık iki adımı sırasıyla taşır | 4/A/12: pasaport ve yabancılar mevzuatına göre işlem ("kaydı yok → yabancı"; en güçlü). md 5/1 alışkanlığı: "parmak izi alınacaklar arasında sayılmadığından alınamaz" (resmî [6]'nın öğrettiği). Sıra tersliği: önce parmak izi, sonra nüfus işlemi. 5326 md 40 alışkanlığı: idarî para cezası verilir, serbest bırakılır | (a) Doğru şık en kapsamlı ve en "makul" şıktır; sağduyu riski orta. (b) 4/A/9 ile ilişki iki okumalı: şıklarda gözaltı ve tutuklama geçmez; kök "kimlik tespiti bakımından" diyerek soruyu daraltır. (c) Çeldiricide kanun numarası (5683) yazılmaz. (d) Resmî [6] ile gerilim görüntüsü: açıklama md 5/1 listesini içerikle yazmaz, yalnız "4/A'nın yollamasıyla" der. (e) Sınav değeri 3–4: PAEM 9'un sorduğu fıkranın komşusu, ama tek cümlelik bir hüküm | 4/A "yanlıştır" sorusu; PAEM 9 [12]; md 5 liste soruları (3); 5326 md 40 |

### Yedek (değer sırasıyla; hepsi çekinceli)

| # | Hüküm | Ölçülecek ayrım | Biçim | Alışkanlık / komşu | Risk | En yakın soru |
|---|---|---|---|---|---|---|
| Y1 | 9/8 | Önleme aramasının sonucunun muhatabı: kararı ya da emri veren merci | Doğrudan kök; koşul "sulh ceza hâkiminin kararıyla yapılan önleme araması". Doğru: kararı veren hâkim | "Önleme araması idarî iştir, sonuç mülki amire gider" (polis adayının varsayılanı; burada yanlış). "Adlî iş, savcıya bildirilir" (Ek 6/4) | "Hâkim onayı" çeldiricisi yasak (§6). Kök koşulu cevabı yankılar ("hâkim kararı" → "kararı veren hâkim"); koşulsuz yazılırsa doğru şık en kapsayıcı şıktır. Gerçek seçenek üçtür (hâkim, mülki amir, savcı). Değer 3. #1 ve #2 düşerse denenir | Arama Yön. md 26 (tutanak); md 9 merci soruları |
| Y2 | Ek 4/1 | Branşı dışında suça el koyan polisin son işlemi: tespit, muhafaza ve yetkili zabıtaya teslim; soruşturmayı kendisi yürütmez | Kısa vaka (izinli ya da başka branştan polis, görevli olduğu mülki sınır içinde); "sanık ve delilleri ne yapar" | "Savcıya bildirir ve emri doğrultusunda soruşturmayı yapar" (Ek 6/4; bankadaki doğru şık). "Kendi birim amirine teslim eder" | "Yetkili birime devreder" sağduyusu doğruyu verir; "savcıya bildirir" şıkkı Ek 6/4 nedeniyle savunulabilir ikinci doğrudur. Bankadaki iki Ek 4 vakasıyla aynı denemeye düşmemeli | Ek 4 (2); Ek 6 savcıya bildirim |
| Y3 | 12/2 | Giriş yasağı içkiyle sınırlı değildir: kıraathane ve oyun oynatılan benzeri yerler | "Sayılmıştır" değil; kısa vaka: içki verilmeyen kıraathaneye babasıyla giren on yedi yaşındaki genç | "İçkisiz yere veliyle girilir" | İki seçenekli sonuç: tek "meneder" şıkkı doğru olur (23 Kas kural 1). Bankadaki "veli olsa bile" sorusunu bilen kıyasla çözer. Liste biçimi iki okumalı (sinema, internet kafe). 12/3 banka dosyasında yok | md 12 (2) |
| Y4 | 13/A (emrin biçimi) | Mülki idare amirinin emri sözlü de olabilir | Doğrudan | md 9 ve Ek 7: yalnız yazılı emir | İki seçenekli. Karşılaştırmalı kök ("hangi tedbirde emir sözlü de verilebilir") beş gerçek şık bulamaz. md 2/3'ün sözlü emirleri ve 2911 md 24'ün "sonradan yazı ile teyit" sorusu (bankada) karışır. #1 yazılırsa yazılmaz | 2911 md 24; Arama Yön. md 20 |
| Y5 | 13/1-A | Yakalama eşiği | Doğrudan | makul sebep (4/A); yeterli şüphe | "En yüksek eşik" sağduyusu; eşiklerin her biri bankada yazılı. Değer en çok 3 | 4/A makul sebep (2); Arama Yön. md 27 |

- **Dışarıda:** §3 "Kapsam dışı" tablosu; §6'daki iptal bölgesi, "hâkim onayı" ekseni, RED almış dört hüküm, aynalar; md 5, 6, 7, 8, 16, Ek 6 teşhis, Ek 7 (dolu).
- **Kök tipi (2 soru):** olumsuz 1 (#1), kısa vaka 1 (#2). Öncüllü, boşluk ve "doğrudur" yok. Koşul → kural 2/2; ayırt etme 2/2.
- **Zorluk:** #1 orta/zor, #2 orta.
- **Doğru harf:** bankada A ve B yığılı (67/117). Yeni soruların doğru şıkkı C, D ya da E'ye konur.
- **Parti içi sızıntı:** #1 ↔ Y4 aynı fıkradır; birlikte yazılmaz. #2'nin açıklaması 13/A'yı, #1'in açıklaması 4/A'yı anmaz. Hiçbir açıklama §6'daki banka değerlerini içerikle yazmaz.
- **Test derleme notu:** #1, bankadaki iki 13/A sorusuyla; #2, PAEM 9 [12] ve 4/A "yanlıştır" sorusuyla aynı kısa denemeye konmaz.

## §8 Kanuna özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız `resmi-3.txt` ile aynı olan madde gövdesinden kurulur. "Metnin durumu" bağlayıcıdır.
   - 4/A/6'nın 2015 cümleleri, md 15/2, md 20/3, Ek 6/18: yok sayılır.
   - md 12'nin üçüncü fıkrası resmî metinde vardır, banka dosyasında yoktur; bu fıkraya soru kurulmaz.
   - Eski ve ölü atıf tablosundaki ibareler yazılmaz.
   - Yokluktan yargı kurulmaz. İstisna: metnin kendi kapalı kapsam ifadesi (13/A "kayıp çocuğa ait veya başkasına ait olmakla birlikte kayıp çocuk tarafından kullanılan").
2. **Sayı ve süre.** Süre, tutar, tarih sorusu yazılmaz. Bankadaki süre değerleri çeldirici olarak da kullanılmaz (banka cevabı sızdırır).
3. **Varsayılan.** Doğru şık "mülki amir", "Cumhuriyet savcısı" ya da "sulh ceza hâkimi" ise soru yazılmaz. Y1 bu kuralın sınırındadır; yedek olmasının sebebi budur.
4. **Ters ayırt etme yasağı.**

   | Sezgi | Doğruya götürdüğü yer → karar | Yanlışa götürdüğü yer (lehte) |
   |---|---|---|
   | "Başkasının hesabına, hattına dokunulmaz" | — | 13/A kapsamı (#1) |
   | "Tedbir şüpheliye uygulanır" (Ek 7, CMK) | — | 13/A kapsamı (#1) |
   | "Kaydı olmayan yabancıdır" | 4/A/12 → yazılmaz | 4/A/11 (#2) |
   | "Listede yoksa parmak izi alınmaz" (md 5/1) | resmî [6] | 4/A/11 (#2) |
   | "Kimliği belirsiz kişinin kaydı alınır" | 4/A/11 → #2'nin riski | — |
   | "Sonuç, kararı verene bildirilir" | 9/8 → yedek | — |
   | "Önleme araması idarî iştir; mülki amire rapor edilir" | — | 9/8, hâkim kararı koşuluyla (Y1) |
   | "Branş dışı polis yetkili birime devreder" | Ek 4/1 → yedek | — |
   | "Suç varsa savcıya bildirilir" | Ek 6/4 (bankada) | Ek 4/1 (Y2; iki okumalı) |
   | "Çocuk için en koruyucu sonuç" | 12/2 → yedek | — |
   | "En acil iş, en esnek usul" | 13/A sözlü emir → yedek | — |
   | "Yakalama için en yüksek eşik" | 13/1-A → yedek | — |
5. **Koşul → kural ekseni.** #1: hesabın ve iletişimin kullanıcısı → kapsam. #2: kimliğin belirlenememe sebebi → işlem.
6. **Çakışma ve mükerrer.** §2'nin iki tablosu taranır. PVSK sorusu şunları yeniden sormaz: Arama Yön. md 19–27'nin, Yakalama Yön. md 5–9'un, 5326 md 40'ın, 7245 md 7–11'in bankadaki ya da adaydaki soruları. Dört çeldiricinin dördü de banka cevabıysa soru elemeyle çözülür (23 Kas kural 5); orkestratör `-benzer.txt` ile sayar.
7. **İki okumalı hükümler** (§6) doğru şıkta, çeldiricide ve açıklamada kullanılmaz. En önemlileri: "hâkim onayı" ekseni; 13/A'da "başkasına ait" kaydının iletişime uygulanması; 4/A/9 ↔ 4/A/11; Ek 4/1 ↔ Ek 6/4.
8. **Vaka.** 1–2 cümle, en çok 250 karakter; unvanlı; ad, il ve tarih yok. #2'nin vakası "yabancı" sözcüğünü taşımaz; #1 vaka değildir.
9. **Olumsuz kök (#1).** Vurgu büyük harfle; dört doğru önerme metnin kendi fiilleriyle yazılır ("talep edebilir", "denetleyebilir", "değerlendirebilir"); doğru şık üslupça ötekilerden ayrılmaz.
10. **Biçim.** Kök "2559 sayılı PVSK'ya göre," ile açılır; madde ve fıkra numarası köke yazılmaz (#1'de "13/A" yerine "kaybolan çocukların bulunması amacıyla" denir). Beş şık. Etiket: "Mevzuat türetimi — 2559 sayılı Kanun md 13/A", "… md 4/A".
11. **Dil.** Terim tablosu ("Ad ve terim kuralı") bağlayıcıdır. "Kayıp çocuk" ve "kaybolan çocuk" metinde birlikte geçer; ikisi de yazılabilir.

### Gözcü kontrol listesi

1. **Kör çözüm.** #1'de doğru şık "tek farklı kategori" ya da "çocuk kullanmıyor" ibaresiyle mi bulunuyor? #2'de doğru şık en uzun ve en kapsayıcı şık mı; sıra bilgisi olmadan bulunuyor mu?
2. **Ters ayırt etme.** Ek 7'yi, md 5'i ya da 5326 md 40'ı bilen eksik aday yanılıyor, hiç bilmeyen aday buluyor mu? Taze kör çözücü madde bilgisi olmadan buluyorsa RED.
3. **Mükerrer.** 13/A'nın iki banka sorusu ve makam eşleştirmesi; 4/A'nın 10 sorusu; md 5'in liste soruları; 5326 md 40; Yakalama Yön. md 5 (yakalama-p1-05); 2559-p2-04 ve 2559-p1-03'ün eski metinleri (yeni soru onların öncülünü kopyalıyor mu?).
4. **Güncellik.** Soru, şık ya da açıklama şunlara dayanıyor mu: 4/A/6'nın 2015 cümleleri; kolluk amirinin emri; yirmi dört saat (4/A); 5683; CMK md 250; Başbakanlık Teftiş Kurulu; Memurin Muhakematı; md 16'daki dipnot satırı?
5. **İki okumalı.** #1'de "başkasına ait" unsuru iletişimle mi kurulmuş? "Hâkim onayına sunulur" bir şıkta mı (Y1)? #2'de gözaltı ya da tutuklama şıkta mı? Y2'de "savcıya bildirir" şıkkı var mı?
6. **Sayılar.** Süre, tutar ya da tarih soruluyor mu? RED.
7. **Şık takımı.** İki şık aynı temayı taşıyor mu? Aynı cümlenin iki yarısı iki şıkta mı? İki şık bir eksenin karşıt uçları mı ve doğru şık "orta yol" mu?
8. **Sınav değeri.** `sinavDegeri` en çok 2: 9/2, 7/6, 5/8, 20/3, Ek 5/2, Ek 7/8, Ek 6/5, 16/3-a. En çok 3: Y1, Y3, Y4, Y5. RED: iptal bölgesi; RED almış dört hüküm; cevabı varsayılan merci olan soru.
9. **Parti oranları.** Üst sınır 3 (önerilen 2). Öncüllü soru yok. Doğru harf C, D ya da E. Uydurma değer partide en çok bir.

---

## Şüpheli noktalar (soru konusu olmaz; kullanıcıya bildirilir; hiçbiri düzeltilmedi)

**Banka metni (`mevzuat/2559.txt`)**

1. **md 12, üçüncü fıkra dosyada yok.** Resmî metin: "Bu madde hükümlerine aykırı hareket edenler hakkında 17 nci, işyerleri hakkında da 6 ncı madde hükümlerine göre işlem yapılır." `durum.md` maddenin 11 Kas'ta veritabanında resmî metinden tazelendiğini yazar; dosya o tarihin sabahına aittir. Veritabanında fıkranın bulunup bulunmadığı **doğrulanamadı**. Yayındaki md 12 madde özeti ve bankadaki md 6 sorusu ("12 nci maddede belirtilen yasaklara uymama") bu fıkrayla ilgilidir. Dosya yeniden çıkarılmalı.
2. **md 16'da dipnot artığı.** "araçlarını,13" ve sekizinci fıkranın ortasında dipnot [13]'ün metni. Veritabanındaki hâl **doğrulanamadı**; öyleyse okuyucuda kullanıcıya da böyle görünür.
3. **4/A/6'da askıda kalan iki cümle** ("Kolluk amirinin kararı yirmi dört saat içinde …"; "Bu fıkra kapsamında yapılan araç aramalarına ilişkin olarak …"). Resmî metinde de durur; iptal edilen yetkiye bağlıdır. Dipnot olmadığı için okuyan, iptalin kapsamını metinden çıkaramaz.
4. **Ek 7/2'deki CMK md 250 atfı, Ek 7/9'daki "Başbakanlık Teftiş Kurulu", Ek 9/1-A'daki "Memurin Muhakematı Hakkında Kanun", Ek 3/B'deki md 17 atfı, md 14'teki "Ceza Kanununun 546 ncı maddesi", 4/A/12'deki 5683.** Resmî metinde de böyledir; özet ve kart üretiminde güncel kural gibi aktarılmamalı.
5. **13/A'da terim kayması:** karar "sulh ceza hâkimi", onay "mahkeme". Resmî metinde de böyle.
6. **Ek 7'de AYM kaydı bulunamadı.** Resmî değişiklik tablosu Ek 7 için yalnız kanun ve KHK satırları taşır. Görev tanımındaki "Ek 7'de AYM iptalleri" bilgisi resmî konsolide metinle **doğrulanamadı**.

**Bankadaki sorular**

7. **Süre eşleştirmesi sorusu ("[md Ek 7] … süre hükümleriyle ilgili aşağıdaki eşleştirmelerden hangisi yanlıştır"):** A önermesi "Durdurmada kolluk amirinin arama kararının hâkim onayına sunulması (m.4/A) – yirmi dört saat" doğru önerme sayılıyor. Bu, iptal edilen arama yetkisini var sayar. Anahtar (D) etkilenmez; önerme iptal edilmiş bir işlemi güncel gibi öğretir. `durum.md`'deki 21 Kas düzeltme listesinde bu soru anılmıyor; açıklamasında iptal notu olup olmadığı **doğrulanamadı**.
8. **Resmî [18] (Misyon 2020; "kolluk amirinin kararı en geç kaç saat içinde görevli hâkimin onayına sunulur"):** aynı artık cümleye dayanır. Resmî soru olduğu için anahtar korunur; `durum.md` açıklamasının iptali not ettiğini yazar (6639ffbc). Bilgi için.
9. **Mükerrer çift:** Kaymakamlık 2022'nin Ek 1 sorusu bankada iki kez duruyor (biri "[md Ek 1]" etiketli, biri etiketsiz "SÜRE — MERCİ" başlıklı). E şıkları farklı yazılmış ("48 saat önce – Çeşme İlçe Emniyet Müdürlüğü" ↔ "72 saat önce — …"); biri yanlış aktarılmış olmalı. Hangisinin resmî metne uyduğu **doğrulanamadı**.
10. **Aynı bilgiyi ölçen kümeler (mükerrer değil, yığılma):** md 9 "önleme araması yapılamaz" 2 soru (PAEM 8, PAEM 10); md 9 "gecikmesinde merci" 2; md 5 silme süresi 2; md 5 liste 3; md 8 otuz gün 2 (biri merci ile bileşik); md 16 maddî güç tanımı 2; md 16 silahla saldırı 2; Ek 1 kırk sekiz saat 3 + süre eşleştirmesinin cevabı. Kısa denemelerde aynı küme iki kez düşebilir.
11. **Dört şıklı 8 soru:** hepsi dört şıklı resmî sınavlardan (EGM Misyon 2023: 4; Misyon 2020: 3; JGK 2023: 1). Beş şık kuralı gereği bilgi için.
12. **Etiketsiz 7 soru** (madde bağı boş): PAEM 9'un üç sorusu, PAEM 10 sorusu, Kaymakamlık kopyası, "belediye" ruhsat sorusu ve öncüllü parmak izi sorusu. Madde bağları 4/A, 16, 9, Ek 1, 7, 5 olmalı.
13. **Etiketsiz öncüllü parmak izi sorusu:** öncüller kökten önce yazılmış (kök ortada). "V. Bir suç işlediği gerekçesiyle yakalananların" öncülü dışarıda bırakılıyor (anahtar B). md 5/1-e "gözaltına alınan" der; md 5/4 ise CMK md 81'e göre alınan izlerin de sisteme kaydedildiğini söyler. Anahtar lafza uygundur; "yakalanan ↔ gözaltına alınan" ayrımına dayandığı için itiraza açıktır. Kaynağı **doğrulanamadı**.
14. **Tarih ezberi ölçen iki soru:** "md 16'ya 2015 yılında eklenen hâl" ve "md 13'e 2015 yılında eklenen hâl". Hukuken doğru; `03-kalite-onceligi.md` ölçüsüyle sınav değeri düşük (tarihî atıf).
15. **"[md 13] … öncelikle hangi maddeye dayanarak işlem yapar" vakası:** şıklar madde konularıdır; dört şık konu dışı olduğu için sağduyuyla çözülür.
16. **Doğru harf dağılımı:** A 36, B 31 (toplam %57); C 16, D 17, E 17. Önceki türetimlerin ve etiketsiz eski soruların A ve B'ye yığıldığı görülüyor.
17. **Resmî [6] ↔ 4/A/11:** "parmak izi alınması gerekenler arasında açıkça sayılmamıştır: kimliğini ibraz etmeyenler" sorusu md 5/1 bakımından doğrudur. 4/A/11, nüfusa kayıtlı olmayan ve kimliği tespit edilemeyen kişinin parmak izinin md 5'e göre alınacağını söyler. Çelişki yok; açıklamada bu ayrımın yazılıp yazılmadığı **doğrulanamadı**.

**Komşu dosyalar**

18. **`arama-mevcut-sorular.txt` ve `yakalama-mevcut-sorular.txt` 24 Eyl tarihli;** 21 Kas'ta yayından çekilen Arama Yön. md 27 araç sorusunu (fc6f02d1) hâlâ içeriyor. `6136-mevcut-sorular.txt` 11 Kas, `adli-kolluk-mevcut-sorular.txt` 12 Kas tarihli. Bu tur için tazelenmeleri gerekir; mükerrer taraması bu dosyaların o günkü hâliyle yapıldı.
19. **`7245-mevcut-sorular.txt` ve `teknik-takip-mevcut-sorular.txt` boş** (0 soru). 7245 ile çakışma `aday/7245-p1.json` üzerinden denetlendi; in_review'daki 7245 sorularının bankadaki güncel durumu **doğrulanamadı**.
20. **Arama Yönetmeliği md 26 ↔ PVSK 9/8:** yönetmelik tutanağı "suç unsuruna rastlandığında" arar; kanun, sonucun her hâlde tutanakla bildirilmesini ister. Bankadaki md 26 sorusu yönetmelik lafzıyla doğrudur; bilgi için.
21. **2024–2026 değişiklikleri:** resmî tablonun son satırı 7590'dır (yürürlük 31/7/2026). Resmî Gazete ayrıca taranmadı.
