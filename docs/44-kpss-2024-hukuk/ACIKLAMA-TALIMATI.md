# Açıklama Yazarı Talimatı — Doc 44, KPSS 2024 Hukuk

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı**
yazacaksın. Bu metin ürünün içinde görünür.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz` / `--apply` / `APPLY=1` yasak.
2. **Uydurma dayanak yasak.** Kanun numarası, yıl, kurum adı — hatırlayarak
   yazma. Doğrulayamıyorsan o cümleyi kurma; kanunun adını yazıp numarasını
   atlamak, yanlış numara yazmaktan iyidir.
3. **Kaynaktan söz etme.** "sınavda", "ÖSYM", "KPSS", "kaynakta" gibi
   ifadeler yok.
4. **Düzeltmeden söz etme.** Bazı sorularda kaynağın eskimiş künyesi
   düzeltilmiş olabilir. Açıklamada bundan bahsetme; metin artık doğru.
5. Yalnız `ONAY`, `ONAY-HAKEM` ve `ZAYIF` kararlı sorulara yaz. `KUSURLU`,
   `UYARI`, `ESKIMIS`, `ANAHTAR-SUPHELI`, `CELISKI`, `EKSIK` olanları **ATLA**.

   `ONAY-HAKEM`: denetçi bir kusur işaretlemiş, iki hakem de "aday itiraz
   edemez" demiş. Karar dosyasındaki hakem gerekçesini oku — açıklamayı
   yazarken o inceliği ya açıklığa kavuştur ya da hiç değinme; adayın kafasını
   karıştıracak bir yarım cümle bırakma.

## BU PARTİNİN ASIL KURALI: 2026 hukukunu anlat

Sorular 2024'te sorulmuş, aday 2026'da okuyacak. Açıklama **bugünkü
yürürlükteki metne** göre yazılır.

- Madde künyesini **mevzuat.gov.tr'nin güncel konsolide metninden** doğrula.
  İkincil kaynak (blog, soru sitesi, ders notu) yeterli değil.
- Denetçiler `eskime` / `guncellenecek` notu düşmüşse dikkate al: o soruda
  mevzuat değişmiş demektir, açıklamayı bugünkü hâle göre kur.
- Sayıya/süreye/kuruma bağlı bilgide **değişiklik künyesini ver** ki metin
  ileride eskidiğinde fark edilebilsin.
- **CMK ve İYUK'taki süreler** bu partinin en kırılgan yeri: her süreyi
  bugünkü madde metninden doğrula ve değişiklik künyesini ver.

## 1. Girdilerin

| Dosya | Ne var |
|---|---|
| `aday.json` | soru kökü, şıklar, ders, konu, doğru şık |
| `denetim/<parti>-karar.json` | karar + iki denetçinin künyesi, gerekçesi, eskime notları + varsa hakem |

## 2. Açıklamanın biçimi

**2-4 cümle.** Sırayla: (1) kuralı/olayı içerikle söyle — şık harfiyle değil,
(2) dayanağı cümle içinde künyele, (3) varsa tuzağı bir cümleyle belirt.

Yanlış: "Doğru cevap D şıkkıdır."
Doğru: "Bir siyasi partinin TBMM'de grup kurabilmesi için en az yirmi
milletvekiline sahip olması gerekir (2820 sayılı Siyasi Partiler Kanunu
md. 27). Sayı, grup kurma yeter sayısı olup partinin Meclise girmesi için
gereken sayıdan bağımsızdır."

Hukuk sorularında tuzak çoğu zaman **yakın duran ikinci bir kurum ya da
süredir**; adayın neden onu değil bunu seçeceğini bir cümleyle söyle.

## 3. Dil

Sade Türkçe, nesnel anlatım. Kısaltmayı ilk geçtiği yerde aç. Emin olmadığın
hiçbir sayı/tarih/isim yazma.

## 4. Çıktı

`aciklama/<parti>.json`:

```json
[{"id":"q9","aciklama":"…","dayanak":"2820 sayılı Siyasi Partiler Kanunu md. 27"}]
```

`dayanak` — soruya kaynaklık eden birincil belge/kanun künyesi; yoksa `null`.

## 5. Son cevabın

SADECE: dosya yolu · yazılan açıklama sayısı · atlanan soru sayısı ve sebebi.
Açıklama metinlerini TEKRARLAMA.
