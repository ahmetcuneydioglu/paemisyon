# Çocuk koruma yönetmelikleri: sınav ve kaynak analizi (Tedbir Yön. · Uygulama Yön.)

Doc 39, 23 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/tedbir-yon.txt` (31 madde), `mevzuat/cocuk-uyg.txt` (42 madde);
- `tedbir-yon-mevcut-sorular.txt` (0), `cocuk-uyg-mevcut-sorular.txt` (3), `<ad>-diger-konu-sorulari.txt` (7, 3), `<ad>-cakisma-sorulari.txt` (47, 93);
- dayanak ve komşu taban: `5395.txt` ve `5395-mevcut-sorular.txt` (59), `yakalama.txt` (md 5, md 19) ve `yakalama-mevcut-sorular.txt`, `2559.txt`, `6284-yonetmelik.txt`.

Resmî metinler mevzuat.gov.tr'den 23 Kas 2026'da indirildi ve banka metniyle betikle sözcük sözcük karşılaştırıldı. CMK'nın resmî metni de indirildi (md 171, 185, 218, 231, 236 okundu). Dosyalar: `/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/cocuk-yon/` (`indirilen/10884.iframe.html`, `10885.iframe.html`, `indirilen2/5271.html`, `betik/kars.py`). Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz, bu iki yönetmeliğe uygulanır.

**Kısaltma.** **TY** = Çocuk Koruma Kanununa Göre Verilen Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik (`tedbir-yon`). **UY** = Çocuk Koruma Kanununun Uygulanmasına İlişkin Usûl ve Esaslar Hakkında Yönetmelik (`cocuk-uyg`). **K** = 5395 sayılı Kanun (bankadaki güncel metin). **SHÇEK** = Sosyal Hizmetler ve Çocuk Esirgeme Kurumu. **ASPB** = Aile ve Sosyal Politikalar Bakanlığı. **ASHB** = Aile ve Sosyal Hizmetler Bakanlığı. **SÇG** = sosyal çalışma görevlisi. **SİR** = sosyal inceleme raporu. **KDAE** = kamu davasının açılmasının ertelenmesi. **HAGB** = hükmün açıklanmasının geri bırakılması.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** kolluğu doğrudan ilgilendirir. **sınır**: çakışma dosyasında başka bir kuralı ölçen, ama yeni soruya çeldirici ya da yasak sınırı veren soru. **≡K** Kanunun (ya da CMK'nın) aynası: yönetmelik adıyla sorulmaz. **ESKİ** dayanak kanunla çelişen ya da karşılığı kalmayan hüküm: soru konusu olmaz.

## 0. İki yönetmeliğin ortak tablosu

| Yönetmelik | Resmî doğrudan soru | PAEM / Misyon | Bankada | Çakışma: ilgili / sınır / ilgisiz | Asıl çakışma tabanı |
|---|---|---|---|---|---|
| TY | 4: [152], [153] Adalet GYS 2023; [158], [161] Adalet GYS 2025 | — | 6 (hepsi "5395" konusunda): resmî dört soru + merkezî sekretarya (ÇHGM) + bakım tedbiri kararının gönderileceği yer | 19 / 23 / 5 | K md 5, 6, 7, 8, 9, 13, 45 (bankada 20'den fazla soru); K 45/3–4 (7593) |
| UY | 3: [348], [349] Adalet GYS 2023; [159] Adalet GYS 2025 | — | 4: `cocuk-uyg-mevcut` 3 + "5395" konusunda [159] | ≈27 / ≈33 / ≈33 | K md 15–23, 29–41; CMK md 185, 236, 171; Yakalama Yön. md 19 |

- **Resmî yedi yönetmelik sorusunun yedisi de Adalet GYS'nin.** PAEM ve Misyon bu iki yönetmeliği adıyla hiç sormadı. İki korpus tarandı.
  - Çocuk koruma temalı resmî soru 14'tür: [152]–[163], [348], [349]. Yedisi Kanun, yedisi yönetmelik sorusu.
  - **PAEM 3** (hepsi Kanun): [155] SÇG'nin görevleri (K 34 ↔ K 38), [156] mahkemelerin kuruluşu (PAEM 8); [157] yönlendirme tedbirinde kurumlar (K 5/A, PAEM 10; 7593 ile gelen hüküm).
  - **Misyon 0.** Kollukla ilgili tek Misyon sorusu Yakalama Yönetmeliğindedir: [351] çocukların yakalanması (EGM 2023).
  - **Adalet GYS 11**: 2023'te [152]–[154], [348], [349]; 2025'te [158]–[163].
- **Çıkarım.** PAEM çocuk konusunu Kanundan ve Kanunun en yeni hükmünden soruyor ([157]). 2006 tarihli iki yönetmeliğin PAEM değeri baştan düşüktür; değer yalnız kolluğun iş akışına değen, Kanunda bulunmayan birkaç hükümdedir.
- **Resmî yedi yönetmelik sorusunun altısı Kanunun aynası olan hükmü ölçer** (acil korunma = K 9; tedbir listesi = K 5; danışmanlık kurumları = K 45; denetim görevlisi = K 38; duruşma = K 22 ve CMK 185). Yönetmeliğe özgü tek soru [153]'tür (il koordinasyonunun üyeleri); o da ezber listesidir.
- **Metin.** Banka metni resmî metinle sözcük sözcük aynıdır; iptal ya da yürütmeyi durdurma şerhi yoktur. Sorun metnin kendisindedir: iki yönetmelik de 2006 Kanununu yansıtır. UY hiç değişmedi; TY yalnız 2012'de kurum adı için değişti. Kanun 2006'dan beri en az on kanunla değişti (son: 7593, 8/8/2026).
- **Dürüst tavan.** TY en çok 3 (önerilen 2). UY en çok 4 (önerilen 3). Toplam önerilen 5. Kalan her şey ya Kanunun aynasıdır, ya eskimiştir, ya varsayılan cevaplıdır.
- **Ters ayırt etme riski** (§8 kural 4). Bilmeyen aday şu sezgilerle doğruyu bulur:
  - "çocuğun yararı gözetilir", "aile yanında ve en hafif tedbir önce gelir" (TY 5, 8/12);
  - "hâkim karar verir" (TY 7, 8, 10, 11, 22/3);
  - "adli işte savcının talimatı alınır" (UY 16/5, 16/7);
  - "derhâl bildirilir, derhâl teslim edilir" (UY 16/3, 16/6; TY 22/2, 22/4);
  - "çocuk sosyal hizmetlere teslim edilir" (UY 16/5–7; TY 6/1);
  - "çocuk yetişkinden ayrı tutulur", "kelepçe takılmaz", "bilgiler gizlidir" (UY 6, 8, 16/2; TY 26);
  - "teslimden önce sağlık kontrolü yapılır" (TY 14/4, 15/3; polis adayının gözaltı refleksi).

  Soru bu sezgileri kıran olguyla kurulur; kıramıyorsa yazılmaz.

**◆ Kolluğa doğrudan değen hükümler**

| Yön. | Hüküm | Kolluk bağı | Durum |
|---|---|---|---|
| UY | 5/9 | Çocukların yakalanması, gözaltına alınması ve ifadesinde Yakalama Yön.'ün çocuk hükümleri uygulanır | atıf; sorulmaz (Yakalama md 19 bankada 3) |
| UY | 5/10 | On iki yaşından küçük çocukların işlediği iddia olunan suçta delil toplamak ya da başka fail bulunup bulunmadığını belirlemek için soruşturma yapılabilir | **UY-p1 #1** |
| UY | md 6 | Gözaltındaki çocuk çocuk biriminde; yoksa yetişkinlerden ayrı | ≡K 16; bankada |
| UY | 7/1 | Yetişkinle birlikte işlenen suçta adlî kolluk çocuk için ayrı evrak düzenler | ≡K 17/1 + Yakalama 19/b-6; sorulmaz |
| UY | md 8 | Zincir, kelepçe takılamaz; zorunlu hâlde kolluk önlem alabilir | ≡K 18; bankada 2 (K ve Yakalama) |
| UY | 16/1 | Çocukla ilgili kolluk görevi öncelikle çocuk birimince | ≡K 31/1 |
| UY | 16/2 | Kolluk birimindeki yetişkinlerle karşılaşmanın engellenmesi | özgü; sezgi; yalnız doğru önerme |
| UY | 16/3 | İşleme başlandığında bildirim (veli, baro, SHÇEK, kurum temsilcisi); azmettiren ya da istismar eden yakına bilgi verilmez; tutanakla derhâl savcıya | ilk iki cümle ≡K 31/2; özgü: "derhal", "özel kurum", savcıya tutanak |
| UY | 16/4 | Yararı aksini gerektirmedikçe yanında bir yakını devamlı bulunur; şüpheli yakın bulundurulmaz; tutanağa yazılır | çekirdek ≡K 31/3; özgü kayıtlar sezgiyle bulunur |
| UY | 16/5 | Aileye teslimi gereken çocuğun yakını bulunamaz ya da yakından şüphe edilirse teslim edilemez; savcının talimatı alınarak SHÇEK'e teslim | **UY-p1 #2** (yanlış önerme kaynağı) |
| UY | 16/6 | Teslimden sonra yetersiz rehberlik ya da gözetim öğrenilirse SHÇEK'e derhâl bildirim | özgü; cevabı kurum adı (ad kuralı) |
| UY | 16/7 | Beklemek çocuğun yararına aykırıysa güvenlik sağlanır, en kısa sürede SHÇEK'e teslim; suç mağduru çocukta teslim savcının talimatı doğrultusunda | ilk cümle ≡K 31/5; son cümle özgü |
| TY | 6/1 | Kolluk görevlileri korunma ihtiyacı olan çocuğu bildirmekle yükümlü | ≡K 6/1; bankada |
| TY | 14/4, 15/3 | Kollukça teslimde ilk sağlık kontrolünden sonra teslim; bulaşıcı hastalıkta derhâl sağlık tedbiri için mahkemeye ya da çocuk hâkimine başvuru | özgü; ilk yarı refleks, ikinci yarı K 9/4 ile iki okumalı |
| TY | 16/14, 17/1 | Sağlık, bakım ve barınma tedbirlerinde kolluk yardımı; kolluk talebi geciktirmeksizin yerine getirir | ≡K 45/2–3; bankada (vaka) |
| TY | 22/3 | Çocuk bulunamazsa kolluğa bildirim; hâkim, bulunmasının ve tesliminin çocuk birimince sağlanmasına karar verebilir; Yakalama md 5 saklı | özgü; bankadaki K 45/3 sorusuyla gerilimli (§6) |
| TY | 22/4 | Kurumdan izinsiz ayrılma: tutanak; en seri araçla kolluğa bildirim; sonra yazılı; hâkime bilgi | **TY-p1 yedek** |
| TY | 20/1 | İl koordinasyonunda il emniyet müdürü ve il jandarma komutanı | bankada [153]; liste eski adlarla dolu |
| TY | 25/2 | Çocuk birimi personelinin eğitimi kendi kurumlarınca | ≡K 31/4; bankada |

---

## A. Metnin durumu (BAĞLAYICI)

### A1. Resmî metne erişim ve karşılaştırma

| | TY (MevzuatNo 10884) | UY (MevzuatNo 10885) |
|---|---|---|
| Erişim | iframe ve `.doc` adresleri 200 döndü; ikisi aynı metin. `.pdf` adresi PDF değil HTML kabuğu döndürdü (kullanılmadı). | aynı |
| Künye | RG 24/12/2006, sayı 26386 | RG 24/12/2006, sayı 26386 |
| Değişiklik | tek: RG 23/5/2012, sayı 28301 (resmî tablo: "1. 23/5/2012 28301"; 2 ve 3 boş) | **yok.** Resmî sayfada değişiklik tablosu, şerh ya da dipnot bulunmuyor. Metin 2006'daki hâliyle duruyor. |
| Danıştay, AYM, yürütmenin durdurulması | resmî metinde hiçbir anma yok (betikle arandı) | resmî metinde hiçbir anma yok |
| Banka ↔ resmî | 31 = 31 madde. İçerik farkı yok. Tek fark md 15/6'da boşluk ("müdürlükleri ,"). | 42 = 42 madde. İçerik farkı yok. Tek fark md 22/2'de boşluk ("psiko -sosyal"). |
| Bankada eksik | madde başlıkları, bölüm adları, RG tablosu | madde başlıkları, bölüm adları |

- **Yapılamayan kontrol.** Danıştay karar arama sistemi taranmadı. Mevzuat Bilgi Sistemi iptalleri metne şerh olarak işler; iki metinde de şerh yoktur. Bir web araması da iptal kararı bulmadı. "İptal yok" sonucu bu üç dayanakla sınırlıdır; karar düzeyinde **doğrulanamadı**.
- **Okunmayan düzenleme.** Arama sonuçlarında "Danışmanlık Tedbiri Kararlarının Uygulama Usul ve Esasları Hakkında Tebliğ" (RG 24 Nisan 2026) başlığı çıktı. Metni okunmadı; TY md 12'nin uygulamasını değiştirmiş olabilir. **Doğrulanamadı.** TY md 12'nin ayrıntısı bu yüzden de dışarıdadır.

### A2. TY: değişiklik ve biçim

| Hüküm | Resmî şerh | Bugünkü metin | Kullanım |
|---|---|---|---|
| md 3 | (Değişik: RG-23/5/2012) | Dayanak: K md 47 ve 633 sayılı KHK md 2 | sorulmaz (dayanak). 633 sayılı KHK'nın 2018'de kaldırıldığı genel bilgidir; bu turda **doğrulanmadı** ⚑ |
| md 6 başlığı | dipnot (1): "Sosyal Hizmetler ve Çocuk Esirgeme Kurumuna" → "Aile ve Sosyal Politikalar Bakanlığına" | | başlık alıntılanmaz |
| md 6/1–5, 6/7, 7/1, 7/3, 8/1, 9/1-a ve c, 12/7, 14/1–2, 14/4, 14/7, 15/6, 17/2, 18/6, 19/1–3, 19/5, 19/7–8, 20/1–2, 20/4, 20/5-c, 25/2, md 28, md 31 | (Değişik ibare: RG-23/5/2012); 23 şerh | "Aile ve Sosyal Politikalar Bakanlığı", "… il ve ilçe müdürlükleri", "… Çocuk Hizmetleri Genel Müdürlüğü" | ad kuralı (A5) |
| md 19/3 | (Ek ibare), (Değişik ibare), (Mülga ibare) "(…)" | Başkan: ASPB Müsteşarı ya da müsteşar yardımcısı; üyeler: beş bakanlığın müsteşar yardımcıları, Çocuk Hizmetleri Genel Müdürü, Adalet Bakanlığı Ceza İşleri Genel Müdürü | ESKİ: müsteşarlık 2018'de kaldırıldı ⚑. Sorulmaz, çeldirici bile olmaz |
| md 20/1 | (Değişik ibare) "il özel idaresi genel sekreteri" | | bankada [153]; yeniden sorulmaz |
| **2012 değişikliğinin dokunmadığı "Kurum"** | — | md 6/4 "Kurum hizmetinden", 6/6 "Kurumun … hizmet modelleri", 7/2 "Kurum tarafından … Kuruma geldiği", 7/4–5, 14/1 "Kurumun", 14/5, 15/3–4 | md 4/ç'deki "Kurum" tanımı (çocuğun bakıldığı resmî ya da özel kurum) bu kullanımı karşılamaz; md 7'deki "Kurum" eski SHÇEK'tir. Soru bu sözcüğün kim olduğunu ölçmez |

**Banka metninin biçim kusurları (TY).**
1. **md 31'in altında dipnot gövdede:** "__________" çizgisi ve "(1) 23/5/2012 tarihli … metne işlenmiştir." Bu satır yönetmelik hükmü değildir.
2. **27 şerh madde gövdesine gömülü** ("(Değişik ibare:RG-23/5/2012-28301)", "(Ek ibare…)", "(Mülga ibare…) (…)"; md 3'ün başında "(Değişik:…)"). Resmî metinde de satır içidir. Soru, şık ve açıklamaya şerh taşınmaz.
3. md 1, 12/1 ve 28'de "(1)" tek başına satırda (satır kırılması; içerik tam).
4. Resmî metinden gelen yazım kusurları: md 13/6 "Türkiye İş Kurumuna Genel Müdürlüğüne"; md 8/1 "sorumlu kimse (…) Aile ve Sosyal Politikalar Bakanlığı" (virgül yok); md 9/1-c "kararı(Değişik"; md 9/3 "taktirde"; "toplântı".
5. Kesik ya da kaymış madde yok. Başlık yapışması yok (başlıklar hiç alınmamış).

### A3. UY: değişiklik ve biçim

| Hüküm | Durum | Kullanım |
|---|---|---|
| bütün metin | 2006'dan beri değişmedi | her hüküm A4'e karşı denetlenir |
| md 4 | bentler a, b, c, d, e, f, g, h, i (ç yok; resmî metinde de) | bent harfi yazılmaz |
| md 13/2 | "hükümde açık tefhim edilir" (doğrusu "hüküm de"; resmî metinde de). "onsekiz yaşını doldurmuş çocuklar" ifadesi md 4/a'daki çocuk tanımıyla çelişir | bankada iki kez ölçülmüş; yeniden sorulmaz |
| md 19/2-b | cümle virgülle bitiyor (resmî metinde de) | — |
| md 27/2-b | "gereğince yerine getirir" (edilgen olmalı; resmî metinde de) | — |

Banka metninde (UY) dipnot artığı, başlık yapışması ya da kesik madde **yok**.

### A4. Dayanak kanunla ve CMK ile çelişen ya da karşılığı kalmayan hükümler (ESKİ; soru konusu OLMAZ)

Karşılaştırma tabanı: `mevzuat/5395.txt` (7593 işlenmiş) ve CMK'nın 23 Kas 2026'da indirilen resmî metni.

| # | Yönetmelik hükmü | Yönetmelik ne diyor | Bugünkü kanun | Sonuç |
|---|---|---|---|---|
| E1 | UY 20 yerde, TY 10 yerde: "suça sürüklenen çocuk" (tanım: TY 4/a-2, UY 4/a-2) | eski terim | K md 1, 2, 3/a-2 ve devamı: "adli süreçteki çocuk" (7593, 8/8/2026). K md 49/a'da eski terim kalmış | **Terim ölçülmez, tanım sorulmaz.** A5 kural 6 |
| E2 | UY 12 yerde SHÇEK; TY 38 yerde ASPB | kaldırılmış iki kurum adı | K md 6, 7, 9, 10, 31, 37, 45/1–2, 47 hâlâ "SHÇEK" der; 2021–2026 ekleri (5/A, 15/4, 41/C/5, 45/4, Ek 1/5) "Aile ve Sosyal Hizmetler Bakanlığı" der | ad kuralı (A5) |
| E3 | TY 4/e, UY 4/f, UY 17/1 | SÇG: psikolojik danışmanlık ve rehberlik, psikoloji, sosyal hizmet (üç alan) | K 3/e (6327, 2012): sosyoloji, çocuk gelişimi, öğretmenlik, aile ve tüketici bilimleri eklendi (yedi alan). Bankada soru var | ESKİ. Üç alanlı tanım doğru şık olmaz |
| E4 | **TY 8/11; UY 20/2, 20/7** | Sosyal inceleme 12–15 yaş ile 15–18 yaş sağır ve dilsizlerde zorunlu; öbürlerinde yaptırılmazsa gerekçe "kararda" gösterilir | K 35/3 (7593): on beş yaşını doldurmamış **her** çocukta zorunlu; on beş yaşını doldurmuş çocukta yaptırılmazsa gerekçe iddianamede ya da kararda. Bankada vaka sorusu var | **ESKİ; en tehlikeli hüküm.** Yaş aralığı, sağır-dilsiz kaydı ve "kararda" sözcüğü doğru şık, çeldirici ya da açıklama olmaz |
| E5 | UY 20/4 | 20/2–3'teki hâllerde adlî tıp uzmanı, psikiyatrist ya da uzman hekimden görüş | Bağlandığı 20/2 eskidi (E4) | sorulmaz; çeldiricide dikkatle (§7) |
| E6 | UY 17/1 | Her mahkemeye en az bir SÇG, Adalet Bakanlığınca atanır | K 33/1 (7188, 7531): SÇG adli destek ve mağdur hizmetleri müdürlüğüne atanır, mahkemelere görevlendirilir | ESKİ |
| E7 | TY md 28; UY 17/8, 17/9 | brüt aylığın yüzde ellisi oranında "aylık ödenek" | K 33/2 (7531, 2024): "(ek gösterge dahil) … ödeme"; sözleşmeli personel; ödemeyi kadronun bulunduğu kurum yapar. K 33/3: sonradan görevlendirilenlere bu ödeme yapılmaz | ESKİ |
| E8 | UY 17/6, TY 18/10 | Bilirkişi listeleri yönetmeliğine (RG 1/6/2005) atıf | Bilirkişilik bugün ayrı kanuna bağlıdır ⚑ (**doğrulanmadı**) | sorulmaz |
| E9 | UY 23/1-b, 24/2, 26, 38/1 (KDAE) | 26/1: KDAE'de "çocuğa ilişkin **mahkeme kararı** Cumhuriyet başsavcılığına gönderilir"; 23/1-b "mahkemece belirtilen koşullar"; 26/3 "talî karar fişi … Adlî Sicil ve İstatistik Genel Müdürlüğüne" | CMK md 171 (5560, 6/12/2006; 7188, 2019): kararı **Cumhuriyet savcısı** verir; üst sınırı üç yıl ya da daha az hapis; uzlaştırma ve önödeme kapsamı hariç; kararlar "bunlara mahsus bir sisteme" kaydedilir. K md 19: erteleme süresi üç yıl; 19/2 (2019). K md 36 hâlâ "kararı onanan" der (Kanunun kendi artığı) | ESKİ ve iç tutarsız. KDAE usulü hiçbir biçimde sorulmaz |
| E10 | UY md 27 (HAGB) | "yükümlülük" ve denetim; 27/2-a mülga yönetmeliğe atıf; on gün içinde başvuru; başvurulmazsa kayıt kapatılır | CMK 231/5–14 **16/7/2026'da (7589) baştan yazıldı**; K 23/2–3 (7593): yönlendirme tedbirleri denetimli serbestlik tedbiri olarak uygulanır, 5/A'daki kurumlar yerine getirir; az zararda giderim şartı aranmayabilir. Bankada iki soru | ESKİ |
| E11 | UY 4/g, h, i; 24; 26; 27; 31; 33; 34; 37; TY 20/1 | "denetimli serbestlik ve yardım merkezî şube müdürlüğü", "büro" | K 20/3 (7242, 2020) "denetimli serbestlik müdürlüğü" der; K 32/1 ve 37/1 eski adı korur. 5402'nin adının 2012'de değiştiği ikincil kaynaktan görüldü; resmî metinden **doğrulanmadı** | ad kuralı (A5) |
| E12 | UY md 12, 27/2-a | Denetimli Serbestlik ve Yardım Merkezleri ile Koruma Kurulları Yönetmeliği uygulanır | Bu yönetmeliğin mülga olduğu ikincil kaynakta yazıyor; resmî kaynaktan **doğrulanmadı** | sorulmaz |
| E13 | **UY 5/7, 13/6** son cümle | "Bunlar hakkında bilirkişilere ilişkin hükümler uygulanır." | CMK 236/3'te bir cümle 7188 (2019) ile kaldırıldı ("(Mülga cümle…)"). Kaldırılan cümlenin metni resmî sayfada yazmaz; bu cümle olduğu **doğrulanamadı**, ama yeri ve konusu aynıdır. CMK 236/4–8 (özel ortam, merkezler, kayıt) yönetmelikte yok | cümle soru, şık ve açıklamaya girmez. Mağdur çocuğun dinlenmesi hiç sorulmaz (ayrıca ≡K) |
| E14 | UY 5/11 | Yaşın gerçek olmadığı anlaşılırsa hukuk mahkemesinde dava açılıp düzeltilmeden kamu davası açılamaz | CMK 218/2 (5560): kovuşturmada yaş sorununu ceza mahkemesi çözer. Soruşturma evresi için ilişki belirsiz | iki okumalı; sorulmaz |
| E15 | TY md 19–21 (koordinasyon) | merkez: ASPB, sekretarya ÇHGM, müsteşarlı toplantı; il: vali başkanlığında liste; ilçe: kaymakamlık | K 45/4 (7593): merkezde ASHB; il ve ilçede koordinasyon ile takip vali ve kaymakamda; il ve ilçede sekretarya aile ve sosyal hizmetler il müdürlükleri. Bankada K sorusu + [153] + ÇHGM sorusu | çekirdek artık Kanunda ve bankada; ayrıntı eski unvan. Sorulmaz |
| E16 | TY 8/5–6 | 12 yaş altı ve 12–15 yaş için "çocuklara özgü güvenlik tedbirleri" (TCK 31, 33) | K 5/A (7593): yönlendirme tedbirleri de çocuklara özgü güvenlik tedbiridir; K 5/A/4 yeni bir yönetmelik öngörür. TCK md 31'in güncel metni bu dosyalarda yok (**doğrulanamadı**) | ≡K ve eksik; sorulmaz |
| E17 | TY md 7 (acil korunma) | K 9/1–3'ün aynası | K 9/4–6 (7593): sağlık kurumunun başvurusu, yirmi dört ve kırk sekiz saatlik süreler; yönetmelikte yok | ≡K; bankada üç soru. "Acil korunma kararına yalnız Kurum başvurur" çıkarımı yanlıştır |
| E18 | TY 14/4, 15/3 (bulaşıcı hastalık → sağlık tedbiri için başvuru); TY 16/4 (sağlık kurulu raporu; açıkça belli ise raporsuz) | | K 9/4 (7593): ağır tehlike arz eden bulaşıcı hastalıkta ve bağımlılıkta acil korunma yolu; uzman hekim raporu, üç hekimli sağlık kurulu | iki rejim; iki okumalı. Sağlık raporu ve bulaşıcı hastalık açısı sorulmaz |
| E19 | TY 22/3 (hâkim, çocuğun bulunmasının kollukça sağlanmasına "karar verebilir"); 16/14; 17/1 | | K 45/3 (7593): tedbiri yerine getiren kurum, gerekmesi hâlinde kolluktan yardım isteyebilir. Bankadaki vaka sorusunda "hâkimden ayrıca karar gerekir" yanlış şıktır | 22/3'ün mercii sorulmaz (§6) |
| E20 | UY 36, 37 | 1983–2004 tarihli eğitim yönetmeliklerine atıf | güncellikleri **doğrulanmadı** | sorulmaz |
| E21 | UY 24/5 | "çocukla iyi iletişim kurabilecek olanlar tercih edilir" | K 37/2: "çocuğa kolay ulaşabilecek olanlar tercih edilir" | ifade farkı; sorulmaz |
| E22 | UY 16/3 | "resmî veya özel bir kurumda kalıyorsa" | K 31/2: "resmî bir kurumda kalıyorsa" | fark ölçülmez |
| E23 | UY 22/2 son cümle, 35/2 son cümle | gelişimini olumsuz etkileyecek bilgi çocuğa verilmeyebilir | K 41/2: yasak "çocuk ve avukatı hariç" kurulur. Bankadaki K sorusunun doğru şıkkı bu kayıttır | ters düşer; sorulmaz |
| E24 | TY 31; UY 42; TY 12/7 ("yayımından itibaren altı ay içinde") | yürütme; tükenmiş geçiş süresi | | sorulmaz |
| E25 | TY 9/1-b, 13/3–8, 20/1 | "Çalışma ve Sosyal Güvenlik Bakanlığı bölge müdürlükleri", "Türkiye İş Kurumu Genel Müdürlüğü" | K 45/1-b "Çalışma ve Sosyal Güvenlik Bakanlığı" der; taşra birimlerinin bugünkü adı **doğrulanmadı** | merci olarak sorulmaz |

**Sayım.** Soru konusu olamayacak hüküm kümesi **25**'tir (E1–E25). İptal edilmiş hüküm bulunmadı. En önemlileri: E4 (sosyal incelemenin zorunluluğu), E1 (terim), E9–E10 (KDAE ve HAGB usulü), E2 ve E11 (kurum adları), E13 (CMK 236), E15 (koordinasyon), E19 (kolluk yardımı).

### A5. Ad kuralı (BAĞLAYICI)

| Metindeki ad | Nerede | Bugün | Kanun ne diyor |
|---|---|---|---|
| Sosyal Hizmetler ve Çocuk Esirgeme Kurumu; "il veya ilçe sosyal hizmetler müdürlüğü" | UY 5/8, 15/1-c, 16/3, 16/5–7, 17/9, 19/4, 24/3 | 2011'de kaldırıldı; görevleri ASHB'de ve il müdürlüklerinde ⚑ | K md 6, 7, 9, 10, 31, 37, 45, 47: SHÇEK |
| Aile ve Sosyal Politikalar Bakanlığı, il ve ilçe müdürlükleri, Çocuk Hizmetleri Genel Müdürlüğü | TY (38 yer) | Bakanlık 2018'de birleşti; 2021'den beri Aile ve Sosyal Hizmetler Bakanlığı ⚑ | K 5/A, 15/4, 41/C, 45/4, Ek 1: Aile ve Sosyal Hizmetler Bakanlığı |
| "Kurum" (büyük harfle) | TY 6/4, 6/6, 7/2–5, 14/1, 14/5, 15/3 | eski SHÇEK'in artığı | K md 9 "Kurum" |
| denetimli serbestlik ve yardım merkezî şube müdürlüğü; büro | UY (21 yer); TY 20/1 | denetimli serbestlik müdürlüğü ⚑ | K 20/3 yeni ad; 32/1, 37/1 eski ad |
| Müsteşar, müsteşar yardımcısı; Ceza İşleri Genel Müdürü | TY 19/3 | müsteşarlık kaldırıldı ⚑ | — |
| Çalışma ve Sosyal Güvenlik Bakanlığı bölge müdürlükleri; Türkiye İş Kurumu Genel Müdürlüğü | TY 9, 13, 20 | **doğrulanmadı** | K 45/1-b |
| Adlî Sicil ve İstatistik Genel Müdürlüğü | UY 26/3, 27 | — | CMK 171/5, 231/13: "bunlara mahsus sistem" |

1. **Kurum adı ölçülen unsur olmaz.** Cevabı SHÇEK, ASPB, ASHB, il ya da ilçe müdürlüğü, ÇHGM ya da "Kurum" olan soru yazılmaz: "çocuk kime teslim edilir", "kime bildirilir", "tedbiri hangi kurum yerine getirir", "karar nereye gönderilir". Bu sorular zaten varsayılan cevaplıdır ("sosyal hizmetler").
2. **"Aile ve Sosyal Politikalar Bakanlığı" ve "müsteşar" hiçbir şıkta yer almaz.** Ne doğru şık ne çeldirici. Metin bu adı söylediği için çeldirici olarak yanlışlığı metinle kanıtlanamaz; doğru şık olarak da kaldırılmış bir kurumu öğretir.
3. **Sabit bağlam olarak anmak zorunluysa tek ad: "Sosyal Hizmetler ve Çocuk Esirgeme Kurumu".** UY'nin ve Kanunun (md 6, 31) metnindeki addır; bankadaki K md 6 ve K md 9 soruları da bu adı taşır. Önce kurumu anmadan kurulabilen biçim denenir ("ilgili kuruma teslim eder"; TY 22/3 bu ifadeyi kullanır).
4. **TY partisinde kurum adı gerektiren yuva açılmaz.** Metin "Aile ve Sosyal Politikalar" der; bankadaki iki TY sorusu aynı yeri "Aile ve Sosyal Hizmetler Bakanlığı" diye yazmıştır. İki ad arasında seçim kullanıcı kararıdır (bkz. Şüpheli noktalar 12).
5. **"Aile ve Sosyal Hizmetler Bakanlığı", "aile ve sosyal hizmetler il müdürlüğü" ve "denetimli serbestlik müdürlüğü" yalnız çeldiricide ve iki şartla yazılır:** sorulan işlemi metin başka bir aktöre veriyor; hiçbir hüküm aynı işlemi SHÇEK'e, ASPB'ye ya da şube müdürlüğüne de vermiyor. Bu adlar SHÇEK ile aynı şık takımına girmez.
6. **"Suça sürüklenen çocuk" ve "adli süreçteki çocuk" terimlerinin ikisi de yazılmaz.** Birincisi Kanunda kalmadı ve bankadaki güncel soru bu değişikliği ölçüyor; ikincisi yönetmelik metninde yok. Kök olguyu yazar: "hakkında soruşturma yürütülen çocuk", "suç şüphesiyle kolluğa getirilen çocuk", "aileye teslimi gereken çocuk". Terimi kaçınılmaz kılan yuva açılmaz. 7593'ün yönetmeliklerdeki ibareye de uygulanıp uygulanmadığı **doğrulanamadı**.
7. **"Sağır ve dilsiz" kaydı köke ve şıklara taşınmaz.** Yaş grubu yalnız yaşla kurulur.
8. **Denetimli serbestlik birimi doğru şık olmaz** ("şube müdürlüğü", "büro"). Cevabı bu birim olan merci sorusu yazılmaz.
9. **Mülga ya da güncelliği doğrulanmamış yönetmeliklere atıf** (E8, E12, E20) soru, şık ve açıklamaya girmez.
10. Doğru şıkta güvenli aktörler: mahkeme, çocuk hâkimi, Cumhuriyet savcısı, kolluğun çocuk birimi, "tedbir kararını yerine getirmekle sorumlu kurum", sosyal çalışma görevlisi, denetim görevlisi, vali, kaymakam.

---

## B. Kanunun aynası olan hükümler (yönetmelik adıyla sorulmaz)

Ölçülen bilgi Kanunda (ya da CMK'da) aynı cümleyle duruyorsa soru yönetmeliğe özgü değildir. `09` brifinin 22 Kas kuralı 4 burada da geçerlidir: ortak unsur bankada Kanun adıyla sorulmamış olsa bile soru açılmaz.

### B1. TY

| TY | Kanun | Bankada | Yönetmeliğe özgü kalan |
|---|---|---|---|
| md 1, 2, 4 | K md 1, 2, 3 (eski terimle) | çocuk tanımı, çocuk hâkimi, SÇG alanları | 4/d'de mahkeme tanımına aile, asliye hukuk ve ceza mahkemeleri eklenmiş (K Geçici 1) |
| md 5 | K 5/1 | [158], K md 5 | "çocuğun yararı…" girişi (ilke) |
| 6/1, 6/2, 6/5 | K 6/1–2 | K md 6 (açıkça sayılan: STK) | 6/1 listeye muhtarları, belediye zabıta memurlarını, öbür kamu görevlilerini ve "haberdar olanlar"ı ekler; 6/3 basın haberi ihbar sayılır; 6/7 SİR talep yazısına eklenir |
| 7/2, 7/4, 7/5 | K 9/1–3 (aynen) | [152], K md 9 (otuz gün) + 7593 soruları | 7/1 "sağlık kontrolü yaptırıldıktan sonra"; 7/3 il müdürünün oluru |
| 8/1, 8/2 | K 7/1, 8/1; Geçici 1/4 | — | — |
| 8/5, 8/6 | TCK 31, 33; K 11, 12 | K md 11 | — |
| 8/7, 8/8 | K 13/1–2 | K md 13 | "yazılı veya sözlü" |
| 8/9 | K 7/7 | — | "duruşma yaparak" |
| 8/12 ilk iki cümle, 8/13, 8/15 | K 7/3, 7/4, 4/j | [163] | 8/12 son cümle; 8/13 uygulayacak kişi ya da kurumun adı; 8/14 |
| 9/1 | K 45/1, 45/4 son cümle | bakım tedbiri kararının gönderileceği yer | il düzeyindeki adresler (eski adlar) |
| md 10 | K 8/3 | — | 10/2 gerekçeli rapor |
| 11/1, 11/3 | K 7/5, 7/6 | [163] (on sekiz yaş) | 11/2 talep edebilenler |
| 12/1, 13/1, 14/1, 15/1–2, 16/1 | K 5/1 a–e, 5/2 | — | tanımlara eklenen ayrıntı |
| 12/7, 13/8, 14/7, 15/6, 16/15 | K 45/1 | [161] | — |
| 16/14 son cümle, 17/1, 17/2 | K 45/2, 45/3 | K md 45 vaka | 17/1 "kolluk birimleri geciktirmeksizin yerine getirir" (45/2'de de var) |
| 18/4 | K 8/2 | K md 8 (üçer aylık) | 18/5–6 incelemeyi yapan |
| 18/7–11 | K 33/3; UY 17/3–7 ile kelimesi kelimesine ikiz | — | — |
| md 19–21 | K 45/4 | K md 45, [153], ÇHGM sorusu | üyeler listesi (eski) |
| 25/2 | K 31/4 | K md 31 | destek veren kurumlar |
| md 27 | K md 43 ile birlikte okunur ("Devletçe ödenir") | K md 4 sorusunun doğru şıkkı | "tedbiri yerine getirmekle yükümlü kurumlar karşılar" |

### B2. UY

| UY | Kanun / CMK | Bankada | Yönetmeliğe özgü kalan |
|---|---|---|---|
| md 1–4 | K md 1–3 | tanımlar | 4/g denetim görevlisi tanımı (eski adlarla) |
| 5/1, 5/2 | K 15/1, 30/2; Geçici 1/3 | K md 15, K md 30 (vaka) | — |
| 5/4 | K 15/2 | CMK bankasında öncüllü soru | — |
| 5/5–7; 13/4–6 | CMK 236/1–3 | [159], [348] şıkları; CMK'da iki soru | E13 |
| 5/8 son cümle | K 15/3 | — | savcının bildirim yükümü, SİR'in örneği savcılığa |
| md 6 | K md 16 | K md 16 (vaka) | — |
| md 7 | K md 17 | K md 17 | 7/1 "adlî kolluk ayrı evrak düzenler"; 7/3 a–b birleştirme usulü |
| md 8 | K md 18 | K md 18; Yakalama md 7 | — |
| md 9, 10 | K 20/1–2 | K md 20 (2 soru) | 10: yükümlülüklerin kaldırılması, değiştirilmesi, muafiyet |
| md 11 | K md 21 | [162]; CMK'da 2 soru | — |
| 13/1 ilk cümle | CMK 185 | [348]; CMK sorusu | — |
| 13/1 ikinci cümle, 13/3 ilk cümle, 13/7 | K 22/1–3 | [159], [348]; CMK sorusu | 13/3 SÇG'nin duruşmadaki görevinin tanımı |
| 14/1, md 15 | K md 29, 30 | K md 30 | 14/2 müdür ve zabıt kâtibi; 15/1-d |
| 16/1; 16/3 ilk iki cümle; 16/4 çekirdek; 16/7 ilk cümle | K 31/1, 31/2, 31/3, 31/5 | K md 31 (yalnız eğitim sorusu) | §0 ◆ tablosu |
| 17/3–5, 17/10, 17/11 | K 33/3, 33/4, 34/3 | K md 33 | — |
| 19/1 a, b, e; 19/4 ilk iki cümle | K 34/1–2 | [155], [349], sayılmamıştır sorusu | 19/1 c, d; 19/2; 19/4 "meslek sırrı kapsamındaki bilgiler istisnadır" |
| 20/1 ilk cümle, 20/5; 21/3 | K 35/1–2 | K md 35 boşluk sorusu | 20/1 ikinci cümle (talep edebilenler); 20/6; md 21 içerik listesi; **21/2** |
| 22/1, 22/2 ilk cümle; md 35 | K md 41 | K md 41 | "gizli tutulur, amacı dışında kullanılamaz"; E23 |
| 24/1, 24/3, 24/5 | K 37/1–2 | — (ölçülmemiş, ama Kanun hükmü) | 24/4 işbirliği |
| md 25 | K md 38 (aynen) | [349], sayılmamıştır sorusu, [155] | — |
| 28/1, 28/3, 28/4; md 29 | K 39/1–3 | [160], K md 39 (on gün) | 28/2 tedbiri uygulayacak yerin görüşü; 28/5 infaza başlama tarihi |
| md 30 | K 38/1-f ile aynı aralık | şıklarda üç kez | "değerlendirme raporu" adı |
| md 32 | K md 40 | K md 40 | — |

---

## C. Bankada ölçülenler (yeniden sorulmaz)

**5395 bankasının 59 sorusu:** 52'si Kanun, 6'sı TY, 1'i UY ([159]) sorusudur. UY'nin kendi konusunda 3 soru daha var.

| Hüküm | Açı | Nerede | Sızıntı ve karar |
|---|---|---|---|
| TY md 5 = K 5 (beş tedbir) | K | [158] (denetim), K md 5 (kontrol) | sorulmaz |
| TY md 7 = K 9: beş gün, üç gün, otuz gün | S | [152] (yanlış: yedi gün); K md 9 (otuz) | sorulmaz. Açıklama bu üç değeri yazmaz |
| K 9/4–6 (7593) | S, Sn | iki soru | TY sorusu sağlık kurumu yolunu sormaz ve yok saymaz |
| TY 9/1-c | M | bakım tedbiri kararı → il müdürlüğü | sorulmaz (ad kuralı) |
| TY 12/7 = K 45/1 | M | [161] | sorulmaz |
| TY 19/2 | M | merkezî sekretarya: ÇHGM | sorulmaz |
| TY 20/1 | K | [153] (il müftüsü) | sorulmaz |
| K 45/3 (kolluktan yardım) | Sn, V | K md 45 vaka | TY 16/14, 17/1, 22/3 bu soruyla çözülür ya da çatışır |
| K 45/4 (vali ve kaymakam) | M | K md 45 | TY md 20–21 sorulmaz |
| K 6/1 (bildirim yükümlüleri) | K | "açıkça sayılmıştır": STK; yanlış şıklar muhtarlar, barolar, yerel yönetimler | **TY 6/1 muhtarı sayar.** TY sorusu "muhtar"ı doğru öğe yaparsa bankadaki soruda adayı yanlışa iter. TY 6/1 sorulmaz |
| K 7 (tedbir kararı) ve TY 11/3 | Ş | [163] (on sekiz yaş) | sorulmaz |
| K 8/2 = TY 18/4 (üçer aylık) | S | K md 8 | sorulmaz. "üçer ay" başka TY sorusunda doğru şık olmaz |
| K 13 = TY 8/7–8 (duruşmasız karar) | usul | K md 13 | sorulmaz |
| K 3 (çocuk hâkimi tanımı) | K | K md 3: "kovuşturma başlatılmış olanlar hariç" | TY-p1 #2'nin sınırı: tanım sorulmaz; açıklama tanımı içerikle yazmaz |
| K 14 (itiraz: en yakın çocuk mahkemesi) | M | K md 14 | çeldirici kaynağı; doğru şık olmaz |
| K 31/4 = TY 25/2 (eğitim) | M | K md 31 | sorulmaz |
| K 16 = UY 6 | Sn, V | K md 16 vaka | sorulmaz |
| K 17 = UY 7 | Sn | K md 17; CMK sorusu | sorulmaz |
| K 18 = UY 8 | İ | K md 18; Yakalama md 7 | sorulmaz |
| K 20 = UY 9–10 | Sn, K | K md 20 (2) | sorulmaz |
| K 21 = UY 11 | S | [162]; CMK'da 2 | sorulmaz |
| UY 13/1–2 | Sn | [348] (açık duruşma), [159] (on beş yaş) | sorulmaz |
| UY 13/3, 13/7; 5/6–7 | — | [159], [348] doğru önermeleri | yeni soruda önerme olarak yinelenmez |
| K 15/1, K 30 = UY 5/1, 15 | M, V | K md 15; K md 30 vaka | sorulmaz |
| K 34 ↔ K 38 = UY 19 ↔ 25 | A | [155], [349], sayılmamıştır sorusu | **Üç soru aynı ayrımı ölçüyor.** SÇG ve denetim görevlisi görev listeleri hiçbir biçimde sorulmaz |
| K 35/1 = UY 21/3 | K | boşluk: "algılama – yönlendirme" | UY-p1 #3'ün sınırı |
| K 35/3 (on beş yaş, zorunlu) | Ş, V | K md 35 vaka | E4: UY 20/2 ve TY 8/11 sorulmaz |
| K 39 = UY 28 | S, K | [160]; on gün | sorulmaz. "On gün" ✱ başka soruda doğru şık olmaz |
| K 40 = UY 32; K 41 = UY 22, 35; K 33/4 = UY 17/10 | Sn | birer soru | sorulmaz |
| K 19 (üç yıl), K 23 (HAGB) | S, Sn | üç soru; CMK'da iki soru | UY 26–27 sorulmaz (E9, E10) |
| Yakalama md 19 (on iki ve on beş yaş; kimlik tespitinden sonra serbest bırakma; müdafi) | S, Sn | üç soru | **UY-p1 #1'in sınırı ve çeldirici kaynağı.** Açıklama Yakalama kuralını içerikle yazmaz |
| CMK: çocuk mağdurun dinlenmesi | — | iki soru (ikiz) | UY 5/5–7, 13/4–6 sorulmaz |
| Güncel bankası: 7593 terim değişikliği | K | bir soru | A5 kural 6 |

**Çakışma dosyalarının sayımı.**
- `tedbir-yon-cakisma` (47): ilgili 19 · sınır 23 · ilgisiz 5 (TCK 50, TCK 251, CMK 101, PVSK Ek 7, 6284 Yön. md 42).
- `cocuk-uyg-cakisma` (93): ilgili ≈27 (K'nın 42 sorusunun ≈18'i; CMK'da çocuk muhakemesi ve mağdur çocuk 5; Yakalama md 19 2; tanım ve terim 2) · sınır ≈33 (K'nın kalanı; CMK 171 KDAE 5; kelepçe ve maddi güç 3) · ilgisiz ≈33 (uzlaştırma 14, önödeme 3, seri muhakeme 3, iddianamenin iadesi 3, genel kültür ve öbürleri). Yönetmelikte uzlaşma hükmü yoktur; süzgeçteki "uzlaştırma" sözcüğü boşa eşleşmiştir.
- `diger-konu`: TY 7 (altısı yukarıdaki TY soruları, biri K md 8). UY 3 (ikisi CMK'daki ikiz soru, biri [159]).

**Ölçülmemiş ve yönetmeliğe özgü:** TY 6/3, 6/7, 8/3, 8/4, 8/10, 8/14, 9/2, 9/3, 10/2, 13/5–6, 14/2, 14/5–6, 16/2, 16/5–13, 18/1–3, 18/12–14, 22/2–4, md 23–24, md 26. UY 5/3, 5/10, 7/3 a–b, 14/2, 16/2, 16/4–6, 17/2, md 18, 19/1 c–d, 19/2, 19/4 son cümle, 20/6, 21/1–2, 28/2, 28/5, md 31, 33, 34, 38–39.

---

## D. Madde madde değer tabloları

### D1. TY (31 madde)

| md | Konu | Açı | Değer | ◆ | [K→K] | Varsayılan ya da sezgi riski | Karar |
|---|---|---|---|---|---|---|---|
| 1–4 | amaç, kapsam, dayanak, tanımlar | K | D | | | E1, E3 | dışarıda |
| 5 | beş tedbir | K | D | | | bankada | dışarıda |
| 6/1–2, 6/5 | bildirim ve başvuru | K | D | ◆ | | ≡K; muhtar çatışması | dışarıda |
| 6/3 | basın haberi ihbar sayılır | Sn | D | | | sezgi | dışarıda |
| 6/7 | SİR talep yazısı ekinde sunulur | usul | D | | | — | dışarıda |
| 7 | acil korunma | S | D | | | ≡K; bankada | dışarıda |
| 8/1–2, 8/5–9, 8/11, 8/13, 8/15 | yetki ve usul | | D | | | ≡K ya da ESKİ | dışarıda |
| **8/3** | Kovuşturma başlamışsa tedbir kararını kovuşturmayı yapan mahkeme alır | M, A | O | | evet | varsayılan (çocuk hâkimi) **yanlışa** götürür | **#2** |
| 8/4 | karar sureti soruşturma dosyasına | usul | D | | | — | dışarıda |
| 8/10 | Aile mahkemeleri baktıkları davayla ilgili tedbir kararı verebilir | M | D/O | | | — | #2'de çeldirici |
| 8/12 | aile içi tedbirin önceliği; son cümlede kurumda bakımın "öncelikle değerlendirilmesi" | Ş | D | | | ilk kısım sezgi; son cümle K 4/j ile gerilimli | dışarıda (iki okumalı) |
| 8/14 | karar idarenin takdir alanını kısıtlamamaya özen gösterir | Ş | D | | | "özen gösterilir" | #1'in açıklama dayanağı |
| 9/1 | kararların gönderileceği yerler | M | D | | | bankada; eski adlar | dışarıda |
| 9/2 | kesinleşmesi beklenmeksizin derhâl uygulanır | Sn | D/O | | | "çocuk işi beklemez"; 6284 bilgisi | yalnız doğru önerme |
| **9/3** | Uygulama yeri: kural, kararı verenin bulunduğu yer; mümkün değilse yeri sorumlu kurum belirler | M, İ | O | | evet | varsayılan (hâkim) **yanlışa** götürür | **#1** |
| 10–11 | değiştirme, uzatma, kaldırma, sona erme | | D | | | ≡K; bankada | dışarıda |
| 12 | danışmanlık | K | D | | | ayrıntı; tebliğ okunmadı | dışarıda |
| 13/5–6 | on beş yaşını doldurmuş çocukta iş ve meslek yerleştirmesi | Ş | D | | | "çalışma yaşı on beş" sezgisi | dışarıda |
| 13 kalanı | eğitim | K | D | | | eski adlar | dışarıda |
| 14/2 | rehabilitasyon ihtiyacı olan çocuk öbür çocuklarla aynı ortamda bakılmaz | Ş | D | | | sezgi | dışarıda |
| 14/4, 15/3 | kollukça teslimde ilk sağlık kontrolü; bulaşıcı hastalık | Sn | O | ◆ | evet | ilk yarı refleks; ikinci yarı E18 | yalnız doğru önerme (ilk yarı) |
| 14/5, 15/4 | yabancı çocukta konsoloslukla irtibat | Sn | D | | | "yabancı → konsolosluk" | dışarıda |
| 14/6, 15/5 ↔ 27 | Sağlık kontrolü ve tedavi giderleri Sağlık Bakanlığında; genel kural: tedbiri yerine getiren kurum | A | D/O | | | gider konusu düşük değer | yedek soruda yanlış önerme |
| 16 | sağlık tedbiri | | D | | | E18; 16/13 hassas | dışarıda |
| 16/14, 17 | kolluk yardımı | | D | ◆ | | ≡K; bankada | dışarıda |
| **18/1** | Uygulama plânı teslimden itibaren en geç on gün içinde onaya sunulur | S ✱ | D/O | | | "plân = on gün" (K 39/1 bankada) | yedek (zayıf) |
| 18/5–6 | incelemeyi mahkemedeki SÇG yapar; bakım ve barınmada öncelikle kurumdaki SÇG | M | D | | | — | dışarıda |
| 18/7–11 | görevlendirme zinciri | | D | | | ≡K; E7, E8 | dışarıda |
| 18/12 | inceleme raporu on gün içinde ✱ | S | D | | | — | dışarıda |
| 18/13 | hizmetler ilgili Bakanlığın denetiminde; ceza infaz kurumlarına görev yüklenemez | İ | D/O | | | — | yedek soruda doğru önerme |
| 18/14 | nakil, izin, izinsiz ayrılma kurumun kendi mevzuatına göre | | D | | | — | dışarıda |
| 19–21 | koordinasyon | | D | ◆ | | E15; bankada | dışarıda |
| 22/1–2 | defter; teslim alma ve derhâl işlem | | D | | | sezgi | dışarıda |
| 22/3 | çocuk bulunamazsa | M | O | ◆ | evet | "hâkim karar verir"; E19 | dışarıda |
| **22/4** | izinsiz ayrılma | Sn | O | ◆ | evet | "kolluğa haber verilir" | **yedek** |
| 23–24 | defter, karton | | D | | | — | dışarıda |
| 25 | eğitim | | D | ◆ | | bankada | dışarıda |
| 26 | gizlilik (avukat hariç) | | D | | | sezgi | dışarıda |
| 27–31 | giderler, ödenek, kayıt, yürürlük, yürütme | | D | | | E7, E24 | dışarıda |

### D2. UY (42 madde)

| md | Konu | Açı | Değer | ◆ | [K→K] | Varsayılan ya da sezgi riski | Karar |
|---|---|---|---|---|---|---|---|
| 1–4 | amaç, kapsam, tanımlar | | D | | | E1, E3, E11 | dışarıda |
| 5/1–2, 5/4 | soruşturmayı yapan; SÇG bulundurma | | D | | | ≡K; bankada | dışarıda |
| 5/3 | farklı yargı çevresi: fezlekeyle öbür başsavcılığa | usul | D | | | — | dışarıda |
| 5/5–7 | mağdur çocuk | | D | | | ≡CMK; E13 | dışarıda |
| 5/8 | savcının bildirim yükümü | M | D | | | ad kuralı | dışarıda |
| 5/9 | Yakalama Yön.'e atıf | | D | ◆ | | — | dışarıda |
| **5/10** | on iki yaşından küçük çocuğun karıştığı fiilde soruşturma | K, A | **Y** | ◆ | evet | "ceza sorumluluğu yoksa soruşturma olmaz" **yanlışa** götürür | **#1** |
| 5/11 | yaş düzeltme | Ş | O | | | E14 | dışarıda (iki okumalı) |
| 6, 7/1–2, 8 | gözaltı, iştirak, nakil | | D | ◆ | | ≡K; bankada | dışarıda |
| 7/3 a–b | birleştirme usulü | usul | D | | | — | dışarıda |
| 9–11 | adlî kontrol, tutuklama yasağı | | D | | | ≡K; bankada | dışarıda |
| 12 | mülga yönetmeliğe atıf | | D | | | E12 | dışarıda |
| 13 | kovuşturma | | D | | | bankada üç kez | dışarıda |
| 14–15 | çocuk bürosu | | D | | | ≡K | dışarıda |
| 16/1, 16/3, 16/7 ilk cümle | çocuk birimi: öncelik, bildirim, acil teslim | | O | ◆ | | ≡K; kurum adı | yalnız doğru önerme |
| 16/2 | yetişkinlerle karşılaşmanın önlenmesi | Sn | D/O | ◆ | | sezgi | #2'de doğru önerme |
| 16/4 | yakının devamlı bulunması; şüpheli yakın | Ş, İ | O | ◆ | | sezgi | #2'de doğru önerme |
| **16/5** | aileye teslim edilemeyen çocuk: savcının talimatı | M, Ş | **Y/O** | ◆ | evet | doğrudan sorulursa varsayılan (savcı) | **#2** (yanlış önerme: merci değiştirilir) |
| 16/6 | teslim sonrası bildirim | Sn | O | ◆ | evet | cevap kurum adı; "derhâl bildirir" | #2'de doğru önerme (kurum adsız) |
| 16/7 son cümle | suç mağduru çocukta teslim savcının talimatıyla | M | O | ◆ | | varsayılan (savcı); karşıt hâl yokluktan yargı | dışarıda |
| 17 | SÇG atama ve çalışma | | D | | | E6–E8 | dışarıda |
| 18 | SÇG çalışma ilkeleri | K | D | | | sezgi listesi | dışarıda |
| 19/1–3 | SÇG görevleri | | D | | | bankada üç kez | dışarıda |
| 19/4 | bilgi ve belge isteme; ilgililer vermek zorunda; meslek sırrı istisna | İ | O | | | "meslek sırrı korunur" sezgisi | yedek |
| 20 | sosyal inceleme talebi | | D | | | E4, E5; ≡K | dışarıda |
| 21/1 | SİR'in içeriği | K | D/O | | | açık uçlu ("tamamına veya bir kısmına") | #3'te çeldirici kaynağı |
| **21/2** | raporda algılama ve yönlendirme yeteneği hakkında sonuç değerlendirmesinde bulunulmaz | İ, A | **Y/O** | | evet | "rapor yeteneği belirler" **yanlışa** götürür | **#3** |
| 22, 35 | raporlar hakkında bilgi edinme | | D | | | ≡K; E23 | dışarıda |
| 23–25 | denetim kararı, görevli, görevler | | D | | | ≡K; E9, E11; bankada | dışarıda |
| 26–27 | KDAE ve HAGB işlemleri | | D | | | E9, E10 | dışarıda |
| 28–30 | plân ve raporlar | S ✱ | D | | | ≡K; bankada | dışarıda |
| 28/5 | infaza başlama tarihi: plânın hâkimce onaylandığı tarih | Sn | D | | | — | dışarıda |
| 31 | denetime ara verilmesi (askerlik, sağlık, yurt dışı eğitim); karar Cumhuriyet başsavcılığında | M | D | | | "askere giden çocuk" | dışarıda |
| 32 | denetimin sona ermesi | | D | | | ≡K; bankada | dışarıda |
| 33–34 | bildirim, yetki alanı | | D | | | E11 | dışarıda |
| 36–42 | eğitim, karton, kayıt, yürürlük, yürütme | | D | | | E20, E24 | dışarıda |

---

## E. Değer tabloları, varsayılan cevaplar, ters ayırt etme

### E1. Süreler

| Değer | Yer | Bankada |
|---|---|---|
| üç gün | TY 7/2 hâkimin acil korunma talebine kararı | [152] |
| beş gün | TY 7/2 Kurumun hâkime başvurusu | [152] (yanlış: yedi) |
| on gün ✱ | TY 18/1 uygulama plânının onaya sunulması · TY 18/12 inceleme raporu · UY 26/1 ve 27/2 başvuru için bildirim (ESKİ) · UY 28/1 denetim plânı | K md 39 (on) |
| on beş gün ✱ | TY 19/5, 20/2 toplantı gündeminin bildirilmesi | hayır (değersiz) |
| otuz gün | TY 7/4 acil korunma kararı | K md 9; [152] |
| her ay ✱ | UY 29 denetim raporu · UY 39/2 liste güncellemesi | hayır (K 39/3 aynası) |
| üç ay ✱ | TY 16/6 akıl hastası çocuk hakkında bilgi · TY 18/4 uygulamanın incelettirilmesi · UY 25/1-f ve 30 raporlar | K md 8; şıklarda üç kez |
| altı ay | TY 12/7 (tükenmiş geçiş süresi) | — |

- **Süre sorusu kurulmaz.** Her değer ya bankadadır, ya Kanunun aynasıdır, ya eskimiş usule bağlıdır. Ölçülmemiş tek özgü süre TY 18/1'dir; değeri (on gün ✱) bankadaki K md 39 sorusunun cevabıyla aynıdır.
- **Yaşlar:** on iki, on beş, on sekiz. Üçü de bankada (K, Yakalama, TCK). Yaş değeri sorulmaz; yaş yalnız koşul olarak kökte durur (UY-p1 #1).
- "Yüzde elli" (ödenek) ESKİ.

### E2. Merciler ve en sık değerler (varsayılan cevap listesi)

| Aktör | TY | UY | Not |
|---|---|---|---|
| mahkeme veya çocuk hâkimi (birlikte) | 18 | 8 | TY'nin varsayılan mercii |
| çocuk hâkimi (her biçimde) | 22 | 12 | |
| Cumhuriyet savcısı / başsavcılığı | 7 | 46 | UY'nin varsayılan mercii |
| ASPB (TY) / SHÇEK (UY) | 38 | 12 | ad kuralı |
| kolluk, kolluğun çocuk birimi | 10 | 9 | |
| şube müdürlüğü, büro | 0 | 21 | ad kuralı |
| "derhâl / derhal" | 5 | 7 | varsayılan zaman |

- **Varsayılan cevaplar.** TY: "mahkeme veya çocuk hâkimi", "derhâl", "il müdürlüğü", "on gün", "üçer ay". UY: "Cumhuriyet savcısının talimatı", "Cumhuriyet başsavcılığı", "derhâl", "SHÇEK'e teslim ya da bildirim", "on gün".
- **Çiftler.**
  - çocuk hâkimi (soruşturma evresi, korunma ihtiyacı) ↔ kovuşturmayı yapan mahkeme (TY 8/3) ↔ aile mahkemesi (8/2, 8/10) ↔ çocuğun bulunduğu yer hâkimi (11/1);
  - kararı veren hâkim ↔ tedbiri yerine getirmekle sorumlu kurum (9/3) ↔ vali (20/3);
  - savcının talimatı (UY 16/5, 16/7) ↔ çocuk hâkiminin kararı (K 9 acil korunma; TY 22/3) ↔ çocuk biriminin kendiliğinden işlemi (16/7 ilk cümle);
  - Yakalama 19/a (kimlik tespiti, hemen serbest) ↔ UY 5/10 (soruşturma yapılabilir) ↔ TCK 31/1 (kovuşturma yapılamaz ⚑).
- **Aynı şık takımına girmeyenler:** "mahkeme" ile "çocuk hâkimi" (metin çoğu yerde seçimlik sayar; iki doğru doğar); "Cumhuriyet savcısı" ile "Cumhuriyet başsavcılığı"; "vali" ile "vali yardımcısı"; SHÇEK ile ASHB.

### E3. Ayırt etme malzemesi

- **Tedbir kararını kim alır** [K→K]
  - korunma ihtiyacı olan çocuk ve soruşturma evresindeki çocuk: çocuk hâkimi (TY 4/b, 8/1);
  - kovuşturma başlamışsa: kovuşturmayı yapan mahkeme (8/3);
  - çocuk mahkemesi yoksa: aile mahkemesi, o da yoksa asliye hukuk (8/2);
  - aile mahkemesi baktığı davayla ilgili (8/10);
  - kaldırmada acele hâl: çocuğun bulunduğu yer hâkimi; önceki karara bildirilir (11/1 ≡K).
  - Güçlü çeldirici: "çocuk hâkimi" (varsayılan).
- **Kararı veren ↔ uygulayan** [K→K]: tedbirin türünü ve gerekirse süresini hâkim belirler (8/13); nerede uygulanacağını, karar gönderildiği ilde uygulanamıyorsa sorumlu kurum belirler (9/3); karar idarenin hizmet sunumundaki takdirini kısıtlamamaya özen gösterir (8/14); uygulama plânı hâkimin onayına sunulur (18/1). Eksik bilen aday bütün kararları hâkime verir.
- **On iki yaşından küçük çocuk** ◆ [K→K]: suç nedeniyle yakalanamaz, kimlik ve suç tespiti için yakalanabilir, hemen serbest bırakılır (Yakalama 19/a; bankada 2) ↔ fiil hakkında delil toplamak ve başka fail bulunup bulunmadığını belirlemek için soruşturma yapılabilir (UY 5/10) ↔ çocuklara özgü güvenlik tedbiri (TY 8/5). Eksik bilen aday "soruşturma yapılmaz" der.
- **Çocuğun teslimi** ◆: aileye teslim (K 5/3) ↔ yakını bulunamaz ya da yakınından şüphe edilirse savcının talimatıyla kuruma (UY 16/5) ↔ beklemek yararına aykırıysa en kısa sürede kuruma (16/7 ≡K 31/5) ↔ suç mağduru çocukta savcının talimatı doğrultusunda (16/7 son cümle) ↔ acil korunma kararını sonradan çocuk hâkimi verir (K 9). Savcı teslimde, hâkim kararda görünür.
- **SİR ↔ kusur yeteneği** [K→K]: rapor tedbir, denetim, süre ve tedavi önerir (21/1 c–e); kusur yeteneği hakkında sonuç değerlendirmesinde bulunmaz (21/2); mahkemenin takdirinde göz önünde bulundurulur (21/3 ≡K 35/1); takdir yalnız mahkemenindir (20/3). Eksik bilen aday "uzman rapor kararı verir" der.
- **Giderler:** genel kural tedbiri yerine getiren kurum (TY 27) ↔ sağlık kontrolü ve tedavi giderleri Sağlık Bakanlığı (14/6, 15/5) ↔ K 43 "Devletçe ödenir". Düşük değer; yalnız yanlış önerme malzemesi.

### E4. Ters ayırt etme tablosu

| Sezgi | Doğruya götürdüğü yer → karar | Yanlışa götürdüğü yer (lehte) |
|---|---|---|
| "Çocuğun yararı gözetilir" | TY 5, 8/12, 9/3'ün ölçütü → tek başına yazılmaz | — |
| "En hafif tedbir, aile yanında" | TY 8/12 ilk iki cümle → yazılmaz | 8/12 son cümle (iki okumalı; yine yazılmaz) |
| "Hâkim karar verir" | TY 7, 8/1, 10, 11, 22/3 → yazılmaz | TY 9/3 (#1); UY 16/5 (#2) |
| "Çocuk işine çocuk hâkimi bakar" | TY 8/1 → yazılmaz | TY 8/3 (#2) |
| "Adli işte savcının talimatı alınır" | UY 16/5, 16/7 → doğrudan merci sorusu yazılmaz | TY 22/4 (hâkime bilgi verilir) |
| "Derhâl bildirilir, derhâl teslim edilir" | UY 16/3, 16/6; TY 22/2, 22/4 → zaman sorusu yazılmaz | — |
| "Sosyal hizmetlere bildirilir ya da teslim edilir" | UY 16/5–7; TY 6/1 → yazılmaz | — |
| "Ceza sorumluluğu yoksa soruşturma da yoktur" | — | UY 5/10 (#1) |
| "Küçük çocuk yakalanmaz" | Yakalama 19/a-1 (bankada) | 19/a-2 ve UY 5/10 |
| "Uzman raporu yeteneği belirler" | — | UY 21/2 (#3) |
| "Rapor yalnız tespit yapar, süre ve tedbir önermez" | — | UY 21/1 c–d (#3 çeldiricileri) |
| "Çocuk yetişkinden ayrı tutulur" | UY 6, 16/2 → yazılmaz | — |
| "Kelepçe takılmaz" | UY 8 (bankada) | — |
| "Çocuğa ait bilgi gizlidir" | TY 26; UY 22 → yazılmaz | — |
| "Teslimden önce sağlık kontrolü" | TY 14/4, 15/3 → tek başına yazılmaz | — |
| "Kaçan çocuk kolluğa bildirilir" | TY 22/4 → tek başına yazılmaz | — |
| "Tedbir kararı hemen uygulanır" | TY 9/2 → yazılmaz | — |
| "Meslek sırrı her zaman korunur" | UY 19/4 son cümle → yazılırsa kolay | — |
| "On sekiz yaşında tedbir biter" | TY 11/3 (bankada) | — |
| "Çalışma yaşı on beştir" | TY 13/5–6 → yazılmaz | — |

---

## F. Kaçınılacaklar (BAĞLAYICI) ve parti önerisi

### F1. Kaçınılacaklar

- **Eskimiş hükümler:** A4'teki E1–E25'in tamamı. Özellikle:
  - sosyal incelemenin zorunlu olduğu yaş grubu (TY 8/11; UY 20/2, 20/7) ve 20/4;
  - SÇG'nin tanımı, atanması ve ödeneği (TY 4/e, 28; UY 4/f, 17/1, 17/8–9);
  - KDAE ve HAGB usulü, talî karar fişi, on günlük başvuru bildirimi (UY 23/1-b, 24/2, 26, 27, 38/1);
  - denetimli serbestlik birimleri ve mülga yönetmelik (UY 4/g–i, 12, 24, 31, 33, 34);
  - koordinasyon toplantıları ve müsteşarlar (TY 19–21);
  - "Bunlar hakkında bilirkişilere ilişkin hükümler uygulanır" cümlesi (UY 5/7, 13/6);
  - yaş düzeltme (UY 5/11).
- **Ad:** A5'in on kuralı.
- **Kanunun ya da CMK'nın aynası:** B1 ve B2 tabloları. Yönetmelik adıyla sorulmaz; Kanun adıyla da bu turda sorulmaz (5395 partisi değildir).
- **Bankada ölçülmüş:** C tablosu. Değerleri açıklamada da içerikle yazılmaz: beş, üç ve otuz gün ([152]); on gün (K md 39); üçer ay (K md 8); on iki ve on beş yaş (Yakalama, [162]); çocuk hâkiminin tanımı; SÇG ve denetim görevlisi görev listeleri.
- **Varsayılan cevaplı ya da tek başına sezgiyle bulunan sorular:** E4 tablosunun orta sütunu. Ayrıca yürütme, yürürlük, dayanak, defter, karton, elektronik kayıt, eğitim, yönetmelik çıkarma.
- **İki okumalı:**
  - TY 8/12 son cümle (kurumda bakımın "öncelikle değerlendirilmesi") ile K 4/j ("son çare");
  - TY 14/4 ve 15/3'te başvuruyu kimin yapacağı (edilgen cümle) ve K 9/4 ile ilişkisi;
  - TY 16/4 (sağlık kurulu raporu) ile K 9/4; TY 16/13 (tedavide çocuğun rızası aranmaz);
  - TY 22/3: hâkim kararı kolluk yardımının şartı mıdır (K 45/3 ve bankadaki vaka aksini söyler);
  - TY'de "Kurum" sözcüğünün kimi gösterdiği;
  - UY 16/7 son cümlenin karşıt anlamı (suç mağduru olmayan çocukta savcının talimatı aranmaz mı). Terk edilen ya da ihmal edilen çocuk da çoğu kez suç mağdurudur; ayrım vakayla kurulamaz;
  - UY 5/10 ile Yakalama 19/a-1 ("hiçbir suretle suç tespitinde kullanılamaz") ilişkisi: #1 çocuğun kendisinin işlemde kullanılmasını sormaz;
  - UY 5/11 ile CMK 218/2; UY 22/2 son cümle ile K 41/2;
  - UY 13/2'deki "onsekiz yaşını doldurmuş çocuk".
- **Metin dışı (⚑):** kurumların bugünkü adları ve teşkilatı; çocuk izlem merkezleri, adli görüşme odaları (CMK 236/4–8); çocuk destek merkezleri; TCK 31'in indirim oranları; uzlaştırma; 2828 sayılı Kanun; Danışmanlık Tedbiri Tebliği (2026); 5/A'nın öngördüğü yeni yönetmelik; "çocuk polisi", "çocuk şube müdürlüğü" adları (metin "kolluğun çocuk birimi" der).
- **Yokluktan yargı kurulmaz.** "Yönetmelikte sağlık kurumunun başvurusu yoktur", "savcının talimatı aranmaz" gibi yargılar ne doğru şık ne açıklama olur.

### F2. Parti önerisi: `tedbir-yon-p1` (en çok 3; önerilen 2)

| # | Hüküm | Açı / kök | Zorluk | Çeldirici kaynağı | Bilinen risk |
|---|---|---|---|---|---|
| 1 | 9/3 (+8/13, 8/14) | Tedbir kararı, gönderildiği ildeki kurum ve kuruluşlarca yerine getirilemiyor; tedbirin nerede yerine getirileceğine kim karar verir [K→K] M. Doğrudan kök. Doğru: tedbir kararını yerine getirmekle sorumlu kurum. | orta/zor | kararı veren mahkeme ya da çocuk hâkimi (varsayılan; 9/3'ün ilk cümlesi); çocuğun bulunduğu yer hâkimi (11/1); vali (20/3); Cumhuriyet savcısı (UY aktarımı; sağduyuyla elenen tek şık) | Kolluk bağı yok; `sinavDegeri` 3'te kalabilir. Doğru şık şıklardaki tek "idare" olur: "hâkim olmayan tek şık" kestirmesi vali ile kırılır. "Mahkeme" ve "çocuk hâkimi" ayrı şık olmaz. Kurum adı yazılmaz. |
| 2 | 8/3 ↔ 8/1, 8/2, 8/10, 11/1 | Hakkında kovuşturma başlatılmış çocuk için koruyucu ve destekleyici tedbir kararını kim alır [K→K] M, A. Doğrudan kök. Doğru: kovuşturmanın yapıldığı mahkeme. | orta | çocuk hâkimi (varsayılan); aile mahkemesi (8/2, 8/10); çocuğun bulunduğu yer hâkimi (11/1); en yakın çocuk mahkemesi (K 14 itiraz mercii) | Kanundan da çıkarılabilir (K 3/c "hariç" + K 26/3); açık cümle yalnız yönetmeliktedir. Gözcü "Kanunla çözülüyor" derse RED (22 Kas kural 4). Bankadaki çocuk hâkimi tanımı sorusu "hariç" kaydını verir, mercii vermez; açıklama tanımı içerikle yazmaz. |

- **Yedek** (değer sırasıyla):
  - ◆ **22/4** “çocuğun kuruluştan izinsiz ayrılması” (tırnaklı başlık); YANLIŞTIR. Yanlış önerme rol değişimiyle: "durum hakkında ayrıca Cumhuriyet savcısına bilgi verilir" (metin: mahkemeye ya da çocuk hâkimine). Doğru önermeler: tutanak tutulur; durum en seri iletişim araçlarıyla kolluk birimine bildirilir; bildirim en kısa sürede yazılı hâle getirilir; yakalanan çocuk ilgili kuruma teslim edilir (22/3). Risk: ilk üç önerme sıra oluşturur (19 Kas kuralı); "tutanak" ve "yazılı bildirim" birlikte doğru sayılır. Sıra kırılamıyorsa yazılmaz.
  - **18/13 + 14/6 ↔ 27** “tedbir kararlarının uygulanması”; YANLIŞTIR. Yanlış önerme: "sağlık kontrolü ve tedaviden doğan giderleri tedbiri uygulayan kurum karşılar" (gerçek: Sağlık Bakanlığı; md 27 genel kuralından aktarım). Doğru önermeler: ceza infaz kurumlarına görev yüklenemez (18/13); karar kesinleşmesi beklenmeksizin uygulanır (9/2); uygulama plânı hâkimin onayına sunulur (18/1); rehabilitasyon ihtiyacı olan çocuk öbür çocuklarla aynı ortamda bakılmaz (14/2). Risk: gider konusu düşük değer; "Sağlık Bakanlığı" bir bakanlık adıdır ama eski ad değildir.
  - **18/1** süre ✱ (en geç on gün). Zayıf: değer K md 39 sorusunun cevabıyla aynı; kolluk bağı yok.
- **Dışarıda:** md 1–7; 8/1–2, 8/4–9, 8/11–15; 9/1; 10–17; 18/2–12, 18/14; 19–21; 22/1–3; 23–31.
- **Kök tipi (2 soru):** doğrudan 2, ikisi de koşul→kural ve merci. Merci oranı partide %100 olur; iki parti birlikte değerlendirilir (5 soruda merci 2). Yedek yazılırsa olumsuz kök 1.
- **Parti içi sızıntı:** #1 ↔ #2: ikisinin şık takımında "çocuğun bulunduğu yer hâkimi" ortak çeldiricidir; aynı kısa denemeye konmaz. #1'in açıklaması 8/3'ü, #2'nin açıklaması 9/3'ü anmaz. Yedek 22/4 yazılırsa #1 ve #2'deki "Cumhuriyet savcısı" çeldiricisi 22/4'ün yanlış önermesini işaret eder: #1'de savcı yerine başka bir sağduyu şıkkı kullanılır.
- **Kestirmesiz üçüncü bir TY sorusu yok.** #2 de düşerse parti tek soruyla kapanır; #1 de `sinavDegeri` 3'ün altında kalırsa **parti boş kalır.** Yönetmelik sorusuz değildir: bankada 6 soru var.

### F3. Parti önerisi: `cocuk-uyg-p1` (en çok 4; önerilen 3)

| # | Hüküm | Açı / kök | Zorluk | Çeldirici kaynağı | Bilinen risk |
|---|---|---|---|---|---|
| 1 | ◆ 5/10 ↔ Yakalama 19/a | Fiili işlediği sırada on iki yaşından küçük olan çocuğun işlediği iddia olunan suçla ilgili soruşturma hangi amaçla yapılabilir [K→K] K, A. Doğrudan kök. Doğru: delillerin toplanması ya da başka fail bulunup bulunmadığının belirlenmesi. | orta/zor | "soruşturma yapılamaz; yalnız kimlik tespit edilir" (Yakalama 19/a; "sorumluluk yoksa soruşturma yok" sezgisi); "çocuğun fiilin anlamını algılama yeteneğinin belirlenmesi" (12–15 yaş rejimi); "çocuk hakkında kamu davası açılması"; "çocuğun gözaltına alınarak ifadesinin alınması" | TCK md 31'in güncel metni bu turda okunmadı: üretici on iki yaş eşiğini bankadaki TCK metninden doğrular. "Sağır ve dilsiz" kaydı yazılmaz. Açıklama Yakalama 19/a'nın kuralını (hemen serbest bırakma) içerikle yazmaz. "Çocuk suç tespitinde kullanılamaz" (19/a-1) şık olmaz: doğrudur. Kök "yapılabilir" kipini korur. |
| 2 | ◆ 16/2, 16/4, 16/5, 16/6 ↔ K 9 | “kolluğun çocuk birimi” (tırnaklı başlık); YANLIŞTIR. Yanlış önerme 16/5'ten, merci değiştirilerek: "aileye teslimi gereken çocuğun yakınları bulunamazsa çocuk, çocuk hâkiminin kararı alınarak kuruma teslim edilir" (gerçek: Cumhuriyet savcısının talimatı). | orta | Doğru önermeler, hepsi yönetmeliğe özgü ve sıra oluşturmayan: işlemler sırasında kolluk birimindeki yetişkinlerle karşılaşması engellenir (16/2); yararı aksini gerektirmedikçe yanında bir yakınının devamlı bulunmasına imkân sağlanır (16/4); çocuğu suça azmettirdiğinden şüphelenilen yakını yanında bulundurulmaz (16/4); teslim edilen çocuğun yeterince gözetilmediği öğrenilirse durum ilgili kuruma derhâl bildirilir (16/6) | Doğru önermeler sezgiyle doğrulanır; soru yanlış önermeyi tanımaya dayanır. Varsayılan (çocuk hâkimi) yanlış önermeye bağlandığı için "hâkim karar verir" sezgisi adayı yanıltır; polis adayının "savcı" refleksi ise yardım eder. Taze kör çözücüde salt şıkla bulunuyorsa RED. Kurum adı yazılmaz ("ilgili kuruma"); zorunluysa A5 kural 3. "Suça sürüklenen çocuk" yazılmaz. K 31/2'nin bildirim listesi önerme olmaz (≡K). |
| 3 | 21/2 ↔ 21/1, 21/3, 20/3 | Sosyal inceleme raporunda, çocuğun işlediği fiilin hukuki anlam ve sonuçlarını algılama ve davranışlarını yönlendirme yeteneğiyle ilgili hangi kural geçerlidir [K→K] İ, A. Doğrudan kök. Doğru: bu yeteneğin bulunup bulunmadığı hakkında sonuç değerlendirmesinde bulunulmaz. | orta | "yeteneğin bulunup bulunmadığı raporun sonuç bölümünde belirtilir" (sezgi); "değerlendirme yalnız mahkemenin açık talebi üzerine yapılır"; "değerlendirmeyi rapora eklenen adlî tıp görüşü karşılar" (20/4 aktarımı); "rapor bu konuda tedbir de öneremez" (21/1-c'nin tersi) | Bankadaki K md 35 boşluk sorusu "mahkemenin takdirinde göz önünde bulundurulur" cümlesini verir; cevabı vermez, çıkarımı kolaylaştırır. Kolluk bağı zayıf. E4 ve E5 nedeniyle yaş grubu, "zorunlu" sözcüğü ve 20/4'ün koşulu şıkka ve açıklamaya girmez; 20/4 çeldiricisi gözcüde takılırsa "raporu düzenleyen uzman duruşmada dinlenerek belirler" ile değiştirilir (TY 18/12 aktarımı). Olumsuz biçim ("raporda hangisine yer verilmez") de kurulabilir; o zaman partide iki olumsuz kök olur. |

- **Yedek** (değer sırasıyla):
  - **19/4 son cümle:** SÇG'nin istediği bilgi ve belgeyi ilgililer vermek zorundadır; meslek sırrı kapsamındaki bilgiler istisnadır. İ açısı. "Meslek sırrı korunur" sezgisiyle bulunur; ancak şık takımı sezgiyi bölerse yazılır ("çocuğun yararı gerektiriyorsa meslek sırrı da verilir" güçlü çeldirici). İlk cümledeki kurum listesi (SHÇEK dâhil) şıkka girmez.
  - **28/5:** çocuklar hakkındaki denetimli serbestlik kararlarının infazına başlama tarihi denetim plânının hâkimce onaylandığı tarihtir. Sn. Düşük değer; E11'e komşu.
  - **5/3:** yargı çevresi farklıysa soruşturma evrakı fezlekeyle öbür Cumhuriyet başsavcılığına gönderilir. Usul; düşük değer.
- **Dışarıda:** md 1–4; 5/1–9, 5/11; 6–15; 16/1, 16/3, 16/7; 17–18; 19/1–3; 20; 21/1 ve 21/3 (tek başına); 22–27; 28/1–4; 29–42.
- **Kök tipi (3 soru):** doğrudan 2 (1, 3), olumsuz 1 (2). Koşul→kural 3/3; ayırt etme 2/3 (1, 3). Vaka, öncüllü, boşluk ve "doğrudur" yok.
- **Zorluk:** orta 2 (2, 3), orta/zor 1 (1). Kolay yuva yok; kolay soru üretmek için sezgiyle bulunan bir hüküm seçilmez.
- **Parti içi sızıntı:** #1 ↔ #2: #2'nin önermelerinde yaş ve soruşturma geçmez. #2 ↔ #3: temas yok. #1 ↔ #3: #1'deki "algılama yeteneğinin belirlenmesi" çeldiricisi #3'ün konusuna değer; #3'ün açıklaması yaş grubu yazmaz (E4). Üçü aynı kısa denemeye konabilir; #1 ve #3 art arda gelmez.
- **Kestirmesiz dördüncü bir UY sorusu yalnız 19/4'tür** ve zayıftır.

### F4. İki parti arası temas

| Ortak içerik | TY | UY | Karar |
|---|---|---|---|
| tanımlar; "suça sürüklenen çocuk" | md 4 | md 4 | hiçbir partide (E1, E3) |
| sosyal incelemenin zorunluluğu | 8/11 | 20/2 | hiçbir partide (E4) |
| SÇG görevlendirme zinciri ve ücret | 18/7–11 | 17/3–7 | kelimesi kelimesine ikiz; hiçbir partide |
| ödenek | md 28 | 17/9 | hiçbir partide (E7) |
| SİR'in talep yazısına eklenmesi | 6/7 | 5/8, 17/2 | hiçbir partide |
| denetim altına alma | 8/15 | md 23–35 | UY'nin konusu; yuva yok |
| elektronik kayıt | md 29 | md 40 | hiçbir partide |
| tedbir kararını kimin alacağı | 8/1–3 (**TY #2**) | 4/b; 5/8 son cümle | TY'de kalır. UY partisi bu merciyi sormaz; UY #2'nin yanlış önermesindeki "çocuk hâkiminin kararı" TY #2'nin çeldiricisiyle aynı aktördür, cevabını vermez |
| çocuğun kuruma teslimi | 14/4, 22/2–3 | 16/5–7 (**UY #2**) | UY'de kalır. TY yedeği 22/4 yazılırsa "savcı" bir partide doğru aktör, öbüründe yanlış aktör olur: iki soru aynı kısa denemeye konmaz; açıklamalar öbür hükmün aktörünü yazmaz |
| SİR | 18/2 (plânda yararlanılabilir) | md 20–22 (**UY #3**) | UY'de kalır |

Her parti doğru cevabı yalnız kendi yönetmeliğinden kurar. Öbür yönetmeliğin, Kanunun, CMK'nın ve Yakalama Yönetmeliğinin hükmü yalnız çeldirici olur ve bankadaki bir sorunun cevabını vermez.

---

## G. Kök kısa adı

- **Resmî sorular tam adı kullanıyor** (7/7): "Çocuk Koruma Kanununa Göre Verilen Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik’e göre," ([152], [153]); aynı ad + "Yönetmelik’inde," ([158], [161]); "Çocuk Koruma Kanununun Uygulanmasına İlişkin Usûl ve Esaslar Hakkında Yönetmelik’e göre," ([159], [348], [349]). Bankadaki iki soru "… Yönetmelik kapsamında," der. Tam ad tek başına 122 ve 85 karakterdir; kök ölçüsünü (130–250) tek başına doldurur.
- **Öneri (karar kullanıcıda):**
  - UY: **"Çocuk Koruma Kanunu Uygulama Yönetmeliği'ne göre,"** (bankanın konu adı; 6284 Uygulama Yönetmeliği emsali).
  - TY: **"Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik'e göre,"** (resmî adın ayırt edici yarısı). Daha kısası ("Tedbir Kararları Yönetmeliği") resmî adda yoktur ve UY ile karışır.
- TY sorularında kök uzunluğu tavanı 250 yerine 300 karakter sayılır.
- Kökte "5395 sayılı Kanun'a göre" yazılmaz: aynı bilgi Kanunda yoktur ya da farklıdır (TY 6/1 muhtar örneği).
- Madde, fıkra ve bent numarası yazılmaz. Tırnaklı başlıklar resmî madde başlıklarından alınabilir (banka metninde yok; A1'deki indirilen metinde var): “Kolluğun çocuk birimi”, “Sosyal inceleme raporları”, “Tedbir kararlarının kaydı ve işlemlerin başlatılması”, “Koruyucu ve destekleyici tedbir kararlarının gönderilmesi”.

---

## §8 İki yönetmeliğe özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız yönetmeliğin madde gövdesinden kurulur ve A4'teki E1–E25'in hiçbirine dayanmaz. Şerhler ve md 31'in dipnotu metin değildir. Bir hüküm Kanunun güncel metniyle çelişiyorsa soru yazılmaz; "yönetmelik öyle diyor" savunması geçmez. Üretici her yuvayı `mevzuat/5395.txt` ile yan yana okur.
2. **Ayna yasağı.** Ölçülen bilgi Kanunda ya da CMK'da aynı cümleyle duruyorsa soru yazılmaz (B tabloları). Doğru şık ya da yanlış önerme yönetmeliğe özgü unsurdan gelir.
3. **Ad.** A5'in on kuralı. Kurum adı ölçülen unsur olmaz; iki terim de yazılmaz.
4. **Sayı ve süre.** Süre sorusu kurulmaz (E1). Yaş yalnız koşul olarak kökte durur. Açıklama bankadaki değerleri yazmaz.
5. **Varsayılan.** TY'de "mahkeme veya çocuk hâkimi", UY'de "Cumhuriyet savcısı" varsayılandır. Doğru şık varsayılanla örtüşüyorsa soru yazılmaz; varsayılan yalnız çeldiricide ya da yanlış önermede durur (TY #1, #2; UY #2).
6. **Ters ayırt etme yasağı.** E4 tablosu. Sezgiyi yanlışa götüren hüküm soru lehinedir; doğruya götüren hüküm ancak doğru önerme olur.
7. **Koşul → kural.** Eksen örnekleri: evre (soruşturma, kovuşturma) → tedbir mercii; kararın uygulanamaması → yeri belirleyen; yaş grubu → soruşturmanın amacı; raporun konusu → yazılabilen ve yazılamayan.
8. **Çakışma.** C tablosu ve iki `-cakisma` dosyası. Yeni soru şunları ad değiştirerek sormaz ve onların cevabıyla çözülmez: [152]–[163], [348], [349]; K md 3, 5, 6, 7, 8, 9, 13, 14–18, 20, 21, 30, 31, 33–35, 39–41, 45; Yakalama md 19; CMK'daki çocuk muhakemesi ve mağdur çocuk soruları; 7593 güncel sorusu.
9. **İki okumalı hükümler** (F1) doğru şıkta, çeldiricide ve açıklamada kullanılmaz.
10. **Vaka.** Bu iki partide vaka önerilmez. Yazılırsa 1–2 cümle, en çok 250 karakter, unvanlı; çocuğun yaşı ve evre açık yazılır; kurum adı ve iki terim yazılmaz; yabancı uyruklu çocuk (6458), aile içi şiddet (6284) ve kayıp çocuk (PVSK 13/A) vakası kurulmaz.
11. **Liste soruları.** UY 21/1 açık uçludur ("tamamına veya bir kısmına"); "sayılmamıştır" sorusu ancak 21/2'nin açık yasağıyla kurulur. TY 6/1 ("haberdar olanlar") ve TY 20/1 listeleri sorulmaz.
12. **Biçim ve sızıntı.** Kök G'deki adla açılır. Doğru şık kısa olur. Yönetmeliğin kendi mutlak ifadesi doğru şıkta durabilir: "bulunulmaz" (21/2), "yüklenemez" (TY 18/13), "bulundurulmaz" (16/4). Açıklama: yönetmelik hükmünü kısa alıntıyla verir; Kanunla farkı içerikle anlatmaz; eski hükme, kurumun bugünkü adına, "tek istisna" türü genellemeye yer vermez; başka sorunun cevabını yazmaz.
13. **Dil.**

    | Metindeki ifade | Kök ve şıkta | Kural |
    |---|---|---|
    | kolluğun çocuk birimi; kolluk görevlisi | korunur | "çocuk polisi", "çocuk şube" YASAK ⚑ |
    | veli, vasi, kanunî temsilci, bakımını üstlenen kimse | "yakınları" yalnız metnin "yakın" dediği yerde (16/4) | 16/5'te teslim edilecek kişiler "yakın" diye daraltılmaz |
    | Cumhuriyet savcısının talimatını alarak (16/5) · talimatı doğrultusunda (16/7) | korunur | "emriyle", "izniyle", "kararıyla" yazılmaz |
    | teslim edemez (16/5) | korunur | "teslim etmeyebilir" YASAK (takdir doğar) |
    | imkân sağlanır (16/4) | korunur | "bulundurulur" YASAK (zorunluluk doğar) |
    | soruşturma yapılabilir (5/10) | korunur | "yapılır" YASAK |
    | sonuç değerlendirmesinde bulunulmaz (21/2) | korunur | "rapora yazılmaz" olabilir; "incelenmez" YASAK (rapor bulguyu yazar, sonucu yazmaz) |
    | karar verilir (9/3) | korunur | "önerir", "talep eder" YASAK |
    | hukukî anlam ve sonuçlarını algılama; davranışlarını yönlendirme yeteneği | korunur | "farik ve mümeyyiz", "temyiz kudreti" yazılmaz; "kusur yeteneği" yalnız 20/3'ün bağlamında |
    | tretman (21/1-e) | "iyileştirme" | — |
    | psiko-sosyal, sosyal inceleme raporu, denetim plânı, uygulama plânı | korunur | "plân" bankanın yazımıyla ("plan") yazılabilir; partide tek yazım |
    | mahkeme veya çocuk hâkimi | seçimlik "veya" korunur | iki ayrı şık YASAK |

### Gözcü kontrol listesi

1. **Güncellik (mevzuat gözcüsü).** Doğru şık, çeldirici ya da açıklama E1–E25'ten birine dayanıyor mu? Özellikle: 12–15 yaş ve sağır-dilsiz için zorunlu sosyal inceleme; üç alanlı SÇG tanımı; "her mahkemeye atanır"; KDAE'de mahkeme kararı; talî karar fişi; şube müdürlüğü; müsteşar; yüzde elli ödenek; "bilirkişilere ilişkin hükümler uygulanır". Hüküm `mevzuat/5395.txt` ile yan yana okundu mu?
2. **Ad.** Şıklarda ASPB, müsteşar, şube müdürlüğü ya da büro var mı (RED)? SHÇEK ile ASHB aynı takımda mı? Doğru şık bir kurum adı mı? Kökte ya da şıkta "suça sürüklenen çocuk" ya da "adli süreçteki çocuk" geçiyor mu?
3. **Ayna.** Soru Kanunun ya da CMK'nın cümlesiyle de çözülüyor mu? Yönetmeliğe özgü unsur şık takımında sınanıyor mu?
4. **Kör çözüm.** Doğru şık bir varsayılanla mı bulunuyor: çocuk hâkimi, savcının talimatı, derhâl, sosyal hizmetler, on gün, üçer ay? E4'teki sezgilerden biriyle mi? Kök cevabı çağırıyor mu ("kovuşturma" → "mahkeme" yankısı TY #2'de kökten kaçınılmazdır; şıklardan en az ikisi "mahkeme" sözcüğü taşır)?
5. **Ters ayırt etme.** Kanunu, Yakalama Yönetmeliğini ya da bankadaki K md 35 sorusunu bilen eksik aday yanılıyor, hiç bilmeyen aday buluyor mu? Taze kör çözücünün kestirmeleri yanlış şıkka gidiyorsa soru lehine kanıttır.
6. **Mükerrer ve çakışma.** C tablosu, `-benzer.txt`, iki `-cakisma` dosyası. Özellikle: TY 6/1'de "muhtar" bankadaki K md 6 sorusuyla çatışıyor mu; TY 22/3 bankadaki K md 45 vakasıyla çatışıyor mu; UY #1 Yakalama md 19 sorularının cevabını veriyor mu; UY #3 K md 35 boşluk sorusuyla aynı cümleyi mi ölçüyor.
7. **İki okumalı.** F1'deki bir unsur doğru şıkta, çeldiricide ya da açıklamada mı?
8. **Şık takımı.** "Mahkeme" ile "çocuk hâkimi" ayrı şıklarda mı (RED)? İki yanlış şık aynı temayı mı taşıyor? Doğru şıkkın iki yanında bir eksenin iki ucu mu var? YANLIŞTIR sorusunda doğru önermeler sıra oluşturuyor mu (tutanak → bildirim → yazılı bildirim)? Yanlış önerme bir doğru önermeyle çelişiyor mu?
9. **Sınav değeri.** `sinavDegeri` en çok 2: tanımlar, dayanak, yürütme, defter ve karton, elektronik kayıt, eğitim maddeleri, koordinasyon toplantısının üyeleri ve gündem süresi, ödenek, giderler tek başına, danışmanlık ve eğitim tedbirinin ayrıntısı, birleştirme usulü, fezleke. RED: kurum adını soran merci sorusu; süre sorusu; SÇG ve denetim görevlisi görev listesi; mağdur çocuğun dinlenmesi; tek başına 16/3, 16/7, 22/2, 9/2.
10. **Parti oranları.** İki parti birlikte değerlendirilir (5 soru): koşul→kural en az 1/4; ayırt etme en az 1/10; olumsuz kök en çok 1/4 (önerilen düzende 1/5); merci en çok 2/5; vaka, öncüllü, boşluk ve "doğrudur" en çok birer tane; uydurma değer en çok bir. Üst sınırlar: TY en çok 3 (önerilen 2), UY en çok 4 (önerilen 3). Sınav değeri taşımayan yuva boş kalır; 0 soru geçerli bir sonuçtur.

---

## H. Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

**Banka metni: iki yönetmelik**
1. **TY md 31 (banka):** RG dipnotu madde gövdesinde ("__________" ve "(1) 23/5/2012 tarihli … metne işlenmiştir."). Çıkarılmalı.
2. **TY (banka):** 27 değişiklik şerhi cümlelerin içine gömülü; kart ya da alıntıya aynen taşınırsa cümleyi böler. md 1, 12 ve 28'de "(1)" tek başına satırda.
3. **TY md 6, 7, 14, 15:** 2012 değişikliği "Kurum" sözcüklerini güncellememiş; md 7/1 "Çocuk Hizmetleri Genel Müdürlüğü" derken 7/2 "Kurum" diyor. md 4/ç'deki tanım bu kullanımı karşılamıyor. Resmî metnin kusuru.
4. **TY md 19/3:** "(Mülga ibare) (…)" ile bölünmüş cümle; müsteşar ve müsteşar yardımcıları 2018'den beri yok. md 3'ün dayanağı 633 sayılı KHK (kaldırıldığı doğrulanmadı).
5. **TY yazım kusurları (resmî metinde de):** md 13/6 "Türkiye İş Kurumuna Genel Müdürlüğüne"; md 8/1'de eksik virgül; md 9/3 "taktirde". Banka md 15/6 "müdürlükleri ," (boşluk).
6. **UY md 13/2:** "hükümde açık tefhim edilir" ("hüküm de" olmalı); "onsekiz yaşını doldurmuş çocuklar" tanımla çelişiyor. Bankadaki [159] ve [348] bu fıkrayı ölçüyor.
7. **UY md 22/2 (banka):** "psiko -sosyal" (resmî: "psiko-sosyal"). md 19/2-b virgülle bitiyor; md 27/2-b "yerine getirir".
8. **UY bütünüyle 2006 metni:** 12 yerde SHÇEK, 21 yerde "şube müdürlüğü" ya da "büro", 20 yerde "suça sürüklenen". Kanunla çelişen hükümler A4'tedir; en ağırı sosyal incelemenin zorunluluğu (20/2, 20/7; TY 8/11) ile KDAE ve HAGB usulüdür (md 26–27).
9. **UY 5/7 ve 13/6:** "Bunlar hakkında bilirkişilere ilişkin hükümler uygulanır" cümlesi CMK 236/3'te 2019'da kaldırılan cümleyle aynı yerde duruyor (içerik eşleşmesi doğrulanamadı). **UY 5/11** CMK 218/2 ile, **UY 24/5** K 37/2 ile ("iyi iletişim kurabilecek" ↔ "kolay ulaşabilecek") uyuşmuyor.
10. **Danıştay kararları taranmadı.** Resmî metinlerde iptal şerhi yok; bu, karar düzeyinde doğrulama değildir.

**Banka metni: 5395 (`mevzuat/5395.txt`)**
11. **Dipnot ve başlık artıkları gövdede:** md 3/c sonunda "3"; md 30/c'de "11"; md 32/2 "sağlanır.1"; md 33/1 ve 33/3 "…2"; **md 33/4'ün ortasında iki dipnotun tam metni**; md 41/2'nin sonunda "DÖRDÜNCÜ KISIM4 …" başlığı; **md 41/A/4'ün ortasında dipnot 4**; md 41/E/3 sonunda "kesindir.5" ve md 41/F başlığının parçası; md 41/F/2–3 arasında dipnot 5; md 41/H "belirlenir.6"; md 41/İ sonunda "BEŞİNCİ KISIM7"; md 43'ün sonunda dipnot 6 ve 7. Dosyanın bankadan ne zaman çıkarıldığı bilinmiyor; 20 Kas metin turundan sonra banka temizlenmişse dosya yenilenmeli.
12. **Kanunun kendi artıkları:** md 49/a "Suça sürüklenen" (7593 sonrası kalmış); md 36 "kararı onanan" (KDAE'de onama yok); md 26/1 "sulh ceza mahkemesi"; md 42 mülga 1086 sayılı Kanun, 2828'in ve 5402'nin eski adları; md 50 Bakanlar Kurulu; md 6, 7, 9, 10, 31, 37, 45, 47'de SHÇEK, 2021–2026 eklerinde ASHB; md 32/1 ve 37/1 "şube müdürlüğü", 20/3 "denetimli serbestlik müdürlüğü". **Kullanıcı kararı gerekir:** yönetmelik sorularında kurum hangi adla anılacak (A5 kural 3–4)?

**Bankadaki sorular**
13. **İnsan Hakları bankası, tanım sorusu** (çakışma dosyası; 4 şıklı): "5395 sayılı Kanun'da … şeklinde tanımlanan kavram" → doğru şık "Suça sürüklenen çocuk". Kanun bugün "adli süreçteki çocuk" der; bankadaki güncel soru da bunu ölçüyor. **Soru eskimiş görünüyor** (yayın durumu bu dosyadan anlaşılmıyor). 24 Eyl turunda gözden kaçmış olabilir. Ayrıca dört şıklı.
14. **`cocuk-uyg-mevcut` üç soru:** üçü de "Suça sürüklenen çocuk" terimini taşıyor (yönetmeliğin terimi; kök yönetmeliği andığı için hatasız, ama Kanunla uyumsuz). Birinci sorunun doğru şıkkı ile üçüncü sorunun D çeldiricisi aynı cümledir: iki soru birbirinin cevabını gösterir. Üçüncü soruda "merciye" yazımı (metin: "mercie"). "Sayılmamıştır" köklü soru resmî korpusta bulunamadı ([348] ve [349] bulundu); **kaynağı doğrulanamadı.**
15. **5395 bankasındaki iki TY sorusu** (merkezî sekretarya; bakım tedbiri kararının gönderileceği yer): kök "Yönetmelik kapsamında" der, şıklar "Aile ve Sosyal Hizmetler Bakanlığı" yazar. Yönetmelik metni "Aile ve Sosyal Politikalar Bakanlığı" der; ikinci soruda metindeki "il veya ilçe müdürlükleri" "il müdürlükleri"ne, "bölge müdürlükleri" "il müdürlükleri"ne dönmüş. Esasa etkisi yok; ad güncellemesi bilinçli mi, bilinmiyor. İki soru resmî korpusta yok; **kaynağı doğrulanamadı.**
16. **K md 6 sorusu:** "açıkça sayılmıştır" → sivil toplum kuruluşları; "muhtarlar" yanlış şık. Kanuna göre doğru. TY 6/1 ise muhtarları sayar; iki metin arasındaki bu fark aday için tuzaktır. Sorunun açıklaması yönetmeliği anıyorsa gözden geçirilmeli (açıklama bu turda görülmedi).
17. **CMK bankasında ikiz soru:** "Çocuk mağdurların dinlenmesi ile ilgili … yanlıştır" iki kez, tek sözcük farkıyla duruyor.
18. **[152], [158], [161]:** yönetmelik adıyla sorulmuş, ama ölçtükleri hüküm Kanunun aynası (K 9, K 5, K 45). Kusur değil; bu turdaki ayna yasağının gerekçesi.
19. **[159] ve [348]:** doğru önermeleri arasında "mağdur çocuğun dinlenmesinde uzman bulundurulur" var. CMK 236 2019'da genişledi (özel ortam, merkezler). Önerme hâlâ doğru; açıklamalar eski rejimi anlatıyorsa gözden geçirilmeli (açıklamalar bu turda görülmedi).
