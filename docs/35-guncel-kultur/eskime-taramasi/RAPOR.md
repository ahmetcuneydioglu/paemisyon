# Eskimiş soru taraması — Genel Kültür ve Güncel Olaylar

13 Kasım 2026. Kullanıcı kararı: güncel olaylarda 2025 ve sonrasına dayanan sorular yayında
kalır; 2025 öncesine dayanan güncel olay soruları arşivlenir. Bu bir **ayıklama** işidir,
soru üretilmedi.

## Sonuç (13 Kas 2026, uygulandı)

Kullanıcı kararları (13 Kas 2026):
- A + B (115 soru) → **arşivlendi**.
- C1 kalıcı kilometre taşları (13 soru) → **yayında kalır**.
- C2 (IAC 2026, COP31, nüfus özellikleri, elektrikte yenilenebilir payı; 4 soru) → **arşivlendi**.

`soru-arsivle.ts --yaz` ile **119 soru arşivlendi**. Bu klasörde: yedek `arsiv-yedek.json`,
defter `ilerleme.jsonl`, liste `arsiv-listesi.json`, sorudan soruya karar `karar.json`.
Taze dökümle doğrulandı: arşivlenen 119 sorunun hiçbiri yayında değil.

| | önce | sonra |
|---|---|---|
| Yayındaki toplam soru | 8.083 | 7.964 |
| Genel Kültür ve Güncel Olaylar dersi | 851 | 732 |
| — Genel Kültür konusu | 730 | 614 |
| — Güncel ve Kültürel Olaylar konusu | 121 | 118 |

Güncel ve Kültürel Olaylar'da kalan 118 soru: 90'ı 2025–2026 olayı, 10'u resmî PAEM sınavı,
18'i 2025 öncesi tarihli ama kalıcı olgu (C1 kararıyla kalanlar ve tarih içermeyen
TUT'lar).

Arşivden sonra yayındaki GK'de kökünde 2010–2024 yılı geçen sorular tek tek okundu. Biri
dışında hepsi C1/TUT kararıyla kalanlar, kalıcı biyografiler, 2025+ olaylar ya da çıkmış
PAEM soruları. **Açık kalan tek soru: `acd9fcd4`** (Ara Güler, “17 Ekim 2018'de vefat eden”).
Arşivlenen `49e2c792`'nin ikizi, ama onaylı listede olmadığı için dokunulmadı.

Yayında kalan dört şıklı GK soruları (197) `dort-sikli-kalanlar.md` dosyasında; düzeltme ayrı karar.

---

*Aşağısı kuru çalışma raporu (onaydan önce).*

## Kapsam ve yöntem

- Yayındaki 8.083 sorunun 851'i “Genel Kültür ve Güncel Olaylar” dersinde (Genel Kültür 730,
  Güncel ve Kültürel Olaylar 121). Bu 851 sorunun **tamamı** 8 parçada okundu (ajan başına
  ~107 soru, başlık sayısıyla doğrulandı). Çıkan 165 adayın her biri ayrıca tek tek okunup
  sınıfı elle kesinleştirildi.
- Güncel bilgi taşıyabilecek diğer dersler (Protokol, Silah Bilgisi, İngilizce, İnkılap Tarihi)
  yıl, gelecek kipi ve “günümüzde” desenleriyle tarandı. Güncel olay sorusu çıkmadı; yalnız
  tarihî olgular ve dil soruları vardı.
- Hukuk derslerindeki mevzuat eskimesi bu turun kapsamı dışında kaldı (Doc 32 hattının işi).
- Güncel konusundaki Doc 35 sorularının kaynak etiketindeki olay tarihleri ayrıca sayıldı:
  121 sorunun 92'si 2025–2026 olayı, 10'u resmî PAEM sınavı, 19'u 2025 öncesi olay. Bu 19'un
  kökte tarihe dayananları C'de, tarih içermeyen kalıcı olguları TUT'ta.

## Özet

| Sınıf | Anlamı | Sayı | Önerilen işlem |
|---|---|---|---|
| A | 2025 öncesi güncel olay / gelecek kipi geçmişte kalmış | 105 | arşiv |
| B | eskimiş istatistik, statü, görevli kişi, sıralama (ya da cevap bugün yanlış) | 10 | arşiv (yeniden yazılabilir notuyla) |
| C | karar gerekiyor | 17 | kullanıcıya soruluyor |
| TUT | ajan işaretledi ama eskimemiş / kalıcı olgu | 28 | dokunulmaz |
| ÇIKMIŞ | resmî PAEM sınavı sorusu | 5 | dokunulmaz, yalnız rapor |

A kaynak kırılımı: eski göç (kaynaksız) 62, sınav kaynaklı 42, Doc 35 güncel üretimi 1. B: eski göç (kaynaksız) 5, sınav kaynaklı 5.
A+B (115) içinde dört şıklı: 31. Sınav kaynaklı olanlar
çıkmış PAEM değil; başka kurum sınavlarından (ÇMB, Misyon Koruma, MEB) bankaya alınmış sorular.

**Arşiv yolu:** `apps/api/scripts/soru-arsivle.ts` (Doc 32 deseni; panelin archive()
ucuyla aynı). Sürüm `archived` olur, soru soft-delete edilir, `currentVersionId` null olur.
Sürüm satırı silinmez, bu yüzden geçmiş deneme sonuçları ve sıralamalar bozulmaz. Yedek
`arsiv-yedek.json`'a, defter `ilerleme.jsonl`'a (bu klasör) yazılır. Liste:
`arsiv-listesi-AB.json`. **Geri alma:** `apps/api/scripts/arsiv-toplu-geri-al.ts --gerekce "…" <soru-id…> --yaz`.
Bu betik 5 şık şartı arar; dört şıklılar `arsiv-geri-al.ts <sürüm-id>` ile tek tek alınır.

**Yan etkiler:**
- Adaylardan 1'i (`d111840a`) açık bir denemede (Paem11-Deneme Sınavı1, serbest). Deneme soru
  seti sürüme bağlı olduğundan deneme etkilenmez, soruyu sunmaya devam eder.
- 31 aday geçmiş (kapanmış) denemelerde kullanıldı; sonuçlar korunur.
- Adayların 132'si GK ders testlerinde. Ders testleri yalnız yayındaki soruyu sunduğundan
  arşivlenen soru testten düşer ve ilgili testler kısalır. Yeni yayınlanan sorular ertesi
  sabah son teste eklenir, boşluklar doldurulmaz.

## C — karar bekleyenler (17)

