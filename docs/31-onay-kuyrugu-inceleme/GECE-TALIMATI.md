# Gece İnceleme Talimatı — Doc 31 Onay Kuyruğu

**Bu dosya, 15 dakikada bir tetiklenen otonom inceleme turunun tek kaynağıdır.**
Bağlam sıfırlanmış olsa bile buradan devam edilebilir.

Oluşturma: 28 Ağustos 2026 · Kullanıcı uyurken çalışmak üzere, açık onayla kuruldu.

---

## 0. MUTLAK KURAL — SALT OKUMA

Bu gece **veritabanına tek satır yazılmayacak.** Kullanıcı bunu açıkça seçti.

Yasak olanlar:

- `duzeltme-uygula.ts --yaz` veya herhangi bir script'in `--yaz` / `APPLY=1` bayrağı
- `prisma.*.update` / `create` / `delete` içeren yeni script yazmak
- Soru onaylamak, reddetmek, yayımlamak, arşivlemek
- Admin API'sine yazma isteği göndermek
- `git commit` / `git push`

Serbest olan **tek** yazma: `docs/31-onay-kuyrugu-inceleme/ilerleme.jsonl` dosyasına
karar kaydı eklemek (`>>` ile append) ve bu klasördeki rapor dosyaları.

Tespit edilen kusurlar **uygulanmaz, kaydedilir.** Sabah kullanıcı tek kuru
çalışma çıktısına bakıp onaylayacak.

---

## 1. Kilit — eşzamanlı tur çakışmasını önle

Her tur işe başlamadan:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/docs/31-onay-kuyrugu-inceleme && \
  if [ -f .gece.lock ] && [ $(( $(date +%s) - $(stat -f %m .gece.lock) )) -lt 780 ]; then \
    echo "KILIT VAR - bu tur atlanmali"; else date +%s > .gece.lock; echo "kilit alindi"; fi
```

`KILIT VAR` çıkarsa **hiçbir şey yapmadan turu bitir** (önceki tur hâlâ çalışıyor). Eşik 780 sn = 13 dk: çöken bir turun kilidi, 15 dakikalık bir sonraki tetiklemeden önce mutlaka bayat sayılır..
Tur bitince kilidi bırak: `rm -f .gece.lock`

---

## 2. Nerede kalındı?

```bash
cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && \
  DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" npx tsx scripts/kalan-ozet.ts
```

Konu bazında kalan sayıları verir. **Sıra (kullanıcının seçtiği kapsam — 219 soru):**

| # | Konu (`--konu` değeri) | Kalan | Resmî metin |
|---|---|---:|---|
| 1 | `Türk Ceza` | 88 | 349 madde ✓ |
| 2 | `Ceza Muhakemesi` | 24 | 349 madde ✓ |
| 3 | `İdari Yargılama` | 18 | 82 madde ✓ |
| 4 | `657` | 16 | 337 madde ✓ |
| 5 | `Belediye` | 13 | 101 madde ✓ |
| 6 | `İl Özel` | 5 | 78 madde ✓ |
| 7 | `Bilgi Edinme` | 2 | 33 madde ✓ |
| 8 | `İl İdaresi` | 1 | 77 madde ✓ |
| 9 | `İdare Hukuku` | 52 | **YOK** — doktrin soruları, en sona |

---

## 3. Bir turda ne yapılır

Kalanı en çok olan sıradaki konudan **6-8 soruluk** bir parti al:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && \
  DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" \
  npx tsx scripts/konu-parti.ts --konu "Türk Ceza" --adet 7 --maddeuz 2200
```

Script, `ilerleme.jsonl`'de kaydı olan soruları **otomatik atlar** — `--atla` gerekmez.
Soruları madde sırasına göre gruplar ve her maddenin resmî metnini bir kez basar.

Bir maddenin tam metni gerekirse:

```bash
npx tsx scripts/mevzuat-madde.ts --kanun 5237 --madde 43,82,120 --uz 2500
npx tsx scripts/icz-ara.ts --kanun 5237 --re 'aranan ifade'   # metin içi arama
```

**Her tur, işlediği kadarını deftere yazıp biter.** Yarım kalan parti sorun değil;
bir sonraki tur kaldığı yerden alır.

---

## 4. Denetim ölçütü — pazarlık yok

Her soru için **sırayla**:

1. İşaretli cevap, maddenin **resmî metniyle** doğrulanıyor mu?
2. Diğer şıkların hepsi gerçekten yanlış mı? (**çift doğru cevap** en sık yakalanan kusur)
3. Açıklama cevabı destekliyor mu, madde numarası doğru mu?
4. Süre / oran / sayı / merci / ceza miktarı varsa **birebir** karşılaştır.
5. Metinde dipnot varsa oku — değişiklik geçmişi orada (`9e9890b9` böyle yakalandı:
   "altmışıncı" → "doksanıncı", 4778/16 md.).

