# 09 — Silah Bilgisi turu: kaynak pasajından bilgi kartı (17 Kas 2026)

Doc 56 §12 istisnası (mevzuatı olmayan derste kart, resmî madde yerine kaynak pasajına dayanır) Silah Bilgisi'ne
uygulandı. Hat ve kurallar `07-kaynak-pasaji.md` §4–§9 ile aynıdır; bu not yalnız bu turun kararlarını ve
bulgularını tutar. **Kartların hepsi `in_review`; yayın kararı insanındır. Commit yapılmadı.**

## 1. İndirilen dosyaların değerlendirmesi

Kullanıcı `~/Downloads`'a Silah Bilgisi için üç dosya koydu (her biri ayrı boş klasöre kopyalanarak incelendi).
Daha önce incelenen `PAEM SİLAH MÜFRADAT 21_01_2022 SİYAH.pdf` müfredat çizelgesidir; yalnız kapsam haritası.

| Dosya | Ne | Yayımlayan | Boyut / metin | Karar |
| --- | --- | --- | --- | --- |
| `SİLAH BİLGİSİ-son.pdf` | "Silah Bilgisi Ders Notları" | Belirsiz (doPDF ile 2017'de üretilmiş, yazar/kurum yok) | 12 sayfa, metin katmanı var | **Dayanak olamaz.** Kişisel ders notu; editörden geçmiş yayın değil. |
| `Silah Bilgisi 2020 Ahmet ÇİFTCİ.docx` | Derleme not | Kişi (dosya adında) | ~67 bin karakter | **Dayanak olamaz.** Kendi notunda "çeşitli kaynaklardan faydalanılarak hazırlanmıştır… çıkan sorularda" diyor: soru odaklı kişisel derleme. Yalnız "ne soruluyor" bilgisi. |
| `18 SILAH BILGISI 1305-1394.DOC` | "Silah Bilgisi ve Atış" kitap bölümü (aslında .docx) | Belgede yayımcı yazmıyor; sayfa üst bilgisi "SİLAH BİLGİSİ VE ATIŞ", belge başlığı "SİLAH BİLGİSİ KİTABI", s. 1305–1394 | ~209 bin karakter, 168 görsel, içindekiler + şekil numaraları + kaynakça | **Dayanak olarak kullanıldı (koşullu).** |

**Neden üçüncüsü:** Yapısı basılı bir ders kitabının sayısallaştırılmış bölümüdür (numaralı şekiller, içindekiler,
"Faydalanılan ve Tavsiye Edilen Ana Kitaplar" kaynakçası: Şenocak 1996, Acarlı 1996, Kaya, *Silah Bilgisi ve Atış*,
EGM Mat. 1994; Ayvaz, *Silah Bilgisi*, Polis Akademisi 1991). Metinde OCR izleri var ("suçlann", I/İ kayması), yani
basılı bir metinden aktarılmış. Kişisel not değil, kurumsal ders kitabı dilinde.

**Koşul / risk:** Yayımcı ve baskı yılı belgede yok ("1305–1394" sayfa aralığı büyük bir derleme cildini
düşündürüyor). Metin 1990'lardan kalma (1998 baskı izi; PVSK md 16'nın 2007 öncesi metni, 1402 Sıkıyönetim
Kanunu anılıyor). Bu yüzden: hukuk/mevzuat bölümleri hiç pasaja alınmadı; teknik veriler denetçilere S9 (kaynak
hatası şüphesi) gözüyle sorgulatıldı. Künye kullanıcıya hiçbir yüzeyde çıkmaz (`label` yalnız panelde).

## 2. Kaynak ve pasajlar

- Kaynak: `silah-bilgisi-ve-atis` (prod, konu "Silah Bilgisi" `6f0d2a35-…`), `kind: book`.
  Künye (`label`, yalnız panel): "Silah Bilgisi ve Atış (derleme kitap bölümü, s. 1305–1394; yayımcı belgede
  yazmıyor; kaynakçası: Kaya, Silah Bilgisi ve Atış, EGM Mat., 1994 ve diğ.)".
