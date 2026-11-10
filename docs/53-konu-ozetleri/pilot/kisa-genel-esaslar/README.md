# Genel esaslar — kısa pilot

5 Kasım 2026. Kapsam: kullanıcı onaylı kısa içerik pilotu ve açılabilir ayrıntı önizlemesi.

- Mevcut 23 blok yerine 8 öğrenme kartı. İçe aktarma dosyasında bunlara betikle doldurulan istatistik ve soru köprüsü eklenir: toplam 10 blok.
- Ana gövde 279 kelime; önceki dosyanın ana gövdeleri 871 kelime: yaklaşık %68 azalma. Başlıklar, tablolar ve ayrıntılar bu karşılaştırmaya dahil değildir.
- İki sayı tablosu kaldırıldı. Sayısal olmayan listeler ayrıca sayım ezberine dönüştürülmedi.
- Yetkiler tek karşılaştırma kartına toplandı. Bilinçli son tekrar dışında aynı ayrım yeniden anlatılmadı.
- Kaynak kapsamı md 1–11; mevcut referanslar korunur. Resmî metin: https://anayasa.gov.tr/tr/mevzuat/anayasa/

## Dosyalar

- `onizleme.html`: bağımsız, açık/koyu temalı inceleme önizlemesi; gerçek soru seansı başlatmaz.
- `onizleme-icerik.json`: kısa gövde ve isteğe bağlı ayrıntıların editoryal kaynağı.
- `Genel-esaslar-kisa-pilot.md`: okunabilir pilot.
- `unite.json`: mevcut içe aktarma şemasına uygun kısa sürüm; özgün yayının üzerine yazmamak için ayrı pilot slug'ı. Ayrıntı alanı mevcut API şemasında yoktur; bu dosya yalnız kısa gövdeleri içerir. Ürün entegrasyonunda ayrıntıların da sürümlenmesi ve madde doğrulamasından geçirilmesi gerekir.

## Doğrulama

Mevcut `ozet-dogrula.ts`, gerçek veritabanına salt okunur bağlantı, connection_limit=1: **GEÇTİ · 10 blok · 17 bağlı soru**. İstatistikler `--write` ile yalnız yerel JSON dosyasına dolduruldu. Bu kontrol referans ve sayıları denetler; hukuki anlam denetimi veya insan yayın onayı yerine geçmez. Önizlemedeki ek ayrıntılar CLI girdisinde değildir.

Tarayıcıda tek ayrıntı açma, tümünü açma ve açık tema kontrol edildi. Canlı veritabanına yazılmadı; yayın ve mobil uygulama değişmedi. Okuma süresi 5 dk editoryal tahmindir, kullanıcı ölçümü değildir.
