KARAR: GEÇTİ

# Denetim — sil-tabanca-parcalari (18 kart, Silah Bilgisi kaynak pasajı 02-07…02-09)

Tarih: 17 Kas 2026. Deste: `uretim/sil-tabanca-parcalari.json`. Dayanak: `silah-bilgisi-ve-atis` kaynak pasajları (Doc 56 §12).
Üretim 22 kart → son 18 kart (6 çıkarıldı, 2 eklendi).
Mekanik kapı (`kart-dogrula.ts`): GEÇTİ (18 kart), düzeltmelerden sonra yeniden çalıştırıldı; çıktı `uretim/sil-tabanca-parcalari.dogrulama.md`.
Hat: Denetçi A (pasaja sadakat) + Denetçi B (kart kalitesi), iki bağımsız alt ajan; hakem ayrı alt ajan.
Ondalık ayırıcı: kalan kartlarda ondalıklı sayı yok; virgül/nokta sorunu kalmadı.

## Kaynak hatası şüphesi (S9)

| Pasaj | Kaynaktaki ifade | Bilinen / şüphe | Yapılan |
|---|---|---|---|
| 02-07 | "Amerika 1 inch'in 1/100'ü, İngiltere ise 1/1000'ini kabul etmektedirler." | Kalibrenin yüzde bir ya da binde bir inch ile yazılması ülkeye değil fişek adına bağlı (ABD'de .357, .223; İngiltere'de .22). | #14, #15 çıkarıldı (sayı taşımadan kurulamıyor). |
| 02-07 | "38 kalibre … = 9.652 mm"; formül "38x0254" diye bozuk. | ".38" nominal ad; 38 kalibre fişeklerin gerçek çekirdek çapı daha küçük (≈9,1 mm). Hesap gerçek çap gibi okunuyor. | #17 çıkarıldı. |
| 02-07 | Yiv dibi çapının çap sayılması "çok istisnai". | 9 mm Parabellum adı kitabın kendi verisinde bile yiv dibi çapından geliyor; "çok istisnai" fazla kesin (PLAUSIBLE). | #7 yumuşatıldı: "bazı silahlarda … da çap olarak kabul edilir". |
| 02-07 | 9 mm ve 7.65 mm Parabellum set/yiv çapları | Yuvarlatılmış değerler (A notu); ayrıca S10. | #9, #10 çıkarıldı. |

## Çıkarılanlar (numaralar üretim sırasıyla)

| # | Sınıf | Gerekçe |
|---|---|---|
| 9 | S10 | 9 mm Parabellum set/yiv çapı ölçü ezberi; bankada sorulmuyor, kavram #7'de. |
| 10 | S10 | 7.65 mm Parabellum için aynı türden ikinci ölçü ezberi. |
| 13 | S10 | 1 inch = 25.4 mm genel birim dönüşümü; kalibre kartları çıkınca tek başına değeri yok. |
| 14 | S9 | ABD = 1/100 inch ayrımı kaynak hatası. |
| 15 | S9 | İngiltere = 1/1000 inch ayrımı kaynak hatası. |
| 17 | S9 | "38 kalibre = 9.652 mm" gerçek çap gibi okunuyor. |

## Düzeltmeler

| # | Sınıf | Hakem | Sorun | Yapılan |
|---|---|---|---|---|
| 1 | — | Hakem | Açıklama çift hareketli atışı anlatıyordu; bunun için ayrı kart eklendi. | Açıklama tek hareketliye çevrildi. A'nın S3 notu (ad yalnız pasaj başlığında) düzeltme gerektirmedi. |
| 2 | S6 | PLAUSIBLE (B) | `sil-fisek-balistik` #19 ile aynı bilgi; arka yüzde tekrar. | Kart "ateşleme tertibatı" adına çevrildi (bankada soruluyor). |
| 3 | S8 | Hakem (B notu) | Arka yüzün ikinci cümlesi ön yüzü tekrar ediyordu. | Arka: "Horozlu sistem." |
| 5 | S10 | PLAUSIBLE (B) | Açıklamada madde bileşimi ezberi. | Açıklama çıkarıldı. |
| 7 | S9 | PLAUSIBLE (A) | "Çok istisnai" fazla kesin. | Yumuşatıldı (pasajın "bazı silahlarda" kapsamında). |
| 16 | S6 | PLAUSIBLE (B) | `sil-siniflandirma` #11 ile çakışma; açıklama `sil-siniflandirma` #12'yi tekrar ediyordu. | Bu kart kaldı, öteki çıkarıldı; açıklamadaki sürgünün fişek sürmesi cümlesi çıkarıldı. |
| 18 | S8 | Hakem (B notu) | Arka yüzde ön yüz tekrarı. | Arka: "Rampa." |
| 19 | S1? | Hakem (B notu) | Açıklamadaki "yiv setlerin bittiği yerden devam eder" yönü tartışmalı; bankada "yivlerin başladığı yerde" doğru kabul ediliyor. | O ibare açıklamadan çıkarıldı. |
| 21 | — | Hakem | Hazne için ayrı kart eklendi; arka yüz ve açıklama hazneyi tekrar ediyordu. | Arka yüz fişek yatağına indirildi; açıklamaya toplu tabanca farkı (02-07) kondu. |

## Eklenen kartlar (Denetçi B NOTLAR, pasaj 02-07'de açıkça var)

- Çift hareketli atış (tetik horozu hem kurar hem düşürür) — bankada iki soru.
- Hazne (sırada bekleyen fişeklerin bulunduğu kısım; otomatik tabancada şarjör + şarjör yuvası, toplu tabancada top yuvaları).

## Reddedilen bulgular

- B, #9 ve #14/#15/#17 için ondalık ayırıcının virgüle çevrilmesini önerdi: uygulanmadı (sayılar pasajdaki yazımla kalır; kartlar zaten çıkarıldı).
- B, #20 için "çıkarıcı yıldızı" terimini sordu: eklenmedi; pasajda yalnız "yıldız şeklindeki tırnak" var.

## İnsan incelemesine kalanlar

- Bankada üç soruda geçen "çıkarıcı yıldızı" terimi kaynakta yok; #20 "yıldız şeklindeki tırnak" diyor. Aday iki adı eşleştiremeyebilir (kaynak eksiği).
- Kalibre birimi ve kalibre → mm dönüşümü destede artık yok; bankada "38 Special" ve "9x19 mm ne tanımlar" soruluyor (kaynak eksiği).
- Kaynak eksiği (bankada sık sorulan, pasajda yok): ateşleme tertibatının işleyiş sırası (tetik – tetik manivelası – horoz – iğne); tabancanın ana parçaları; emniyet tertibatları (horoz, mandal, kabze, tetik emniyeti; toplu tabancada emniyet olmaması); boğaz; tırnak kırıklığında tutukluk sonucu.
