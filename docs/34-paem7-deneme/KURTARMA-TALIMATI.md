# Kurtarma Talimatı — Doc 34, bankaya giremeyen sorular

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

Sorular **taranmış bir PDF'ten OCR ile** çıkarıldı ve iki onarım turunda sayfa
görüntüsüne bakılarak düzeltildi. Elindeki metin artık sayfadaki hâlidir.

Bu yüzden uyarılarda iki tür kusur karışık duruyor:

- **Kitabın kendi dizgi hatası** ("Faith du princ" → doğrusu *fait du prince*,
  "Ceza Mahkemesi Kanunu" → *Ceza Muhakemesi Kanunu*, "asil kaynakları" →
  *asli kaynakları*). Bunlar **C grubu**: düzeltilir, soru kurtulur.
- **Gerçek soru kusuru** (ikinci savunulabilir şık, kök yanıltıcı, hiçbir şık
  doğru değil). Bunlar **E** ya da **F**.

Sorular 2022'den, sen 2026 metnine bakıyorsun. Cevap mevzuat değişikliği
yüzünden değiştiyse **D grubu**dur ve güncellenir.

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
