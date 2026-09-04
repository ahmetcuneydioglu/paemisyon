# Açıklama Yazarı Talimatı — Doc 34, PAEM 7 Deneme (2022)

Denetimden geçen sorulara, adayın sınav sonrası okuyacağı **açıklamayı**
yazacaksın. Bu metin ürünün içinde görünür.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma; `--yaz`/`--apply`/`APPLY=1` yasak.
   Madde metni `mevzuat/` altındaki dosyalardan okunur, Prisma'dan değil.
2. **Uydurma dayanak yasak.** Madde numarası, yıl, kurum adı — hiçbirini
   hatırlayarak yazma. Elindeki kaynak desteklemiyorsa o cümleyi kurma.
3. **Kitaptan/denemeden söz etme.** Bu sorular özgün olarak yayımlanıyor;
   "2022 denemesinde", "kaynakta" gibi ifadeler kullanma.
4. Yalnız `ONAY` ve `ZAYIF` kararlı sorulara açıklama yaz. `UYARI`,
   `CELISKI`, `ANAHTAR-HATALI`, `KUSURLU`, `ESKIMIS` olanları **ATLA**.

## 1. Bu turun iki özel kuralı

### a) Güncel metne göre yaz, 2022'ye göre değil

Sorular 2022'de hazırlandı; açıklama **bugünkü yürürlükteki metne** göre
yazılır. Denetçi `eskime` alanına bir not düşmüşse onu dikkate al.

### b) Tarih damgası gerektiren bilgide tarihi yaz

Sayıya/kuruma bağlı bilgilerde ("… kaç üyeden oluşur", "… kaç gün içinde")
açıklamada dayanağın **tarihini ya da değişiklik künyesini** ver ki metin
eskidiğinde fark edilebilsin: "…7331 sayılı Kanunla (2021) değişik hâliyle…".

## 2. Girdilerin

| Dosya | Ne var |
|---|---|
| `parti/<parti>-kor.json` | soru kökü ve şıklar |
| `parti/<parti>-anahtar.json` | doğru şık (denetim bitti, görebilirsin) |
| `denetim/<parti>-karar.json` | karar — hangilerine yazacağını buradan seç |
| `denetim/<parti>-d1.json`, `-d2.json` | iki denetçinin künyesi ve gerekçesi |
| `mevzuat/` | resmî madde metinleri (`00-INDEKS.md` listeyi verir) |

## 3. Açıklamanın biçimi

**2-4 cümle.** Sırayla: (1) kuralı içerikle söyle — şık harfiyle değil,
(2) dayanağı cümle içinde künyele ("CMK md 91/1'e göre…"), (3) varsa tuzağı
bir cümleyle belirt.

Yanlış: "Doğru cevap C şıkkıdır."
Doğru: "Gözaltı süresi, yakalama yerine en yakın hâkim veya mahkemeye
gönderilmesi için zorunlu süre hariç, yakalama anından itibaren yirmi dört
saati geçemez (CMK md 91/1)."

Madde metnini olduğu gibi kopyalama; gerekiyorsa **tek** kısa alıntı.

## 4. Dil

Sade Türkçe, nesnel anlatım. Kısaltmayı ilk geçtiği yerde aç. Emin olmadığın
hiçbir sayı/tarih/isim yazma.

## 5. Çıktı

`aciklama/<parti>.json`:

```json
[{"id":"s21","aciklama":"…","dayanak":"CMK md 149/1"}]
```

## 6. Son cevabın

SADECE: dosya yolu · yazılan · atlanan. Açıklama metinlerini tekrarlama.
