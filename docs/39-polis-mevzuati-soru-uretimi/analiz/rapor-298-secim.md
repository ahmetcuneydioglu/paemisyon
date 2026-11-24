# Seçim güvenliği ve seçim suçları: sınav ve kaynak analizi (298)

Doc 39, 23 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/298.txt` (234 madde başlığı);
- `298-mevcut-sorular.txt` (6), `298-diger-konu-sorulari.txt` (18), `298-cakisma-sorulari.txt` (81);
- komşu taban: `2911.txt` ve `2911-mevcut-sorular.txt` (10), `aday/2911-p1.json` (md 5 sorusu), `4483.txt` ve `4483-mevcut-sorular.txt`, `2559.txt`, `6136.txt`.

Resmî metin mevzuat.gov.tr'den 23 Kas 2026'da indirildi (`MevzuatTertip=4`; `=5` boş sayfa döndürür). Dosyalar:
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/298/indirilen/iframe-4.html` (ham),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/298/cikti/resmi-4.txt` (düz metin),
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/298/cikti/karsilastirma.txt` (betik çıktısı).
Banka metniyle 234 maddenin tamamı betikle sözcük sözcük karşılaştırıldı. Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz, bu kanuna uygulanır.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** kolluğu doğrudan ilgilendirir. **sınır**: çakışma dosyasında başka bir kuralı ölçen, ama yeni soruya çeldirici ya da yasak sınırı veren soru. md 82'nin fıkraları bu raporda sırayla 82/1 … 82/12 diye numaralanır (numaralar metinde yazmaz; köke yazılmaz).

## 0. Özet tablo ve dürüst değerlendirme

| Kanun | Resmî doğrudan soru | PAEM / Misyon | Bankada (konu) | Diğer konu: 298'i adıyla soran / başka adla aynı hüküm / sınır / ilgisiz | Çakışma: ilgili / sınır / ilgisiz | Asıl çakışma tabanı |
|---|---|---|---|---|---|---|
| 298 | **0** (iki korpus, 766 soru) | **0 / 0** | 6: md 14 (1), 94/A (3), 94/E (1), 298'de karşılığı bulunmayan 1 | 11 / 3 / 3 / 1 | 11 / 27 / 43 | Anayasa md 67 ve 79; 2839; 6271; 2911 md 5, 6, 10; 4483 md 2 |