**C1. “Kalıcı kilometre taşı” (2010–2024 olayı, cevap bugün de doğru).** Kökte bir tarihe ya da
tarihli bir olaya bağlılar ama bilgi eskimiyor (“ilk uçuş”, “ilk kadın general”, “ilk astronotun
görevi”). 2025 PAEM 9 resmî sınavı da Şubat 2024 KAAN ilk uçuşunu sordu, yani sınav önceki
yılların kilometre taşlarını da soruyor. Kararın lafzı (“güncel olaylarda 2025 öncesi
arşivlensin”) bunları da kapsıyor. Tarih içermeyen kardeşleri (KAAN 5. nesil, HÜRKUŞ,
MİLGEM ihracatı) TUT'ta kaldı.

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `74348dea` | Ağustos 2022’de terfi ederek Türk ordusundaki ilk kadın general ünvanına sahip olan komutan aşağıdakilerden hangisidir? |  Özlem Yılmaz | Ağustos 2022 olayı (ilk kadın general Özlem Yılmaz); "ilk" kalıcı, cevap doğru (4 şık) **(4 şık)** |
| `68bb9295` | Aşağıdaki bakanlıklardan hangisi yürürlükteki adını Ekim 2021’de yapılan düzenleme ile kullanmaya başlamıştır? |  Çevre, Şehircilik ve İklim Değişikliği  | Ekim 2021 bakanlık adı değişikliği; ad bugün de yürürlükte, cevap doğru |
| `eee946ea` | Türkiye Cumhuriyeti’nin ilk cumhurbaşkanı yardımcısı aşağıdakilerden hangisidir? |  Fuat Oktay | 2018 sistem değişikliği sonrası ilk Cumhurbaşkanı Yardımcısı (Fuat Oktay); "ilk" kalıcı, cevap doğru |
| `2fe32c20` | Türkiye’nin ilk silahlı insansız deniz aracı aşağıdakilerden hangisidir? |  ULAQ | 2021 olayı (ULAQ, ilk silahlı insansız deniz aracı); "ilk" kalıcı, cevap doğru |
| `f0663f16` | 30 Aralık 2010'da ilk uçuşunu gerçekleştiren, orta irtifa uzun havada kalışlı (MALE) sınıfındaki millî insansız hava aracı ve üreticisi hangisidir? |  ANKA — TUSAŞ | Güncel konusunda 2010 olayı (ANKA ilk uçuşu, tarih kökte); bilgi kalıcı ve doğru |
| `2ad68e27` | Yerli imkânlarla geliştirilip üretilen ilk genel maksat helikopteri olan T625 GÖKBEY, ilk uçuşunu hangi tarihte yapmıştır? |  6 Eylül 2018 | Güncel konusunda 2018 olayı (GÖKBEY ilk uçuş TARİHİNİ soruyor); kalıcı ve doğru |
| `5327d49d` | Millî Muharip Uçak KAAN ilk uçuşunu hangi tarihte gerçekleştirmiştir? |  21 Şubat 2024 | Güncel konusunda 2024 olayı (KAAN ilk uçuş tarihini soruyor); kalıcı ve doğru — aynı olgu çıkmış sorularda da var |
| `4bf59037` | Türkiye'nin ilk astronotu Alper Gezeravcı, Uluslararası Uzay İstasyonu'na hangi görev kapsamında gitmiştir? |  Axiom Mission 3 (Ax-3) | Güncel konusunda Ocak 2024 olayı (Gezeravcı, Ax-3); kalıcı ve doğru |
| `701272c4` | 19 Kasım 2024'te TCG ANADOLU'nun kısa pistinden kalkış ve iniş yaparak kısa pistli bir gemiden görev yapan dünyanın ilk silahlı insansız hava aracı… |  Bayraktar TB3 | Güncel konusunda Kasım 2024 olayı (TB3 dünya ilki); kalıcı ve doğru |
| `c8bc5653` | Havadan bağımsız tahrik sistemine sahip REİS sınıfının, Ağustos 2024'te Aksaz'da düzenlenen törenle Deniz Kuvvetleri Komutanlığına teslim edilen il… |  TCG PİRİREİS | Güncel konusunda Ağustos 2024 olayı (TCG PİRİREİS teslimi); kalıcı ve doğru |
| `597489b1` | Ocak 2022'de hizmete giren ve millî imkânlarla üretilen Türkiye'nin ilk istihbarat gemisi olma özelliğini taşıyan Test ve Eğitim Gemisi hangisidir? |  TCG UFUK | Güncel konusunda Ocak 2022 olayı (TCG UFUK, ilk istihbarat gemisi); kalıcı ve doğru |
| `cad1c942` | 14 Aralık 2022'de ilk uçuşunu gerçekleştiren, Türkiye'nin ilk insansız savaş uçağı hangisidir? |  Bayraktar KIZILELMA | Güncel konusunda Aralık 2022 olayı (KIZILELMA ilk uçuş); kalıcı ve doğru |
| `ba2ea6f2` | 15 Nisan 2023'te uzaya fırlatılan ve Türkiye'nin metre altı çözünürlüğe sahip ilk yerli yer gözlem uydusu olan uydu hangisidir? |  İMECE | Güncel konusunda Nisan 2023 olayı (İMECE fırlatma); kalıcı ve doğru |

**C2. Tek tek karar.**

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `e114c044` | Türkiye’nin nüfus özellikleriyle ilgili aşağıdakilerden hangisi yanlıştır? |  Tarım, istihdam oranı en yüksek olan se | Nüfus özellikleri (4 şık): D "erkek nüfus kadından fazla" son ADNKS’lerde hâlâ doğru mu teyit edilemedi; değiştiyse iki yanlış şık olur **(4 şık)** |
| `d2b02961` | Türkiye’nin elektrik üretiminde aşağıdaki yenilenebilir kaynaklardan hangisinin payı daha yüksektir? |  Akarsu | Elektrik üretiminde yenilenebilirler arasında en yüksek pay (yıl yok, 4 şık): akarsu uzun süre öndeydi; 2025 kuraklığında hidro payı düştü, rüzgâr/güneş büyüdü — güncel yıl verisiyle cevap teyit edilemedi **(4 şık)** |
| `a1cbf289` | Dünyanın en prestijli uzay etkinliklerinden biri sayılan 77. Uluslararası Astronotik Kongresi (IAC 2026), 5-9 Ekim 2026 tarihlerinde Türkiye'de han… |  Antalya | 2026 olayı (IAC 2026 Antalya) ama "düzenlenecektir" kipi geçmişte kaldı — arşiv yerine kip düzeltmesi ("düzenlenmiştir") önerilir |
| `34515d0e` | Birleşmiş Milletler İklim Değişikliği Çerçeve Sözleşmesi 31. Taraflar Konferansı (COP31) 9-20 Kasım 2026 tarihlerinde Türkiye'nin hangi ilinde düze… |  Antalya | 2026 olayı (COP31 Antalya, 9–20 Kasım) — 20 Kasım’dan sonra kip eskir; arşiv yerine kip düzeltmesi önerilir |

