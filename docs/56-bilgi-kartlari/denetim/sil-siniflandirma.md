KARAR: GEÇTİ

# Denetim — sil-siniflandirma (14 kart, Silah Bilgisi kaynak pasajı 02-01…02-06)

Tarih: 17 Kas 2026. Deste: `uretim/sil-siniflandirma.json`. Dayanak: `silah-bilgisi-ve-atis` kaynak pasajları (Doc 56 §12).
Üretim 15 kart → son 14 kart (4 çıkarıldı, 3 eklendi).
Mekanik kapı (`kart-dogrula.ts`): GEÇTİ (14 kart), düzeltmelerden sonra yeniden çalıştırıldı; çıktı `uretim/sil-siniflandirma.dogrulama.md`.
Hat: Denetçi A (pasaja sadakat) + Denetçi B (kart kalitesi), iki bağımsız alt ajan; hakem ayrı alt ajan.

## Kaynak hatası şüphesi (S9)

| Pasaj | Kaynaktaki ifade | Bilinen / şüphe | Yapılan |
|---|---|---|---|
| 02-05 | "Otomatik tanımı ile eş değerdir. Geri tepme sistemi ile çalışan silahlar şarjörle beslenirler." | Geri tepmeyle çalışan şeritle beslenen silahlar var; otomatik silahlar gaz tahliyeli de çalışabilir. Genel kural olarak yanlış. | #13 ön yüzü tabancalarla sınırlandı; "otomatik ile eş değer" cümlesi çıkarıldı. |
| 02-06 | Kilitli sürgü/namlu örnekleri arasında "Ruger"; "HP" adı geciktirme sistemine bağlanıyor. | Ruger'in birçok tabancası kilitlenmesiz; Browning "Hi-Power" adı şarjör kapasitesinden gelir. Terimin bu mekanizmanın genel adı olması şüpheli (PLAUSIBLE). | #15'ten "Ruger" çıkarıldı. #14 ve #15'teki HP terimi pasaja sadık kaldı; insan incelemesine bırakıldı. |
| 02-04 | Makineli tabanca şarjörü "15 adetten 71 adede kadar" | Üst sınır tek bir modelin (tambur şarjör) değeri; model adı yok. | #10 çıkarıldı. |

## Çıkarılanlar (numaralar üretim sırasıyla)

| # | Sınıf | Gerekçe |
|---|---|---|
| 7 | S4 | Yivli/yivsiz av tüfeği ruhsat kuralı (6136). Mevzuat destelerinde var; kitap metni eski olabilir. |
| 8 | S10 | Toplu tabanca kapasitesi ezberi; bankada sorulmuyor. Ön yüzdeki "en yaygın" da pasajda yok. |
| 10 | S10 / S9 | Modele göre değişen şarjör kapasite aralığı, model adı olmadan. |
| 11 | S6 | `sil-tabanca-parcalari` #16 aynı bilgiye gidiyor (tırnak kovanı çeker, çıkarıcıya çarptırır); orada kalan kart bankadaki "Tırnak, çıkarıcı" sorusuna daha doğrudan karşılık. |

## Düzeltmeler

| # | Sınıf | Hakem | Sorun | Yapılan |
|---|---|---|---|---|
| 2 | S8 | PLAUSIBLE (B notu) | Ön yüz kaynak tanım cümlesine çok yakın. | Ön yüz sadeleştirildi: "mermi çekirdeğini uzak mesafeye hangi güçle fırlatır?" |
| 4 | S8 | PLAUSIBLE (B) | "Siyasi cephe savaşları" kaynaktaki bozuk ifade. | "Cephe savaşları" yazıldı; anlam korundu. |
| 6 | S8 / S10 | PLAUSIBLE (B) | "Makinalı" eski yazım; açıklamada tarihçe. | "Makineli tüfek"; açıklama çıkarıldı. |
| 9 | — | Hakem | Yeni yarı otomatik kartıyla açıklama çakışıyordu. | Açıklamadaki yarı otomatik cümlesi çıkarıldı. |
| 13 | S9 | CONFIRMED (A) | Bkz. S9 tablosu. | Ön yüz "tabancalar" ile sınırlandı; açıklama çıkarıldı. |
| 15 | S9 | PLAUSIBLE (A) | "Ruger" kilitli sistem örneği olamaz. | Örnek listesinden çıkarıldı. |
| 7 | S4 | CONFIRMED (A+B) | Ruhsat kuralı. | Çıkarıldı. |
| 8 | S10 / S2 | PLAUSIBLE (A+B) | Bkz. çıkarılanlar. | Çıkarıldı. |
| 10 | S10 | CONFIRMED (B) | Bkz. çıkarılanlar. | Çıkarıldı. |
| 11 | S6 | PLAUSIBLE (B) | Bkz. çıkarılanlar. | Çıkarıldı. |

## Eklenen kartlar (Denetçi B NOTLAR, pasaj 02-04'te açıkça var)

- Tek atışlı tabancaların ikiye ayrılışı (tek namlulu / birden fazla namlulu). Bankadaki "her atıştan sonra elle doldurulan tabanca" tanımı pasajda yok; kart yalnız ayrımı veriyor.
- Otomatik tabancada ilk dolduruşu atıcının yapması.
- Yarı otomatik tabancada her atış için tetiğin ayrı ayrı çekilmesi (bankada "tetiğin her çekilişinde bir mermi" soruluyor).

## Reddedilen bulgular

Yok. (B'nin #6 için önerdiği tarihçe çıkarma uygulandı; kart kaldı.)

## İnsan incelemesine kalanlar

- "Yüksek güçlülük (HP)" terimi (#14, #15): pasaja sadık, ama terimin geciktirme/kilitleme sisteminin genel adı olduğu şüpheli. Yayından önce bir kaynakla teyit edilmeli; teyit edilemezse iki kart çıkarılmalı.
- Kaynak eksiği (bankada sık sorulan, pasajda yok): silahların genel sınıflandırması (ateşli, ateşsiz, kimyasal, biyolojik, nükleer — 4 soru); kimyasal silah sınıfları; biyolojik silahın düşük maliyet / yüksek zarar özelliği; hafif ateşli silahların "hepsi seri atış yapmaz" özelliği; toplu tabancada "çıkarıcı yıldızı" (pasajda bu terim yok, karta eklenmedi); ilk patentli yerli yarı otomatik tabanca (Nuri Killigil). 6136 soruları mevzuat destelerinin konusu.
