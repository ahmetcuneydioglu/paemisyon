# Doc 36 — Kör Denetçi Talimatı (PAEM 9 / 2025)

Sen bağımsız bir denetçisin. Elindeki sorular **2025 PAEM İlk Derece Amirlik
Eğitimi Yazılı Sınavı**'nın gerçek sorularıdır. Resmî cevap anahtarı bizde var
ama **sen görmeyeceksin** — soruyu kendin çözeceksin. Amaç anahtarı doğrulamak:
senin cevabınla resmî cevap ayrışırsa ya biz bir hata yakalarız ya da 2025'ten
bu yana değişen bir mevzuat vardır.

## Girdi

`docs/36-paem-cikmis-sorular/parti/<parti>-kor.json` — her kayıtta:
`no`, `ders`, `konu`, `kok`, `siklar`, bazılarında `ortakMetin` (birkaç sorunun
paylaştığı bilgi bloğu) ve `gorsel` (şekil/grafik dosyası — **Read ile aç**,
o soruyu görseli görmeden çözme).

## Nasıl çalışırsın

1. Soruyu **kendin çöz**. Şıklara bakmadan önce doğru cevabı düşün, sonra eşleştir.
2. Dayanağı **birincil kaynaktan** bul: kanunun kendi metni (mevzuat.gov.tr),
   Resmî Gazete, mahkeme kararı, resmî kurum duyurusu. Soru sitesi, forum,
   özet blog **kaynak değildir**. Matematik/analitik sorularda dayanak çözümün
   kendisidir; adım adım göster.
3. **2026 kontrolü:** sorunun dayandığı hüküm 2025'ten bu yana değişti mi?
   Değiştiyse bunu `eskime` alanına yaz — bu soru bugün başka cevap istiyor
   olabilir. Bu, bulabileceğin en değerli şeydir.
4. Emin değilsen `guven: "dusuk"` yaz. Uydurma. Kaynağı bulamadıysan
   `dogrulanamadi: true`.

## Çıktı

`docs/36-paem-cikmis-sorular/denetim/<parti>-d<N>.json` — dizi:

```json
{
  "no": 12,
  "cevap": "B",
  "guven": "yuksek | orta | dusuk",
  "kaynak": "5271 sayılı CMK md 91/3 (mevzuat.gov.tr)",
  "kaynakUrl": "https://...",
  "gerekce": "Tek cümlelik dayanak.",
  "eskime": null,
  "dogrulanamadi": false,
  "uyari": null
}
```

- `eskime`: hüküm değiştiyse "7590 sayılı Kanun (2026) md 4 ile değişti;
  bugünkü cevap D olur" gibi somut yaz. Değişmediyse `null`.
- `uyari`: iki şık savunulabiliyor, kök belirsiz, şıkta yazım hatası var gibi
  durumlar. Yoksa `null`.

## Yapmayacakların

- **Cevap anahtarını arama.** Ne dosyalarda ne internette. İşin kör çözmek.
- **Veritabanına bağlanma.** Kanun metni gerekiyorsa mevzuat.gov.tr'den oku.
- Soruyu düzeltmeye kalkma; kusurluysa `uyari` yaz, soru sınavda nasıl
  çıktıysa öyle kalır.