## A — 2025 öncesi güncel olay (105) → arşiv

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `088aa453` | 29 Eylül 2019 tarihinde İstanbul’da yapılan tören ile hizmete giren MİLGEM Projesi’nin 4. gemisi olan korvetin adı aşağıdakilerden hangisidir? |  TCG Kınalıada | 2019 MİLGEM 4. gemi (TCG Kınalıada) hizmete girişi; cevap bugün de doğru ama 2019 güncel olayı. **(4 şık)** |
| `dc837a4d` | İstanbul’un 29 Ekim 2018’de açılan üçüncü havalimanının adı aşağıdakilerden hangisidir? |  İstanbul Havalimanı | 29 Ekim 2018 açılışı; ad bugün de İstanbul Havalimanı, ama 2018 güncel olay çerçevesi. |
| `f696b05b` | “Yabancı dilde en iyi film” dalında Türkiye'nin 2019 OSCAR adayı aşağıdakilerden hangisidir? |  Ahlat Ağacı | 2019 Oscar adayı (Ahlat Ağacı); 2019 güncel olayı, açıklama da gelecek kipli. |
| `dc772b6e` | UNESCO Dünya Somut Olmayan Kültür Mirası Temsilî Listesi’ne Kasım 2018’de aşağıdaki kültürel varlıklarımızdan hangisi dahil olmuştur? |  Dede Korkut Mirası | Kasım 2018 UNESCO listesine Dede Korkut girişi; bugün de doğru ama 2018 olayı. |
| `cd109e21` | Ülkemizde 2019 yılı itibarıyla kaçıncı kalkınma planı uygulanacaktır? |  11 | '2019 itibarıyla uygulanacak' kalkınma planı (11.); bugün 12. Kalkınma Planı (2024-2028) uygulanıyor, kip ve dönem eskimiş. |
| `e199a055` | Türkiye’nin en büyük havalimanı olan İstanbul Havalimanı’ndan ilk uçuş aşağıdaki şehirlerden hangisine gerçekleştirilmiştir? |  Ankara | İstanbul Havalimanı ilk uçuşu (2018, Ankara); 2018 güncel olayı, bugün de doğru. |
| `05098a13` | Dünya Güreş Birliği (UWW) tarafından serbest stil 125 kiloda dünyanın en iyi güreşçisi olarak ilan edilen milli sporcumuz aşağıdakilerden hangisidir? |  Taha Akgül | UWW'nin Taha Akgül'ü 125 kg'da dünyanın en iyisi ilan etmesi; yıl verilmemiş (2015 civarı), dönemlik ödül, bugün geçerliliği belirsiz. |
| `32d9a8c7` | Birleşmiş Milletler 2019 yılını aşağıdakilerden hangisinin yılı olarak ilan etmiştir? |  Uluslararası Periyodik Tablo Yılı | BM'nin 2019'u Periyodik Tablo Yılı ilan etmesi; 2019 'yılın ... ilan edilmesi' olayı. |
| `4c636ff8` | Test uçuşu gerçekleştirilen Türkiye’nin ilk taarruzi insansız hava aracının adı aşağıdaki- lerden hangisidir? |  Akıncı | Akıncı test uçuşu (Aralık 2019) haberine dayanıyor; ayrıca 'ilk taarruzi İHA' ifadesi tartışmalı (silahlı TB2 daha önce). |
| `d2023c8c` | 3 - 4 Aralık 2019 tarihlerindeki NATO Zirvesi aşağıdaki ülkelerin hangisinde gerçekleştirilmiştir? |  İngiltere | 3-4 Aralık 2019 NATO Londra Zirvesi; 2019 güncel olayı. |
| `fd18e343` | Aşağıdakilerden hangisi sosyal bilimler alanında Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü’ne layık görülmüştür? |  Ahmet Yaşar OCAK | Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü (sosyal bilimler); 2019 ödülü. **(4 şık)** |
| `67543fd0` | Aşağıdakilerden hangisi "Müzik" alanında Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü’ne layık görülmüştür? |  Mazhar - fuat - özkan | Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü (müzik); 2019 ödülü. |
| `ea799b1c` | Ocak 2020’de hayatını kaybeden TEMA Vakfı kurucusu onursal başkanı Hayrettin KARACA Türkiye’nin ilk özel arboretumunu (Ağaç Parkı) aşağıdaki illerd… |  Yalova | Ocak 2020 Hayrettin Karaca vefatı haber çerçevesi; arboretumun Yalova'da olması bugün de doğru. |
| `b4f02775` | Türk Dili Konuşan Ülkeler 7. Zirvesi aşağıdaki şehirlerden hangisinde yapılmıştır? |  Bakü | Türk Dili Konuşan Ülkeler 7. Zirvesi (Bakü, 2019); kurum 2021'de Türk Devletleri Teşkilatı adını aldı, ad da eskimiş. |
| `b598d188` | 2020 Olimpiyat Oyunları aşağıdaki şehirlerden hangisinde düzenlenecektir? |  Tokyo | '2020 Olimpiyatları düzenlenecektir' gelecek kipi geçmişte kaldı (Tokyo 2021'de yapıldı). |
| `f758785c` | 2018 yılında Norveç’ten alınan ve Kocaeli Limanına ulaşan Türkiye’nin ilk sondaj gemisinin adı aşağıdakilerden hangisidir? |  Fatih | 2018'de alınan ilk sondaj gemisi Fatih; 2018 güncel olayı, bugün de doğru. |
| `13665ae4` | 2019 yılında piyasaya çıkan ve Türkiye’nin bor madeninden ürettiği yerli temizlik ürünü aşağıdakilerden hangisidir? |  BORON | 2019'da piyasaya çıkan BORON; 2019 güncel olayı. |
| `a48dac36` | 2019 başında Ay'a götürdüğü pamuk tohumlarının filizlenmesiyle birlikte ilk defa Ay’da pamuk yetiştiren ülke aşağıdakilerden hangisidir? |  Çin | 2019 başı Çin'in Ay'da pamuk filizlendirmesi; 2019 güncel olayı. |
| `469b7f62` | Kaldırım Serçesi, Keşanlı Ali Destanı oyunlarındaki rolleriyle tanınan 1998 yılında Kültür Bakanlığı tarafından "Devlet Sanatçısı" unvanı verilen A… |  Gülriz Sururi | Gülriz Sururi'nin Aralık 2018 vefatı; 2018 güncel olayı. |
| `7f876f23` | Zeugma Antik Kenti’nden yasa dışı yollarla ABD'ye kaçırılan ABD tarafından Kasım 2018’de Türkiye’ye teslim edilen eser aşağıdakilerden hangisidir? |  Çingene Kızı Mozaiği | Kasım 2018 Çingene Kızı Mozaiği parçalarının iadesi; 2018 güncel olayı. |
| `be8cb536` | A Millî Takımımızın EURO 2020’de rakipleriyle karşılaşacağı ülkeler ve şehirler aşağıdakilerden hangisidir? |  İtalya / Roma - Azerbaycan / Bakü | EURO 2020'de Milli Takımın rakip şehirleri (gelecek kipi); turnuva 2021'de oynandı, geçmişte kaldı. |
| `a81336ab` | 4. Dünya Göçebe Oyunları 2020 yılında aşağıdaki şehirlerimizden hangisinde gerçekleş tirilecektir? |  Bursa | '4. Dünya Göçebe Oyunları 2020'de gerçekleştirilecektir' gelecek kipi; oyunlar ertelenip 2022'de İznik/Bursa'da yapıldı. |
| `5c9fbef8` | 2019 yılında düzenlenen 47. Uluslararası Emmy Ödülleri’nde “Agâh Bey” rolüyle “En iyi Erkek Oyuncu” ödülünü kazanan Türk sanatçı aşağıdakilerden ha… |  Haluk Bilginer | 2019 47. Uluslararası Emmy (Haluk Bilginer); 2019 ödülü. |
| `febd84ed` | 2020 yılı için AB Konseyi dönem başkanları sırasıyla aşağıdakilerden hangisinde doğru olarak verilmiştir? |  Hırvatistan - Almanya | 2020 AB Konseyi dönem başkanları; dönemlik bilgi, geçmişte kaldı. |
| `a3d14a5d` | Millî Eğitim Bakanlığı tarafından öğretmen ve öğrencilerimize önerilen yönetmenliğini Aamir Khan’ın yaptığı film aşağıdakilerden hangisidir? |  3 Idiot | MEB'in Aamir Khan filmi önerisi tarihsiz bir eski haber; ne zamanki listeye dayandığı ve hâlâ geçerli olup olmadığı belirsiz. |
| `a7fdef7f` | 8. Dünya Para-Taekwondo Şampiyonası, 2019 yılında aşağıdaki ülkelerin hangisinde gerçekleştirilmiştir? |  Türkiye | 8. Dünya Para-Taekwondo Şampiyonası 2019 (Türkiye); 2019 spor organizasyonu. |
| `96f3b76f` | Avrupa Futbol Şampiyonası 2024’te hangi ülkede düzenlenecektir? |  Almanya | 'EURO 2024 hangi ülkede düzenlenecektir' gelecek kipi geçmişte kaldı (Almanya 2024). |
| `20ae2761` | 2018 yılında faaliyete giren İstanbul Havalimanından ilk yurt dışı tarifeli sefer aşağıdaki ülkelerden hangisine yapılmıştır? |  KKTC | İstanbul Havalimanı ilk yurt dışı tarifeli seferi (2018, KKTC); 2018 güncel olayı. |
| `b11f038e` | Yerli otomobilin tanıtımıyla birlikte açılış töreni gerçekleştirilen “Bilişim Vadisi” hangi şehrimizdedir? |  Kocaeli | Aralık 2019 yerli otomobil tanıtımı ile Bilişim Vadisi açılışı; Kocaeli bugün de doğru ama 2019 olayı. |
| `c9d20f48` | 47. Uluslararası Emmy Ödül Töreni’nde en iyi erkek oyuncu seçilen Türk oyuncumuz aşağıdakilerden hangisidir? |  Haluk Bilginer | 47. Uluslararası Emmy (2019) en iyi erkek oyuncu Haluk Bilginer; 2019 ödülü (5c9fbef8 ile mükerrer). |
| `e2bc91ee` | 2024 yılında yapılacak olan Avrupa Futbol Şampiyonası’na aşağıdaki ülkelerden hangisi ev sahipliği yapacaktır? |  Almanya | '2024'te yapılacak olan EURO ... ev sahipliği yapacaktır' gelecek kipi geçmişte kaldı (96f3b76f ile mükerrer). |
| `94143d7a` | 2019 Nobel Barış Ödülü aşağıdakilerden hangisine verilmiştir? |  Abiy Ahmed Ali | 2019 Nobel Barış Ödülü (Abiy Ahmed); 2019 ödülü. **(4 şık)** |
| `146b9bed` | 2020, Birleşmiş Milletler tarafından ne yılı olarak ilan edilmiştir? |  Farabi | 2020 yılına ait 'yılı ilan edilmesi' (UNESCO Farabi yılı) sorusu; 2025 öncesi güncel olay. |
| `4d5e205d` | 2024 yılında yaz olimpiyat oyunlarına ev sahipliği yapacak ülke aşağıdakilerden hangisidir? |  Fransa | Gelecek kipi: 2024 Paris Olimpiyatları yapıldı (Temmuz-Ağustos 2024); olay geçmişte kaldı. |
| `0f6e3240` | 2020 yılında uzaya gönderilmesi hedeflenen Türkiye’nin ilk millî haberleşme uydusunun adı aşağıdakilerden hangisidir? |  Türksat 6A | 2020'de gönderilmesi hedeflenen Türksat 6A; uydu Temmuz 2024'te fırlatıldı, gelecek kipi eskidi. |
| `b65891b9` | Ülkemizde 2019 – 2023 yılları arasında kaçıncı kalkınma planı uygulanacaktır? |  11 | 2019-2023 dönemi için 'uygulanacaktır'; 11. plan bitti, şu an 12. Kalkınma Planı (2024-2028) yürürlükte. |
| `9bb274ad` | 2019 yılında NASA’nın parçalarını birleştirdiği ve Hubble Uzay Teleskobu’nun devamı niteliğinde olan uzay teleskobu aşağıdakilerden hangisidir? |  James Webb | 2019 NASA montaj haberi; James Webb 2021'de fırlatıldı. Cevap doğru ama 2019 güncel olayı. **(4 şık)** |
| `828205aa` | Cumhurbaşkanı Recep Tayyip Erdoğan’ın 2017 Aralık ayında gerçekleştirdiği ziyaret kapsamında restore edilmesini istediği ve TİKA tarafından çalışma… |  Sudan | 2017 Aralık ziyareti/TİKA restorasyonu güncel olayı; cevap (Sudan) doğru. E şıkkı 'Bükreş' ülke değil. |
| `8aa03efa` | 36.Türksoy Daimi Konseyi dönem toplantısı sonucunda 2019 yılı Türk Dünyası Kültür Başkenti seçilen şehir aşağıdakilerden hangisidir? |  Oş | 2019 Türk Dünyası Kültür Başkenti (Oş) — 2025 öncesi güncel olay. |
| `7f7a7d9d` | Haziran 2020’de yapılan G-20 zirvesine ev sahipliği yapan ülke aşağıdakilerden hangisidir? |  Suudi Arabistan | G-20 2020 zirvesi; zirve Haziran'da değil Kasım 2020'de sanal yapıldı (açıklama da gelecek kipli). 2025 öncesi güncel olay. |
| `580be93b` | 2020 Yaz Olimpiyatları aşağıdaki şehirlerden hangisinde yapılacaktır? |  Tokyo | 2020 Yaz Olimpiyatları 'yapılacaktır'; Tokyo'da 2021'de yapıldı, gelecek kipi eskidi. |
| `1991e9be` | 17 - 27 Eylül 2019 tarihleri arasında Birleşmiş Milletler’in kaçıncı Genel Kurul toplantısı ger- çekleştirilmiştir? |  74 | Eylül 2019 BM 74. Genel Kurulu — 2025 öncesi güncel olay. |
| `d786b4f5` | 9 Aralık 2019 tarihinde yanardağ patlaması sonucu bir grup turistin hayatını kaybettiği White Island (Beyaz Ada) aşağıdaki ülkelerin hangisine aittir? |  Yeni Zelanda | 9 Aralık 2019 White Island patlaması — 2025 öncesi güncel olay; cevap (Yeni Zelanda) doğru. |
| `85f72763` | Aşağıdakilerden hangisi "Vefa" alanında Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü’ne layık görülmüştür? |  Ahmet Haluk DURSUN | Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü (Vefa) — 2025 öncesi ödül. |
| `44c91194` | 2015 yılında UNESCO’nun Dünya Miras Geçici Listesi’ne alınan Eshab-ı Kehf hangi şehrimizdedir? |  Kahramanmaraş | 2015'te UNESCO geçici listesine alınma; bugün de doğru (Kahramanmaraş) ama 2015 güncel olayına dayanıyor. |
| `74dc9892` | EXPO 2021 hangi ilimizde yapılacaktır? |  Hatay | EXPO 2021 Hatay 'yapılacaktır'; deprem/ertelemelerle 2023'te yapıldı, gelecek kipi eskidi. |
| `5fb6d19c` | 2019’da Çin tarafından Ay’da ilk kez yetiştirilen ürün aşağıdakilerden hangisidir? |  Pamuk | 2019 Chang'e 4 pamuk filizlendirme — 2025 öncesi güncel olay. |
| `a392ef09` | 2019 Eylül’de Resmî Gazete’ de yayımlanan kesin korunacak hassas alanlardan “Özlüce Doğal Sit Alanı" hangi ilimizdedir? |  Muğla | Eylül 2019 Resmî Gazete kesin korunacak hassas alan ilanı — 2025 öncesi güncel olay. |
| `e5abd963` | 2020’de düzenlenecek olan “Yaz Olimpiyatları" aşağıdaki şehirlerin hangisinde düzenlenecektir? |  Tokyo | 2020 Olimpiyatları 'düzenlenecektir'; 2021'de Tokyo'da yapıldı, gelecek kipi eskidi (580be93b ile mükerrer). |
| `986ca754` | Aşağıdakilerden hangisi "Sinema" alanında Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü’ne layık görülmüştür? |  Mesut Uçakan | Cumhurbaşkanlığı 2019 Kültür ve Sanat Büyük Ödülü (Sinema) — 2025 öncesi ödül. |
| `661fa026` | Resmi Gazete’de yayımlanan cumhurbaşkanı kararıyla Suriye’nin Azez, El Bab ve Afrin kentlerinde aşağıdaki üniversitelerimizden hangisine bağlı olar… |  Gaziantep Üniversitesi | 2018 Cumhurbaşkanı kararıyla Suriye'de 'kurulacak' fakülteler; gelecek kipi eskidi, 2024 sonrası Suriye'deki değişimle güncelliği belirsiz. |
| `9f5aaa73` | Interpol’ün 90. Genel kurul toplantısı 2021 yılında aşağıdaki ülkelerden hangisinde yapılacaktır? |  Türkiye | Interpol 90. Genel Kurulu 2021 'yapılacaktır'; Kasım 2021 İstanbul'da yapıldı. Açıklama alanı da uygunsuz ('favorilere ekleyin'). |
| `b1c1b8e9` | 2019 Yılı "Avrupa Kültür Başkent"i olarak ilan edilen şehir/ülke aşağıdakilerden hangisinde doğru olarak verilmiştir? |  Plovdiv (Bulgaristan) - Matera (İtalya) | 2019 Avrupa Kültür Başkentleri — 2025 öncesi güncel olay. |
| `cd022ed1` | 2017 Yılında şehit cenazelerinde çalınması kararlaştırılan “Segah Tekbiri” kime aittir? |  Mustafa Itri | 2017'de şehit cenazelerinde Segah Tekbiri kararı; besteci (Itri) bilgisi kalıcı ama soru 2017 güncel olayına dayanıyor. |
| `e4b17e66` | 2021 İslami Dayanışma Oyunları hangi ülkede yapılacaktır? |  Türkiye | 2021 İslami Dayanışma Oyunları 'yapılacaktır'; Konya'da Ağustos 2022'de yapıldı, gelecek kipi eskidi. |
| `102cba8c` | 5. İslami Dayanışma Oyunlarının 2021 yılında aşağıdaki şehirlerin hangisinde düzenlenmesi kararlaştırılmıştır? |  Konya | 5. İslami Dayanışma Oyunları 2021 Konya kararı; oyunlar 2022'de yapıldı, açıklama gelecek kipli (e4b17e66 ile mükerrer). |
| `45fabfd8` | Kasım 2018’de Birinci Dünya Savaşı’nın 100. yıl dönümü anması için yaklaşık yetmişe yakın devlet ve hükümet başkanının katıldığı toplantı aşağıdaki… |  Fransa - Paris | Kasım 2018 I. Dünya Savaşı 100. yıl anması (Paris) — 2025 öncesi güncel olay. |
| `8bdde51c` | “Kim Milyoner Olmak ister" yarışmasında Mehmet Akif Ersoy’un yazdığı on kıtadan oluşan İstiklal Marşı nda Vatan, Kan, Toprak ve Yurt kelimele rinde… |  Arda Ayten | Kim Milyoner Olmak İster'de ilk bir milyon (2018, Arda Ayten) — 2025 öncesi güncel olay; 'ilk' olduğu için cevap hâlâ doğru. |
| `0c316fd5` | Türk Silahlı Kuvvetleri tarafından 9 Ekim 2019 tarihinde Fırat'ın doğusuna düzenlediği harekâtın adı nedir? |  Barış Pınarı | 9 Ekim 2019 Barış Pınarı Harekâtı — 2025 öncesi güncel olay; cevap doğru. |
| `8c87520b` | Aşağıdakilerden hangisi diğerlerinden önce gerçekleşmiştir? |  Aziz Sancar’ın Nobel Kimya Ödülü’nü kaz | 2015-2024 arası güncel olayların sıralamasına dayanan güncel olay sorusu; cevap (Aziz Sancar 2015) bugün de doğru ama bütün olaylar 2025 öncesi. |
| `e6efcb54` | UNESCO 2021 yılı Dünya Kitap Başkenti olarak ilan edilen kent aşağıdakilerden hangisidir? |  Tiflis | 2021 yılı UNESCO Dünya Kitap Başkenti (Tiflis) güncel olayı; cevap doğru ama 2025 öncesi. |
| `ee2b638e` | “Ölmeye Yatmak, Bir Düğün Gecesi, Fikrimin İnce Gülü” gibi romanları yazan ve 14 Temmuz 2020’de vefat eden Türk edebiyatının önemli yazarı aşağıdak… |  Adalet Ağaoğlu | 2020 vefat haberi üzerine kurulu güncel olay sorusu (Adalet Ağaoğlu); cevap doğru. Yazar-eser kısmı kalıcı, vefat ifadesi çıkarılırsa kalıcı soruya dönüşebilir. |
| `e6532c6b` | 1998 yılında Devlet Sanatçısı unvanını alan, 6 Kasım 2020’de hayatını kaybeden ünlü Türk piyanist ve besteci aşağıdakilerden hangisidir? |  Timur Selçuk | 2020 vefat haberine dayanan güncel olay sorusu (Timur Selçuk); cevap doğru ama 2025 öncesi. |
| `ff0ad696` | Astrofizikte çekim alanı her türlü maddesel oluşumun ve ışınımın kendisinden kaçmasına izin vermeyecek derecede güçlü olan ve 2019 yılında ilk defa… |  Kara delik | 2019'da ilk kez fotoğraflanan kara delik güncel bilim haberi; cevap doğru. Tanım kısmı kalıcı, 2019 vurgusu güncel olay. |
| `c64d619c` | İbrahim Çolak, Ferhat Arıcan, Mert Efe Kılıçer ve Bora Tarhan’ın ülkemizi 7 madalya ile başarıyla temsil ettiği, 2020 Aralık ayında düzenlenen Avru… |  Mersin | 2020 Aralık Avrupa Erkekler Artistik Cimnastik Şampiyonası (Mersin) spor olayı; 2025 öncesi. |
| `12521c5d` | Aşağıdaki şehirlerin hangisi bir saatte en fazla fidan dikme dünya rekoruna sahiptir? |  Çorum | 2019 dolayında Çorum'da kırılan rekora dayanan güncel olay; 'sahiptir' şimdiki kipi rekorun sonradan kırılmış olabileceği riskini taşır, güncelliği teyitsiz. |
| `1dc3603e` | Birleşmiş Milletler 75. Genel Kurul Başkanı aşağıdakilerden hangisidir? |  Volkan Bozkır | 2020-2021 dönemi BM 75. Genel Kurul Başkanlığı (Volkan Bozkır) güncel olayı; cevap doğru ama 2025 öncesi atama. |
| `286c18fc` | Türkiye’nin 2020 Turizm Yılı teması olan antik kent aşağıdakilerden hangisidir? |  Patara | '2020 Patara Yılı' ilanı; 2025 öncesi 'yılın ... ilan edilmesi' türü güncel olay. |
| `2d17b05b` | Türkiye’nin Akdeniz’de deniz yetki alanlarının sınırlandırılması için 2020 yılında antlaşma yaptığı ülke aşağıdakilerden hangisidir? |  Libya | Türkiye-Libya deniz yetki alanları mutabakatı güncel olayı; ayrıca mutabakat Kasım 2019'da imzalandı (yürürlük Aralık 2019), kökteki '2020' ifadesi de kusurlu. |
| `87110943` | 2020 yılı Oscar ödüllerinde en iyi film kategorisinde verilen ödülü aşağıdakilerden hangisi almıştır? |  Parazit | 2020 Oscar en iyi film (Parazit) ödül olayı; cevap doğru ama 2025 öncesi. |
| `b08ee1c6` | Mete Gazoz’un, erkekler bireysel alanında altın madalya kazandığı 2023 Dünya Okçuluk Şampiyonası aşağıdaki ülkelerin hangisinde düzenlenmiştir? |  Almanya | 2023 Dünya Okçuluk Şampiyonası (Berlin) spor olayı; 2025 öncesi. **(4 şık)** |
| `bd1cd62b` | 2020 yılında Budapeşte’de düzenlenen Uluslararası Yüzme Ligi’nde erkekler yüz metre kurbağalamada Avrupa rekoru kırarak birinci olan millî yüzücümü… |  Hüseyin Emre Sakçı | 2020 ISL Budapeşte rekoru (Hüseyin Emre Sakçı) spor olayı; 2025 öncesi. |
| `82ada80d` | 2021 yılı Mart ayında dev bir konteyner gemisinin sıkışmasıyla Akdeniz ve Kızıldeniz arasındaki ulaşımın bir süre aksadığı kanal aşağıdakilerden ha… |  Süveyş | Mart 2021 Ever Given / Süveyş Kanalı olayı; 2025 öncesi güncel olay. **(4 şık)** |
| `c6151edc` | 2022 FİFA Dünya Kupası finali hangi ülkeler arasında oynanmıştır? |  Fransa - Arjantin | 2022 Dünya Kupası finali (Fransa-Arjantin) spor turnuvası; 2025 öncesi. |
| `82a60e4d` | Ukrayna işgali süreciyle Mart 2022’de Rusya’nın aşağıdaki uluslararası kuruluşlardan hangisine üyeliği sona ermiştir? |  Avrupa Konseyi | Mart 2022 Rusya'nın Avrupa Konseyi'nden çıkarılması güncel olayı; cevap doğru ama 2025 öncesi. |
| `54416e4f` | “Terminatör, Aliens ve Abbsy” gibi bilim kurgu filmlerinin yönetmenliğini yaptı. 1997 yılında yönettiği “Titanic” filmi en iyi yönetmen dâhil 11 da… |  James Cameron | 2022 vizyonuna dayanan 'Son olarak 16 Aralık 2022'de ... Avatar: Suyun Yolu' ifadesi bugün yanlış (Aralık 2025'te Avatar: Ateş ve Kül çıktı); cevap James Cameron hâlâ doğru. Ayrıca 'Abbsy' yazım hatası (The Abyss). |
| `1007e3e7` | Aşağıdakilerden hangisine 2021 Cumhurbaşkanlığı Kültür ve Sanat Büyük Ödülleri sinema alanında verilmiştir? |  Cüneyt Arkın | 2021 ödülüne dayanan güncel olay sorusu (Cüneyt Arkın). Cevap tarihsel olarak doğru ama olay 2025 öncesi. |
| `14477605` | Aşağıdakilerden hangisi 2022 yılında İstanbul’da gerçekleşen Büyük Kadınlar Dünya Boks Şampiyonası’nda takım hâlinde şampiyon olmuştur? |  Türkiye | 2022 spor turnuvası sonucu; 2025 öncesi güncel olay. |
| `183f5293` | Aşağıdakilerden hangisi 2022 yılında “En İyi Film” dalında Oscar ödülünü almıştır? |  Coda | 2022 Oscar ödülü (Coda); 2025 öncesi güncel olay. |
| `c994d53e` | Aşağıdaki şehirlerden hangisi TÜRKSOY tarafından 2020 Türk Dünyası Kültür Başkenti olarak seçilmiştir? |  Hive | 2020 yılı kültür başkenti seçimi (2019 kararı); 2025 öncesi güncel olay. Cevap tarihsel olarak doğru (Hive). |
| `49e2c792` | Ekim 2018’de hayatını kaybeden, İstanbul fotoğraflarıyla hafızalara kazınan, dünyaca ünlü birçok kişiyi fotoğraflayan ‘“İstanbul’un Gözü” lakaplı f… |  Ara Güler | Ekim 2018 vefat haberine dayanan güncel olay sorusu; cevap (Ara Güler) doğru ama 2018 olayı. |
| `89626bfd` | “Kudüs Şairi” olarak bilinen, Necip Fazıl Saygı Ödülü’nün ilkini alan, yazarlığı boyunca en çok tercih ettiği müstear isim “Ebubekir Sonumut” olan … |  Nuri Pakdil | 18 Ekim 2019 vefatına dayanan güncel olay sorusu; cevap (Nuri Pakdil) doğru ama 2019 olayı. |
| `12b2761d` | 2022 yılı Nobel Edebiyat Ödülü’nü aşağıdaki yazarlardan hangisi almıştır? |  Annie Ernaux | 2022 ödülü; 2025 öncesi güncel olay. Cevap (Annie Ernaux) doğru. Kaynak 16 Nisan 2023 Misyon Koruma sınavı. **(4 şık)** |
| `5d37fa7c` | FIFA tarafından yüzyılın oyuncusu seçilen ve 2022 yılında vefat eden Brezilyalı futbolcu aşağıdakilerden hangisidir? |  Pele (Edson Arantes do Nascimento) | 2022 vefat haberine dayanıyor; cevap (Pele) doğru. Kaynak 2023 Misyon Koruma sınavı. **(4 şık)** |
| `6a043b67` | Aşağıdaki ülkelerden hangisi 2022 yılında NATO’ya tam üye olmak için başvurmuştur? |  Finlandiya | 2022 başvurusu; Finlandiya Nisan 2023'te üye oldu (İsveç de 2022'de başvurmuştu, 2024'te üye). Cevap tarihsel olarak doğru ama 2025 öncesi olay. **(4 şık)** |
| `c49e3ffd` | Tıp dünyasının en önemli ödülleri arasında kabul edilen “Paul Ehrlich ve Ludwig Darmstaedter Ödülü”nü 2022 yılında Almanya’da alan bilim insanı aşa… |  Uğur Şahin | 2022 ödülü; 2025 öncesi güncel olay. Cevap (Uğur Şahin) doğru. **(4 şık)** |
| `2edbc0f2` | 2022 Cumhurbaşkanlığı Kültür ve Sanat Büyük Ödülleri kapsamında “Vefa Ödülü” aşağıdakilerden hangisine verilmiştir? |  Âşık Veysel Şatıroğlu | 2022 ödülü; 2025 öncesi güncel olay. Cevap tarihsel olarak doğru. **(4 şık)** |
| `c1dc39d3` | 2022 yılında düzenlenen 94. Oscar ödül töreninde “En İyi Film Ödülü” aşağıdakilerden hangisine verilmiştir? |  Coda | 2022 Oscar töreni; 2025 öncesi güncel olay. Cevap (CODA) doğru. **(4 şık)** |
| `c63609db` | Avrupa Birliği 2022 yılında aşağıdaki ülkelerden hangisine “aday ülke” statüsü vermiştir? |  Ukrayna | Haziran 2022 kararı; 2025 öncesi güncel olay. Cevap (Ukrayna) doğru; Moldova da aynı tarihte aday oldu. **(4 şık)** |
| `bacf00d9` | 2022 Cumhurbaşkanlığı Kültür ve Sanat Büyük Ödülleri kapsamında “tiyatro” alanındaki ödül aşağıdakilerden hangisine verilmiştir? |  Ayla Algan | 2022 ödülü; 2025 öncesi güncel olay. Cevap (Ayla Algan) tarihsel olarak doğru. **(4 şık)** |
| `4a04fde8` | 2023 Dünya Serbest Dalış Kupası’nda sabit ağırlıkla 100 metreye dalarak Türkiye rekorunu kıran Şahika Ercümen’in bu dalışını gerçekleştirdiği yer a… |  Bahamalar | 2023 spor rekoru/turnuvası; 2025 öncesi güncel olay. Cevap (Bahamalar) tarihsel olarak doğru; rekor sonradan kırılmış olabilir. |
| `8f6a254a` | 2015 Antalya Film Festivali’nde “Yaşam Boyu Onur Ödülü” ne layık görülen ve Ocak 2019’da vefat eden Yeşilçam’ın unutulmaz efsanevi oyuncusu kimdir? |  Ayşen Gruda | 2015 ödülü ve Ocak 2019 vefatına dayanan güncel olay; cevap (Ayşen Gruda) doğru. **(4 şık)** |
| `9c43451d` | Zeytin çekirdeğinden biyoplastik üreterek dünyanın en başarılı 10 genci arasına giren mühendisimiz aşağıdakilerden hangisidir? |  Duygu Yılmaz | Yaklaşık 2019 tarihli bir ödül haberine (JCI TOYP) dayanan güncel olay sorusu; cevap (Duygu Yılmaz) tarihsel olarak doğru. **(4 şık)** |
| `87be7db9` | Aşağıdaki ülkelerden hangisinde sanal gerçeklik teknolojisi kullanılarak bir anne 2016 yılında kaybettiği kızının sanal görüntüsüyle konuşmuştur? |  Güney Kore | 2020 başında çıkan bir haber olayına dayanıyor; cevap (Güney Kore) doğru ama 2025 öncesi güncel olay. **(4 şık)** |
| `0b6833fa` | Haziran 2020’de hayatını kaybeden “Önce Alış-Veriş Sonra Fiş” sloganıyla seksenli yıllara damgasını vuran reklam, tiyatro ve dizi oyuncumuz aşağıda… |  Ayşegül Atik | Haziran 2020 vefat haberine dayanıyor; cevap (Ayşegül Atik) doğru. **(4 şık)** |
| `0fddf087` | TÜRKSOY Daimi Konseyi tarafından 2020 Türk Dünyası Kültür Başkenti olarak ilan edilen şehir aşağıdakilerden hangisidir? |  Hive | 2020 kültür başkenti; 2025 öncesi güncel olay. Cevap (Hive) doğru; c994d53e ile aynı içerik (mükerrer). **(4 şık)** |
| `c51abd2b` | Dünya buğday piyasasında 2021 yılının en fazla buğday ihracatını yapan ülke aşağıdakilerden hangisidir? |  Rusya | 2021 yılı ihracat istatistiğine dayanan güncel soru; cevap (Rusya) o yıl için doğru ve bugün de lider olabilir ama 2025 öncesi istatistik. |
| `5a6abe78` | Aşağıdakilerden hangisi 2022 UNESCO Anma ve Kutlama Yıl Dönümleri arasına alınmıştır? |  Süleyman Çelebi’nin Vefatının 600. Yıl  | 2022 UNESCO anma yılı listesi; 2025 öncesi güncel olay. Cevap o yıl için doğru. |
| `5aec789d` | Türkiye’de denize dolgu yapılarak inşa edilen ve 2022 yılında açılışı yapılan havalimanı aşağıdakilerden hangisidir? |  Rize-Artvin | 2022 açılışlı proje (Rize-Artvin); cevap bugün de doğru ama 2022 güncel olayı. |
| `3ce9d484` | Aşağıdakilerden hangisi Temmuz 2023’te hayatını kaybeden ünlü müzisyen ve oyuncu Özkan Uğur’un rol aldığı filmlerden değildir? |  Hokkabaz | Asıl bilgi (filmografi) kalıcı ve cevap doğru; ancak kök 2023 güncel olayına (vefat) dayanıyor. Arşivlenip arşivlenmeyeceği kullanıcıya. **(4 şık)** |
| `40acbf63` | 2019 Mart ayında başkentinin ismini değiştiren ülke aşağıdakilerden hangisidir? |  Kazakistan | 2019 olayı (Astana -> Nur-Sultan); Eylül 2022'de ad yeniden Astana yapıldı, soru yanıltıcı hâle geldi. **(4 şık)** |
| `0fa9f8be` | Ocak 2020’de geçirdiği helikopter kazasında hayatını kaybeden Kobe Bryant aşağıdaki şehirlerin hangisine ait basketbol takımında efsaneleşmiştir? |  Los Angeles | Ocak 2020 güncel olayına (ölüm haberi) dayanıyor; cevap (Los Angeles Lakers) bugün de doğru ama olay 2025 öncesi. **(4 şık)** |
| `98e26ab2` | Eylül 2022’de profesyonel kariyerini sonlandırdığını duyuran dünyaca ünlü tenisçi aşağıdakilerden hangisidir? |  Roger Federer | Eylül 2022 güncel spor olayı (Federer'in emekliliği); cevap doğru ama olay 2025 öncesi. **(4 şık)** |
| `9093be9a` | Türkiye’de radyo ve televizyon yayıncılığının gelişmesine önemli katkıda bulunmuş bir radyo ve televizyon sunucusudur. Olimpiyatlar ve büyük ulusla… |  Halit Kıvanç | Kök 25 Ekim 2022 vefat haberine (Halit Kıvanç) dayanan güncel olay sorusu; cevap doğru ama olay 2025 öncesi. **(4 şık)** |
| `51d00846` | TUSAŞ'ın yüksek faydalı yük kapasiteli, sınıfının en uzun havada kalabilen insansız hava aracı olan ve Kasım 2023'te millî TEI-PD170 motoruyla 30 b… |  AKSUNGUR | Kasım 2023 test uçuşu güncel olayına ve 'sınıfının en uzun havada kalan' sıralama iddiasına dayanıyor; olay 2025 öncesi, sıralama iddiası da eskiyebilir. |

## B — eskimiş veri / statü (10) → arşiv

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `d111840a` | Aşağıdakilerden hangisi UNESCO tarafından yaratıcı şehirler ağına seçilen illerimizden biri değildir? |  Şanlıurfa | UNESCO Yaratıcı Şehirler listesi her turda değişiyor; "seçilen illerden biri değildir" cevabı doğrulanamıyor (4 şık) **(4 şık)** |
| `d8326dfd` | 31 Aralık 2019 tarihinde Türkiye İstatistik Kurumu tarafından açıklanan adrese dayalı nüfus kayıt sistemi sonuçlarına göre en az nüfusa sahip olan … |  Tunceli | ADNKS 2019; bugün en az nüfuslu il Tunceli değil (Bayburt). Güncel ADNKS ile aynı kalıpta yeniden yazılabilir |
| `721bbf94` | Aşağıdakilerden hangisi G8 ülkelerinden biri değildir? |  Çin | G8 2014’te G7’ye döndü; kavram eskimiş (4 şık). G7 kalıbıyla yeniden yazılabilir **(4 şık)** |
| `f3bdd8e6` | Rize-Erzurum arasında bulunan Türkiye’nin en uzun tüneli aşağıdakilerden hangisidir? |  Ovit Tüneli | Cevap bugün YANLIŞ: 2023’te açılan Zigana Tüneli (~14,5 km) Ovit’i (~14,3 km) geçti ve şıklarda var |
| `8b458f1e` | Türkiye Cumhuriyeti’nin de üye olduğu, Türk dilini konuşan ülkelerle iş birliğini gerçekleştirmeyi amaçlayan uluslararası örgüt aşağıdakilerden han… |  Türk İşbirliği Kalkınma Ajansı | Türk dili konuşan ülkelerin örgütü bugün Türk Devletleri Teşkilatı; işaretli TİKA örgüt değil, "İslam Konferansı Örgütü" adı da eski |
| `1106524d` | Minyatür Sanatçısı olarak Unesco Yaşayan İnsan Hazinesi ödülü alan ve kayıtlı yirmi dokuz yaşayan insan hazinesinden biri olan sanatçımız aşağıdaki… |  Cahide Keskiner | "Kayıtlı yirmi dokuz yaşayan insan hazinesi" sayısı eskiyen istatistik (4 şık); sayısız yeniden yazılabilir **(4 şık)** |
| `06ddfc6f` | Aşağıdaki ülkelerden hangisi Türk Konseyi’ne en son katılmıştır? |  Özbekistan | "Türk Konseyi’ne en son katılan" — kurum 2021’de Türk Devletleri Teşkilatı oldu, "en son" göreli (4 şık) **(4 şık)** |
| `e1095ad7` | Türkiye İstatistik Kurumu ( TUİK ) verilerine göre 2019 yılında Türkiye yaş ortalaması kaçtır? |  32,4 | TÜİK 2019 yaş ortalaması; değer bugün farklı. Güncel veriyle yeniden yazılabilir (4 şık) **(4 şık)** |
| `9cf3cae2` | Aşağıdakilerden hangisi Türkiye İstatistik Kurumunun 2022 yılı Adrese Dayalı Nüfus Kayıt Sistemi verilerine göre, en fazla nüfusa sahip ilk on il a… |  Kayseri | 2022 ADNKS sıralaması (4 şık); güncel ADNKS ile yeniden yazılabilir **(4 şık)** |
| `7a1d4b94` | Birleşmiş Milletler Genel Sekreterliği görevini 1 Ocak 2017’den bu yana sürdüren siyaset insanı aşağıdakilerden hangisidir? |  Antonio Guterres | "1 Ocak 2017’den bu yana sürdüren" — Guterres’in dönemi 31 Aralık 2026’da bitiyor; 7 hafta sonra yanlış olacak (4 şık) **(4 şık)** |

## TUT — eskimemiş (28) → dokunulmaz

Bazılarında eskime dışında kalite notu var (yazım, açıklama); bu turda düzeltilmedi.

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `c570a445` | Şair Ceketli Çocuk” olarak da bilinen ve genç yaşta kansere yenik düşerek aramızdan ayrılan ünlü sanatçımız aşağıdakilerden hangisidir? |  Kâzım Koyuncu | Kâzım Koyuncu lakabı — kalıcı kültür bilgisi, güncel olay değil |
| `b817fdb1` | "Hücrelerin hasarlı DNA’yı nasıl onardıkları ve genetik bilgiyi nasıl koruduklarını moleküler düzeyde belirleme” alanındaki çalışmalarından dolayı … |  Aziz Sancar | Aziz Sancar 2015 Nobel Kimya — kalıcı olgu (tarihî bilgi) |
| `6498673b` | Türkiye’nin Otomobili Girişim Grubu (TOGG) CEO’su aşağıdakilerden hangisidir? |  Mehmet Gürcan KARAKAŞ | M. Gürcan Karakaş bugün de TOGG CEO’su (görevli kişi, izlenmeli; 4 şık) **(4 şık)** |
| `facc5c8c` | MTA verilerine göre ülkemizde bilinen rezervi en az olan maden aşağıdakilerden hangisidir? |  Bakır | MTA rezerv karşılaştırması; zamana bağlı olay değil (soru kalitesi ayrı konu) |
| `529192ec` | Dünya’da bağımsızlığını ilan eden son ülke aşağıdakilerden hangisidir? |  Güney Sudan | Güney Sudan bugün de bağımsızlığını ilan eden son BM üyesi; açıklamadaki "Kuzey Sudan" ifadesi hatalı (not) |
| `a831ca20` | Cumhuriyet tarihinin en büyük camisi olarak gösterilen yapı aşağıdakilerden hangisidir? |  Çamlıca Cami | Çamlıca hâlâ Cumhuriyet döneminin en büyük camisi |
| `33151045` | Avrupa’nın en büyük, Türkiye’nin ilk Tropikal Kelebek Bahçesi hangi şehirdedir? |  Konya | Konya Tropikal Kelebek Bahçesi — "ilk" kalıcı |
| `c8ea1050` | Türkiye’nin ilk ve tek sokak karnavalı “Portakal Çiçeği” aşağıdaki illerimizden hangisinde düzenlenmektedir? |  Adana | Portakal Çiçeği Karnavalı (Adana) — kalıcı |
| `8865d015` | UNESCO Dünya Mirası asil listesinde yer alan dünyanın en büyük Türk ~ İslam Mezarlığı olan Ahlat Selçuklu Mezarlığı hangi ilimizin sınırları içeris… |  Bitlis | Cevap (Bitlis) doğru; kökteki "UNESCO asıl liste" iddiası hatalı (geçici liste) — kalite notu, eskime değil |
| `4f276c8f` | Formula 1 tarihinde en çok yarış (Grand Prix) kazanan pilot aşağıdakilerden hangisidir? |  Lewis Hamilton | Hamilton bugün de en çok GP kazanan pilot (izlenmeli) |
| `92c2c2df` | Aşağıdaki ülkelerden hangisi Avrupa Birliği’ne “aday ülke” statüsünde değildir? |  Malta | AB aday statüsü: Arnavutluk/Ukrayna/Karadağ aday, Malta üye — bugün doğru (4 şık, izlenmeli) **(4 şık)** |
| `8bdeba00` | Aşağıdakilerden hangisi Türkiye’nin UNESCO dünya mirası geçici listesindedir? |  Assos Arkeolojik Alanı | Assos hâlâ UNESCO geçici listesinde (izlenmeli) |
| `23d22366` | Aşağıdakilerden hangisi İslam İşbirliği Teşkilatı gözlemci ülkelerinden biri değildir? |  Surinam | İİT gözlemci statüleri bugün de doğru (izlenmeli) |
| `18ef33ee` | Aşağıdakilerden hangisi, Ekonomik İşbirliği ve Kalkınma Örgütü (OECD) tarafından üçer yıllık dönemler hâlinde, 15 yaş grubundaki öğrencilerin kazan… |  PISA | PISA cevabı doğru; döngünün 2025 sonrası dört yıla çıkması "üçer yıllık" ifadesini ileride eskitebilir |
| `fb4302f5` | Ekonomik Kalkınma ve İşbirliği Örgütü (OECD) eğitim ve beceriler direktörü aşağıdakilerden hangisidir? |  Andreas Schleicher | Andreas Schleicher bugün de OECD eğitim direktörü (görevli kişi, izlenmeli) |
| `c9ce29e4` | Aşağıdakilerden hangisi vatandaşları tarafından alınmış Nobel Ödülü sayısı en fazla olan ilk üç ülkeden biri değildir? |  Çin | Nobel sıralamasında ilk üç (ABD, BK, Almanya) değişmedi (4 şık) **(4 şık)** |
| `f9bcb7b2` | Ülkesinin ismini “Kuzey Makedonya” olarak değiştiren Makedonya yönetimi bu kararı uzun yıllardır hangi ülke ile yaşadığı sorunlardan dolayı almıştır? |  Yunanistan | Kuzey Makedonya adı değişikliği artık tarihî olgu (4 şık) **(4 şık)** |
| `d4520c00` | Aday gösterildiği branşların 11’inde ödül alarak “tüm zamanların en çok Oscar (Akademi) Ödülü alan filmi” unvanına sahip filmlerden biri aşağıdakil… |  Titanic | 11 Oscar rekoru kırılmadı |
| `b5eba53b` | TSK ile kamu kurum ve kuruluşlarının görüntü ihtiyacını karşılamak amacıyla Türk mühendis lerince tasarlanan ve 2012’de gerçekleştirilen fırlatma i… |  Göktürk | Göktürk-2 (2012) kalıcı; açıklamada "Altay geliştirilmekte" ifadesi eski (not) |
| `c1302291` | Aşağıdaki uluslararası kuruluşların hangisinde Türkiye “diyalog ortaklığı” statüsünde yer alır? |  Şangay İş Birliği Teşkilatı | Türkiye bugün de ŞİÖ diyalog ortağı (4 şık) **(4 şık)** |
| `91a6be29` | Tek bir seferde uzayda en fazla kalma unvanına sahip kadın astronot aşağıdakilerden hangisidir? |  Christina Koch | Christina Koch rekoru (328 gün) kırılmadı; şıkta "Peggy Witson" yazım hatası (4 şık) **(4 şık)** |
| `699ca8db` | Türkiye’de çalışan nüfusun ekonomik sektörlere oransal dağılışının çoktan aza doğru sıralanışı aşağıdakilerden hangisidir? |  Hizmet - Sanayi - Tarım | Hizmet > Sanayi > Tarım sıralaması bugün de doğru |
| `5bc906db` | 2023 metre ile dünyanın en uzun orta açıklığına sahip asma köprüsü aşağıdakilerden hangisidir? |  1915 Çanakkale | 1915 Çanakkale Köprüsü orta açıklık rekoru hâlâ geçerli |
| `2fb68572` | İkinci Abdülhamid Dönemi’nde kurulmuştur. Günümüzde Türkiye Cumhuriyeti Aile ve Sosyal Politikalar Bakanlığına bağlı Çocuk Hizmetleri Genel Müdürlü… |  Himaye-i Etfal Cemiyeti | Tarihî soru (Himaye-i Etfal); yalnız kökteki "Aile ve Sosyal Politikalar Bakanlığı" adı eski → ad/unvan istisnasıyla yerinde düzeltme adayı (bu turda dokunulmadı) **(4 şık)** |
| `76e6457e` | Aşağıdakilerden hangisi Türk Devletleri Teşkilatında gözlemci statüsünde yer alan ülkelerden biridir? |  Macaristan | Macaristan bugün de TDT gözlemcisi |
| `05e9d7f3` | Avrupa sivil havacılık otoritesinden tip sertifikası alan ilk Türk uçağı hangisidir? |  HÜRKUŞ | HÜRKUŞ — EASA sertifikası alan ilk Türk uçağı: tarih içermeyen kalıcı olgu |
| `267a5c1e` | Millî Muharip Uçak KAAN'ın ana yüklenicisi olan kuruluş ile uçağın ait olduğu nesil aşağıdakilerden hangisinde birlikte doğru verilmiştir? |  TUSAŞ — 5. nesil | KAAN — TUSAŞ / 5. nesil: tarih içermeyen kalıcı olgu |
| `5c728f2a` | MİLGEM Projesi'nin ilk büyük ihracat başarısı sayılan ve Türkiye'de inşa edilen korvetlerin teslim edildiği ülke aşağıdakilerden hangisidir? |  Pakistan | MİLGEM ilk büyük ihracatı (Pakistan): tarih içermeyen kalıcı olgu |

## ÇIKMIŞ — resmî PAEM soruları (5) → dokunulmaz, yalnız rapor

`cb40f5c7` (2025 Dünya Atletizm, “gerçekleştirilecektir” kipi) ve `2742697f` (2024 ödülü)
sınav anındaki hâlleriyle duruyor; resmî sınav kaydı oldukları için değiştirilmedi.

| id | kök | doğru | gerekçe |
|---|---|---|---|
| `61eef749` | Türkiye’de 2030’lu yıllardan itibaren F-16 uçaklarının yerine kullanılacak 5. nesil bir savaş uçağı üretilmesi amacıyla millî imkânlarla geliştiril… |  KAAN | Şubat 2024 olayına (KAAN ilk uçuşu) dayanıyor; cevap bugün de doğru. Çıkmış soru, yalnız raporlanır. |
| `cf934aac` | Türkiye’nin millî muharip uçağı KAAN’ın ilk uçuşunu gerçekleştirdiği hava meydanı aşağıdaki şehirlerin hangisindedir? |  Ankara | Şubat 2024 olayı (KAAN ilk uçuşu, Ankara); cevap bugün de doğru. Çıkmış soru, yalnız raporlanır. |
| `7ec24666` | Türkiye’de istihbarat ve millî güvenlik alanında lisansüstü çalışmalar yapılması, istihbaratın akademik boyut kazanmasına yönelik çalışmaların iler… |  Millî İstihbarat Akademisi | 6 Ocak 2024 olayı (Millî İstihbarat Akademisi açılışı); cevap bugün de doğru, kurumsal olgu kalıcı. Çıkmış soru. |
| `cb40f5c7` | Dünya Atletizm Şampiyonası, 13-21 Eylül 2025 tarihlerinde aşağıdaki şehirlerden hangisinde gerçekleştirilecektir? |  Tokyo | Gelecek kipi ('gerçekleştirilecektir') geçmişte kaldı; şampiyona Eylül 2025'te Tokyo'da yapıldı, cevap doğru. Çıkmış soru, arşivlenmez. |
| `2742697f` | 2024 yılında müzik alanında Cumhurbaşkanlığı Kültür ve Sanat Büyük Ödülü’ne layık görülen sanatçı aşağıdakilerden hangisindedir? |  Ahmet Özhan | 2024 ödülüne dayanan güncel olay sorusu; cevap (Ahmet Özhan) o yıl için doğru. Çıkmış soru, arşivlenmez. |
