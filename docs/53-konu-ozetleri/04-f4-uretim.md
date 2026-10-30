# Doc 53 / 04 — F4: Anayasa 12 ünite üretimi

Tarih: 26 Ekim 2026. Durum: **12 ünite canlıda `in_review`; yayın kararı panelden (insan).**

## Hat

`ozet-girdi` (canlı madde metinleri + o maddelerden çıkmış soruların kökleri ve şıkları) → `ozet-uret`
(claude-opus-5-5, adaptive thinking, sunucu tarafı fallback, 64k çıktı) → `ozet-dogrula --md --write`
(istatistik ve köprü veriden) → kusur düzeltme → `ozet-yukle --replace` (sıra numarasıyla, in_review).
Dosyalar: `uniteler/<slug>.json` (kaynak) ve `.md` (okunur); girdi ve raporlar gitignore'da.

| # | Ünite | md | Kart | Bağlı soru | Üretim notu |
|---|---|---|---|---|---|
| 1 | Genel esaslar | 1–11 | 23 | 17 | "md 1–6" aralığı sayı sayılıyordu → doğrulayıcı düzeltildi |
| 2 | Temel hakların rejimi | 12–16 | 24 | 14 | aynı aralık sorunu |
| 3 | Kişi hakları I | 17–26 | 24 | 44 | counterNumbers `{value,note}` nesnesi → normalize |
| 4 | Kişi hakları II | 27–40 | 23 | 31 | temiz |
| 5 | Sosyal ve ekonomik haklar | 41–65 | 24 | 32 | satırlı 3 kartta articleRefs boştu → satır refs birleşimi; istem kuralı eklendi |
| 6 | Siyasi haklar | 66–74 | 24 | 48 | temiz |
| 7 | Yasama I (pilot) | 75–86 | 22 | 77 | elle üretim, sıra 7 ile yeniden yüklendi |
| 8 | Yasama II | 87–100 | 24 | 65 | zincirli türetim (600/3=200 → 101) → doğrulayıcı kuralı |
| 9 | Yürütme I | 101–122 | 24 | 119 | 32k çıktıda kesildi → 64k |
| 10 | Yürütme II | 123–137 | 24 | 30 | bir kez bağlantı koptu, tekrar üretildi |
| 11 | Yargı I | 138–153 | 24 | 111 | `ceil` formülü; AYM yeter sayısı örneği 2010 öncesi 12 üyeyle kurulmuştu → md 149'daki "en az on üye" ile 7'ye çekildi |
| 12 | Yargı II | 154–177 | 24 | 84 | 64k ile temiz |

Toplam 284 kart, 672 bağlı soru. Model çıktısı: giriş 6–40k, çıkış 17–44k token / ünite.

## Doğrulayıcıya bu turda eklenenler

- Madde aralığı atfı ("md 1–6") sayı değildir.
- `counterNumbers` nesne biçimi (`{value, note}`) kabul edilir (içe aktarmada da normalize).
- Zincirli türetim: işlenen, aynı karttaki başka bir türetilmiş sayı olabilir.
- `ceil` formülü (üçte iki gibi yukarı yuvarlanan çoğunluklar).
- Ünite `sortOrder` içe aktarılır.

## İnsan incelemesi için notlar