- **122 pasaj**, 172 bin karakter. Yüklenen dosya: `girdi/sil-kaynak.json` (yeniden üretmek için kaynak budur).
- Bölme: belge PDF değil Word olduğu için `kaynak-pdf-bol.py` kullanılmadı. Paragraflar `word/document.xml`'den
  stil (Heading1–4, kalın kısa satır, tamamı büyük harf satır) bilgisiyle okundu; şekil/fotoğraf altı yazıları
  (bozuk kodlamalı "Þekil…" kopyaları dahil) ve "(Şekil 12)" göndermeleri temizlendi; küçük bölümler aynı üst başlık
  altında birleştirildi, 4.800 karakteri aşanlar paragraf sınırından bölündü. Bölücü belgeye özgü (paragraf
  aralıkları elle) olduğundan `apps/api/scripts/`'e konmadı; çıktı `girdi/sil-kaynak.json`'da duruyor.
- Pasaja alınmayanlar: "Silah Bilgisi ve Önemi", "Güç ve Sorumluluğun Kanuni Kaynakları", "Silah Kullanmanın
  Hukuki Şartları", "Polise Silah Kullanma Yetkisi Veren Kanun Maddeleri" (mevzuat; eski metin; 6136/PVSK/3201
  kartları zaten yayında) ve Kaynakça.
- Numaralama bölüm önekli: 01 emniyet kuralları · 02 terminoloji, parçalar, fişek · 03 atış pozisyonları ·
  04 nişan · 05 doldurma/söküm · 06 tabanca ve MP-5 modelleri · 07 tutukluk ve tüfekler (G-3, AK-47, M-16) ·
  08 bakım · 09 kimyasal silahlar ve gaz mühimmatı · 10 patlayıcılar, maske, yelek.
- OCR karşılaştırması: kaynak hazır metin katmanlı Word belgesi olduğu için bizim tarafımızda OCR yapılmadı; ama
  metnin kendisi eski bir OCR/dizgi ürünü. Sayı ve ölçüdeki kaymaları denetçiler S9 olarak yakaladı (aşağıda).

## 3. Desteler

