# Hakem Talimatı — Doc 40, Kaymakamlık 2022, uyarı alan sorular

Sorular **2022 Kaymakamlık sınavından**; biz 2026'dayız. Üç bağımsız denetçi
her soruyu 2026'nın yürürlükteki metnine karşı denetledi.

**BU TURDA ÜÇ AYRI İŞ VAR, KARIŞTIRMA:**

1. **Kaynağın dizgi hatası** (yanlış kanun numarası, yazım hatası) — soru
   sağlam, metin düzeltilebilir.
2. **Mevzuat değişikliğiyle eskiyen metin** — cevap hâlâ doğru ama soru bugün
   var olmayan bir kurumu/adı gösteriyor. Güncellenmeli.
3. **Soruyu bozan mevzuat değişikliği** — hüküm iptal/değişmiş ve soru bugün
   iki doğru cevaplı ya da cevapsız hâle gelmiş. Bu KUSURLU'dur; düzeltmek
   soruyu yeniden yazmak olur.

Kararında bu üçünü ayırt et. `kaynakDogrulamasi` alanı varsa kusurun kaynağa
ait olduğu KESİNLEŞMİŞ demektir.

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
[{"id":"s7","karar":"TEMIZ","gerekce":"tek cümle — neden aday itiraz edemez",
  "duzeltilebilir":"kökte '15-22 Temmuz 1921' → '15-21 Temmuz 1921'"}]
```

`duzeltilebilir` isteğe bağlıdır: kusur tek bir kelime/tarih düzeltilerek
giderilebiliyorsa neyin ne olması gerektiğini yaz. Karar kullanıcının, ama
seçeneği görebilmesi lazım. Düzeltilemiyorsa alanı koyma.

Girdideki HER kayıt için, aynı sırada.

## Son cevabın

SADECE: dosya yolu · karar sayısı · TEMİZ/KUSURLU dağılımı.
