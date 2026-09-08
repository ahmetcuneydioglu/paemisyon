# Açıklama Yazarı Talimatı — Doc 37, OGM Materyal İnkılap Tarihi

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı**
yazacaksın. Bu metin ürünün içinde görünür.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz` / `--apply` / `APPLY=1` yasak.
2. **Uydurma dayanak yasak.** Kanun numarası, yıl, kurum adı — hatırlayarak
   yazma. Doğrulayamıyorsan o cümleyi kurma; kanunun adını yazıp numarasını
   atlamak, yanlış numara yazmaktan iyidir.
3. **Kaynaktan söz etme.** "MEB'in sorusunda", "kaynakta" gibi ifadeler yok.
4. Yalnız `ONAY` ve `ZAYIF` kararlı sorulara yaz. `UYARI`, `ANAHTAR-SUPHELI`,
   `CELISKI`, `EKSIK` olanları **ATLA** — onlar insana gidiyor.

## 1. Girdilerin

| Dosya | Ne var |
|---|---|
| `parti/ogm-1-kor.json` | soru kökü ve şıklar |
| `anahtar-10.json` | doğru şık (denetim bitti, artık görebilirsin) |
| `denetim/ogm-1-karar.json` | karar + iki denetçinin künyesi ve gerekçesi |

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

`aciklama/ogm-1.json`:

```json
[{"id":"s1","aciklama":"…","dayanak":"Lozan Antlaşması, 1923"}]
```

`dayanak` — soruya kaynaklık eden birincil belge/kanun künyesi; yoksa `null`.

## 5. Son cevabın

SADECE: dosya yolu · yazılan açıklama sayısı · atlanan soru sayısı ve sebebi.
Açıklama metinlerini TEKRARLAMA.