Betik sayıları ve referansları doğrular; anlamı doğrulamaz. Okurken özellikle şunlara bakılmalı:
tuzak kartlarındaki olumsuz iddialar ("X md 2'de geçmez"), 2017 sonrası düzene aykırı kalıntılar
(Yargı I'de bir örnek yakalandı: 12 üyeli Genel Kurul), ve "Sınav der ki" satırlarının sınav adları.
Okunan dört ünite (Genel esaslar, Yasama II, Yürütme I, Yargı I'in ilgili kartı) metne sadık bulundu.

## Sıradaki

- Panelden ünite ünite inceleme ve yayın (Konu Özetleri › ünite › Yayınla). İlk 2 ünite açık, kalanı premium
  (Doc 53 karar 8): yayın öncesi "Ünite bilgilerini düzenle" ile Premium işareti.
- Doğrulayıcı değişiklikleri (ceil, aralık, nesne) canlıya push edilmeli; aksi hâlde panelde Yargı I'in
  yeter sayı kartı düzenlenince `ceil` reddedilir.
- F5: üniteler alt konu olur (hâkimiyet, koç reçetesi).
- Diğer dersler: polis mevzuatı kanun bazında aynı hat.

---

# PVSK — 5 ünite (31 Ekim 2026)

Durum: **üretildi ve doğrulandı; yükleme deploy sonrası** (ünite madde listesi sütunu migration ister).
Kaynak dosyalar `uniteler/pvsk-*.{json,md}`; girdiler gitignore'da.

## Hat genişletmesi (commit 9cab4f8)

PVSK'da sınavın kalbi sayısal olmayan maddeler (4/A, 13/A, Ek 6, Ek 7, Geçici 2); aralık (`articleFrom–articleTo`)
bunları hiçbir üniteye düşürmüyordu. `SummaryUnit.articleNos` (açık liste; boş = aralık, Anayasa aynen çalışır):

- Eşleme `unite-eslesme.ts`: liste doluysa küme üyeliği (`articleKey`: "84/2"→"84"; "4/A", "Ek 6", "Geçici 2" korunur).
  Hâkimiyet kancası ve `unite-ilerleme-doldur.ts` aynı `unitOfArticle`'ı kullanır (betikteki aralık kopyası kaldırıldı).
- `articleLabel` ("22–28, Ek 5, Ek 7, Ek 10, Geçici 2") API yanıtlarında; admin, web ve Expo `md from–to` yerine onu basar.
- `ozet-girdi.ts --articles "1,2,4,4/A,5"` (olmayan madde hata); `ozet-uret` listeyi isteme ve `sourceLabel`'a yazar;
  içe aktarma ve admin "Ünite bilgilerini düzenle" formu listeyi kanuna karşı doğrular.
- Doğrulayıcı: "md 4/A", "Ek 6", "Geçici 2", "ek madde 9" atıfları sayı sayılmaz (Anayasa "md 1–6" kuralı korunur).
  Testler: `unite-eslesme.spec` 11, `ozet-dogrulayici.spec` +3 (59/59).

## Üniteler

| # | Ünite | Maddeler | Kart | Bağlı soru | Üretim notu |
|---|---|---|---|---|---|
| 1 | Görev, emir ve kimlik | 1, 2, 4, 4/A, 5 | 23 | 18 | temiz (0 kusur) |
| 2 | Umuma açık yerler ve idari tedbirler | 6–8, 10–12, 14, 19, 21, Ek 1, Geçici 1 | 24 | 19 | temiz |
| 3 | Önleme araması, koruma altına alma ve yakalama | 9, 13, 13/A, 15, 20, Ek 2, Ek 3 | 24 | 20 | temiz |
| 4 | Zor ve silah kullanma, adli görev | 16, 17, Ek 4, Ek 6, Ek 9 | 24 | 19 | temiz |
| 5 | Teşkilat ve genel hükümler | 22–28, Ek 5, Ek 7, Ek 10, Geçici 2 | 24 | 13 | temiz; Ek 7 tazeleme gerekmedi (bankadaki metin kaynakla birebir) |

Toplam 119 kart, 89 bağlı soru (konudaki 96 yayında sorunun maddeye bağlı olanlarının tamamı). Mülga 3, 18, Ek 8 ünite dışı.
Model çıktısı: giriş 10–11k, çıkış 17–26k token / ünite; 4 ünite paralel üretildi, tekrar gerekmedi.

## İnsan incelemesi için notlar

Betik sayı ve referansı doğrular, anlamı doğrulamaz. Özellikle: tuzak kartlarındaki olumsuz iddialar ("X maddede sayılmaz"),
Ek 7'de "Başbakanlık Teftiş Kurulu" ibaresi (metinde hâlâ böyle geçiyor; kart metne sadık), 4/A ve Ek 6'daki Anayasa
Mahkemesi iptal notlarının doğru fıkraya bağlanması, "Sınav der ki" satırlarındaki sınav adları.

## Sıradaki

- Deploy (9cab4f8) → `ozet-yukle.ts uniteler/pvsk-<slug>.json --replace` ×5 (in_review) → panelden ünite ünite inceleme ve yayın.
  Doc 53 karar 8: ünite 1–2 açık, 3–5 premium ("Ünite bilgilerini düzenle").
- Yayın sonrası `unite-ilerleme-doldur.ts` (geçmiş cevaplardan PVSK hâkimiyeti; artık 4/A, Ek, Geçici sorular da sayılır).
- Sonraki kanunlar aynı hat: 3201, 7068, 5271 (CMK) … madde listesi `--articles` ile.

---

# 3201, 7068 ve 5271 (CMK) — 26 ünite (1 Kasım 2026)

Durum: **26 ünite prod'da `in_review`; yayın kararı panelden (insan).** Bölümleme kullanıcı onaylı; madde listeleri
canlı sıradan `--articles` ile türetildi (mülga maddeler dışarıda, sorulu hiçbir canlı madde ünite dışında kalmadı).
Toplam 617 kart, 901 bağlı soru. 26 ünite 6 paralel süreçle tek turda üretildi (giriş 7–36k, çıkış 15–36k token / ünite);
ilk doğrulamada 17 ünite temiz, 9 ünitede 16 kusur; hepsi kapatıldı.

## 3201 Emniyet Teşkilat Kanunu (6 ünite, 88 canlı madde; 32 geçici maddeden yalnız Geçici 26 dâhil)

| # | Ünite | Maddeler | Kart | Bağlı soru |
|---|---|---|---|---|
| 1 | Teşkilat, makamlar ve bölümler | 1–6, 8–12 | 22 | 18 |
| 2 | Rütbeler, görev unvanları ve teşkilat yapısı | 13, 15, 16, 20–22, 26, 35–41 | 23 | 14 |
| 3 | Terfi, atama ve meslekten çıkma | 47, 51–56, 59–67 | 24 | 44 |
| 4 | Performans, madalya, sandık ve son hükümler | 81, 82, 85–88, 90, 91, 93–98 | 22 | 11 |
| 5 | Ek maddeler I | Ek 1, Ek 2, Ek 3, Ek 4, Ek 5, Ek 6, Ek 7, Ek 8, Ek 9, Ek 10, Ek 11, Ek 12, Ek 13, Ek 14, Ek 15, Ek 16, Ek 17, Ek 18 | 24 | 15 |
| 6 | Ek maddeler II ve geçici hükümler | Ek 21, Ek 24, Ek 25, Ek 26, Ek 27, Ek 29, Ek 30, Ek 31, Ek 32, Ek 33, Ek 34, Ek 35, Ek 36, Ek 37, Geçici 26 | 24 | 18 |

## 7068 Genel Kolluk Disiplin Hükümleri (5 ünite, 40 canlı madde)

| # | Ünite | Maddeler | Kart | Bağlı soru |
|---|---|---|---|---|
| 1 | Amaç, kapsam, tanımlar ve genel hükümler | 1–6 | 23 | 17 |
| 2 | Disiplin cezaları, ağırlaştırıcı nedenler ve ceza puanı | 7, 9–12 | 24 | 25 |
| 3 | Disiplin cezası verilecek fiiller | 8 | 24 | 73 |
| 4 | Disiplin amirleri ve kurulları | 13–26 | 23 | 36 |
| 5 | Soruşturma usulü, zamanaşımı, itiraz ve son hükümler | 27–37, 39, Geçici 1, Geçici 2 | 24 | 31 |

## 5271 CMK (15 ünite, 346 canlı madde — kitap/bölüm yapısına göre)

| # | Ünite | Maddeler | Kart | Bağlı soru |
|---|---|---|---|---|
| 1 | Kapsam, tanımlar, görev ve bağlantı | 1–11 | 24 | 41 |
| 2 | Yetki ve hâkimin reddi | 12–33 | 24 | 44 |
| 3 | Kararlar, süreler ve tanıklık | 34–38, 38/A, 39–61 | 24 | 39 |
| 4 | Bilirkişi, gözlem, muayene, keşif ve otopsi | 62–89 | 24 | 31 |
| 5 | Yakalama ve gözaltı | 90–99 | 24 | 32 |
| 6 | Tutuklama ve adli kontrol | 100–110, 110/A, 111–115 | 24 | 44 |
| 7 | Arama ve elkoyma | 116–128, 128/A, 129–134 | 24 | 28 |
| 8 | İletişimin denetimi, gizli soruşturmacı, teknik izleme ve tazminat | 135–140, 140/A, 141–144 | 24 | 43 |
| 9 | İfade, sorgu ve müdafi | 145–156 | 24 | 25 |
| 10 | Soruşturma ve kamu davasının açılması | 157–174 | 24 | 47 |
| 11 | Duruşma hazırlığı ve duruşma | 175–205 | 24 | 33 |
| 12 | Deliller, hüküm ve karar | 206–232 | 24 | 53 |
| 13 | Mağdur, katılma, özel yargılama usulleri ve uzlaştırma | 233–259 | 24 | 50 |
| 14 | Kanun yolları: itiraz, istinaf, temyiz | 260–294, 296–307 | 24 | 58 |
| 15 | Olağanüstü kanun yolları, giderler ve çeşitli hükümler | 308, 308/A, 309–333, Ek 1, Geçici 1, Geçici 2, Geçici 3, Geçici 4, Geçici 5, Geçici 6, Geçici 7, Geçici 8 | 24 | 31 |

## Doğrulayıcıya bu turda eklenenler (testli, 60/60)

- Binlik ayracı sayının parçasıdır: "13.000 gösterge" → 13000 (önceden 13 ve 0 sayılıyordu).
- Madde atfı biçimleri: "Madde 94'te", "139 uncu maddede", "md 100 ve 101", "md 128, 130 ve 134".
- Sözcük sınırı: "son beş yıl"daki beş 5'tir ("son"un içindeki "on" sayı sözcüğü değildir).
- Formülde 7 serbest işlenen (iki hafta = 2 × 7 gün).

## Elle düzeltilenler

- 7068 ü.1: `count(...)` ile türetilmiş "kaç kalem sayılmış" satırları (3, 9, 14, 7…) çıkarıldı — betikle doğrulanamaz; bir sayı kartı boşalıp silindi (23 kart).
- CMK ü.2: "3 gün" karşı örneği metinde geçiyordu, çıkarıldı.
- CMK ü.7: md 128/A için "50.000–300.000 TL idarî para cezası" satırı — madde metninde para cezası YOK, model uydurmuş; satır silindi.

## İnsan incelemesi için notlar

- CMK md 331 metni hâlâ "Hâkimler ve Savcılar Yüksek Kurulu" diyor; ü.15 kartı metne sadık (model "metindeki adıyla" notu düşmüş).
- 7068 md 39 "Bakanlar Kurulu yürütür", 3201 Ek 21 "190 sayılı KHK", 7068 Geçici 1 "682 sayılı KHK": metinde var, kartlar sadık.
- 7068 ü.3 (md 8, 73 soru) tek maddelik ünite; 24 kart sınırında fiil listesi seçici — eksik kalan fiil varsa insan ekler.
- 3201 ü.5–6 Ek maddeler konu olarak dağınık; başlıklar bilinçli genel ("Ek maddeler I/II").

## Sıradaki

- Panelden inceleme ve yayın; Doc 53 karar 8: her kanunun ilk 2 ünitesi açık, kalanı premium.
- Yayın sonrası `unite-ilerleme-doldur.ts`.
- Sonraki adaylar: TCK (5237), 5188, 2911, 2918 — aynı hat.
