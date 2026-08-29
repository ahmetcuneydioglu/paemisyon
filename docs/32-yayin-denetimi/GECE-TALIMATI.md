# Gece Denetim Talimatı — Doc 32 Yayın Külliyatı, Aşama 1

**Bu dosya, 5 dakikada bir tetiklenen otonom denetim turunun tek kaynağıdır.**
Bağlam sıfırlanmış olsa bile buradan devam edilebilir.

Oluşturma: 28 Ağustos 2026 · Kullanıcı onayıyla, Aşama 1 (mevzuat bloğu) için.

---

## 0. MUTLAK KURAL — SALT OKUMA

Bu turlarda **veritabanına tek satır yazılmayacak.** Sorular CANLI: yanlış bir
düzeltme anında kullanıcıya gider ve geri alma penceresi yoktur.

Yasak olanlar:

- Herhangi bir script'in `--yaz` / `--gevsek --yaz` / `APPLY=1` bayrağı
- `prisma.*.update` / `create` / `delete` içeren yeni script yazmak
- Soru arşivlemek, cevap anahtarı değiştirmek, veritabanına açıklama yazmak
  (öneri açıklamayı DEFTERE yazmak serbesttir — §4)
- Admin API'sine yazma isteği göndermek
- `git commit` / `git push`

Serbest olan **tek** yazma: `docs/32-yayin-denetimi/ilerleme.jsonl` dosyasına
karar kaydı eklemek (`>>` ile append) ve bu klasördeki rapor/günlük dosyaları.

Tespit edilen kusurlar **uygulanmaz, kaydedilir.** Sabah kullanıcı tek raporla
onaylayacak.

---

## 1. Kilit — eşzamanlı tur çakışmasını önle

Her tur işe başlamadan:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/docs/32-yayin-denetimi && \
  if [ -f .gece.lock ] && [ $(( $(date +%s) - $(stat -f %m .gece.lock) )) -lt 900 ]; then \
    echo "KILIT VAR - bu tur atlanmali"; else date +%s > .gece.lock; echo "kilit alindi"; fi
```

`KILIT VAR` çıkarsa **hiçbir şey yapmadan turu bitir.**

Eşik 900 sn = 15 dk, tetikleme aralığı 5 dk. Eşik aralıktan UZUN olmalı: aksi
hâlde uzun süren bir tur, kendisi hâlâ çalışırken "bayat kilit" sayılıp ikinci
kez başlatılır. Çöken bir turun kilidi 15 dakikada kurtarılır.

Tur bitince kilidi bırak: `rm -f .gece.lock`

---

## 2. Nerede kalındı?

```bash
cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && \
  DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" npx tsx scripts/yayin-parti.ts --konu PVSK --adet 0
```

Başlıktaki `yayin N - incelenen M - KALAN K` satırı o konudaki durumu verir.

### Kanun sırası (Aşama 1 kapsamı — yalnız mevzuat bloğu)

| # | `--konu` değeri | Yayın sorusu | Resmî metin |
|---|---|---:|---|
| 1 | `PVSK` | 93 | 42 md ✓ |
| 2 | `Kabahatler` | 92 | 52 md ✓ |
| 3 | `Bilgi Edinme` | 86 | 33 md ✓ |
| 4 | `657` | 83 | 337 md ✓ |
| 5 | `4483` | 30 | 25 md ✓ |
| 6 | `İdari Yargılama` | 32 | 82 md ✓ |
| 7 | `İl İdaresi` | 31 | 77 md ✓ |
| 8 | `Adli ve Önleme` | 27 | 36 md ✓ |
| 9 | `6284` · `3628` · `5395` · `3713` · `2918` · `3201` · `7201` · `2911` · `7068` · `Yakalama` · `5302` · `5393` · `6136` · `1774` · `3071` · `2576` · `Emniyet Atama` · `5901` · `5607` · `5682` · `6698` · `5726` · `Adli Kolluk` · `5253` · `1481` · `6222` | ~180 | ✓ |
| 10 | `T.C. Anayasası` | 206 | 210 md ✓ |
| 11 | `Türk Ceza` | 251 | 349 md ✓ |
| 12 | `Ceza Muhakemesi` | 487 | 349 md ✓ |

**Mevzuat DIŞI konulara dokunma** (Genel Kültür, İnkılap, Silah Bilgisi,
İngilizce, Protokol, Türkçe, İnsan Hakları, İdare Hukuku doktrini). Onlar
Aşama 2'de ve yalnız "eskime taraması" olarak ele alınacak.

---

## 3. Bir turda ne yapılır

Sıradaki konudan bir **madde kümesi** al. Küme bölünmez — bir maddenin bütün
soruları birlikte okunur; banka içi tutarlılık ancak böyle görülür.

```bash
cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && \
  DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" \
  npx tsx scripts/yayin-parti.ts --konu Kabahatler --adet 9 --maddeuz 3000