Üretim `kart-uret.ts` (kaynak kipi, kopya kapısı içinde, model claude-opus-5-5). Her deste: Denetçi A (pasaja
sadakat) + Denetçi B (kart kalitesi) bağımsız alt ajan, hakem ayrı alt ajan; talimatlar
`denetim/sil-TALIMAT-DENETIM.md` (S1–S11 sınıfları; S9 = kaynak hatası şüphesi, S11 = zararlı ayrıntı) ve
`denetim/sil-TALIMAT-HAKEM.md`. Raporlar `denetim/sil-*.md`; son mekanik kapı çıktıları `uretim/sil-*.dogrulama.md`
(13'ü de "geçti").

| Deste | Pasaj | Üretim | Son | Karar |
| --- | --- | --- | --- | --- |
| sil-emniyet-kurallari | 01-01…01-04 | 16 | 18 | GEÇTİ |
| sil-siniflandirma | 02-01…02-06 | 15 | 14 | GEÇTİ |
| sil-tabanca-parcalari | 02-07…02-09 | 22 | 18 | GEÇTİ |
| sil-fisek-balistik | 02-10…02-16 | 21 | 19 | GEÇTİ |
| sil-atis-temelleri | 03-01…03-07 | 17 | 17 | GEÇTİ |
| sil-nisan-alma | 04-01…04-09 | 20 | 14 | GEÇTİ |
| sil-doldurma-sokme | 05-01…05-12 | 19 | 12 | GEÇTİ |
| sil-tabanca-modelleri | 06-01…06-14 | 26 | 18 | GEÇTİ |
| sil-mp5 | 06-15…06-23 | 18 | 12 | GEÇTİ |
| sil-tutukluk-tufekler | 07-01…07-13 | 24 | 20 | GEÇTİ |
| sil-bakim-temizlik | 08-01…08-03 | 14 | 12 | GEÇTİ |
| sil-kimyasal-silahlar | 09-01…09-08 | 22 | 11 | GEÇTİ |
| sil-gaz-muhimmati | 09-09…09-25 | 23 | — | **KALDI, yüklenmedi** |
| sil-patlayici-koruyucu | 10-01…10-10 | 18 | 15 | GEÇTİ |
| **Toplam** | | **275** | **200** | 13 deste |

Prod (salt-okur sayım, 17 Kas 2026): Silah Bilgisi konusunda 13 deste, **200 kart, hepsi `in_review`**, 217 kart–pasaj
bağı. Yayında Silah Bilgisi kartı yok; `kart-toplu-yayin.ts` çalıştırılmadı.

**Gaz mühimmatı destesi neden kaldı:** gövdesi ürün kodlu kimyasal mühimmatın (gaz fişeği/tüfeği/roketi, gaz el
bombaları ve ateşleme düzeni, spreyler) madde miktarı, gecikme ve yayma süresi, menzil/delme mesafesi ve söküm
adımlarıydı. Denetçi A'nın alıntılı raporu bir güvenlik sınıflandırıcısınca durduruldu; bu, S11 sinyali sayıldı.
Bankadaki sorular bu ürün verilerini sormuyor. Aynı gerekçeyle kimyasal silahlar destesinden kapalı alanda doz/süre
hesabı, mühimmat madde hacmi ve ürün numaralı fişek/tüfek kartları; patlayıcılar destesinden fitil hızı ve fünye
dolgusu çıkarıldı. Kalan içerik tanım, sınıflandırma, CN/CS etkileri, ilk yardım, güvenlik kuralları ve koruyucu
donanımdır.

Desteler arası çift kart son kontrolü: G-3 ve MP-5 E-T-S mandal kartları aynı cevaba gittiği için MP-5'teki
çıkarıldı (`denetim/sil-mp5.md` sonundaki not); yerine getiren yay kartı yalnız `sil-siniflandirma`'da; ateşleme
tertibatı kartı `sil-tabanca-parcalari`'nda ad sorusu, `sil-fisek-balistik`'te ilke sorusu olarak kaldı.

## 4. Kaynak hatası şüphesi (S9) — kartlara yazılmadı

Kural (`07` §9 P9): şüpheli değer ne kaynaktaki hâliyle ne "bilinen" hâliyle karta yazılır; kart sayısız kurulur ya
da çıkarılır. Denetçi/hakem değerleri ikinci kaynaktan doğrulanmadı.

- Berdan kapsülü "1965" (bilinen 1860'lar); Boxer için "eleştirilmiştir" (geliştirilmiş). Kartlara girmedi.
- Kalibre birimi: "ABD inch'in 1/100'ü, İngiltere 1/1000'i" ayrımı yanlış (ABD'de de binde birlik adlar var);
  "38 kalibre = 9,652 mm" yalnız adın çevirisi. İki kart çıkarıldı.
- .357 Magnum'un normal fişekten "tek farkı" ilk hız/enerji iddiası (kovan da uzun); kart daraltıldı.
- "12,7 mm havan", Browning/Parabellum ayrımının uç biçimine bağlanması; ilgili kartlar çıkarıldı.
- Ateş almayan fişekte bekleme "15 saniye" (yaygın öğreti 30 sn); kart sayısız tuzak oldu.
- "ISOSCALES (İsrail) modeli" (doğrusu Isosceles; köken şüpheli); kart ad ve köken taşımadan kuruldu.
- Nişan: 04-02 ile 04-06 nişan noktasında çelişiyor; "gezin üst kenar ortak noktası" dizgi kayması; nefes tutmanın
  "geçersizliği" ve sabit 6/8 saniye sınırları yazar görüşü. İlgili kartlar çıkarıldı ya da tartışmasız bilgiyle
  yeniden kuruldu.
- Model verileri: Kırıkkale seri üretim yılı ve kapasitesi, CZ 75 Mod. 75/75 B karışması, S&W set sayısı (4 / bilinen
  5), MP-5 atış sürati (650 / bilinen ~800), MP-5 dipçik kısalması (kaynağın kendi tablosuyla çelişen 19 cm),
  M-16 A2 BURST kademesi, 800 m tesirli menzil, atış sürati; G-3 makaralarının "kilitlemesi", AK-47'nin "geri tepen
  gazla" çalışması. Kartlar çıkarıldı ya da iddia çıkarılarak yeniden kuruldu.
- Kaynak dizgi hataları (kartlara doğru anlamla ya da hiç girmedi): 05-08 "zorlanmalıdır" (zorlanmamalı), 05-09
  "bırakıldığı sürece" (bırakılmadığı), 07-12 karabin çapı "1.56", 08-02 "Gez kapağı" (gaz kapağı), 10-xx
  "kurşun azadür", 09-22 top bomba ölçüsü "mm" (cm olmalı).
- Patlayıcı/koruyucu: şüpheli bomba yol kapatma mesafesi "1–40 m" (güncel tahliye mesafeleri çok daha büyük),
  gaz maskesi için iki farklı oksijen eşiği (%16 ve %19,5); maske göz ölçüsü cümlesi bozuk. Kartlar çıkarıldı ya da
  sayısız kuruldu.
- Kaynak, 05-07…05-12'de hangi silahı anlattığında tutarsız (başlık G-3, metin makineli tabanca); 08-02/08-03 tüfek
  bakımı gazla çalışan bir tüfeği anlatıyor (G-3 ve MP-5 gazla çalışmaz). Bu kartlarda silah adı yazılmadı.

## 5. Kaynak eksiği (bankada sorulan, kaynakta olmayan; kart yazılmadı)

- **JGY 167-3(B) Mekanik, Nişancılık ve Atış Eğitimi Yönergesi** soruları (~40 soru: SAR 308, SAR 109T, MPT-76,
  PKM, MG-3, HK-23, KPWT, Dragunov, RPG-7, Vector 1500, el bombası tesir sahaları, GESTAY+2B…). Bankadaki en büyük
  boşluk; kaynağı bu yönergedir ve elimizde yok.
- Emniyet tertibatlarının **ana/yardımcı ayrımı**, ikaz pimi emniyeti; Astra, Beretta 92FS, Yavuz 16, Canik,
  Sarsılmaz emniyetleri.
- Fişeğin bölümleri listesi, **9x19 / 7,62x51 gösteriminin anlamı**, 38 Special, traje, balistik bulgu, balistiğin
  tanımı, rampa yeri ifadesi ("çıkarıcı yıldızı" terimi kaynakta yok; "yıldız şeklindeki tırnak" var).
- Ateşleme tertibatının işleyiş sırası (tetik–manivela–horoz–iğne), tabancanın ana parçaları sıralaması, "takma
  sökmenin son adımından başlar" kuralı.
- Bakım türleri (günlük/haftalık/yıllık), PKM için ham bezir yağı.
- Silahların genel sınıfları ve **kimyasal/biyolojik silah sınıflandırması** (yakıcı, zehirleyici, bayıltıcı, göz
  yaşartıcı; "parça tesirli değil", "bulaşıcı değil"), 1915 klor gazı, biyolojik silahın maliyeti; kimyevi bombanın
  fabrikasyon sayılması; savunma tipi el bombası.
- Nuri Killigil; 1-3-5 atış çalışması; taşıma üçlüsü; EGM Atış Yönetmeliği (kask).

Bu boşlukların çoğu iki kaynakla kapanır: (1) JGY 167-3(B) yönergesi (Jandarma; kamuya açık mı belirsiz), (2) Polis
Akademisi "Silah ve Taktik Atış" ders kitabı (müfredatın kaynakçasında anılan güncel kitap).

## 6. Açık kararlar (kullanıcıda)

1. **Kaynağın kabulü:** künyesi eksik, 1990'lardan kalma bir kitap bölümü dayanak yapıldı. Yayından önce bunun
   kabul edilip edilmediği; mümkünse kitabın künyesinin (yazar/yayımcı/yıl) bulunması.
2. **Yayın:** 13 deste / 200 kart `in_review`. Panelden tek tek ya da toplu yayın (toplu yayın her kartı kendi
   kapısından geçirir).
3. **Kalan model teknik verisi:** G-3 (menzil, atış sürati, ilk hız), AK-47 gez 800 m, M-16 723/733 namlu ve menzil,
   MP-5 şarjörsüz ağırlık (2,450 kg; bankada soruluyor). Denetçiler somut çelişki bulmadı ama veriler modele/sürüme
   göre değişir; istenirse bu kartlar çıkarılabilir.
4. **Gaz mühimmatı destesi** yüklenmedi; istenirse yalnız niteliksel güvenlik kuralları içeren küçük bir deste.
5. **İkinci kaynak** (JGY 167-3(B) ve/veya Polis Akademisi ders kitabı) sağlanırsa kaynak eksiği listesi için yeni tur.
6. Hakemlerin insan incelemesine bıraktığı tekil noktalar her destenin `denetim/sil-*.md` dosyasının sonunda
   (ör. emniyet destesinde "ateş hattının gerisi" ifadesi, fişek destesinde dip tablası eşlemesi, CZ 75 "kapak
   takımı" terimi, kimyasal destede iki farklı iyileşme süresi, siniflandirma'da "yüksek güçlülük (HP)" terimi).
