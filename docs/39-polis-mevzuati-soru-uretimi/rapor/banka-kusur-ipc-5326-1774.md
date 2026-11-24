# Yayındaki İPC tablosu kökenli 5326 ve 1774 sorularının denetimi (23 Kas 2026)

Bu belge, kaynak etiketi "Özgün soru · … · 2026 İPC uygulama tablosu" olan yayındaki 5326 ve 1774 sorularını resmî kanun metnine karşı denetler. Önceki denetim (`banka-kusur-6458-7201.md`) tablonun resmî metinden sapmalarını aynı tablodan üretilmiş 6458 sorularında bulmuştu; bu belge aynı örüntüleri bu gruptaki sorularda arar.

**Uygulandı (23 Kas 2026, kullanıcı onayı: "Evet, hepsini uygula").** İki soru yayından çekildi, yedi açıklama düzeltildi; ayrıntı ve doğrulama en sondaki "Uygulama" bölümünde.

## Özet

| Soru | Konu | Bulgu | Çürütücüler | Karar önerisi |
|---|---|---|---|---|
| `6f5938d5` | yetkili makam, beş kanun | B çeldiricisi (hususi araçta sigara → kolluk) metne dayanmıyor; B de ikinci cevap olabiliyor | savcı ÇEKİLMELİ (yüksek), savunucu ÇEKİLMELİ (orta) | **Çekilir** |
| `bc821785` | 1774, dört öncül | III öncülü kanunda olmayan "konutta barındırma yasağı" öğretiyor; anahtar D düşüyor | savcı ÇEKİLMELİ (yüksek), savunucu ÇEKİLMELİ (orta) | **Çekilir** |
| `08f3c979` | 5326 md 43, havalı tüfek | Md 43'ün ruhsatsız havalı tüfeğe uygulanması tartışmalı; açıklama tabloya dayanıyor | savcı ÇEKİLMELİ (orta), savunucu AÇIKLAMA DÜZELTİLMELİ (yüksek) | 1-1: soru kalır, **açıklama düzeltilir, bildirilir** |
| `fce0a9b8` | 5326, elkoyma | Açıklama 2026'da eklenen md 43/C'yi bilmiyor ("yalnızca iki kabahatte") | — | Açıklama baştan yazılır |
| `1e44c394` | 5326, en yüksek ceza | Açıklamada "on kat" (kanunda yirmi kat) ve tablo atfı; D şıkkındaki "(gerçek kişi)" md 36/2'yi lafzen dışlamıyor | D şıkkı: savcı ÇEKİLMELİ (orta), savunucu AÇIKLAMA DÜZELTİLMELİ + BİLDİRİLİR (yüksek) | 1-1: soru kalır, **açıklama baştan yazılır, bildirilir** |
| `9234e990` | 4250 md 7 | Açıklamada tablo atfı | — | Açıklama düzeltilir |
| `38acc1e6` | 5326 md 17/6 | Açıklamada tablo atfı | — | Açıklama düzeltilir |
| `051e8d97` | 5326 md 42/A | Açıklamada tablo atfı; "tabanıyla" | — | Açıklama düzeltilir |
| `a9edc0ef` | 1774 md 3 ve 15 | Açıklama bildirimi işleticiye yüklüyor (kanunda sahip veya kanuni temsilci) | — | Açıklama düzeltilir |
| `244a9c7b` | 1774 Ek md 1 | — | — | Dokunulmaz |
| `771934ff` | 1774 Ek md 3 | — (kanunun kendi iç farkı bildirildi) | — | Dokunulmaz |
| `fa8fec6c` | 2920 md 144 | — | — | Dokunulmaz |
| `39da3442` | 5326 md 36 | — (küçük not) | — | Dokunulmaz |
| `3dea855a` | yetkili makamlar | — | — | Dokunulmaz |
| `5e57ed04` | tekerrür rejimleri | önceki raporda düzeltildi; yeni bulgu yok | — | Dokunulmaz |

Sayılar: 15 soru denetlendi; 2 çekme ve 7 açıklama düzeltmesi önerildi; 6 soruya dokunulmaz. İki soruda (08f3c979, 1e44c394) çürütücüler 1-1 bölündü: ilke gereği kalırlar, kullanıcıya bildirildi.

## Kapsam

Görev, kaynak etiketi "Özgün soru · … · 2026 İPC uygulama tablosu" olan yayındaki 17 soruydu: 5326 konusunda 13, 1774 konusunda 4. Sayı, 23 Kas 2026 sabahki `banka-kusur-6458-7201.md` sayımından geliyor. Bugünkü salt okunur dökümde durum şöyle:

| Grup | Görevdeki sayı | Bugün yayında | Not |
|---|---:|---:|---|
| 5326 konusu | 13 | 11 | `3dc788e5` (4207 md 5) ve `61cf72cf` (5199) 23 Kas 2026 00:20 UTC'de kullanıcı kararıyla arşivlendi (başka oturum, origin/main `dca17090`). Kapsam dışı. |
| 1774 konusu | 4 | 4 | |
| 6458 konusu | — | 2 | `1eb06eb0`, `068897c3`: önceki raporda denetlendi ve düzeltildi. Kapsam dışı. |

Denetlenen: 15 soru. `5e57ed04` önceki raporda denetlenmiş, açıklaması 23 Kas'ta düzeltilmişti; bugünkü metni yeniden kontrol edildi. On beş sorunun hiçbiri bir denemede kullanılmamış; hepsi 24 Ağu 2026'da yayımlanmış, sürüm 1, son inceleme tarihi boş.

Bu sorular 21 Kas 2026'da bir kez kör çözüldü (`docs/32-yayin-denetimi/ozgun-soru/01-rapor.md`, origin/main): 218 sorunun hepsinde kör cevap anahtarla aynıydı. Bu denetim ondan farklı olarak tablonun resmî metinden sapma örüntülerini arıyor. Kör çözümün göremediği iki kusur (6f5938d5 ve bc821785) tam bu sapmalardan doğuyor: ikisinde de çeldirici ya da öncül, tablonun kanundan geniş satırını aynen taşıyor.

## Yöntem

1. **Döküm.** Sorular salt okunur betikle, `connection_limit=1` ile çekildi: kök, şıklar, açıklama, künye, durum, deneme kullanımı.
2. **Resmî metin.** mevzuat.gov.tr tam metin ucundan (`/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=1&MevzuatNo=<no>&MevzuatTertip=<t>`) bugün indirildi, depodaki `htmlToMetin` ile düz metne çevrildi, her dosyanın başlığı doğrulandı.
3. **Örüntü taraması.** Her soru, önceki raporda bulunan dört sapma örüntüsüne karşı tek tek okundu: eski kanun ibaresi, seçimli mercileri tek merciye indirme, sonradan eklenen kaydın eksikliği, açıklamada tablo atfı. Tablonun ilgili satırları da (kullanıcının `~/Downloads/2026 IPC Tablosu.xlsx` dosyası, 2.297 satır) soruyla yan yana kondu.
4. **Çürütücüler.** Esasa ilişkin kusur iddiası olan sorular iki bağımsız ajana verildi: savunucu iddiayı çürütmeye, savcı doğrulamaya çalıştı. Birbirlerinin çalışmasını görmediler. Çekme önerisi yalnız ikisi de esasa ilişkin kusur gördüğünde yapıldı.
5. **Açıklama düzeltmeleri.** Birebir "eski → yeni" metinler yazıldı; her eski ibarenin açıklamada tek geçtiği yerel dökümde ölçüldü. Bağımsız bir denetçi lafzı, tek geçişi, yan etkiyi ve dili denetledi.

