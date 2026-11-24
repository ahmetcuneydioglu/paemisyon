# Kabahatler Kanunu: sınav ve kaynak analizi (5326)

Doc 39, 23 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/5326.txt` (53 madde başlığı: md 1–45, 42/A, 43/A, 43/B, 43/C, Ek 1, Geçici 1–3);
- `5326-mevcut-sorular.txt` (87), `5326-diger-konu-sorulari.txt` (15), `5326-cakisma-sorulari.txt` (228);
- komşu taban: `2559.txt` + `2559-mevcut-sorular.txt` (110), `2918.txt` + mevcut (14), `6136.txt` + mevcut (34), `1774.txt` + mevcut (11), `2911.txt`, `7201.txt`, `5395.txt` (md 7). `4207`, `4250`, `7258` metinleri bu klasörde yok; geçildi.
- `rapor/banka-kusur-6458-7201.md` ve `rapor/banka-kusur-ipc-5326-1774.md` (bankadaki İPC tablosu kökenli soruların denetimi; burada tekrarlanmaz, sonuçları kullanılır).

Resmî metin mevzuat.gov.tr'den 23 Kas 2026'da indirildi (scratchpad `5326/indirilen/5326-iframe.html`, `5326.pdf`, `5326.doc`; Word dosyasının son kayıt tarihi 20/8/2026). HTML düz metne çevrildi (`5326/resmi.txt`) ve banka metniyle madde madde, sözcük sözcük betikle karşılaştırıldı (`5326/betik/karsilastir.py`, `kontrol2.py`). Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz, bu kanuna uygulanır.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** kolluğun sahada uyguladığı hüküm. **sınır**: çakışma dosyasında başka bir kuralı ölçen, ama yeni soruya çeldirici ya da yasak sınırı veren soru. **TL**: değeri para tutarına dayanan hüküm.

## 0. Özet tablo

| Kanun | Resmî doğrudan soru | PAEM / Misyon | GYS / diğer | Bankada (konu) | Diğer konu: ilgili / metin dışı / ilgisiz | Çakışma: ilgili / sınır / ilgisiz | Asıl çakışma tabanı |
|---|---|---|---|---|---|---|---|
| 5326 | 13: [139]–[151] | PAEM 2 ([141], [142]; ikisi de 8. dönem) · Misyon 6 ([139], [140], [145]–[148]) | İçişleri GYS 3 ([149]–[151]; [149] = [150]) · hâkimlik 1 ([143]) · kaymakamlık 1 ([144]) | 87 (12 kayıt resmî korpusun kendisi: 13 resmî sorunun hepsi, [149] = [150] tek kayıt; 13'ü İPC tablosu kökenli "Özgün soru") | 7 / 3 / 5 | ≈13 / ≈21 / ≈194 | PVSK md 4/A (kimliği belirlenemeyen), md 5, 13, 14; 2918 Ek 3 (içtima), md 115 (tahsil); TCK md 2, 22, 31; 6222 md 23; 6458 md 102; 1774 Ek 1; 5395 md 7; güncel 43/C sorusu |

Çakışma sayımı: 228 sorunun 110'u konu başlığından ilgisizdir (İnkılap Tarihi 77, Genel Kültür 22, Silah Bilgisi 7, İnsan Hakları 4). Kalan 118 soru elle sınıflandı; sayılar yaklaşıktır.

- **Resmî soruların hepsi bilgi düzeyinde ve genel hükümlerde yoğun.** On üç sorunun on biri md 9–29 aralığındadır; özel kabahatlerden yalnız iki merci sorusu var (dilencilik, 112).
- **PAEM Kabahatler'i iki kez sordu, ikisi de 8. dönemde.** Biri özel kabahatte çift merci (öncüllü, [141]); öteki 2024'te değişen süre ([142]; cevap "on dört", yani 7499'un "iki hafta"sı; değişiklik sınavdan yedi hafta önce kabul edilmişti ve sınav günü henüz yürürlükte değildi). 9. ve 10. dönem sormadı. Çıkarım: PAEM bu kanunda (a) kolluğun yanındaki ikinci merciyi, (b) yeni değişen hükmü soruyor.
- **Banka dolu.** 87 soru md 2–43/B'nin hemen her maddesine en az bir kez değiyor. Merci ızgarasının 23 hücresinden 18'i ölçülmüş (§3).
- **Açık kalan gerçek boşluk tektir: md 43/C** (7593; 18/8/2026). Bankada yalnız yürürlük tarihini soran bir güncel soru var. PAEM'in [142] davranışı bu maddeyi en olası sınav konusu yapar.
- **Dürüst sayım.** Kestirmesiz, bankada ölçülmemiş ve sınav değeri taşıyan yuva sayısı **8**'dir (genel hükümler 5, özel kabahatler 3). Beklenen KABUL 4–6. Bundan fazlası ya bankayı yineler ya TL'ye ya da sağduyuya dayanır.
- **Metin.** Banka metni resmî metinle sözcük sözcük aynıdır; yalnız başlıklar ve dipnot işaretleri eksiktir. Dipnotların hepsi metne işlenmiş; AYM iptali (43/A/3) bankada da yazılı. Asıl tuzaklar dipnotta değil: TL tutarları, 43/C/1-a'nın yürürlük tarihi (1/12/2026) ve "sulh ceza mahkemesi" terimi.
- **Ters ayırt etme riski** (§5). Bilmeyen aday şu sezgilerle doğruyu bulur:
  - "idarî yaptırıma karşı sulh ceza hâkimliği, on beş gün";
  - "sokaktaki kabahate kolluk ceza yazar";
  - "elkoyan kolluk, mülkiyeti kamuya geçiren mülki amir";
  - "çocuğa ceza verilmez";
  - "suç varsa kabahat sorulmaz";
  - "yetkisiz mahkeme dosyayı yetkilisine gönderir";
  - "aralıklı cezada hâkim miktarı ayarlar";
  - "tüzel kişiye karar tebliğ edilir".

  Soru bu sezgileri kıran olguyla kurulur; kıramıyorsa yazılmaz.

**◆ Kolluğa doğrudan değen hükümler**

| Hüküm | Kolluk bağı | Bankada | Kullanım |
|---|---|---|---|
| md 32 | Emre aykırı davranış: cezayı emri veren makam verir; yalnız ilgili kanunda açık hüküm varsa | 2 soru + 1 eşleştirme | 5326-p2 #3 (emrin amaçları; yalnız bu unsur) |
| 33/2, 34/2 | İPC ve elkoyma kolluk (dilencilikte zabıta da); mülkiyet mülki amir (dilencilikte encümen de) | 9 soru | tükendi |
| md 35 | Sarhoşluk: kolluk; etkisi geçinceye kadar kontrol altında tutma | 4 soru | tükendi |
| 36/3, 37/2, 42/4 | kolluk veya belediye zabıta | 37 ve 42 ölçülmüş; 36/3 açık | 36/3 yazılmaz (varsayılan) |
| 39/2, 39/3 | özel toplu taşıma: ilk başvurulan kolluk; herkesin girebildiği özel bina: şikâyet üzerine en yakın kolluk | 3 soru | tükendi; ayrıca 4207 gölgesi (§8) |
| **40/1** | Kimliği ya da adresi bildirmeme: İPC'yi **soran görevli** verir | ölçülmemiş | 5326-p2 #1 |
| 40/2–3 | tutma, savcıya haber, gözaltı, tutuklama, derhal son verme | 5326'da 1; PVSK 4/A adıyla 1 (dört cümlesi doğru önerme) | tükendi |
| 41/7 | belediye sınırları dışında kolluk | 1–2 soru | tükendi |
| md 43 | yasak olmayan silahı görünür taşıma: kolluk | 3 soru (biri tartışmalı, §8) | yazılmaz |
| **43/C** | bıçak: İPC ve elkoyma kolluk; mülkiyet mülki amir; on beş yaşından küçük çocukta mülki amir çocuk hâkiminden tedbir ister | yalnız yürürlük tarihi (güncel) | 5326-p2 #2; yedek |
| 17/6 ilk cümle | cezayı veren görevli, ilgilinin rızasıyla tahsilatı derhal kendisi yapar | doğru önerme | sorulmaz |
| md 25, 26/2 | tutanağın unsurları; huzurda karar, bilgilendirme, imza, örnek | 2 soru | tükendi |
| 23/2–3 | savcının kabahat yetkisi (adli kolluğun getirdiği dosyada) | 23/3 ölçülmüş | 5326-p1 #5 (23/2) |

---

## Metnin durumu (BAĞLAYICI)

**Erişim ve karşılaştırma.** Resmî konsolide metne erişildi. Banka metni 53 madde başlığının 53'ünde resmî gövdeyle sözcük sözcük aynı çıktı. Fark yalnız şunlar: madde başlıklarının bir kısmı, kısım ve bölüm adları ve dipnot işaretleri ([1]–[13]) bankada yok; 42/A'da bir satır kırılması. Kesik, kaymış ya da eksik fıkra yok. Gövdeye karışmış dipnot artığı yok.

**Resmî değişiklik cetveli (sayfanın sonundaki liste, aynen):**

| Değiştiren | Madde | Yürürlük |
|---|---|---|
| 5328 | 44 | 31/3/2005 |
| 5348 | Ek 1 | 18/5/2005 |
| 5560 | 3, 17, 20, 27, 28, Geçici 1 | 19/12/2006 |
| 5918 | 43/A | 9/7/2009 |
| 6009 | 21 | 1/8/2010 |
| 6111 | 20 | 25/2/2011 |
| 6217 | 20, 28, 29, 31 | 14/4/2011 |
| 6352 | 43/B | 5/7/2012 |
| 7020 | 26 | 27/5/2017 |
| KHK 703 | 42/A | 9/7/2018 |
| 7196 | 34, 41 | 24/12/2019 |
| 7262 | 43/A | 31/12/2020 |
| 7417 | 17 | 5/7/2022 |
| 7445 | 43/A | 5/4/2023 |
| **AYM 18/1/2024, E. 2021/28, K. 2024/11** | 43/A | 3/4/2024 |
| **7499** | 28, 29 | 1/6/2024 |
| **7547** | 42/A | 16/5/2025 |
| **7593** | 43/C: (1)(a) bendi **1/12/2026**; öbür hükümleri 18/8/2026 | — |

- 2024–2026'da 5326'ya dokunan kanunlar: **7499, 7547, 7593**. Cetvelde 7531, 7550, 7571 yok; bu kanunlar 5326'yı değiştirmemiştir (cetvele göre).
- Cetveldeki tek AYM satırı 43/A'dır. "Yönünden" ya da ertelenmiş iptal kaydı yok.
- md 3'ün 5560 ile yeniden yazılmasının bir AYM iptalini izlediği bilgisi resmî sayfada yazmıyor: **doğrulanamadı**, kullanılmaz.

**Dipnotlar ve bugünkü metin**

| Hüküm | Resmî şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| 20/2 son cümle | [1]: 6217 "Ancak"tan sonra "89 uncu maddesi hariç olmak üzere" ekledi | bankada işlenmiş | Cümle bankada ölçülmüş. Sayılan kanunlardan 1111'in yürürlükte olup olmadığı ⚑; liste öğesi sorulmaz. |
| 28/9 | [2]: 5560 ekledi; eski (9) → (10) | bankada işlenmiş | 5326-p1 #4 |
| **28/10** | [3]: 6217 "İkibin" → "Üçbin". [4]: **7499 md 37 "Üçbin" → "Onbeşbin"** (1/6/2024) | "Onbeşbin Türk Lirası dahil" | TL eşiği: sorulmaz. "Üçbin" ve "ikibin" çeldirici bile olmaz (TL). |
| 29/1 | [5]: 6217 "yargı çevresinde yer aldığı ağır ceza mahkemesine" → "Ceza Muhakemesi Kanununa göre". [6]: **7499 "yedi gün" → "iki hafta"** | "en geç iki hafta" | Bankada iki kez. "Yedi gün" yalnız çeldirici olur; ama aynı kanunda yürürlükteki "yedi gün" de var (27/2) ✱. |
| 29/5 | 6217 ile değişik | ağır ceza mahkemesinin kararına CMK'ya göre itiraz | sorulmaz (itiraz mercii ⚑) |
| 31/1 | [7]: 6217 "kanun yoluna başvurulması" → "başvuru yolu" | harca tabi değil | bankada |
| 34/1 | [8]: 7196 "yüz" → "bin" | bin TL | TL; sorulmaz |
| 41/7, 41/9 | 7196: (7) değişik, (9) mülga | belediye içinde zabıta, dışında kolluk | Bankada. 2019 öncesi (9)'un içeriği sayfada yok: **doğrulanamadı**; çeldirici yapılmaz. |
| 17/6 | 7417 (5/7/2022): ikinci ve üçüncü cümle değişti, dördüncü cümle eklendi | bir ay; %25 indirim; ödeme kanun yolunu etkilemez | Bankada üç kez. 2022 öncesi lafız sayfada yok: **doğrulanamadı**; "dörtte üç" gibi eski ifade yazılmaz. |
| 21/4 | 6009 ile değişik | kesinleşmeyi izleyen takvim yılı başı | bankada |
| 26/4 | 7020 (2017) ek | elektronik tebliğ; beşinci günün sonu | Bankada. "Maliye Bakanlığı" eski ad; ölçülen unsur olmaz. |
| 27/5–8 | 5560 ek ya da değişik | bankadaki gibi | 27/5, 27/6, 27/8 bankada |
| 42/A | KHK 703 ekledi; **7547 (8/5/2025; 16/5/2025) başlığıyla birlikte değiştirdi** | iki fiil; il valileri; bir yıl içinde tekrarda iki katı | Bankada beş kez. 2025 öncesi lafız sayfada yok: **doğrulanamadı**; eski başlık ya da eski tutar çeldirici yapılmaz. |
| 43/A başlık ve (1) | [9]: 7262 alt bent (2) ekledi; "ikimilyon" → "elli milyon". [10]: 7445 "bir özel hukuk tüzel kişisinin" → "bir tüzel kişinin" | kamu tüzel kişileri de kapsamda | "Özel hukuk tüzel kişisi" yalnız çeldirici olur. Tutarlar TL. |
| **43/A (3)** | **AYM iptali** (18/1/2024; 3/4/2024) | fıkra yok; bankada iptal şerhi yazılı | Fıkranın içeriği sayfada yok. Soru, şık ve açıklamada "(3)" hakkında hiçbir şey yazılmaz. |
| **43/C (1)(a)** | [11]: "Bu bent 1/12/2026 tarihinde yürürlüğe girecektir." | ruhsatlı yerler dışında satış ve sergileme yasağı **bugün (23 Kas 2026) yürürlükte değil** | Bent (a) bu turda doğru şık, çeldirici ya da vaka olgusu olmaz. Yürürlük tarihi bankada güncel soruyla ölçülmüş. |
| 43/C öbür hükümleri | 7593 md 8; 18/8/2026 | yürürlükte | 5326-p2 #2, yedek |
| Geçici 1 | [12]: 5560 ekleme | "Yeni Türk Lirası" | sorulmaz |
| md 44 | [13]: 5328 "1 Nisan 2005" → "1 Haziran 2005" | | sorulmaz |
| md 45 | — | "Bakanlar Kurulu yürütür" (eski organ) | sorulmaz |
| md 32/3 | — | 765 sayılı TCK md 526'ya yollama | sorulmaz |
| **md 27, 28, Geçici 3** | — | metin "sulh ceza **mahkemesi**" der | Sulh ceza hâkimliği 5235'ten gelir ⚑. Resmî sorular üç biçimde yazmış: "mahkemesine (hâkimliğine)" [139], "mahkemesine" [149], "hâkimliği" [143]. Yeni soruda başvuru mercii zaten ölçülmez; anılması gerekirse "sulh ceza hâkimliği" yazılır. Mahkeme ile hâkimlik farkı hiçbir şıkta ayırt edici olmaz. |
| md 29/1 itiraz mercii | — | "Ceza Muhakemesi Kanununa göre itiraz" | İtirazı hangi merciin incelediği CMK'dadır ⚑ (7499 sonrası rejim **doğrulanamadı**). Sorulmaz. |
| başlıklar | Bankada md 1 ("Amaç ve kapsam") ve md 31 ("Masrafların ve vekalet ücretinin ödenmesi") başlıksız; kısım ve bölüm adları yok | Birinci Kısım Genel Hükümler (4 bölüm); İkinci Kısım Çeşitli Kabahatler (md 32 vd.) | Tırnaklı başlık resmî başlıktan alınabilir: “kabahatten dolayı sorumluluğun esasları” (İkinci Bölüm adı; [145], [151] kullandı). |

**Para tutarları.** İdarî para cezaları her takvim yılı başında yeniden değerleme oranında artırılır (17/7); metindeki TL sayısı uygulanan tutar değildir. **Hiçbir TL tutarı doğru şık, çeldirici ya da vaka olgusu olmaz.** Tutarların oranı da (ör. "on katı") kullanılmaz: küsur yuvarlaması oranı bozar.

| Tür | Hükümler |
|---|---|
| Maktu tutar | 32/1, 33/1, 34/1, 35, 36/1, 37/1, 38/1, 39/1–3, 40/1, 41/1, 41/3, 41/5, 41/6, 42/A/1–2, 43, 43/C/2 |
| Alt–üst sınır | 36/2, 38/2, 41/2, 41/4, 42/1, 43/A/1, 43/B |
| TL eşiği | 20/2 a–c (soruşturma zamanaşımı basamakları), 21/2 a–d (yerine getirme basamakları), 28/10 (kesinlik sınırı) |
| Değeri yalnız tutardan ibaret olan (başka sorulacak unsuru yok) | 20/2 a–c; 21/2 a–d; 28/10; 36/1; 41/1–3; 41/6'nın ceza kısmı; 43/A/1'in ceza aralığı; 43/C/2'nin iki tutarı |

- Eşiklerin (20/2, 21/2, 28/10) yeniden değerlemeye tabi olup olmadığı metinde yazmaz ⚑, **doğrulanamadı**. Bu yüzden eşiğe dayalı vaka da kurulmaz ("on bin TL ceza alan kişi…").
- Tutara dayanmayan nitel karşılaştırma ("alt ve üst sınırlı", "maktu", "iki katı", "menfaatin iki katından az olamaz") tutar değildir; kullanılabilir.

**Eski değerler: yalnız çeldirici olabilir, doğru şık olmaz**

| Eski değer | Yer | Not |
|---|---|---|
| yedi gün (itiraz) | 29/1, 7499 öncesi | 27/2'deki yedi gün yürürlükte ✱ |
| "yargı çevresinde yer aldığı ağır ceza mahkemesi" | 29/1 ve 29/5, 6217 öncesi | itiraz mercii zaten sorulmaz |
| "özel hukuk tüzel kişisi" | 43/A, 7445 öncesi | |
| "kanun yoluna başvurulması" | 31/1, 6217 öncesi | anlam farkı yok; kullanılmaz |
| "Bakanlar Kurulu", "Maliye Bakanlığı", "Yeni Türk Lirası", 765 sayılı TCK md 526 | 45; 17/4, 26/4; Geçici 1; 32/3 | çeldirici bile olmaz |
| bütün eski TL değerleri (yüz, ikibin, üçbin, ikimilyon) | 34/1, 28/10, 43/A | TL; hiç kullanılmaz |

---

## §1 Resmî sorular

| No | Sınav | Hüküm | Açı | Kök | Çeldirici türü | Gerçek değer | Zorluk |
|---|---|---|---|---|---|---|---|
| 141 | **PAEM 8** (5 şık) | 33/2: mülkî amir veya belediye encümeni | M | öncüllü, dört merci; "Yalnız I … III ve IV"; ≈190 krkt | aynı maddenin öbür mercileri (kolluk, zabıta: İPC ve elkoyma) | 4/4 öncül maddede geçer | orta/zor (iki bilgi birlikte) |
| 142 | **PAEM 8** (5 şık) | 29/1: iki hafta ("on dört") | S | doğrudan, "en geç kaç gün"; tam ad; ≈190 krkt | sayı dizisi (üç, beş, on, on beş); karışık sıra | on beş (27/1, 28/3) | orta; yeni değişiklik |
| 139 | Misyon EGM 2023 (4) | 27/1 | S, K | boşluk, iki değerli; hüküm aynen | 2×2 değil; "tebliği veya tefhimi" iki şıkta | yedi gün (27/2), bir hafta (28/4) | kolay |
| 140 | Misyon EGM 2023 (4) | 17/6: %25 | S | doğrudan, "yüzde kaç" | eşit aralıklı dizi (10, 20, 25, 30) | 0/3 | kolay |
| 145 | Misyon 2020 (4) | 14/3, md 7, md 9, 11/1 | Ş | "yanlıştır"; bölüm adı | sayı: on beş → on sekiz | — | kolay |
| 146 | Misyon 2020 (4) | 17/5: bir ay | S | doğrudan, "en geç kaç ay"; rakam | ardışık dizi (1–4) | 0/3 | kolay |
| 147 | Misyon JGK 2023 (4) | 21/2: TL basamakları | S | "hangisi doğru verilmiştir" | her şıkta bir basamak, yıl değiştirilmiş (on, altı, iki) | — | orta; TL |
| 148 | Misyon JGK 2023 (4) | 17/5 (= [146]) | S | doğrudan | karışık birim (gün, ay) | on beş gün (27/1) | kolay |
| 149, 150 | İçişleri GYS (4) | 27/1 | S | doğrudan, hüküm aynen | dizi (on, yirmi, otuz) | 0/3 | kolay |
| 151 | İçişleri GYS (4) | md 7, 11/1, 9, 10 | Ş | "yanlıştır"; tırnaklı bölüm adı | terim: kasten → taksirle | — | orta |
| 143 | Hâkimlik 2021 (5) | 27/1 | M | doğrudan | mahkeme merdiveni | — | kolay |
| 144 | Kaymakamlık 2023 (5) | 42/A: vali | M | doğrudan | benzer makam (kaymakam, kolluk, savcı) | — | orta (sezgiye aykırı) |

**Çıkarım.**
- On üç sorunun on üçü bankada.
- Madde dağılımı: 27/1 dört kez; 17/5 iki; 17/6, 21/2, 29/1, 33/2, 42/A birer; "sorumluluğun esasları" önerme sorusu iki kez (md 7, 9, 10, 11, 14/3).
- Açı dağılımı: süre/sayı 8, merci 3, önerme (şart) 2. Vaka, koşul → kural ve ayırt etme sorusu yok.
- **PAEM'in iki sorusu türce ötekilerden ayrılır:** biri çift merciyi öncülle ayırt ettirir (kolluk İPC verir, mülkiyeti başkası geçirir); öteki sınavdan haftalar önce değişen süreyi sorar. Misyon ve GYS ise 2005 metninin çekirdek sürelerini yineler.
- Sorulmayanlar: md 3–6, 8, 12–16, 18–26, 28, 30–32, 34–41, 43–43/C. Bunların büyük kısmını banka türetim dışı sorularla doldurmuş (§2).
- PAEM 9 ve 10 Kabahatler sormadı; iki korpus "kabahat", "idarî para cezası", "mülkiyetin kamuya" ve "sulh ceza" sözcükleriyle tarandı. İdare korpusunda 5326'yı ölçen soru yok; yalnız sınır soruları var (sulh ceza hâkimliğinin kararı idari yargıda dava konusu olmaz: `resmi-idare-personel.txt` satır 618 ve 2798; Tahkim Kurulu vakasında yanlış şık, satır 20).

## §2 Bankada ölçülenler (yeniden sorulmaz)

87 soru: 79'u beş şıklı, **8'i dört şıklı** (hepsi resmî Misyon ve GYS soruları: [139], [140], [145]–[151]; [149] ve [150] tek kayıt). Olumsuz kök ≈15, öncüllü 3, "hangisi doğrudur" 27. Doğru şık dağılımı A22 B37 C13 D6 E9 (**B %43**).

| Hüküm | Açı | Kaç kez · nerede | Sızıntı ve karar |
|---|---|---|---|
| md 2 tanım | K | 1 | sorulmaz |
| md 3 genel kanun | K | 1 | sorulmaz |
| md 4 kanunilik (çerçeve hüküm; yaptırım ancak kanunla) | K | 1; TCK md 2 sorusunda öncül II (suçlar için yanlış) | sorulmaz; TCK ile ayırt etme de ölçülmüş sayılır |
| 5/2 işlenme zamanı (netice dikkate alınmaz) | K | 1; TCK "suçun işlendiği an" sınır | Sorulmaz. 5/1 ölçülmemiş (yedek). |
| md 7 ihmali davranış | Ş | [145] B, [151] A (doğru önerme) | sorulmaz |
| md 8 (1, 2, 4) | Sn, V | 2 (vaka; öncüllü) | Sorulmaz. 8/3 ölçülmemiş; düşük değer. |
| md 9 kast veya taksir | K | 3 ([145] C, [151] C, türetilmemiş 1) | sorulmaz |
| md 10 hata | Ş | 2 ([151] cevabı; 1) | sorulmaz |
| 11/1 on beş yaş | S | 3 ([145] cevabı, [151] B, 1) + TCK md 31 sorusunda E şıkkı | Sorulmaz. 11/2 (akıl hastalığı) yalnız yanlış şıkta. |
| md 12 hukuka uygunluk | K | 1 (uzun vaka) | sorulmaz |
| md 13 teşebbüs | K, İ | 1 | sorulmaz |
| 14/1, 14/3 iştirak | Sn | 14/1 bir soru; 14/3 [145] A | Sorulmaz. **14/2 ve 14/4 ölçülmemiş.** |
| 15/1 ilk cümle, 15/2, 15/3 ilk cümle | Sn | 2 (öncüllü; vaka) + 2918 Ek 3 (aynı kural) | Sorulmaz. **15/1 ikinci cümle ve 15/3 ikinci cümle ölçülmemiş.** Vaka kökü "yalnızca idarî para cezası öngörülen" der; 15/1'in koşulunu basar. |
| md 16 yaptırım türleri | K | 1 | sorulmaz |
| 17/3 bütçe; taksit | K, Ş | 2 | Sorulmaz. Taksit şıkları "bir yıl", "dört eşit taksit", "ilk taksit peşin" değerlerini basar. |
| 17/5 bir ay | S | 2 ([146], [148]) | mükerrer çift; sorulmaz |
| 17/6 bir ay, %25, rıza ile tahsil, kanun yolu | S, Sn | 3 ([140]; "yanlıştır"; "2026 uygulaması" vakası) | Sorulmaz. "Yanlıştır" sorusu 17/6–7'nin dört cümlesini doğru önerme olarak basar. |
| 17/7 yeniden değerleme; nispi hariç | K | doğru önerme | sorulmaz |
| 18/1, 2, 5, 6, 7, 8 | Ş, K | 2 | Sorulmaz. **18/3 ve 18/4 ölçülmemiş** (yedek). |
| md 19 saklı tutulan yaptırımlar | K | 1 ("sayılmamıştır") | sorulmaz |
| 20/2 son cümle; 20/3 sekiz yıl | S, İ | 2 | Sorulmaz. **20/4 ve 20/5 ölçülmemiş.** 20/2 a–c TL. |
| 21/2 basamaklar; 21/3 on yıl; 21/4 başlangıç | S | 3 ([147] TL; 2) | Sorulmaz. 21/5 ölçülmemiş; düşük. |
| 22/1–2 yetki; en üst amir | M | 1 | Sorulmaz. 22/3–4 ölçülmemiş (yedek). |
| 23/3 savcı; kurum karar vermemişse | Ş | 1 | Sorulmaz. **23/2 ölçülmemiş.** 23/1 yanlış şıklarda. |
| md 24 mahkeme | M | 27/5 sorusunun kökü basıyor | sorulmaz |
| md 25 tutanak | K | 1 ("biri değildir") | sorulmaz |
| 26/2 huzurda karar; 26/4 beşinci gün | Sn, S | 2 | Sorulmaz. 26/1 ve 26/3 ölçülmemiş (yedek). |
| 27/1 on beş gün; sulh ceza | S, M | **4** ([139], [149]=[150], [143]) | sorulmaz; hiçbir şıkta doğru değer olarak da durmaz |
| 27/2 mücbir sebep, yedi gün | S, Sn | 1 | sorulmaz |
| 27/5 mahkeme kararına itiraz | M | 1 | sorulmaz |
| 27/6 savcı kararı ↔ KYOK itirazı | M, V | 1 | Sorulmaz. **27/7 aynasıdır; o da sorulmaz.** |
| 27/8 idari yargı ile birlikte | M, V | 1 | sorulmaz |
| 28/3 on beş gün | S | 1 | sorulmaz |
| 28/4–7 dinleme | Ş | 1 ("yanlıştır") | sorulmaz |
| 28/8 son karar (ret, kaldırma) | K | 1 | Sorulmaz. **28/9 ve 28/1 ölçülmemiş.** |
| 28/10 kesinlik | Sn | 1 (TL vakası) | Sorulmaz. B şıkkı 29/1'in değerini ("iki hafta içinde itiraz") basar. |
| 29/1 iki hafta | S | 2 ([142]; 1) | mükerrer çift; sorulmaz |
| md 30 vazgeçme ve kabul | Sn | 2 | sorulmaz |
| md 31 harç, masraf | K | 1 | sorulmaz |
| md 32 emri veren makam; açık hüküm | M, Ş | 2 + eşleştirme | Sorulmaz. 32/1'deki dört amaç ölçülmemiş. |
| 33/1–2 | M, F | **5** ([141]; eşleştirme; "mülkî amir" sorusu; "hangi kabahatte elkoyma"; grid) | tükendi |
| md 34 | M, F | **5** (mülkî amir; kıraathane vakası; tekerrür; "en yüksek ceza"; grid) | tükendi |
| md 35 | Ş, M | 2 + 2 eşleştirme | tükendi |
| 36/2 ticari işletme | F | 2 (aynı bilgi) | mükerrer çift; 36/3 ölçülmemiş |
| md 37 | F, M | 1 vaka | sorulmaz |
| 38/1 yalnız zabıta | M | 1 + eşleştirme | Sorulmaz. 38/2 ölçülmemiş; düşük. |
| md 39 (dört hücre) | M | 2 (vaka; eşleştirme) | tükendi |
| 40/2 | Sn | 1 + PVSK 4/A sorusu | Sorulmaz. **40/1 ölçülmemiş.** |
| 41/5, 41/7, 41/8 | M, İ | 2 | sorulmaz |
| md 42 (1 son cümle, 2, 3, 4) | Ş | 1 ("yanlıştır") | sorulmaz |
| 42/A (vali; tekrar; iki fiil) | M, F | **5** ([144]; il valileri; tekrar vakası; "on katı"; eşleştirme ×2) | tükendi |
| md 43 | Ş | 2 (+ grid) | sorulmaz |
| 43/A/2 mahkeme | M | 1 | Sorulmaz. Suç listesi ve "menfaatin iki katı" ölçülmemiş (yedek, düşük). |
| 43/B Cumhuriyet savcısı | M | 1 | sorulmaz |
| **43/C** | — | Kabahatler konusunda 0; güncel konuda 1 (bent (a) yürürlük tarihi) | açık |
| başka kanunlar (2920 drone; 4250 alkol; 7258, 4207, 6458 grid) | M | 4 | 5326 sorusu değildir; konu etiketi kusuru (§8) |

**Mükerrer çiftler (banka içi):** 27/1 (dört kayıt); 17/5 ([146] ↔ [148]); 17/6 %25 ([140] ↔ "2026 uygulaması" vakası ↔ "yanlıştır" B); 29/1 ([142] ↔ türetilmemiş soru); 11/1 (üç); md 9 (üç); 33/2 mülkiyet mercii (üç); 34/2 (iki); 42/A vali ([144] ↔ "il valileri"); 36/2 (iki); 41/8 (vaka ↔ önerme); md 35 (önerme ↔ vaka); 30/2 (vaka ↔ önerme C şıkkı).

**Banka kökü sızıntıları (yeni soru bunların verdiği cevaba dayanamaz):**
- "Kabahatler ile … yetkili makamlar" eşleştirmesi: dilencilik, kumar, sarhoşluk, işgal mercilerini doğru eşleştirme olarak basar.
- "Kolluk uygulamasında … yetkili makamlar" eşleştirmesi: kumar → kolluk, 112 → vali, sarhoşluk → kolluk, 1774 → mülki amir.
- Tütün eşleştirmesi: md 39'un dört hücresi.
- md 41 önermesi: 41/7 ile 41/8 tek şıkta.
- 27/5 sorusunun kökü md 24'ü; md 30 vakasının kökü 30/2'yi; md 28 vakasının B şıkkı 29/1'i verir.
- PVSK 4/A "yanlıştır" sorusu 40/2–3'ün dört cümlesini doğru önerme olarak basar.
- TCK md 31 sorusunun E şıkkı 11/1'i doğru önerme olarak basar.

## §3 Madde madde değer tablosu

### Genel hükümler (md 1–31)

| md | Değer | Açı | ◆ | [K→K] | Bankada | Varsayılan cevap riski | Karar |
|---|---|---|---|---|---|---|---|
| 1 | D | K | | | yok | amaç listesi; ezber | yalnız md 32 sorusunda çeldirici kaynağı |
| 2, 3, 4 | O | K | | | dolu | — | sorulmaz |
| 5/1 | O | A | | evet | boş | TCK'da infaz hükümlerinin derhal uygulanması bilgisi cevabı verir | yedek |
| 5/2 | O | K | | | dolu | — | sorulmaz; 20/4 sorusunun ters çeldiricisi |
| 6 | D | K | | | boş | atıf sorusu (TCK md 8) | yalnız 22/4 ile ayırt etmede (yedek) |
| 7, 9, 10 | O | Ş | | | dolu (2–3) | — | sorulmaz |
| 8/1–2, 8/4 | O | Sn | ◆ kısmen | | dolu | — | sorulmaz |
| 11/1 | Y | S | ◆ | | dolu (3+1) | "çocuğa ceza verilmez" | sorulmaz; 43/C/5 sorusunda bağlam |
| 11/2 | D | Ş | | | yanlış şıkta | sezgi | sorulmaz |
| 12, 13 | O | K | | | dolu | — | sorulmaz |
| 14/2 | O | Sn | | evet | boş | "niteliği olmayan fail olmaz" sezgisi yanlışa götürür (lehte) | 14/4 sorusunun çeldiricisi |
| **14/4** | O/Y | A | | evet | boş | "suç ağır basar" kısmen verir | **p1 #1** |
| 15/1 ikinci cümle | O | A | ◆ kısmen | evet | boş | "bu yaptırımların her biri" İPC'yi de kapsar mı: hafif iki okuma | yedek |
| **15/3 ikinci cümle** | Y | İ, Sn | ◆ | evet | boş (ilk cümle dolu) | "suç varsa kabahat sorulmaz" sezgisi yanlışa götürür (lehte) | **p1 #2** |
| 16 | O | K | | | dolu | — | sorulmaz |
| 17/1–2 | O | K, Ş | ◆ kısmen | | boş | üç ölçüt ezberi | yedek (liste) |
| 17/3–7 | Y | S, Sn | ◆ | | dolu (7) | — | sorulmaz |
| 18/3 | O | Sn | ◆ | | boş | "elkonulur" varsayılanı | yedek |
| 18/4 | O | M | | evet | boş | "Devlete geçer" varsayılanı; "Hazine" şıkkı iki doğru doğurur | yazılmaz |
| 19 | D | K | | | dolu | — | sorulmaz |
| 20/2 a–c | — | S | | | boş | TL | sorulmaz |
| **20/4** | O/Y | A | | | boş | md 5/2'yi ezberleyen aday yanlışa gider (lehte) | **p1 #3** |
| 20/5 | O | Sn | | evet | boş | "suçsa suç kuralı" sezgisi verir | yedek (zayıf) |
| 21 | O | S | | | dolu; 21/5 boş | 21/5: bankadaki yanlış şık ipucu veriyor | sorulmaz |
| 22/3 | D | Ş | ◆ | | boş | sağduyu | yazılmaz |
| 22/4 | O | A | | | boş | "yer" → TCK ya da CMK ikilemi; atıf sorusu | yedek |
| 23/1 | O | Ş | | | yanlış şıklarda | — | sorulmaz |
| **23/2** | O/Y | A | ◆ | evet | boş | "seçimli" doğru şık en kapsamlı şık olur | **p1 #5** (riskli) |
| 24 | O | M | | | kök basıyor | — | sorulmaz |
| 25 | O | K | ◆ | | dolu | — | sorulmaz |
| 26/1 | D/O | K | ◆ | | boş | sağduyu | yazılmaz |
| 26/3 | O | İ | ◆ | evet | boş | "tebliğ edilir" varsayılanı | yedek (zayıf) |
| 27/1–2, 5, 6, 8 | Y | S, M | | | dolu (9) | — | sorulmaz |
| 27/3–4 | D | Ş | | | boş | usul kırıntısı | yazılmaz |
| 27/7 | O | M | | | 27/6'nın aynası | — | yazılmaz |
| **28/1** | O | A | | evet | boş | "yetkisizse gönderir" sezgisi verir | yedek |
| 28/2–8 | O | S, K | | | dolu | — | sorulmaz |
| **28/9** | O/Y | İ | | evet | boş | "aralık varsa ayarlanır" sezgisi kısmen verir | **p1 #4** |
| 28/10 | — | Sn | | | dolu | TL | sorulmaz |
| 29/1 | Y | S | | | dolu (2) | — | sorulmaz |
| 29/2, 29/4, 29/5 | D | K | | | boş | usul kırıntısı | yazılmaz |
| 30, 31 | O | Sn | | | dolu | — | sorulmaz |

### Özel kabahatler (md 32–43/C)

| md | Değer | Açı | ◆ | [K→K] | Bankada | Varsayılan cevap riski | Karar |
|---|---|---|---|---|---|---|---|
| 32/1 merci; 32/2 | Y | M, Ş | ◆ | | dolu | — | sorulmaz |
| 32/1 emrin amaçları | O | K | ◆ | | boş | dört amaç; md 1'in beş değeriyle karışır | **p2 #3** |
| 33 | Y | M, F | ◆ | | dolu (5) | — | sorulmaz |
| 34 | Y | M, F | ◆ | | dolu (5) | — | sorulmaz |
| 35 | Y | Ş, M | ◆ | | dolu (4) | — | sorulmaz |
| 36/1–2 | O | F | ◆ | | dolu (2) | — | sorulmaz |
| 36/3 | O | M | ◆ | | boş | "kolluk veya zabıta" bu kanunun varsayılanı | yazılmaz |
| 37 | O | F, M | ◆ | | dolu | — | sorulmaz |
| 38/1 | O | M | | | dolu | — | sorulmaz |
| 38/2, 38/3 | D | M | | | boş | 38/1'in tekrarı | yazılmaz |
| 39 | O | M | ◆ | | dolu (3) | 4207 gölgesi ⚑ | sorulmaz |
| **40/1** | **Y** | M, A | ◆ | evet | boş | varsayılan ("kolluk") YANLIŞ şıktır (lehte) | **p2 #1** |
| 40/2–3 | Y | Sn | ◆ | | dolu (2) | — | sorulmaz |
| 41/1–6 | D | F | | | 41/5 vaka | TL; belediye işi | yazılmaz |
| 41/7–8 | O | M, İ | ◆ kısmen | | dolu | — | sorulmaz |
| 42 | O | Ş, M | ◆ | | dolu | — | sorulmaz |
| 42/A | Y | M, F | ◆ | | dolu (5) | — | sorulmaz |
| 43 | O | Ş | ◆ | | dolu (3) | "silah"ın kapsamı ⚑ (§8) | yazılmaz |
| 43/A/1 liste; "menfaatin iki katı" | D/O | K | | | boş | PAEM değeri düşük | yedek (zayıf) |
| 43/A/2, 43/B | O | M | | | dolu | — | sorulmaz |
| 43/C/1-a | — | K | ◆ | | güncel soru (tarih) | 1/12/2026'ya kadar yürürlükte değil | bu turda yazılmaz |
| **43/C/1-b** | Y | Ş, K | ◆ | evet | boş | "çocuğa bıçak satılmaz" sağduyusu fiili verir; yaş eşiği vermez | p2 #2'nin olgusu; tek başına yedek |
| 43/C/2 son cümle (bildirim yükümlülüğü) | O | F | ◆ | | boş | "Kabahatler → İPC" varsayılanı | yedek (zayıf) |
| 43/C/3–4 | O | M | ◆ | | boş | kumarın aynası (bankada 5 kez): "kolluk; mülki amir" | yazılmaz |
| **43/C/5** | **Y** | M, İ | ◆ | evet | boş | "çocuk → çocuk hâkimi" sezgisi hâkimi verir; **talep eden makamı vermez** (5395 md 7'yi bilen aday savcıya gider: lehte) | **p2 #2** |
| 43/C/6 | D | K | | | boş | sağduyu | yazılmaz |
| 43/C/7 | O | İ | ◆ | | boş | sağduyu; "icra yerinde" kaydının taşımaya etkisi iki okumalı | yazılmaz |

**"Kim karar verir" ızgarası ne kadar tüketilmiş?** Özel kabahatlerde 23 merci hücresi var (md 32; 33 ve 34'te ikişer; 35; 36/3; 37; 38/1; 38/2; 39'da dört; 40/1; 41/7; 42/4; 42/A; 43; 43/A; 43/B; 43/C/4; 43/C/5). 18'i bankada ölçülmüş, çoğu birden çok kez; ayrıca üç eşleştirme sorusu ızgaranın dokuz hücresini doğru eşleştirme olarak basıyor. Açık beş hücre: 36/3, 38/2, 40/1, 43/C/4, 43/C/5. Bunlardan yalnız **40/1** ve **43/C/5** kestirmesizdir; öbür üçünün cevabı kanunun varsayılanıdır. Izgara biçimli (eşleştirme, "hangisinde kolluk yetkili değildir") yeni soru yazılmaz: bankada dört tane var ve biri çekilme önerisi almış durumda (§8).

## §4 Değer tabloları

**Süreler ve sayılar (TL dışı)**

| Değer | Yer | Bankada |
|---|---|---|
| on beş gün ✱ | 27/1 başvuru · 28/3 idarenin cevabı · Geçici 3 | 27/1 dört kez; 28/3 bir kez |
| iki hafta | 29/1 itiraz | 2 |
| yedi gün | 27/2 mücbir sebep | 1 |
| en az bir hafta | 28/4 dinleme günü ile tebligat arası | doğru önerme |
| bir ay ✱ | 17/5 tahsilin bildirilmesi · 17/6 ödeme süresi | 2 + 3 |
| beşinci günün sonu | 26/4 elektronik tebliğ | 1 |
| bir yıl ✱ | 17/3 taksit süresi · 42/A/3 tekrar dönemi | 1 + 2 |
| dört eşit taksit; %25 | 17/3; 17/6 | 1; 3 |
| üç, dört, beş yıl; sekiz yıl | 20/2 (TL basamaklı); 20/3 nispi | 20/3 bir kez |
| üç, dört, beş, yedi yıl; on yıl | 21/2 (TL basamaklı); 21/3 mülkiyet | [147]; 1 |
| takvim yılının son günü | 20/2 son cümle | 1 |
| on beş yaş ✱ | 11/1 İPC uygulanamaz · 43/C/5 tedbir talebi | 11/1 dört kez |
| on sekiz yaş | 43/C/1-b | boş ([145]'te 11/1'in yanlış değeri) |
| yılda üç gün | 41/5 | boş; değersiz |
| iki katı ✱ | 42/A/3 tekrar · 43/A/1 "menfaatin iki katından az olamaz" | 42/A/3 iki kez |

- **Süre sorusu kurulmaz.** Kanunun bütün çekirdek süreleri bankada, çoğu resmî soruyla. Açık kalan tek sayısal unsur 43/C'nin iki yaş eşiğidir; o da yalnız vaka olgusu olarak kullanılır (p2 #2), "kaç yaş" diye sorulmaz ("çocuk = on sekiz" varsayılanı).
- En sık değer: **on beş** (gün: üç yer; yaş: iki yer). Bilmeyen adayın süre sorusundaki ilk tahmini budur.

**Merciler ve aktörler**

| Aktör | Yer · iş |
|---|---|
| kolluk görevlileri (tek başına) | 34/2 İPC ve elkoyma · 35 · 43 · 43/C/4 İPC ve elkoyma |
| kolluk veya belediye zabıta görevlileri | 33/2 İPC ve elkoyma · 36/3 · 37/2 · 42/4 |
| belediye zabıta görevlileri (tek başına) | 38/1 · 38/2 · 41/7 (belediye sınırları içinde) |
| kolluk (koşullu) | 39/2 özel toplu taşıma: ilk başvurulan birim · 39/3 şikâyet üzerine en yakın birim · 41/7 belediye sınırları dışında |
| mülkî amir | 33/2 mülkiyet (encümenle seçimli) · 34/2 mülkiyet · 43/C/4 mülkiyet · 43/C/5 çocuk hâkiminden tedbir talebi |
| belediye encümeni | 33/2 mülkiyet |
| il valileri | 42/A/1–2 |
| emri veren makam | 32/1 |
| kimliği soran kamu görevlisi ("bu görevli") | 40/1 |
| ilgili idarî birim amirinin yetkili kıldığı kamu görevlileri | 39/1 · 39/2 kamuya ait toplu taşıma |
| Cumhuriyet savcısı | 23 · 40/2 (haberdar edilir) · 43/B |
| mahkeme | 24 · 43/A/2 (yargılamayla görevli mahkeme) · 27–28 sulh ceza |
| çocuk hâkimi | 43/C/5 |
| ilgili kamu kurum ve kuruluşunun en üst amiri | 22/2 (kanunda açık hüküm yoksa) |

- **Varsayılanlar:** "kolluk görevlileri" (İPC), "mülkî amir" (mülkiyet), "sulh ceza hâkimliği" (başvuru), "on beş gün", "bir ay".
- Varsayılanı kıran dört hüküm: 42/A (vali; bankada), 38/1 (yalnız zabıta; bankada), **40/1 (soran görevli)**, **43/C/5 (mülkî amir ister)**.

**Kapalı listeler**

| Liste | Öğeler | Bankada |
|---|---|---|
| md 1 korunan değerler | toplum düzeni, genel ahlâk, genel sağlık, çevre, ekonomik düzen | boş |
| 32/1 emrin amaçları | adlî işlemler; kamu güvenliği; kamu düzeni; genel sağlığın korunması | boş |
| 17/2 miktar ölçütleri | haksızlık içeriği; failin kusuru; ekonomik durumu | boş |
| 18/2 geciktirme koşulları | kullanılmaz hâle getirme; niteliğini değiştirme; belli surette kullanma | dolu |
| md 19 ("gibi": açık uçlu) | dört yaptırım | dolu |
| md 25 tutanak | dört bent + fiil, yer, zaman | dolu |
| 28/1 ön inceleme | yetkisizlik → gönderme; süre, karar türü, hak yokluğu → ret; yoksa usulden kabul | boş |
| 43/A/1 suçlar | on suç (TCK 157–158, 188, 235, 236, 252, 282; 5411 md 160; 5607; 5015 Ek 5; 6415 md 4) | boş |
| 43/C/1-b yasaklar | on sekiz yaşından küçüğe satış; çocuğun satın alması; çocuğun taşıması | boş |

## §5 Ayırt etme malzemesi

- **14/2 ↔ 14/4: özel faillik** [K→K]
  - 14/2: özel faillik aranan kabahate katılan, niteliği taşımayan kişi de fail olarak İPC alır.
  - 14/4: fiil nitelikli kişi için suç, ötekiler için kabahatse ve birlikte işlenmişse **suça iştirak** hükümleri uygulanır.
  - Eksik aday iki fıkrayı çaprazlar: "herkes kendi rejimine tabi olur" ya da "niteliği olmayana İPC".
- **15/3 ilk cümle ↔ ikinci cümle** [K→K]: fiil hem suç hem kabahatse yalnız suçtan yaptırım; suçtan yaptırım **uygulanamıyorsa** kabahatten yaptırım. Bankadaki öncül yalnız kuralı ölçtü; istisna açık. "Uygulanamayan hâl"in örneği metinde yok ⚑.
- **5/2 ↔ 20/4 ↔ 21/4: üç ayrı "an"**
  - 5/2: kabahat davranış anında işlenmiş sayılır; netice dikkate alınmaz (bankada).
  - 20/4: soruşturma zamanaşımı fiilin işlenmesiyle **veya neticenin gerçekleşmesiyle** başlar.
  - 21/4: yerine getirme zamanaşımı kesinleşmeyi izleyen takvim yılı başından başlar (bankada).
  - 20/2 son cümle: sayılan kanunlarda fiili izleyen takvim yılının son günü (bankada).
- **23/2 ↔ 23/3: savcının iki durumu** [K→K]
  - 23/2: başka bir suçun soruşturmasında bir kabahat öğrenirse bildirebilir ya da kendisi karar verebilir.
  - 23/3: soruşturma konusu fiilin kendisi kabahatse karar verir; şartı ilgili kurumun karar vermemiş olması (bankada).
- **28/8 ↔ 28/9:** son karar ret ya da kaldırma (bankada); alt ve üst sınırı kanunda gösterilen cezada mahkeme miktarı değiştirerek kabul de edebilir.
- **28/1 ↔ 28/8: iki "ret".** Ön incelemede süre, karar türü ya da hak yokluğundan ret; son kararda hukuka uygunluktan ret. Yetkisizlikte ret yok, gönderme var.
- **md 6 ↔ 22/4:** yer bakımından uygulama TCK md 8'e, yer bakımından yetki CMK'ya bağlanır.
- **40/1 ↔ 22/2 ↔ PVSK 4/A** ◆ [K→K]
  - 40/1: kimliği ya da **adresi** hakkında bilgi vermekten kaçınana ya da gerçeğe aykırı beyanda bulunana İPC'yi **soran kamu görevlisi** verir. Görevlinin kolluk olması gerekmez.
  - 22/2: kanunda açık hüküm yoksa en üst amir (bankada). 40/1 açık hükümdür.
  - PVSK 4/A: polis kimlik sorar; kimliği belirlenemeyen tutulur (bankada). PVSK'da İPC ve adres unsuru yok.
- **43/C/5 ↔ 11/1 ↔ 5395 md 7** ◆ [K→K]
  - 11/1: on beş yaşını doldurmamış çocuğa İPC uygulanamaz (bankada).
  - 43/C/5: bu çocuk için **mülkî amir** çocuk hâkiminden tedbir talep eder.
  - 5395 md 7: tedbiri isteyebilecekler arasında Cumhuriyet savcısı var, mülkî amir yok. 5395'i bilen eksik aday "savcı" der.
- **43/C/4 ↔ 34/2 ↔ 33/2:** bıçakta ve kumarda mülkiyet mülkî amirde; dilencilikte encümen de var. [141] bunu ölçtü; yeniden kurulmaz.
- **43/C ↔ 6136 md 4, 15 ↔ md 43:** 43/C 6136 kapsamı **dışındaki** bıçaklar içindir. 6136 kapsamındaki bıçak suçtur. md 43 "kanuna göre yasak olmayan silah"tır. Bıçağın md 43 anlamında silah sayılıp sayılmadığı ⚑; üçlü vaka kurulmaz.
- **md 1 ↔ 32/1:** "genel ahlâk", "çevre" ve "ekonomik düzen" Kanunun amacında var, emrin amaçlarında yok. "Genel sağlık" ikisinde de var.
- **md 35 ↔ PVSK md 13; md 36 ↔ PVSK md 14** (bankada PVSK adıyla): PVSK yakalama ve men yetkisini, 5326 İPC'yi düzenler. Çapraz soru kurulmaz; ikisi de dolu.
- **15/1 ↔ 2918 Ek 3:** aynı kural bankada 2918 adıyla ölçülmüş. 15/1'in ilk cümlesi 5326 adıyla da yeniden sorulmaz (22 Kas kural 4).

**Bilmeyen adayın sezgiyle bulacağı hükümler (tek başına soru olmaz):** 11/1, 11/2; 13 ilk cümle; 17/3 son cümle; 18/1, 18/7, 18/8; 20/1, 20/5; 21/1; 22/3; 26/1, 26/3; 27/1; 28/1-a; 30/1 ilk cümle; 31/1; 33/1 ("gelire elkonulur"); 35 ("etkisi geçinceye kadar"); 36/3, 37/2; 40/3; 41/8; 42/3; 43/C/3, 43/C/4, 43/C/6, 43/C/7.

## §6 Kaçınılacaklar (BAĞLAYICI)

- **TL:** hiçbir tutar, eşik ya da tutar oranı; doğru şıkta, çeldiricide, vakada ve açıklamada. 20/2 a–c, 21/2 a–d ve 28/10 bütünüyle dışarıda.
- **43/C/1-a:** bent 1/12/2026'da yürürlüğe girer. Ruhsatlı yer, 2521 sayılı Kanun ve yönetmelik atfı soruya girmez. Yürürlük tarihi sorulmaz (bankada).
- **43/A/3:** iptal edilmiş fıkra; hiçbir yerde anılmaz.
- **Bankada ölçülmüş:** §2'deki her şey. Özellikle:
  - 27/1 (on beş gün; sulh ceza), 29/1 (iki hafta), 17/5 ve 17/6 (bir ay, %25), 11/1 (on beş yaş), md 9, md 10;
  - 33/2, 34/2, 35, 38/1, 39, 42/A mercileri; her türlü merci eşleştirmesi;
  - 40/2–3 (5326 ve PVSK adıyla);
  - 15/1 ilk cümle (2918 Ek 3 adıyla da).

  Bu değerler yeni soruda **doğru şık olmaz.** Çeldirici olarak durabilirler; ama açıklama onları değeriyle yazmaz.
- **Varsayılan ve sağduyu:** 36/3, 38/2, 43/C/3–4, 43/C/6–7, 18/4, 22/3, 26/1, 26/3 tek başına; "çocuğa bıçak satılmaz"; "kaç yaş" sorusu.
- **Ayna:** 27/7 (27/6'nın), 43/C/4 (34/2'nin).
- **Metin dışı (⚑):**
  - sulh ceza hâkimliği ile mahkeme farkı; itirazı inceleyen merci; istinaf ya da temyiz;
  - 4207 (tütün), 4250, 7258, 2920, 6458 md 102, 1774 cezaları; "2026 uygulaması", "İPC tablosu";
  - yeniden değerleme oranı, güncel tutarlar, eşiklerin artıp artmadığı;
  - bıçağın ya da havalı tüfeğin md 43'teki "silah" olup olmadığı;
  - 15/3'te suçtan yaptırım uygulanamayan hâllerin örnekleri (şikâyet yokluğu, af, zamanaşımı);
  - on beş yaşından küçük çocuk hakkında mülkiyetin kamuya geçirilmesine karar verilip verilemeyeceği (11/1, 18/5 ve 43/C/3 birlikte okunursa "evet" çıkar; metin açıkça söylemez);
  - 43/C/5'teki talebin zorunlu olup olmadığı dışındaki 5395 usulü;
  - 40/2'deki tutmanın süresi; kimlik için parmak izi (PVSK md 5);
  - emre aykırı davranışta hangi kanunların md 32'ye yollama yaptığı (5442, 2911, 1593).
- **İki okumalı:**
  - 15/1 ikinci cümlede "bu yaptırımların her biri"nin İPC'leri kapsaması;
  - 43/C/7'de "icra yerinde" kaydının taşımayı sınırlaması;
  - 43/C/2'de "yasaklara uymayan kişi"nin satıcı ve çocuk için ayrı ayrı uygulanması, "işletici veya sorumlu"nun kim olduğu;
  - 32/1'de "adlî işlemler nedeniyle" verilen emrin makamı;
  - 23/2'de savcının bildirmesi hâlinde kurumun yükümlülüğü;
  - 33/2'de mülkî amir ile encümen arasındaki paylaşım (kolluk tespit ederse mülkî amir, zabıta tespit ederse encümen okuması metinde yok).
- **Biçim:** ızgara ya da eşleştirme sorusu; öncüllü merci sorusu ([141]'in kopyası); "2026 uygulamasına göre" kökü; tutar karşılaştırması ("hangisinin cezası daha yüksek").
- **Eski metin:** §"Eski değerler" tablosu.

## §7 Parti önerisi

Banka dolu olduğu için iki küçük parti önerilir. Sayılar TAVANDIR. Bir yuva kestirmesiz kurulamıyorsa boş kalır; yerine yedekten soru yazmak zorunlu değildir.

### `5326-p1` genel hükümler (tavan 5; önerilen 4)

| # | Hüküm | Açı / kök tipi | Zorluk | Çeldirici kaynağı (metinden) | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | 14/4 (↔ 14/2, 14/1) | A [K→K]. Koşul kökte: fiil, özel faillik niteliğini taşıyan için suç, taşımayanlar için kabahattir ve birlikte işlenmiştir. Sorulan: uygulanacak hüküm. | zor | 14/2'nin kuralı (niteliği taşımayana da fail olarak İPC); 14/1 (her birine fail olarak İPC); "herkes kendi rejimine tabi" (sezgi); 15/1 (en ağır İPC) | "Suç ağır basar" sezgisi doğruya yaklaştırır. 15/3'ü bilen aday "yalnız suçtan yaptırım" der; şıklarda bu ifadeyle 14/4'ün "suça iştirak" ifadesi ikiz kurmamalı. | md 14 sorusu (14/1); [145] A (14/3) |
| 2 | 15/3 ikinci cümle | İ, Sn [K→K]. Koşul kökte: fiil hem suç hem kabahattir ve suçtan dolayı yaptırım uygulanamamıştır. Sorulan: kabahat yönünden sonuç. Kök soyut kalır; hâl örneği yazılmaz. | zor | "kabahatten de yaptırım uygulanamaz" (sezgi; 15/3 ilk cümlenin aşırı okuması); 23/2 (savcı ilgili kuruma bildirir); 20/5 (dava zamanaşımı hükümleri uygulanır); 18/5 türü (yalnız mülkiyetin kamuya geçirilmesi) | "Uygulanır" ile "uygulanamaz" ters çift olur; doğru şık "kabahat dolayısıyla yaptırım uygulanır" yerine sonucu başka sözle kurmalı ya da ters şık yazılmamalı. Bankadaki öncül IV ilk cümleyi verir; istisnayı vermez. | md 15 öncüllü (IV); `banka-kusur-6458-7201.md` bff6766d açıklaması |
| 3 | 20/4 (↔ 5/2, 21/4, 20/2 son) | A. Doğrudan: soruşturma zamanaşımı süresinin işlemeye başladığı an. | orta/zor | 21/4 (kesinleşmeyi izleyen takvim yılı başı); 20/2 son cümle (fiili izleyen takvim yılının son günü); 27/1 (tebliğ ya da tefhim); "yetkili makamın öğrenmesi" (partideki tek uydurma) | md 5/2'yi ezberleyen aday "netice" geçen şıkkı eler: soru lehine. Ama "netice" yalnız doğru şıkta geçerse göze batar; ikinci bir şıkta da geçmesi gerekirse iç içe şık kurulmamalı ("yalnız neticeyle" yazılmaz). Açıklama 21/4'ü değeriyle yazmaz. | md 5 sorusu; md 21 başlangıç sorusu (D şıkkı "fiilin işlendiği tarihten") |
| 4 | 28/9 (↔ 28/8) | İ [K→K]. Koşul kökte: ceza, alt ve üst sınırı kanunda gösterilen bir kabahatten verilmiştir. Sorulan: mahkemenin ret ve kaldırma dışında verebileceği karar. | orta | 27/2 (yerine getirmenin durdurulması); 28/1-a (dosyanın yetkili mahkemeye gönderilmesi); 17/3 (taksitle ödemeye karar); 30/2 (idarenin kararı geri alması) | "Aralık varsa hâkim ayarlar" sezgisi doğruyu destekler. Ters biçim ("hangi cezada miktar değiştirilebilir": maktu, nispi, alt–üst sınırlı) daha da tahmin edilir; kurulmaz. Kör çözümde salt şıkla bulunuyorsa RED beklenir. | md 28 "son karar" sorusu |
| 5 | 23/2 (↔ 23/3) | A [K→K]. Koşul kökte: savcı, bir suç soruşturması sırasında **başka** bir kabahatin işlendiğini öğrenmiştir. Sorulan: yapabileceği. | orta/zor | 23/3 (kurum karar vermemişse kendisi karar verir: zorunluluk); 22/2 (en üst amire bırakır); 24 (mahkemeden ister); "yalnız bildirir" | Doğru cevap seçimlidir ("bildirebilir ya da kendisi verebilir"): en kapsamlı şık kestirmesi. Çözüm: doğru şık seçimin tek bir ucunu ölçsün (kök "ilgili kuruma bildirmek zorunda mıdır" yönünü sabitlesin) ya da yuva boş kalsın. Bankadaki md 23 sorusunun A ve C şıkları iki ucu yanlış olarak basıyor. | md 23 sorusu |

**Yedek (sırayla):**
- 28/1: ön incelemede verilecek kararlar; "hangi hâlde başvurunun reddine karar verilmez" (yetkisizlik). Olumsuz kök; "yetkisizse gönderilir" sezgisi nedeniyle zayıf.
- 15/1 ikinci cümle: tek fiille iki kabahat, birinde İPC dışında idarî yaptırım da var. Yalnız "öbür yaptırımlar ayrıca uygulanır" unsuru ölçülür; İPC'nin akıbeti şıklarda değişken olmaz.
- md 6 ↔ 22/4: yer bakımından yetkide hangi kanunun kuralları geçerlidir (CMK; çeldirici TCK). Atıf sorusu; değeri düşük.
- 17/2: alt ve üst sınırlı cezada miktarı belirleyen ölçütler; "sayılmamıştır". Yanlış öğe metinden gelmeli (ör. 25/1-c "deliller" ya da 18/2 koşulları); uydurma öğe yazılmaz.
- 5/1: yerine getirmede derhal uygulama. TCK bilgisi cevabı verdiği için en zayıf yedek.

**Dışarıda:** md 1–4, 5/2, 7–13, 14/1, 14/3, 15/1 ilk cümle, 15/2, 16, 17/3–7, 18, 19, 20/1–3, 21, 22/1–3, 23/1, 23/3, 24, 25, 26, 27, 28/2–8, 28/10, 29, 30, 31, 44, 45, Ek 1, Geçici 1–3.

### `5326-p2` özel kabahatler (tavan 4; önerilen 3)

| # | Hüküm | Açı / kök tipi | Zorluk | Çeldirici kaynağı (metinden) | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 40/1 (↔ 22/2, PVSK 4/A) | M [K→K]. Koşul kökte: kimliği soran görevli **kolluk değildir** (ör. belediye zabıta memuru ya da başka bir kamu görevlisi), soru görevle bağlantılıdır, kişi bilgi vermekten kaçınmıştır. Sorulan: İPC'yi kim verir. | orta/zor | kolluk görevlileri (varsayılan); görevlinin kurumunun en üst amiri (22/2); mülkî amir (33, 34, 43/C); Cumhuriyet savcısı (40/2'de haberdar edilen) | Kökte görevli polis olursa "kolluk" da doğru olur: iki doğru. Doğru şık kökteki unvanı yankılar; yankıyı azaltmak için doğru şık "kimliği soran görevli" diye, kök unvanla yazılır. Görevli zabıta seçilirse "kolluk veya belediye zabıta" şıkkı yazılmaz. 40/2'nin tutma ve gözaltı kısmı köke girmez (kimlik sonunda belirlenmiş olmalı ya da hiç anılmamalı). | md 40 sorusu (40/2); PVSK 4/A iki soru |
| 2 | ◆ 43/C/5 (+ 43/C/1-b, 11/1) | M, İ [K→K]. Kısa vaka: on beş yaşını doldurmamış bir çocuğun, 6136 kapsamı dışındaki bir bıçağı taşıdığı tespit edilmiştir. Sorulan: çocuk hakkında tedbir için kim, kime başvurur. Bileşik "X – Y" şık kurulacaksa ızgara kuralına uyulur; tercih edilen tek konumlu sorudur (talep eden makam; kökte "çocuk hâkiminden" yazılır). | orta | Cumhuriyet savcısı (5395 md 7'nin gerçek aktörü; en güçlü çeldirici); kolluk görevlileri (43/C/4: İPC ve elkoyma); belediye encümeni (33/2); ilgili kamu kurumunun en üst amiri (22/2) | Kökte "çocuk hâkiminden" yazılınca "çocuk → savcı" bilgisi yanlışa götürür: lehte. "Mülkî amir" bu kanunda mülkiyetin varsayılan merciidir; kumar bilgisinden sezilebilir. Vali ile mülkî amir aynı şık takımında iç içe küme olur (vali de mülkî amirdir): **vali şıkkı yazılmaz**, yerine "ilgili kamu kurumunun en üst amiri" (22/2). Elkoyma ve mülkiyet (43/C/3–4) köke ve açıklamaya değerle girmez. | TCK md 31 sorusu E şıkkı; güncel 43/C sorusu; md 11 sorusu |
| 3 | ◆ 32/1 emrin amaçları (↔ md 1) | K. Olumsuz kök: emre aykırı davranış kabahatine konu olabilecek emrin veriliş amaçlarından biri DEĞİLDİR. | orta | Doğru önermeler 32/1'in dört amacı; yanlış öğe md 1'den: "genel ahlâkın korunması" | Liste ezberi; değer O. "Çevrenin korunması" seçilirse sağduyuyla düşer; "genel ahlâk" seçilir. Partinin tek olumsuz kökü olur. Bankadaki md 32 sorusunun cevabı (emri veren makam; açık hüküm) köke ve açıklamaya girmez. | md 32 sorusu |

**Yedek (sırayla):**
- 43/C/1-b: yasak fiiller ve süjeleri; koşul → kural: on altı yaşındaki çocuğun bıçak satın alması hâlinde çocuk hakkında ne yapılır (İPC; tedbir talebi değil). #2 ile aynı şık takımını taşırsa ayna sorudur; ikisi birlikte yazılmaz (22 Kas kural 3).
- 43/C/2 son cümle: kabahati öğrenip bildirmeyen işletici ya da sorumlu. "İşletici veya sorumlu"nun kim olduğu iki okumalı; yalnız yaptırımın varlığı ölçülür. Varsayılan cevap riski yüksek.
- 43/A/1: "menfaatin iki katından az olamaz" ya da suç listesi. PAEM değeri düşük.

**Dışarıda:** md 33–39, 40/2–3, 41, 42, 42/A, 43, 43/A/2–3, 43/B, 43/C/1-a, 43/C/3, 43/C/4, 43/C/6, 43/C/7.

**Parti arası temas.** p1 #5 (savcı) ile p2 #2'nin çeldiricisi (savcı); p2 #1'in çeldiricisi (22/2) ile p1'in hiçbir yuvası çakışmaz. p1 #2'nin açıklaması 23/2'yi içerikle yazmaz.

## §8 5326'ya özgü kurallar

### Üretici kuralları
1. **Önce bankaya bak.** Her yuva için `5326-mevcut-sorular.txt`'te aynı maddeyi ara; kökü ya da şıkkı cevabını yazıyorsa yuva boş kalır (22 Kas kural 6).
2. **TL yok.** Tutar, eşik, oran, "daha yüksek ceza". Açıklamada da yok.
3. **Varsayılanı çeldiriciye bağla.** Merci sorusunda "kolluk görevlileri" ve "mülkî amir" bu kanunun varsayılanlarıdır. Doğru cevap bunlardan biriyse soru yazılmaz (43/C/4 bu yüzden dışarıda); p2 #2'de "mülkî amir" yalnız "çocuk hâkiminden" koşuluyla ve "savcı" çeldiricisiyle kurulur.
4. **İç içe merci yazma.** Vali ile mülkî amir; kolluk ile "kolluk veya belediye zabıta"; mahkeme ile sulh ceza hâkimliği aynı şık takımında yer almaz.
5. **Kök.** "5326 sayılı Kanun'a göre," ile açılır; madde numarası yazılmaz. Vaka en çok bir tane (p2 #2), 1–2 cümle, unvanlı.
6. **43/C.** Kök "6136 sayılı Kanun kapsamı dışında kalan bıçak" der; bıçak türü (ekmek bıçağı, çakı) yazılmaz (hangi bıçağın 6136 kapsamında olduğu ⚑). Bent (a) yok.
7. **Açıklama.** Bankadaki değerleri (on beş gün, iki hafta, %25, on beş yaş, kumar ve dilencilik mercileri) yazmaz. "Karıştırılan komşu hüküm" yalnız varlığıyla anılır.
8. **Olumsuz kök** iki partide toplam en çok bir (p2 #3). "Hangisi doğrudur" kökü yok: bankada 27 tane var.
9. **Doğru şık harfi.** Bankada B %43; yeni sorularda doğru şık B'ye düşmesin, D ve E'ye düşsün.

### Gözcü kontrol listesi
1. Soru §6'daki listeye değiyor mu (TL, 43/C/1-a, 43/A/3, bankada ölçülmüş değer doğru şıkta)?
2. Kör çözüm: "kolluk", "mülkî amir", "sulh ceza", "on beş" varsayılanlarıyla bulunan soru var mı?
3. Şık takımında iç içe merci ya da ters çift var mı?
4. Doğru cevap bankadaki bir eşleştirme sorusunun satırında yazıyor mu?
5. Mevzuat gözcüsü: 43/C sorusunda yürürlük (18/8/2026) ve bent ayrımı; 15/3 sorusunda metinde olmayan hâl örneği; 40/1 sorusunda görevlinin kolluk olmaması.
6. Kalite gözcüsü `-benzer.txt`'te PVSK 4/A, TCK md 31, 2918 Ek 3 ve 5395 md 7 sorularına ayrıca bakar.

## Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

**Banka metni**
1. `mevzuat/5326.txt` resmî metinle aynı; düzeltme gerekmiyor. Eksikler biçimsel: md 1 ve md 31 başlıkları, kısım ve bölüm adları.
2. **43/C/1-a 1/12/2026'da yürürlüğe girer.** Banka metninde bu kayıt yok (resmî dipnot [11]). Madde özeti, konu özeti ya da bilgi kartı bu bendi yürürlükteymiş gibi anlatıyorsa 1 Aralık'a kadar yanlıştır; kontrol edilmeli.
3. md 27, 28 ve Geçici 3 "sulh ceza mahkemesi" der; resmî metin de öyle. Bankadaki sorular üç ayrı biçim kullanıyor.
4. md 39 (tütün) 4207 sayılı Kanunla birlikte uygulanır; 39/1'deki "tahsis edilen alanlar" istisnasının bugün geçerli olup olmadığı bu klasördeki metinlerle **doğrulanamadı** (4207 metni yok).
5. 20/2 son cümlede sayılan 1111 sayılı Askerlik Kanununun yürürlüğü **doğrulanamadı**.
6. 20/2, 21/2 ve 28/10'daki TL eşiklerinin yeniden değerlemeyle artıp artmadığı metinde yazmıyor; **doğrulanamadı**.

**Bankadaki sorular**

| Soru (ilk 60 karakter) | Bulgu | Öneri |
|---|---|---|
| "5326 Sayılı Kabahatler Kanunu hükümlerine göre kolluk tarafın…" (dilencinin kazancı; A mülki amir ✔) | **Olası iki doğru.** C şıkkı "Belediye encümeni"; 33/2 "mülkî amir veya belediye encümeni" der. "Kolluk tespit ederse mülkî amir" ayrımı metinde yok. PAEM [141] aynı hükümde ikisini birlikte doğru saymıştı. | denetime alınmalı |
| "2026 idarî para cezası uygulamasında, aşağıdaki fiillerden ha…" (6f5938d5) | `banka-kusur-ipc-5326-1774.md`: B şıkkı da cevap olabiliyor; çekilme önerisi. Dökümde hâlâ duruyor. | o rapordaki karar uygulanmalı |
| "Bir kişi, ruhsat gerektirmeyen havalı tüfeğini şehir meydanın…" (08f3c979) | Aynı rapor: md 43'ün havalı tüfeğe uygulanması tartışmalı; 1-1. | bildirildi |
| "5326 sayılı Kabahatler Kanunu'nda düzenlenen aşağıdaki kabaha…" (en yüksek ceza; 1e44c394) | TL karşılaştırması; D şıkkındaki "(gerçek kişi)" kaydı. Aynı raporda. | bildirildi |
| "5326 sayılı Kabahatler Kanunu'nun 42/A maddesinde düzenlenen …" ("on katı") | TL oranına dayanıyor; bugün metinle tutarlı (1.500 ↔ 15.000). Tutarlardan biri değişirse eskir. | izlenmeli |
| "Hakkında 10.000 TL idarî para cezası verilen kişinin sulh cez…" | 28/10 eşiğine dayanıyor; bugün metinle tutarlı (7499: onbeşbin). Eşik değişirse eskir. | izlenmeli |
| "5326 sayılı Kabahatler Kanunu’na göre, yerine getirme zaman a…" ([147], 4 şık) | Resmî soru; TL basamakları. Metinle tutarlı. | dokunulmaz |
| "Uçuş izni almadan ve belirlenen alanlar dışında insansız hava…" · "Bir market işletmecisinin 18 yaşını doldurmamış bir müşteriye…" | 2920 ve 4250 sorularıdır; 5326 konusunda duruyorlar. Kökleri "2026 uygulamasına göre": 2027'de eskir. | konu etiketi ve kök kullanıcı kararı |
| "Kolluk görevlisince hakkında idarî para cezası düzenlenen bir…" | Kök "2026 uygulamasına göre"; içerik 17/6 ile tutarlı; [140]'ın mükerreri. | bildirilir |
| "Marketten kaçan bir hırsızı kovalayan görevli, kalabalığı yar…" | Kök dağınık ("sergi sahibi hakkında işgal nedeniyle değil, görevli hakkında…"); cevap doğru. Biçim kusuru. | bildirilir |
| "5326 sayılı Kabahatler Kanunu’na göre; mahkemenin verdiği son…" ([142]) | Cevap "on dört" gün; metin "iki hafta". Tutarlı. Aynı hükmü ölçen ikinci soru var. | dokunulmaz |
| dört şıklı sekiz soru | Hepsi resmî Misyon ve GYS sorusu ([139], [140], [145]–[151]). | beş şık kuralı gereği hatırlatma |
| mükerrer çiftler (§2) | 27/1 dört kayıt; 17/5 iki; 29/1 iki; 36/2 iki; 42/A vali iki | bilgi |
| doğru şık dağılımı | 87 sorunun 37'sinde doğru şık B (%43); D yalnız 6 | bilgi; yeni sorular dengeler |

**Dosya tutarlılığı.** `banka-kusur-ipc-5326-1774.md` iki sorunun (`3dc788e5`, `61cf72cf`) 23 Kas'ta arşivlendiğini yazıyor; `5326-mevcut-sorular.txt` 87 soru gösteriyor ve çekilme önerisi alan soruyu içeriyor. Dosya üretimden önce `doc39-mevcut-sorular-cikar.ts` ile yenilenmeli.