```

`ilerleme.jsonl`'de kaydı olan sorular **otomatik atlanır**. `--adet` aşılsa bile
aynı maddenin soruları birlikte gelir.

Tek bir maddeyi hedeflemek için: `--madde 22`
Bir maddenin tam metni için: `npx tsx scripts/madde-oku.ts --konu Kabahatler --madde 22,25`

**Her tur, işlediği kadarını deftere yazıp biter.** Yarım kalan küme sorun değil.

---

## 4. Denetim ölçütü — pazarlık yok

Her soru için **sırayla**:

1. İşaretli cevap, maddenin **resmî metniyle** doğrulanıyor mu?
2. Diğer şıkların hepsi gerçekten yanlış mı? (**çift doğru cevap** en sık kusur)
3. Açıklama cevabı destekliyor mu, madde numarası doğru mu?
   → Doc 32'de bulunan ilk kusur (`f5d41e6c`) tam olarak buydu: cevap doğru,
   açıklamanın son cümlesi hükümle çelişiyordu.
4. Süre / oran / sayı / merci / ceza miktarı varsa **birebir** karşılaştır.
5. Dipnot oku — değişiklik geçmişi orada.
6. **Aynı maddedeki diğer sorularla çelişiyor mu?** Küme halinde okumanın sebebi bu.

**Kaynak gösterilmeden hiçbir soru doğru kabul edilmez.** Kayıtta madde numarası
ve resmî metinden birebir alıntı bulunmak zorunda.

**Emin olunamıyorsa tahmin yok.** `sinif` alanına `tartismali` veya
`manuel_inceleme` yazılır, gerekçesi açıklanır.

### Açıklaması olmayan sorular

Mevzuat bloğunda **660 sorunun açıklaması yok.** Bu bir kusur değil, eksiklik.

Doğrulama zaten açıklamanın ihtiyacı olan her şeyi üretiyor. O yüzden: açıklaması
olmayan bir soruyu doğruladığında, **önerilen açıklamayı da yaz** ve deftere
`oneri_aciklama` alanına koy. **Veritabanına YAZMA** — §0 geçerli.

Açıklama kuralları:
- **DÜZGÜN TÜRKÇE yazılacak — ç ğ ı ö ş ü â î û eksiksiz.** `bulgu` alanı bir
  denetim notudur ve ASCII olabilir; `oneri_aciklama` ise doğrudan soruya girecek
  KULLANICI metnidir. İlk turda bu karıştırıldı ve 11 açıklama ASCII yazıldı
  ("gonullu", "surucu"); `scripts/oneri-aciklama-duzelt.ts` ile düzeltildi.
- Resmî madde metnine dayanacak, tercihen birebir alıntı içerecek
- Neden doğru cevabın doğru olduğunu VE en güçlü çeldiricinin neden yanlış
  olduğunu söyleyecek
- Uydurma yok: metinde olmayan bir şey yazılmaz (`CLAUDE.md` — AI üretimi yasak)
- 2-4 cümle; mevcut açıklamaların üslubuna uy

---

## 5. Deftere kayıt

`docs/32-yayin-denetimi/ilerleme.jsonl`'e **tek satır JSON** (append, `>>`):

```json
{"id":"0acae66b","sinif":"yayimlanabilir","karar":"yayimlanabilir","konu":"PVSK Ek m.7","dayanak":"PVSK Ek m.7/2","bulgu":"'...Emniyet Genel Mudurunun ... yazili emriyle' — isaretli C dogru.","kaynak":"https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=2559&MevzuatTur=1&MevzuatTertip=5","erisim":"2026-08-28"}
```

`id` = dökümdeki 8 karakterlik `questionVersion.id` ön eki.

Soru açıklamasızsa kayda `oneri_aciklama` alanı eklenir:

```json
{"id":"ddf382e4","sinif":"yayimlanabilir","konu":"PVSK m.8","dayanak":"PVSK m.8/1-D","bulgu":"...","oneri_aciklama":"PVSK m.8/1-D ... otuz gunu gecmemek uzere ...","kaynak":"...","erisim":"2026-08-28"}
```

| sinif | ne zaman |
|---|---|
| `yayimlanabilir` | cevap ve açıklama resmî metinle doğrulandı |
| `duzeltilerek` | kusur var ama düzeltilebilir — **öneriyi `bulgu` içinde somut yaz** |
| `guncelligini_yitirmis` | mülga/değişmiş metne dayanıyor |
| `celiskili` | bankadaki başka bir soruyla çelişiyor — karşı tarafın kimliğini yaz |
| `tartismali` | öğretide ihtilaflı, metinden çözülemiyor |
| `manuel_inceleme` | kesin sonuca ulaşılamadı |

`duzeltilerek` yazarken `bulgu` alanına **uygulanabilir öneri** koy: hangi şık
hangi metinle değişecek, cevap hangi harfe geçecek, açıklamanın hangi cümlesi
yanlış. Sabah bunlar `scripts/yayin-cevap-duzelt.ts` içindeki `D` tablosuna
aktarılacak.

Sayım:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/docs/32-yayin-denetimi && python3 -c "
import json,collections
c=collections.Counter(json.loads(l)['sinif'] for l in open('ilerleme.jsonl') if l.strip())
[print(f'{v:5}  {k}') for k,v in c.most_common()]
print('---', sum(c.values()))"
```