Çalışma dosyaları scratchpad'de, `ipc-denetim/` altında (oturum klasörü `6c2589e6-…`):
- betikler `betik/`, döküm `sorular.json`, resmî metinler `indir/`, kanıt paketi `kanit-paketi.md`;
- çürütücü raporları `curutucu-savunucu.md`, `curutucu-savci.md`; 1e44c394 D şıkkı için `curutucu-savunucu-ek.md`, `curutucu-savci-ek.md`;
- denetçi raporları `denetci-duzeltme-1.md` (altı değişiklik), `denetci-duzeltme-2.md` (08f3c979), `denetci-duzeltme-3.md` (1e44c394);
- birebir değişiklikler `degisiklikler-onay.json`.

## Kaynaklar

Resmî metinler, hepsi mevzuat.gov.tr konsolide metni, 23 Kas 2026'da indirildi:

| Kanun | Tertip | Bakılan hükümler |
|---|---|---|
| 5326 Kabahatler Kanunu | 5 | md 15, 16, 17, 18, 22, 27, 32–43/C; dipnot [8], [11]; yürürlük cetveli |
| 1774 Kimlik Bildirme Kanunu | 5 | md 1–4, 6, 7, 9, 10, 15, 17, 18, 20, Ek 1, Ek 3 |
| 4207 Tütün Ürünlerinin Zararlarının Önlenmesi ve Kontrolü Hakkında Kanun | 5 | md 2, 5 |
| 4250 İspirto ve İspirtolu İçkiler İnhisarı Kanunu | 3 | md 6, 7 |
| 7258 Futbol ve Diğer Spor Müsabakalarında Bahis ve Şans Oyunları Düzenlenmesi Hakkında Kanun | 3 | md 5 |
| 2920 Türk Sivil Havacılık Kanunu | 5 | md 144 |
| 6458 Yabancılar ve Uluslararası Koruma Kanunu | 5 | md 102 |
| 2559 Polis Vazife ve Salâhiyet Kanunu | 3 | md 8 |

