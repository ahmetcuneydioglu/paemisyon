# Madde dökümünün ikinci okumayla doğrulanması

Bir Resmî Gazete nüshasının sayfa görüntülerinden çıkarılmış madde dökümü (`dokum.json`) var. Sen BAĞIMSIZ ikinci
okuyucusun: dökümü sayfa görüntüsüyle karşılaştırıp hataları bulacaksın. Bu metin bir sınav hazırlık uygulamasının
mevzuat bankasına "resmî metin" olarak girecek ve üstünden bilgi kartı üretilecek; yanlış bir sayı, atlanmış bir
fıkra ya da ters çevrilmiş bir anlam kabul edilemez.

## Yöntem

1. Sayfa PNG'lerini Read ile aç. HER maddeyi görüntüdeki karşılığıyla karşılaştır; örnekleme yapma, hepsine bak.
2. Öncelik sırasıyla ara:
   - **A (anlam):** atlanmış/çift yazılmış fıkra, bent ya da cümle; atlanmış ya da eklenmiş olumsuzluk ("değil",
     "-maz", "hariç", "ancak"); yanlış sayı, tarih, süre, oran, oy çokluğu, madde atfı; yanlış özne/organ adı;
     başka maddenin metninin karışması; sütun sırası hatası.
   - **B (sözcük):** yanlış okunmuş sözcük (anlamı değiştiren ya da değiştirmeyen), eksik/fazla sözcük.
   - **C (biçim):** yazım, noktalama, şapka, fıkra numarası biçimi. Yalnız sistematikse ya da okumayı bozuyorsa yaz.
3. Görüntü dayanaktır. Bu belgelerin başka çevirilerini biliyor olabilirsin; karşılaştırma ölçütü DEĞİLDİR. Yalnız
   şüphe üretmek için kullanabilirsin ("bildiğimle çelişiyor, görüntüye tekrar bak"), karar görüntüden verilir.
4. Emin olamadığın yerde sayfayı kırpıp büyüt (talimat dosyasındaki kırpma komutları; çıktıyı `dogrula/` alt
   klasörüne yaz). Hâlâ okunamıyorsa "okunamıyor" de, tahmin etme.
5. Dökümdeki `belirsiz` listesindeki her madde için ayrıca görüş bildir.
6. Eski yazım (basıldığı gibi) hata DEĞİLDİR. Dökümün basılı metni "düzelttiği" yerler ise hatadır (B).

## Çıktı

`dokum.json`'a DOKUNMA. Belirtilen yola `dogrulama.json` yaz:

```json
{
  "bakilan": 31,
  "bulgular": [
    { "articleNo": "14", "sinif": "A", "yer": "2. fıkra",
      "dokumde": "…dökümdeki ifade…", "goruntude": "…görüntüde okunan…",
      "sayfa": "s-04", "guven": "kesin|büyük olasılık|okunamıyor" }
  ],
  "belirsizGorusleri": [ { "articleNo": "Başlangıç", "gorus": "…" } ],
  "genel": "kısa değerlendirme: döküm bankaya girebilir mi, hangi maddeler riskli"
}
```

Son mesajında yalnız şunu bildir: bakılan madde sayısı, A/B/C bulgu sayıları, A bulgularının bir satırlık özeti,
genel değerlendirme.
