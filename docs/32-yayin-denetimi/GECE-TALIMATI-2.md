# Doc 32 — Gece Turu Talimatı (Anayasa / TCK / CMK)

Kullanıcı uyuyor. **Uzun anlatım yapma, sadece çalış ve günlüğe yaz.**
Her tur TEK parti işler, sonra durur. Kuyruk diskte durduğu için hiçbir iş kaybolmaz.

## KAPSAM (30 Ağustos, kullanıcı kararı — "B: riskli alt küme")

Anayasa **TAMAMLANDI** (85 dosya / 195 soru / kusurlu 0).

Şimdiki kapsam TCK + CMK'nın **riskli alt kümesi**: 175 küme dosyası / **417 soru**.
Ölçüt sorunun içeriği değil, BANKADAKİ EKSİKLİĞİ:
`question.articleNo` boş **ya da** açıklama boş/40 karakterden kısa. Bu iki eksik,
sorunun kaynakla hiç karşılaştırılmadığına işaret eder.
`sourceLabel` (hangi sınavdan çıktığı) ölçüte DAHİL DEĞİL — doğrulukla ilgisi yok,
ayrı iş kalemi (Aşama 2).

Dağılım: TCK 73 soru (37 dosya) · CMK 344 soru (140 dosya).
Kalan 711 "temiz" TCK/CMK sorusu (madde bağı + açıklaması olanlar) bu turda
DENETLENMEZ; 195 soruluk Anayasa turunda kusur çıkmaması bu riski kabul edilebilir kıldı.

Küme dosyaları `denetim-dosyala.ts --riskli` ile üretildi.

## Sabitler

- Kuyruk yöneticisi : `apps/api/scripts/kuyruk.py`
- Hat (workflow)    : `<scratchpad>/denetim-hat.js`
- Toplayıcı         : `apps/api/scripts/sonuc-topla.py`
- Uygulayıcı        : `apps/api/scripts/denetim-uygula.ts`
- Arşivleyici       : `apps/api/scripts/soru-arsivle.ts`
- Defter            : `docs/32-yayin-denetimi/ilerleme.jsonl`
- Günlük            : `docs/32-yayin-denetimi/GECE-GUNLUK-2.md`
- DB komutu         : `cd apps/api && set -a && source .env && set +a && DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" npx tsx <script>`

## Turun adımları

1. `python3 apps/api/scripts/kuyruk.py al 12`
   - `MESGUL` → günlüğe tek satır "parti sürüyor, atlandı" yaz ve DUR.
   - `BITTI`  → günlüğe "kuyruk bitti" yaz ve DUR.
   - `HAZIR`  → çıktıdaki `args` nesnesini aynen kullan.
2. `Workflow({scriptPath: "<scratchpad>/denetim-hat.js", args: <yukarıdaki args>})`
3. `TaskOutput` ile bitmesini bekle (block=true, timeout 600000).
4. `python3 apps/api/scripts/sonuc-topla.py <journal.jsonl> "" <scratchpad>/sonuc-gece-N.json`
   - journal yolu workflow'un `Transcript dir` çıktısındaki `journal.jsonl`.
5. `npx tsx scripts/denetim-uygula.ts --sonuc <sonuc> --yaz`
6. `python3 apps/api/scripts/kuyruk.py bitir`
7. Günlüğe TEK SATIR yaz: tarih-saat · parti · soru sayısı · yayımlanabilir/belirsiz/kusurlu · token.

## Karar kuralları (kullanıcı onaylı)

- **yayimlanabilir** → uygulayıcı otomatik yazar (articleNo + boş açıklama). Ek iş yok.
- **kusurlu**  → OTOMATİK UYGULAMA. Günlüğe id + gerekçe yaz, sabaha bırak.
- **belirsiz** → önce KURTARMAYI DENE: belirleyici madde bankada var mı diye bak
  (`lawArticle` — TÜM konularda ara, bölüm başlığı için `legislationSection`).
  - Bulunursa: doğrula, deftere `yayimlanabilir` yaz, açıklama üret.
  - Bulunamazsa ve dayanak bankada olmayan bir mevzuatta ise → `soru-arsivle.ts` ile
    `kaynaksiz` arşivle.
  - **Konu anayasa TARİHİ ya da genel hukuk DOKTRİNİ ise ARŞİVLEME.** Deftere
    `denetim-disi` sınıfıyla işle. Gerekçe: soru bozuk değil, mevzuat tabanlı denetimin
    kapsamı dışında; doğru ve müfredat içi bir soruyu silmek bankayı küçültür.
    (Kullanıcı 29 Ağustos'ta bu ayrımı açıkça onayladı.)
- Mevzuat değişikliği yüzünden hiçbir şıkkı doğru kalmamış soru → `eskime` arşivle.
- Kök ile şıklar birbirini tutmuyorsa (içe aktarma bozukluğu) → `bozuk` arşivle.

## Değişmez kurallar

- Supabase havuzu 15 bağlantı: DB scriptleri SIRALI ve `connection_limit=1` ile.
  Alt ajanlar DB'ye ASLA dokunmaz.
- Kaynak gösterilmeden hiçbir soru doğru kabul edilmez.
- Açıklama: Türkçe diakritik zorunlu, ≥200 karakter, kuralı öğret — soruyu tekrar etme.
- Dolu açıklama EZİLMEZ (`oneri-aciklama-uygula.ts` yalnız boşları doldurur).
- Sınavda kullanılmış soru arşivlenebilir (sürüm satırı korunur, geçmiş sonuç bozulmaz)
  ama gerekçesi deftere yazılır.

## Hata halinde

- Workflow düşerse: `python3 apps/api/scripts/kuyruk.py birak` → parti kuyruğa döner.
- Ağ hatasıyla bazı ajanlar düşerse sorun değil: toplayıcı oy yokluğunu ONAY SAYMAZ,
  denetçinin kararı olduğu gibi kalır ve `belirsiz` zaten otomatik uygulanmaz.
