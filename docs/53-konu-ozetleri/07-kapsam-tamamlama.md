# Doc 53 / 07 — Kapsam tamamlama turu (18 Kasım 2026)

Durum: **16 yeni ünite üretildi, denetlendi, betikten geçti; dalda (push yok). Yükleme ve yayın kullanıcıda.**

## Neden

92 ünite yayına alındıktan sonra canlıda yapılan kapsam taraması (yayındaki soru × ünite, konu bazında) iki
açık gösterdi:

1. **Ünitesi olmayan mevzuat.** Madde metni bankada olduğu hâlde ünitesi olmayan 11 mevzuat (≥8 yayındaki soru):
   6284, 6136, 3713, TBMM İçtüzüğü, 6284 Uyg. Yön., 6222, 7201, 2576, Adli Kolluk Yön., 1774, 2839.
   ≤6 sorulu ~15 mevzuat (5607, 298, 3071, 2820, 6698, 6458, 5726, 5253 …) bilinçli olarak dışarıda bırakıldı.
2. **Ünitesi olan kanunda ünite dışında kalan soru (96).** Ünite sonrası etiketlenen/yayınlanan sorular,
   üretimde listeye girmemiş maddelerde kalmıştı. Hiçbiri mevcut kartlarda anlatılmıyordu; madde listesine eklemek
   dürüst olmazdı. Yayındaki üniteye kart eklemek `--replace` ister (üniteyi incelemeye çeker, okuma ilerlemesini
   bozar); bunun yerine 5'ten fazla açığı olan kanunlara **ek ünite** yazıldı: 657 (26 soru), 2918 (14),
   5395 (11), 5326 (6), İYUK (5).

## Hat düzeltmeleri (bu turda)

- **`ozet-girdi.ts`** yalnız `question_articles` bağından soru topluyordu; küçük kanunlarda soruların çoğu yalnız
  `articleNo` etiketliydi (6136'da 31 sorunun 26'sı). Artık konu + madde etiketiyle eşleşen sorular da girdiye
  girer (ünite eşlemesi `unitOfArticle` ile aynı kural).
- **Madde bağı tamamlandı:** `s1-question-article-backfill.ts APPLY=1` (kullanıcı çalıştırdı) 196 bağ yazdı;
  "Sınav der ki" istatistiği ve mevzuat okuyucusundaki "bu maddeden çıkan sorular" `question_articles` okur.
  Yayındaki eski ünitelerin istatistik kartları (657, PVSK) eski sayıyla duruyor; yeniden doldurmak isteğe bağlı.
- **`ozet-uret.ts` istemi:** (a) "özet sözcüğünü kullanma" kuralı model maddenin kendi terimini ("tutanak özeti",
  "önergenin özeti") de düşürüyordu → kural kartın kendini anmasıyla sınırlandı; (b) TL tutarı yazmama kararı
  (karar 1) isteme işlendi; (c) kaldırılmış kurum / yürürlükten kalkmış atıf için "metnindeki hâliyle" notu kuralı.

## Üniteler

| Slug | Mevzuat | Sıra | Kart | Bağlı soru |
|---|---|---|---|---|
| `akk-koruyucu-ve-onleyici-tedbirler` | 6284 | 1 | 24 | 28 |
| `asbk-atesli-silahlar-bicaklar-ve-ruhsat` | 6136 | 1 | 24 | 31 |
| `tmk-teror-tanimi-suclar-ve-usul` | 3713 | 1 | 24 | 24 |
| `ictuzuk-baskanlik-divani-gorusme-ve-denetim` | TBMM İçtüzüğü (yalnız sorulu maddeler) | 1 | 24 | 19 |
| `akuy-tedbir-kararlarinin-uygulanmasi` | 6284 Uyg. Yön. (sorulu maddeler) | 1 | 24 | 16 |
| `ssok-sporda-siddet-onlemler-ve-yaptirimlar` | 6222 | 1 | 24 | 14 |
| `tebk-tebligat-usulleri` | 7201 (sorulu + md 21, 35) | 1 | 23 | 9 |
| `bimk-bolge-idare-mahkemeleri` | 2576 | 1 | 24 | 8 |
| `akoy-adli-kolluk-gorev-ve-iliskiler` | Adli Kolluk Yön. | 1 | 24 | 6 |
| `kbk-kimlik-bildirme-yukumlulugu` | 1774 | 1 | 24 | 6 |
| `mvsk-secim-cevreleri-ve-oy-hesabi` | 2839 (md 1–6, 33, 34, 34/A) | 1 | 24 | 7 |
| `dmk-sinavda-sorulan-diger-hukumler` | 657 ek ünite | 5 | 24 | 26 |
| `ktk-ek-maddeler` | 2918 ek ünite | 4 | 24 | 14 |
| `cockk-ek-hukumler-ve-izleme` | 5395 ek ünite | 3 | 24 | 11 |
| `kabk-ek-kabahatler` | 5326 ek ünite | 4 | 22 | 6 |
| `iyuk-ivedi-yargilama-usulu` | İYUK ek ünite | 4 | 21 | 5 |

