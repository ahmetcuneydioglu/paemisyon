# Açıklama Yazarı Talimatı — Doc 40, Kaymakamlık 2022

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı**
yazacaksın. Bu metin ürünün içinde görünür.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz` / `--apply` / `APPLY=1` yasak.
2. **Uydurma dayanak yasak.** Kanun numarası, yıl, kurum adı — hatırlayarak
   yazma. Doğrulayamıyorsan o cümleyi kurma; kanunun adını yazıp numarasını
   atlamak, yanlış numara yazmaktan iyidir.
3. **Kaynaktan söz etme.** "sınavda", "kaynakta" gibi ifadeler yok.
4. **Düzeltmeden söz etme.** Bazı sorularda kaynağın hatası ya da eskimiş
   künyesi düzeltildi. Açıklamada bundan bahsetme; metin artık doğru.

## BU PARTİNİN ASIL KURALI: 2026 hukukunu anlat

Sorular 2022 Kaymakamlık sınavından geliyor, aday 2026'da okuyacak. Açıklama
**bugünkü yürürlükteki metne** göre yazılır, 2022'ye göre değil.

- Madde künyesini **mevzuat.gov.tr'nin güncel konsolide metninden** doğrula.
  İkincil kaynak (blog, soru sitesi, ders notu) yeterli değil.
- Denetçiler `eskime` notu düşmüşse onu dikkate al: o soruda mevzuat değişmiş
  demektir, açıklamayı bugünkü hâle göre kur.
- Sayıya/süreye/kuruma bağlı bilgide **değişiklik künyesini ver** ki metin
  ileride eskidiğinde fark edilebilsin: "…153 s. CBK ile (2023) değişik
  hâliyle…" gibi.
- Bir kurum ya da kararname adı 2022'den bu yana değiştiyse açıklamada
  BUGÜNKÜ adı kullan.
4. Yalnız `ONAY`, `ONAY-HAKEM` ve `ZAYIF` kararlı sorulara yaz. `KUSURLU`,
   `UYARI`, `ANAHTAR-SUPHELI`, `CELISKI`, `EKSIK` olanları **ATLA**.

   `ONAY-HAKEM`: denetçi bir kusur işaretlemiş, iki hakem de "aday itiraz
   edemez" demiş. Karar dosyasındaki `hakem.gerekce` alanını oku — açıklamayı
   yazarken o inceliği ya açıklığa kavuştur ya da hiç değinme; adayın kafasını
   karıştıracak bir yarım cümle bırakma.

## 1. Girdilerin

| Dosya | Ne var |
|---|---|
| `kanonik-62.json` | soru kökü, şıklar, ders (düzeltmeler uygulanmış hâli) |
| `anahtar-62.json` | doğru şık |
| `denetim/<parti>-karar.json` | karar + ÜÇ denetçinin künyesi, gerekçesi, `eskimeler` + varsa hakem |

Bir soruda `gorselDosya` alanı varsa (kök bir tabloya/şekle atıf yapıyor ve o
tablo resim olarak basılmış) açıklamayı yazmadan önce o PNG'yi AÇ.

## 2. Açıklamanın biçimi

**2-4 cümle.** Sırayla: (1) kuralı/olayı içerikle söyle — şık harfiyle değil,
(2) dayanağı cümle içinde künyele, (3) varsa tuzağı bir cümleyle belirt.

Yanlış: "Doğru cevap D şıkkıdır."
Doğru: "Kapitülasyonlar Lozan Antlaşması'yla (1923) kaldırılmış, böylece
Misak-ı Millî'nin ekonomik bağımsızlık şartından ödün verilmemiştir. Diğer
şıklardaki toprak düzenlemeleri ise Misak-ı Millî sınırlarından geri adımdır."

İnkılap Tarihi'nde tuzak çoğu zaman **yakın duran ikinci bir ilke ya da
inkılaptır**; adayın neden onu değil bunu seçeceğini bir cümleyle söyle.

## 3. Dil

Sade Türkçe, nesnel anlatım. Kısaltmayı ilk geçtiği yerde aç. Emin olmadığın
hiçbir sayı/tarih/isim yazma.

## 4. Çıktı

`aciklama/<parti>.json`:

```json
[{"id":"s1","aciklama":"…","dayanak":"Lozan Antlaşması, 1923"}]
```

`dayanak` — soruya kaynaklık eden birincil belge/kanun künyesi; yoksa `null`.

## 5. Son cevabın

SADECE: dosya yolu · yazılan açıklama sayısı · atlanan soru sayısı ve sebebi.
Açıklama metinlerini TEKRARLAMA.
