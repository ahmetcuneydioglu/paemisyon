# Doc 36 — Açıklama Talimatı (PAEM 9 / 2025)

Bu sınavın soruları bankaya **açıklamasız girmez**. Açıklama, ürünün PDF'ten
farkının ta kendisi: aday cevabı değil, *neden* o cevap olduğunu almak için
geliyor.

## Girdi

- `parti/<parti>-kor.json` — soru metni ve şıklar
- `parti/<parti>-anahtar.json` — resmî cevap (bu aşamada görebilirsin)
- `denetim/<parti>-karar.json` — iki denetçinin gerekçeleri, kaynakları,
  uyarıları ve varsa eskime notu

## Çıktı

`aciklama/<parti>.json` — dizi:

```json
{ "no": 12, "aciklama": "...", "kaynak": "5271 sayılı CMK md 91/3", "kaynakUrl": "https://..." }
```

## Açıklama nasıl yazılır

1. **Önce doğru cevabın dayanağı.** Hangi madde/fıkra, ne diyor. Maddeyi
   numarasıyla ver; adayın kanuna gidebilmesi gerekir.
2. **Sonra çeldiriciler.** En az bir yanlış şıkkın neden yanlış olduğunu yaz —
   özellikle adayın takılacağı şıkkı. Beş şıkkı tek tek saymak gerekmez.
3. **2-5 cümle.** Ders kitabı değil, sınav sonrası açıklama.
4. Matematik/analitik sorularda dayanak **çözümün kendisidir**: adımları
   sırayla yaz, sonucu şıkla eşleştir.

## Kurallar

- **Kaynak etiketi açıklamaya yazılmaz.** "PAEM 9'da çıkmıştı" gibi bir cümle
  kurma; sınav kimliği zaten sayfanın başlığında.
- **Uydurma madde numarası yasak.** Emin değilsen maddeyi mevzuat.gov.tr'den
  doğrula; doğrulayamıyorsan numara vermeden anlat.
- **Denetçi uyarısı varsa açıklamada karşıla.** İki şık savunulabilir
  görünüyorsa, hangi ifadenin tercihi belirlediğini yaz — aday aynı yerde
  takılacak.
- **Eskime varsa açıkça söyle.** Şu kalıpla:
  *"Sınavdaki resmî cevap D idi. 7590 sayılı Kanun'un (2026) 4. maddesiyle
  değişen hüküm nedeniyle bugün doğru cevap B'dir."*
  Bunu gizlemek adayı yanlış bilgiyle bırakır.
- **İptal edilen sorularda** (sınavda iptal edilmiş 3 soru) açıklama yine
  yazılır, ama başına şu eklenir: *"Bu soru sınavda iptal edilmiştir."*