Karar 8'e göre ilk 11 ünite açık (kanunun 1. ünitesi), 5 ek ünite premium (sıra ≥ 3).

## Denetim

Her ünite bağımsız bir anlam denetçisinden geçti (madde metnine karşı; ölçüt: ESAS / ZAYIF / BİÇİM / BANKA),
bulgular ayrı düzelticilerce işlendi ve betik doğrulaması yeniden koşuldu. ESAS bulgular (7) elle karşılaştırıldı:

- 3713 md 4/a: kapalı TCK listesi "TCK'da sayılan suçlar" diye genellenmişti → madde numaralarıyla kapalı liste.
- 6284 md 5/2: "(a)–(d)" aralığı (ç)'yi de kapsıyordu → bentler tek tek.
- 657 md 76: eşitlik ölçüsü kazanılmış hak aylık derecesi yazılmıştı → bulunduğu kadro derecesi.
- 2918 Ek 2: belge geri alma süresi (otuz gün) "düzenlenmemiş" denmişti.
- 5395 md 41/F: cezanın düşmesi tablosu karşılaştırma kartıyla çelişiyordu.
- 5326 md 42/A: "mülkî amir yetkili değildir" — vali mülkî amirdir.
- 4483 md 9 (önceki tur): kanun metni Danıştay İkinci Dairesi der, 2575 md 42/k Birinci Daireye vermiştir → not.

Tekrarlayan ZAYIF örüntüler: düşen şart/istisna, aşırı genelleme, eski kurum adının notsuz verilmesi, TL tutarı,
"en çok sorulan" gibi dayanaksız sıklık iddiası, soru kökü/şık kopyası.

## İnsan incelemesi için notlar

- Eskime notlarındaki güncel bilgi madde metninin dışından gelir (Hâkimler ve Savcılar Kurulu adı, Hazine ve
  Maliye Bakanlığı, Aile ve Sosyal Hizmetler Bakanlığı, Devlet Personel Başkanlığının kapatılması, Emekli Sandığı,
  KHK yetkisinin Anayasa'da olmaması, CMK md 250'nin kaldırılması, CMK md 135 katalog fıkrası). Betik doğrulamaz.
- Adli Kolluk Yön.: 2013 değişikliği (en üst dereceli kolluk amirinin mülki amire bildirimi) için Danıştay yürütmeyi
  durdurma şüphesi denetçiden geldi; mevzuat.gov.tr güncel metninde şerh yok, kartlara yazılmadı.
- Mevcut `dmk-*` ünitelerinde Devlet Personel Başkanlığı notsuz geçiyor (yeni ek ünitede not var).
- Okuma süresi: düzeltmeler kartları uzattı; `readingMinutes` yeni ünitelerde metin uzunluğundan yeniden hesaplandı
  (mevcut 108 ünitenin medyanı 1.337 karakter/dk). 6136 ünitesi 26 dk ile hedefin (10–15 dk) üstünde; ikiye
  bölünmesi (md 1–17 / Ek maddeler) ayrı iş olarak önerildi. Mevcut bazı yayındaki ünitelerin de süresi düşük
  yazılmış (ör. `tck-topluma-karsi-suclar` 30 bin karakter, 15 dk).

## Banka bulguları (düzeltilmedi; kullanıcıya bildirildi)

- Dört şıklı sorular: 6284 (9), 3713 (7), Tebligat (3), Kimlik Bildirme (2), Adli Kolluk (2), İYUK 20/A–B (2),
  657 md 61/A (1).
- 1774 md 17 öncüllü soru: I. öncül md 6/b ölçütünden ("md 2'de sayılanlar dışındaki iş yerleri") ayrılıyor.
- 2839 md 2 "hangisi yanlıştır" sorusu: ✓ şık "nüfusuna bakılmaksızın her il bir seçim çevresidir" md 4'teki
  "kural olarak" kaydını taşımıyor.
- 2576 md 6 sorusu: Gümrük idari para cezası ödeme emrinin vergi mahkemesinin görevine girmediği anahtarı madde
  metninden doğrudan çıkmıyor.

---

