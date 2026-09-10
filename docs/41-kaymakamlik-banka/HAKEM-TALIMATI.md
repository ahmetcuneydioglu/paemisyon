# Hakem Talimatı — Doc 41, bankadaki Kaymakamlık soruları

Sorular 2020, 2021 ve 2023 Kaymakamlık sınavlarından; biz 2026'dayız. Üç
bağımsız denetçi her soruyu yürürlükteki metne karşı denetledi; sana yalnız
uyarı/eskime/anahtar şüphesi alanlar geliyor.

**Doc 40'tan kritik fark: bu sorular ŞU AN YAYINDA.** Aday onları bugün
çözüyor. "Bankaya girer mi" değil, **"yayında kalır mı"** sorusunu
cevaplıyorsun. Bu, ölçüyü sertleştirmez ama sonucu ağırlaştırır: kusurlu
dediğin soru adayın önünden kaldırılacak.

**BU TURDA DÖRT AYRI İŞ VAR, KARIŞTIRMA:**

1. **Dizgi/aktarım hatası** (yanlış yazılmış kurum adı, kanun numarası) — soru
   sağlam, metin düzeltilebilir.
2. **Mevzuat değişikliğiyle eskiyen metin** — cevap hâlâ doğru ama soru bugün
   var olmayan bir kurumu/adı gösteriyor. Güncellenmeli.
3. **Soruyu bozan mevzuat değişikliği** — hüküm iptal/değişmiş, soru bugün iki
   doğru cevaplı ya da cevapsız. KUSURLU.
4. **Cevap anahtarı hatası** — mevzuat değişmemiş, banka en baştan yanlış harfi
   işaretlemiş. Bunu `bankaCevabi` ile `denetciCevaplari` ayrıştığında ara.
   Burada karar "soru kusurlu mu" değil, **"hangi cevap doğru"**dur.

## Cevaplayacağın tek soru

> Bu kusur, soruyu çözen adayın **haklı olarak itiraz edebileceği** bir kusur
> mu; yoksa aday için görünmez kalacak bir incelik mi?

- **`KUSURLU`** — aday itiraz edebilir. Birden fazla şık savunulabilir; kök
  yanlış bir olgu içeriyor; işaretli cevap yürürlükteki metne aykırı. Bu soru
  **yayında kalamaz**.
- **`TEMIZ`** — kusur gerçek ama adayın kararını değiştirmez: dizgi pürüzü,
  uzman gözüyle görülen nüans, zaten yanlış olan bir şıkkın daha da yanlış
  olması. Soru yayında kalır.

Ölçü: **iyi hazırlanmış bir aday, doğru şıkkı bulduktan sonra bu uyarıyı okusa
"haklıymışım" mı der, yoksa "o zaman benim cevabım da doğruydu" mu der?**
İkincisi `KUSURLU`.

`bankaCevabi` kutsal değil — bankaya nasıl girdiğini bilmiyoruz. Üç denetçi
kendi aralarında hemfikirse ve bankadan ayrışıyorsa, şüphe bankanın üzerindedir.
Ama denetçilerin güveni düşükse onları da körü körüne izleme: soruyu kendin oku
ve mevzuat metnini kendin doğrula.

## MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; Prisma script'i çalıştırma.
2. **Uydurma yok.** Gerekçendeki tarih/olgu doğrulanmış olmalı; doğrulamayı
   mevzuat.gov.tr'nin güncel konsolide metninden yap. `curl`'e tarayıcı
   `User-Agent` başlığı eklemezsen uç nokta yanıt vermiyor:
   `curl -s -A "Mozilla/5.0 …" 'https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=1&MevzuatNo=5442&MevzuatTertip=3'`
3. Diğer hakemle konuşma. `anahtar-banka.json`, `esleme.json`,
   `banka-kaymakamlik.json` ve `denetim/` altındaki dosyaları açma —
   ihtiyacın olan her şey girdinde var.

## Girdi

`hakem/uyari.json` — her kayıt: `id`, `sinif`, `sinavYili`, `ders`, `kok`,
`siklar`, `bankaCevabi`, `denetciCevaplari`, `guven`, `dayanaklar`, `uyarilar`.

## Çıktı

`hakem/hakem-h<K>.json`:

```json
[{"id":"k23-32","karar":"KUSURLU",
  "dogruCevap":"D",
  "gerekce":"tek cümle — neden aday itiraz eder / edemez",
  "duzeltilebilir":"kökte 'Aile ve Sosyal Politikalar Bakanlığı' → 'Aile ve Sosyal Hizmetler Bakanlığı'"}]
```

`dogruCevap`: senin vardığın harf (bankayla aynı olabilir). `duzeltilebilir`
isteğe bağlı — kusur tek bir kelime/ad düzeltilerek gideriliyorsa neyin ne
olacağını yaz; **şık değiştirme önerme**, o düzeltme değil soruyu yeniden
yazmaktır (Doc 38 §s30). Düzeltilemiyorsa alanı koyma.

Girdideki HER kayıt için, aynı sırada.

## Son cevabın

SADECE: dosya yolu · karar sayısı · TEMİZ/KUSURLU dağılımı · bankadan ayrıştığın
soruların id'leri.
