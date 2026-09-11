# Hakem Talimatı — Doc 44, KPSS 2024 Hukuk, uyarı alan sorular

Sorular **2024 KPSS Hukuk alan sınavından**; biz 2026'dayız. İki
bağımsız denetçi her soruyu 2026'nın yürürlükteki metnine karşı denetledi.

**BU TURDA ÜÇ AYRI İŞ VAR, KARIŞTIRMA:**

1. **Transkript/dizgi kusuru** — kaynakta metin katmanı yoktu, sayfa
   görüntüden yazıya döküldü (iki bağımsız okuma birebir uyuştu ama ÖSYM
   filigranı bazı kelimelerin üstüne biniyordu). Yanlış okunmuş bir kelime
   olabilir; soru sağlam, metin düzeltilebilir.
2. **Mevzuat değişikliğiyle eskiyen metin** — cevap hâlâ doğru ama soru bugün
   var olmayan bir kurumu/adı gösteriyor. Güncellenmeli.
3. **Soruyu bozan mevzuat değişikliği ya da soru kurgusu kusuru** — hüküm
   iptal/değişmiş ve soru bugün iki doğru cevaplı ya da cevapsız hâle gelmiş;
   ya da şıkların ikisi birden savunulabilir. Bu KUSURLU'dur; düzeltmek soruyu
   yeniden yazmak olur.

## Cevaplayacağın tek soru

> Bu kusur, soruyu çözen adayın **haklı olarak itiraz edebileceği** bir kusur
> mu; yoksa aday için görünmez kalacak bir incelik mi?

İki karar var, üçüncüsü yok:

- **`KUSURLU`** — aday itiraz edebilir. Birden fazla şık savunulabilir; kök
  yanlış bir tanım/olgu içeriyor; doğru cevap ancak kaynağın kendi tasnifini
  ezberlemiş biri için tek. Bu soru bankaya GİRMEZ.
- **`TEMIZ`** — kusur gerçek ama adayın kararını değiştirmez: dizgi/ifade
  pürüzü, uzman gözüyle görülen bir nüans, zaten yanlış olan bir şıkkın daha
  da yanlış olması. Bu soru bankaya girer.

## Ölçü

Bankanın varlık nedeni, adayın itiraz edemeyeceği sorudur. Ama her nüansı
kusur saymak da bankayı boşaltır. Ölçün şu olsun: **iyi hazırlanmış bir aday,
doğru şıkkı bulduktan sonra bu uyarıyı okusa "haklıymışım" mı der, yoksa
"o zaman benim cevabım da doğruydu" mu der?** İkincisi `KUSURLU`.

Denetçiler kendileri "doğru cevabı değiştirmiyor" diye yazmışsa bunu ciddiye
al — ama körü körüne değil, soruyu kendin okuyarak.

**ÖSYM sorusu olması tek başına temize çıkarmaz.** Sınavda iptal edilmiş ya da
itiraz üzerine cevabı değiştirilmiş sorular olur. Ama "ÖSYM böyle demiş" bir
veri: iki şık savunulabilir görünüyorsa önce kendi okumanı gözden geçir.

## MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; Prisma script'i çalıştırma.
2. **Uydurma yok.** Gerekçende yazdığın tarih/olgu/madde doğrulanmış olmalı.
3. Diğer hakemle konuşma.
4. Bu sınavın cevap anahtarını internette arama; anahtar sana zaten veriliyor.

## Girdi

`hakem/uyari.json` — her kayıt: `id`, `kok`, `siklar`, `cevap` (anahtar),
`uyarilar`, `eskimeler`, `guncellemeler` (denetçilerin yazdığı).

## Çıktı

`denetim/hakem-h<K>.json`:

```json
[{"id":"q29","karar":"TEMIZ","gerekce":"tek cümle — neden aday itiraz edemez",
  "duzeltilebilir":"D şıkkında 'kamulaştırma' → 'kamulaştırma' (dizgi)"}]
```

`duzeltilebilir` isteğe bağlıdır: kusur tek bir kelime/tarih/sayı
düzeltilerek giderilebiliyorsa neyin ne olması gerektiğini yaz. **Şık
değiştirmek düzeltme değildir** — bir şıkkın içeriğini başkasıyla değiştirmeyi
öneriyorsan bu soruyu yeniden yazmaktır, önerme. Karar kullanıcının, ama
seçeneği görebilmesi lazım. Düzeltilemiyorsa alanı koyma.

Girdideki HER kayıt için, aynı sırada.

## Son cevabın

SADECE: dosya yolu · karar sayısı · TEMİZ/KUSURLU dağılımı.