---

## 6. Tur sonu

```bash
rm -f /Users/ahmetcnd/Developer/paemisyon/docs/32-yayin-denetimi/.gece.lock
```

Ardından **`GECE-GUNLUK.md` dosyasının sonuna tek satır** ekle:

```
- 03:22 · Kabahatler m.22 · 9 soru · 8 temiz, 1 duzeltilerek (a1b2c3d4: aciklamada m.25 yerine m.22 yazili)
```

Kullanıcıya uzun özet yazma — uyuyor. Günlük satırı yeterli.

---

## 7. Bittiğinde

Aşama 1 kapsamındaki bütün kanunlar tükendiğinde:

1. `GECE-GUNLUK.md` sonuna `ASAMA 1 BITTI` yaz.
2. Biriken `duzeltilerek` / `guncelligini_yitirmis` / `celiskili` kayıtlarını
   `scripts/yayin-cevap-duzelt.ts` içindeki `D` tablosuna ekle — **ama çalıştırma.**
3. Kuru çalışmayı dosyaya al:
   ```bash
   npx tsx scripts/yayin-cevap-duzelt.ts > ../../docs/32-yayin-denetimi/SABAH-KURU-CALISMA.txt 2>&1
   ```
4. Cron'u sil (`CronList` → `CronDelete`) ve dur.

---

## 8. Bilinen tuzaklar

- **Shell cwd her Bash çağrısında sıfırlanır** — her komutta yeniden `cd` yap.
- **`.env` yolu**: `source .env` yalnız `apps/api` içindeyken çalışır.
- **UUID alanlarında `startsWith` yok** — Prisma `where` içinde kullanma; çek ve
  JS'te filtrele, ya da `$queryRaw` ile `id::text LIKE`.
- **`connection_limit=1` zorunlu** (Supabase pooler 15 bağlantı, prod'la ortak).
- **Script'ler `apps/api/scripts/` altında olmak zorunda.**
- **`QuestionVersion`'da `updatedAt` YOK** — `createdAt` var.
- **Türkçe küçültme**: `'I'.toLocaleLowerCase('tr')` noktasız `ı` verir; `â î û`
  harf sınıfına alınmazsa "hâkim" içindeki H tek harf sanılır.
- **Mevzuat metnindeki dipnotlar madde metnine karışır** — `(...)` ve numaralı
  dipnot satırlarını hükümle karıştırma.
- **Mülga madde uyarısı**: 657 m.107 mülga; hastalık raporu yönetmeliği hükmü
  m.105/6'dadır. Soru bir maddeye bağlıysa o maddenin gerçekten yürürlükte
  olduğunu doğrula.
