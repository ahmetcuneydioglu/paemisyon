# Güncel Bilgiler Araştırma Talimatı — 2026

Sınav değeri olan 2026 olaylarını **birincil kaynaktan** derleyip soru
üreteceksin. Hedef kitle: PAEM / Komiser Yardımcılığı adayı (güncel bilgiler
bloğu). Bugün 5 Eylül 2026.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma + tek çıktı dosyası.
2. **Her olgu birincil kaynaktan doğrulanır ve URL'si yazılır.** Kabul edilen:
   Resmî Gazete, kurum siteleri (tccb.gov.tr, iletisim.gov.tr, tuik.gov.tr,
   bakanlıklar, TFF, olimpiyat.org.tr), uluslararası örgütlerin kendi siteleri
   (un.org, nato.int, nobelprize.org, unesco.org, olympics.com), AA/TRT gibi
   ulusal ajanslar. Kabul EDİLMEYEN: sınav hazırlık siteleri, YouTube kanalları,
   blog, forum, wiki.
3. **Başka bir soru bankasından/kanalından soru KOPYALAMA.** Olgular herkese
   açıktır, soruların ifadesi telifli. Soruyu sen kuracaksın.
4. **Emin olamadığın olguyu YAZMA.** İki bağımsız resmî kaynak bulamıyorsan
   `supheli: true` işaretle ve soru üretme.
5. Tarih/sayı/isim uydurma. Yaklaşık bilgi verme.

## 1. Kapsam ölçütü

Bir olay sınav değeri taşır mı? Şu üçünden en az ikisi olmalı:
- Ulusal ya da uluslararası düzeyde **ilk / en / tek** bir yön taşıyor
- Resmî bir karar, atama, üyelik, ödül ya da düzenlemeye dayanıyor
- Adayın ezberleyebileceği **tek ve net** bir cevabı var (tarih, isim, sayı, yer)

"Şu ülkede seçim yapıldı" zayıftır; "şu ülkede seçimi kim kazandı, hangi
tarihte göreve başladı" güçlüdür.

## 2. Soru biçimi

Beş şıklı, tek doğru cevaplı. Çeldiriciler **gerçek ve makul** olmalı:
aynı kategorinin başka adayları, yakın tarihler, benzer kurumlar. Vefat etmiş
kişiyi güncel bir göreve/ödüle aday gösterme.

Kök net olsun: "hangisi doğrudur" yerine ne sorduğunu söyle.

## 3. Açıklama biçimi

**2-4 cümle.** Sırayla: (1) kuralı/olguyu içerikle söyle — şık harfiyle değil,
(2) kaynağı cümle içinde künyele (kurum + tarih), (3) varsa tuzağı belirt
(yakın tarih, benzer isim, karıştırılan kurum).

Yanlış: "Doğru cevap C şıkkıdır."
Doğru: "Türkiye, Milano-Cortina 2026 Kış Olimpiyatları'na sekiz sporcuyla
katılmış ve madalya kazanamamıştır (Türkiye Millî Olimpiyat Komitesi)."

## 4. Çıktı

`arastirma/<alan>.json`:

```json
{
  "alan": "spor",
  "sorular": [
    {"kok":"…","siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
     "dogru":"C","aciklama":"…",
     "kaynak":"Türkiye Millî Olimpiyat Komitesi, 22 Şubat 2026",
     "kaynakUrl":"https://…","olayTarihi":"2026-02-22"}
  ],
  "uretilemeyen": [
    {"konu":"…","neden":"iki resmî kaynak doğrulamadı"}
  ]
}
```

`olayTarihi` zorunlu: güncel bilgi soruları eskir, bu alan ileride eskime
taramasının tutamağıdır.

## 5. Hedef

Alanında **8-12 sağlam soru**. Sayı için kalite düşürme; 8 sağlam soru
15 şüpheliden iyidir. Üretemediklerini `uretilemeyen` listesine yaz.

## 6. Son cevabın

SADECE: dosya yolu · üretilen soru sayısı · üretilemeyen konu sayısı ·
kapsadığın başlıkların tek satırlık listesi.
