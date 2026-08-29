# Sınıf Bulgusu — "2026 İPC uygulama tablosu" soruları

28 Ağustos 2026 · Kabahatler m.22 kümesi denetlenirken ortaya çıktı.

## Sorun

Yayın külliyatında **24 soru** `sourceLabel` alanında *"2026 İPC uygulama
tablosu"*na atıf yapıyor. Bu sorular tek tek denetlenemiyor, çünkü:

1. **Dayandıkları kanunların resmî metni külliyatta yok.** Soru gövdelerinde
   geçen ve `LawArticle` kaydı bulunmayan kanunlar: 6458 (YUKK), 5199
   (Hayvanları Koruma), 2860 (Yardım Toplama), 4250 (İspirtolu İçkiler), 2920
   (Sivil Havacılık), 7258 (Şans Oyunları), 1593 (Umumi Hıfzıssıhha), 4207
   (Tütün Ürünleri).
2. **Atıf yapılan "2026 İPC uygulama tablosu" elimizde yok.** Ceza miktarları,
   yetkili makam ve itiraz mercii bilgileri bu tablodan geliyor; tablo
   görülmeden doğrulama yapılamıyor.
3. `mevzuat.gov.tr`'ye WebFetch **sertifika hatası** veriyor
   (`unable to verify the first certificate`) — Doc 31'de de aynı tuzağa
   düşülmüştü.

## Dağılım

| Konu | Soru |
|---|---:|
| 5326 Kabahatler Kanunu | 16 |
| 1774 Kimlik Bildirme Kanunu | 4 |
| 6458 Yabancılar ve Uluslararası Koruma Kanunu | 4 |

`6458` konusu külliyatta var ama **hiç madde metni yüklenmemiş**.

## Şu ana kadar bu sınıftan işaretlenenler (`manuel_inceleme`)

| Soru | Eksik kaynak |
|---|---|
| `d254b76e` | 6458 m.102 (A, C, D şıkları doğrulandı; B açık) |
| `3740141f` | 6458 m.102, 1593 m.282, 5199 m.28, 2860 m.29, 4250 m.7 |
| `44f1a738` | 4250 m.7 |
| `6171aea8` | 2920 m.144 |
| `74b5f333` | 5199 Geçici m.3 |
| `78a8809b` | 7258 m.5, 6458 m.102, 4207 m.5 (m.34 ve m.43 doğrulandı) |
| `e73f8746` | 4207 m.5 tam metni |
| `fda4af68` | 2860 m.29 |

Bunların hiçbirinde "yanlış" tespiti yok — **denetlenemedi**. İşaretli cevaplar
makul görünüyor; ancak talimat gereği kaynaksız doğrulama yapılmadı.

## Öneri

Denetimi sürdürebilmek için bu sekiz kanunun resmî metni külliyata yüklenmeli.
Doc 31'de mevzuat.gov.tr sertifika sorunu şöyle aşılmıştı: **aynayı kullan** —
metni barındıran başka bir resmî site (ör. `webdosya.csb.gov.tr`) WebFetch ile
çekilip PDF yerel diske indiriliyor, sonra `pdftotext -layout` ile ayrıştırılıyor.

Ayrıca "2026 İPC uygulama tablosu" bir iç belge ise, denetimin ona da erişmesi
gerekir; yoksa bu 24 soru kalıcı olarak doğrulanamaz durumda kalır.

**Bu iş Aşama 1'in geri kalanını bloke etmiyor** — diğer kanunların metni elde
ve denetim onlarla sürüyor.