Çürütücülerin ayrıca kullandığı kaynaklar (raporlarında URL'leriyle):
- 6136 sayılı Kanun ve Ateşli Silahlar Yönetmeliği; 2521 sayılı Kanun (mevzuat.gov.tr).
- Kimlik Bildirme Kanununun Uygulanması İle İlgili Yönetmelik (RG 13/7/1974-14944; ikincil kaynaktan konsolide metin, 2022 değişikliği RG 31869'dan kontrol edildi).
- TBMM Sıra Sayısı 840 (Kabahatler Kanunu Tasarısı ve Adalet Komisyonu Raporu) ve Sıra Sayısı 463 (6487 sayılı Kanun).
- Yargıtay Ceza Genel Kurulu, 26/9/2006, E. 2006/2-198, K. 2006/199 (ikincil depolardan).
- EGM 2019 Trafik İdari Para Ceza Rehberi; Uyuşmazlık Mahkemesi 2025/713 ve 2026/175 E. kararları.

Üretim kaynağı olan tablo hukuki dayanak değildir; burada yalnız sapmanın nereden geldiğini göstermek için kullanıldı.

## Tablonun sapma örüntüleri bu sorularda

| Örüntü | Bu gruptaki karşılığı |
|---|---|
| 1. Eski kanun ibaresi | Bulunmadı. Tablo bu kanunlarda güncel: 1774 Ek md 1 (7565, 2025), Ek md 3 (7533, 2024), 2920 md 144 (7519, 2024), 5326 md 42/A (7547, 2025), 4250 md 7 (7255, 2020). |
| 2. Seçimli mercileri tek merciye indirme | Tablo 6458 md 102'de yalnız "KOLLUK" diyor (kanunda valilik, Genel Müdürlük ya da kolluk birimleri); 5326 md 33, 36, 37 ve 42'de de yalnız "KOLLUK" (kanunda "kolluk veya belediye zabıta görevlileri"). Sorulara geçtiği tek yer `6f5938d5`'in açıklaması ("Diğer dört kalemde ceza doğrudan kolluk tarafından verilir"). `39da3442` merciyi doğru veriyor. |
| 3. Sonradan eklenen kaydın eksikliği | `fce0a9b8`: 7593 sayılı Kanunla eklenen md 43/C (18/8/2026'da yürürlükte) elkoyma ve mülkiyetin kamuya geçirilmesi öngörüyor; açıklama "yalnızca iki kabahatte" diyor. |
| 4. Açıklamada tablo atfı | Beş açıklama: `9234e990`, `38acc1e6`, `1e44c394`, `051e8d97`, `08f3c979`. |
| 5. (Yeni) Tablo satırının kanundan geniş ifadesi soruya aynen geçmiş | `6f5938d5` B (tablo satırı "HUSUSİ ARAÇLARIN SÜRÜCÜ KOLTUKLARINDA … KOLLUK"; kanunda makam yok), `bc821785` III (satır 27, "KONUT VE İŞYERİNDE BARINDIRMAK"), `08f3c979` (md 43 satırı "HAVALI TÜFEK VE TABANCALARI"), `1e44c394` D şıkkı (md 36 satır çifti "(GERÇEK KİŞİ) / (TİCARİ İŞLETME)"; kanunda ölçüt ticarî işletme faaliyeti), `a9edc0ef` açıklaması (md 15 satırı: işletici kendi kimliğini bildirir). |

Ayrıca beş sorunun kökü "2026 (yılı) idarî para cezası uygulamasına göre" diye başlıyor: `fa8fec6c`, `9234e990`, `6f5938d5`, `38acc1e6`, `08f3c979`. Tabloyu anmıyor, ama soruyu kanuna değil bir yılın uygulamasına bağlıyor ve 2027'de eskitiyor. Biçimsel; kök değişmez, bildirilir.

## Çürütücü sonuçları

| Soru | Savcı | Savunucu | Karar (ilkeye göre) |
|---|---|---|---|
| `6f5938d5` | ÇEKİLMELİ (yüksek) | ÇEKİLMELİ (orta) | 2-0: çekilir |
| `bc821785` | ÇEKİLMELİ (yüksek) | ÇEKİLMELİ (orta) | 2-0: çekilir |
| `08f3c979` | ÇEKİLMELİ (orta) | AÇIKLAMA DÜZELTİLMELİ (yüksek) | 1-1: soru kalır, açıklama düzeltilir, kullanıcıya bildirilir |
| `1e44c394` (D şıkkı) | ÇEKİLMELİ (orta) | AÇIKLAMA DÜZELTİLMELİ, parantez BİLDİRİLİR (yüksek) | 1-1: soru kalır, açıklama düzeltilir, kullanıcıya bildirilir |

## Soru soru

### 6f5938d5 — kolluğun yetkili olmadığı fiil (anahtar: C, 7258 md 5/1-d)

**Kök:** "2026 idarî para cezası uygulamasında, aşağıdaki fiillerden hangisinde cezayı vermeye kolluk görevlileri yetkili değildir?" Şıklar: A 6458 md 102 (yasa dışı giriş), B 4207 md 5 (hususi araçta sürücü koltuğunda sigara), C 7258 md 5 (bahis oynama), D 5326 md 43 (havalı tüfek), E 5326 md 34 (kumar).

**Bulgu.** C doğru: 7258 md 5/1-d cezayı "mahallin en büyük mülki idare amiri"ne verir. Ama B'de kolluğun yetkisi metinden kurulamıyor:

> 4207 md 5/1: "2 nci maddenin birinci ve dördüncü fıkralarında belirtilen alanlarda tütün ürünleri tüketenler … 5326 sayılı Kabahatler Kanununun 39 uncu maddesi hükmüne göre cezalandırılır."
> 5326 md 39/2: "Toplu taşıma araçlarında tütün mamulü tüketen kişiye, elli Türk Lirası idarî para cezası verilir. Kabahatin özel hukuk kişileri tarafından işletilen toplu taşıma araçlarında işlenmesi halinde bu ceza ilk başvurulan kolluk birim yetkilileri tarafından verilir. …"
> 5326 md 22: "(1) Kabahat dolayısıyla idarî yaptırım kararı vermeye ilgili kanunda açıkça gösterilen idarî kurul, makam veya kamu görevlileri yetkilidir. (2) Kanunda açık hüküm bulunmayan hallerde ilgili kamu kurum ve kuruluşunun en üst amiri bu konuda yetkilidir."

Md 39 kamu hizmet binaları, toplu taşıma araçları ve özel hukuk kişilerine ait binalar için makam sayar; hususi aracı saymaz. Md 22/2'ye göre yetki "en üst amir"dedir, sahadaki kolluk görevlisinde değil. Bu okumada B de kökü karşılar: iki doğru cevap.

**Çürütücüler.**
- Savcı (ÇEKİLMELİ, yüksek): 6487'nin gerekçesi yasağı ekliyor ama makam belirlemiyor. EGM'nin 2019 Trafik İdari Para Ceza Rehberi, kanunun makam göstermediği satırlarda "5326 sayılı Kabahatler Kanununun 22/2 fıkrası uyarınca … en üst amiri tarafından uygulanır" yazıyor. Uygulamada polisin bu cezayı kesmesi (İçişleri, 2019) yetkiyi kanıtlamıyor.
- Savunucu (ÇEKİLMELİ, orta): kurabildiği en güçlü savunma, md 5/1'in md 39'a "hükmüne göre" yollamasından özel kişinin aracında kolluk yetkisine kıyastı. Md 39/2 açıkça yalnız "toplu taşıma araçları"nı saydığı ve md 22/1 "açıkça" gösterilmeyi aradığı için çöktü. Uyuşmazlık Mahkemesinin 2025/713 E. dosyasında polis, kanunun mülki amire verdiği bir 4207 cezasını kendisi kesmiş; uygulama yetkinin kanıtı değil.
- İkisi de emsale işaret ediyor: aynı önerme 3dc788e5'te anahtardaydı ve bugün kullanıcı kararıyla arşivlendi; burada çeldiricide, ama "hangisi değildir" sorusunda tek cevaplılık bütün çeldiricilerin doğru olmasına bağlı.

**Ek kusur (açıklama).** "Diğer dört kalemde ceza doğrudan kolluk tarafından verilir." A için eksik (6458 md 102/5: "valilik veya Genel Müdürlük ya da kolluk birimlerince"), B için dayanaksız. Soru çekileceği için düzeltilmez.

**Karar.** Çekilir (`bozuk`).

### bc821785 — 1774, dört öncül (anahtar: D, "I, II, III ve IV")

**Kök:** "1774 sayılı Kimlik Bildirme Kanunu uygulamasına göre; I. Konaklama tesisi dışındaki işyerlerinde çalışanların kimlik bildirimi 3 gün içinde yapılır. II. Aile reisleri, konutlarında 30 günden fazla kalan misafirleri 3 gün içinde kolluğa bildirir. III. Kimliğini resmî belgeyle ispat edemeyen kimseleri konut ve işyerinde barındırmak veya çalıştırmak yasaktır. IV. İzinsiz sabahçı kahvesi işletmek bu Kanun kapsamında idarî para cezası gerektirir. ifadelerinden hangileri doğrudur?" Şıklar: A I-II, B I-II-III, C II-IV, D hepsi, E III-IV.

**Bulgu.** III kanunda olmayan bir yasak öğretiyor:

> Md 9: "Bu Kanun hükümlerine göre kimlik bildirme belgesini yetkili idareye vermekle yükümlü tutulanlar, kimliğini nüfus hüviyet cüzdanı ve diğer resmi geçerli belgelerle ispat edemeyen kimseleri tesislerinde barındıramaz, konut ve işyerlerinde çalıştıramaz."

Kanun "barındırma"yı tesise, "çalıştırma"yı konut ve işyerine bağlar; konutta kalanlar için yasak değil, bildirim rejimi kurar (md 7/a). Uygulama Yönetmeliği md 5 aynı ayrımı tekrarlar. III ayrıca yasağı bildirim yükümlülerinden herkese yayıyor. İfade tablonun 27. satırının aynısı.

III yanlış olunca D hiçbir okumada doğru değil. "I, II ve IV" şıkkı olmadığından doğru şık kalmıyor; I de dar okunursa doğru cevap C oluyor. I, II ve IV ayrıca sınandı: II doğru (md 7/a; yönetmelik 1974'te çıktığı için md 7 yürürlükte), IV savunulabilir (md 10/2'deki izin md 10/1'deki "başkaları kalamazlar" yasağının istisnası; izin yoksa md 17 cezası), I tartışmalı (md 2'deki özel sağlık müesseseleri ve huzur evlerinde çalışanlar md 4'e göre 24 saatte bildirilir; ama mevzuat "konaklama tesisi"ni md 2'deki yerlerin tamamı için de kullanıyor).

**Çürütücüler.**
- Savcı (ÇEKİLMELİ, yüksek): III md 9'a ve Yönetmelik md 5'e aykırı; D her senaryoda yanlış. I için kusur orta-zayıf.
- Savunucu (ÇEKİLMELİ, orta): I ve IV'ü savunabildi, III'ü savunamadı: "konutta barındırma" yasağı metinde yok.

**Karar.** Çekilir (`bozuk`).

### 08f3c979 — ruhsat gerektirmeyen havalı tüfeği meydanda görünür taşıma (anahtar: A, md 43, kolluk)

**Bulgu.** Kökteki niteleme doğru: havalı tüfek 6136'nın kapsamı dışındadır (md 4/3) ve 2521'e göre ruhsata tabi değildir (md 8, 9). Tartışma md 43'teki "ruhsat"ın anlamında:

> 5326 md 43: "Yetkili makamlardan ruhsat almaksızın kanuna göre yasak olmayan silahları park, meydan, cadde veya sokaklarda görünür bir şekilde taşıyan kişiye, kolluk tarafından elli Türk Lirası idarî para cezası verilir."

**Çürütücüler: 1-1.**
- Savcı (ÇEKİLMELİ, orta): ruhsat rejimi olmayan silahta "ruhsat almaksızın" unsuru gerçekleşmez; o zaman A metinden türetilemez, D ("hiçbir yaptırıma tâbi değildir") savunulabilir. Gerekçede ve bulunabilen tek CGK kararında örnek ruhsata tabi av tüfeği. Güveni orta tutmasının nedeni: uygulama karşı yönde ve "görünür taşıma izni" okuması da metne sığıyor.
- Savunucu (AÇIKLAMA DÜZELTİLMELİ, yüksek): md 43'teki ruhsat kamusal alanda görünür taşımanın iznidir.
  - Lafızda "ruhsat gerektiği hâlde" kaydı yok.
  - TBMM S. Sayısı 840: hükümet metni "Ruhsatsız olarak bulundurulan av tüfeği" diyordu; Adalet Komisyonu silah sınıfını "kanuna göre yasak olmayan silahlar"a genişletti ve ruhsat ölçütünü bulundurmadan taşıma fiiline taşıdı.
  - YCGK 26/9/2006, 2006/2-198: kararda aktarılan 2. Ceza Dairesi metni md 43'ün fiilini "izinsiz olarak … görünür bir şekilde taşınması" diye niteliyor; Genel Kurul md 43'ün yalnız belirli yerlerde ve görünür taşımayı cezalandırdığını tespit edip 2521 md 13'ten "eylemler farklıdır" diye ayırıyor. Olaydaki silah ruhsata tabi bir av tüfeğiydi.
  - Md 38 ve 42 aynı kamusal alanlarda fiili yetkili makamın iznine bağlayan kardeş hükümler; daraltıcı okumada md 43'ün bağımsız uygulama alanı kalmıyor (5326 md 15/1, 15/3).
  - Havalı tüfekle ilgili doğrudan içtihat bulunamadı.

**Açıklama kusuru (tablo atfı).** "2026 uygulama tablosunda bu kabahatin tipik örneği havalı tüfek ve tabancaların görünür şekilde taşınmasıdır." Md 43'ün havalı tüfeğe uygulanmasını yalnız tabloyla gerekçelendiriyor ve kaynağı kullanıcıya açıyor.

**Yeni açıklama.** Denetçi ilk taslağı reddetti: taslak kanundaki "ruhsat"ı tartışmalı bir yorumla "görünür taşıma izni" diye kesin hüküm gibi tanımlıyordu. Benimsenen metin denetçinin önerisi; anahtarı yalnız md 43'ün lafzıyla savunuyor. Denetçi notu: 2521 md 1 ve Ek md 1 spor ve nişan silahları için bir izin kavramı öngörüyor, ama onu zorunlu kılan ya da yaptırıma bağlayan bir hüküm yok.

**Karar.** İlke gereği (1-1) soru kalır; açıklama düzeltilir (aşağıda birebir metin) ve kullanıcıya bildirilir. Savcının görüşü kabul edilirse çekme kararı kullanıcınındır.

### 244a9c7b — 1774 Ek md 1, otel terminal yükümlülüğünde tekerrür (doğru: A)

**Bulgu.** Kusursuz. A, 7565 sayılı Kanunla 20/11/2025'te değişen cümlenin birebir karşılığı. Kök, şıklar ve açıklama güncel metinle uyumlu; cezayı veren makam doğru.

> Ek md 1/3: "İkinci fıkrada belirtilen genel kolluk kuvvetlerinin terminallerine bağlanmayanlara onbin Türk Lirası, anlık veri göndermeyen veya gerçeğe aykırı kayıt tutanlara beşbin Türk Lirası idari para cezası, mülki idare amirlerince verilir. (Değişik cümle:20/11/2025-7565/4 md.) Bu maddede sayılan fiillerin işlendiği takvim yılı içinde tekrarı halinde en son kesilen para cezasının iki katı uygulanır, ayrıca sayılan fiillerin işlendiği takvim yılı içinde dördüncü defa işlenmesi halinde işletme ruhsatları iptal edilir."

**Karar.** Dokunulmaz.

### 771934ff — 1774 Ek md 3, araç kiralama yükümlülükleri (yanlış olan: D)

**Bulgu.** Kusursuz. D yanlış: cezayı kolluk birim amiri değil, mülki idare amirleri verir. A, B, C ve E metinle doğrulandı.

> Ek md 3/4 (7533 ile değişik): "… kiralayan şahıs ile kiralanan araç bilgilerini araç teslim edilmeden genel kolluk kuvvetlerine sistem üzerinden anlık olarak bildirmeyenlere kırk dokuz bin dokuz yüz otuz sekiz Türk Lirası idari para cezası, mülki idare amirlerince verilir. … İşlenen bir suçun gizlenmesi amacıyla bilgilerin yok edilmesi halinde işletme ruhsatı iptal edilir."

**Not (bildirilir).** A'daki "araç teslim edilmeden" ibaresi ceza fıkrasından geliyor; yükümlülüğü koyan birinci fıkra "araç teslimi esnasında" diyor. Fark kanunun kendisinde; A yanlış değil.

**Karar.** Dokunulmaz.

### a9edc0ef — 1774 md 3 ve 15, sorumlu işletici değişikliği (doğru: A)

**Bulgu.** Soru doğru: A, md 3/2 (24 saat) ile md 15 ve md 18'in (mahallî mülkî amir) birleşimi.

> Md 3: "İkinci maddede sayılan tesislerin sorumlu işleticilerinin kimlikleri, tesis açılmadan evvel müessesenin sahibi veya kanuni temsilcisi tarafından örneğine uygun şekilde, en yakın kolluk örgütüne bildirilir. Sorumlu işleticinin değişmesi halinde keyfiyetin 24 saat içinde ve yukarıdaki fıkrada gösterilen şekilde bildirilmesi zorunludur."
> Md 18: "Bu Kanunda belirtilen idarî para cezaları, mahallî mülkî amir tarafından verilir."

**Açıklama kusuru (küçük).** "konaklama tesislerinin sorumlu işleticileri kimliklerini tesis açılmadan önce en yakın kolluğa bildirir". Kanunda bildirimi işleticinin kendisi değil, müessesenin sahibi veya kanuni temsilcisi yapar. İfade tablo satırından geliyor.

**Karar.** Soru kalır; açıklama düzeltilir.

### fa8fec6c — 2920 md 144, izinsiz İHA uçurma (doğru: A)

**Bulgu.** Kusursuz. A, 7519 sayılı Kanunla 4/7/2024'te eklenen fıkranın karşılığı. D yanlış: Sivil Havacılık Genel Müdürlüğünün ceza yetkisi ithal, satış, tescil, ruhsat ve nitelik aykırılıkları içindir; maddede müsadere yok.

> Md 144: "Uçuş izni almadan veya Sivil Havacılık Genel Müdürlüğünce/mülki idare amirlerince belirlenen alanlar dışında insansız hava aracı uçuranlardan genel kolluk kuvvetleri tarafından tespit edilen kişiler hakkında mahallin en büyük mülki idare amiri tarafından altmışbin Türk Lirası idari para cezası uygulanır."

Sorunun madde bağı 23 Kas'ta 2920 md 144'e kuruldu (başka oturum, origin/main `09bbedd6`).

**Karar.** Dokunulmaz (kökteki "2026 … uygulaması" için ortak nota bakın).

### 9234e990 — 4250 md 6/3 ve 7, küçüğe alkollü içki satışı (doğru: A)

**Bulgu.** Soru doğru. Cezayı mahallî mülkî amir verir; beş yıl içinde üçüncü defada satış belgeleri iptal edilir (7255 ile 2020'de eklenen fıkra).

> Md 7/1-b: "Üçüncü, dördüncü ve altıncı fıkralarında belirtilen yasaklara aykırı hareket edenlere, on bin Türk Lirasından beş yüz bin Türk Lirasına kadar, … idari para cezası verilir."
> Md 7: "6 ncı maddenin üçüncü fıkrası ile beşinci fıkrasının üçüncü cümlesinde belirtilen kabahat eyleminin, ilk fiilin işlenmesinden sonraki beş yıl içinde üçüncü defa işlenmesi halinde ayrıca Tarım ve Orman Bakanlığı tarafından, satıcıya ait tüm perakende alkollü içki ve açık alkollü içki satış belgelerinin iptaline karar verilir. … birinci fıkranın diğer bentlerinde yer alan idari para cezalarını vermeye mahalli mülki amir yetkilidir."

**Açıklama kusuru (tablo atfı).** "cezayı MÜLKÎ AMİR verir ve 2026 tablosundaki en yüksek kalemlerdendir."

**Karar.** Soru kalır; açıklama düzeltilir. Değişmeyen kısımda iki dar ifade var (denetçi notu, engel değil): "işletmenin satış belgesi" (kanunda satıcıya ait tüm satış belgeleri) ve "itiraz" (5326 md 27'nin terimi "başvuru").

### 38acc1e6 — 5326 md 17/6, genel ödeme süresi (doğru: B)

**Bulgu.** Soru doğru.

> Md 17/6: "(Değişik cümleler: 1/7/2022-7417/46 md.) Kanunlarında ödeme süresi düzenlenmemiş olan idari para cezaları, tebliğinden itibaren bir ay içinde ödenir. İdari para cezasının ödeme süresi içinde ödenmesi halinde, cezadan %25 oranında indirim yapılır. (Ek cümle: 1/7/2022-7417/46 md.) Ödeme yapılması, kişinin bu karara karşı kanun yoluna başvurma hakkını etkilemez."

**Açıklama kusuru (tablo atfı).** "2026 uygulama tablosunda da genel ödeme süresi 1 ay olarak işlenmiştir."

**Karar.** Soru kalır; açıklama düzeltilir.

### fce0a9b8 — 5326, elkoyma ve mülkiyetin kamuya geçirilmesi (doğru: C, dilencilik)

**Bulgu.** Soru doğru: seçeneklerden yalnız dilencilikte (md 33) bu yaptırım var.

**Açıklama kusuru (sonradan eklenen hüküm).** "Kabahatler Kanunu'nda elkoyma ve mülkiyetin kamuya geçirilmesi yalnızca gelir getiren iki kabahatte öngörülmüştür". 7593 sayılı Kanun 5326'ya md 43/C'yi (amaç dışı bıçak taşıma) ekledi; md 43/C de elkoyma ve mülkiyetin kamuya geçirilmesi öngörüyor. Bu hükümler 18/8/2026'da yürürlüğe girdi (birinci fıkranın (a) bendi 1/12/2026'da), yani sorunun yayımından (24/8/2026) önce.

> Md 43/C(3): "Birinci fıkrada sayılan kabahatin konusunu oluşturan veya işlenmesi suretiyle elde edilen eşyanın mülkiyetinin kamuya geçirilmesine karar verilir."
> Md 43/C(4): "Birinci fıkrada sayılan kabahat dolayısıyla idarî para cezasına ve elkoymaya kolluk görevlileri, mülkiyetin kamuya geçirilmesine mülkî amir tarafından karar verilir."

İkinci cümledeki "Sarhoşluk … kabahatlerinde yalnızca idarî para cezası uygulanır" da kesin değil: md 35'e göre sarhoş kişi ayrıca "sarhoşluğun etkisi geçinceye kadar kontrol altında tutulur".

**Karar.** Soru kalır; açıklama baştan yazılır.

### 1e44c394 — 5326, en yüksek ceza (doğru: B, kumar)

**Bulgu.** Soru doğru: kumarda bin TL (md 34/1), öteki dört kabahatte elli TL (md 33, 35, 36/1, 37).

> Dipnot [8]: "6/12/2019 tarihli ve 7196 sayılı Kanunun 59 uncu maddesiyle, bu fıkrada yer alan "yüz" ibaresi "bin" şeklinde değiştirilmiştir."

**Açıklama kusurları.**
1. Aritmetik: kumar cezasının öteki kabahatlerin "yaklaşık on katına" çıkarıldığı yazıyor. Kanunda bin TL'ye karşı elli TL, yani yirmi kat. On kat, 7196'nın yaptığı yüz → bin artışıdır.
2. Tablo atfı: "2026 uygulama tablosunda da kumar cezası, aynı gruptaki diğer kabahatlerin katbekat üzerindedir."

Güncel tutarlar arasındaki oran kanundakinden farklı: elli TL'lik cezalar 2005'ten, bin TL'lik kumar cezası 2020'den beri yeniden değerleniyor (md 17/7). Bu yüzden yeni açıklama yalnız kanundaki tutarları karşılaştırıyor.

**D şıkkı ("Gürültüye neden olmak (gerçek kişi)").** Açıklama denetçisinin notuyla iki çürütücüye ayrıca verildi.

> Md 36/2: "Bu fiilin bir ticarî işletmenin faaliyeti çerçevesinde işlenmesi halinde işletme sahibi gerçek veya tüzel kişiye bin Türk Lirasından beşbin Türk Lirasına kadar idarî para cezası verilir."

- Savcı (ÇEKİLMELİ, orta): md 36'nın iki fıkrası kişi türüne göre değil, fiilin ticarî işletme faaliyeti içinde işlenip işlenmediğine göre ayrılır; "(gerçek kişi)" kaydı md 36/2'yi dışlamaz. Bu okumada D'nin cezası bin–beş bin TL olur, B'ye eşit ya da ondan yüksek; anahtar okumaya göre B ya da D. Kayıt tablodaki "(GERÇEK KİŞİ) / (TİCARİ İŞLETME)" satır çiftinden alınmış. 5e57ed04 emsalinden farkı: orada eksik kayıt ölçülen şeyi değiştirmiyordu, burada tutarı ve sıralamayı değiştiriyor.
- Savunucu (AÇIKLAMA DÜZELTİLMELİ, parantez BİLDİRİLİR, yüksek): lafzî nokta doğru, ama md 36/2'yi temel hâlden ayıran "ticarî işletmenin faaliyeti çerçevesinde" unsuru şıkta yok; böyle bir ifade temel hâli gösterir. A, C ve E de temel hâlleriyle anılmış elli liralık kabahatler; dizide D md 36/1'in karşılığı, B tek cevap.
- İkisi aynı düzeltmeyi istiyor: açıklama ayırıcı ölçütü (ticarî işletme faaliyeti) ve md 36/2'yi açıkça yazmalı; ilk taslaktaki "gerçek kişinin gürültüye neden olması (m.36/1)" ifadesi metne aykırı.

**Karar.** İlke gereği (1-1) soru kalır; açıklama baştan yazılır ve D şıkkındaki parantez kullanıcıya bildirilir. Savcının görüşüyle çekmek kullanıcı kararıdır.

### 39da3442 — 5326 md 36, gerçek kişi ve işletme gürültüsü (doğru: B)

**Bulgu.** Kusursuz. Açıklama merciyi doğru veriyor: "kolluk veya belediye zabıta görevlileri" (tablo bu satırlarda yalnız "KOLLUK" diyor; sapma soruya geçmemiş).

> Md 36: "(1) Başkalarının huzur ve sükununu bozacak şekilde gürültüye neden olan kişiye, elli Türk Lirası idarî para cezası verilir. (2) Bu fiilin bir ticarî işletmenin faaliyeti çerçevesinde işlenmesi halinde işletme sahibi gerçek veya tüzel kişiye bin Türk Lirasından beşbin Türk Lirasına kadar idarî para cezası verilir. (3) Bu kabahat dolayısıyla idarî para cezasına kolluk veya belediye zabıta görevlileri karar verir."

**Not (bildirilir).** Açıklamadaki "Faaliyetten men … PVSK'daki ayrı bir yaptırımdır" cümlesi doğru, ama eksik okunabilir: PVSK md 8 faaliyetten meni sayılı hâllere (kumar, uyuşturucu, fuhuş vb.) bağlar; işletme gürültüsü bunlardan biri değildir.

**Karar.** Dokunulmaz.

### 051e8d97 — 5326 md 42/A, 112 kabahatleri (doğru: B)

**Bulgu.** Soru doğru.

> Md 42/A (7547 ile değişik, yürürlük 16/5/2025): "(1) 112 Acil Çağrı Merkezini meşgul etmek amacıyla arayarak görevlilerle konuşan veya ısrarla çağrı bırakan kişiye, il valileri tarafından binbeşyüz Türk Lirası idari para cezası verilir. (2) 112 Acil Çağrı Merkezine yapılan ihbarın asılsız olduğunun olay yerine giden ekiplerce tutanakla tespit edilmesi halinde kişiye, il valileri tarafından onbeşbin Türk Lirası idari para cezası verilir. (3) Bu maddede yazılı fiillerin bir yıl içinde tekrarı halinde idari para cezası iki katı olarak uygulanır."

**Açıklama kusuru (tablo atfı).** "(2026 tablosunda güncellenmiş tutarlarda da oran korunur)". Ayrıca "tabanıyla" ifadesi maktu cezayı alt sınır gibi gösteriyor.

**Karar.** Soru kalır; açıklama düzeltilir.

### 5e57ed04 — tekerrür rejimleri (yanlış olan: E)

Önceki raporda denetlendi; açıklaması 23 Kas'ta düzeltildi. Bugünkü açıklama uygulanan metinle aynı ve tablo atfı taşımıyor. B şıkkında "gerçek kişiler" kaydının eksikliği o raporda bildirilmişti; yeni bulgu yok.

**Karar.** Dokunulmaz.

### 3dea855a — yetkili makamlar (yanlış olan: E)

**Bulgu.** Kusursuz. E yanlış: md 32 cezayı emri veren makama bırakır, mülkî amirin emrine aykırılıkta karar mülkî amirindir. A–D doğru eşleştirmeler.

> Md 32/1: "… hukuka uygun olarak verilen emre aykırı hareket eden kişiye yüz Türk Lirası idarî para cezası verilir. Bu cezaya emri veren makam tarafından karar verilir."
> Md 34/2: "Bu kabahat dolayısıyla idarî para cezasına ve elkoymaya kolluk görevlileri, mülkiyetin kamuya geçirilmesine mülkî amir karar verir."
> Md 35/1: "… kolluk görevlileri tarafından elli Türk Lirası idarî para cezası verilir."
> Md 42/A(2): "… il valileri tarafından onbeşbin Türk Lirası idari para cezası verilir."
> 1774 md 18: "Bu Kanunda belirtilen idarî para cezaları, mahallî mülkî amir tarafından verilir." (Ek md 1: "mülki idare amirlerince")

**Karar.** Dokunulmaz.

## Birebir açıklama düzeltmeleri

Her değişiklik açıklamadaki tek bir ibareyi değiştirir (fce0a9b8 ve 1e44c394'te ibare açıklamanın tamamı); eski ibarenin bugünkü açıklamada tam bir kez geçtiği yerel dökümde ölçüldü. Kök ve şıklara dokunulmaz; hiçbiri doğru cevabı değiştirmez.

### 1. 9234e990 (sürüm `44f1a738`), açıklama

- **Eski:** «cezayı MÜLKÎ AMİR verir ve 2026 tablosundaki en yüksek kalemlerdendir.»
- **Yeni:** «cezayı MÜLKÎ AMİR verir. Kanunda öngörülen idarî para cezası on bin Türk Lirasından beş yüz bin Türk Lirasına kadardır (m.7/1-b).»
- **Gerekçe:** Açıklama üretim kaynağı olan uygulama tablosunu gerekçe gösteriyor ve kullanıcıya açıyordu (kaynak etiketi kuralı); yerine 4250 md 7/1-b'deki kanunî sınırlar yazıldı.
- **Denetçi:** ONAY (denetci-duzeltme-1.md; dil önerisi benimsendi)

Değişiklik sonrası açıklama:

> 4250 sayılı İspirto ve İspirtolu İçkiler İnhisarı Kanunu m.7 uygulamasında 18 yaşını doldurmamış kişilere alkollü içki satmak veya sunmak kabahattir; cezayı MÜLKÎ AMİR verir. Kanunda öngörülen idarî para cezası on bin Türk Lirasından beş yüz bin Türk Lirasına kadardır (m.7/1-b). Fiilin 5 yıl içinde ÜÇÜNCÜ defa işlenmesi hâlinde işletmenin satış belgesi iptal edilir; itiraz 15 gün içinde sulh ceza mahkemesinedir. Küçüğü çalıştırmak da ayrı bir ceza kalemidir; ancak satın alan küçüğe ceza öngörülmemiştir.

### 2. 38acc1e6 (sürüm `e1cdc719`), açıklama

- **Eski:** «; 2026 uygulama tablosunda da genel ödeme süresi 1 ay olarak işlenmiştir.»
- **Yeni:** «.»
- **Gerekçe:** Açıklama üretim kaynağı olan uygulama tablosunu gerekçe gösteriyor ve kullanıcıya açıyordu (kaynak etiketi kuralı); kural 5326 md 17/6'dan zaten gösteriliyor.
- **Denetçi:** ONAY (denetci-duzeltme-1.md)

Değişiklik sonrası açıklama:

> Kabahatler Kanunu m.17/6'ya göre (2022'de 7417 sayılı Kanunla) kanunlarında ödeme süresi düzenlenmemiş idarî para cezaları tebliğinden itibaren BİR AY içinde ödenir ve ödeme süresi içinde ödenmesi hâlinde cezadan %25 indirim yapılır. Ödeme, kanun yoluna başvuru hakkını etkilemez. 15 gün, ödeme değil sulh cezaya başvuru süresidir.

### 3. fce0a9b8 (sürüm `20e85d09`), açıklama

- **Eski:** «Kabahatler Kanunu'nda elkoyma ve mülkiyetin kamuya geçirilmesi yalnızca gelir getiren iki kabahatte öngörülmüştür: dilencilik (m.33 — dilencilikten elde edilen gelir) ve kumar (m.34 — kumardan elde edilen gelir). Sarhoşluk, gürültü, rahatsız etme ve kimliği bildirmeme kabahatlerinde yalnızca idarî para cezası uygulanır; ortada kamuya geçirilecek bir gelir yoktur.»
- **Yeni:** «Seçeneklerdeki kabahatlerden yalnız dilencilikte idarî para cezasının yanında elkoyma ve mülkiyetin kamuya geçirilmesi öngörülmüştür: dilencilikten elde edilen gelire elkonularak mülkiyetin kamuya geçirilmesine karar verilir (m.33). Sarhoşluk (m.35), gürültü (m.36), rahatsız etme (m.37) ve kimliği bildirmeme (m.40) kabahatlerinde bu yaptırım yoktur. Kanunda bu yaptırım dilencilik dışında kumarda (m.34; kumardan elde edilen gelir) ve 2026'da 7593 sayılı Kanunla eklenen amaç dışı bıçak taşıma kabahatinde (m.43/C; kabahatin konusunu oluşturan veya işlenmesi suretiyle elde edilen eşya) de öngörülmüştür.»
- **Gerekçe:** 'Yalnızca iki kabahatte' iddiası 8/8/2026'da 7593 sayılı Kanunla eklenen 5326 md 43/C'den beri yanlış (elkoyma + mülkiyetin kamuya geçirilmesi); ayrıca sarhoşlukta md 35'teki kontrol altında tutma nedeniyle 'yalnızca idarî para cezası' ifadesi kesin değil.
- **Denetçi:** ONAY (denetci-duzeltme-1.md; dil önerisi benimsendi)

Değişiklik sonrası açıklama:

> Seçeneklerdeki kabahatlerden yalnız dilencilikte idarî para cezasının yanında elkoyma ve mülkiyetin kamuya geçirilmesi öngörülmüştür: dilencilikten elde edilen gelire elkonularak mülkiyetin kamuya geçirilmesine karar verilir (m.33). Sarhoşluk (m.35), gürültü (m.36), rahatsız etme (m.37) ve kimliği bildirmeme (m.40) kabahatlerinde bu yaptırım yoktur. Kanunda bu yaptırım dilencilik dışında kumarda (m.34; kumardan elde edilen gelir) ve 2026'da 7593 sayılı Kanunla eklenen amaç dışı bıçak taşıma kabahatinde (m.43/C; kabahatin konusunu oluşturan veya işlenmesi suretiyle elde edilen eşya) de öngörülmüştür.

### 4. 1e44c394 (sürüm `fa7754a9`), açıklama

- **Eski:** «2019'da 7196 sayılı Kanunla kumar kabahatinin cezası, maddedeki 'yüz' ibaresi 'bin' yapılarak diğer klasik kabahatlerin (dilencilik, sarhoşluk, gürültü, rahatsız etme — hepsi elli TL tabanlı) yaklaşık on katına çıkarılmıştır. 2026 uygulama tablosunda da kumar cezası, aynı gruptaki diğer kabahatlerin katbekat üzerindedir. Ayrıca kumarda gelire elkonularak mülkiyeti kamuya geçirilir.»
- **Yeni:** «Kumar oynayan kişiye bin Türk Lirası idarî para cezası verilir; ayrıca kumardan elde edilen gelire elkonularak mülkiyetin kamuya geçirilmesine karar verilir (m.34/1). Fıkradaki 'yüz' ibaresi 2019'da 7196 sayılı Kanunla 'bin' yapılarak ceza on katına çıkarılmıştır. Dilencilik (m.33), sarhoşluk (m.35), gürültüye neden olma (m.36/1) ve mal veya hizmet satmak için başkalarını rahatsız etme (m.37) kabahatlerinin her birinde kanundaki ceza elli Türk Lirasıdır; kanunda kumar cezası bunların yirmi katıdır. Gürültüye neden olma fiili bir ticarî işletmenin faaliyeti çerçevesinde işlenirse işletme sahibi gerçek veya tüzel kişiye bin Türk Lirasından beşbin Türk Lirasına kadar idarî para cezası verilir (m.36/2). İki fıkrayı ayıran ölçüt kişi türü değil, fiilin ticarî işletme faaliyeti çerçevesinde işlenmesidir; gürültü seçeneği bu unsuru anmadığı için m.36/1'deki temel kabahati anlatır.»
- **Gerekçe:** Açıklama kumar cezasını öteki kabahatlerin 'yaklaşık on katı' diye veriyordu; kanunda bin TL'ye karşı elli TL, yani yirmi kat (on kat, 7196'nın yüz→bin artışıdır). Ayrıca üretim kaynağı olan uygulama tablosunu gerekçe gösteriyor ve kullanıcıya açıyordu. Çürütücüler D şıkkındaki '(gerçek kişi)' kaydında 1-1 bölündü (md 36/2 de işletme sahibi gerçek kişiye uygulanır); açıklama ayırıcı ölçütü (ticarî işletme faaliyeti) ve md 36/2'yi açıkça yazar.
- **Denetçi:** İlk taslak 3. turda RED; denetçinin birebir metni benimsendi (denetci-duzeltme-3.md)

Değişiklik sonrası açıklama:

> Kumar oynayan kişiye bin Türk Lirası idarî para cezası verilir; ayrıca kumardan elde edilen gelire elkonularak mülkiyetin kamuya geçirilmesine karar verilir (m.34/1). Fıkradaki 'yüz' ibaresi 2019'da 7196 sayılı Kanunla 'bin' yapılarak ceza on katına çıkarılmıştır. Dilencilik (m.33), sarhoşluk (m.35), gürültüye neden olma (m.36/1) ve mal veya hizmet satmak için başkalarını rahatsız etme (m.37) kabahatlerinin her birinde kanundaki ceza elli Türk Lirasıdır; kanunda kumar cezası bunların yirmi katıdır. Gürültüye neden olma fiili bir ticarî işletmenin faaliyeti çerçevesinde işlenirse işletme sahibi gerçek veya tüzel kişiye bin Türk Lirasından beşbin Türk Lirasına kadar idarî para cezası verilir (m.36/2). İki fıkrayı ayıran ölçüt kişi türü değil, fiilin ticarî işletme faaliyeti çerçevesinde işlenmesidir; gürültü seçeneği bu unsuru anmadığı için m.36/1'deki temel kabahati anlatır.

### 5. 051e8d97 (sürüm `b0f2bf88`), açıklama

- **Eski:** «onbeşbin TL tabanıyla düzenlenmiştir; asılsız ihbarın cezası meşgul etmenin ON KATIDIR (2026 tablosunda güncellenmiş tutarlarda da oran korunur).»
- **Yeni:** «onbeşbin TL idarî para cezasıyla düzenlenmiştir; asılsız ihbarın cezası meşgul etmenin ON KATIDIR.»
- **Gerekçe:** Parantez üretim kaynağı olan uygulama tablosuna atıf yapıyordu (kaynak etiketi kuralı); 'tabanıyla' ifadesi maktu cezayı alt sınır gibi gösteriyordu (5326 md 42/A(1)-(2): binbeşyüz ve onbeşbin TL, maktu).
- **Denetçi:** ONAY (denetci-duzeltme-1.md; dil önerisi benimsendi)

Değişiklik sonrası açıklama:

> m.42/A'nın 2025 tarihli (7547 sayılı Kanun) hâlinde meşgul etmek amacıyla arayarak konuşma/ısrarla çağrı bırakma binbeşyüz TL, ekiplerin tutanakla tespit ettiği asılsız ihbar ise onbeşbin TL idarî para cezasıyla düzenlenmiştir; asılsız ihbarın cezası meşgul etmenin ON KATIDIR. Her iki cezayı il valisi verir; bir yıl içinde tekrarında ceza iki katı uygulanır.

### 6. a9edc0ef (sürüm `d26d5ad6`), açıklama

- **Eski:** «konaklama tesislerinin sorumlu işleticileri kimliklerini tesis açılmadan önce en yakın kolluğa bildirir»
- **Yeni:** «konaklama tesislerinin sorumlu işleticilerinin kimlikleri, tesis açılmadan önce müessesenin sahibi veya kanuni temsilcisi tarafından en yakın kolluğa bildirilir»
- **Gerekçe:** 1774 md 3/1'e göre sorumlu işleticinin kimliğini tesis açılmadan önce müessesenin sahibi veya kanuni temsilcisi bildirir; açıklama yükümlülüğü işleticinin kendisine yüklüyordu (tablo satırının ifadesi).
- **Denetçi:** ONAY (denetci-duzeltme-1.md)

Değişiklik sonrası açıklama:

> 1774 sayılı Kanun'a göre konaklama tesislerinin sorumlu işleticilerinin kimlikleri, tesis açılmadan önce müessesenin sahibi veya kanuni temsilcisi tarafından en yakın kolluğa bildirilir; sorumlu işletici DEĞİŞİKLİĞİ ise 24 SAAT içinde kolluğa bildirilir. Çalıştırılanlar ve ayrılışları için de aynı 24 saatlik süre geçerlidir. Bu yükümlülüklere aykırılıkta (m.15) idarî para cezasını MÜLKÎ AMİR verir; kanun yolu 15 gün içinde sulh ceza mahkemesidir.

### 7. 08f3c979 (sürüm `6820c968`), açıklama

- **Eski:** «; 2026 uygulama tablosunda bu kabahatin tipik örneği havalı tüfek ve tabancaların görünür şekilde taşınmasıdır.»
- **Yeni:** «. Madde, silahın bulundurulması için ruhsat gerekip gerekmediğine göre ayrım yapmaz; lafzına göre aranan, silahın bu yerlerde yetkili makamlardan ruhsat alınmadan görünür şekilde taşınmasıdır. Bu yüzden bulundurulması için ruhsat gerekmeyen havalı tüfeği yetkili makamlardan ruhsat almadan meydanda görünür şekilde taşıyan kişi de bu kabahati işler.»
- **Gerekçe:** Açıklama md 43'ün havalı tüfeğe uygulanmasını yalnız üretim kaynağı olan uygulama tablosuyla gerekçelendiriyor ve kaynağı kullanıcıya açıyordu (kaynak etiketi kuralı); yerine md 43 lafzına dayanan gerekçe yazıldı. Çürütücüler 1-1 bölündü: soru kalır, kullanıcıya bildirildi.
- **Denetçi:** İlk taslak 2. turda RED; denetçinin birebir metni benimsendi (denetci-duzeltme-2.md)

Değişiklik sonrası açıklama:

> Kabahatler Kanunu m.43, yetkili makamlardan ruhsat almaksızın KANUNA GÖRE YASAK OLMAYAN silahların park, meydan, cadde veya sokaklarda görünür şekilde taşınmasını kabahat sayar. Madde, silahın bulundurulması için ruhsat gerekip gerekmediğine göre ayrım yapmaz; lafzına göre aranan, silahın bu yerlerde yetkili makamlardan ruhsat alınmadan görünür şekilde taşınmasıdır. Bu yüzden bulundurulması için ruhsat gerekmeyen havalı tüfeği yetkili makamlardan ruhsat almadan meydanda görünür şekilde taşıyan kişi de bu kabahati işler. Cezayı kolluk verir; elkoyma veya mülkiyetin kamuya geçirilmesi öngörülmemiştir. Yasak silahlar ise 6136 sayılı Kanun kapsamında suç konusudur.

## Uygulama planı (onaylandı ve uygulandı)

**A) Açıklama düzeltmeleri (7 değişiklik).**
- Araç: `apps/api/scripts/sik-metni-guncelle.ts <sürüm> ACIKLAMA <eski> <yeni>`, `GEREKCE=… APPLY=1` ile. Eski ve yeni metin `docs/32-yayin-denetimi/sik-guncelleme.jsonl` defterine düşer.
- Toplu yürütücü: scratchpad'de `ipc-denetim/betik/uygula.py`, değişiklik dosyası `ipc-denetim/degisiklikler-onay.json`. `--yaz` olmadan kuru çalışır. `DATABASE_URL`'i `.env`'den alır ve `connection_limit=1`'e indirir; ilk hatada durur.
- Sıra: önce kuru çalıştırma (bu da onay ister), sonra `--yaz`, sonra salt okunur doğrulama.

**B) Yayından çekme (2 soru).** `apps/api/scripts/soru-arsivle.ts`'in `A` listesine şu iki kayıt girilir:

```ts
['78a8809b', 'bozuk', "6f5938d5 ('hangisinde cezayı vermeye kolluk görevlileri yetkili değildir', anahtar C, 7258 md 5/1-d): B ('Hususi aracın sürücü koltuğunda sigara içene ceza verilmesi (4207 SK m.5)') kolluk yetkisini metne dayandıramıyor. 4207 md 5/1 bu fiili yalnız 5326 md 39'a gönderir; md 39 hususi araç için makam saymaz; 5326 md 22/1 yetkiyi kanunda açıkça gösterilen makama, 22/2 açık hüküm yoksa ilgili kurumun en üst amirine verir. B de kökü karşılayan ikinci cevap. Aynı önerme 3dc788e5'te kullanıcı kararıyla arşivlendi (23 Kas 2026). İki bağımsız çürütücü ÇEKİLMELİ. Hiçbir denemede kullanılmamış."],
['5f5e9247', 'bozuk', "bc821785 (1774, dört öncül, anahtar D 'I, II, III ve IV'): III ('Kimliğini resmî belgeyle ispat edemeyen kimseleri konut ve işyerinde barındırmak veya çalıştırmak yasaktır') md 9'a aykırı: kanun 'tesislerinde barındıramaz, konut ve işyerlerinde çalıştıramaz' der (Uygulama Yönetmeliği md 5 de aynı); konutta barındırma yasağı yok. III yanlış olunca D hiçbir okumada doğru değil; 'I, II ve IV' şıkkı yok, I de dar okunursa doğru cevap C. İki bağımsız çürütücü ÇEKİLMELİ. Hiçbir denemede kullanılmamış."],
```

- Önce `docs/32-yayin-denetimi/arsiv-yedek.json` kopyalanır: betik her `--yaz`'da bu dosyanın üzerine yazar. Koşudan sonra önceki kayıtlarla birleştirilir.
- `DATABASE_URL` `connection_limit=1` ile verilir. Önce kuru çalıştırma (plan 2/12 beklenir; listedeki eski on kayıt zaten arşivde olduğu için atlanır), sonra `--yaz`. Defter: `docs/32-yayin-denetimi/ilerleme.jsonl` (+2).
- Koşu bitince iki kayıt listeden silinir; betik değişmeden kalır.

**C) Bildirilenler (yazım yok).**
- 08f3c979: çürütücüler 1-1; savcının görüşüyle çekmek kullanıcı kararı.
- 1e44c394 D şıkkı: "(gerçek kişi)" kaydı md 36/2'yi lafzen dışlamıyor; çürütücüler 1-1. Şık değiştirilemez; savcının görüşüyle çekmek kullanıcı kararı.
- Beş kökteki "2026 … uygulaması" çerçevesi (fa8fec6c, 9234e990, 6f5938d5, 38acc1e6, 08f3c979).
- 771934ff: Ek md 3'te "teslimi esnasında" / "teslim edilmeden" farkı kanunun kendisinde.
- 39da3442: PVSK faaliyetten men cümlesinin eksik okunabilmesi.

