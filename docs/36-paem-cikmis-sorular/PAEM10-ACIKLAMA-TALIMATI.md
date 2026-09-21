# Doc 36 — Açıklama Talimatı (PAEM 10 / 2026)

Bu sınavın soruları bankaya **açıklamasız girmez**. Açıklama, ürünün PDF'ten
farkının ta kendisi: aday cevabı değil, *neden* o cevap olduğunu almak için
geliyor. Kitapçık zaten internette; bizim sattığımız şey açıklama.

PAEM 9 talimatından **üç farkı** var, üçü de aşağıda işaretli:
tek denetçili kör geçiş, bağlayıcı hakem notları ve dört kusurlu soru.

## Girdi

- `parti/paem10-<parti>-kor.json` — soru metni ve şıklar
- `parti/paem10-<parti>-anahtar.json` — resmî cevap (bu aşamada görebilirsin)
- `denetim/paem10-<parti>-d1.json` — **tek** denetçinin gerekçesi, kaynağı,
  uyarısı. PAEM 9'da iki denetçi vardı; burada bir tane. Denetçinin gerekçesi
  bir başlangıç noktasıdır, **doğrulanmış gerçek değildir** — madde numarasını
  kendin teyit et.
- `denetim/paem10-aciklama-notlari.json` — hakemlik turundan çıkan notlar.
  **Kendi sorunun numarası bu dosyada geçiyorsa, oradaki `aciklamaNotu`
  BAĞLAYICIDIR.** Hakem soruyu kaynak kitapçıkla ve kanun metniyle
  karşılaştırarak karara bağladı; açıklama o kararla çelişemez.

## Çıktı

`aciklama/paem10-<parti>.json` — dizi, partideki her soru için bir kayıt:

```json
{ "no": 12, "aciklama": "...", "kaynak": "5271 sayılı CMK md 91/3",
  "kaynakUrl": "https://www.mevzuat.gov.tr/..." }
```

`kaynakUrl` zorunlu değil; mevzuat dışı sorularda (tarih, güncel olay,
matematik) boş bırakılabilir. `kaynak` her zaman doldurulur — matematikte
"çözümün kendisi" yazmak yerine dayandığın kuralı yaz ("hız-zaman bağıntısı",
"harmonik ortalama" gibi).

## Açıklama nasıl yazılır

1. **Önce doğru cevabın dayanağı.** Hangi madde/fıkra, ne diyor. Maddeyi
   numarasıyla ver; adayın kanuna gidebilmesi gerekir.
2. **Sonra çeldiriciler.** En az bir yanlış şıkkın neden yanlış olduğunu yaz —
   özellikle adayın takılacağı şıkkı. Beş şıkkı tek tek saymak gerekmez.
3. **2-5 cümle.** Ders kitabı değil, sınav sonrası açıklama. Ölçü: PAEM 9
   açıklamalarının ortalaması ~550 karakter.
4. Matematik/analitik sorularda dayanak **çözümün kendisidir**: adımları
   sırayla yaz, sonucu şıkla eşleştir. 81-90 arası sorular ortak bir öncül
   bloğuna bağlı (`ortakMetin`); açıklama o bloğun hangi öncülünü kullandığını
   söylemeli. 95. soru şekilli — şekli `gorsel` alanındaki yoldan aç.

## Kurallar

- **Kaynak etiketi açıklamaya yazılmaz.** "PAEM 10'da çıkmıştı" gibi bir cümle
  kurma; sınav kimliği zaten sayfanın başlığında.
- **Uydurma madde numarası yasak.** Emin değilsen maddeyi mevzuat.gov.tr'den
  doğrula; doğrulayamıyorsan numara vermeden anlat. Tam metin ucu:
  `https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=1&MevzuatNo=<no>&MevzuatTertip=<tertip>`
  — yanlış `Tertip` sessizce BAŞKA bir kanun döndürür, gelen metnin başlığını
  mutlaka kontrol et. (2559/3201/6136 → 3, 298 → 4, 5271/5237/5395 → 5.)
- **Denetçi uyarısı varsa açıklamada karşıla.** İki şık savunulabilir
  görünüyorsa, hangi ifadenin tercihi belirlediğini yaz — aday aynı yerde
  takılacak.
- **KUSURLU sorularda kusur SAKLANMAZ.** Dört soru (25, 37, 42, 64) hakem
  tarafından kusurlu işaretlendi ve resmî anahtarları korundu. Bu soruların
  açıklaması önce anahtarın gerekçesini kurar, sonra kusuru dürüstçe söyler.
  Aday kitapçığı elinde tutuyor; kusuru görecek. Görmezden gelen bir açıklama
  onu bize değil, forumlardaki tahminlere yönlendirir.
- **Eskime dalı bu sınavda kapalı.** PAEM 10 bir günlük; mevzuat eskimesi yok.
  Aksini düşündüren bir şey bulursan açıklamayı yazma, işaretle ve bildir.
- Bu sınavda **iptal edilmiş soru yok**; iptal kalıbını kullanma.