# Dalga turu: kalan bütün mevzuat (19 Kasım 2026)

Kullanıcı kararı: ünitesi olmayan bankadaki bütün mevzuat (sorulu ve sorusuz) konu özetine alınır, üç dalga arka
arkaya yürütülür. **84 yeni ünite** (39 mevzuat) + TCK ek ünitesi (md 123/A, 217/A; sıra 15, premium) + Anayasa
Başlangıç (6 kart, `anayasa-genel-esaslar`'a eklendi; ünite liste moduna geçti, bağlı soru 17 → 22).

## Bölme

Bölüm yapısına göre, hedef ~24 bin karakter / ünite (üst 30 bin), küçük kuyruk önceki üniteye katılır; Geçici
maddeler dışarıda. Büyük mevzuat: 298 (8 ünite), 5275 (8), 5018 (5), 6458 (5), 2820 (4), 6216 (4), 6085 (4).
**Süzgeç hatası:** mülgaları ayıklamak için konulan "60 karakterden kısa metin" eşiği yürürlükteki 7 kısa maddeyi de
düşürdü (5188 md 17, AİHS P4-4 ve P16-5, 298 md 4, Avrupa Konseyi Statüsü md 2 ve 11, İHEB md 3). Hepsi sonradan
ilgili üniteye kart cümlesi ve madde bağıyla eklendi.

## Hat

Üretim 8 işçi, ortak kuyruk (`mkdir` kilidi) → betik → bağımsız denetçi (ILKE.md) → düzeltici (DUZELTME.md) → betik.
Her ünite denetlendi; ESAS bulgular elle karşılaştırıldı. Öne çıkanlar: 298 md 70 and içme ve md 100 ittifak alanı;
2820 md 98 kapatma oy oranı (kanunda beşte üç, Anayasa md 149'da üçte iki → not); 5253 md 32/t (dayandığı md 19/4
AYM'ce iptal → not); 5018 harcama sırası; 5275 md 107 oranları; 5352 arşiv kuralının kapsamı; 6458 md 102 merci;
BM Andlaşması (bankadaki metin ilk metin: üye ve oy sayıları kartlardan çıkarıldı, not düşüldü).

## Doğrulayıcıya bu turda eklenenler (`a7965773`)

- AİHS protokol madde atfı ("P4-7", "md P13", "Ek P-1", "Protokol No. 7") sayı değildir.
- Bent atfı küçük ve Türkçe harfle ("32/d", "32/ç") sayı değildir.
- Bilinen sınır: betik yalnız RAKAMLARI denetler; yazıyla yazılmış sayıları ("iki katı", "üçte iki") denetçi kontrol
  etti, betik görmez. `count(...)` biçimli derivedNumbers geçersizdir (yayındaki `anayasa-genel-esaslar`'da ve
  `kvkk-1`'de etkisiz kayıtlar duruyor).

## Başlıklar

Bölüm başlıklarından gelen ipucu başlıklar ("Amaç, Kapsam ve Tanımlar, …", "Bölüm I, Bölüm II") 72 ünitede elle kısa
başlıklarla değiştirildi; kaynak etiketi (yalnız panel) madde listesinden yeniden kuruldu.

## İnsan incelemesi için notlar

- "Bugünkü adı" notları madde metni dışından gelir (Parlamenter Meclis, Ölçme Seçme ve Yerleştirme Merkezi,
  Hâkimler ve Savcılar Kurulu, BM daimi üye devlet adları, katma bütçe ayrımı, Göç İdaresi Başkanlığı).
- AİHS ve sorusuz mevzuatta "Sınav der ki" kartı 0 soru gösterir; AİHS'nin 73 sorusu madde etiketsiz.
- En uzun üniteler: `stk-8` 21 dk, `tihek-1` 18 dk, `ertky` 17 dk.

## Banka bulguları (düzeltilmedi)

- 7062 md 14 metninin sonuna değişiklik listesi ve **jQuery kodu** yapışmış; md 11 sonuna md 12 başlığının yarısı — mevzuat okuyucusunda görünür, öncelikli.
- BM Andlaşması bankada ilk metniyle (Güvenlik Meclisi 11 → bugün 15, Ekonomik ve Sosyal Meclis 18 → 54, md 27 oy sayısı 7 → 9); yayındaki BM Andlaşması bilgi kartları da kontrol edilmeli.
- 5275 md 59 metni md 58'e karışmış (md 59 hiçbir üniteye girmedi); md 12 başlığı boş, md 48 ve 51 başlıkları dipnot artığı.
- 5607 md 3 başlık alanı bozuk ("Sınav der ki" kartında görünür).
- AİHS P16-10 metninin sonuna Sözleşme md 47'nin üç fıkrası yapışmış.
- Teknik Takip Yönetmeliği: bölüm ve madde başlıkları önceki maddenin metnine yapışmış (md 3, 4, 6, 14, 15).
- 3376 md 5 metni yarım (alt bentler ve Cumhurbaşkanına ayrılan süre eksik).
- TCK 217/A sorusunun madde bağı yanlış (dayanak md 218); TCK 123/A öncüllü sorusunda saik öncülü yanlış doğru sayılmış (şıklarda doğru seçenek yok).
- 6458 md 102 sorusu: ödeme süresi ile dava süresi karışmış olabilir.
- Dört şıklı sorular: 5607 (4), 3071 (3), 6458 ve diğerleri.

## Yükleme sonucu (19 Kas 2026, kullanıcı çalıştırdı)

Yükleme + premium (karar 8) + toplu yayın + ilerleme tamamlandı: prod'da **195 ünite yayında, incelemede 0**;
sıra ≥3 olup açık duran ünite 0. Maddeli 4.055 sorunun 4.040'ı bir üniteye düşüyor.

Üniteye düşmeyen 15 soru:

| Mevzuat | Madde | Neden |
|---|---|---|
| 2911 | 34/A, Ek 1 | yürürlükte, üniteye alınmamış (aralık modu "/A" ve "Ek"i eşlemez) |
| 2911 | Geçici 1 | ilk üç aya ilişkin geçiş hükmü; soru etiketi şüpheli (banka) |
| 5901 | Ek 1 (saklı nüfus) | yürürlükte, üniteye alınmamış |
| 4483 | 10, 14, 15, Ek 1 | yürürlükte, `myhk` ünitesi bu maddeleri kapsamıyor |
| 5682 | Ek 2, Ek 4, Ek 6 | yürürlükte, `pasap` üniteleri aralık modunda |
| 2575 | 19/A, 52/A (Başkanlık Kurulu) | yürürlükte, `dank` ünitesi kapsamıyor |
| EAYY | 32 | bölme süzgeci metni "(Mülga…)" ile başlayan ama yeniden düzenlenmiş maddeyi düşürdü (aynı nedenle md 10 da dışarıda, sorusu yok) |
| TCK | "45-49" | aralık etiketi bilinçli olarak eşlenmez; madde aralığı tek ünitenin (`tck-hapis-ve-adli-para-cezasi`) içinde |

Madde düzeyinde kapsanmayan öteki maddelerin büyük kısmı amaç/kapsam/dayanak, yürürlük/yürütme ve geçiş hükümleridir
(tasarım gereği dışarıda); büyük kanunlarda (657, TCK özel hükümler, İçtüzük, 2918, 5393, 5442, 7201) üniteler sınavda
sorulan maddelerle sınırlıdır.

## Kuyruk: üniteye düşmeyen 15 sorunun 14'ü (19 Kas 2026)

Yukarıdaki tablodaki yürürlükteki maddeler için yeni ünite açılmadı; 9 kart mevcut 7 üniteye eklendi ve madde
listeleri genişletildi (Anayasa Başlangıç'taki yol). Kartlar madde metninden elle yazıldı, betik doğrulamasından
geçti (7/7 GEÇTİ), bağımsız denetçi 9 kartı madde metnine karşı okudu (ESAS yok; 7 küçük bulgu işlendi).

| Ünite | Eklenen madde |
|---|---|
| `tgyk-yasaklar-ve-ceza-hukumleri` | 2911 md 34/A, Ek 1 |
| `tvk-vatandasligin-kazanilmasi` | 5901 Ek 1 |
| `myhk-on-inceleme-sorusturma-izni-ve-itiraz` | 4483 md 10, 14, 15, Ek 1 |
| `pasap-giris-cikis-kurallari-ve-pasaport-cesitleri` | 5682 Ek 4 |
| `pasap-pasaport-verilmesi-yasaklar-ve-ceza-hukumleri` | 5682 Ek 2, Ek 6 |
| `dank-danistayin-gorevleri-ve-kurulusu` | 2575 md 19/A, 52/A |
| `eayy-2-bolgeler-ve-hizmet-sureleri-1` | Atama Yön. md 32 |

Yükleme `--replace` ister; yedi ünitede okuma ilerlemesi satırı yoktu (prod sayımı 0), kayıp olmaz. Sıra:
yükle → premium (`tgyk-yasaklar` sıra 3) → toplu yayın → ilerleme.

Dışarıda kalan 2 soru: 2911 Geçici 1 (madde etiketi şüpheli, banka işi) ve TCK "45-49" aralık etiketi.

Banka notları: 2575 md 19/A metni bankada yalnız birinci fıkra (seçen organ, görev süresi, toplanma usulü yok;
sorunun doğru şıkkındaki "Genel Kurulunca seçilen" unsuru bu yüzden kartta yok); 5682 Ek 2 başlık alanı önceki
maddenin dipnot artığı.

**Sonuç (19 Kas 2026, kullanıcı çalıştırdı):** yedi ünite `--replace` ile yüklendi, toplu yayın 7/7, ilerleme
dolduruldu. Prod: 195 ünite yayında; maddeli 4.071 sorunun 4.069'u bir üniteye düşüyor (dışarıdaki 2 soru:
2911 Geçici 1 ve TCK "45-49"). `--replace` premium işaretini korudu (premium betiği 0 değişiklik yazdı).

## 23 Kas 2026 — yeni alınan dört kanun (4207, 4250, 5199, 7258)

Kullanıcı isteğiyle beş ünite ve beş kart destesi üretildi; hepsi prod'da `in_review`, yayın kararı kullanıcıda.

| Ünite / deste | Mevzuat | Ünite kartı | Bilgi kartı |
|---|---|---|---|
| `tukk-tutun-yasaklari-ve-yaptirimlar` | 4207 md 1–5, 7 | 24 | 23 |
| `iiik-alkollu-icki-yasaklari-ve-cezalar` | 4250 md 1, 3, 6, 7, 9 | 23 | 24 |
| `hkk-ilkeler-ve-hayvanlarin-korunmasi` | 5199 md 1–13 | 24 | 23 |
| `hkk-yasaklar-denetim-ve-cezalar` (sıra 2) | 5199 md 14–31, 28/A, Ek 1, Ek 2, Geçici 3 | 24 | 24 |
| `bsok-bahis-ve-sans-oyunlari-ceza-hukumleri` | 7258 md 2, 5, Ek 1 | 16 | 16 |

**Hat farkı (API'siz kip):** yerel `ANTHROPIC_API_KEY` geçersizdi (401). `ozet-uret.ts` ve `kart-uret.ts`'e
`ISTEM_YAZ=<dosya>` (istemi yaz, çık) ve `HAM=<dosya>` (ham model çıktısını aynı son işlemden geçir) eklendi; istemi
alt ajanlar işledi. Kart betiğinde stil kapısı bu kipte yalnız bildirir (onarım modeli yok). Sonrası aynı: betik
doğrulaması → bağımsız denetçi → düzeltici/hakem → betik. Ünite denetim kayıtları `denetim-2026-11-23/`, kart
denetim raporları `docs/56-bilgi-kartlari/denetim/`, talimatlar `yeni4-TALIMAT-*.md`.

**Kararlar:** TL tutarı yok (18 Kas kararı); kalkmış kurumlar (Tütün ve Alkol Piyasası Düzenleme Kurumu/Kurulu, Tekel)
ünitede "madde metnindeki hâliyle" notuyla durur, bilgi kartına hiç girmez; 5199 Geçici 3'te dolmuş altı aylık süre
ve Bakanlık düzenlemesine bağlı ırk listesi kartlanmadı (ünitede kayıtla duruyor).

**İnsan incelemesine kalanlar:**
- 4207: bankadaki sürücü koltuğu sorusunun (`3dc788e5`) anahtarı "kolluk verir" diyor; md 5/1 yalnız Kabahatler
  Kanunu md 39'a gönderir ve md 39 hususi araç için makam saymaz (kolluk: özel işletilen toplu taşıma ve şikâyet
  üzerine özel binalar). Kartlar makam yazmıyor.
- 5199: ceza verme yetkisi Bakanlıkta, mülkî amire devredilebilir (md 25 → 17); bankadaki soru (`61cf72cf`) "mülkî
  amir verir" diyor. Geçici 3: Bakanlığın tehlikeli ırk düzenlemesini çıkarıp çıkarmadığı doğrulanamadı.
- 5199 kaynak yazımı: "(l) bendi" resmî metinde "(1) bendi" (md 15, 28, Geçici 3). İçe aktarmada md 12/13, 16, 31/Ek 1
  başlık kaymaları elle düzeltildi (`mevzuat-kaynaktan-json.ts` "(Değişik başlık: …)" şerhli başlığı ayıramıyor).
- 7258: md 2'ye bağlı bilgi kartı yok (tanım cümlesi mülga). 4250: md 3'e bağlı kart yok.
- Tuzak kartlarındaki olumsuz iddialar betikle doğrulanamaz.
