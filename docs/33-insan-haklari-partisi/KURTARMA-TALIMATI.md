# Kurtarma Talimatı — Doc 33, bankaya giremeyen sorular

Denetimde kusur bulunan sorulara bakıyorsun. Görevin **kurtarılabilir olanı
kurtarmak**, kurtarılamayanı dürüstçe elemek.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz`/`--apply`/`APPLY=1` yasak.
2. **Uydurma yok.** Önerdiğin her düzeltme resmî metne ya da künyelenebilir bir
   kaynağa dayanmalı. Emin değilsen `E` ya da `F` grubuna koy.
3. **Soruyu kolaylaştırma.** Amaç kusuru gidermek; çeldiriciyi zayıflatıp
   soruyu bariz hale getirmek kurtarma değil, bozmadır.
4. **Kitaptan söz etme** — bu sorular özgün olarak yayımlanıyor.

## 1. Girdin

`kurtarma/parca-N.json`. Her kayıtta: soru, şıklar, kitabın anahtarı, denetim
kararı, varsa hakem kararı ve alıntısı, iki denetçinin uyarı/dayanak/gerekçesi,
kitabın bilgi notu ve hangi resmî metne bakılacağı (`dayanakKaynagi`).

Resmî metinler `mevzuat/` altında (anayasa.md · 6216-aym-kanunu.md · aihs.md ·
6701-tihek.md · 6328-kdk.md · 3686-ihik.md). `grep -n "^## Madde 21" aihs.md`
ile bul, `sed -n` ile oku. **Veritabanına bağlanma.**

## 2. Grup ata

| Grup | Anlamı | Ne yapılır |
|---|---|---|
| **A** | Kusur yok — uyarı yalnız kitabın bölümlemesiyle ilgili | Olduğu gibi alınır |
| **B** | Anahtar yanlış, soru sağlam | Anahtar düzeltilir |
| **C** | Mekanik metin hatası (yazım, parantez, mükerrer şık, noktalama) | Metin düzeltilir |
| **D** | Bilgi eskimiş | Kök/şık güncellenir |
| **E** | Şık kümesi ya da kök yeniden kurulmalı — editoryal karar | **Öneri yaz, karar insana** |
| **F** | Kurtarılamaz; sıfırdan yazmak daha kolay | Elenir |

Bir soru birden çok kusur taşıyorsa **en ağır** gruba girer (F > E > D > C > B > A).

## 3. Çıktı

`kurtarma/parca-N-oneri.json`:

```json
[{"id":"b17-2","grup":"C",
  "gerekce":"neden bu grup, tek cümle",
  "duzeltme":{
    "kok":"değişmiyorsa null",
    "siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
    "dogru":"D",
    "aciklama":"kural + künye + tuzak, 2-4 cümle",
    "dayanak":"AİHS md 21/2"
  },
  "degisenler":["E şıkkı: 'Bürüksel' → 'Brüksel'"]}]
```

Kurallar:
- `duzeltme` **yalnız A/B/C/D** için doldurulur. E ve F'de `duzeltme: null`
  olur, `gerekce` alanına ne yapılması gerektiğini yaz.
- `siklar` her zaman **beş şıkkın tamamını** içerir (değişmeyenler aynen).
- `degisenler` insan için: neyi neye çevirdiğini tek tek yaz. Değişiklik yoksa
  boş dizi.
- A grubunda `duzeltme` doldurulur ama `degisenler` boş kalır.
- `aciklama`: bankaya girecek metin — kuralı söyle, künyeyi cümle içinde ver,
  varsa tuzağı belirt. Şık harfiyle konuşma ("Doğru cevap D'dir" YAZMA).

## 4. Son cevabın

SADECE: dosya yolu · grup dağılımı (A/B/C/D/E/F kaçar tane). Soruları ve
düzeltmeleri cevabında tekrarlama.
