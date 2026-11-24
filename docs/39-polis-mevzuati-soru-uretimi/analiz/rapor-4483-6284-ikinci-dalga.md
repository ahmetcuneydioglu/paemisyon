# 4483 · 6284 · 6284 Uygulama Yönetmeliği: ikinci dalga yuva analizi

Doc 39, 23 Kas 2026. Bu rapor soru yazmaz; 11 Kas 2026 turundan sonra üç metinde KALAN yuvaları çıkarır.

Kaynaklar:
- `mevzuat/4483.txt` (25 başlık), `4483-mevcut-sorular.txt` (47 soru);
- `mevzuat/6284.txt` (26 başlık), `6284-mevcut-sorular.txt` (35 soru);
- `mevzuat/6284-yonetmelik.txt` (48 madde), `6284-yonetmelik-mevcut-sorular.txt` (16 soru);
- `aday/4483-p1.json`, `6284-p1.json`, `6284y-p1.json`, `6284y-p2.json` ve `denetim/*-karar.json` (45 aday, 42 KABUL, 3 RED);
- `analiz/resmi-polis-mevzuati.txt` (358 soru), `resmi-idare-personel.txt` (408 soru), `rapor-polis-mevzuati.md`;
- komşu: `aday/3628-p1.json` (md 17), `aday/298-p1.json` (md 174), `3628-cakisma-sorulari.txt`, `teknik-takip-cakisma-sorulari.txt`.

