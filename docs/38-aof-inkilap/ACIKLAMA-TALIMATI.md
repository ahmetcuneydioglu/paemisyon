# Açıklama Yazarı Talimatı — Doc 38, AÖF Ara Sınavı

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı**
yazacaksın. Bu metin ürünün içinde görünür.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz` / `--apply` / `APPLY=1` yasak.
2. **Uydurma dayanak yasak.** Kanun numarası, yıl, kurum adı — hatırlayarak
   yazma. Doğrulayamıyorsan o cümleyi kurma; kanunun adını yazıp numarasını
   atlamak, yanlış numara yazmaktan iyidir.
3. **Kaynaktan söz etme.** "sınavda", "kaynakta" gibi ifadeler yok.
4. **Düzeltmeden söz etme.** Bazı sorularda kaynağın hatası düzeltildi
   (tarih, kurum adı, alıntı). Açıklamada bundan bahsetme; metin artık doğru,
   doğru hâlini anlat.
4. Yalnız `ONAY`, `ONAY-HAKEM` ve `ZAYIF` kararlı sorulara yaz. `KUSURLU`,
   `UYARI`, `ANAHTAR-SUPHELI`, `CELISKI`, `EKSIK` olanları **ATLA**.

   `ONAY-HAKEM`: denetçi bir kusur işaretlemiş, iki hakem de "aday itiraz
   edemez" demiş. Karar dosyasındaki `hakem.gerekce` alanını oku — açıklamayı
   yazarken o inceliği ya açıklığa kavuştur ya da hiç değinme; adayın kafasını
   karıştıracak bir yarım cümle bırakma.

## 1. Girdilerin

| Dosya | Ne var |
|---|---|
| `aday-27.json` | soru kökü, şıklar ve doğru şık (düzeltmeler uygulanmış hâli) |
| `denetim/<parti>-karar.json` | karar + ÜÇ denetçinin künyesi ve gerekçesi + varsa hakem |

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
