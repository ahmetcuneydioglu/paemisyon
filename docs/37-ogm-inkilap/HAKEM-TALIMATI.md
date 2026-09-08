# Hakem Talimatı — Doc 37, uyarı alan sorular

Denetim bitti. Elindeki soruların **cevabı tartışmalı değil**: iki bağımsız
denetçi de aynı şıkta ve MEB anahtarıyla aynı fikirde. Senin işin cevabı
bulmak değil, denetçilerin düştüğü **uyarının ağırlığını** tartmak.

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

## MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; Prisma script'i çalıştırma.
2. **Uydurma yok.** Gerekçende yazdığın tarih/olgu doğrulanmış olmalı.
3. Diğer hakemle konuşma.

## Girdi

`hakem/uyari.json` — her kayıt: `id`, `kok`, `siklar`, `cevap` (anahtar),
`uyarilar` (denetçilerin yazdığı).

## Çıktı

`denetim/hakem-h<K>.json`:

```json
[{"id":"t2s9","karar":"TEMIZ","gerekce":"tek cümle — neden aday itiraz edemez"}]
```

Girdideki HER kayıt için, aynı sırada.

## Son cevabın

SADECE: dosya yolu · karar sayısı · TEMİZ/KUSURLU dağılımı.
