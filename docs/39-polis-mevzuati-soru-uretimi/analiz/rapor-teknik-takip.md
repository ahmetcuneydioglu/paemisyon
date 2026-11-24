# Teknik yöntemlerle takip (elektronik kelepçe): sınav ve kaynak analizi

Doc 39, 23 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/teknik-takip.txt` (22 madde);
- taban: `6284.txt` + `6284-mevcut-sorular.txt` (35), `6284-yonetmelik.txt` + `6284-yonetmelik-mevcut-sorular.txt` (16);
- `teknik-takip-cakisma-sorulari.txt` (119), `teknik-takip-diger-konu-sorulari.txt` (4), `teknik-takip-mevcut-sorular.txt` (boş).

Resmî metin mevzuat.gov.tr'den 23 Kas 2026'da indirildi ve banka metniyle betikle sözcük sözcük karşılaştırıldı.
- Yönetmelik: `…/scratchpad/teknik-takip/indirilen/y.doc` (HTML-Word), `iframe.html`, `sayfa.html`; düz metin `resmi-doc.txt`; betik `betik/karsilastir.py`.
- 6284 sayılı Kanun: `…/scratchpad/teknik-takip/indirilen-6284/k.doc`; düz metin `resmi-6284.txt`; betik `betik/k6284.py`.
- Scratchpad kökü: `/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/teknik-takip/`.

Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz, bu yönetmeliğe uygulanır.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** kolluğu doğrudan ilgilendirir. **sınır**: çakışma dosyasında başka bir kuralı ölçen, ama yeni soruya çeldirici ya da yasak sınırı veren soru. **Y:** bu raporda "Yönetmelik" = teknik takip yönetmeliği; **UY** = 6284 Uygulama Yönetmeliği; **Kanun** = 6284.

## 0. Özet tablo

| Mevzuat | Resmî doğrudan soru | PAEM / Misyon | Bankada | Diğer konu: ilgili / metin dışı / ilgisiz | Çakışma: ilgili / sınır / ilgisiz | Asıl çakışma tabanı |
|---|---|---|---|---|---|---|
| Teknik Takip Yön. | 2: [187] Adalet GYS 2023 (15/2, yedi gün); [194] Adalet GYS 2025 (md 5 ↔ md 6 görev listesi) | 0 / 0 | **2** (ikisi de resmî; "6284 Kanunu" konusunda duruyor) | 4 / 0 / 0 | 9 / 29 / 81 | Kanun md 12, 13, 9, 8, 10; UY md 35, 37, 38; CMK md 140 (ad benzerliği) |

- **"Bankada 0 soru" doğru değil.** `teknik-takip-mevcut-sorular.txt` boş, ama bu yönetmeliğin iki resmî sorusu bankada "6284 Sayılı Ailenin Korunması Kanunu" konusunda madde etiketsiz duruyor (`6284-mevcut-sorular.txt` ve diğer-konu dosyası). Türetim yok; bu doğru.
- **6284 başlığındaki 19 resmî sorunun ([182]–[200]) dağılımı:** Adalet GYS 10, Misyon Koruma 6, İçişleri GYS 3, **PAEM 0**. `resmi-idare-personel.txt`'te 6284, elektronik kelepçe, ŞÖNİM, zorlama hapsi, denetimli serbestlik geçen soru yok (0/408).
  - Misyon'un altı sorusunun hepsi Kanun'dan: altı ay, zorlama hapsi süresi, yönetmelik görüşü, on altı yaş (iki kez), mülki amirin tedbiri.
  - Yönetmelik soran tek sınav Adalet GYS: UY 3 ([185], [186], [197]), ŞÖNİM Yön. 1 ([193]), bu Yönetmelik 2 ([187], [194]).
- **Resmî iki sorunun ikisi de ezber:** bir usul takvimi sayısı ve bir görev listesi. Karar kuralı ölçen yok.
- **Yönetmelik bir teşkilat ve iş akışı metni.** 22 maddenin 9'u amaç, tanım, görev listesi, koordinasyon, yürürlük. Karar kuralı taşıyan hükümler md 7/3, 9, 11, 12, 13, 15, 18, 20/2'de toplanır.
- **Kolluk için gerçek değer** (◆): ihlalde ne yapılır (md 13), asgari mesafe raporu (9/2-c, 9/5), iller arası yetki (7/3), tebliğ ve kurulum (11, 16).
- **Metin.** Banka metni resmî metinle sözcük sözcük aynı. Dipnot yok, değişiklik yok. Asıl sorun metnin kendi iç tutarsızlıkları (aşağıda C); altı hüküm bu yüzden soru olamıyor.
- **Tavan 5, önerilen 4** (§7). Gerçekçi beklenti 2–3 KABUL. PAEM ve Misyon bu yönetmeliği hiç sormadı; sınav değeri en iyi yuvada bile 4'ü geçmez.

**◆ Kolluğa doğrudan değen hükümler**

| Hüküm | Kolluk bağı | Kullanım |
|---|---|---|
| 3/t, 7/1–2 | Uygulama ekibi: Büro Amirliği (polis) ve jandarma biriminde, eğitim almış kolluk görevlilerinden. Ünite talebi, teslim, takma, geri alma, arıza, iade | yedek Y1 (görev ayrımı) |
| 7/3 | Mağdur ve yükümlü için farklı il emniyet müdürlüğü ya da il jandarma komutanlığı yetkiliyse işlemleri mağdurun ikamet ettiği yerdeki sorumlu kolluk birimi yürütür | p1 #3 |
| 8 | Vakayı Büro Amirliği, jandarma birimi ve Bakanlığa bağlı birimler tespit eder; ŞÖNİM'e gönderir | bağlam |
| 9/1, 3/m | Komisyonda polis irtibat görevlisi ya da jandarma personeli üyedir; Büro Amiri davet edilebilir | yedek Y2 |
| 9/2-c, 9/5 | Asgari mesafe raporunu ilgili kolluk birimi hazırlar. Kararda asgari mesafe yoksa öneriyi ve güvenli bölgeleri ilgili kolluk birimi belirler | p1 #2 |
| 11/1, 16 | Kararı taraflara uygulama ekibi, ilgili kolluk biriminde, farklı zamanlarda tebliğ eder; üniteleri takar | doğru önerme; tek başına soru olmaz (§6) |
| 11/3 | Tebliğ ya da uygulama mümkün değilse uygulama ekibi tutanak tutar; araştırma UY 35/5 kapsamında sürer | yedek Y4 |
| 13/1–7 | İzleme personeli (EGM ve JGK personeli): uyarı, ihlal, tutanak, 112 ve kolluğa koordinat | p1 #1 |
| 13/8 | İhbarı alan kolluk birimi müdahale eder; Cumhuriyet savcısını ivedilikle bilgilendirir; tutanağı Cumhuriyet Başsavcılığına gönderir | bağlam; sezgi (§6) |
| 18 | Ünitelere zarar: tutanak, suç duyurusu; ayrıca Karar ihlali | iki okumalı (C-4); sorulmaz |

## Metnin durumu (BAĞLAYICI)

### A. Künye ve karşılaştırma

| Konu | Bulgu | Kullanım |
|---|---|---|
| Resmî ad | "6284 Sayılı Kanun Kapsamında Teknik Yöntemlerle Takip Sistemlerinin Kullanılmasına Dair Yönetmelik". CLAUDE.md'deki ad baştaki "6284 Sayılı Kanun Kapsamında" öbeğini taşımaz | kısa ad §8 kural 1 |
| Yayım | Resmî Gazete 4/9/2021, sayı 31588. Yayımı tarihinde yürürlükte (md 21) | soru konusu olmaz |
| Çıkaran | Aile ve Sosyal Hizmetler Bakanlığı ile İçişleri Bakanlığı (md 1/2, 19/1, 22: iki Bakan birlikte yürütür) | "kim yürütür / kim çıkarır" yasak kalıp |
| Değişiklik | mevzuat.gov.tr'deki güncel (konsolide) metinde "Değişik", "Ek", "Mülga" şerhi yok; dipnot yok. Tek Resmî Gazete künyesi var | 2021 metni bugünkü metindir |
| Danıştay / AYM | Resmî metinde "Danıştay" ya da "Anayasa Mahkemesi" geçmiyor. Yürütmeyi durdurma ya da iptal şerhi yok. **Derdest bir Danıştay davası olup olmadığı doğrulanamadı** (dava kaydı taranmadı; yalnız resmî metnin şerhleri okundu) | şerh yok; iptal edilmiş hüküm varsayılmaz |
| Banka ↔ resmî | 22/22 madde. Betikle sözcük sözcük karşılaştırıldı: **gövdede sıfır fark.** 21 farkın hepsi bankada bulunmayan bölüm ve madde başlıklarıdır | banka metni dayanak alınabilir |
| md 3 "kesik tanım" | **Yanlış alarm.** md 3 bentleri resmî metinle aynı; hiçbiri kesik değil. Bankada md 3, 4, 6, 14–19 tek satır, öbür maddeler Resmî Gazete satır kırılımıyla duruyor (yalnız biçim karışıklığı) | — |
| Gövdeye karışmış dipnot | yok | — |
| Başlık yapışması | yok. (UY banka metninde var; `07-ek`.) | — |

Bankada bulunmayan resmî başlıklar (tırnaklı başlıkta kullanılabilir): Amaç ve kapsam · Dayanak · Tanımlar · İzleme merkezi (4) · İzleme merkezi amirinin görevleri (5) · İzleme personelinin görevleri (6) · Teknik yöntemlerle takip uygulama ekibinin görevleri (7) · Vakanın tespiti (8) · Vakanın değerlendirilmesi (9) · Karar talebi (10) · Kararın tebliği (11) · Kararın uygulanması (12) · Kararın ihlali (13) · Karara itiraz (14) · Kararın devam etmesi ve kaldırılması (15) · İzleme ünitelerinin teslimi ve takılması (16) · İzleme ünitelerinin çıkarılması ve geri alınması (17) · İzleme ünitelerinin zarar görmesi halinde yapılacak işlemler (18) · Kurumlararası koordinasyon ve eğitim (19) · Verilerin tutulması ve paylaşılması (20).

### B. Dayanak Kanunla ilişki

Kanun'un resmî metni de indirildi. md 2, 8, 9, 10, 12, 13, 14 banka metniyle betikle aynı bulundu. Resmî metinde Kanun'a ilişkin değişiklik ya da AYM iptali şerhi yok (tek dipnot md 21 kadrolarıyla ilgili). Kanun'a karşı açılmış ve reddedilmiş iptal davaları **taranmadı; doğrulanamadı.**

| Y hükmü | Kanun hükmü | İlişki | Kullanım |
|---|---|---|---|
| 3/l, 10: kararı hâkim verir | md 12/1: "hâkim kararı ile" | ayna | bankada ([451]); sorulmaz |
| 2: dayanak md 12 | md 12/2: yönetmelikle düzenlenir | ayna | bankada ([199]); yasak kalıp |
| 20/2 ikinci cümle: ses ve görüntü dinlenemez, izlenemez, kayda alınamaz | md 12/1 ikinci cümle; UY md 37 | ayna | yalnız doğru önerme; tek başına soru olmaz |
| 20/2 birinci cümle: ihlal ve uyarı görüşmeleri kayıt altına alınır | md 12/1 yasağı mutlak yazılmış ("bu suretle … kayda alınamaz") | **gerilim.** Y kendi içinde "bunun haricinde" diyerek istisna kurar; Kanun'da bu istisna yok | p1 #5; kök "Yönetmeliğe göre" ile kilitlenir; açıklama Kanun'la çatışma yorumu yazmaz |
| 11/2: zorlama hapsi ihtarı | md 8/5; UY 31/5, 38/3 | ayna | bankada ([185] D); sorulmaz |
| 13/8: Kanun md 13 işlemleri | md 13: üç–on gün; on beş–otuz gün; altı ay | atıf | süreler bankada dört kez; sorulmaz, şıkta yer almaz |
| 14/1: iki hafta, aile mahkemesi; Kanun md 9 uygulanır | md 9/1 | ayna | bankada ([184]); sorulmaz |
| 14/2, 11/2: itiraz uygulamayı durdurmaz | Kanun'da açık cümle yok ⚑ (md 10/5 yalnız tebliğ edilmemeyi düzenler) | Y'ye özgü, ama sezgi | yalnız doğru önerme (§6) |
| 10: "en çabuk ve en kolay ulaşılabilecek yer" | md 8/1 | ayna (Y yalnız aile mahkemesi hâkimini sayar) | sorulmaz |
| 10: talep edenler ŞÖNİM, kolluk, mağdur, Cumhuriyet savcısı | md 8/1: ilgili, Bakanlık, kolluk görevlileri, Cumhuriyet savcısı | Y "Bakanlık" yerine "ŞÖNİM" der | liste sorusu olmaz (§6) |
| 3/p şiddet mağduru | md 2/e | kelimesi kelimesine ayna | sorulmaz |
| 3/r ŞÖNİM | md 2/f, md 14; UY md 39 | ayna | sorulmaz |
| 4/2, 11/2: yedi gün yirmi dört saat | md 2/f, md 14 (ŞÖNİM için) | aynı değer ✱ | sorulmaz |
| 3/ğ ilgili kolluk birimi: yerleşim yeri, bulunduğu ya da kararın uygulanacağı yer | md 10/3; UY 35/4 | ayna; Y ayrıca Sahil Güvenlik'i sayar | sorulmaz |
| 7/1: eğitim almış kolluk görevlileri | md 11; UY md 36 | ayna | sorulmaz |
| Kararın azami süresi | Y'de **yok** ⚑. Kanun 8/2 "altı ay" tedbir kararı içindir; takip kararına uygulanıp uygulanmadığını Y söylemez | iki okumalı | sorulmaz; "altı ay" hiçbir şıkta yer almaz |
| Mağdurun rızası | Y'de **yok** ⚑. Mağdura da ünite verilir (16); mağdur cihazı şarj etmezse yönlendirilir (13/3) | — | rıza sorusu kurulmaz |

**AD KURALI (bağlayıcı).**
1. Bakanlık: Y "Aile ve Sosyal Hizmetler Bakanlığı" der; bu ad günceldir. Kanun md 2/a ve UY "Aile ve Sosyal Politikalar Bakanlığı" der (resmî metinleri de öyle). Soru, şık ve açıklamada yalnız "Aile ve Sosyal Hizmetler Bakanlığı" ya da "Bakanlık" yazılır. "Aile ve Sosyal Politikalar" ve "Aile, Çalışma ve Sosyal Hizmetler" çeldirici bile olmaz.
2. "ASH İl Müdürlükleri" (9/2-b) kısaltması soruya girmez; "Bakanlık il müdürlüğü" yazılır (3/ç).
3. **Birim adı doğru şıkkın ayırt edici unsuru olmaz.** Y'nin kendi içinde üç ayrı yazım var: 3/b "Aile İçi Şiddetle Mücadele ve Çocuk Şube Müdürlüğü/Kısım Amirliği", 9/1 "Çocuk ve Kadın Kısım Amiri", 15/2 ve 17 "kolluğun ilgili Büro/Kısım Amirliği". Teşkilat adları hızlı eskir; bugünkü adlar **doğrulanamadı**. Soruda "uygulama ekibi", "ilgili kolluk birimi", "izleme merkezi", "izleme personeli", "Komisyon", "ŞÖNİM" terimleri kullanılır.
4. "Polis irtibat görevlisi/jandarma personeli" (3/m) ile "polis irtibat/jandarma görevlisi" (9/1) aynı üyedir. Şıkta ikisi ayrı şık olmaz.
5. "112/155/156 Acil Çağrı Hatları" (13/7): numaralar sorulmaz ve şıkta yer almaz (155 ve 156'nın 112'ye bağlanması metin dışı ⚑; bugünkü durum doğrulanamadı). "Acil çağrı hatları" yazılır.
6. "Yasaklı bölge" (3/j) = "yasak bölge" (3/u). Soruda "yasak bölge" yazılır.
7. "Karar" büyük harfle Y'nin tanımlı terimidir (3/l). Kökte "teknik yöntemlerle takip kararı" yazılır; "tedbir kararı" yazılmaz (12/1 ikisini ayırır).

### C. Metnin iç tutarsızlıkları (soru konusu olmaz)

| # | Hükümler | Tutarsızlık | Sonuç |
|---|---|---|---|
| 1 | 3/s ↔ 13/2-a ↔ 12/3 | Tampon bölgeyi tanım "izleme merkezi ve uygulama ekibi koordineli" belirler der; 13/2-a "izleme merkezi tarafından belirlenen" der; 12/3 merkezde haritaya işaretlenir der | **Tampon bölgeyi kimin belirlediği sorulmaz;** hiçbir şıkta merci olarak yer almaz |
| 2 | 9/6 ↔ 15/1 ↔ 6/1-ç | Komisyon değerlendirmesi 9/6'da "en az on beş gün önce", 15/1'de "on beş gün önce"; izleme personelinin bildirimi de "on beş gün önce" | "on beş gün" ✱ üç ayrı işte; doğru şık olmaz |
| 3 | 15/1 ↔ 15/2 | Talep on gün önce mahkemeye sunulur; uzatma değerlendirmesi en az yedi gün önce kolluğa ve merkeze bildirilir. Sıra tuhaf (bildirim talepten sonra) | 15/2 bankada; 15/1 zayıf yedek |
| 4 | 13/2-c ↔ 13/4-b ↔ 18/2 ↔ 3/f | Kelepçeye zarar verecek müdahale 13/2-c'de **uyarı** sebebi; 18/2'de zarar verme doğrudan **Karar ihlali**; 3/f'de ihlal tutanağı sebebi | Zarar verme ve müdahale hiçbir sorunun ayırt edici unsuru olmaz |
| 5 | 13/7 ↔ 13/4 ↔ 3/f | Kelepçenin çıkarılması 13/4'teki ihlal hâlleri arasında sayılmaz; 13/7'de ve 3/f'de geçer | "Çıkarma uyarı mı ihlal mi" sorulmaz. Çıkarmanın 13/7 sonucu (acil çağrı hatları ve kolluk, koordinat) çeldirici olabilir |
| 6 | 15/4 ↔ 17 | Karar bitince tarafları 15/4'te izleme personeli **uygulama ekibine**, 17'de izleme merkezi **Büro/Kısım Amirliğine** yönlendirir | sorulmaz |
| 7 | 7/3 ↔ 3/ğ | 3/ğ ilgili kolluk birimini üç seçenekle tanımlar; 7/3 iki il çakışınca mağdurun ikamet yerini seçer | çelişki değil, özel kural. p1 #3 yalnız 7/3'ün koşuluyla kurulur |
| 8 | 11/2 | Yükümlü kurulumu kabul etmezse "itiraz prosedürü uygulanır". Ünitenin zorla takılıp takılmayacağı yazmaz ⚑ | "Kabul etmezse ne olur" sorulmaz |
| 9 | 18/1 | Suç duyurusunu kimin yapacağı yazmaz (edilgen cümle) | merci sorulmaz |
| 10 | 7/2-ç | İtiraz edeceğini söyleyen taraf için tutanak Cumhuriyet Başsavcılığına gider; itiraz mercii aile mahkemesidir (14/1) | sorulmaz |
| 11 | 20/1 | "ilgili kuruluşlar paylaşılmasından" (resmî metinde de ek eksik) | alıntılanmaz |
| 12 | 10 | "en kolay ulaşılabilecek yer aile mahkemesi hâkiminden" (resmî metinde de böyle) | alıntılanmaz |

## §1 Resmî sorular

| No | Sınav | Hüküm | Açı | Kök | Çeldirici türü | Gerçek değer | Zorluk |
|---|---|---|---|---|---|---|---|
| 187 | Adalet GYS 2023 (5 şık) | 15/2: en az yedi gün | S | doğrudan; hüküm aynen; ≈270 krkt; tam ad | eşit aralıklı uydurma dizi (üç, beş, dokuz, on bir) | 0/4: metindeki "on" ve "on beş" şıklarda yok | kolay–orta |
| 194 | Adalet GYS 2025 (5 şık) | md 5 ↔ md 6 | A (liste) | öncüllü, dört öncül; ≈420 krkt; tam ad | komşu maddenin gerçek bentleri (6/1-b, 6/1-i) | 2/2 | orta |
| 199 | İçişleri GYS (4 şık) | Kanun 12/2 | işlem türü | doğrudan | Kanun, Tüzük, Genelge | — | kolay (yasak kalıp) |
| 197 | Adalet GYS 2025 (5 şık) | UY md 3 tanım | K | tırnaklı tanım → terim | aynı maddenin komşu terimleri | 4/4 | orta |
| 193 | Adalet GYS 2025 (5 şık) | ŞÖNİM Yön. | M (görev → unvan) | tırnaklı görev | meslek unvanları | — | orta |
| 185 | Adalet GYS 2023 (5 şık) | UY md 38 | Sn | "yanlıştır"; tırnaklı başlık | olumsuzlama (38/7) | — | kolay |

**Çıkarım.**
- Yönetmeliği adıyla soran tek sınav Adalet GYS. Tam adla anıyor: "6284 Sayılı Kanun Kapsamında Teknik Yöntemlerle Takip Sistemlerinin Kullanılmasına Dair Yönetmelik'e göre".
- **Tanım sorusu yalnız GYS'de var** ([197]). PAEM ve Misyon tanım sormadı. md 3 tanım ezberi PAEM değeri taşımaz; tanımlar ayırt etme malzemesidir (§5).
- [187] zayıf sorudur: metindeki iki komşu gerçek değeri (on, on beş) şıkka koymamış. Yeni bir süre sorusu aynı aileden olur ve [187]'nin cevabını çeldiricide taşımak zorunda kalır.
- [194] görev listesi ailesini açtı. Aynı kalıbın ikincisi (personel ↔ uygulama ekibi) mükerrer sayılmaz ama aynı ezberi ölçer (yedek Y1).
- Karar kuralları hiç ölçülmemiş: uyarı ↔ ihlal, asgari mesafe raporu, Komisyonsuz talep, iller arası yetki, izleme sürecinin başı ve sonu, görüşme kaydı.

## §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Açı | Nerede | Sızıntı ve karar |
|---|---|---|---|
| Y 15/2: en az yedi gün | S | [187] (banka, 6284 konusu) | Sorulmaz. "Yedi" yeni süre sorusunda çeldirici olabilir; doğru şık olmaz |
| Y md 5 a–f; md 6/1-b, 6/1-i | A | [194] (banka) | md 5'in bentleri ve bu iki md 6 bendi doğru şık ya da ayırt edici önerme olmaz. I ve III ([194]'ün cevabı: vardiya listesi, iletişim listesi) hiçbir şıkta yer almaz |
| Kanun 12/1: hâkim kararı | M | banka md 12 (türetim; 5 şık) | "Kararı kim verir" sorulmaz. Şıkları: kolluk amiri, mülki amir, Cumhuriyet savcısı, ŞÖNİM. Bu beşli merci takımı yeniden kurulmaz |
| Kanun 12/2: yönetmelik | işlem türü | [199] | yasak kalıp |
| Kanun md 13: üç–on gün; on beş–otuz gün; altı ay | S | [183]; banka md 13 boşluk | sorulmaz; değerler şıkta yer almaz |
| UY md 38: kolluk ihlali tespit ederse tutanak Cumhuriyet başsavcılığına; ihtar şartı; duruşmasız; tekerrüre esas olmaz | Sn | [185] ve ikizi (iki soru) | "İhlal tutanağı sonunda Cumhuriyet Başsavcılığına gider" bilgisi ölçülmüş. Y 13/5 ve 13/8'in son halkası doğru şık olmaz |
| Kanun md 9: iki hafta; itiraz mercii; bir hafta | S, M | [184]; banka md 9 (iki soru) | Y 14/1 sorulmaz; "iki hafta" ve "bir hafta" şıkta yer almaz |
| Kanun 8/2: altı ay | S | [182], [195] (iki soru) | "altı ay" şıkta yer almaz |
| Kanun 8/4: kolluk kararı tutanakla derhâl tebliğ; ret yalnız korunan kişiye | M | banka md 8 (iki soru) | Y 11/1 tebliğ sorusu "tutanakla derhâl" kalıbını kullanmaz |
| Kanun 10/5: tebliğ edilmemesi uygulamaya engel değil | Sn | banka md 10 | Y 11/3 vakasında "tebliğ edilemeyen Karar uygulanamaz/uygulanır" önermesi yazılmaz |
| Kanun 10/4: kolluk kişiyi Bakanlık müdürlüğüne ulaştırır | M | banka md 10 | — |
| UY 35/5: kolluğun kontrol yöntemleri; 35/3 uzlaşma önerilemez; 35/6 saat 16.00 | Ş, S | banka UY md 35 (üç soru) | Y 11/3'ün atfı (UY 35/5) içerikle açılmaz; açılırsa üç sorunun malzemesini verir |
| UY md 3: gecikmesinde sakınca; kolluğun tahkikat ve risk değerlendirmesi | K | banka UY md 3 | Y 9/2-c'deki kolluk raporu sorusu "risk değerlendirmesi" sözünü doğru şıkta taşımaz |
| UY md 28: tutanak Cumhuriyet başsavcılığına ve ŞÖNİM'e | M | banka UY md 28 | Y 13/5 ("kolluğa ve bilgi için ŞÖNİM'e") ile ikiz kurmaz |
| ŞÖNİM Yön.: sosyal çalışmacı; veri | M | [193]; GK başlığında bir soru | istisnada değil; dayanak olmaz |

**Ölçülmemiş (bu Yönetmeliğe özgü):** 7/3; 8; 9/1–7; 11/1–3; 12/1–4; 13/1–8; 15/1, 15/3–5; 16; 17; 18; 20/2–3; md 3'ün Y'ye özgü tanımları (asgari mesafe, tampon bölge, yasak bölge, güvenli bölge, izleme üniteleri, uygulama ekibi, Komisyon, yükümlü).

**Çakışma dosyası (119):** ilgili 9 · sınır 29 · ilgisiz 81.
- **İlgili (9):** Kanun md 12 (2), md 13 (2), md 9 itiraz süresi (1); UY md 38 "tedbir kararlarına aykırılık" (2); [187]; [194].
- **Sınır (29):**
  - Kanun (13): md 8 (altı ay iki kez; ret tebliği; kolluk tebliği; delil aranmaz; eşya teslimi), md 9 mercii, md 10 (iki soru), md 5 (kolluk amiri tedbiri, onay), UY tanım sorusu [197], ŞÖNİM Yön. [193];
  - UY (7): md 35 (üç soru), md 3 risk değerlendirmesi, md 10 geçici koruma, md 28, md 5;
  - CMK md 140 "teknik araçlarla izleme" (6): ad benzerliği. Süreleri (üç hafta, dört hafta, bir hafta) bu partide çeldirici olmaz;
  - PVSK Ek 7 teknik araçlarla izleme (1); 6136 md 7'deki 6284 vakası (1); GK başlığındaki ŞÖNİM Yön. sorusu (1).
- **İlgisiz (81):** Anayasa 8; 657 görevden uzaklaştırma 11; 7068 4; 5395'in 11'i; 5393 3; İdare 3; TCK 3; CMK'nın kalan 8'i; Kanun'un geçici maddi yardım ve tedbir listesi soruları 6; UY'nin 7'si; kalan tek sorular.
- **Elektronik kelepçe geçen CMK md 109 ya da 5275 sorusu çakışma dosyasında yok.** Süzgeçte "elektronik kelepçe" vardı; eşleşme çıkmadı. "Elektronik cihaz" ve "denetimli serbestlik" süzgeçte yoktu; orkestratör `doc39-benzer-ara.ts` ile bütün bankayı tarar.

## §3 Öncelikli hükümler

| md | Değer | Açı | Neden önemli |
|---|---|---|---|
| 13/1, 13/2 ↔ 13/4 ↔ 13/7 | Y | A, Sn [K→K] ◆ | İki aşamalı düzen: önce uyarı, uyarıya rağmen ihlal. Tampon bölgeye girme ve alıcı cihazı taşımama ya da şarj etmeme uyarı sebebidir; Karar ihlali değildir. Kolluk sezgisi ("ihlal → tutanak → savcılık") yanıltır. |
| 9/2-c, 9/5 | Y | M [K→K] ◆ | Asgari mesafe raporunu ilgili kolluk birimi hazırlar; Kararda asgari mesafe yoksa öneriyi ve güvenli bölgeleri yine o belirler. Aday "teknik iş" diye izleme merkezine ya da Komisyona verir. Sahadaki polisin yaptığı tek hukuki değerlendirme budur. |
| 7/3 | O/Y | M [K→K] ◆ | İki il çakışınca mağdurun ikamet ettiği yerin kolluğu. Cihaz yükümlüde olduğu için "yükümlünün yeri" güçlü çeldiricidir. |
| 9/4 | O/Y | Ş [K→K] | Komisyon değerlendirmesi karar için ön şart değildir; Komisyonsuz gelen talepte değerlendirme hâkim isterse yapılır. "Komisyon raporu olmadan karar verilemez" sanan aday yanılır. |
| 12/2 | O | S (başlangıç ve bitiş anı) | İzleme süreci ünitelerin teslimiyle başlar, geri alınmasıyla sona erer. Karar tarihi, tebliğ ve sistem aktivasyonu (16/4) gerçek çeldiricilerdir. |
| 12/1 | O | K | Karar, ilgili tedbir kararları olmaksızın tek başına uygulanamaz. Y'ye özgü; doğru önerme malzemesi. |
| 20/2 | O/Y | İ | İhlal ve uyarı görüşmeleri kayıt altına alınır ve bu, aktivasyon sırasında bildirilir; bunun dışında ses ve görüntü kaydı yasaktır. Kanun 12/1'i bilen eksik aday "hiç kayıt olmaz" der. |
| 13/3 | O | Sn | Mağdur cihazı şarj etmez, taşımaz ya da yükümlüye yaklaşırsa: mağdura ulaşılır, yönlendirme ve bilgilendirme yapılır. Yaptırım ya da kaldırma talebi yok. Sezgiyle bulunur; yalnız doğru önerme. |
| 13/5 | O | M ◆ | İhlal tespit tutanağını izleme personeli düzenler; Cumhuriyet Başsavcılığına gönderilmek üzere ilgili kolluk birimine, bilgi için ŞÖNİM'e ulaştırılır. Son halka bankada (UY 38). |
| md 6 ↔ md 7/2 | O | A ◆ | Merkezdeki izleme personeli ile ildeki uygulama ekibinin iş bölümü. [194] ailesi. |
| 15/1, 15/3, 15/5 | D/O | S, M | Uzatma ve kaldırma takvimi. ŞÖNİM'in işi; kolluk yalnız bilgilendirilir. |
| 9/1, 3/m | D/O | K ◆ | Komisyonun bileşimi (asgari üç). GYS tarzı liste. |
| 20/3 | D | S | Veriler 5 yıl saklanır. Metinde başka "yıl" değeri yok; çeldiriciler uydurma olur. |
| 4, 5, 6, 8, 16, 17, 19 | D | — | İç işleyiş, görev listesi, koordinasyon. |
| 1, 2, 21, 22 | — | — | Yasak kalıp. |

## §4 Değer tabloları

### Madde madde

| md | Hüküm (kısaltılmış) | Açı | Değer | ◆ | [K→K] | Varsayılan cevap riski | Karar |
|---|---|---|---|---|---|---|---|
| 1 | Amaç; iki bakanlığın iş ve işlemleri | K | — | | | — | dışarıda |
| 2 | Dayanak Kanun md 12 | — | — | | | [199] | dışarıda |
| 3 | 26 tanım | K, A | D (ezber) / O (ayırt etme) | ◆ | | tanım ezberi | tek başına tanım sorusu yok; §5 malzemesi |
| 4/1 | Kararların gereği EGM'de kurulu izleme merkezinde yerine getirilir | M | D | ◆ | | **yüksek**: "EGM / İçişleri" polis adayının varsayılanı | sorulmaz (RED dersi 1) |
| 4/2 | Yedi gün yirmi dört saat | S | D | | | ✱ ŞÖNİM ile aynı | sorulmaz |
| 4/3 | Personeli EGM ve JGK uygun görür | M | D | ◆ | | varsayılan | sorulmaz |
| 4/4–5, 4/7–10 | Koordinasyon, veri sistemi, ekran, arşiv, iletişim listesi | — | D | | | — | dışarıda |
| 4/6 | Merkeze üçüncü kişi ve ziyaretçi giremez; kayıt cihazıyla girilmez | K | D | | | sağduyu | dışarıda |
| 4/11–14 | İhlalde yapılacaklar (md 13'ün özeti) | Sn | — | ◆ | | md 13 ile ayna | md 13 üzerinden |
| 5 | İzleme merkezi amirinin görevleri | A | — | | | — | bankada ([194]) |
| 6/1 | İzleme personelinin görevleri (13 bent) | A | O | ◆ | | işlev mantığıyla bulunur | yedek Y1 |
| 6/1-ç | Kararın sona ermesinden on beş gün önce bilgilendirme | S | D | | | ✱ (C-2) | sorulmaz |
| 6/2 | Gizlilik; bilgileri üçüncü kişilerle paylaşamaz | K | D | | | sağduyu | dışarıda |
| 7/1 | Uygulama ekibi eğitim almış kolluk görevlilerinden | K | D | ◆ | | Kanun md 11 aynası | sorulmaz |
| 7/2 | Uygulama ekibinin görevleri (9 bent) | A | O | ◆ | | işlev mantığı | yedek Y1 |
| 7/2-ç | İtiraz beyanı: tutanak Cumhuriyet Başsavcılığına | M | D | ◆ | | C-10 | sorulmaz |
| 7/3 | Farklı il: mağdurun ikamet ettiği yerdeki sorumlu kolluk birimi | M | O/Y | ◆ | evet | orta: "mağdur önce gelir" sezgisi | **p1 #3** |
| 8 | Vaka tespiti: tedbirlerin yetersiz kalması, olağan akışın aksaması; tespit eden birimler; ŞÖNİM'e gönderme | Ş, M | D/O | ◆ | | "ŞÖNİM'e gönderilir" varsayılan | dışarıda |
| 9/1 | Komisyon: ŞÖNİM Müdürü, en az bir meslek elemanı, polis irtibat görevlisi ya da jandarma personeli; asgari üç; Büro Amiri davet edilebilir | K | D/O | ◆ | | düşük | yedek Y2 |
| 9/2 | Komisyon uygunluğu, kararın alınmasını, uzatılmasını ve kaldırılmasını değerlendirir | K | O | | | — | doğru önerme |
| 9/2-a | Meslek elemanının durum değerlendirme raporu; yükümlü hakkında resmî kayıtlardan bilgi (polis irtibat görevlisi) | M | D/O | ◆ | | — | çeldirici kaynağı |
| 9/2-b | Gerek görülürse yükümlüyle Bakanlık il müdürlüğünde görüşülebilir | K | D | | | — | çeldirici kaynağı |
| 9/2-c | Asgari mesafe raporunu ilgili kolluk birimi hazırlar; ölçütler; ŞÖNİM'e gecikmeksizin | M, Ş | Y | ◆ | evet | düşük: aday izleme merkezini ya da Komisyonu seçer | **p1 #2** |
| 9/3 | Nihai değerlendirme raporu Komisyonun; Karar talebini ŞÖNİM aile mahkemesine sunar | M | O | | | orta: ŞÖNİM en sık geçen ikinci aktör | çeldirici ve doğru önerme |
| 9/4 | Komisyondan geçmeden mahkemeye ulaşan vaka: hâkim isterse değerlendirme | Ş | O/Y | | evet | düşük | **p1 #4** |
| 9/5 | Kararda asgari mesafe yoksa: öneri ve güvenli bölgeleri ilgili kolluk birimi belirler; ŞÖNİM ek Karar talebini Kararı veren mahkemeye sunar | M, Sn | Y | ◆ | evet | düşük | p1 #2 ile birlikte (ikisi tek yuva) |
| 9/6 | Uzatma ya da kaldırma değerlendirmesi en az on beş gün önce | S | D | | | ✱ (C-2) | sorulmaz |
| 9/7 | Elverişli bulunmayan vakada ŞÖNİM müdahale planı hazırlar; gerekirse tedbir talep eder | Sn | D/O | | | yüksek: sağduyu | doğru önerme |
| 10 | Karar ŞÖNİM, kolluk, mağdur ya da Cumhuriyet savcısınca aile mahkemesi hâkiminden talep edilir | M | D | ◆ | | Kanun 8/1 aynası | sorulmaz |
| 11/1 | Kararı uygulama ekibi, ilgili kolluk biriminde, farklı zamanlarda, ivedilikle tebliğ eder | M | O | ◆ | | **yüksek**: polis adayı kolluğu seçer; "farklı zamanlarda" sağduyu | doğru önerme |
| 11/2 | Tebliğde ihtar; kurulumu kabul etmezse itiraz prosedürü; itiraz durdurmaz | Sn | D | ◆ | | C-8; ihtar bankada | sorulmaz |
| 11/3 | Tebliğ ya da uygulama mümkün değilse: tutanak; mahkemeye sunulmak üzere ilgili kolluk birimine, bilgi için ŞÖNİM ve izleme merkezine; araştırma sürer | Sn, M | O | ◆ | evet | yüksek: "tutanak tutulur, bildirilir" | yedek Y4 |
| 12/1 | Karar tek başına uygulanamaz | K | O | | evet | düşük | **p1 #5** önermesi |
| 12/2 | İzleme süreci teslimle başlar, geri alınmayla biter | S | O | ◆ | | düşük | **p1 #5** önermesi ya da yedek Y5 |
| 12/3 | Asgari mesafe sisteme kaydedilir; tampon ve yasak bölge haritada işaretlenir | — | D | | | C-1 | sorulmaz |
| 12/4 | İzleme merkezde yapılır | — | D | | | varsayılan | sorulmaz |
| 13/1 | Önce uyarı, uyarıya rağmen ihlal hâlinde ihlal prosedürü | Sn | Y | ◆ | evet | orta: "en hafif işlem" kestirmesi | **p1 #1** |
| 13/2-a, b | Uyarı hâlleri: tampon bölgeye girme; alıcı cihazı taşımama ya da şarj etmeme | A | Y | ◆ | evet | "tampon" sözcüğü uyarıyı çağırır | p1 #1 (kök 13/2-b ile kurulur) |
| 13/2-c | Kelepçeye ve alıcı cihaza zarar verecek müdahale | A | — | | | C-4 | sorulmaz |
| 13/3 | Mağdurun ihmali ya da yaklaşması: yönlendirme ve bilgilendirme | Sn | O | | | yüksek: sağduyu | doğru önerme |
| 13/4-a | Uyarıya rağmen yasak bölgeye girmeye devam: ihlal | A | Y | ◆ | evet | — | p1 #1'in karşı ucu |
| 13/5 | İhlal tespit tutanağı: izleme personeli; kolluğa ve bilgi için ŞÖNİM'e | M | O | ◆ | | son halka bankada | yedek Y3 |
| 13/6 | Uyarı ve ihlal hâllerinde ve teknik kesintide mağdur eş zamanlı aranır, güvenli bölgeye geçmesi istenir | Sn | D/O | | | yüksek: "mağdurun güvenliği önce" | doğru önerme; hiçbir soruda çeldirici olmaz |
| 13/7 | İhlal sürerse ya da kelepçe çıkarılırsa: acil çağrı hatları ve ilgili kolluk birimleri; koordinat | Sn | O | ◆ | | yüksek: "derhal kolluğa" | çeldirici (uyarı sorusunda) |
| 13/8 | Kolluk müdahale eder; Cumhuriyet savcısını ivedilikle bilgilendirir; tutanak; Kanun md 13 | Sn | D | ◆ | | yüksek; bankada | sorulmaz |
| 14 | İki hafta, aile mahkemesi; itiraz durdurmaz | S | — | | | bankada | sorulmaz |
| 15/1 | On beş gün önce değerlendirme; on gün önce talep mahkemeye | S | D/O | | | ✱ | zayıf yedek Y6 |
| 15/2 | En az yedi gün önce bildirim | S | — | | | bankada | sorulmaz |
| 15/3 | Kaldırma talebi: Komisyon değerlendirir, ŞÖNİM mahkemeye sunar | M | D/O | | | ŞÖNİM varsayılanı | doğru önerme |
| 15/4 | Karar bitince izleme personeli tarafları uygulama ekibine yönlendirir | M | — | | | C-6 | sorulmaz |
| 15/5 | Uzatma gecikirse ya da takip yapılamazsa ŞÖNİM müdahale planı | Sn | D | | | sağduyu | dışarıda |
| 16 | Davet (farklı zamanlarda), hijyen, takma, kılavuz, tutanak, aktivasyon | — | D | ◆ | | sağduyu | 16/4 "aktivasyon" çeldirici kaynağı |
| 17 | Çıkarma ve geri alma; tutanaklar uygulama ekibince dosyalanır | — | D | ◆ | | C-6 | dışarıda |
| 18 | Zarar ya da engelleme: tutanak, suç duyurusu; ayrıca Karar ihlali | F | — | ◆ | | C-4, C-9 | sorulmaz |
| 19 | Koordinasyon, form, eğitim | — | D | | | — | dışarıda |
| 20/1 | Verilerin tutulması ve paylaşılması | — | D | | | C-11 | dışarıda |
| 20/2 | Görüşmeler kayda alınır, aktivasyonda bildirilir; başka kayıt yasak | İ | O/Y | | evet | ters sezgi: "hiç kayıt olmaz" | **p1 #5** önermesi |
| 20/3 | 6698'e uygun; 5 yıl saklanır | S | D | | | tek sayı; uydurma dizi gerekir | dışarıda |
| 21–22 | Yürürlük, yürütme | — | — | | | yasak kalıp | dışarıda |

### Süreler ve sayılar

| Değer | Yer | Bankada |
|---|---|---|
| on beş gün ✱ | 6/1-ç izleme personelinin bildirimi · 9/6 Komisyon değerlendirmesi ("en az") · 15/1 Komisyon değerlendirmesi | hayır; C-2 nedeniyle doğru şık olmaz |
| on gün | 15/1 uzatma talebinin mahkemeye sunulması | hayır |
| en az yedi gün | 15/2 ŞÖNİM'in kolluğa ve merkeze bildirimi | **evet** ([187]) |
| iki hafta | 14/1 itiraz | evet (Kanun md 9 adıyla) |
| yedi gün yirmi dört saat ✱ | 3/r ŞÖNİM · 4/2 takip işlemleri · 11/2 ihtar | Kanun'da; sorulmaz |
| 5 yıl | 20/3 verilerin saklanması | hayır |
| asgari üç | 3/m, 9/1 Komisyon üyesi | hayır |
| en az bir | 3/m, 9/1 meslek elemanı | hayır |

Metinde saat, ay ya da oran yok. Kararın azami süresi yok ⚑. Sürelerin hepsi "sürenin sona ermesinden önce" kalıbındadır; bir süre sorusu kurulursa üç gerçek değer (yedi, on, on beş) hazırdır ama biri bankada, biri ✱.

### En sık geçen merci ve zaman değerleri (betikle sayıldı)

| Değer | Geçiş | Varsayılan riski |
|---|---|---|
| izleme merkezi | 36 | en sık aktör; "teknik iş → izleme merkezi" |
| ŞÖNİM | 29 | "sosyal iş ve talep → ŞÖNİM"; bildirimlerin çoğunda "bilgi için ŞÖNİM'e" |
| kolluk (hepsi) | 24; "ilgili kolluk birimi" 12 | polis adayının varsayılanı |
| izleme personeli | 15 | — |
| uygulama ekibi | 15 | adı işlevini verir ("uygulama") |
| Komisyon | 14 | "değerlendirme → Komisyon" |
| aile mahkemesi | 8 | talep ve itirazın tek mercii |
| Cumhuriyet Başsavcılığı | 4 (7/2-ç, 13/5, 13/8, 18/1) | "ihlal → savcılık" |
| ivedilikle | 8 | zaman kaydı sorulmaz: hepsi aynı |
| gecikmeksizin | 2 (ikisi de 9/2-c) | — |

## §5 Ayırt etme malzemesi

- **Uyarı ↔ ihlal** (13/2 ↔ 13/4) [K→K]
  - Uyarı: tampon bölgeye girme; alıcı cihazı taşımama ya da şarj etmeme. İzleme personeli yükümlüyle iletişime geçer.
  - İhlal: uyarıya rağmen yasak bölgeye girmeye devam. İhlal tespit tutanağı düzenlenir.
  - İhlal sürerse ya da kelepçe çıkarılırsa: acil çağrı hatları ve ilgili kolluk birimleri, koordinat (13/7).
  - Zarar verme iki yerde iki ayrı sonuca bağlanmış (C-4); ayırt edici unsur olmaz.
  - Mağdurun eş zamanlı aranması (13/6) uyarıda da ihlalde de vardır; iki tarafı ayırt etmez, şıkta yer almaz.
- **Yükümlünün ihmali ↔ mağdurun ihmali** (13/2-b ↔ 13/3)
  - Aynı fiil (alıcı cihazı şarj etmeme, taşımama): yükümlüde uyarı prosedürü, mağdurda yönlendirme ve bilgilendirme.
  - Mağdurun yükümlüye yaklaşması da 13/3'tedir; Karar ihlali sayılmaz.
- **Asgari mesafe ↔ yasak bölge ↔ tampon bölge ↔ güvenli bölge** (3/c, 3/u, 3/s, 3/e)
  - Yasak bölge: Karara göre yaklaşmanın yasak olduğu konut, işyeri, okul ve benzeri yerler. Kaynağı mahkeme kararı.
  - Tampon bölge: yasak bölgeye ilaveten belirlenen ek ya da ara bölge. Amacı hızlı müdahale ve mağduru güvenli bölgeye ulaştırmak. Belirleyeni iki okumalı (C-1).
  - Asgari mesafe: yükümlünün mağdura zarar vermesini engelleyecek mesafe. Raporu ve önerisi ilgili kolluk biriminden (9/2-c, 9/5); Kararda belirlenir (9/5 "Kararlarda asgari mesafenin belirlenmemiş olması halinde"); merkezde sisteme kaydedilir (12/3).
  - Güvenli bölge: yükümlünün zarar verme ihtimalinin düşük olduğu yer ya da konum. Kararda asgari mesafe yoksa güvenli bölgeleri ilgili kolluk birimi belirler (9/5).
  - **Temiz ayrım yalnız şudur:** tampon bölge mahkeme kararındaki yasak bölgeye ilavedir ve ona girmek ihlal değil uyarı sebebidir. "Kim belirler" ekseni yalnız asgari mesafe raporu ve güvenli bölgede temizdir.
- **Komisyon ↔ ŞÖNİM ↔ hâkim** (9/2–9/4, 10, 15/3)
  - Komisyon değerlendirir ve nihai raporu hazırlar; karar vermez, talepte bulunmaz.
  - Talebi aile mahkemesine ŞÖNİM sunar (9/3, 9/5, 15/1, 15/3). md 10'a göre kolluk, mağdur ve Cumhuriyet savcısı da talep edebilir.
  - Kararı hâkim verir (bankada). Komisyonsuz talepte değerlendirme hâkim isterse yapılır (9/4).
  - Komisyon ŞÖNİM bünyesindedir (Bakanlık); izleme merkezi EGM bünyesindedir. Aday ikisini çaprazlar.
- **İzleme personeli ↔ uygulama ekibi ↔ ilgili kolluk birimi**
  - İzleme personeli (merkez; EGM ve JGK): ekran, uyarı ve ihlal prosedürü, ihlal tespit tutanağı, mağduru arama, on beş gün önce bildirim.
  - Uygulama ekibi (il; Büro Amirliği ya da jandarma birimi): ünite talebi, tebliğ, takma, geri alma, arıza, iade, 11/3 tutanağı.
  - İlgili kolluk birimi: asgari mesafe raporu, müdahale, Cumhuriyet savcısına bilgi.
  - **Uygulama ekibi ilgili kolluk biriminin içindedir.** İkisi aynı şık takımına girmez (iç içe merci; iki doğru doğar).
- **Bildirim zincirleri** (çeldirici kaynağı; doğru şık olmaz)
  - 4/14 ve 13/5: ihlal tespit tutanağı → ilgili kolluk birimi (Cumhuriyet Başsavcılığına gönderilmek üzere) + bilgi için ŞÖNİM.
  - 11/3: uygulanamama tutanağı → ilgili kolluk birimi (mahkemeye sunulmak üzere) + bilgi için ŞÖNİM ve izleme merkezi.
  - 13/8: kolluk tutanağı → Cumhuriyet Başsavcılığı.
  - 18/1: zarar tutanağı → Cumhuriyet Başsavcılığına suç duyurusu.
  - 7/2-ç: itiraz beyanı tutanağı → Cumhuriyet Başsavcılığı.
- **Karar ↔ tedbir kararı** (12/1): takip kararı tek başına uygulanamaz; koruyucu ya da önleyici tedbir kararının takibidir (3/ş, 8).
- **Komşu rejimler (hepsi ⚑ metin dışı; bu klasörde CMK ve 5275 metni yok, içerik bankadan doğrulanmadı)**
  - CMK md 109: adli kontrol yükümlülüklerinin elektronik cihazla takibi. Ceza muhakemesi tedbiridir; şüpheli ya da sanık hakkındadır.
  - 5275 ve denetimli serbestlik: konutta infaz ve denetimli serbestlikte elektronik izleme. Hükümlü hakkındadır; izleme Adalet Bakanlığı teşkilatındadır.
  - CMK md 140 "teknik araçlarla izleme" ve PVSK Ek 7: delil ve istihbarat amaçlı izleme; ad benzerliğinden ibaret.
  - Aday bunları karıştırır. Bu yüzden "denetimli serbestlik müdürlüğü", "infaz hâkimliği" ve "sulh ceza hâkimliği" çeldirici merci olabilir; yanlışlıkları Y metniyle kanıtlanır (Y işi başka aktöre verir). Açıklama bu rejimlerin içeriğini anlatmaz. Partide en çok bir soruda, en çok bir şıkta kullanılır (uydurma değer sayımına girer).

## §6 Kaçınılacaklar (BAĞLAYICI)

- **Bankada ölçülmüş:** §2'deki her şey. Özellikle:
  - kararı hâkimin vermesi; yönetmelikle düzenleme;
  - zorlama hapsinin süreleri ve ihtarı; "tutanak Cumhuriyet başsavcılığına iletilir";
  - iki hafta, bir hafta, altı ay;
  - 15/2'nin yedi günü; md 5 bentleri ve 6/1-b, 6/1-i.
- **Kanun'un ve UY'nin aynası:** "Metnin durumu" B tablosundaki bütün ayna hükümler. Komşu mevzuatla aynı cümleyi taşıyan hüküm, çeldirici değiştirilerek de sorulmaz (09 brifi, 22 Kas kural 4).
- **Varsayılan ve sağduyu** (tek başına soru olmaz):
  - "kararı hâkim verir"; "talep aile mahkemesine sunulur";
  - "ihlalde derhal kolluğa bildirilir" (13/7, 4/12);
  - "mağdur aranır, güvenli bölgeye yönlendirilir" (13/6, 4/13, 6/1-ğ);
  - "tutanak tutulur ve bildirilir" (11/3, 13/5, 13/8, 18/1);
  - "taraflar farklı zamanlarda çağrılır" (11/1, 16/1);
  - "elverişli değilse müdahale planı hazırlanır" (9/7, 15/5);
  - "merkez EGM'dedir" (4/1); "merkeze ziyaretçi giremez" (4/6); "personel gizliliğe uyar" (6/2);
  - "mağdur cihazı şarj etmezse bilgilendirilir" (13/3);
  - "itiraz uygulamayı durdurmaz" (14/2);
  - "kolluk tebliğ eder" (11/1): polis adayının hiyerarşi varsayılanı; 7201-p1-03 emsali.
- **Metin dışı (⚑):**
  - Kararın azami süresi ve uzatma sayısı; "altı ay";
  - mağdurun rızası; mağdurun üniteyi reddetmesi;
  - yükümlünün kurulumu reddetmesinin sonucu; zorla takma;
  - ünitenin su geçirmezliği, şarj süresi, GPS, mesafe değerleri (metre);
  - kelepçeyi çıkarmanın ya da zarar vermenin hangi suçu oluşturduğu (TCK);
  - zorlama hapsinin kaç gün verileceği (Kanun md 13; bankada);
  - CMK md 109, 5275, denetimli serbestlik, CMK md 140, PVSK Ek 7'nin içeriği;
  - ŞÖNİM Yönetmeliği ve UY'nin içeriği (11/3'ün atfı dahil);
  - Aile ve Sosyal Hizmetler Bakanlığının kuruluşu, eski adlar;
  - KADES uygulaması; 155/156'nın bugünkü durumu;
  - 6698'in içeriği (20/3 yalnız atıf yapar).
- **İki okumalı:** "Metnin durumu" C tablosunun tamamı. Özellikle tampon bölgeyi kimin belirlediği; zarar vermenin uyarı mı ihlal mi olduğu; kelepçenin çıkarılmasının hangi prosedüre girdiği; Karar bitince kimin kime yönlendirdiği; suç duyurusunu kimin yaptığı.
- **İç içe merciler** (aynı şık takımına girmez):
  - uygulama ekibi ↔ ilgili kolluk birimi ↔ Büro Amirliği;
  - izleme merkezi ↔ izleme personeli ↔ izleme merkezi amiri;
  - ŞÖNİM ↔ Komisyon ↔ ŞÖNİM Müdürü (yalnız "nerede oluşturulur" sorusunda değil, işlem sorularında);
  - Bakanlık il müdürlüğü ↔ ŞÖNİM (ŞÖNİM il müdürlüğüne bağlıdır ⚑; ilişki metinde yazmaz, bu yüzden ikisi birlikte şık olmaz);
  - polis irtibat görevlisi ↔ jandarma personeli (seçimlik üye).
- **Yasak kalıp:** yönetmeliği kimin çıkardığı, kimin yürüttüğü, dayanağı, yayım tarihi; birim adı ezberi; "kaç kişiden oluşur" tek başına; md 3'ten tırnaklı tanım → terim sorusu; görev listesinden öncüllü sayma ([194]'ün aynısı).
- **Zaman kayıtları:** "ivedilikle", "gecikmeksizin", "eş zamanlı" ayırt etmez; şıklar arasında fark olarak kullanılmaz.

## §7 Parti önerisi: `teknik-takip-p1` (en çok 5; önerilen 4)

**Dürüst değerlendirme.** Kestirmesiz ve sınav değeri taşıyan yuva sayısı dörttür; beşincisi (#5) önerme sorusu olduğu için kurulabilir ama en kırılgan olanıdır. PAEM ve Misyon bu yönetmeliği hiç sormadı; Kanun'u bile PAEM sormadı. `sinavDegeri` hiçbir yuvada 4'ü geçmez; #3 ve #4 3–4 arasındadır. İki turun sonunda 2–3 KABUL gerçekçi beklentidir. Yuva tek cevaba ya da kestirmesiz kuruluşa gelmiyorsa boş kalır; 0 soru da kabul edilebilir bir sonuçtur.

| # | Hüküm | Açı / kök | Zorluk | Doğal çeldirici kaynağı | Bilinen risk |
|---|---|---|---|---|---|
| 1 | 13/1, 13/2-b ↔ 13/4-a ↔ 13/7 ↔ 15/3 | [K→K] Sn. Kısa vaka ya da tek cümle: takip altındaki yükümlünün alıcı cihazı yanında taşımadığı (ya da şarj etmediği) izleme personelince tespit edilmiştir; ilk olarak yapılacak işlem. Doğru: yükümlüyle iletişime geçilerek uyarı prosedürünün uygulanması | orta | ihlal tespit tutanağı düzenleyip ilgili kolluk birimine ulaştırma (13/5; kolluk sezgisi); acil çağrı hatlarıyla koordinat paylaşma (13/7); Kararın kaldırılması için Komisyon değerlendirmesi isteme (15/3; "elverişsiz vaka" sezgisi); ünitenin arızası için uygulama ekibini görevlendirme (7/2-e; "teknik sorun" sezgisi) | "En hafif işlem" kestirmesi doğruyu verir. Kör çözücü salt şıkla ≥%60 buluyorsa yuva düşer. Kök "tampon bölge" ile kurulmaz (sözcük uyarıyı çağırır). Zarar verme ve çıkarma kökte yer almaz (C-4, C-5). Mağdurun aranması şık olmaz (13/6 her iki hâlde doğru). "Suç duyurusu" şık olmaz (C-9) |
| 2 | 9/2-c (+ 9/5) | M, doğrudan. Vakanın değerlendirilmesinde asgari mesafeye ilişkin değerlendirmeyi içeren raporu hangisi hazırlar. Doğru: ilgili kolluk birimi | orta–zor | izleme merkezi ("teknik iş"; en sık aktör); Komisyon ("değerlendirme"); ŞÖNİM'de görevli meslek elemanı (9/2-a'nın raporu); aile mahkemesi ("mesafeyi mahkeme belirler") | Uygulama ekibi şık olmaz (iç içe). Polis irtibat görevlisi şık olmaz (rapor onun "koordinesinde" hazırlanır; iki doğru). Kök "asgari mesafeyi kim belirler" diye kurulmaz (mahkeme mi kolluk mu, iki okumalı); "raporu hazırlayan" ya da 9/5 koşuluyla "öneriyi belirleyen" sorulur. Doğru şık "risk değerlendirmesi" sözünü taşımaz (UY md 3 sorusu). Varsayılan itirazı: "polis sınavında cevap polis". Savunma: dört çeldiricinin üçü sezgisel olarak daha güçlü; kör çözümle sınanır |
| 3 | 7/3 | [K→K] M. Şiddet mağduru ile yükümlü farklı illerde ikamet etmekte ve işlemlerde farklı il emniyet müdürlükleri yetkili olmaktadır; takip sürecine ilişkin işlemleri hangisi yürütür. Doğru: şiddet mağdurunun ikamet ettiği yerdeki sorumlu kolluk birimi | orta | yükümlünün ikamet ettiği yerdeki kolluk birimi (kelepçe onda; 3/ğ'nin ilk seçeneği); Kararı veren aile mahkemesinin bulunduğu yerdeki kolluk birimi; ihlalin gerçekleştiği yerdeki kolluk birimi (3/ğ "kararın uygulanacağı yer"); izleme merkezi (7/2-f: iller arası koordinasyon için merkeze bilgi verilir) | "Mağdur önce gelir" sezgisi doğruyu verebilir (ters ayırt etme). Kör çözücü salt şıkla buluyorsa yuva düşer. Dört şık "…yerdeki kolluk birimi" ile biter: ızgara izi; izleme merkezi şıkkı bunu kırar. Açıklama 3/ğ'yi "genel kural" diye nitelemez (metin öyle demez) |
| 4 | 9/4 (↔ 9/3) | [K→K] Ş. Komisyon değerlendirmesinden geçmeden aile mahkemesine ulaşan bir takip talebinde Komisyonun değerlendirme yapması neye bağlıdır. Doğru: hâkimin talep etmesine | orta | ŞÖNİM Müdürünün uygun görmesi; ilgili kolluk biriminin asgari mesafe raporunu göndermesi (9/2-c); şiddet mağdurunun başvurması (md 10'da talep eden); Cumhuriyet savcısının istemesi (md 10) | Şıklar "zorunlu ↔ hiç yapılmaz ↔ talep hâlinde" ekseninde kurulmaz (iki uç + orta; 09 brifi 22 Kas kural 1). Bu yüzden kök "neye bağlıdır" der ve bütün şıklar bir aktörün iradesidir. "Hâkim" yargısal iş için varsayılandır: kör çözücü "mahkemedeki işte hâkim ister" diye buluyorsa yuva düşer. Sınav değeri 3–4 |
| 5 | 12/1, 12/2, 20/2, 13/3 | "Kararın uygulanması" ile ilgili hangisi doğrudur (ya da YANLIŞTIR). Önerme sorusu; tırnaklı başlık resmî başlıktır. Önerme havuzu: (a) Karar, ilgili tedbir kararları olmaksızın tek başına uygulanamaz; (b) izleme süreci ünitelerin teslimiyle başlar, geri alınmasıyla sona erer; (c) ihlal ve uyarı görüşmelerinin kayda alınacağı aktivasyon sırasında bildirilir; (d) mağdurun alıcı cihazı şarj etmemesi hâlinde mağdura ulaşılarak yönlendirme yapılır | orta–zor | yanlış önermeler gerçek komşu değerle: süreç "Kararın tebliğiyle" ya da "sistemin aktivasyonuyla" başlar (11, 16/4); görüşmeler "kayda alınamaz" (20/2 ikinci cümlenin genellemesi; Kanun'u bilen eksik adayı çeker); mağdurun ihmali "uyarı prosedürü" gerektirir (13/2-b aktarımı); Karar "tedbir kararı bulunmasa da" uygulanır | En kırılgan yuva. YANLIŞTIR biçiminde yanlış önerme doğru önermelerden biriyle çelişmemeli; doğru önermeler sıra oluşturmamalı (teslim → aktivasyon → geri alma bir sıradır: (b) ile aktivasyon önermesi birlikte yazılmaz). "Doğrudur" biçiminde doğru şık (c) olursa en değerli hâlidir; dört yanlış önermenin her biri ayrı temadan gelir. (c)'nin açıklaması Kanun 12/1 ile çatışma yorumu yazmaz |

- **Kök tipi dağılımı (4–5 soru):** [K→K] 3 (#1, #3, #4), doğrudan merci 1 (#2), önerme 1 (#5). Olumsuz kök en çok 1 (yalnız #5 YANLIŞTIR seçilirse). Vaka en çok 1 (#1 ya da #3; ikisi birden vaka olmaz). Öncüllü yok. Boşluk yok. Sayı sorusu yok.
- **Önerilen dört:** #1, #2, #3, #5. #4 beşincidir; "hâkim" varsayılanı yüzünden en son yazılır.
- **Parti içi sızıntı:**
  - #1'in çeldiricisi "ihlal tespit tutanağını ilgili kolluk birimine ulaştırma" ile #2'nin doğru şıkkı "ilgili kolluk birimi" aynı aktördür; #1'de şık işlemle yazılır, merci vurgulanmaz.
  - #5'in (d) önermesi #1'in ayrımını (yükümlü ↔ mağdur) verir. #1 yazılmışsa #5'te (d) kullanılmaz.
  - #2 ile #4 ikisi de md 9'dandır; #4'ün çeldiricisi "kolluğun asgari mesafe raporunu göndermesi" #2'nin cevabını taşır. İkisi birlikte yazılırsa bu çeldirici "Bakanlık il müdürlüğünün görüşme raporunu göndermesi" (9/2-b) ile değiştirilir.
- **Uydurma değer:** partide en çok bir. Metin dışı merci ("denetimli serbestlik müdürlüğü", "infaz hâkimliği") bu sayıma girer; önerilen takımlarda yoktur, gerek kalmaz.

**Yedek yuvalar** (asıl yuva düşerse; hepsi asıllardan zayıf)

| Y | Hüküm | Açı | Neden yedek |
|---|---|---|---|
| Y1 | md 6 ↔ 7/2 | Hangisi uygulama ekibinin görevidir (A). Çeldiriciler md 6'dan ve 12/3'ten; [194]'ün kullandığı bentler hariç | [194] ailesi; işlev mantığıyla çözülür ("cihaz işi saha ekibinin"). Sınav değeri 3 |
| Y2 | 3/m, 9/1 (↔ 4/1) | Komisyon hangisinin bünyesinde oluşturulur (M; cevap ŞÖNİM). Polis adayının varsayılanı (izleme merkezi, il emniyet müdürlüğü) çeldiriciye bağlanır | Tanım sorusuna yakın. ŞÖNİM en sık ikinci aktör. Bileşim sorusu ("yer alır / yer almaz") kurulmaz: üye türü üçtür, biri seçimliktir |
| Y3 | 13/5 | İhlal tespit tutanağını hangisi düzenler (M; cevap izleme personeli) | İç içe merciler (izleme merkezi, amir) şık olamaz; kalan takım zayıf. Son halka bankada |
| Y4 | 11/3 | Yükümlüye ulaşılamadığı için Karar uygulanamıyorsa (V): tutanak, bildirim, araştırmanın sürmesi | "Tutanak tutulur ve bildirilir" varsayılanı. Kanun 10/5 sorusuyla temas. UY 35/5 atfı açılamaz |
| Y5 | 12/2 | İzleme süreci ne zaman başlar (S, an). #5 yazılmamışsa tek başına | Tek konumlu kolay soru. Çeldiriciler iyi (tebliğ, aktivasyon, Kararın verilmesi, tutanağın imzalanması) ama 16/4'te tutanak, teslim ve aktivasyon aynı işlemin parçaları: "teslim" ile "tutanağın imzalanması" iki doğru doğurabilir; o şık yazılmaz |
| Y6 | 15/1 | Uzatma talebi sürenin bitiminden kaç gün önce mahkemeye sunulur (S; cevap on) | [187]'nin ikizi. Usul takvimi ezberi; kolluğun işi değil. 15/2 ile sıra tutarsız (C-3). En son çare; önerilmez |

- **Dışarıda:** md 1, 2, 4, 5, 8, 10, 14, 16, 17, 18, 19, 20/1, 20/3, 21, 22; md 3'ten tanım sorusu; 6/1-ç, 9/6 (on beş gün); 11/2; 13/2-c, 13/8; 15/2, 15/4.

## §8 Bu yönetmeliğe özgü kurallar

### Üretici kuralları

1. **Kök kısa adı.** Resmî sorular tam adı yazıyor ([187], [194]: yaklaşık 100 karakter). Kullanıcının kısa ad kararı (11 Kas 2026) ve UY emsali ("6284 sayılı Kanun'a İlişkin Uygulama Yönetmeliği'ne göre") uygulanır:
   - **Önerilen:** "6284 sayılı Kanun Kapsamında Teknik Yöntemlerle Takip Yönetmeliği'ne göre,"
   - Daha kısa seçenek: "Teknik Yöntemlerle Takip Yönetmeliği'ne göre,". "6284" bağı kaybolur ve CMK md 140 "teknik araçlarla izleme" ile ad benzerliği artar; bu yüzden ikinci tercih.
   - "Elektronik Kelepçe Yönetmeliği" yazılmaz (resmî ad değil; ünite türlerinden yalnız biri).
   - Karar orkestratörün ve kullanıcınındır; partide tek yazım kullanılır. Madde, fıkra, bent numarası yazılmaz.
   - `sourceLabel`: "Mevzuat türetimi — Teknik Yöntemlerle Takip Yönetmeliği md …".
2. **Doğru cevap yalnız Y'ye özgü hükümden.** Kanun'un ya da UY'nin aynası olan hüküm (Metnin durumu B) doğru şık olmaz; olsa olsa doğru önerme ya da çeldirici olur.
3. **Ad kuralı** (Metnin durumu B) eksiksiz uygulanır. Birim adı ayırt edici olmaz.
4. **Terimler metindeki gibi:** yükümlü (şiddet uygulayan değil), şiddet mağduru (korunan kişi değil), izleme üniteleri, elektronik kelepçe, alıcı cihaz, tampon bölge, yasak bölge, güvenli bölge, asgari mesafe, uygulama ekibi, izleme personeli, ilgili kolluk birimi, ihlal tespit tutanağı, uyarı prosedürü, ihlal prosedürü, nihai değerlendirme raporu, müdahale planı.
   - "Alıcı cihaz" tanımlar maddesinde yok; md 13'te geçer. Soruda md 13'teki gibi kullanılır, tanımı sorulmaz.
5. **Ters ayırt etme yasağı.** §6'daki varsayılan ve sağduyu hükümleri tek başına soru olmaz. Her yuvada şu sezgiler ayrı ayrı sınanır: "en hafif işlem", "derhal kolluğa", "mağdur önce gelir", "hâkim karar verir", "polis sınavında cevap polis", "teknik iş izleme merkezinin", "talep ŞÖNİM'in".
6. **İç içe merciler aynı şık takımına girmez** (§6 listesi).
7. **C tablosundaki hükümler** ne doğru şık, ne yanlışlığı kanıtlanacak çeldirici, ne açıklama dayanağı olur. İstisna: 13/7'nin sonucu (koordinat paylaşma) #1'de çeldirici olabilir; yanlışlığı 13/1 ile kanıtlanır (önce uyarı).
8. **Açıklama.**
   - Y'nin iç tutarsızlıklarını ve Kanun'la gerilimini yorumlamaz.
   - Kanun md 13 sürelerini, iki haftayı, altı ayı yazmaz (bankadaki soruların cevabı).
   - [187]'nin (yedi gün) ve [194]'ün (amirin görevleri) cevabını vermez.
   - UY 35/5'i, ŞÖNİM Yönetmeliğini, CMK ve 5275'i içerikle anlatmaz.
9. **Sayı sorusu yazılmaz** (Y6 hariç, o da önerilmez). Bu partide süre dizisi kurulmaz; "kaç" kökü yoktur.
10. **Tanım sorusu yazılmaz.** md 3 tanımları yalnız ayırt etme sorusunun malzemesidir; tırnaklı tanım → terim kalıbı ([197]) GYS'nindir.
11. **Vaka** 1–2 cümle, ≤250 karakter; "bir yükümlü", "şiddet mağduru", "izleme personeli", "uygulama ekibi" unvanlarıyla; ad, şehir adı, hikâye yok. Cinsiyet belirtilmez (Y "yükümlü" ve "şiddet mağduru" der).

### Gözcü kontrol listesi

1. Doğru şık Y'ye özgü bir hükme mi dayanıyor? Kanun ya da UY aynasıysa RED.
2. Soru "Metnin durumu" C tablosundaki bir tutarsızlığa basıyor mu? (tampon bölgeyi belirleyen; zarar verme; çıkarma; yönlendirme; suç duyurusu mercii) Basıyorsa RED.
3. Şık takımında iç içe merci var mı? (uygulama ekibi + ilgili kolluk birimi; izleme merkezi + izleme personeli; ŞÖNİM + Komisyon; ŞÖNİM + il müdürlüğü)
4. Ad kuralı: eski bakanlık adı, "ASH", birim adı ezberi, 155/156 var mı?
5. Bankadaki dokuz ilgili soruyla ve iki resmî Y sorusuyla ([187], [194]) temas: şıkta ya da açıklamada onların cevabı geçiyor mu?
6. Kör çözüm: "en hafif işlem", "mağdur önce", "hâkim", "polis" sezgilerinden biri salt şıkla doğruyu veriyor mu? Veriyorsa RED (biçim değişikliği kurtarmaz).
7. Mağdurun aranması ve güvenli bölgeye yönlendirilmesi (13/6) çeldirici olarak kullanılmış mı? Kullanılmışsa iki doğru.
8. Metin dışı: Kararın süresi, mağdurun rızası, zorla takma, TCK suçu, CMK 109, denetimli serbestlik içeriği soruda ya da açıklamada var mı?
9. Zaman kayıtları ("ivedilikle", "gecikmeksizin") şıkları ayırt eden tek unsur mu? Öyleyse RED.
10. Sınav değeri: hüküm kolluğun sahada verdiği bir karara mı, yoksa ŞÖNİM'in ya da merkezin iç işleyişine mi ait? İç işleyişse `sinavDegeri` ≤ 2.

## Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

**Yönetmelik ve banka kaydı**
1. **Konu etiketi.** Bu yönetmeliğin iki resmî sorusu ([187], [194]) bankada "6284 Sayılı Ailenin Korunması Kanunu" konusunda, madde etiketsiz duruyor. `teknik-takip-mevcut-sorular.txt` bu yüzden boş; "bankada 0 soru" sayımı yanıltıcı. Aynı konuda madde etiketsiz dört UY sorusu ve bir ŞÖNİM Yönetmeliği sorusu ([193]) daha var. Bankada "6284 Sayılı Kanuna İlişkin Uygulama Yönetmeliği" konusu ayrıca mevcut; etiketlerin taşınması kullanıcı kararıdır.
2. **Banka metninde bölüm ve madde başlıkları yok** (resmî metinde 7 bölüm, 22 madde başlığı). Gövde aynı. Başlıklar eklenebilir; zorunlu değil.
3. **Banka metninin biçimi karışık:** md 3, 4, 6, 14–19 tek satır; öbür maddeler Resmî Gazete satır kırılımıyla. İçerik farkı yok.
4. **Resmî metnin kendi kusurları** (bankada da aynen): 20/1 "ilgili kuruluşlar paylaşılmasından"; md 10 "ulaşılabilecek yer aile mahkemesi hâkiminden"; 3/j "yasaklı bölge"; 9/1 "polis irtibat/jandarma görevlisi" ve "Çocuk ve Kadın Kısım Amiri".
5. **İç tutarsızlıklar:** "Metnin durumu" C tablosundaki 12 nokta. En önemlileri: tampon bölgeyi belirleyen (3/s ↔ 13/2-a); zarar vermenin uyarı mı ihlal mi olduğu (13/2-c ↔ 18/2); kelepçenin çıkarılmasının ihlal hâlleri arasında sayılmaması (13/4 ↔ 13/7).
6. **Kanun'la gerilim:** 20/2 izleme merkezi görüşmelerinin kaydına izin verir; Kanun 12/1 ve UY md 37 kayıt yasağını istisnasız yazar.
7. **Doğrulanamayanlar:** yönetmelik hakkında derdest ya da sonuçlanmış Danıştay davası; Kanun'a karşı AYM başvuruları; EGM ve JGK'daki birimlerin bugünkü adları; 155/156 hatlarının bugünkü durumu; CMK md 109 ve 5275'in ilgili hükümlerinin banka metni (bu klasörde yok).
8. **Bilgi kartları:** `docs/56-bilgi-kartlari/girdi/tts-1.json` ve `tts-2.json` bu yönetmeliğin kart girdileridir. Kartlar C tablosundaki tutarsız hükümlere (tampon bölgeyi belirleyen, zarar verme) dayanıyorsa aynı sorun onlarda da vardır; **kartlar bu çalışmada okunmadı.**

**Bankadaki 6284 soruları** (`6284-mevcut-sorular.txt`, 35 soru)
9. **Dokuz soru dört şıklı:** md 3 (JGK 2023), md 4, md 8 (2/4/6/8), md 12 (işlem türü), md 13, md 16, md 17 (iki soru), md 22. Hepsi resmî Misyon ve İçişleri GYS soruları. (Beş şık kuralı, 8 Eyl 2026.)
10. **Mükerrer çiftler:** "ilk defasında en çok kaç ay" iki kez (beş şıklı ve dört şıklı; [182], [195]); UY "tedbir kararlarına aykırılık … yanlıştır" iki kez, aynı yanlış önermeyle ([185] ve ikizi); md 17 "on altı yaş" iki kez ([190], [192]).
11. **Yasak kalıpta iki resmî soru:** md 12 "hangisi ile düzenlenir" ([199]) ve md 22 "görüşü alınan bakanlıklar" ([189]). md 22 sorusunun şıklarındaki bakanlık adlarının güncelliği ayrıca denetlenmeli (bu çalışmada denetlenmedi).
12. **md 9 sorusunun kökü "tefhim ve tebliğ"** der; Kanun "tefhim veya tebliğ" der. Resmî sorunun kendi yazımı ([184]); anahtar etkilenmez.
13. **Kanun md 2/a ve UY "Aile ve Sosyal Politikalar Bakanlığı"** der; md 25 "Bakanlar Kurulu yürütür" der. Resmî metinler de böyledir (şerhsiz eski ad). Bankadaki sorular "Bakanlık" dediği için sorun doğmuyor; yeni soruda ad kuralı uygulanır.
14. **UY banka metninde yazım artıkları:** "h âkim", "ara çlar", "Ayr ıca", "tanınır ." (sözcük içi boşluk); md 33 ve md 34'ün son satırı bir sonraki maddenin başlığı (`07-ek`'te bilinen kusur).