Resmî metinler mevzuat.gov.tr'den 23 Kas 2026'da indirildi; üçü de betikle banka metniyle karşılaştırıldı. Dosyalar:
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/4483-6284/indirilen/` (`k4483.html`, `k6284.html`, `y17030.html`, `y17030-dis.html`),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/4483-6284/cikti/` (düz metinler ve `karsilastirma-*.txt`),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/4483-6284/betik/` (`html2txt.py`, `karsilastir.py`).

Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'da, tur biçim kararları `07-ek-4483-6284.md`'dedir; burada tekrarlanmaz.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **◆** kolluğun işlemine doğrudan değer. **⚑** metin dışı bilgi: ne doğru şık ne açıklama dayanağı olur. "Vars." bilmeyen adayın sezgisinin doğruya (D), yanlışa (Y) ya da iki yöne (—) gittiğini gösterir. 4483'te fıkra numarası metinde yazmaz; bu raporda sırayla sayılır (md 5'te ek fıkra ikinci fıkradır: takdir cümlesi 5/4'tür), köke yazılmaz.

## 0. Özet tablo ve dürüst değerlendirme

| Metin | Bankada | Resmî soru (iki korpus) | PAEM 8/9/10 | Asıl yuva | Yedek | Önerilen tavan |
|---|---|---|---|---|---|---|
| 4483 | 47 (37 gerçek + 10 türetim) | 31 (28 Polis + 3 İdare) | **0** | 3 (biri çekinceli) | 2 | **2** (en çok 3) |
| 6284 Kanunu | 35 (21 gerçek + 14 türetim); gerçeklerin 7'si başka metinden | 19 (Kanun 13, Uygulama Yön. 3, Teknik Takip Yön. 2, ŞÖNİM Yön. 1) | **0** | 2 (biri çekinceli) | 3 | **1** (en çok 2) |
| Uygulama Yönetmeliği | 16 türetim (+ Kanun konusunda duran 4 gerçek soru) | 3 (Adalet GYS 2023 ve 2025) | **0** | 1 (çekinceli) | 2 | **0–1** |

- **Üç metinde toplam gerçekçi verim 3–4 sorudur; 6'yı geçmez.** Bu, analistin üst sınırıdır. Üretici her yuvayı yeniden sınar; parti 2 soruyla kapanırsa bu beklenen sonuçtur.
- **PAEM öncülü doğrulanamadı.** Görev tanımındaki "4483'ü PAEM her dönem sorar" bilgisi korpusla doğrulanamadı: `resmi-polis-mevzuati.txt`'teki 47 PAEM sorusunda (8, 9, 10. dönem) 4483 ve 6284 sıfır kez geçer.
  - 4483'ü soranlar: İçişleri GYS (9), MEB GYS ve müfettiş yardımcılığı (16), JGK Dış Misyon 2023 (2), KPSS 2024 (1), Kaymakamlık 2020–2021 (2), hâkimlik 2021 (1).
  - 6284'ü soranlar: EGM Misyon 2023 (2), Misyon 2020 (2), JGK 2023 (2), Adalet GYS 2023 ve 2025 (10), İçişleri GYS (3).
  - Bankadaki gerçek soruların sınav etiketi taban dosyasında yazmaz; PAEM 5–7. dönem kaynaklı soru olup olmadığı **doğrulanamadı**.
- **Resmî sınavların sorduğu çekirdek bankada doludur.** 4483'te md 3 mercileri (11 soru), md 12 hâkim kararı (6), md 9 itiraz (8), md 8 kapsam (4); 6284'te tedbir listeleri (md 3, 4, 5: 8 soru), md 8 (6), md 17 (3). Kalan yönler ya iki seçeneklidir ya sağduyuyla bulunur ya da bankadaki bir sorunun kökünde, doğru önermesinde yazar.
- **Üç metin de temiz.** Banka metinleri resmî konsolide metinle gövdede sözcük sözcük aynıdır (4483: 25/25; 6284: 26/26; Yönetmelik: 48/48). Farklar yalnız madde sonuna yapışmış başlık ve dipnot artıklarıdır.
- **6284 hiç değişmemiştir.** Resmî konsolide metinde değişiklik tablosu, "Değişik/Ek/Mülga" şerhi ve iptal dipnotu yoktur; tek dipnot md 21'in kadro notudur. 7331 ve 7406 sayılı Kanunlar 6284'ü değiştirmemiştir (tabloda satırları yok). md 13 hakkında AYM kararı bulunup bulunmadığı metinden görülemez; **doğrulanamadı**.
- **Yönetmelik 18/1/2013 metnidir; hiç değişmemiştir.** Kurum adlarının çoğu eskimiştir (ad kuralı aşağıda).
- **Ters ayırt etme riski.** Bilmeyen adayı doğruya götüren sezgiler; soru bu sezgiyi kıran koşulla kurulur, kıramıyorsa yazılmaz:
  - "ilde görev yapanın izni validen, ilçede görev yapanınki kaymakamdan" (4483 md 3);
  - "suçüstü hâli izni kaldırır" (4483 2/3 — yarı doğru: ağır ceza şartı);
  - "üst varsa üstün mercii" (md 3 son fıkra, md 10);
  - "karar kesinleşince dosya savcıya gider" (md 11);
  - "mağdur hangi kapıya giderse orası yetkilidir" (6284 8/1);
  - "acil işi kolluk amiri yapar, sonra onaya sunar" (3/2, 5/2);
  - "6284'te her itiraz aile mahkemesine" (9/1);
  - "resmî kurum bildirmek zorundadır" (Yön. 4/1);
  - "tedbire uymayan hapse girer; hapsi savcılık infaz eder" (13/1, 13/3).

---

## Metnin durumu (BAĞLAYICI)

### Resmî metne erişim ve karşılaştırma

| Metin | Adres parametresi | Resmî / banka madde | Gövde farkı | Sonuç |
|---|---|---|---|---|
| 4483 | MevzuatNo=4483, Tur=1, Tertip=5 | 25 / 25 | 0 | Aynı. 19 "fark"ın hepsi resmî metinde bir sonraki maddenin başlığıdır (betik artığı) |
| 6284 | MevzuatNo=6284, Tur=1, Tertip=5 | 26 / 26 | 0 | Aynı. Tek gerçek fark: banka md 25'in sonunda md 21'e ait dipnot ("Bu maddede yer alan kadrolarla ilgili olarak … Resmi Gazete'ye bakınız") duruyor |
| Uygulama Yönetmeliği | MevzuatNo=17030, Tur=7, Tertip=5 (doğrulandı: RG 18.01.2013, 28532) | 48 / 48 | 0 | Aynı. md 17 ve 33'te yalnız sözcük içi boşluk artığı var |

- Karşılaştırma sözcük dizileriyle yapıldı; noktalama, düzeltme işareti, dipnot numarası ve satır kırığı süzüldü.
- Banka metinlerinde dipnot yoktur. 4483'ün sekiz dipnotu ve değişiklik tablosu, 6284'ün tek dipnotu resmî metinden okundu.
- Resmî Gazete ayrıca taranmadı. mevzuat.gov.tr'nin işlemediği bir değişiklik olup olmadığı **doğrulanamadı**.

### Değişiklik ve iptal kayıtları

**4483** (resmî tablo: 4778, 5232, 6745, KHK 703, 7196, 7547)

| Hüküm | Şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| 2/5 | 4778 (11/1/2003) ile ek | "765 sayılı TCK'nın 243 ve 245 inci maddeleri ile 1412 sayılı CMUK'un 154/4'ü kapsamında … bu Kanun hükümleri uygulanmaz." Atıf yapılan iki kanun da mülgadır; metin güncellenmemiştir | Madde numaraları hiç yazılmaz. Yeni kanunlardaki karşılıkları ⚑ (§6, Şüpheli nokta 1) |
| 3/b, 3/e | 7196 (24/12/2019) | (b): ilde ve merkez ilçede görevliler **ile kaymakamlar** hakkında vali. (e): "(b) ve (c) bentlerindeki hükümler saklı kalmak kaydıyla" Cumhurbaşkanı kararıyla atananlar hakkında Cumhurbaşkanı veya ilgili bakan | Güncel. Saklı kaydı bankada ölçülmemiş (§7 #1) |
| 3/d | KHK 703; dipnot [1] | "Başbakanlık" → "Cumhurbaşkanına veya Cumhurbaşkanlığına bağlı, ilgili veya ilişkili kuruluşlar" | "Başbakanlık", "Başbakan" hiç yazılmaz |
| 3/g, md 12, md 13 | KHK 703 (Genel Sekreter → İdari İşler Başkanı); **7547 (16/5/2025) geri çevirdi**; dipnot [2], [5], [7] | "Cumhurbaşkanlığı Genel Sekreteri"; "Bakan yardımcıları" (eski "müsteşarlar") | Banka metni 7547'yi taşır. "Cumhurbaşkanlığı İdari İşler Başkanı" ve "müsteşar" yeni soruda ne doğru şık ne çeldirici olur |
| 4/3, 4/4, 5/2, md 12, md 13 | 5232 (31/7/2004) | Güncel | — |
| 9/2 | 6745 (7/9/2016); dipnot [3] | "izin vermeye yetkili merciler tarafından verilen işleme koymama kararına karşı da şikâyetçi" eklendi | Bankada (türetim) |
| 9/3 | — | "Danıştay İkinci Dairesi" | Daire numarası hiç yazılmaz (Şüpheli nokta 2) |
| md 15 | 5232; dipnot [8] | "garaz, kin veya mücerret hakaret için" çıkarıldı; metinde "(...)" | "(...)" artık değil, resmî metindir |
| Ek 1, Geçici 3 | 6745 | Güncel | Ek 1 bankada (türetim) |
| Geçici 4 | KHK 703; 7547 ile birinci fıkra değişti | Geçiş hükmü | Kapsam dışı |

- AYM iptali: resmî metinde iptal dipnotu yok.
- 2024–2026: tablonun son satırı 7547'dir (16/5/2025).

**6284.** Değişiklik yok. Dikkat edilecek üç nokta:
- 1/2-a Kadınlara Yönelik Şiddet ve Aile İçi Şiddetin Önlenmesi ve Bunlarla Mücadeleye İlişkin Avrupa Konseyi Sözleşmesini "esas alınır" diye anar. Türkiye'nin bu sözleşmeden çekildiği bilgisi metin dışıdır ⚑; resmî metin de bankayla aynıdır. Bu bent hiçbir yerde kullanılmaz.
- md 1 "tek taraflı ısrarlı takip mağduru"nu 2012'den beri sayar; Kanunda tanımı yoktur (tanım Yönetmelik 3/1-ş'dedir). 7406 ile TCK'ya eklenen ısrarlı takip suçu 6284'ü değiştirmemiştir.
- md 13 (zorlama hapsi) 2012 metnidir: üç–on gün; tekrarda on beş–otuz gün; toplam altı ay.

**Yönetmelik.** Değişiklik yok. Kanunla aynı hükmü taşıyan maddeler ve Kanundan ayrıldığı yerler §5'teki tablodadır.

### Banka metninin biçim durumu

- **4483:** madde başlıkları var. md 17 (yerine işlenmiş), md 18–20 ve Geçici 1–4 kapsam dışıdır. md 3'ün son üç cümlesi ("Yokluklarında ise…", "Yetkili mercilerin saptanmasında…", "Ast memur ile üst memurun…") bentlerin devamıdır.
- **6284:** md 25'in sonundaki kadro notu md 21'in dipnotudur; hüküm değildir.
- **Yönetmelik:**
  - Yedi maddenin son satır(lar)ı bir sonraki maddenin ya da bölümün başlığıdır, hüküm değildir: md 5 ("ÜÇÜNCÜ BÖLÜM / Tedbir Kararları / Mülkî amir tarafından verilecek koruyucu tedbir kararları"), md 15, md 17, md 26, md 29 ("DÖRDÜNCÜ BÖLÜM…"), md 33, md 34.
  - Sözcük içi boşluk artıkları: "Korunmas ı", "Ayd ınlatılmış", "g )", "olmas ı", "nafakas ının", "h âkim", "Ayr ıca", "teknik ara çlar", "uygulanmas ıyla", "dakikas ı", "Alacaklar ının", "Kanun h ükümlerine". İçerik etkilenmez; köke ve şıkka resmî yazım geçer.
  - Madde başlığı bankada yoktur. Tırnaklı başlık gerekirse resmî metinden alınır (`cikti/y17030.txt`).
- `rapor/durum.md` satır 437–441'deki tuzak sürüyor: `mevzuat-madde-tazele` bu yönetmelikte Kanunu çeker; betikle `--yaz` çalıştırılmaz.

### Ad ve atıf kuralı (BAĞLAYICI)

| İbare | Yer | Kural |
|---|---|---|
| Aile ve Sosyal Politikalar Bakanlığı · Aile ve Sosyal Politikalar Bakanı | Kanun 2/1-a, md 21; Yön. 3/1-b, md 48 | Tam ad hiç yazılmaz. Kökte ve şıkta yalnız metnin tanımlı terimi **"Bakanlık"** kullanılır. Bugünkü ad (Aile ve Sosyal Hizmetler Bakanlığı) da yazılmaz: metinde yoktur |
| Bakanlığın ilgili il ve ilçe müdürlükleri (Kanun) · Müdürlük (Yön. 3/1-l) | Kanun 10/1, 10/2, 10/4, 13/3; Yön. 11, 30, 35 | "Bakanlığın il veya ilçe müdürlüğü" biçiminde. "Aile ve Sosyal Politikalar il müdürlüğü" yazılmaz |
| Şiddet önleme ve izleme merkezi · ŞÖNİM | Kanun 2/1-f, md 14, 15; Yönetmelik geneli | Kullanılır. Kanun sorusunda açık ad, Yönetmelik sorusunda "ŞÖNİM" (resmî sorular [186], [187] böyle yazar). Dikkat: Kanun 10/2 ve 10/4 "Bakanlığın müdürlüğü" derken Yönetmelik aynı işte "ŞÖNİM" der (§5) |
| Genel Müdürlük (Kadının Statüsü Genel Müdürlüğü) | Yön. 3/1-d, 41/2 | Hiç yazılmaz |
| il halk sağlığı müdürlüğü · toplum sağlığı merkezi · ruh sağlığı şubesi | Yön. 28/2, 28/3 | Hiç yazılmaz; çeldirici de olmaz. Kurumların bugünkü adı ve yapısı ⚑; **doğrulanamadı** |
| tapu sicil müdürlüğü | Yön. 15/2 | Yeni soruda yazılmaz (bankadaki türetim eşleştirmesinde duruyor; Şüpheli nokta 9) |
| Maliye Bakanlığı · Bakanlar Kurulu | Kanun md 22, 25; 4483 md 20 | Hiç yazılmaz |
| Merkezî Nüfus İdaresi Sistemi · MERNİS · Ulusal Yargı Ağı Bilişim Sistemi | Yön. 32/4, 32/6 | Yazılmaz (32/6 RED; 32/4 kırıntı liste) |
| kolluk amiri · kolluk görevlileri · kolluk birimi · kolluk | Kanun 3/2, 5/2 "kolluk amirleri"; 2/1-ğ, 8/1, 8/2 "kolluk görevlileri"; 8/4, 10/3 "kolluk birimi"; Yön. 3/1-s "kolluk" | Tedbiri alan için yalnız **"kolluk amiri"**; başvuran için "kolluk görevlileri"; yerine getiren için "kolluk birimi". Terimler yer değiştirmez (§6: iki okumalı) |
| mülkî amir | Kanun md 3; Yön. md 6 | Metindeki terim korunur; "vali" ya da "kaymakam" tek başına yazılmaz |
| hâkim · aile mahkemesi | Kanun 2/1-c | "Hâkim" = aile mahkemesi hâkimi. "Sulh ceza hâkimliği", "infaz hâkimliği" yalnız çeldirici olur |
| hazırlık soruşturması · Ceza Muhakemeleri Usulü Kanunu · sulh ceza hâkimi | 4483 md 6, 11, 12 | Metnin terimi korunur (resmî sorular da böyle yazar). "Ceza Muhakemeleri Usulü Kanunu" yeni soruda doğru şık ya da çeldirici olmaz (bankada iki kez soruldu) |
| Cumhurbaşkanlığı Genel Sekreteri · Bakan yardımcıları | 4483 3/g, md 12, 13 | Güncel; kullanılır. "İdari İşler Başkanı", "müsteşar", "Başbakanlık" hiç yazılmaz |
| Danıştay İkinci Dairesi | 4483 9/3 | Yalnız "Danıştay"; daire numarası yazılmaz |
| 765 sayılı TCK md 243, 245 · 1412 sayılı CMUK md 154/4 · Memurin Muhakematı Hakkında Kanunu Muvakkat | 4483 2/5, md 16, 18 | Hiç yazılmaz |

---

## 4483 sayılı Kanun

### §1 Resmî sorular

31 soru (Polis korpusu [93]–[120]; İdare korpusu [236], [258], [261]). PAEM yok.

| Hüküm | Soru sayısı | Sınavlar | Açı |
|---|---|---|---|
| md 3 merciler | 10 | MEB (4), İçişleri GYS (2), KPSS 2024, Kaymakamlık 2020 ve 2021 | M; "yanlıştır" eşleştirme; "yer almaz" |
| md 12/2 hâkim kararı | 5 | MEB (3), JGK Misyon 2023, İçişleri GYS | M (kaymakam → il asliye ceza: dört kez) |
| md 9 itiraz | 5 | MEB (3), İçişleri GYS (2) | S (on gün ×3, üç ay), M (bölge idare mahkemesi; vaka) |
| md 8 kapsam | 4 | JGK Misyon 2023, İçişleri GYS, MEB (2) | öncüllü; "yanlıştır" |
| md 7 süre | 2 | İçişleri GYS, MEB | S (otuz; kırk beş) |
| md 4 ihbar şartları ve savcının işlemi | 2 | İçişleri GYS, hâkimlik 2021 | Ş; öncüllü |
| md 5, md 6, md 2 | 1 + 1 + 1 | İçişleri GYS, MEB | "yanlıştır"; atıf yapılan kanun; "doğrudur" |

**Çıkarım.**
- Sınavlar 4483'ü üç eksende sorar: merci ızgarası (md 3, 9, 12), süre (md 7, 9) ve md 8'in üç cümlesi. Vaka yalnız bir kez ([100]).
- Kolluğa özgü hiçbir açı sorulmamıştır (polisin merci zinciri, adli görev, işkence istisnası).
- Aynı soru sınavdan sınava dolaşır: kaymakam–il asliye ceza dört, md 8 dört, on gün üç kez.

### §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Bankada | Açı | Karar |
|---|---|---|---|
| 2/1 kapsam; 2/3 suçüstü; 2/4 disiplin | 1 (MEB [99]) | "doğrudur"; doğru önerme 2/3'ün kuralı, çeldiriciler 2/1 ve 2/4 | Kuralın kendisi sorulmaz. Unsur ayrımı açıktır (§7 #3, çekinceli) |
| 3/a kaymakam | 2 + üç önerme sorusunda doğru önerme | M | Dolu |
| 3/b vali; kaymakamlar hakkında vali | eşleştirme önermesi; türetim (vekil kaymakam → vali) | M | Dolu |
| 3/c bölge | 1 + eşleştirme | M | Dolu |
| 3/d en üst idari amir | 1 | M | Dolu |
| 3/e Cumhurbaşkanı kararıyla atanan | "ilgili bakan" yalnız KPSS [101]'in doğru şıklarından | — | **Saklı kaydı açık** (§7 #1) |
| 3/f TBMM | 2 + eşleştirmeler | M | Dolu |
| 3/g Cumhurbaşkanlığı | eşleştirme (yanlış önerme: "Cumhurbaşkanı") | M | Dolu |
| 3/h İçişleri Bakanı | 2 + önermeler | M | Dolu |
| 3/i belde | 1 türetim (ilçe → kaymakam) | M | Merkez ilçe ucu ikizdir; yazılmaz |
| 3/j muhtar | iki "yanlıştır"ın yanlış önermesi | M | Dolu |
| md 3 son üç cümle (vekil bizzat; suç tarihindeki görev; ast–üst) | üç soruda doğru önerme | K | Cümleler bankada aynen yazar; vaka uygulaması da açılmaz (iki seçenekli, §6) |
| 4/1 savcının işlemi | 1 türetim + İdare [258] | Ş | Dolu |
| 4/2 diğer makamlar mercie iletir | türetim "yanlıştır"ın doğru önermesi | — | Yedek (§7) |
| 4/3 şartlar | 2 | Ş | Dolu |
| 4/4 işleme koymama, belge istisnası, kimlik gizliliği | 1 türetim (dört cümlesi de önerme) | — | Dolu |
| 5/2, 5/4 ilk cümle, 5/5, 5/6 | 1 (İçişleri [109]) | "yanlıştır" | Dolu. 5/4 son cümle (takdir) **RED** aldı |
| 6/1 yetki, atıf, ifade, farklı görüş; 6/2 gerekçe | 2 gerçek + 1 türetim (öncüllü) | — | Dolu |
| md 7 | 2 | S | Dolu |
| md 8 | 4 | — | Dolu |
| 9/1 bildirim; 9/2 itiraz edenler; 9/3 merci; 9/4 süre | 8 (süre 5, merci 2, işleme koymama → şikâyetçi 1) | S, M | Dolu |
| md 10 iştirak (mahkeme) | 1 türetim (kaymakam + ilçe nüfus müdürü → il ağır ceza) | V | Dolu; md 13'ün kaymakam değerini de verir |
| md 12/1 | 2 (kaymakam → il Cumhuriyet başsavcısı; vali → Yargıtay Cumhuriyet Başsavcısı) | M | Dolu |
| md 12/2 | 6 | M | Dolu |
| md 14 vekil | 1 türetim | V | Dolu |
| md 15/1 haksız isnat | 1 türetim | Sn | Dolu |
| Ek 1 | 1 türetim | "yanlıştır" | Dolu |

**Komşu tabanlar (aynı hükmü başka adla ölçenler).**
- `aday/298-p1.json` 298-p1-02 (KABUL): seçim suçunu görevi sebebiyle işleyen polis memuru → "genel hükümlere göre". Çeldiricisi: "soruşturma izni alınarak".
- `aday/3628-p1.json` 3628-p1-01 (KABUL): 4483'ün uygulanmadığı suçlar arasında sayılmayan → görevi kötüye kullanma.
- `3628-cakisma-sorulari.txt`: Ceza Hukuku (TCK md 94) sorusunda yanlış önerme: "İşkence suçu 4483'ün kapsamı dışında bırakılmadığından … izin alınması gerekir." İnsan Hakları ve İdare konularında özel kanun mercileri (TİHEK üyeleri: "Cumhurbaşkanı veya görevlendireceği bakan"; Kişisel Verileri Koruma Kurulu üyesi: Cumhurbaşkanı).
- 4483 ve 6284 için `*-diger-konu-sorulari.txt` ve `*-cakisma-sorulari.txt` dosyası **yoktur**. Başka derslerde (Ceza Muhakemesi, İdare, Ceza) bu iki kanunu ölçen bütün sorular taranamadı; yalnız 3628 çakışma tabanına düşenler görüldü. Tam tarama **doğrulanamadı**; orkestratör partiden önce `benzer-ara` betiğini çalıştırır.

**Ölçülmemiş:** md 1; 2/2 (4483 adıyla); 2/3'ün unsur ayrımı; 2/5; 3/e; 5/1; 5/3; md 7/2; md 11; md 13 (vali ucu); md 15/2; md 16.

### §3 Madde madde değer tablosu (yalnız ölçülmemiş yönler)

| Hüküm | Açı | Değer | ◆ | Vars. | Yargı |
|---|---|---|---|---|---|
| 3/e + 3/b, 3/c: "(b) ve (c) bentlerindeki hükümler saklı kalmak kaydıyla" | A, İ: atama biçimi (Cumhurbaşkanı kararı) ↔ görev yeri (il, bölge) | **Y** | ◆ (il emniyet müdürü, il müdürleri) | — : "Cumhurbaşkanı atadıysa izni de o verir" yanlışa; "ilde çalışanın izni validen" doğruya | **Asıl #1.** 7196'nın getirdiği kayıt; bankada ve resmî sorularda hiç yok. Üç rejim var ((e), (b)/(c), (d)); iki seçenekli değil |
| md 11: dosyanın Cumhuriyet başsavcılığına gönderilme anı | Sn, Ş: iznin verilmesi ↔ kesinleşmesi; izin verilmemesine itirazın kabulü | O | — | — : "izin çıktı, dosya savcıya gider" yanlışa; "kesinleşmeden işlem olmaz" doğruya | **Asıl #2.** md 11'den bankada soru yok. "Nereye gönderilir" biçimi sağduyudur (savcılık); yalnız "ne zaman / hangi hâlde" sorulur |
| 2/3: "ağır cezayı gerektiren" + "suçüstü" | Ş, A: iki unsur birlikte | **Y** | ◆ | Y: "suçüstü yakalanan memur için izin aranmaz" | **Asıl #3, çekinceli.** MEB [99] kuralı doğru önerme olarak yazar; aynı kalıp Anayasa md 83'te de vardır (komşu alışkanlık doğruya götürür). Vaka, 298-p1-02'nin tersine "izin aranır" cevabına gider: lehte |
| 2/5: işkence ve adli görev istisnası | İ | **Y** | ◆ | Y: "memur izinsiz soruşturulmaz" | **Yedek.** Kolluk değeri en yüksek hüküm; dayanağı mülga iki kanuna atıftır ⚑. Ceza bankasında yanlış önerme olarak geçiyor |
| 4/2: suçu öğrenen diğer makam ve memurlar durumu **izin vermeye yetkili mercie** iletir | M, A (↔ savcılığa bildirme alışkanlığı) | O | — (kollukla kurulamaz) | Y: "suç savcılığa bildirilir" | **Yedek.** Cümle bankadaki türetim sorusunda doğru önermedir |
| 2/2: özel usuller ve suçun niteliğine göre usuller saklı | İ | Y | ◆ | — | **Dışarıda.** 298-p1-02 ve 3628-p1-01 aynı bilgiyi ölçüyor |
| 2/1: "görevleri sebebiyle" ↔ görev sırasında | K | O | ◆ | D | Dışarıda: kişisel suçun genel hükümlere tabi olduğu sağduyudur; hangi suçun görev sebebiyle sayıldığı içtihattır ⚑ |
| 5/1: merci bizzat öğrenince de ön inceleme başlatır | K | D | — | D | Dışarıda |
| 5/3: ön incelemeyi kim yapar (bizzat; denetim elemanı; incelenenin **üstü** konumundaki memur) | Ş | O | ◆ (amir ön incelemeci olur) | D: "ast üstünü incelemez" | Dışarıda: sağduyu doğruyu verir |
| 5/2 ikinci cümle: yeni belge sunulursa müracaat işleme konabilir | İ | D–O | — | D: "yeni delil varsa yeniden bakılır" | Dışarıda |
| 7/2: "herhalde … karar vermek zorundadır" | Sn | D | — | — | Dışarıda: sürenin geçmesinin sonucu metinde yok (yokluktan yargı) |
| 9/2: izin verilmemesine karşı Cumhuriyet başsavcılığı veya şikâyetçi | Ş | O | — | D: "karardan zarar gören itiraz eder" | Dışarıda: 4483-p1-07'nin aynası |
| 9/3 parantezi: "g (Cumhurbaşkanınca verilen izin hariç)" | İ | D | — | — | Dışarıda: "hariç"in sonucu (itiraz yok mu, başka merci mi) metinde yazmaz; iki okumalı |
| md 12–13: kaymakam üçlüsü (il Cumhuriyet başsavcısı · il asliye ceza · il ağır ceza) | A | O | — | — | Dışarıda: üç uç da bankada (asliye ×5; ağır ceza md 10 vakası; başsavcı etiketsiz soru) |
| md 13: vali vb. → Yargıtayın ilgili ceza dairesi | M | D–O | — | D | Dışarıda: md 12/2'nin aynı ızgarası |
| md 15/2: memurun başvuru ve tazminat hakkı saklı | K | D | — | D | Dışarıda |
| md 16 | — | D | — | — | Dışarıda (tarihî atıf) |

### §5 Ayırt etme malzemesi

| Karışan çift | Fark | Kullanım |
|---|---|---|
| 3/e ↔ 3/b, 3/c | Cumhurbaşkanı kararıyla atanan, ilde ya da bölge kuruluşunda görevliyse izin validen; merkezde görevliyse Cumhurbaşkanı veya ilgili bakandan | #1. Doğru şık "görev yaptığı ilin valisi" |
| 3/e ↔ 3/d | (d) merkez ve bağlı kuruluşlardaki **diğer** memurlar: en üst idari amir | #1'de çeldirici |
| 4483 3/e ↔ özel kanun mercileri (6701, 6698) | Kurul üyeleri özel kanuna tabidir | Çeldirici olmaz: bankadaki soruların cevabıdır |
| 2/3 ↔ 298 md 174/1, 3628 md 17 | Orada suçun niteliği izni kaldırır; 2/3'te yalnız ağır cezayı gerektiren suçüstü | #3. Banka alışkanlığı ("genel hükümler") yanlışa gider |
| 2/3 ↔ Anayasa md 83 | Aynı kalıp ("ağır cezayı gerektiren suçüstü hâli") | Risk: komşu alışkanlık doğruya götürür |
| md 11 ↔ md 9 | İzin kararı tebliğle kesinleşmez; on günlük itiraz süresi geçer ya da itiraz reddedilir | #2 |
| md 11 ↔ 4/1 | Savcı izinden önce yalnız kaybolabilecek delili tespit eder; soruşturmayı izin kesinleşince yürütür | #2'de 4/1'in işlemi şık olmaz (bankada) |
| 4/1 ↔ 6/1 | Savcı ifadeye başvurmaz; ön incelemeci ifadeyi alır | İki uç da bankada; yeni soru açılmaz |
| md 12/2 ↔ md 13 (kaymakam) | Hâkim kararı: il asliye ceza; dava: il ağır ceza | Bankada; yalnız çeldirici |

### §6 Kaçınılacaklar (BAĞLAYICI)

- **RED almış:** 5/4'ün takdir cümlesi (4483-p1-05). Yeniden önerilmez.
- **Tabanda görünmeyen KABUL:** 4483-p1-08 (9/3: il belediye başkanı → doğru şık "Danıştay İkinci Dairesi"). Akıbeti **doğrulanamadı**; bu hüküm yeniden önerilmez, daire numarası hiçbir soruda yazılmaz.
- **Bankada ölçülmüş:** §2'deki her satır. Değerleri açıklamada da içerikle yazılmaz: otuz ve on beş gün, on gün, üç ay; kaymakam–il asliye ceza; TBMM Genel Sekreteri; İçişleri Bakanı.
- **İki seçenekli hükümler (09 brifi 23 Kas kural 1):**
  - md 3: suç tarihindeki görev mi, sonraki görev mi;
  - md 3: astın mercii mi, üstün mercii mi; md 10: astın mahkemesi mi, üstün mahkemesi mi;
  - 3/i ve 3/j: ilçe mi, merkez ilçe mi;
  - 9/2: memur mu, şikâyetçi mi.
- **Varsayılan cevaplı:** polis memuru için merci (ilçede kaymakam, ilde vali); "diğerleri" için genel hükümlere göre savcılık, sulh ceza hâkimi ve mahkeme (md 12, 13); dosyanın gönderileceği yer (md 11: Cumhuriyet başsavcılığı).
- **Saf süre:** md 7, md 9. Yeni süre sorusu yazılmaz.
- **İki okumalı**
  - 3/b "ilde görevli memurlar" valinin kendisini lafzen kapsar; vali için (e) uygulanır. Vaka valiyle kurulmaz.
  - 3/e "Cumhurbaşkanı veya ilgili bakan": hangisinin ne zaman yetkili olduğu metinde yazmaz. İkisi ayrı şık olmaz; (e) rejimi tek şıkta "Cumhurbaşkanı veya ilgili bakan" diye durur.
  - 3/b "merkez ilçe": büyükşehirlerde merkez ilçe bulunup bulunmadığı ⚑. Vaka büyükşehirle ve merkez ilçeyle kurulmaz.
  - 3/e: bir görevlinin Cumhurbaşkanı kararıyla atanıp atanmadığı ⚑ (3 sayılı Cumhurbaşkanlığı Kararnamesi). Kök atama biçimini kendisi verir; "il emniyet müdürü" unvanı tek başına yazılmaz.
  - 2/3 "ağır cezayı gerektiren": ağır ceza mahkemesinin görevine giren suç anlamı yerleşiktir ama metinde tanımı yoktur. Kök Kanunun ibaresiyle kurulur ("ağır cezayı gerektirmeyen bir suç"); suç adı yazılmaz.
  - 2/5: mülga kanun maddelerinin bugünkü karşılığı.
  - 4/2 ↔ kolluğun suçu Cumhuriyet savcısına bildirme ödevi (CMK, PVSK Ek 6): vaka kollukla kurulmaz.
  - 9/3 parantezi ve Danıştay dairesi.
  - md 7/2: sürede karar verilmemesinin sonucu.
- **Metin dışı (⚑):** hangi suçların "görev sebebiyle" sayıldığına dair içtihat; adli görevden doğan suçlarda doğrudan soruşturma (CMK md 161); TCK md 94–96 ve 256; 2802, 2547, 5442 ve özel kanun mercileri; 2575'in daire görev dağılımı.
- **Düşük değerli:** md 1, 5/1, 5/6, 15/2, 16–20, geçici maddeler.

### §7 Parti önerisi: `4483-p2` (en çok 3; önerilen 2)

| # | Hüküm | Ölçülecek ayrım / kök | Biçim | Yanlışa çeken alışkanlık ve çeldirici kaynağı | Risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 3/e + 3/b (7196) | Cumhurbaşkanı kararıyla atanan ve bir ilde görev yapan kamu görevlisi hakkında soruşturma izni vermeye yetkili merci. Doğru: görev yaptığı ilin valisi | Doğrudan kök ya da tek cümlelik vaka; kök iki olguyu da verir (atama biçimi, görev yeri) | "Atayan izni de verir": Cumhurbaşkanı veya ilgili bakan ((e)'nin kendisi; en güçlü). O kuruluşun en üst idari amiri ((d)). İçişleri Bakanı ((h)). Kaymakam ((a)) | Bilmeyen polis adayı "ilde → vali" varsayılanıyla doğruyu bulabilir; kökteki "Cumhurbaşkanı kararıyla atanan" kaydı bu sezgiyi karşı yöne çeker. Kör çözücü belirler: salt şıkla %60'ın üstünde bulunuyorsa RED. Vaka vali, kaymakam, kurul üyesi ya da hâkimle kurulmaz. "Cumhurbaşkanı" ve "ilgili bakan" iki ayrı şık olmaz | KPSS [101] ("ilgili bakan" merciler arasındadır); Kaymakamlık [236] ("ilde görevli memurlar – vali" doğru önerme) |
| 2 | md 11 (↔ md 9) | Soruşturma izni verilmiş ve ilgiliye tebliğ edilmiştir; dosya Cumhuriyet başsavcılığına hangi hâlde gönderilir. Doğru: iznin itiraz edilmeden ya da itirazın reddiyle kesinleşmesi üzerine | Doğrudan kök; "ne zaman / hangi hâlde" | "İzin çıkınca dosya gider": kararın verilmesiyle birlikte. İtiraz merciinin her dosyada onayı (bölge idare mahkemesinin onayından sonra). Ön inceleme raporunun tamamlanmasıyla. Memurun savunmasının alınmasından sonra | "Kesinleşme" hukuk sezgisiyle bulunabilir; değer 3–4. "Nereye gönderilir" biçimi yazılmaz (varsayılan). On gün ve üç ay şıklarda ve açıklamada içerikle geçmez. İkinci açı (izin verilmemesine itirazın kabulü üzerine de dosya doğrudan savcılığa gider) aynı soruya sıkıştırılmaz; ayrı soru da açılmaz | md 9 süre soruları; 4483-p1-03 (savcının izinden önceki işlemi) |
| 3 | ◆ 2/3 — **çekinceli** | Vaka (partide tek): görevi sebebiyle, ağır cezayı gerektirmeyen bir suçu işlerken suçüstü yakalanan memur hakkında soruşturma nasıl yapılır. Doğru: soruşturma izni alınarak | Kısa vaka; unvanla | "Suçüstü izni kaldırır": genel hükümlere göre (298 ve 3628 bankasının alıştırdığı cevap; en güçlü). Suçüstü hâli hâkim kararıyla tespit edilirse genel hükümlere göre. Doğrudan Cumhuriyet savcısınca, sonradan izin alınmak üzere. Disiplin soruşturması sonuçlanınca | (a) MEB [99] kuralı doğru önerme olarak yazar: "banka ölçmüş" itirazı güçlüdür. (b) Anayasa md 83 aynı kalıbı öğretir. (c) "ağır cezayı gerektirmeyen" ibaresi kökte durduğu için dikkatli aday kuralı kökten kurar. (d) 298-p1-02 ile ayna: aynı kısa denemeye konmaz. Sınav gözcüsü "bankanın ölçtüğünü yeniden ölçüyor" derse RED | MEB [99]; 298-p1-02 |

- **Yedek** (değer sırasıyla):
  - 2/5: işkence ve kötü muamele iddiasında izin aranmaması. Yalnız kullanıcı ve mevzuat gözcüsü "mülga maddelerin bugünkü karşılığı" sorununu kapatırsa yazılır; kapatılamazsa yazılmaz. Ceza bankasındaki TCK md 94 sorusunun yanlış önermesiyle aynı bilgidir.
  - 4/2: görevi sırasında bir memurun 4483 kapsamındaki suçunu öğrenen kurum amiri durumu nereye iletir (izin vermeye yetkili merci). Çeldirici: Cumhuriyet başsavcılığı (en güçlü), disiplin amiri, mülki amir. Risk: cümle 4483-p1-04'te doğru önermedir; vaka kollukla kurulamaz; kökteki "kurum amiri" kendi mercii ile yetkili merciin aynı kişi olması ihtimalini açar.
- **Dışarıda:** §3'te "Dışarıda" yazan her satır; §6 listeleri.
- **Kök tipi (2 soru):** doğrudan 2; #3 yazılırsa vaka 1. Olumsuz, öncüllü, boşluk yok.
- **Parti içi sızıntı:** 1 ↔ 3 temas etmez. 2 ↔ 3: 3'ün şıklarında "kesinleşme" geçmez; 2'nin şıklarında "genel hükümler" geçmez.

---

## 6284 sayılı Kanun

### §1 Resmî sorular

Kanunu doğrudan ölçen 13 soru ([182]–[184], [188]–[192], [195], [196], [198]–[200]). PAEM yok.

| Hüküm | Soru | Sınavlar | Açı |
|---|---|---|---|
| md 3 ve md 4 tedbir listeleri | 4 | Adalet GYS 2023 ve 2025, JGK 2023, İçişleri GYS | liste; öncüllü |
| md 8/2 altı ay | 2 | EGM Misyon 2023, Adalet GYS 2025 | S |
| md 17 on altı yaş, otuzda bir | 2 | Misyon 2020, JGK 2023 | S; boşluk |
| md 13/1 üç–on gün | 1 | EGM Misyon 2023 | S |
| md 9/1 iki hafta | 1 | Adalet GYS 2023 | S |
| md 16/3 doksan dakika; md 22 görüşü alınan bakanlıklar; md 12/2 yönetmelik | 3 | İçişleri GYS, Misyon 2020 | S; liste; işlem türü |

**Çıkarım.** Sınavlar 6284'ü liste (hangi tedbir kimin) ve süre üzerinden sorar. Kolluk amirinin yetkisi, onay zinciri, tebliğ ve yerine getirme resmî sınavlarda hiç sorulmamış; bu boşluğu 11 Kas turunun 14 türetimi doldurmuştur.

### §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Bankada | Karar |
|---|---|---|
| 3/1 mülkî amirin tedbirleri | 3 gerçek (liste, öncüllü) | Dolu |
| 3/2 kolluk amirinin alabileceği koruyucu tedbirler ((a), (ç)) | 1 türetim (öncüllü) | Dolu. Mülkî amir–kırk sekiz saat çifti 6284-p1-02'nin çeldiricisi ve açıklamasıdır |
| 4/1 hâkimin koruyucu tedbirleri | 1 gerçek + çeldirici | Dolu |
| 5/1 hâkimin önleyici tedbirleri | 1 gerçek ("sayılmamıştır") | Dolu |
| 5/2 kolluk amirince alınamayan önleyici tedbir; onay mercii ve süresi (hâkim – yirmi dört saat) | 2 türetim | Dolu. **Evrakın sunulma süresi açık** (§7 #1) |
| 8/2 altı ay | 2 | Dolu |
| 8/3 koruyucu tedbirde delil aranmaz | 1 türetim (vaka) | Dolu |
| 8/4 ret kararı yalnız korunan kişiye; kolluk kararı tutanakla derhâl | 2 türetim | Dolu |
| 8/7 eşya ve belgelerin kolluk marifetiyle teslimi | 1 türetim (vaka) | Dolu |
| 9/1 iki hafta; 9/2 merci (tek daire → asliye hukuk); 9/3 bir hafta | 3 | Dolu. [184]'ün kökü "aile mahkemesine itiraz"ı yazar |
| 10/1, 10/3, 10/5, 10/6, 10/7 | 1 türetim ("yanlıştır"; beş önerme) | Dolu |
| 10/4 kişi Bakanlığın il veya ilçe müdürlüğüne ulaştırılır | 1 türetim (vaka) | Dolu |
| 12/1 hâkim kararı; 12/2 yönetmelik | 2 | Dolu |
| 13/1 üç–on gün; 13/2 on beş–otuz gün, altı ay | 2 | Dolu. "Fiili bir suç oluştursa bile" iki Yönetmelik sorusunda doğru önerme |
| 16/3; 17/1; 17/2; 17/3; md 22 | 5 | Dolu |

**Ölçülmemiş:** md 1; md 2 tanımları; 3/1-d kreş; 3/2 ve 5/2'nin sunma süresi; 4/1-c, ç şartları; 5/3, 5/4; md 6; md 7; 8/1; 8/2'nin talep edenleri; 8/5; 8/6; 10/2; md 11; 13/3; md 14, 15; 16/1, 16/2, 16/4–6; md 18–20; md 23.

### §3 Madde madde değer tablosu (yalnız ölçülmemiş yönler)

| Hüküm | Açı | Değer | ◆ | Vars. | Yargı |
|---|---|---|---|---|---|
| 3/2 ve 5/2: kolluk amiri evrakı "en geç kararın alındığı tarihi takip eden ilk işgünü içinde" onaya sunar | S, A: sunma süresi ↔ onay süresi (yirmi dört / kırk sekiz saat) | **Y** | ◆ | Y: "yirmi dört saat içinde hâkime sunulur" (gözaltı ve el koyma alışkanlığı) | **Asıl #1.** Kolluk amirinin kendi yükümlülüğü; iki süre gerçekten karışır. Saf ezber değil: çeldiriciler aynı fıkranın öbür süreleridir |
| 8/1: tedbir "en çabuk ve en kolay ulaşılabilecek yer hâkiminden, mülkî amirden ya da kolluk biriminden talep edilebilir" | K, A (↔ yer yönünden yetki kuralları; 10/3) | **Y** | ◆ | D: "mağdur nereye giderse" | **Asıl #2, çekinceli.** Sahadaki "bölgemiz değil" hatasının kuralı; ama mağdur lehine en geniş şık doğrudur |
| 9/1: mülkî amirin kararına itiraz da aile mahkemesine | M, A (↔ idari yargı; 5326'da sulh ceza hâkimliği) | O–Y | — | — : 6284'te varsayılan merci aile mahkemesidir; "mülkî amir işlemi → idare mahkemesi" yanlışa çeker | **Yedek.** [184]'ün kökü merciyi yazıyor; Yönetmelik 33/1 aynı hükmü taşır |
| 2/1-b ev içi şiddet: "aynı haneyi paylaşmasa da" | K | O | ◆ | Y: "ev içi = aynı ev" | **Yedek.** Tanım sorusu; cümle dolaşık ("şiddet mağduru ve şiddet uygulayanla aynı haneyi paylaşmasa da") |
| 4/1-c, 4/1-ç; 3/1-ç: talep, rıza, resen | Ş, A: aile konutu şerhi (talep); kimlik değişikliği (aydınlatılmış rıza + başka tedbir yetmemesi); geçici koruma (talep veya resen) | O | — | — | **Yedek (zayıf).** Hâkimin işi; "hangisine resen karar verilemez" biçimi yokluktan yargıya yaklaşır |
| 8/3 ikinci cümle: önleyici tedbir "geciktirilmeksizin verilir" | A (↔ koruyucuda delil aranmaz) | Y | ◆ | — | Dışarıda: önleyici tedbirde delil aranıp aranmadığı metinde yazmaz; iki okumalı (§6) |
| 13/1: "fiili bir suç oluştursa bile" | Sn | Y | ◆ | Y: "aynı fiilden iki yaptırım olmaz" | Dışarıda: ibare bankadaki iki sorunun doğru önermesinde aynen duruyor |
| 13/3: zorlama hapsini Cumhuriyet başsavcılığı yerine getirir | M | O | — | D | Dışarıda: varsayılan merci |
| 5/1-g ↔ 5/1-ğ: silah kolluğa; zimmetli silah kurumuna | A | Y | ◆ | — | Dışarıda: iki seçenekli; Yönetmelik türetiminin (md 26) kökü cevabı yazıyor; şiddet uygulayan polisse "kurumu" kolluktur (iki okuma) |
| 8/5: tebliğde zorlama hapsi ihtarı | Ş | O | ◆ | D | Dışarıda: Yönetmelik 38/3 önermesi bankada |
| 8/6: gizlilik; talep üzerine veya resen; ayrı tebligat adresi | K | O | — | D | Dışarıda: sonuçları Yönetmelik md 32 türetiminde ölçüldü |
| 8/2: süre ve şeklin değiştirilmesini kim ister | Ş | D | — | — | Dışarıda: kırıntı liste; yokluktan yargı (savcı, şiddet uygulayan) |
| 10/2: başvurular ve kararlar Bakanlık müdürlüğüne derhâl bildirilir | M | O | ◆ | D | Dışarıda: Yönetmelik 5/1 türetimiyle aynı bilgi; Kanun–Yönetmelik ad farkı (§5) |
| md 7: herkes ihbar edebilir; kamu görevlisi gecikmeksizin görevini yapar | K | O | ◆ | D | Dışarıda: sağduyu |
| md 11: eğitim almış, kolluk birimlerince belirlenmiş personel | K | D–O | ◆ | D | Dışarıda: kurum içi işleyiş; soru açısı yok |
| 5/3, 5/4: çocuk koruma tedbirleri, velayet, tedbir nafakası ("talep edilmese dahi") | Ş | O | — | — | Dışarıda: kolluğa dokunmaz |
| 3/1-d kreş; md 17–19 mali ayrıntı | S | D | — | — | Dışarıda: saf süre ve oran |
| md 1, 6, 14–16, 20, 23 | — | D | — | — | Dışarıda |

### §5 Ayırt etme malzemesi: Kanun ↔ Yönetmelik

Aynı hüküm iki metinde de varsa soruyu **Kanun partisi** yazar; Yönetmelik partisi yalnız Yönetmeliğe özgü usulü sorar (07 eki). İki metnin ayrıldığı yerde hüküm ne doğru ne yanlış şık olur (09 brifi 23 Kas kural 3).

| Konu | Kanun | Yönetmelik | Karar |
|---|---|---|---|
| Kolluk amirinin tedbiri ve onay | 3/2, 5/2 | 29/1, 29/2 (aynen); 29/3 tatil hesabı (Kanunda yok) | Kanun partisi. 29/3 **RED** aldı; yeniden önerilmez |
| Kollukta bulunan kişinin ulaştırılacağı yer | 10/4: Bakanlığın il veya ilçe müdürlüğü | 7/4: ŞÖNİM | **Ayrışıyor.** Kanun sorusu bankada; Yönetmelik sorusu yazılmaz |
| Başvuru ve kararların bildirileceği yer | 10/2: Bakanlığın il ve ilçe müdürlükleri | 35/2 ve 5/1: ŞÖNİM | Ayrışıyor; yazılmaz |
| Tedbiri kim isteyebilir | 8/1: ilgili, Bakanlık veya kolluk görevlileri, Cumhuriyet savcısı | 30/1: müdürlük, ŞÖNİM…; 6/1: mülkî amir için savcı sayılmaz, "resen" eklenir | Liste sorusu yazılmaz |
| Hâkimin koruyucu tedbirleri | md 4: dört bent + benzer tedbirler | 12/1: "mülki amir tarafından alınabilecek tedbirler de dâhil" | **Ayrışıyor.** Bankadaki gerçek sorular mülkî amirin tedbirlerini "hâkimin tedbiri" sorusunda yanlış şık sayar. Yönetmelik 12/1 sorusu banka içi çelişki doğurur; yazılmaz |
| Yaklaşmama | 5/1-c: konut, okul, işyeri | md 20: "bulunabileceği sair yerler" | Yazılmaz |
| Tebligat adresi | 8/6: ayrı bir adres tespit edilir | 32/3: ŞÖNİM'in adresi | Yönetmelik türetimi bankada |
| Zorlama hapsi ihtarı | 8/5: "uygulanacağı" | 31/5: "karar verilebileceği"; kararda da belirtilir | Yazılmaz |
| İtiraz | 9/1–9/3 | 33 (mülkî amir kararı), 34 (hâkim kararı ve zorlama hapsi); duruşmasız karar; 34/5 | Merci ve süre Kanun partisinin; Yönetmeliğe özgü olan 34/1 ve 34/6'dır (zorlama hapsi) |
| Şiddet mağduru tanımı | 2/1-e | 3/1-n: "mütekabiliyet ilkesi çerçevesinde uyruğuna bakılmaksızın" | İki okumalı; yazılmaz |
| İhbar | md 7: herkes edebilir | 4/1: kamu kurumları ve kamu kurumu niteliğindeki meslek kuruluşları bildirmek zorunda | Yönetmeliğe özgü (yedek) |
| Kolluk görevleri; teknik takip; zorlama hapsi süreleri; mali hükümler | md 11, 12, 13, 17–20 | md 36, 37, 38/5–6, 42–45 (aynen) | Kanun partisi; hepsi dolu |

Öbür karışan çiftler:

| Çift | Fark | Kullanım |
|---|---|---|
| 3/2 ↔ 5/2 | Koruyucu: mülkî amir, kırk sekiz saat. Önleyici: hâkim, yirmi dört saat. Sunma süresi ikisinde aynı (ilk işgünü) | #1. Onay mercii ve süresi bankada; #1 yalnız sunma süresini sorar |
| 8/1 ↔ 10/3 | Tedbir her yerden istenir; yerine getiren, kişinin yerleşim yeri, bulunduğu ya da tedbirin uygulanacağı yer kolluğudur | #2. 10/3 bankada doğru önerme |
| 9/1 ↔ 5326 (sulh ceza hâkimliği) ↔ idari yargı | Mülkî amirin koruyucu tedbirine itiraz aile mahkemesine | Yedek |
| Kanun 5/2 ↔ 5395 acil korunma; CMK el koyma ve gözaltı onay süreleri | Başka kanunların yirmi dört saatleri | #1'de çeldirici değeri; açıklama öbür kanunun süresini içerikle yazmaz |

### §6 Kaçınılacaklar (BAĞLAYICI)

- **Bankada ölçülmüş:** §2'deki her satır. Değerler açıklamada da içerikle yazılmaz: altı ay; iki hafta, bir hafta; üç–on gün, on beş–otuz gün; yirmi dört ve kırk sekiz saatin hangi mercie ait olduğu (#1 dışında); on altı yaş, otuzda bir.
- **İki seçenekli:** silahın teslim yeri (kolluk ↔ kurum); ret kararının tebliği (bankada); koruyucu ↔ önleyici ayrımına indirgenen her soru.
- **Varsayılan cevaplı:** "kime itiraz edilir" (aile mahkemesi); "zorlama hapsine kim karar verir" (hâkim); "kim infaz eder" (Cumhuriyet başsavcılığı); "koordinasyon kimde" (Bakanlık); "kim yerine getirir" (kolluk).
- **Saf süre, oran:** kreş (dört ay, iki ay, asgari ücretin yarısı); md 17'nin oranları; 16/3 saatleri; md 22'nin altı ayı; Geçici 1'in iki yılı.
- **İki okumalı**
  - Tedbiri veren: 2/1-ğ "kolluk görevlileri", 3/2 ve 5/2 "kolluk amirleri", 8/4 "kolluk birimi". "Kolluk görevlisi tedbir alabilir mi" sorulmaz.
  - 5/2: yirmi dört saatin başlangıcı (kararın alınması mı, evrakın sunulması mı) metinde yazmaz. #1 yalnız sunma süresini sorar; vaka gün ve saat hesabı içermez.
  - 8/3: önleyici tedbirde delil.
  - 3/1 ve 4/1 "uygun görülecek benzer tedbirler": "mülkî amir şu tedbiri veremez" yargısı kesin değildir; Yönetmelik 12/1 hâkim için tersini yazar.
  - 9/1 "ilgililer": kimlerin itiraz edebileceği.
  - 10/3: barınma tedbirini kimin yerine getirdiği (Yönetmelik 35/4 "gecikmesinde sakınca bulunan hallerde barınma" ekler).
  - 1/2-a sözleşme atfı.
- **Metin dışı (⚑):** TCK md 123/A (ısrarlı takip); zorlama hapsinin hukuki niteliğine dair AYM ve Yargıtay kararları; KADES; ŞÖNİM Yönetmeliği; 5395; TMK md 194–199; genelgeler.
- **Düşük değerli:** md 14–16, 18–21, 23–25, Geçici 1.

### §7 Parti önerisi: `6284-p2` (en çok 2; önerilen 1)

| # | Hüküm | Ölçülecek ayrım / kök | Biçim | Yanlışa çeken alışkanlık ve çeldirici kaynağı | Risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 5/2 (ve 3/2) | Gecikmesinde sakınca bulunan hâlde tedbir alan kolluk amiri evrakı en geç ne zaman onaya sunar. Doğru: kararın alındığı tarihi takip eden ilk işgünü içinde | Doğrudan kök; tek tedbir türüyle (önleyici → hâkim). Vaka, gün adı ve saat yok | Onay süresini sunma süresi sanmak: yirmi dört saat içinde (5/2; en güçlü); kırk sekiz saat içinde (3/2). Derhâl (8/4'ün tebliğ kaydı). Kararın şiddet uygulayana tebliğinden sonra | (a) Kökte onay merciini vermek 6284-p1-02'nin cevabını sızdırır: kök "önleyici tedbir … hâkimin onayına" derse 02 ile aynı denemeye konmaz; mümkünse kök yalnız "onaya sunar" der. (b) Açıklama yirmi dört ve kırk sekiz saati mercileriyle eşleştirmez. (c) Tatil ve hafta sonu hesabı (Yönetmelik 29/3, RED) köke ve açıklamaya girmez. (d) "Derhâl" savunulabilir ikinci doğru olmamalı: kök "en geç" der. (e) Kalite gözcüsü "saf süre" derse savunma: ölçülen, aynı fıkradaki iki sürenin ayrımıdır | 6284-p1-02 (onay mercii – süresi); 6284-p1-06 (çeldirici: "kararı izleyen ilk işgünü içinde tebliğ edilir") |
| 2 | ◆ 8/1 — **çekinceli** | Tedbir kararı nereden talep edilebilir. Doğru: en çabuk ve en kolay ulaşılabilecek yer hâkiminden, mülkî amirden ya da kolluk biriminden | Kısa vaka (yerleşim yeri başka ilde olan mağdur) ya da doğrudan kök | Yer yönünden yetki alışkanlıkları: korunan kişinin yerleşim yeri; şiddet uygulayanın yerleşim yeri; şiddetin gerçekleştiği yer; müşterek konutun bulunduğu yer | Doğru şık en geniş ve mağdur lehine olandır: "en kapsamlı şık" ve "mağdur önce gelir" kestirmesi (09 brifi 23 Kas kural 1'in gerekçesi). Taze kör çözücü salt şıkla buluyorsa RED. Şıklar "yalnız" sözcüğü taşımaz. 10/3'ün yerine getirme yetkisi şıklara karışmaz | 6284-p1-04 (çeldirici: başvurunun savcı aracılığıyla yapılması); 6284-p1-11 (10/3 önermesi) |

- **Yedek** (değer sırasıyla):
  - 9/1: mülkî amirin verdiği koruyucu tedbir kararına itiraz mercii (aile mahkemesi). Çeldirici: idare mahkemesi, sulh ceza hâkimliği, bir üst mülkî amir, bölge idare mahkemesi. Risk: [184]'ün kökü cevabı yazar; aile mahkemesi bu Kanunun varsayılan merciidir. #1 ve #2 düşerse denenir.
  - 2/1-b: "ev içi şiddet"in tanımında aynı haneyi paylaşma şartının aranmaması. Risk: tanım cümlesi dolaşık; başka derslerdeki tanım soruları taranamadı.
  - 4/1-c, ç: yalnız talep ya da rıza ile verilebilen tedbir. Risk: hâkimin işi; sınav değeri 3.
- **Dışarıda:** §3'te "Dışarıda" yazan her satır.
- **Kök tipi:** doğrudan 1; #2 yazılırsa vaka 1. Öncüllü yok.
- **Parti içi sızıntı:** 1 ↔ 2 temas etmez. Bankayla: #1 ↔ 6284-p1-02 (yukarıda).

---

## 6284 Sayılı Kanuna İlişkin Uygulama Yönetmeliği

### §1 Resmî sorular

| No | Sınav | Hüküm | Açı |
|---|---|---|---|
| [185] | Adalet GYS 2023 | md 38 tedbir kararlarına aykırılık | "yanlıştır": zorlama hapsi tekerrüre esas olur (38/7) |
| [186] | Adalet GYS 2023 | md 8 geçici maddi yardım | "doğrudur": bordro (8/4) |
| [197] | Adalet GYS 2025 | 3/1-k koruyucu tedbir kararı | tanım; şıklarda öbür tanımlar |

Komşu yönetmelikler: Teknik Takip [187], [194]; ŞÖNİM Yönetmeliği [193] (hepsi Adalet GYS). Yönetmeliği yalnız Adalet GYS sormuştur; soruların üçü de madde başlığını tırnakla anan önerme ya da tanım sorusudur.

### §2 Bankada ölçülenler (yeniden sorulmaz)

| Madde | Bankada | Not |
|---|---|---|
| 3/1-c, 3/1-r; 3/1-k | 2 türetim; 1 gerçek (Kanun konusunda duruyor) | 3/1-p (önleyici tedbir kararı) [197]'nin aynasıdır |
| md 4–5 | 1 türetim ("doğrudur"): 4/5, 5/1, 5/2, 5/3 | 4/1 açıklamada ve çeldiricide |
| md 7 | 2 türetim: 7/2, 7/3, 7/5, 7/6 | 7/4 Kanunla ayrışıyor |
| md 8 | 1 gerçek ([186]) | — |
| md 10 | 2 türetim: 10/2, 10/3, 10/4 | Dolu |
| md 13, 15, 16, 19/4 | 1 türetim (eşleştirme) | — |
| md 19 | 1 türetim: 19/2, 19/3 | — |
| md 26 | 1 türetim (26/3 tutanak) | Kök "kurumuna teslim"i yazar |
| md 27–28 | 1 türetim (tedavinin reddi) | — |
| md 32 | 1 türetim: 32/3, 32/5 | 32/6 **RED** |
| md 35 | 3 türetim: 35/3 uzlaşma, 35/5 kontrol yöntemleri, 35/6 saat 16.00; önermelerde 35/5 ve 35/7 | Dolu |
| md 38 | 2 gerçek (Kanun konusunda duruyor): 38/1–38/5, 38/7 | Dolu |
| md 42 | 1 türetim (öncüllü) | — |

Tabanda görünmeyen KABUL: 6284y-p2-06 (34/5: asıl dava ile birlikte istenen tedbire esas davadan bağımsız itiraz). Akıbeti **doğrulanamadı**; yeniden önerilmez.

### §3 Madde madde değer tablosu (yalnız Yönetmeliğe özgü, ölçülmemiş yönler)

| Hüküm | Açı | Değer | ◆ | Vars. | Yargı |
|---|---|---|---|---|---|
| 3/1-ş tek taraflı ısrarlı takip: "aralarında aile bağı veya ilişki bulunup bulunmadığına bakılmaksızın"; fiilî, sözlü, yazılı ya da her türlü iletişim aracıyla | K | O–Y | ◆ | Y: "6284 aile içi şiddet kanunudur; aile bağı gerekir" | **Asıl #1, çekinceli.** Tanım Kanunda yok; komisyon bu maddeden tanım sormuş ([197]). Doğru şık en kapsayıcı olan olabilir |
| 34/1, 34/6: zorlama hapsi kararına itiraz (iki hafta; aile mahkemesi usulü: izleyen daire, tek daireyse asliye hukuk) | M, A (↔ ceza mercileri) | O | — | Y: "hapis kararına ceza mahkemesi ya da infaz hâkimliği bakar" | **Yedek.** Kanun 9/2 vakasının (bankada) aynı ızgarası; kolluğa dokunmaz |
| 4/1: kamu kurum ve kuruluşları ile kamu kurumu niteliğindeki meslek kuruluşları durumu derhâl bildirmek zorunda | Ş, A (↔ herkes ihbar edebilir) | O | — | D: "resmî kurum zorunludur" | **Yedek (zayıf).** 6284y-p1-01'in çeldiricisi ve açıklaması bu cümleyi kullanıyor |
| 31/4: kolluğun aldığı önleyici tedbir hakkında ŞÖNİM'e ve mahkemeye bildirim | M | D–O | ◆ | — | Dışarıda: bildirim ızgarasının öbür iki ucu (Cumhuriyet başsavcılığı ve ŞÖNİM; Cumhuriyet başsavcılığı) bankadadır; soru elemeyle çözülür (09 brifi 23 Kas kural 5) |
| 31/3: mülkî amir onaylamazsa tedbirin kalktığı korunan kişiye tebliğ edilir, kolluğa bildirilir | Sn | D–O | ◆ | D | Dışarıda: kırıntı; hâkimin onaylamaması için hüküm yok (yokluktan yargı) |
| 30/4: tedbiri kararı veren merci kaldırır; kaldırma kararı korunan kişiye de tebliğ edilir | M | D–O | — | D | Dışarıda |
| 13/1: işyeri değişikliği talep ya da onayla; il içi ya da il dışı | Ş | O | — | D | Dışarıda: sağduyu; hâkimin işi |
| 25: silahların kolluğa teslimi ve tedbir süresinin sonuna kadar emaneti; 26/2: kurum amiri silahı iade etmez | Sn | O | ◆ | D | Dışarıda: sağduyu; md 26 türetimi komşu |
| 3/1-g ihbar ↔ şikâyet | K | O | ◆ | D | Dışarıda: genel ceza muhakemesi bilgisi aynı sonucu verir (09 brifi 26 Kas kural 4) |
| 3/1-ı kolluk amiri tanımı | K | Y | ◆ | — | Dışarıda: "konu ile yetkili ve görevli kolluk biriminin amiri" hangi amiri gösterdiği belirsiz; iki okumalı |
| 3/1-a aydınlatılmış rıza (yazılı beyan); 3/1-f hayati tehlike; 3/1-ç geçici koruma; 3/1-h kolluk | K | D–O | — | D | Dışarıda |
| 12/1: hâkim mülkî amirin tedbirlerini de verebilir | A | Y | — | — | Dışarıda: bankadaki Kanun sorularıyla çelişir (§5) |
| 7/4, 35/2: ŞÖNİM | M | — | ◆ | — | Dışarıda: Kanunla ayrışıyor |
| 28/2, 28/3 | M | — | — | — | Dışarıda: eskimiş kurum adları |
| 29/3; 32/6 | S | — | — | — | **RED almış**; yeniden önerilmez |
| 32/4 kayıt listesi; 8/4 bordro günleri; md 11 kreş ödemesi; 41/3 sertifika; 43/2; 44/2 | — | D | — | — | Dışarıda: kolluğa dokunmayan kurum içi işleyiş (09 brifi 23 Kas kural 7) |

### §6 Kaçınılacaklar (BAĞLAYICI)

- **RED almış:** 29/3 (tatil ve süre hesabı), 32/6 (MERNİS şerhinin on beşinci gün silinmesi).
- **Kanunda aynen bulunan hüküm:** md 6, 12 (bentler), 17–24, 29/1–2, 30/1–3, 31/1–2, 31/4 ilk yarı, 32/1, 33/1 (merci ve süre), 34/1–2 (tedbir kararı yönünden), 35/1, 35/8, 36, 37, 38/5–6, 40, 41/1, 42/1, 43/1, 43/3–4, 44/1, 44/3, 45, 46. Yönetmelik partisi bunları sormaz.
- **Kanunla ayrışan hüküm:** 7/4, 35/2, 5/1 (ŞÖNİM ↔ müdürlük), 12/1, 20, 29/3, 3/1-n. Ne doğru ne yanlış şık olur.
- **Banka kökü ve açıklama sızıntısı:** 26/3 türetiminin kökü zimmetli silahın kuruma teslimini; md 16 eşleştirmesi dört tedbirin gönderildiği yeri; 35/5 türetimi haftalık ziyareti yazar.
- **Eskimiş ad:** ad kuralındaki "hiç yazılmaz" satırları.
- **Saf sayı:** 35/5-a "haftada en az bir kez"; 35/6 saat 16.00 (bankada); 8/4 ayın on beşi ve otuzu; 10/2 yirmi dört saat (bankada).
- **İki okumalı:** 3/1-ı; 3/1-n; 31/3 (yalnız 29/1'e atıf); 33/1 "aile mahkemesinin bulunmaması hâlinde 34/2" (34/2 bu hâli düzenlemez); 35/7 korunan kişinin tedbire uymamasının sonucu (metinde yok).

### §7 Parti önerisi: `6284y-p3` (en çok 1; 0 olabilir)

| # | Hüküm | Ölçülecek ayrım / kök | Biçim | Yanlışa çeken alışkanlık ve çeldirici kaynağı | Risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 3/1-ş — **çekinceli** | "Tek taraflı ısrarlı takip"in tanımında aranmayan unsur ya da tanımla ilgili doğru önerme. Doğru: taraflar arasında aile bağı ya da ilişki bulunup bulunmadığına bakılmaz | Doğrudan kök, "… ile ilgili aşağıdakilerden hangisi doğrudur?" ([197] ve [186] kalıbı) | "6284 aile içi şiddettir": aile bağı ya da birlikte yaşama aranır. Yalnız kadınlar bakımından uygulanır (md 1: "kişiler"). Yalnız fiilî takip sayılır; iletişim araçlarıyla yapılan davranış kapsam dışıdır. Davranışın içeriği tehdit ya da hakaret olmalıdır ("içeriği ne olursa olsun") | (a) "Doğrudur" sorusunda doğru önerme takımın tek kısıtlamasız cümlesi olur: dört çeldirici de "yalnız / şart" taşır (09 brifi 23 Kas kural 2 ve "en kapsamlı şık"). Çözüm aranır: çeldiricilerden en az biri kısıtlamasız ama yanlış olmalı (ör. takibin karşılıklı olması hâlinde de uygulanır). Kurulamıyorsa yazılmaz. (b) TCK md 123/A bankasında aynı unsurları ölçen soru olup olmadığı **doğrulanamadı**; orkestratör `benzer-ara` ile bakar. (c) Tanım cümlesi bozuk ("… ve baskı altında tutacak her türlü tutum ve davranışı"): doğru şık tanımın yalnız açık kısmına dayanır | [197] (3/1-k tanımı); 6284y-p1-01, 02 (3/1-r, 3/1-c) |

- **Yedek:**
  - 34/1 ve 34/6: zorlama hapsi kararına itiraz. Çeldirici: ağır ceza mahkemesi, sulh ceza hâkimliği, infaz hâkimliği, bölge adliye mahkemesi. Risk: Kanun 9/2 vakasını bilen aday aktarımla çözer; kolluğa dokunmaz; sınav değeri PAEM için 3.
  - 4/1: bildirme zorunluluğu kimde. Risk: sağduyu; 6284y-p1-01 ile temas.
- **Dürüst sonuç:** Yönetmelikte kestirmesiz kurulabildiği gösterilen yuva yoktur. Tek aday çekincelidir; üretici (a) riskini kapatamazsa parti boş kapanır. Bu geçerli bir sonuçtur.

---

## §8 Üç metne özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız güncel madde gövdesinden kurulur; "Metnin durumu" bağlayıcıdır.
   - 4483: son değişiklik 7547 (16/5/2025). "İdari İşler Başkanı", "müsteşar", "Başbakanlık" yok. Mülga kanun atıfları (2/5, md 6, 16) köke ve şıkka girmez.
   - 6284 ve Yönetmelik: değişiklik yok. Bakanlığın tam adı hiç yazılmaz.
   - Yönetmelikte madde sonundaki başlık satırı hüküm değildir (md 5, 15, 17, 26, 29, 33, 34).
   - Yokluktan yargı kurulmaz. İstisna, metnin kapalı saydığı listelerdir: 4483 4/1 ("başka hiçbir işlem yapmayarak"), 6284 3/2 ve 5/2 (bent sayımı), 8/4 ("sadece korunan kişiye").
2. **Sayı ve süre.** Yeni süre sorusu yalnız 6284 #1'dir ve iki sürenin ayrımını ölçer. Başka hiçbir soruda süre doğru şık olmaz; bankadaki süreler çeldirici olarak da yığılmaz (dört çeldiricinin dördü banka cevabı olamaz).
3. **Varsayılan.** 4483'te "kaymakam", "vali", "Cumhuriyet başsavcılığı", "genel hükümler"; 6284'te "hâkim", "aile mahkemesi", "kolluk", "Bakanlık" varsayılandır. Doğru şık bunlardan biriyse kök, varsayılanı karşı yöne çeken bir koşul taşımalıdır (4483 #1: "Cumhurbaşkanı kararıyla atanan"). Taşımıyorsa soru yazılmaz.
4. **Komşu alışkanlık.** Her yuva, bankanın ya da komşu kanunun alıştırdığı cevabı yanlış şıkka bağlar (09 brifi 26 Kas kural 2):
   - 4483 #1: "(e) = Cumhurbaşkanı veya ilgili bakan";
   - 4483 #3: 298 ve 3628'in "genel hükümler"i;
   - 6284 #1: bankadaki "hâkim – yirmi dört saat", "mülkî amir – kırk sekiz saat";
   - 6284 #2: yer yönünden yetki kuralları;
   - Yönetmelik #1: "6284 = aile".
5. **Kanun ↔ Yönetmelik.** Kök hangi metne göre sorulduğunu söyler. Yönetmelik sorusunun doğru şıkkı Kanunda aynen bulunmaz; Kanun sorusunun açıklaması Yönetmelik maddesi anmaz. §5 tablosunda "ayrışıyor" yazan hüküm hiçbir şıkta durmaz.
6. **Terim.** Tedbiri alan "kolluk amiri"dir; "kolluk görevlisi", "polis memuru" tedbir alan olarak yazılmaz. Vaka unvanla kurulur ("ilçe emniyet müdürü", "polis merkezi amiri", "şiddet mağduru bir kadın").
7. **Biçim.** Kök kısa adla: "4483 sayılı Kanun'a göre", "6284 sayılı Kanun'a göre", "6284 sayılı Kanun'a İlişkin Uygulama Yönetmeliği'ne göre". Beş şık. Bu turda öncüllü soru önerilmez (üç partide toplam en çok 6 soru; 1/5 kuralı öncüllüye yer bırakmaz).
8. **Parti arası sızıntı.** 4483 #3 ↔ 298-p1-02 ve 3628-p1-01; 6284 #1 ↔ 6284-p1-02; 6284 yedek 9/1 ↔ Yönetmelik yedek 34: aynı kısa denemeye konmaz; birinin açıklaması öbürünün cevabını içerikle yazmaz.
9. **Yazılmayan yuva raporlanır.** Üretici her yuva için "yazıldı / yazılmadı, gerekçe" satırı verir. Boş parti başarısızlık değildir.

### Gözcü kontrol listesi

**Mevzuat gözcüsü**
- Doğru şık resmî konsolide metnin bugünkü ibaresiyle birebir mi (4483: 7547 sonrası)?
- 4483 #1: kökteki görevli gerçekten (b) ya da (c) kapsamında mı; vali, kaymakam, kurul üyesi, hâkim, belediye başkanı değil mi; "Cumhurbaşkanı veya ilgili bakan" tek şıkta mı?
- 4483 #2: doğru şık md 11'in üç hâlinden yalnız izin verilmesine ilişkin iki hâli mi taşıyor; itiraz süresi ve merci şıklara sızmış mı?
- 4483 #3: kök Kanunun ibaresini mi kullanıyor; suç adı yazılmış mı?
- 6284 #1: "en geç" kökte mi; "derhâl" savunulabilir ikinci doğru mu; yirmi dört saatin başlangıcına ilişkin bir iddia var mı?
- Yönetmelik sorusunda Kanunla gerilim var mı (§5)?
- Eskimiş kurum adı, mülga kanun atfı, daire numarası var mı?

**Kalite gözcüsü**
- Hüküm §3'te "Dışarıda" ya da §6'da mı (orkestratör önce kendisi denetler)?
- Soru bankadaki bir sorunun doğru önermesini yeniden mi ölçüyor (4483 #3 ↔ [99]; 6284 yedek 9/1 ↔ [184])?
- Dört çeldiriciden kaçı bankadaki soruların doğru cevabı (4483'te merci ızgarası; 6284'te süreler)?
- Sınav değeri: "komisyon bu hükmü bu açıdan sorar mı?" 4483 #2 ve Yönetmelik #1 için eşik sorusudur.

**Sınav gözcüsü (taze ajan; kör çözüm)**
- Salt şık ve sağduyuyla güven: 4483 #1 ("ilde → vali"), 6284 #2 ("en geniş şık"), Yönetmelik #1 ("kısıtlamasız tek önerme") için ayrıca yazılır.
- Kestirme türleri sayılır: kesişim, ikiz, iki uç + orta, en kapsamlı şık, varsayılan merci, kök yankısı.
- İsteme anahtar, şık değeri ve bu rapordaki "Vars." sütunu yazılmaz.

**Dil gözcüsü**
- Kök tek okumada anlaşılıyor mu; "bağlamında", "açısından değerlendirildiğinde" yok mu?
- Şıklar paralel mi; doğru şık tek başına en uzun ya da metnin birebir ibaresini taşıyan tek şık mı?
- REVIZYON eşiği: yalnız anlamı, tek cevaplılığı ya da doğal okumayı etkileyen kusur.

---

## Şüpheli noktalar (soru konusu olmaz; kullanıcıya bildirilir, hiçbiri düzeltilmedi)

**Metin**

1. **4483 2/5 mülga kanunlara atıf yapıyor.** "765 sayılı TCK'nın 243 ve 245 inci maddeleri" ve "1412 sayılı CMUK'un 154 üncü maddesinin dördüncü fıkrası". Resmî metin de böyledir. Bugünkü karşılıkları (5237 ve 5271) metinde yazmaz; hangi maddelere denk geldiği **doğrulanamadı**. Polis için en önemli istisna bu yüzden türetim sorusuna dönüşemiyor.
2. **4483 9/3 "Danıştay İkinci Dairesi" der.** Resmî konsolide metin de aynıdır. Danıştay'da bu görevin bugün hangi dairede olduğu (2575 sayılı Kanun) bu turda indirilmedi; **doğrulanamadı**. 4483-p1-08'in doğru şıkkı daire numarasını taşıyordu ve soru tabanda görünmüyor.
3. **4483 resmî dipnot [7] kendi içinde tutarsız:** "'Bakan yardımcıları' ibaresi 'Bakan yardımcıları' şeklinde değiştirilmiştir." md 13'ün bugünkü metni bankayla aynıdır; 7547'nin bu ibarede ne değiştirdiği **doğrulanamadı**.
4. **6284 md 25'in sonunda md 21'in dipnotu duruyor** (kadro notu). Hukuki içerik değil; içe aktarım artığı.
5. **6284 1/2-a** Avrupa Konseyi Sözleşmesini temel ilke olarak anmayı sürdürüyor. Konu özeti, kart ve açıklamalarda bu bende dayanılıp dayanılmadığı bu turda taranmadı.
6. **6284 iç tutarsızlığı:** 2/1-ğ tedbir kararını "kolluk görevlileri"ne, 3/2 ve 5/2 "kolluk amirleri"ne, 8/4 "kolluk birimi"ne bağlar.
7. **Yönetmelik:** yedi maddede başlık artığı, on iki yerde sözcük içi boşluk; 28/2–3'te kaldırılmış ya da adı değişmiş sağlık birimleri; 33/1'in 34/2'ye yaptığı atıf "aile mahkemesinin bulunmaması" hâlini karşılamıyor; 3/1-ş tanım cümlesi bozuk.

**Bankadaki sorular**

8. **6284 konusunda başka metinlerin soruları duruyor (7 etiketsiz soru).** `6284-mevcut-sorular.txt`'teki 21 gerçek sorunun 7'si Kanunu değil yönetmelikleri ölçer: Uygulama Yönetmeliği 4 (3/1-k tanımı; md 38 "tedbir kararlarına aykırılık" iki kez; md 8 geçici maddi yardım), Teknik Takip Yönetmeliği 2, ŞÖNİM Yönetmeliği 1. Hiçbirinin madde etiketi yok. Sonuç: Uygulama Yönetmeliği tabanı 16 görünür, gerçekte 20 soru ölçülüyor; yönetmelik partisinin mükerrer taraması Kanun tabanını da okumak zorunda.
9. **Dört şıklı sorular:** 4483'te 11 (47 sorudan), 6284'te 9 (35 sorudan); Yönetmelik tabanında yok. Hepsi gerçek sınav sorusudur (İçişleri GYS, Misyon Koruma 2020 ve 2023 dört şıklıdır). Beş şık kuralı gereği bildirilir.
10. **Mükerrer kümeler (gerçek sorular):**
    - 4483 md 12/2 kaymakam → il asliye ceza: 4 soru (biri vaka, biri ters kök); TBMM Genel Sekreteri ucuyla 5.
    - 4483 md 8: 4 soru (ikisi öncüllü, ikisi "yanlıştır"; aynı üç cümle).
    - 4483 md 9 on gün: 3 soru; üç ay: 2 soru.
    - 4483 3/a kaymakam: 2 soru (beş ve dört şıklı sürümler); 3/f TBMM: 2 soru; md 6 atıf: 2 soru.
    - 6284 8/2 altı ay: 2 soru; md 17 on altı yaş: 2 soru; Yönetmelik md 38 "yanlıştır": 2 soru (aynı doğru şık, şık sırası farklı).
11. **Etiketsiz sorular:** 4483'te 5 (md 3 + md 8 karma "yanlıştır"; md 8 + md 9 karma "yanlıştır"; 3/c bölge; md 12/1 kaymakam vakası; KPSS [101]); 6284'te 7 (madde 8).
12. **Eskimiş unvan taşıyan şıklar (anahtar etkilenmiyor):** 4483'te üç soruda "Cumhurbaşkanlığı İdari İşler Başkanı" çeldirici olarak duruyor (md 12 "hangisi için il asliye ceza"; 3/f TBMM; 3/d). 7547'den sonra bu unvan Kanunda yok. Çeldirici olarak yanlış kalmaya devam eder; açıklamalar taban dosyasında yazmadığı için içerikleri **doğrulanamadı**. Yönetmelik md 16 eşleştirmesinde "Tapu sicil müdürlüğü" metnin ibaresidir.
13. **Yanlış anahtar şüphesi: bulunmadı.** Üç tabandaki 98 sorunun anahtarı güncel metne karşı okundu; 7547 sonrası metinle çelişen anahtar yok. KPSS [101] ("yer almaz": il emniyet müdürü; şıklarda Cumhurbaşkanlığı Genel Sekreteri) bugünkü metne göre tek cevaplıdır. Teknik Takip ve ŞÖNİM yönetmeliği sorularının (3 soru) anahtarı bu turda metne karşı sınanmadı: **doğrulanamadı**.
14. **Tabanda görünmeyen iki KABUL:** 4483-p1-08 (9/3) ve 6284y-p2-06 (34/5) karar dosyasında KABUL, taban dosyalarında yok. Çekildiler mi, arşivlendiler mi, başka konuya mı bağlandılar: **doğrulanamadı**. `rapor/durum.md` 42 soruyu `in_review` sayar; tabanlarda 40 türetim görünüyor.
15. **Çakışma tabanı eksik:** 4483 ve 6284 için `-diger-konu-sorulari.txt` ve `-cakisma-sorulari.txt` üretilmemiş. Başka derslerdeki sorular (TCK md 94 işkence sorusu, İdare Hukuku'ndaki 4483 soruları, özel kanun mercileri) yalnız 3628 çakışma dosyası üzerinden görülebildi. İkinci dalga partisinden önce `doc39-mevcut-sorular-cikar` çakışma dosyalarını bu üç metin için de üretmeli.
