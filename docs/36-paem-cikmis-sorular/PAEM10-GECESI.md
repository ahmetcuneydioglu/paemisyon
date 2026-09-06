# PAEM 10 — sınav akşamı yapılacaklar

Sınav biter bitmez binlerce kişi `"paem 10 çıkmış sorular"` diye arayacak ve
ortada hiçbir şey olmayacak. O aramayı karşılamak, bu işin en yüksek getirili
tek parçası. Aşağıdakiler **önceden hazır**; akşam yalnız içerik üretilecek.

## Hazır olanlar

- **URL ayrılmış:** `/paem-cikmis-sorular/paem-10-2026`
  (kayıt `draft`, tür `analiz`, 100 soru, tanıtım metni yazılı).
  Panelde **Çıkmış Sınavlar → PAEM 10 → Yayına al** ile tek tıkla açılır.
- Vitrin, sayfa şablonu, sitemap ve iç bağlantılar çalışıyor.
- Analiz yazma script'i format bağımsız: `cikmis-analiz-yaz.ts`.

## Akşam sırası

**1. Konu dağılımını topla.** Adaylardan gelen hatırlatmalar; PAEM 6 ve 7'de
kullandığımız biçim yeterli (satır başına: ders/kanun etiketi + hatırlanan
konu). En az 30-40 satır toplanınca dağılım anlamlı olur.

**2. Analiz JSON'unu yaz** (`docs/36-paem-cikmis-sorular/analiz/paem-10-2026.json`):

```json
{
  "kaynak": "sınava girenlerden derlenen kayıtlar (N katılımcı)",
  "uyari": "Bu dağılım aday beyanına dayanır ve YAKLAŞIKTIR; resmî kitapçık yayımlandığında güncellenecektir.",
  "dersDagilim": { "Polis Mevzuatı": 10, "Genel Kültür ve Analitik Düşünme": 30 },
  "kanunDagilim": { "2559": 4 }
}
```

`uyari` alanı zorunlu — script boş bırakırsan çalışmaz. Gerekçesi: aday
beyanından çıkarılmış bir dağılımı kaynağını söylemeden yayımlamak, ölçtüğümüz
şeyi olduğundan kesin göstermektir.

**3. Yaz ve yayına al:**

```bash
cd apps/api && APPLY=1 npx tsx scripts/cikmis-analiz-yaz.ts paem-10-2026 \
  ../../docs/36-paem-cikmis-sorular/analiz/paem-10-2026.json
```

Sonra panelden **Yayına al**. Sayfa ISR ile en geç bir saat içinde, sitemap de
aynı turda tazelenir.

## Resmî kitapçık çıkınca

1. `paem9-ayristir.ts`'i kitapçığa göre uyarla (sütun sınırı ve sayfa aralığı
   değişebilir; A/B çapraz doğrulaması aynen çalışır).
2. `paem9-siniflandir.ts` → blok tablosunu **yeni sınava göre yeniden kur**;
   PAEM'in blok düzeni dönemler arasında değişiyor (2022'de Polis Mevzuatı 30,
   2025'te Genel Kültür 30).
3. Kör denetim → açıklama → `paem9-bankaya-yaz.ts` benzeri yazım.
4. `PastExam.kind` değerini **`analiz` → `resmi`** yap ve dağılımı sorulardan
   hesaplanan gerçek dağılımla değiştir.
5. `cikmis-vitrin-sec.ts paem-10-2026` ile 20 açık soruyu seç.
6. `cikmis-sinav-motora-bagla.ts paem-10-2026` ile "sınav gibi çöz"ü aç.

## Yapmayacaklarımız

- **Aday hatırlatmasından soru üretip "çıkmış soru" diye yayımlamak.** Kök
  yanlış hatırlanmış olabilir, şık eksik olabilir. Konu analizi dürüst,
  uydurma soru değil.
- **Rozeti gizlemek.** Sayfa `analiz` türündeyken başlık da meta açıklaması da
  "konu analizi" der; aday tıklamadan önce ne bulacağını bilir.
- **Resmî kitapçık gelmeden `kind` alanını `resmi` yapmak.**
