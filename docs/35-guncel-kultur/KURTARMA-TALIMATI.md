# Kurtarma Talimatı — Doc 35, güncel bilgiler

Denetimde kusur bulunan sorulara bakıyorsun. Görevin **kurtarılabilir olanı
kurtarmak**, kurtarılamayanı dürüstçe elemek.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz`/`--apply`/`APPLY=1` yasak.
   Madde metni `mevzuat/` dosyalarından okunur (`00-INDEKS.md` listeyi verir).
2. **Uydurma yok.** Önerdiğin düzeltme resmî metne ya da künyelenebilir bir
   kaynağa dayanmalı. Emin değilsen `E` ya da `F` grubuna koy.
3. **Soruyu kolaylaştırma.** Amaç kusuru gidermek; çeldiriciyi zayıflatıp
   cevabı bariz hâle getirmek kurtarma değil, bozmadır.
4. **Kitaptan/denemeden söz etme** — bu sorular özgün olarak yayımlanıyor.

## 1. Bu partinin özel durumu

Sorular **resmî kaynaklardan derlendi** ve iki kör denetçi olguları bağımsız
olarak yeniden doğruladı — hepsinde cevap tuttu. Uyarıların çoğu bu yüzden
olgu hatası değil, **çeldirici notu** (bir şıkkın kendi başına doğru bir bilgi
olması gibi). Bunlar çoğunlukla **A grubudur**.

Gerçek kusur arıyorsan şunlara bak:
- **Zaman kipi:** bugün 5 Eylül 2026. Ekim-Aralık 2026 olayı şimdiki zamanla
  anlatılmışsa kök düzeltilmeli (C grubu).
- **Kaynak çelişkisi:** iki resmî kaynak farklı şey söylüyorsa soru güvenilir
  değil (F grubu) — denetçi notunda bunu arıyorsun.
- **İkinci savunulabilir şık:** denetçi "sorun yok" diye bitirmişse kusur yoktur.

Girdide `dogruCevap`, `aciklama` ve `kaynak` alanları VAR — bu tur kör değil.
Şık harflerine güvenme; bankaya yazmadan önce şıklar dengelenecek.

## 2. Grup ata

| Grup | Anlamı | Ne yapılır |
|---|---|---|
| **A** | Kusur yok — uyarı yersiz ya da kapsam notu | Olduğu gibi alınır |
| **B** | Anahtar yanlış, soru sağlam | Anahtar düzeltilir |
| **C** | Mekanik metin hatası (dizgi, yazım, mükerrer şık, noktalama) | Metin düzeltilir |
| **D** | Mevzuat değişmiş | Kök/şık/anahtar güncellenir |
| **E** | Şık kümesi ya da kök yeniden kurulmalı — editoryal karar | Öneri yaz, karar insana |
| **F** | Kurtarılamaz | Elenir |

Birden çok kusur varsa **en ağır** grup geçerlidir (F > E > D > C > B > A).

## 3. Çıktı

`kurtarma/parca-N-oneri.json`:

```json
[{"id":"s15","grup":"C","gerekce":"neden bu grup, tek cümle",
  "duzeltme":{"kok":"değişmiyorsa null",
    "siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
    "dogru":"A","aciklama":"kural + künye + tuzak, 2-4 cümle","dayanak":"İYUK md 2/1-a"},
  "degisenler":["B şıkkı: 'Faith du princ' → 'Fait du prince'"]}]
```

- `duzeltme` yalnız **A/B/C/D** için doldurulur; E ve F'de `null` olur ve
  `gerekce`ye ne yapılması gerektiği yazılır.
- `siklar` her zaman **beş şıkkın tamamını** içerir.
- `aciklama` bankaya girecek metindir: kuralı içerikle söyle, künyeyi cümle
  içinde ver, varsa tuzağı belirt. Şık harfiyle konuşma.

## 4. Son cevabın

SADECE: dosya yolu · grup dağılımı (A/B/C/D/E/F kaçar tane).
