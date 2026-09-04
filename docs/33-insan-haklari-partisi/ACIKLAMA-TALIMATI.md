# Açıklama Yazarı Talimatı — Doc 33 İnsan Hakları Partisi

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı** sen
yazacaksın. Bu metin ürünün içinde görünür; soru bankasının güven vaadi budur.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz`/`--apply`/`APPLY=1` yasak.
2. **Uydurma dayanak yasak.** Madde numarası, yıl, kurum adı — hiçbirini
   hatırlayarak yazma. Elindeki üç kaynaktan biri desteklemiyorsa o cümleyi
   kurma.
3. **Kitaptan söz etme.** Bu sorular özgün olarak yayımlanacak; "kitapta",
   "kaynakta", "yazara göre" gibi ifadeler kullanma.
4. Yalnız `ONAY` ve `ZAYIF-ONAY` kararlı sorulara açıklama yaz. `UYARI`,
   `ÇELİŞKİ`, `ANAHTAR-HATALI`, `KUSURLU` olanları **ATLA** — onlar insana gidiyor.

## 1. Girdilerin

| Dosya | Ne var |
|---|---|
| `parti/bNN-kor.json` | soru kökü ve şıklar |
| `parti/bNN-anahtar.json` | doğru şık (denetim bitti, artık görebilirsin) |
| `denetim/bNN-karar.json` | her sorunun kararı — hangilerine yazacağını buradan seç |
| `denetim/bNN-d1.json`, `-d2.json` | iki denetçinin madde künyesi (`dayanak`) ve gerekçesi |
| `kitap-notlari.json` | bazı sorulara ait ek bilgi notu (id ile eşleşir) |
| `mevzuat/*.md` | resmî madde metinleri — alıntı buradan yapılır |

Madde metnini `grep -n "^## Madde 22" mevzuat/6216-aym-kanunu.md` ile bulup
`sed -n` ile oku. Denetçilerin `dayanak` alanı sana hangi maddeye bakacağını
zaten söylüyor; sıfırdan arama.

## 2. Açıklamanın biçimi

**2-4 cümle.** Sırayla:

1. **Kural.** Doğru cevabın dayandığı kuralı söyle — şık harfiyle değil, içerikle.
   Yanlış: "Doğru cevap D şıkkıdır." Doğru: "Anayasa Mahkemesi bölümleri, bir
   başkanvekilinin başkanlığında altı üyeden oluşur."
2. **Dayanak.** Kuralı veren kaynağı cümlenin içinde ver: "6216 sayılı Kanun
   md 2/1-ç'ye göre…", "AİHS md 34 uyarınca…". Mevzuat dışı konularda birincil
   belgeyi künyele: "BM Şartı md 7", "Karel Vasak'ın 1977 tarihli kuşak tasnifi".
3. **Tuzak (varsa).** Sorunun ayırt edici noktasını bir cümleyle söyle:
   "Sıkça karıştırılan nokta, toplantı yeter sayısının (dört üye) bölümün üye
   sayısıyla (altı) aynı olmamasıdır."

Uzun tutma. Madde metnini olduğu gibi kopyalama — gerekiyorsa **tek** kısa
alıntı, tırnak içinde.

## 3. Dil

Sade Türkçe, aday sen diye muhatap alınmaz — nesnel anlatım. Kısaltmayı ilk
geçtiği yerde aç ("Türkiye İnsan Hakları ve Eşitlik Kurumu (TİHEK)"). Emin
olmadığın hiçbir sayı/tarih/isim yazma.

## 4. Çıktı

`aciklama/bNN.json` (dizin yoksa oluştur):

```json
[{"id":"b8-1","aciklama":"…","dayanak":"6216 md 2/1-ç"}]
```

`dayanak` alanı açıklamada attığın künyenin kısa hâli; denetçilerin verdiğiyle
tutarlı olmalı.

## 5. Son cevabın

SADECE: dosya yolu · açıklama yazılan soru sayısı · atlanan soru sayısı.
Açıklama metinlerini cevabında tekrarlama.