**Eşgüdüm.** Aynı "Özgün soru" grubunda başka bir oturum madde bağları üzerinde çalışıyor (origin/main `898b9cc9`, `dca17090`, `09bbedd6`). Bağlar açıklamayı değiştirmiyor; `sik-metni-guncelle.ts` eski ibare tam bir kez geçmezse durduğu için çakışma yazıma dönüşmez.

## Uygulama (23 Kas 2026)

Kullanıcı onayı: "Evet, hepsini uygula". Uygulamadan hemen önce salt okunur tazelik kontrolü yapıldı: yedi açıklama dökümle aynıydı, çekilecek iki soru yayındaydı.

**Açıklama düzeltmeleri (7).**
- `sik-metni-guncelle.ts` ile, `uygula.py` üzerinden, `connection_limit=1`. Önce kuru çalıştırıldı (yedisi de yayında, eski ibare birer kez, doğru şık değişmiyor), sonra yazıldı.
- Gerekçelerin başında rapor künyesi var: "Doc 39 banka denetimi 23 Kas 2026 (rapor/banka-kusur-ipc-5326-1774.md): …".
- Defter: `docs/32-yayin-denetimi/sik-guncelleme.jsonl` (+7; 90 → 97 satır).

**Yayından çekme (2).**
- `soru-arsivle.ts`'in `A` listesine yukarıdaki iki kayıt girildi, `connection_limit=1` ile önce kuru çalıştırıldı (plan 2/12; eski on kayıt arşivde olduğu için atlandı), sonra `--yaz`.
- 78a8809b (6f5938d5) ve 5f5e9247 (bc821785): sürüm `archived`, soru soft-delete, `currentVersionId` null. İkisi de hiçbir denemede kullanılmamıştı.
- Defter: `docs/32-yayin-denetimi/ilerleme.jsonl` (+2).
- Yedek: `arsiv-yedek.json` betik tarafından üzerine yazıldı; önceki 7 kayıt korunarak birleştirildi (toplam 9). Birleştirme yalnız ekleme yaptı.
- Koşu bitince iki kayıt listeden silindi; betik commit'teki hâline döndü (fark yok).

**Veritabanı doğrulaması (salt okunur).**
- Yedi açıklamanın yedisi beklenen metinle birebir aynı; kök ve şıklar değişmedi; hiçbir açıklamada "tablo" atfı kalmadı.
- Çekilen iki soru arşivde. Yayındaki İPC etiketli soru: 15 (5326 konusu 10, 1774 konusu 3, 6458 konusu 2).
- Çekilen iki sorunun bağları: 2 ders testi satırı, 16 yanlış kaydı, 16 tekrar kaydı, 117 geçmiş oturum. Ders testleri (`course-tests.service.ts`, `YAYINDA`) ile yanlış ve tekrar turları (`yanlis-havuzu.ts`) yayında olmayan soruyu süzüyor; geçmiş oturum ve cevaplar sürüm satırı korunduğu için bozulmuyor. Hiçbir ders ya da özet bloğu bu soruları gömmüyor.

**Açık kalan.** Çekilen sorulara bağlı konu özeti ünitelerinin "Sınav der ki" sayıları bu turda tazelenmedi (önceki arşiv turlarındaki durumla aynı).