- **PAEM ve Misyon 298'i hiç sormadı.** GYS, kaymakamlık, hâkimlik ve KPSS de sormadı. İki korpusta "298 sayılı" ya da "Seçimlerin Temel Hükümleri" ibaresi sıfır kez geçer.
  - Seçime değen resmî sorular başka metinlerdendir: İdare korpusu [383] Misyon 2020 (Anayasa md 79, YSK'nin oluşumu), [378] Misyon 2020 (halk egemenliği), [313] Kaymakamlık 2023 (2972: seçimin ertelenmesi), [4] HMGS 2024 (2839: adaylık için çekilme).
  - PAEM her dönemde 2911'i sordu ([22], [23], [24]); üçü de bildirim ve toplantı kurallarıdır. Seçim dönemi toplantısı sorulmadı.
- **Kanunun sınav değeri taşıyan kısmı dardır.** 234 başlığın 21'i bütünüyle mülga, 9'u ek, 25'i geçicidir. Yürürlükteki ana maddelerin çoğu seçmen kütüğü, kurulların oluşumu, oy pusulası, sayım-döküm ve itiraz usulüdür: kolluğa dokunmaz, PAEM adayına bir şey öğretmez.
- **Kolluğa değen çekirdek 12 maddedir:** md 51, 79, 81, 82, 85, 94, 171, 173, 174, 175 (ve bağlam olarak 26, 74). Bunların da bir kısmı bankada ölçülmüş (md 26, 79–80'in yasak listesi, md 180), bir kısmı sağduyuyla bulunur (md 85, 82/7, 67, 9).
- **Kestirmesiz ve sınav değeri olan yuva sayısı: 4** (§7 #1, #2, #3, #5). İki yuva çekincelidir (#4, #6). Bu, analistin üst sınırıdır; üretici her yuvayı yeniden sınar. Parti 3–4 soruyla kapanırsa bu beklenen sonuçtur; 6 soru beklenmez.
- **Metin temiz.** Banka metni resmî metinle 234 maddenin 233'ünde sözcük sözcük aynıdır; tek fark md 189'un altına yapışmış "işlenemeyen hüküm" kuyruğudur. Kolluk maddelerinde fark yoktur. Dört AYM kaydının hiçbiri kolluk maddelerinde değildir.
- **Ters ayırt etme riski** (§8 kural 4). Bilmeyen aday şu sezgilerle doğruyu bulur; soru bu sezgiyi kıran olguyla kurulur, kıramıyorsa yazılmaz:
  - "seçimde her işi ilçe seçim kurulu yapar" (md 50 miting yeri; md 94 belge; md 56 hoparlör);
  - "üst karar mercii YSK'dir" (md 14/16, 85/A, 87, 89);
  - "güvenlik gerekçesi valiye aittir" (md 14/16'nın talep edeni);
  - "kolluk işi bitince ayrılır" (82/7);
  - "kolluk, seçmenin girişini engelleyemez" (md 85);
  - "kapatmayı mülki amir yapar" (51/A/3);
  - "silahlı ve üniformalı girebilen tek kişi görevli polistir" (82/8);
  - "görevli, görev yaptığı sandıkta oy kullanır" (94/2);
  - "suçüstü hâli her dokunulmazlığın istisnasıdır" (173/2).

**◆ Kolluğa doğrudan değen hükümler**

| Hüküm | Kolluk bağı | Kullanım |
|---|---|---|
| 82/2 | Sandık çevresinde yalnız "çağrı veya ihbar üzerine gelen görevli kolluk güçleri" bulunabilir | 298-p1 #1 |
| 82/3, 82/4 | Uyarıya uymayan kişi kolluk çağrılarak uzaklaştırılır; başkan görevini yapmazsa yetkiyi kurul kararla kullanır ve ilçe seçim kurulu başkanına bildirir | bağlam; çeldirici kaynağı |
| 82/5 | Cebir, şiddet veya tehditle düzeni bozanlar: başkan ya da üyelerden birinin çağrısı veya seçmenlerin ihbarı üzerine gelen kolluk derhal uzaklaştırır, yasal işlem yapar. İhbar o yer kolluğuna şahsen yapılır | yedek |
| 82/7 | Kolluk başkanın talebine veya kurulun kararına uymak zorundadır; çağrı veya ihbar sebebi ortadan kalkınca sandık çevresinden ayrılır | doğru önerme; tek başına soru olmaz (sezgi) |
| 82/8 | Seçim güvenliğiyle görevli kolluk hariç, özel güvenlik görevlileri ve belediye zabıtaları dâhil resmî üniforma ve silah taşıyanlar sandığın konulduğu bina, yapı ve müştemilatına giremez | #1'in öbür ucu |
| 82/9 | Bina ve müştemilatında rozet, amblem, propaganda: uymayanı kolluk uzaklaştırır | iki okumalı (§6) |
| 82/11 | Sandık çevresinde suç işlenirse sandık kurulu tutanağa geçirir, kolluğu çağırır | bağlam |
| 82/12 | İlçe seçim kurulu başkanı bina ve müştemilatında güvenlik tedbirlerini alır; talimatlarına sandık kurulları, mülki ve idari makamlar uymak zorundadır | yedek |
| md 85 | Sandık çevresi dışında zabıtaya emir verenlerin ve zabıtanın tedbirleri seçmenin binaya serbestçe girmesini engelleyemez, güçleştiremez | sorulmaz (sezgi) |
| md 51 | Kapalı yer toplantısı: üç kişilik heyet, en yakın zabıta amir veya memuruna haber; zabıta, heyetin isteği veya yetkili seçim kurulunun kararı dışında müdahale edemez | #2 |
| 79/3, md 171 | Oy verme günü emniyet ve asayişi korumakla görevli olanlar dışında kimse silah taşıyamaz; yaptırımı adlî para cezası | yasak bankada; yaptırım #5 |
| md 94 | Seçim güvenliğiyle görevli kolluk, ilçe seçim kurulu başkanının verdiği belgeyle görevli olduğu sandık bölgesinde oy kullanır | yedek (liste açısı) |
| 173/1, 173/2 | Görevlilerin seçim suçunda soruşturmanın başlama zamanı; oy verme günü seçmen hakkında soruşturma ve tedbir yasağı | #6 çekinceli; 173/2 yedek |
| 174/1 | Seçim suçlarında sıfat ve memuriyet ne olursa olsun genel hükümler; vali ve kaymakam için özel merci | #3 |
| md 175 | İdarî para cezasına Cumhuriyet savcısı karar verir | #4 çekinceli |
| md 26 | Zabıta amir ve memurları seçim kurullarına seçilemez | bankada |
| md 74 | Karakollara sandık konulamaz | yedek (zayıf) |
| md 40, 67 | Askı listelerinin korunması; araç ve para gönderiminde yardım | dışarıda (sezgi, düşük değer) |
| 14/16 | Seçim güvenliği için sandıkların taşınması: vali veya il seçim kurulu başkanının talebi, YSK kararı | dışarıda (iki varsayılan) |

---

## Metnin durumu (BAĞLAYICI)

### Resmî metne erişim ve karşılaştırma

- Erişildi. Konsolide metin, değişiklik tablosu ve 85 dipnot indirildi.
- Resmî metin 234 madde, banka metni 234 madde; adları birebir eşleşir.
- Betik sözcük dizilerini karşılaştırdı. Bölüm ve madde başlıkları, dipnot numaraları ve satır sonu tirelemeleri süzüldükten sonra **233 madde aynı, 1 madde farklı** çıktı.
  - Fark: banka md 189'un gövdesinde "26/4/1961 Tarihli ve 298 Sayılı Ana Kanuna İşlenemeyen Hükümler / 1 – 13/9/1991 tarih ve 455 sayılı KHK'nin Geçici Maddesi …" satırları duruyor. Bunlar md 189'un metni değildir.
- Madde sonlarındaki 57 fark tek tek gözle denetlendi: hepsi bir sonraki maddenin başlığı ya da bölüm adıdır. Kesik madde yok.
- Resmî metindeki "Ek Geçici Madde 1–3" (1983, 2812) bankada yok. Tarihî hükümlerdir; sorulmaz.

### Değişiklik ve AYM kayıtları

| Hüküm | Resmî şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| md 81, 82, 85, 153 | 7102 (13/3/2018; yürürlük 16/3/2018). Dipnot [36], [37], [45], [76]: "sandık alanı" ibareleri "sandık çevresi" ya da "sandığın konulduğu bina, yapı ve bunların müştemilatı" oldu. md 81 baştan yazıldı. 82/5, 82/7, 82/12 değişti; 82/8 ve 82/9 eklendi. Dipnot [44]: 82/2'ye "veya ihbar" eklendi | Kanunda tek mekân kavramı "sandık çevresi"dir (oda, bölüm ya da bu amaçla oluşturulan yer) | "Sandık alanı" hiçbir yerde yazılmaz. Eski yarıçap değeri metinde ve dipnotlarda geçmez; **doğrulanamadı**, çeldirici de olmaz |
| md 83, 84 | 7102/24 ile mülga | Yok. md 85/A hâlâ "81, 82, 83, 84 ve 85" der | 85/A sorulmaz |
| md 82 (2010) | 5980 (8/4/2010) maddeyi baştan yazdı | 82/1–4, 82/6, 82/10, 82/11 2010 metnidir | — |
| md 79/4, 133–175 | 5728 (23/1/2008) ceza hükümlerini yeni TCK'ya uyarladı. "Ağır hapis", "ağır para cezası" ibareleri çıkarıldı; md 143, 147, 150'de "(…)" kaldı | TCK, CMK, Kabahatler ve 5187 atıfları günceldir | atfın içeriği ⚑ (aşağıda) |
| md 180/1 | Dipnot [82]: 6353 (4/7/2012) "iki yıl" → "altı ay" | altı ay | bankada; "iki yıl" yalnız çeldirici olur |
| md 65, 66, 155 | 7393 (31/3/2022). Dipnot [30], [31], [77]: "Başbakan" ibareleri çıkarıldı | yalnız "bakanlar" | sorulmaz |
| md 15, 18, 23, 33, 36, 40 | 7393: il ve ilçe seçim kurulu başkan ve üyeleri ad çekmeyle belirlenir; nakil istemleri | güncel | kolluk dışı |
| md 11, 12, 13, 29, 31 | 7062 (30/11/2017) ile mülga (YSK teşkilatı ayrı kanuna geçti) | md 14/12, 28, 33, 41, 45–47, 122–124'da "Seçmen Kütüğü Genel Müdürlüğü" kalıntısı | sorulmaz |
| md 149/A | KHK 687 ile mülga; 7076 ile aynen kabul | Yok | özel radyo ve televizyon yaptırımı sorulmaz |
| Geçici 25 | 7491 (27/12/2023; yürürlük 28/12/2023) | resmî tablonun **son satırı** | sorulmaz |
| md 52/7 | AYM 22/5/1987, E. 1987/3, K. 1987/13: "2 nci fıkranın (d) bendi dışında" ibaresi iptal; metinde "(...)" | | sorulmaz |
| md 64 | AYM 22/5/1987, E. 1987/6, K. 1987/14: son cümle iptal; metinde "(...)" | | sorulmaz |
| md 124 son fıkra | AYM 18/11/1995, E. 1995/54, K. 1995/59: iptal; metinde yalnız şerh | | sorulmaz |
| md 94/B | AYM 29/5/2008, E. 2008/33, K. 2008/113: madde "mektupla oy kullanma yönünden" iptal. Madde metni resmî metinde de bankada da **aynen duruyor**; iptal yalnız dipnot [51]'dedir | Mektupla oy yoktur (94/A/1 üç yöntem sayar) | 94/B hiçbir yerde kullanılmaz. Bankadaki soru (mektupla oy uygulanamaz) doğrudur |

- **2024–2026:** resmî değişiklik tablosunda 7491'den sonra satır yok. Konsolide metne göre 298 bu dönemde değişmedi. Resmî Gazete ayrıca taranmadı; mevzuat.gov.tr'nin işlemediği bir değişiklik olup olmadığı **doğrulanamadı**.
- Kolluk maddelerinin son hâli: md 51 (1961 metni), md 79 (79/4: 2008), md 81, 82, 85 (2018), md 94 (2010), md 171, 173, 174, 175 (2008).

### Banka metninin biçim durumu

- 234 başlık = 200 ana madde (189 + 11 harfli: 20/A, 51/A, 55/A, 55/B, 85/A, 94/A–94/E, 149/A) + 9 ek + 25 geçici.
- Bütünüyle mülga 21: md 11, 12, 13, 29, 31, 48, 83, 84, 99, 103, 104, 106, 139, 149/A, 178; Geçici 5–10.
- Gövdeye karışmış dipnot yok. Tek artık md 189'un kuyruğudur.
- Madde başlığı yalnız 31 maddede var; bölüm ve kesim adları hiç yok. Kolluk maddelerinin resmî başlıkları (tırnaklı başlık bunlardan alınır):

  | md | Resmî başlık |
  |---|---|
  | 51 | Kapalı yerlerde propaganda |
  | 79 | İçki ve silah taşıma yasağı |
  | 80 | Yayın yasağı |
  | 81 | Sandık çevresi |
  | 82 | Sandık çevresinde düzenin sağlanması ve yasaklar |
  | 85 | Sandık çevresi dışındaki inzıbat tedbirleri |
  | 94 | Sandık seçmen listesinde kayıtlı olmayan seçmenlerin oy kullanması |
  | 171 | Silah taşıyanlar |
  | 173 | Soruşturma ve kovuşturma zamanı |
  | 174 | Genel hükümlerin uygulanması |
  | 175 | İdarî para cezasına karar verme yetkisi |
  | 179 | Seçim suçu |
  | 180 | Dava süresi |

- Cümle ortasında satır kırığı taşıyan maddeler var (md 51, 80, 81, Ek 1, Ek 6). İçerik etkilenmez.
- Ölü iç atıflar (resmî metinde de aynı): md 145/4 → mülga md 139; md 85/A → mülga md 83, 84; md 172 madde numarası vermeden "kovuşturma ve soruşturma usullerini gösteren madde" der.
- 82/7'de aynı yükümlülük iki cümlede yinelenir ("çağrılacak kolluk güçleri … uymak zorundadır. … gelen kolluk güçleri … uymak zorunda olup …"). Resmî metinde de böyledir.

### Ad ve atıf kuralı (BAĞLAYICI)

| İbare | Yer | Kural |
|---|---|---|
| kolluk güçleri · özel güvenlik görevlileri · belediye zabıtaları | md 82, 94 (2010, 2018 metni) | Doğru şıkta ve çeldiricide kullanılır |
| zabıta amir ve memurları | md 26, 40, 51, 67, 85 (1961–1979 dili) | Metindeki terim korunur. md 82/8 belediye zabıtasını ayrı saydığı için bu maddelerde "zabıta" genel kolluktur. "Belediye zabıtası" bu maddelerin sorusuna yazılmaz |
| mahallin en büyük mülki amiri · mülki makamlar · mülki idare amiri | md 22, 40, 51/A, 61, 82/12 | Doğru şıkta ancak hükmün kendi ifadesiyle. "Vali" ya da "kaymakam" tek başına yazılmaz; md 174 hariç |
| Cumhuriyet savcısı · Yargıtay Cumhuriyet Başsavcısı · il Cumhuriyet başsavcısı veya başsavcıvekili · ağır ceza mahkemesi | md 173–175 (2008) | Güncel; kullanılır |
| hâkim ↔ yargıç | md 15 "hâkim"; md 154, 177 "yargıç" | Kökte ve şıkta "hâkim" |
| sulh yargıcı | md 176 | Hiç yazılmaz (sulh ceza mahkemeleri kalktı; md 176 kapsam dışı) |
| Bakanlar Kurulu | md 182, md 189 | Hiç yazılmaz |
| Başbakan | metinde yok (7393) | Hiç yazılmaz; çeldirici de olmaz |
| Cumhuriyet Senatosu | md 17, md 110 (kalıntı; dipnot [1]) | Hiç yazılmaz |
| Seçmen Kütüğü Genel Müdürlüğü · seçmen kartı | md 14/12, 28, 33, 41, 45–47, 122–124; Ek 1 | Hiç yazılmaz (kurum 7062 ile kalktı; md 48 mülga) |
| TRT · "Türkiye Radyoları" · "radyo ve televizyon postaları" · 2954 sayılı Kanun md 5, 20, 22, 23, 31/2 | md 52–55/A, Ek 1 | Hiç yazılmaz. 2954'ün atıf yapılan maddelerinin bugünkü durumu **doğrulanamadı**. Radyo ve Televizyon Üst Kurulu 298'de geçmez |
| 648 sayılı Siyasi Partiler Kanunu · 5830 sayılı Kanun · Bankalar Kanunu · katma bütçeli idareler · İktisadi Devlet Teşekkülleri · umumi menfaatlere hadim cemiyetler · Askeri Ceza Kanunu md 3 | md 26, 62–64, Ek 6 | Hiç yazılmaz. md 62–64 ve 154/2–3 bu yüzden kapsam dışıdır |
| Türk Ceza Kanununun 6/1-f bendinin (1), (2), (3) ve (5) numaralı alt bentleri | 79/4 | Atıf günceldir; alt bentlerin içeriği ⚑. "Hangi alet silah sayılır" sorulmaz; vaka ateşli silahla kurulur |
| Türk Ceza Kanununun 257 nci maddesi · belgede sahtecilik hükümleri · Kabahatler Kanunu md 32/1 · Basın Kanunu md 14 | md 138, 140, 148, 156, 176 | Atfın içeriği ⚑. Doğru şık bunlara dayanmaz |
| Memurin Muhakematı · sıkıyönetim · "ağır hapis" · "ağır para cezası" | metinde yok | Hiç yazılmaz |
| seçme yeterliği · müşahit · sandık çevresi · sandık bölgesi · seçim bölgesi · seçim çevresi · kapalı oy verme yeri | md 3–5, 25, 75, 81 | Terimdir; korunur |

**Para ve hapis cezaları.**
- **TL tutarları hiçbir yerde kullanılmaz.** md 134/1 (ikiyüz), 140/2 (yüz), 158 (ikiyüzelli), 166 (bin–beşbin) idarî para cezalarıdır; 2008 tutarlarıdır ve her yıl yeniden değerlenir (dayanak 5326; ⚑). md 183'teki "yüzbin lira" avans ve md 182'deki gösterge de kullanılmaz.
- **Hapis cezaları yürürlüktedir** ama miktar sorusu kurulmaz. Kanunda 21 ayrı aralık vardır; 1979–1983 metinleriyle ("seneye", "bir misli") 2008 metinleri karışıktır. PAEM bu kanunu hiç sormadığı için ceza aralığı ezberi sınav değeri taşımaz.
- **Adlî para cezasının gün sınırları sorulmaz** (md 136: elli gün; 154: yüz gün; 164: bin–beşbin gün; 171: yirmibeş gün).
- **Yaptırım TÜRÜ ayırt etme malzemesidir** ve sorulabilir: hapis ↔ adlî para cezası ↔ idarî para cezası (§4, §5).

---

## §1 Resmî sorular

298'i ölçen resmî soru yoktur. Sınırdaki resmî sorular:

| No | Sınav | Metin · hüküm | Açı | 298 ile ilişkisi |
|---|---|---|---|---|
| İdare 383 | Misyon Koruma 2020 (4 şık) | Anayasa md 79: YSK'nin oluşumu | S, K; "yanlıştır" | 298 md 11–13 mülga; YSK'nin oluşumu 298'de yok |
| İdare 378 | Misyon Koruma 2020 | halk egemenliği: oy verme hak mı görev mi | K | 298 ile ilgisiz |
| İdare 313 | Kaymakamlık 2023 | 2972: seçimin ertelenmesi kanunla | işlem türü | 298 ile ilgisiz |
| İdare 4 | HMGS 2024 | 2839: adaylık için görevden çekilme | Ş; öncüllü vaka | 298 md 154/1 ve Ek 7 komşusu; 298 sormaz |
| Polis 22, 24, 30 | PAEM 8 ve 10; JGK 2023 | 2911 md 10: bildirim süresi ve içeriği | S, K | 298 md 51'in aynası (§5) |
| Polis 21 | EGM Misyon 2023 | 2911 md 6: yer ve güzergâhı mülki amir belirler | M | 298 md 50'nin aynası |
| Polis 25–29 | Misyon 2020; JGK 2023 | 2911 md 28, 29: ceza aralıkları | S; boşluk | 298 md 149'un komşusu; ceza aralığı kalıbı örnek alınmaz |

**Çıkarım.**
- Resmî sınavlar seçimi Anayasa (md 67, 79) ve özel seçim kanunları üzerinden sorar; 298'in kolluk hükümleri hiç ölçülmemiştir.
- 298'den çıkabilecek bir PAEM sorusunun en olası yeri, PAEM'in zaten sorduğu iki kanunla ayırt etmedir: 2911 (toplantı bildirimi) ve 4483 (memurların soruşturulması; Polis korpusunda 28 soru, ikisi JGK Misyon 2023).

## §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Açı | Nerede | Sızıntı ve karar |
|---|---|---|---|
| md 26: zabıta memuru, idare amiri, milletvekili ve aday kurullarda görev alamaz | Ş | diğer konu ("sandık kurulunda görev alabilir": öğretmen) | Sorulmaz. "Zabıta amir ve memurları kurullara seçilemez" yeni soruda doğru önerme olarak da durmaz |
| md 79/1–3 ve md 80: seçim günü yasakları | K | diğer konu ("yasaklardan biri değildir": saat 21.00'den sonra yayın). Doğru önermeler: içki satışı; eğlence yerlerinin oy verme süresince açık kalması; "emniyet görevlileri dışında silah taşınması"; görev dışı cep telefonu görüşmesi | Yasak listesi sorulmaz. Silah yasağının VARLIĞI bankadadır; yaptırımı ölçülmemiştir (#5). md 80'in saatleri (18, 21) sorulmaz |
| md 49: propaganda oy verme gününden önceki gün saat 18.00'de sona erer | S | çakışma (Cumhurbaşkanı seçimi adıyla) | Sorulmaz; açıklamada da yazılmaz |
| 51/A son fıkra: seçim büroları 09.00–23.00 | S | diğer konu | Sorulmaz |
| md 180/1: altı ay | S | diğer konu | Sorulmaz. Yeni sorunun açıklaması "altı ay"ı yazmaz |
| md 7: silah altındaki er, onbaşı, askerî öğrenci, hükümlü oy kullanamaz; tutuklu kullanır | Ş | diğer konu (3 soru; ikisi Anayasa md 67 adıyla) | Sorulmaz |
| md 3: her il bir seçim çevresi | K | diğer konu; çakışma | #1'de "seçim çevresi" çeldiricidir; açıklama tanımı içerikle yazmaz |
| md 10: seçim kurulları | K | diğer konu | Sorulmaz |
| md 15: il seçim kurulu (bir başkan, iki asıl, iki yedek; iki yıl; ad çekme) | S | diğer konu | Sorulmaz |
| md 21: sandık kurulu (bir başkan, altı asıl, altı yedek) | S | diğer konu | Sorulmaz |
| md 110, 112: itiraz edebilecekler, itirazın şekli; YSK'ye itiraz yazılı | Ş | diğer konu | Sorulmaz |
| md 14/4, 14/11: illerin en az yarısı, altı ay; ilçelerin üçte biri | S | diğer konu; çakışma (öncüllü) | Sorulmaz |
| md 14: adaylık itirazında kesin karar YSK | M | banka | Sorulmaz |
| 94/A: yöntemler; Dışişleri görüşü; hangi seçimlerde; yurt dışında propaganda yok | K, M | banka (3); diğer konu | Sorulmaz |
| 94/E: kırkbeş gün | S | banka | Sorulmaz |
| md 160/3: mükerrer oy | — | diğer konu (TCK adıyla: "suçun niteliği") | Bu maddeden soru açılmaz (Şüpheli nokta 7) |
| 2911 md 5: seçim zamanı propaganda toplantılarına ilişkin kanun hükümleri saklıdır | K | `aday/2911-p1.json` 2911-p1-13 (bankaya yazılıp yazılmadığı bu turda denetlenmedi) | #2'nin açıklaması "saklıdır" hükmünü cevap biçiminde yazmaz |
| 2911 md 6, md 10 | M, S, K | 2911 bankası ([21], [22], [24], [30]) | #2'de mülki amir ve bildirim çeldiricidir; açıklama kırk sekiz saati ve bildirimin içeriğini yazmaz |
| Anayasa md 67 ve 79 | K, S | çakışma: YSK'nin oluşumu, görev süresi, bölümü, görevleri; seçim ilkeleri; bir yıl kuralı (yaklaşık 20 soru) | 298 sorusu YSK'nin oluşumunu, seçim ilkelerini (md 2) ve seçme hakkını sormaz |
| 4483 md 2: özel soruşturma usulleri saklı | K | `4483-mevcut-sorular.txt`'te seçim suçunu ya da "saklı" kaydını ölçen soru **yok** | #3 açıktır. 3628-p1-01 (in_review; 4483'ün uygulanmadığı suçlar) aynı yapıdadır: #3'ün açıklaması 3628'i anmaz |

**Çakışma dosyasının sayımı (81).**
- İlgili 11: seçim çevresi; seçim kurulları; il seçim kurulu; itiraz; sandık kurulu üye sayısı; sandık kurulunda görev; seçim günü yasakları; propaganda bitişi; yurt dışı seçmen; dava süresi; teşkilat şartı.
- Sınır 27: Anayasa md 67 ve 79 (YSK'nin oluşumu, bölümü, görevleri, görev süresi), 2839 ve 6271 soruları, mükerrer oy (TCK), genel oy.
- İlgisiz 43: siyasi partilerin kapatılması ve mali denetimi, TBMM İçtüzüğü, milletvekilliğinin düşmesi, yüksek mahkemeler, dilekçe hakkı, 7068.

**Ölçülmemiş (kolluk çekirdeği):** md 51; md 74; md 81; md 82'nin bütün fıkraları (cep telefonu önermesi dışında); md 85; md 94/1–2; md 133–175'in tamamı (md 160'ın TCK sorusu dışında).

## §3 Madde madde değer tablosu

Yalnız sınav değeri taşıyabilecek hükümler. "Vars." sütunu, bilmeyen adayın sezgisinin doğruya (D), yanlışa (Y) ya da iki yöne (—) götürdüğünü gösterir.

**Seçim günü: sandık çevresi ve kolluk**

| md | Açı | Değer | ◆ | [K→K] | Vars. | Not |
|---|---|---|---|---|---|---|
| 81 + 82/2 + 82/8 | K, A: üç halka. Köy, kasaba ve şehir (79/3: görevli olan silah taşır) ↔ bina ve müştemilat (82/8: seçim güvenliğiyle görevli kolluk girer) ↔ sandık çevresi (82/2: yalnız çağrı veya ihbarla) | **Y** | ◆ | evet (yer → kural) | Y: "sandık çevresi" adı geniş bir alanı çağırır; oysa odadır | #1. Kolluğun seçim günü nerede durabileceğinin tek kuralı |
| 82/3 ↔ 82/4 | M, Sn: uyarı başkanındır; yapmazsa kurul kararla kullanır ve derhal ilçe seçim kurulu başkanına bildirir | O | ◆ | evet | — : "üst merci" sezgisi ilçe seçim kurulu başkanına, sağduyu kurula götürür | İki seçenekli (başkan ↔ kurul). Çeldirici kaynağı; yuva açılmaz |
| 82/5 | Ş, K: cebir, şiddet veya tehdit hâlinde başkan ya da **üyelerden biri** çağırır; seçmenler de ihbar eder; ihbar o yer kolluğuna **şahsen** yapılır | O | ◆ | evet | Y: "ihbar telefonla da olur" | Yedek. "Şahsen" kaydının telefonla ihbarı dışlayıp dışlamadığı iki okumalı (§6) |
| 82/7 | Sn: kolluk talebe ve karara uyar; sebep kalkınca ayrılır | D | ◆ | — | D | Tek başına yazılmaz |
| 82/8 | Ş, İ: üniformalı ve silahlı giremeyenler; istisna | O | ◆ | — | D: girebilen tek kişi görevli polistir | Tek başına yazılmaz; #1'in bir ucudur. İki seçenekli (girer ↔ giremez) |
| 82/9 | F: rozet, amblem, propaganda; kolluk uzaklaştırır | O | ◆ | — | D | İki okumalı: kolluk burada çağrısız hareket eder; bina sandık çevresini de içerir |
| 82/10 | F: cep telefonu görüşmesi; başkan uyarır, çıkarılır | D | — | — | D | Önermesi bankada |
| 82/11 | Sn: suç işlenirse kurul tutanağa geçirir, kolluğu çağırır | D/O | ◆ | — | D | Tek başına yazılmaz |
| 82/12 | M, A: bina ve müştemilatında güvenlik tedbirlerini ilçe seçim kurulu başkanı alır; talimatına sandık kurulları, **mülki ve idari makamlar** uyar | O/Y | ◆ | evet (yer → merci) | — : polis adayı "mülki amir" der (Y); genel sezgi "ilçe seçim kurulu" der (D) | Yedek. 82/1 ile örtüşür: 82/12 sandık çevresindeki düzen için de tedbir aldırır; "sandık çevresinde düzeni kim sağlar" iki cevaplıdır |
| 85 | Ş: zabıta tedbirleri seçmenin girişini engelleyemez | D | ◆ | — | D | Yazılmaz |
| 79/3 + 171 | F, A: silah taşıma yasağına aykırılık adlî para cezasıdır; fiil başka kanuna göre daha ağır suçsa o ceza üçte bir artırılır. İçki yasağı ise hapistir (md 170) | **O/Y** | ◆ | evet (fiilin niteliği → yaptırım) | Y: "silah → hapis"; "küçük fiil → idarî para cezası" | #5 |
| 79/1 ↔ 170 | S: yasak "oy verme günü", ceza "oy verme müddetince" | — | — | — | — | İki okumalı; içki yasağının süresi sorulmaz |
| 79/2 | S: eğlence yerleri oy verme süresince kapalı | D | — | — | — | Bankadaki soru bu ifadeyi şıkta taşır |
| 80 | S: 18 ve 21 | D | — | — | — | 21 bankada; kolluk bağı yok; uygulamada YSK kararıyla değişir ⚑ |
| 74 | K: kışla, karargâh, ordugâh gibi askerî bina ve tesisler, karakollar, parti binaları ve muhtarlık odalarına sandık konulamaz; yetmezse kahvehane, lokanta kiralanır | O− | ◆ zayıf | — | Y: "muhtarlık odası olur, kahvehane olmaz" | Yedek (zayıf). Ayrıntı bilgisi; sınav değeri en çok 3 |
| 94/1–2 | K, Sn: belge verilenler (sandık kurulu başkan ve üyeleri, bina sorumluları; seçim güvenliği kolluğu; kurul üyelerini ulaştırmakla görevlendirilenler); görevli olduğu sandık bölgesinde oy | O | ◆ | evet | D: "görev yerinde kullanır"; "belgeyi ilçe seçim kurulu başkanı verir" | Yedek, yalnız liste açısıyla ("belge verilenler arasında sayılmamıştır") |
| 88, 159 | F: sandık başında telkin, oyunu kullanıp ayrılmama | D/O | — | — | D | Yazılmaz |
| 92 | F: kapalı oy verme yerine telefonla girilmez; başkana teslim | D | — | — | D | Yazılmaz |
| 89 | S: sekizden on yediye | D | — | — | — | Uygulamada YSK değiştirir (89/2); yazılmaz |

**Propaganda dönemi ve toplantı düzeni**

| md | Açı | Değer | ◆ | [K→K] | Vars. | Not |
|---|---|---|---|---|---|---|
| 51/2 | M, A: kapalı yer toplantısı yapacaklar üç kişilik heyet kurar ve **en yakın zabıta amir veya memuruna haber verir** (köyde muhtara ya da vekiline). Süre, izin, içerik şartı yok | **Y** | ◆ | evet | Y: 2911'i bilen "kırk sekiz saat önce mülki amire bildirim" der; genel sezgi "ilçe seçim kurulu" der | #2. PAEM'in üç dönemde sorduğu 2911 md 10'un aynası |
| 51/7 | Ş: zabıta, muhtar ve ihtiyar meclisi, heyetin isteği veya yetkili seçim kurullarının kararı dışında hiçbir suretle müdahale edemez | Y | ◆ | evet | Y: "mülki amirin emriyle", "suç işlenirse kendiliğinden" | #2'nin öbür açısı; çekinceli (iki yol seçimlik; suç hâli iki okumalı) |
| 51/3–5 | K: heyetin görevleri; gerekirse zabıtayı çağırır; söz alacakları belirler | O | ◆ | — | D | Doğru önerme malzemesi |
| 51/8 | K: mabet, okul, askerî bina, kamu hizmeti görülen yerlerde kapalı yer toplantısı yapılamaz | D/O | — | — | D | Yazılmaz |
| 50 | M, S: açık yer toplantısının meydan, gün, sıra ve saatini ilçe seçim kurulu ad çekmeyle belirler; güneşin batmasını izleyen ikinci saatin sonundan güneşin doğmasına kadar yapılamaz | O | ◆ | — | D: "seçimde ilçe seçim kurulu" | Yazılmaz (varsayılan). #2'de çeldirici kaynağı. Saat kuralı 2911 md 7'nin iptal edilmiş fıkrasına komşudur; kullanılmaz |
| 51/A | M: büro bildirimi önce mülki amire, propaganda başlayınca ilçe seçim kuruluna; eksik büroyu mülki amir kapatır | O | — | — | D: "kapatmayı mülki amir yapar" | İki seçenekli; yuva açılmaz. #2'de çeldirici kaynağı |
| 61/1 | M: afiş yasağında işlem yetkisi otuzuncu güne kadar mülki makamlarda, son otuz günde ilçe seçim kurullarında | O | — | — | — | İki seçenekli; yuva açılmaz |
| 56 | Ş: hoparlörle propaganda | D | — | — | D | Yazılmaz |
| 57, 58 | K: hediye ve eşantiyon yasağı; dağıtanlar on sekiz yaşını doldurmuş; matbuatta Türk Bayrağı ve dini ibare yasak; farklı dil ve lehçe serbest | O− | — | — | Y: "bayrak kullanılabilir" | Kolluk bağı zayıf; genel kültür kıvamında. Yedek değil |
| 55/B | K: e-posta ve telefon mesajıyla propaganda yasak; son on günde anket yayını yasak | D/O | — | — | — | Kolluk dışı |
| 62–66, 154/2–3, 155 | Ş: kamu görevlilerinin tarafsızlığı; törenler; gezilere memurların katılmaması | — | — | — | — | Eski atıflarla dolu (ad ve atıf kuralı). 657 ve 7068 adıyla bankada. md 66'nın koruma görevlisine uygulanması ⚑. Kapsam dışı |
| 149 ↔ 150 | F: heyet kurulmamış toplantıda söz alma; toplantıya engel olma; heyeti kurmama ya da haber vermeme | O | ◆ | — | — | Ceza miktarı sorulmaz. Bilgi #2'nin açıklamasında yer alabilir: haber vermeyen tertipçi cezalandırılır |

**Seçim suçları ve usul**

| md | Açı | Değer | ◆ | [K→K] | Vars. | Not |
|---|---|---|---|---|---|---|
| 174/1 | İ, A: bu Kanundaki suçları işleyenler hakkında **sıfat ve memuriyetleri ne olursa olsun** genel hükümlere göre soruşturma ve kovuşturma yapılır | **Y** | ◆ | evet (sıfat → usul) | Y: PAEM adayı 4483 izin sistemine koşulludur | #3. 4483 bankasında ölçülmemiş |
| 174/2–6 | M: vali → Yargıtay Cumhuriyet Başsavcısı veya Başsavcıvekili, kovuşturma Yargıtayın ilgili ceza dairesi; kaymakam → il Cumhuriyet başsavcısı veya başsavcıvekili, il ağır ceza mahkemesi | O | — | evet | — | Yedek. İki seçenekli çift (vali ↔ kaymakam); 4483'ün kaymakam mercii bankada 4 kez |
| 174/7–8 | K: Hâkimler ve Savcılar Kanunu saklı; ilgililer ve siyasi partiler davaya katılabilir | D | — | — | — | Yazılmaz |
| 175 | M: bu Kanuna göre idarî para cezasına **Cumhuriyet savcısı** karar verir | O/Y | ◆ | — | Y: "seçim işi → ilçe seçim kurulu başkanı"; "kabahat → mülki amir ya da kolluk" | #4 çekinceli (md 156 ile ilişki; 5326 ızgarası bankada dolu) |
| 173/1 | Sn: seçim işleriyle görevlendirilenlerin oy verme günü ve önceki yirmi dört saatte işlediği seçim suçlarında soruşturma, kurullarınca düzenlenecek seçim tutanaklarının tanzim edildiğinin **ertesi günü** başlatılır | Y | ◆ | evet | Y: "suç işleyen derhal soruşturulur" | #6 çekinceli (173/2 ile ilişkisi ve "görevlendirilenler"in kapsamı iki okumalı) |
| 173/2 | İ: ağır ceza mahkemesinin görevine giren suçlar, asliye ceza mahkemesinin görevine giren suçüstü hâli, infazı gereken hükümler, verilmiş tutuklama kararı ya da yakalama emri dışında seçmen hakkında soruşturma ve kovuşturma yapılamaz; oy verme günü ve önceki üç gün seçmenin hürriyetini ve oy verme imkânını kaldıracak idarî ve malî tedbir alınamaz | Y | ◆ | evet | D: "suçüstü istisnadır", "ağır suç soruşturulur" | Yedek. Kolluk için en önemli hüküm, ama her kurgusu sağduyuyla çözülüyor (§7). "Bu süre içinde" atfı iki okumalı |
| 172 | F: bu yasaklara aykırı davranan cezalandırılır | O | ◆ | — | — | Madde numarası vermeyen atıf; soru olmaz |
| 133 | F: kurulların toplanmasına ya da görevine cebir, şiddet, tehdit ya da hileyle engel olma; silahla; biri silahlı en az üç kişi | O | ◆ | — | — | Ceza miktarı sorusu olur; yazılmaz |
| 134 | F: kurul ya da başkanın karar ve tedbirine ihtara rağmen uymama (idarî para cezası); uygulanmasını zorlaştırma (hapis); görevliyse artırım | O | ◆ | evet | — | TL tutarı içerir. Yalnız #4'ün kökünde fiil örneği olarak, tutarsız kullanılır |
| 138, 140 | F: görevi kötüye kullanma (TCK 257 artırımlı) | D | — | — | — | Atfın içeriği ⚑ |
| 152, 153 | F: oy karşılığı menfaat (kabul eden seçmen de aynı cezayı alır); seçmeni sandığa gelmekten alıkoyma; binaya girmesine engel olma | O | ◆ | — | — | Ceza miktarı; 1983 dili. Yazılmaz |
| 160, 161, 164 | F: yeterliği olmadan oy; başkası adına ya da mükerrer oy; sandık üzerinde fiiller; sonucu değiştirme | O | ◆ | — | — | Ceza miktarı. md 160 Şüpheli nokta 7 nedeniyle açılmaz |
| 158, 166, 167 | F: idarî para cezası gerektiren fiiller | D | — | — | — | TL tutarı |
| 170 | F: içki yasağı; hapis | O | ◆ | — | Y | #5'te çeldirici (yaptırım türü olarak) |
| 177 | İ: seçim kurulunda görevli hâkim kendi çevresindeki seçim suçu davasına bakamaz | D | — | — | D | Yazılmaz |
| 179 | K: seçim suçunun tanımı | D | — | — | — | Yazılmaz |
| 180/1 | S: altı ay | — | — | — | — | Bankada |
| 180/2 | S: izin süresi dava süresine katılmaz; üç ayı geçemez | D | — | — | — | md 174 izni kaldırdığı için alanı dar; yazılmaz |

**Kapsam dışı (kısa gerekçeyle)**

| Maddeler | Gerekçe |
|---|---|
| md 1–6, 8 | Kapsam ve ilkeler; Anayasa md 67 adıyla bankada |
| md 7 | Bankada (3 soru) |
| md 9, 32, 67 | "Kamu görevlileri seçim kurullarına yardım eder, kararlarına uyar": sağduyu |
| md 10–27, Geçici 24–25 | Kurulların oluşumu; kolluk dışı; md 10, 15, 21, 26 bankada |
| md 14 | YSK'nin görevleri: varsayılan cevap. 14/16 iki varsayılan taşır (talep vali, karar YSK) |
| md 28–48 | Seçmen kütüğü ve askı; kurum adları eski. md 40/5 (askı listelerinin korunması) düşük değerli |
| md 49 | Bankada |
| md 52–55/B | Radyo, televizyon, basın; eski kurum adları; AYM kaydı |
| md 59–61 | Afiş ve reklam yerleri; belediye işi |
| md 62–66, Ek 6 | Eski atıflar; tarafsızlık 657 ve 7068 adıyla bankada |
| md 68–78 | Araç gereç, oy pusulası, mühür |
| md 80 | Bankada; saat ezberi |
| md 85/A, 82/6 | Ceza infaz kurumu sandıkları; ölü atıf |
| md 86–93 | Oy verme işlemi; sandık kurulu işi |
| md 94/A–94/E, Ek 8 | Yurt dışı seçmen; bankada 5 soru; 94/B iptal |
| md 95–109 | Sayım, döküm, birleştirme |
| md 110–132 | İtiraz ve şikâyet; md 110, 112 bankada |
| md 135–148 | Kurul üyelerinin ve kütük görevlilerinin suçları |
| md 156 | Kabahatler md 32 atfı ⚑; md 175 ile ilişkisi iki okumalı |
| md 157, 162, 163, 165, 168, 169 | Fiil → ceza miktarı |
| md 176 | Sulh yargıcı |
| md 181–189, Ek 1–5, 7, 9, Geçici 1–23 | Gider, ücret, yürürlük, tarihî hükümler |

## §4 Değer tabloları

**Mekân basamakları (dıştan içe)**

| Yer | Tanım | Kolluk kuralı | Hüküm |
|---|---|---|---|
| seçim çevresi | il | — | md 3 |
| köy, kasaba ve şehirler | — | emniyet ve asayişi korumakla görevli olanlar dışında kimse silah taşıyamaz | 79/3 |
| seçim bölgesi | muhtarlık | — | md 4 |
| sandık bölgesi | seçim bölgesinin bölündüğü birim | belgeyle oy kullanan görevli burada oy verir | md 5, 94/2 |
| sandık çevresi dışı | — | zabıta tedbirleri seçmenin binaya girişini engelleyemez | md 85 |
| sandığın konulduğu bina, yapı ve müştemilatı | — | seçim güvenliğiyle görevli kolluk dışında üniformalı ve silahlı kimse giremez; propaganda işareti taşıyanı kolluk uzaklaştırır; güvenlik tedbirini ilçe seçim kurulu başkanı alır | 82/8, 82/9, 82/12 |
| **sandık çevresi** | sandığın konulduğu ve kurulun görev yaptığı oda, bölüm ya da bu amaçla oluşturulan yer | kolluk yalnız çağrı veya ihbar üzerine gelir; sebep kalkınca ayrılır; düzen sandık kurulu başkanına aittir | md 81, 82/1, 82/2, 82/7 |
| kapalı oy verme yeri | — | seçmen çıkmadıkça kimse giremez | md 92 |

- "Sandık çevresi" adı geniş bir alanı çağırır; Kanundaki en dar ikinci birimdir. #1'in dayandığı bilgi budur.
- İç içe yerler aynı şık takımında dikkatle kullanılır: "bina" ile "müştemilat" aynı hükmün iki yarısıdır, tek şıkta yazılır. "Kapalı oy verme yeri" sandık çevresinin içindedir; şık olmaz (ikinci doğru).

**Sandık çevresinde kim, ne zaman harekete geçer**

| Hâl | Kim | Ne yapar | Hüküm |
|---|---|---|---|
| oy kullanmaya, kurulun çalışmasına ya da sandık başı düzenine engel olmaya kalkışma | başkan | uyarır; uymayan kolluk çağrılarak uzaklaştırılır | 82/3 |
| başkan bu görevi yapmıyor | sandık kurulu, kararla | aynı yetkiyi kullanır; derhal ilçe seçim kurulu başkanına bildirir | 82/4 |
| cebir, şiddet veya tehdit | başkan ya da üyelerden biri (çağrı); seçmenler (ihbar, şahsen) | kolluk derhal uzaklaştırır, yasal işlem yapar | 82/5 |
| cep telefonuyla görüşme | başkan | uyarır; sürdüren derhal çıkarılır | 82/10 |
| suç işlenmesi | sandık kurulu | tutanağa geçirir, kolluğu çağırır | 82/11 |
| bina ve müştemilatında propaganda işareti | kolluk | uzaklaştırır | 82/9 |
| kapalı oy verme yerinden çıkmama | başkan | makul süre verip uyarır; çıkmayan çıkarılır | 92/1 |

**Yaptırım türleri (miktar sorulmaz; tür ayırt edilir)**

| Tür | Fiil | Hüküm |
|---|---|---|
| idarî para cezası | kurul ya da başkanın karar ve tedbirine ihtara rağmen uymama; sayım ve yazımda esaslara aykırılık; sandık başında ödevini ihtara rağmen yapmayan seçmen; kötü niyetle itiraz ve şikâyet | 134/1, 140/2, 158, 166, 167 |
| adlî para cezası | kurula seçildiği hâlde haklı sebepsiz göreve gelmeme; usule uymadan adaylık koyan memur ve hâkim, resmî elbiseyle propaganda yapan subay; **silah taşıma yasağına aykırılık** | 136/1, 154/1, 171 |
| hapis | içki yasağı; yasak propaganda; sandık başında telkin; sair seçim suçları | 170, 151, 159 ve ötekiler |
| hapis ve adlî para cezası birlikte | sahte imzayla sandığa oy atma | 164/1 |
| başka kanundaki cezanın artırılması | görevi kötüye kullanma; belgede sahtecilik; daha ağır suç oluşturan silah taşıma (üçte bir) | 138, 148/1, 171 |

**Süre ve saatler** (süre sorusu önerilmez)

| Değer | Yer | Durum |
|---|---|---|
| onuncu günün sabahı – önceki gün saat 18.00 | md 49 propaganda | bitiş bankada |
| saat 18.00'den sonra ve oy verme günü | 151/1 yasak propaganda | — |
| sekizden on yediye | md 89 oy verme süresi | YSK değiştirebilir |
| saat 18 ve 21 | md 80 yayın | 21 bankada |
| 09.00–23.00 | 51/A seçim bürosu | bankada |
| güneşin batmasını izleyen ikinci saatin sonu | 50/4 açık yer toplantısı | — |
| yirmi dört saat ✱ | 173/1 (görevlinin suçu: oy verme günü ve önceki yirmi dört saat) · 55/A (açık oturum) | iki okumalı (173/2 atfı) |
| üç gün ✱ | 173/2 (idarî ve malî tedbir yasağı) · 51/A (eksikliği tamamlama) · 60 | — |
| altı ay | 180/1 dava süresi | bankada |
| üç ay | 180/2 | — |
| bir ay | 14/16 (talep) · Ek 7 | — |
| otuz ve kırk gün | md 60, 61 ilan ve reklam | — |

**Merci ve aktör sıklığı** (banka metninde geçiş sayısı)

| Aktör | Geçiş | Not |
|---|---|---|
| Yüksek Seçim Kurulu | 152 | üst karar mercii varsayılanı |
| ilçe seçim kurulu | 147 (başkanı 35) | **en sık yerel merci; varsayılan** |
| sandık kurulu | 115 (başkanı 28) | sandık çevresinin varsayılanı |
| muhtar | 51 | askı, kapalı yer toplantısı (köy) |
| il seçim kurulu | 40 (başkanı 4) | |
| belediye | 31 | ilan yerleri |
| kolluk | 10 (9'u md 82) | |
| zabıta | 9 | md 26, 40, 51 (3), 67, 82 (belediye zabıtası), 85 (2) |
| mülki (amir, makam) | 9 | md 22, 30, 40, 51/A (3), 61 (2), 82/12 |
| vali · kaymakam | 3 · 2 | md 9, 14/16, 174 |
| Cumhuriyet savcısı | 1 | md 175 |
| Yargıtay Cumhuriyet Başsavcısı · il Cumhuriyet başsavcısı | md 174 | |

- **Varsayılan:** "ilçe seçim kurulu (başkanı)", "sandık kurulu başkanı", "Yüksek Seçim Kurulu". Polis adayına özgü varsayılan: "mahallin en büyük mülki amiri", "vali".
- **"Yüz metre" metinde geçmez** (0). Eski "sandık alanı" kavramı 2018'de kalktı.
- **Çiftler:** sandık kurulu başkanı (82/1, 82/3) ↔ sandık kurulu (82/4) ↔ ilçe seçim kurulu başkanı (82/12); mülki amir (51/A, 61, 2911) ↔ ilçe seçim kurulu (50, 51/A, 61) ↔ zabıta (51/2); Cumhuriyet savcısı (175) ↔ ilçe seçim kurulu başkanı ↔ mülki amir (Kabahatler sezgisi).
- **Seçimlik ve iç içe merciler aynı şık takımına girmez:** "vali" ile "il seçim kurulu başkanı" (14/16 seçimliktir); "heyetin isteği" ile "yetkili seçim kurulunun kararı" (51/7 seçimliktir); "Yargıtay Cumhuriyet Başsavcısı" ile "Başsavcıvekili"; "mahallin en büyük mülki amiri" ile "vali" ya da "kaymakam".

**İki seçenekli hükümler (yuva açılmaz; 09 brifi, 23 Kas kural 1)**

| Hüküm | İki seçenek |
|---|---|
| 51/A/2 büro bildirimi | mülki amir ↔ ilçe seçim kurulu |
| 61/1 afiş yasağında işlem | mülki makamlar ↔ ilçe seçim kurulları |
| 82/3–4 uyarı yetkisi | başkan ↔ kurul |
| 82/8 | girer ↔ giremez |
| 14/16 talep | vali ↔ il seçim kurulu başkanı |
| 51/2 haber | zabıta ↔ muhtar (şehir ↔ köy) |
| 174 özel merci | vali rejimi ↔ kaymakam rejimi |
| 80 | 18 ↔ 21 |
| 94/2 | görevli olduğu sandık ↔ kayıtlı olduğu sandık |

## §5 Ayırt etme malzemesi

- **Üç halka: nerede silah, nerede kolluk** [K→K] ◆
  - 79/3: köy, kasaba ve şehirlerde emniyet ve asayişi korumakla görevli olanlar silah taşır; başka kimse taşıyamaz.
  - 82/8: sandığın konulduğu bina, yapı ve müştemilatına yalnız seçim güvenliğiyle görevli kolluk üniformalı ve silahlı girer. Özel güvenlik görevlisi ve belediye zabıtası giremez.
  - 82/2: sandık çevresinde kolluk yalnız çağrı veya ihbar üzerine bulunur; sebep kalkınca ayrılır (82/7).
  - Eksik aday "görevli polis sandığın başında durur" ya da "polis de binaya giremez" der. İkisi de yanlıştır.
- **298 md 51 ↔ 2911** [K→K] ◆
  - 2911: düzenleme kurulu, valilik ya da kaymakamlığa bildirim, süre ve içerik (bankada; değerleri açıklamaya yazılmaz).
  - 298 md 51: üç kişilik heyet; en yakın zabıta amir veya memuruna **haber**; köyde muhtara ya da vekiline. Süre ve içerik şartı yok. Zabıta toplantıya ancak heyetin isteği veya yetkili seçim kurulunun kararıyla müdahale eder.
  - 298 md 50: açık yer toplantısının yeri ve zamanı ilçe seçim kurulundadır (2911'de mülki amir; bankada).
  - 298 51/A: seçim bürosu bildirimi mülki amire ya da ilçe seçim kuruluna yapılır. Kapalı yer toplantısıyla karıştırılır; #2'nin en güçlü çeldiricisidir.
  - 2911 md 5 bu hükümleri saklı tutar (2911-p1-13'ün ölçtüğü).
- **298 md 174 ↔ 4483** [K→K] ◆
  - 4483: memurun görevi sebebiyle işlediği suçta izin; izin mercileri (bankada, 47 soru).
  - 298 md 174/1: seçim suçunda sıfat ve memuriyet ne olursa olsun genel hükümler. İzin aranmaz.
  - 174/2–6: vali ve kaymakam için soruşturmayı yapacak merci özel olarak gösterilmiştir; bu bir izin sistemi değildir.
  - Güçlü çeldiriciler: 4483'ün izin mercileri (kaymakam, vali); "ilçe seçim kurulu başkanının ihbarı ya da izni" (md 166'daki "merciin ihbarı üzerine" kaydından aktarım).
- **Yaptırım türü** ◆: silah taşıma (adlî para cezası, md 171) ↔ içki (hapis, md 170) ↔ ihtara rağmen tedbire uymama (idarî para cezası, 134/1) ↔ tedbirin uygulanmasını zorlaştırma (hapis, 134/2).
- **İdarî para cezasında merci** ◆: md 175 Cumhuriyet savcısı ↔ Kabahatler'in genel sezgisi (idarî makam, kolluk) ↔ seçim kurulu başkanları.
- **Soruşturmanın zamanı** ◆: 173/1 (görevli: tutanakların ertesi günü) ↔ 173/2 (seçmen: sayılan hâller dışında yapılamaz) ↔ 174/1 (usul: genel hükümler) ↔ 180/1 (dava süresi; bankada).
- **Sandık çevresinde yetki zinciri** ◆: §4 tablosu. Başkan ↔ kurul ↔ ilçe seçim kurulu başkanı; çağrı ↔ ihbar.
- **Belgeyle oy** ◆: 94/1–2 (görevliler; görevli olduğu sandık bölgesi) ↔ 94/3 (milletvekilleri ve milletvekili adayları: seçmen bilgi kâğıdıyla seçim çevresi dışında da) ↔ 86/3 (genel kural: kayıtlı olduğu sandık).

## §6 Kaçınılacaklar (BAĞLAYICI)

- **Metin ve eski metin**
  - md 189'un altındaki "işlenemeyen hüküm" satırları kanun metni değildir.
  - md 94/B (mektupla oy) iptal edilmiştir; hiçbir yerde kullanılmaz.
  - "Sandık alanı", yarıçap değeri, md 83 ve 84, 85/A: hiçbir yerde.
  - md 180'in eski "iki yıl"ı yalnız çeldirici olur; md 180 zaten bankadadır.
  - Ad ve atıf kuralındaki "hiç yazılmaz" satırları.
- **Bankada ölçülmüş:** §2'deki her şey. Değerleri açıklamada da içerikle yazılmaz: altı ay (md 180), saat 18.00 (md 49), 09.00–23.00 (51/A), saat 21 (md 80), kurulların üye sayıları, md 26 listesi, md 7 listesi; 2911'in kırk sekiz saati ve bildirim içeriği; 4483'ün izin mercileri.
- **Varsayılan cevaplı ya da tek başına sezgiyle bulunan sorular**
  - "Kim belirler, kim karar verir" sorusunda cevap ilçe seçim kurulu ya da YSK ise: md 50, 56, 60, 85/A, 87, 89, 94/1 (belgeyi veren), 14 bentleri.
  - 14/16: talep eden vali, karar veren YSK.
  - 51/A/3: kapatan mülki amir (09 brifi 22 Kas kural 5).
  - 82/7, 82/10, 82/11, md 85, md 88, md 92, md 9, md 32, md 67 tek başına.
  - 82/8 "kim girebilir" biçimi.
  - 94/2 "nerede oy kullanır" biçimi.
- **Sayı:** ceza aralıkları; adlî para cezası gün sınırları; TL tutarları; saatler (md 80, 89); kurul üye sayıları; md 60–61'in gün sayıları; md 57'deki yaş.
- **İki okumalı**
  - 173/2'deki "Bu süre içinde": birinci fıkradaki "oy verme günü ile bundan önceki yirmi dört saat" mi, başka bir süre mi. Soru yalnız "oy verme günü" ile kilitlenir; yirmi dört saat ve üç gün değerleri sorulmaz.
  - 173/1 ile 173/2'nin ilişkisi: seçim işleriyle görevli kişi suçüstü yakalanırsa hangi fıkra uygulanır.
  - 173/1'deki "seçim işleriyle görevlendirilenler"in seçim güvenliğiyle görevli kolluğu kapsayıp kapsamadığı. Vaka kurul başkanı ya da üyesiyle kurulur.
  - md 172'nin hangi maddeye atıf yaptığı.
  - 82/9: kolluğun bina içinde çağrısız hareket etmesi ile 82/2'nin "çağrı veya ihbar" şartı; sandık çevresi binanın içindedir.
  - 82/1 ↔ 82/12: sandık çevresinde düzen için tedbir alma yetkisi iki mercidedir.
  - 82/3: "kolluk gücü çağrılarak" edilgendir; çağıranın yalnız başkan olduğu 82/4'ten çıkarılır.
  - 82/5: "şahsen" kaydı telefonla ihbarı dışlar mı; kolluğun genel önleme görevi (PVSK) ⚑.
  - 82/8: "resmî üniforma ve silah taşıyan" ibaresindeki "ve": sivil giyimli silahlı görevli ya da üniformalı silahsız görevli. Seçim güvenliğiyle görevlendirilmemiş, izinli polis memurunun durumu.
  - 51/7: suç işlenmesi hâlinde zabıtanın genel yetkileri ⚑.
  - 79/1 ↔ 170: içki yasağının süresi.
  - 79/3: "köy, kasaba ve şehirlerde" yer sınırı; taşıma ruhsatı ⚑; 79/4'ün saydığı alt bentlerin içeriği ⚑.
  - md 156 ↔ md 175: Kabahatler md 32'ye gönderilen fiilde kararı kim verir.
  - 94/1: başka seçim çevresinde kayıtlı görevlinin durumu ("seçimin yapıldığı çevrede oy verme hakkına sahip olduğu halde").
  - md 66: "hiçbir memur katılamaz" yasağının koruma görevlisine uygulanması ⚑.
  - 174/1 ↔ 174/7: hâkim ve savcılar için saklı tutulan usul. #3'ün vakası hâkim ya da savcıyla kurulmaz.
- **Metin dışı (⚑):** YSK genelgeleri ve kararları (oy verme saatleri, yayın yasağının erken kalkması, kimlik belgeleri, bina sorumlusunun görevleri); seçim güvenliği genelgeleri; "sandık başında kaç polis"; PVSK ve CMK'nın genel yakalama ve önleme hükümleri; 6136 taşıma ruhsatı; TCK'nın atıf yapılan maddelerinin içeriği; 5326 md 17 ve 32; 2839, 2972, 6271, 2820 ve 7062'nin hükümleri; 100 metre.
- **Düşük değerli:** "Kapsam dışı" tablosundaki bütün maddeler.

## §7 Parti önerisi: `298-p1` (en çok 6; önerilen 4)

Tek parti. PAEM bu kanunu hiç sormadı; partinin gerekçesi, kolluğun seçim günü uyguladığı ve PAEM'in sorduğu iki kanunla (2911, 4483) karışan hükümlerin bankada hiç ölçülmemiş olmasıdır. Tavan 6'dır; kestirmesiz kurulabilen çekirdek 4'tür. Üretici her yuvayı yeniden sınar; yazmadığı yuvanın gerekçesini raporlar. 3 soruyla kapanan parti başarısız değildir.

| # | Hüküm | Açı / kök | Zorluk | Doğal çeldirici kaynağı | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ md 81 + 82/2 (↔ 82/8, 79/3) | Seçimin güvenliğini sağlamakla görevli kolluk güçleri, çağrı veya ihbar olmadıkça hangisinde bulunamaz [K→K] A; doğrudan kök. Doğru: sandık çevresi. | orta/zor | Kanunun kendi mekân terimleri: seçim çevresi (md 3), seçim bölgesi (md 4), sandık bölgesi (md 5), sandığın konulduğu bina ve müştemilatı (82/8; tek şık). Beş şıkkın beşi gerçek terimdir | İç içe küme itirazı: sandık çevresi öbürlerinin içindedir. Kök "bulunamaz" dediği için mantıken tek cevaplıdır; gözcü yine sınar. Kök terimi tanımlamaz (tanımlarsa cevabı verir). "Kapalı oy verme yeri" şık olmaz. "Seçim çevresi" sağduyuyla elenen tek şıktır | "seçim günü yasakları" (yasak listesi; mekân ayrımı yok); "seçim çevresi" tanım sorusu |
| 2 | ◆ md 51/2 (↔ 2911 md 10; 298 md 50, 51/A) | Seçim döneminde bir siyasi parti adına kapalı yer toplantısı yapmak isteyenler, kurdukları heyetle birlikte kime haber verir [K→K] M, A; doğrudan kök; kök "köyler dışında" kaydını taşır. Doğru: en yakın zabıta amir veya memuru. | orta | mahallin en büyük mülki amiri (2911'in bildirim mercii ve 51/A'nın ilk dönemi; en güçlü); ilçe seçim kurulu (md 50 ve 51/A'nın ikinci dönemi; varsayılan); il seçim kurulu; Cumhuriyet başsavcılığı (partide en çok bir uydurma) | "Muhtar" şık olmaz (köyde doğrudur). Kökte "haber verir" fiili korunur; "bildirimde bulunur" 2911'i çağırır ve mülki amiri güçlendirir (kabul edilebilir), "izin alır" yazılmaz. Polis adayı "kolluk" sezgisiyle doğruyu bulabilir: kör çözücü sonucu belirleyicidir | 2911 [22], [24], [30] (bildirim); 2911-p1-13 (md 5 saklı) |
| 3 | ◆ md 174/1 (↔ 4483) | Vaka (partide tek): oy verme günü seçim güvenliğinde görevli bir polis memurunun, görevi sırasında 298'de yazılı bir suçu işlediği ileri sürülmüştür. Soruşturma nasıl yapılır [K→K] İ, A. Doğru: izin aranmaksızın genel hükümlere göre. | orta | 4483'e göre kaymakamın izniyle; valinin izniyle (4483'ün iki gerçek mercii; iki şık aynı temadır, biri seçilir); ilçe seçim kurulu başkanının ihbarı üzerine (md 166'dan aktarım); ilçe seçim kurulunun kararıyla; seçim sonuçlarının kesinleşmesinden sonra (zaman sezgisi) | Hiç bilmeyenin "suç → savcı" sağduyusu doğruya gider; PAEM adayının 4483 koşullanması yanlışa gider. Kör çözücü genel bilgiyle bulursa bu madde bilgisidir, kestirme değildir; gözcü ayırır. Vaka hâkim, savcı, vali ya da kaymakamla kurulmaz. Şıkta "il Cumhuriyet başsavcısı" ya da "Yargıtay" yazılmaz (yedek yuvanın cevabı) | 4483 bankası (izin mercileri); 3628-p1-01 (in_review) |
| 5 | ◆ md 171 (↔ 170, 134/1) | Oy verme günü silah taşıma yasağına aykırı davranan ve fiili daha ağır cezayı gerektiren başka bir suç oluşturmayan kişiye uygulanacak yaptırım [K→K] F, A; doğrudan kök. Doğru: adlî para cezası. | orta | idarî para cezası (134/1, 158; "küçük fiil" sezgisi); üç aydan altı aya kadar hapis (md 170 içki yasağının gerçek cezası; en güçlü); altı aydan bir yıla kadar hapis (151/2); taşınan silahın müsaderesi (uydurma; partide en çok bir) | Kökte "hükmolunur" yazılmaz (idarî para cezasını eler). Doğru şık "adlî para cezası"dır; gün sınırı yazılmaz. İki hapis şıkkı aynı temadır: biri çıkarılıp yerine "cezanın üçte bir oranında artırılması" (171'in ikinci cümlesi; kök "daha ağır suç oluşturmayan" dediği için yanlış) konabilir. Kök taşıma ruhsatını anmaz ⚑ | "seçim günü yasakları" (yasağın varlığı; yaptırım yok) |
| 4 | ◆ md 175 (↔ 134/1, 158) — **çekinceli** | Sandık başında, oy vermeye ilişkin ödevini ihtara rağmen yapmayan seçmene verilecek idarî para cezasına kim karar verir M; doğrudan kök. Doğru: Cumhuriyet savcısı. | orta/zor | ilçe seçim kurulu başkanı (varsayılan); sandık kurulu başkanı (ihtarı yapan); mahallin en büyük mülki amiri (Kabahatler sezgisi); kolluk görevlileri | Dört çeldiricinin kaçı 5326 bankasındaki "kim karar verir" sorularının cevabıdır: orkestratör `-benzer.txt` ile sayar (5326-p1-03 emsali). Kök md 156'nın fiiliyle kurulmaz. TL tutarı yazılmaz. Sınav değeri 3–4: tek satırlık merci hükmü | 5326 bankası (karar verme yetkisi ızgarası) |
| 6 | ◆ md 173/1 — **çekinceli** | Oy verme günü görev başındaki bir sandık kurulu üyesinin işlediği seçim suçundan dolayı soruşturma ne zaman başlatılır [K→K] Sn. Doğru: kurulun düzenlemesi gereken seçim tutanaklarının düzenlenmesinin ertesi günü. | zor | derhal (genel sezgi; #3'ün cevabına yakın, ifade ayrı tutulur); oy verme süresinin bitiminde; seçim sonuçlarının kesinleşmesinden sonra; ilçe seçim kurulu başkanının ihbarı üzerine | 173/2 ile ilişki iki okumalı (suçüstü). Kök "suçüstü" demez; ağır ceza mahkemesinin görevine giren bir fiil seçilmez. Mevzuat gözcüsü iki okumayı kapatamıyorsa RED. #3 ile birlikte yazılırsa parti içi sızıntı haritasına uyulur | md 180 (dava süresi; ayrı konu) |

- **Yedek** (değer sırasıyla):
  - 82/12: sandığın konulduğu bina ve müştemilatında güvenlik için kimin talimatına mülki ve idari makamlar uymak zorundadır. Doğru: ilçe seçim kurulu başkanı. Çeldiriciler: sandık kurulu başkanı (82/1), il seçim kurulu başkanı, YSK Başkanı, bina sorumlusu. Risk: en sık merci doğru şıktır; kökteki "mülki makamlar uyar" kaydı polis adayının "mülki amir" varsayılanını eler. #1 düşerse yazılır.
  - 82/5: cebir, şiddet veya tehdit hâlinde seçmenlerin ihbarı nasıl yapılır (o yer kolluk güçlerine şahsen). Risk: "şahsen" kaydı iki okumalı (§6).
  - 94/1: belge verilenler arasında sayılmayan (olumsuz kök; kapalı liste). Doğru: müşahitler. Çeldiriciler: bina sorumluları; seçim güvenliğiyle görevli kolluk; sandık kurulu üyelerini görev yerine ulaştırmakla görevlendirilenler; sandık kurulu üyeleri. Risk: "müşahit görevli değildir" sağduyusu.
  - 174/6: kaymakam hakkında bu Kanundaki suçtan soruşturma yapmaya ve kamu davası açmaya yetkili merci. Çeldiriciler: Yargıtay Cumhuriyet Başsavcısı (vali rejimi), 4483'ün mercii. Kolluk bağı yok; #3 yazılırsa yazılmaz.
  - 173/2: oy verme günü asliye ceza mahkemesinin görevine giren bir suçtan dolayı seçmen hakkında soruşturma hangi hâlde yapılabilir. Risk yüksek: "suçüstü" her dokunulmazlığın varsayılan istisnasıdır; olumsuz biçimde ikiz şık doğar (suçüstü olan ↔ olmayan). Kolluk değeri en yüksek hükümdür; kestirmesiz kurgu bulunamadı.
  - md 74: sandık konulabilecek yer. Sınav değeri en çok 3.
- **Dışarıda:** §3 "Kapsam dışı" tablosu; md 26, 49, 79/1–3'ün yasak listesi, md 80, md 180 (bankada); md 50, 51/A, 61, 14/16 (varsayılan ya da iki seçenekli); md 62–66; md 85; md 160.
- **Kök tipi (4 soru; 1, 2, 3, 5):** doğrudan 3, vaka 1. Olumsuz, öncüllü, boşluk ve "doğrudur" yok. Koşul→kural 4/4; ayırt etme 4/4. Olumsuz kök ancak yedek 94/1 yazılırsa girer (en çok 1).
- **Zorluk:** orta 3, orta/zor 1. Kolay soru yok; bu kanunda kolay soru varsayılan cevaplıdır. Zor soru (#6) çekincelidir.
- **Parti içi sızıntı:**
  - 3 ↔ 6: ikisi de soruşturmadır. 3 "nasıl" (usul), 6 "ne zaman" sorar. 3'ün şıklarında zaman, 6'nın şıklarında izin geçmez. 6'nın "derhal" çeldiricisi "genel hükümlere göre" ibaresini taşımaz. Aynı kısa denemeye konmaz.
  - 4 ↔ 5: 5'te "idarî para cezası" çeldiricidir. 4'ün kökü silah taşımayı örnek vermez; 5'in açıklaması idarî para cezasına kimin karar verdiğini yazmaz.
  - 1 ↔ 5: 1'in açıklaması silah taşıma yasağının yaptırımını yazmaz; 5'in açıklaması 82/8'i içerikle yazmaz.
  - 2: öbürleriyle temas yok.
  - Bankayla: hiçbir açıklama altı ayı (md 180), saat 18.00'i (md 49), 2911'in kırk sekiz saatini ya da 4483'ün izin mercilerini içerikle yazmaz.

---

## §8 Kanuna özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız güncel madde gövdesinden kurulur. "Metnin durumu" bağlayıcıdır.
   - Kolluk maddelerinde AYM iptali yoktur. 94/B iptaldir.
   - Son değişiklik 7491 (2023); kolluk maddelerinde 7102 (2018).
   - "Sandık alanı" ve yarıçap değeri hiçbir yerde yazılmaz.
   - md 189'un kuyruğu kanun metni değildir.
   - Yokluktan yargı kurulmaz. İstisna, Kanunun mutlak ifadeyle kapattığı listelerdir: 82/2 ("başka kimse bulunamaz"), 79/3 ("hiçbir kimse"), 51/7 ("hiçbir suretle"), 173/2 ("başka hiçbir sebepten").
2. **Sayı, süre, ceza.** Süre sorusu kurulmaz. Ceza aralığı, adlî para cezası gün sayısı ve TL tutarı ne doğru şık ne çeldirici ne vaka unsuru olur. Tek istisna #5'tir: yaptırım türü sorulur; hapis süreli şık yalnız türü somutlaştırmak için ve metindeki gerçek aralıkla yazılır.
3. **Varsayılan.**
   - Varsayılanlar: "ilçe seçim kurulu (başkanı)", "sandık kurulu başkanı", "Yüksek Seçim Kurulu"; polis adayı için "mahallin en büyük mülki amiri", "vali".
   - Doğru şık bunlardan biriyse soru yazılmaz (yedek 82/12 bu yüzden yedektir).
   - Varsayılan her soruda en az bir çeldiricide yer alır: #2'de mülki amir ve ilçe seçim kurulu; #3'te 4483'ün mercii; #4'te ilçe seçim kurulu başkanı.
4. **Ters ayırt etme yasağı.** Bilmeyen adayın sezgiyle bulduğu, eksik bilenin yanıldığı soru yazılmaz.

   | Sezgi | Doğruya götürdüğü yer → karar | Yanlışa götürdüğü yer (lehte) |
   |---|---|---|
   | "Seçimde her işi ilçe seçim kurulu yapar" | md 50, 56, 60, 94/1 (belgeyi veren) → yazılmaz | md 51/2 (#2), md 175 (#4) |
   | "Üst karar mercii YSK'dir" | md 14, 85/A, 87, 89 → yazılmaz | — |
   | "Güvenlik gerekçesi valiye aittir" | 14/16'nın talep edeni → yazılmaz | 82/12 (yedek) |
   | "Toplantı mülki amire bildirilir" (2911) | 51/A'nın ilk dönemi → yazılmaz | md 51/2 (#2) |
   | "Polis her yerde silahlı ve üniformalı bulunur" | 82/8 → tek başına yazılmaz | 82/2 (#1) |
   | "'Çevre' geniş bir alandır" | — | md 81 (#1) |
   | "Kolluk işi bitince ayrılır" | 82/7 → yazılmaz | — |
   | "Kolluk seçmeni engelleyemez" | md 85 → yazılmaz | — |
   | "Memur izinle soruşturulur" (4483) | — | md 174/1 (#3) |
   | "Suç işleyen derhal soruşturulur" | 174/1'in sağduyu okuması | md 173/1 (#6) |
   | "Suçüstü her dokunulmazlığın istisnasıdır" | 173/2 → kestirmesiz kurgu yok | — |
   | "Silah → hapis"; "küçük fiil → idarî para cezası" | — | md 171 (#5) |
   | "Kabahate idarî makam ya da kolluk ceza keser" | — | md 175 (#4) |
   | "Görevli, görev yerinde oy kullanır" | 94/2 → yazılmaz | — |
   | "Başkan yapmazsa kurul yapar" | 82/4 → yazılmaz | — |
5. **Koşul → kural ekseni.** Kök tek bir koşulu sabitler; şıklar aynı karar uzayından gelir.
   - yer → kolluğun bulunma kuralı (#1);
   - toplantının türü (kapalı yer, seçim dönemi) → haber verilecek merci (#2);
   - failin sıfatı (memur) → soruşturma usulü (#3);
   - fiilin niteliği (daha ağır suç oluşturmayan silah taşıma) → yaptırım türü (#5).
6. **Çakışma ve mükerrer.** 298 sorusu şunları sormaz: Anayasa md 67 ve 79'un içeriği; 2911 md 4, 6, 10'un kuralı; 4483'ün izin mercileri ve usulü; 2839, 2972, 6271, 2820, 7062; 657 ve 7068'in siyasi faaliyet yasağı; §2'deki banka soruları. Başka kanunun hükmü yalnız çeldirici olur ve o kanunun bankadaki sorusunun cevabını vermez.
7. **İki okumalı hükümler** doğru şıkta, çeldiricide ve açıklamada kullanılmaz (§6 listesi). En önemlileri: 173/2'nin süresi; 173/1 ↔ 173/2; 82/9 ↔ 82/2; 82/1 ↔ 82/12; 82/5'teki "şahsen"; 82/8'deki "ve"; 51/7'de suç hâli; 79/1 ↔ 170; md 156 ↔ 175.
8. **Vaka.** 1–2 cümle, en çok 250 karakter; partide en çok bir (#3). Unvanlı yazılır; ad, parti adı, il adı ve gerçek seçim tarihi yok.
   - "Polis memuru" yazılabilir. "Belediye zabıtası" yalnız 82/8 önermesinde geçer.
   - Vaka hâkim, savcı, vali, kaymakam, milletvekili ya da adayla kurulmaz (özel rejimler).
   - Silah vakası ateşli silahla kurulur; taşıma ruhsatı anılmaz.
   - Sandık vakasında yer açık yazılır: "sandık çevresi", "sandığın konulduğu bina".
9. **Liste soruları.** "Sayılmamıştır" yalnız Kanunun mutlak ifadeyle kapattığı listede kurulur: 82/2, 94/1, 173/2, 74 (askerî bina kaydı "gibi" taşır; kök "Kanunda açıkça sayılan" der). md 82/2 listesinde "o sandık bölgesinde kayıtlı seçmen" bulunduğu için, sayılmayan kişi ayrıca seçmen olabilir; kök sıfatı kilitlemeden bu liste sorulmaz.
10. **Biçim ve sızıntı.**
    - Kök "298 sayılı Kanun'a göre," ile açılır. Madde, fıkra, bent numarası yazılmaz.
    - Kanunun kendi mutlak ifadesi doğru şıkta ya da doğru önermede durabilir: "başka kimse bulunamaz", "hiçbir suretle müdahale edemezler", "giremezler", "uymak zorundadır".
    - md 82 uzundur; doğru şık ölçülen unsura kısaltılır.
    - Parti içi sızıntı haritası §7'dedir.
11. **Dil.** 1961 metni eski dildedir; 2010 ve 2018 fıkraları yenidir. Terimler aşağıdaki gibi kullanılır; anlam değiştiren sadeleştirme yasaktır.

    | Metindeki ifade | Kök ve şıkta | Kural |
    |---|---|---|
    | sandık çevresi · sandık bölgesi · seçim bölgesi · seçim çevresi · kapalı oy verme yeri · sandık seçmen listesi · müşahit · seçme yeterliği | korunur | terimdir |
    | sandığın konulduğu bina, yapı ve bunların müştemilatı | "sandığın konulduğu bina ve müştemilatı" | "okul", "bahçe" yazılmaz; "sandık alanı" YASAK |
    | kolluk güçleri (md 82, 94) ↔ zabıta amir ve memurları (md 51, 85) | metindeki terim korunur | md 51 ve 85'te "belediye zabıtası" YASAK |
    | seçimin güvenliğini sağlamakla görevli kolluk güçleri (82/8, 94) ↔ çağrı veya ihbar üzerine gelen görevli kolluk güçleri (82/2) ↔ emniyet ve asayişi korumakla görevli olanlar (79/3) | üç ifade ayrı tutulur | birbirinin yerine yazılmaz |
    | çağrı ↔ ihbar | ayrı tutulur | çağrıyı başkan, üye ya da kurul yapar; ihbarı seçmen |
    | haber verirler (51/2) | korunur | "izin alırlar", "başvururlar" YASAK |
    | hiçbir suretle müdahale edemezler | korunur | — |
    | inzıbat tedbirleri | "düzen ve güvenlik tedbirleri" | — |
    | mabetler | korunur | — |
    | ispirtolu içki | korunur | "alkollü içki" yalnız açıklamada |
    | umumi mahal · umuma açık yer | "umuma açık yer" | — |
    | matbua · şayia · tağyir · butlan · selahiyet | "basılı yayın" · "söylenti" · "değiştirme" · "geçersizlik" · "yetki" | — |
    | yargıç | "hâkim" | — |
    | umumi hükümler dairesinde | "genel hükümlere göre" | "izin alınmaksızın" ibaresi metinde yoktur; şıkta "izin aranmaksızın" yazılabilir (174/1 "sıfat ve memuriyetleri ne olursa olsun" der), açıklama dayanağı bu ifadedir |
    | soruşturma ↔ kovuşturma | metindeki ayrım korunur | 173/1 "soruşturma başlatılır"; 180/1 "kovuşturma yapılamaz" |
    | idarî para cezası ↔ adlî para cezası | ayrı tutulur | "para cezası" tek başına YASAK |
    | mahallin en büyük mülki amiri · mülki makamlar | korunur | "vali", "kaymakam" tek başına yazılmaz (md 174 hariç) |
12. **Parti dışı temas.**
    - **298 ↔ 2911:** 2911 partileri ve bankası bildirim usulünü ölçer. 298 sorusu 2911'in kuralını doğru şık yapmaz; 2911 md 5'in "saklıdır" hükmünü açıklamada cevap biçiminde yazmaz.
    - **298 ↔ 4483 ↔ 3628:** üçü de "izin sistemi uygulanmaz" yapısını taşır. Her soru kendi kanununun suçuyla kurulur; açıklamalar öbür kanunları anmaz.
    - **298 ↔ 5326:** idarî para cezasına karar verme yetkisi bankada 5326 adıyla doludur; #4 yalnız 298'e özgü merciyi ölçer.
    - **298 ↔ 6136:** taşıma ruhsatı ve ruhsatsız taşımanın cezası 6136'nındır ⚑.
    - **298 ↔ 7068 / 657:** siyasi faaliyet yasağı o adlarla bankadadır; 298 md 62–66 ve 154 sorulmaz.

### Gözcü kontrol listesi

1. **Kör çözüm.**
   - Doğru şık bir varsayılanla mı bulunuyor: ilçe seçim kurulu (başkanı), sandık kurulu başkanı, YSK, mülki amir, vali?
   - §8 kural 4'teki sezgilerden biriyle mi bulunuyor?
   - Kök cevabı çağırıyor mu: "sandığın başında" → "sandık çevresi"; "zabıta" sözcüğü kökte → "zabıtaya haber"; "memur" → "izin"; "hükmolunur" → adlî ceza; "savcı" kökte → "Cumhuriyet savcısı"?
2. **Ters ayırt etme.** 2911'i, 4483'ü ya da Kabahatler'i bilen eksik aday yanılıyor, hiç bilmeyen aday buluyor mu? Taze kör çözücü madde bilgisi olmadan buluyorsa RED. #3'te "suç → savcı" sağduyusu ile madde bilgisi ayrı ayrı not edilir.
3. **Mükerrer ve çakışma.** §2 haritası ve `-benzer.txt`. Özellikle: "seçim günü yasakları" sorusu; "sandık kurulunda görev alabilir"; md 180 sorusu; 2911 [21], [22], [24], [30] ve 2911-p1-13; 4483 bankası; 3628-p1-01; 5326'nın karar verme yetkisi soruları.
4. **Güncellik.** Doğru şık, çeldirici ya da açıklama şunlardan birine dayanıyor mu: sandık alanı ya da yarıçap; md 83, 84, 85/A; 94/B; md 189'un kuyruğu; Başbakan, Bakanlar Kurulu, sulh yargıcı, Seçmen Kütüğü Genel Müdürlüğü; TL tutarı; md 180'in eski iki yılı (çeldirici dışında)?
5. **İki okumalı.** §6'daki bir unsur doğru şıkta, çeldiricide ya da açıklamada mı? #6'da 173/2 istisnası devreye giriyor mu?
6. **Sayılar.** Ceza aralığı, gün sayısı, saat ya da TL soruluyor mu? RED. #5'te doğru şık gün sınırı taşıyor mu?
7. **Şık takımı.**
   - #1'de "bina" ile "müştemilat" ayrı şıklarda mı; "kapalı oy verme yeri" şıkta mı? RED.
   - #2'de "muhtar" şıkta mı (kök köyü dışlamıyorsa iki doğru)?
   - #3'te 4483'ün iki mercii (kaymakam, vali) iki ayrı şıkta mı (aynı tema)? "il Cumhuriyet başsavcısı" şıkta mı?
   - #5'te iki hapis şıkkı aynı temayı mı taşıyor?
   - 51/7 açısı yazılmışsa "seçim kurulu" içeren bir şık var mı (ikinci doğru yol)? "Suç işlenmesi hâlinde" şıkkı var mı (iki okumalı)?
   - İki şık birbirinin tersi mi? Aynı hükmün iki yarısı iki şıkta mı?
8. **Sağduyu ve yankı.** Sağduyuyla birden çok şık eleniyor mu? Doğru şık kökteki bir sözcüğü yankılıyor mu ("çağrı" ↔ "çağrı üzerine")?
9. **Sınav değeri.**
   - `sinavDegeri` en çok 2: kurulların oluşumu; seçmen kütüğü; oy pusulası ve sayım; itiraz usulü; radyo ve televizyon; ilan yerleri; gider ve ücret; geçici ve ek maddeler; md 74 (en çok 3).
   - RED: md 85, 82/7, 82/10, 9, 32, 67 tek başına; md 50 ve 14/16 merci sorusu; 51/A/3 kapatma mercii; ceza aralığı sorusu.
10. **Parti oranları.** Koşul→kural en az 1/4, ayırt etme en az 1/10; olumsuz kök en çok 1/4; vaka, boşluk ve "doğrudur" en çok birer tane; doğru harfler dengeli; uydurma değer partide en çok bir; üst sınır 6 (önerilen 4).

---

## Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

1. **Banka md 189:** gövdede "26/4/1961 Tarihli ve 298 Sayılı Ana Kanuna İşlenemeyen Hükümler / 1 – 13/9/1991 tarih ve 455 sayılı KHK'nin Geçici Maddesi …" satırları duruyor. Kanun metni değildir; banka metninden çıkarılmalı. Resmî sayfadaki ikinci kalem (5980 Geçici Madde 1) bankada zaten yok.
2. **md 94/B:** AYM 2008'de maddeyi mektupla oy kullanma yönünden iptal etti; iptal yalnız dipnottadır. Madde gövdesi resmî metinde de bankada da duruyor ve mektupla oyu ayrıntılı anlatıyor. Bankada dipnot olmadığı için okuyan kullanıcı ve özet/kart üreticisi maddeyi yürürlükte sanabilir.
3. **md 85/A, md 145/4, md 172:** ölü ya da numarasız atıflar (mülga 83, 84; mülga 139; "kovuşturma ve soruşturma usullerini gösteren madde"). Resmî metinde de böyle.
4. **md 82 yedinci fıkra:** kolluğun talebe ve karara uyma yükümlülüğü art arda iki cümlede yineleniyor. Resmî metinde de böyle (7102 değişikliğinin işlenişinden).
5. **md 79 ↔ md 170:** içki yasağı "oy verme günü", cezası "oy verme müddetince" işlenen fiil için.
6. **Eski kurum adı kalıntıları (resmî metinde de var):** md 110'da "Cumhuriyet Senatosu üyeleri"; md 14/12, 28, 33, 41, 45–47, 122–124'da "Seçmen Kütüğü Genel Müdürlüğü" (7062 ile kaldırıldı); Ek 1'de "seçmen kartları"; md 189 "Bakanlar Kurulu"; md 176 "sulh yargıcı"; md 26'da 648 sayılı Kanun; md 63'te 5830 sayılı Kanun.
7. **Banka, TCK başlıklı soru (298 diğer konu dosyası, son soru):** mükerrer oy kullanan seçmenin suçu için anahtar "özgü suç". 298 md 160/3 ve 160/2 "mükerrer oy vermeye teşebbüs eden veya veren" kişiyi aynı cezayla cezalandırır; bu kalıp öğretide "kalkışma suçu" diye anılır ve o da şıklarda (A). Anahtarın doğruluğu bu turda **doğrulanamadı**; sorunun kaynağına bakılarak incelenmeli.
8. **Banka, 298 konusundaki beşinci soru ("YSK'nin prensip kararları hangi süre içinde Resmî Gazetede yayımlanır": 15 gün):** 298 metninde "prensip kararı" ya da bu süre geçmiyor. Dayanak başka bir kanun olmalı (YSK teşkilat kanunu olabilir; **doğrulanamadı**). Sorunun madde bağı boş ("md ?"); konu etiketi 298 olmamalı.
9. **Banka, "il seçim kuruluyla ilgili hangisi yanlıştır" sorusu:** doğru sayılan D önermesi "başkanın yokluğunda en kıdemli asıl üye başkanlık eder" diyor. md 15/2 "asıl ve yedek üyelerden en kıdemli hâkim" der. Anahtar (C: dört yıl) doğrudur; D önermesi metne tam uymuyor.
10. **Banka, "seçim günü yasaklarından biri değildir?" sorusu:** kök cümlesi bozuk ("aşağıdakilerden hangisi" eksik). E önermesi ("sandık kurulu görevlilerinin görev dışında cep telefonuyla görüşmesi") md 82'nin kuralını daraltarak aktarıyor: yasak, kurulun görev yaptığı yerde herkes içindir.
11. **2954 sayılı Kanuna atıf (md 55/A):** atıf yapılan maddelerin bugün yürürlükte olup olmadığı bu turda denetlenmedi.
12. **2024–2026 değişiklikleri:** mevzuat.gov.tr'nin değişiklik tablosu 7491 (2023) ile bitiyor. Resmî Gazete ayrıca taranmadı.