**Kaynak gösterilmeden hiçbir soru doğru kabul edilmez.** Kayıtta madde numarası ve
resmî metinden alıntı bulunmak zorunda.

**Emin olunamıyorsa tahmin yok.** `sinif` alanına `manuel_hukuk_incelemesi` veya
`tartismali` yazılır, gerekçesi açıklanır. Öğretide görüş ayrılığı olan ve mevzuat
metninden çözülemeyen sorular bu sınıfa girer — cevabı "muhtemelen doğrudur" diye
geçirmek yasak.

---

## 5. Deftere kayıt

Her soru için `ilerleme.jsonl`'e **tek satır JSON** (append, `>>`):

```json
{"id_onek":"96266976","sinif":"yayimlanabilir","karar":"yayimlanabilir","konu":"TCK m.167","dayanak":"TCK m.167/1, m.167/2","bulgu":"m.167/1 sahsi cezasizligi ... E dogru isaretlenmis.","kaynak":"https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5237&MevzuatTur=1&MevzuatTertip=5","erisim":"2026-08-28"}
```

`id_onek` = dökümdeki 8 karakterlik `questionVersion.id` ön eki.

`sinif` **yalnız** şu değerlerden biri olabilir:

| sinif | ne zaman |
|---|---|
| `yayimlanabilir` | cevap ve açıklama resmî metinle doğrulandı |
| `duzeltilerek` | kusur var ama düzeltilebilir — **öneriyi `bulgu` içinde somut yaz** |
| `guncelligini_yitirmis` | mülga/değişmiş metne dayanıyor |
| `alan_disi` | müfredat dışı |
| `tartismali` | öğretide ihtilaflı, metinden çözülemiyor |
| `mukerrer` | aynı soru |
| `reddedilmeli` | yapısal olarak bozuk |
| `manuel_hukuk_incelemesi` | kesin sonuca ulaşılamadı |

`duzeltilerek` yazarken `bulgu` alanına **uygulanabilir öneri** koy: hangi şık
hangi metinle değişecek, cevap hangi harfe geçecek. Sabah bunlar
`scripts/duzeltme-uygula.ts` içindeki `D` tablosuna aktarılacak.

Kayıttan sonra sayım:

```bash
cd /Users/ahmetcnd/Developer/paemisyon/docs/31-onay-kuyrugu-inceleme && \
python3 -c "
import json,collections
c=collections.Counter(json.loads(l)['sinif'] for l in open('ilerleme.jsonl') if l.strip())
[print(f'{v:5}  {k}') for k,v in c.most_common()]
print('---', sum(c.values()))"
```

---

## 6. Tur sonu

```bash
rm -f /Users/ahmetcnd/Developer/paemisyon/docs/31-onay-kuyrugu-inceleme/.gece.lock
```

Ardından **`GECE-GUNLUK.md` dosyasının sonuna tek satır** ekle:

```
- 03:22 · TCK m.174-191 · 7 soru · 6 temiz, 1 duzeltilerek (a1b2c3d4: m.188/3 orani yanlis)
```

Kullanıcıya uzun özet yazma — uyuyor. Günlük satırı yeterli.

---

## 7. Bittiğinde

Sıradaki bütün konular tükendiğinde:

1. `GECE-GUNLUK.md` sonuna `TUM KAPSAM BITTI` yaz.
2. Bu turda biriken `duzeltilerek` / `guncelligini_yitirmis` kayıtlarını
   `scripts/duzeltme-uygula.ts` içindeki `D` tablosuna ekle — **ama çalıştırma.**
3. Kuru çalışmayı dosyaya al (yazma yok):
   ```bash
   npx tsx scripts/duzeltme-uygula.ts > ../../docs/31-onay-kuyrugu-inceleme/SABAH-KURU-CALISMA.txt 2>&1
   ```
4. Cron'u sil (`CronList` → `CronDelete`) ve dur.

---

## 8. Bilinen tuzaklar

- **Shell cwd her Bash çağrısında sıfırlanır** — her komutta yeniden `cd` yap.
- **`.env` yolu**: `source .env` yalnız `apps/api` içindeyken çalışır.
- **UUID alanlarında `startsWith` yok** — Prisma `where` içinde kullanma; çek ve JS'te filtrele.
- **`connection_limit=1` zorunlu** (Supabase pooler 15 bağlantı, prod'la ortak).
- **Script'ler `apps/api/scripts/` altında olmak zorunda** — başka yerden `@prisma/client` bulunamaz.
- **Blok karakterleri (█) Bash heredoc'unda reddediliyor** — script yazarken ASCII ayraç kullan.
- **Mevzuat metnindeki dipnotlar madde metnine karışır** — `(...)` ve numaralı dipnot
  satırlarını hükümle karıştırma.
