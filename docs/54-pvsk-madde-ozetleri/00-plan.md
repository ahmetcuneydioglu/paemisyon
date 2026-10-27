# Doc 54 — PVSK (2559) madde özetleri: içerik ve özetleme sistemi

Tarih: 28 Ekim 2026. Durum: **analiz + plan; uygulama kontrollü aşamalarla sürüyor.**
Ürün anayasası: Doc 29 (Mevzuat Merkezi), Doc 53 (konu özetleri, kanıta dayalı AI içerik), CLAUDE.md güven ilkeleri.
İstem: kullanıcının 28 Eki 2026 tarihli "PVSK içerik ve özetleme sistemi" görevi.

## 1. Analiz raporu (Aşama 1)

**Zaten var olan, yeniden yazılmayacak:**

| Katman | Durum |
|---|---|
| Mevzuat verisi | `legislation` + `law_articles` (+ `law_article_versions` sürüm, `legislation_sections` ağaç). PVSK: `2559-sayili-polis-vazife-ve-salahiyet-kanunu-pvsk`, **42 madde yayında** (1–28, 4/A, 13/A, Ek 1–10, Geçici 1–2), kaynak mevzuat.gov.tr, son doğrulama 21 Tem / 23 Eyl / 4 Eki 2026. Bölüm ağacı yok. |
| Resmî metin ilkesi | Madde metni AI ile üretilmez/özetlenmez; `mevzuat-degisiklik-tara.ts` resmî kaynağın değişiklik şerhlerini okur, `mevzuat-madde-tazele.ts` metni yedekli ve sürümlü tazeler. |
| Okuma yüzeyleri | Web: `/kanun/<slug>` (vitrin), `/kanun/<slug>/oku` (anon okuyucu), `/kanun/<slug>/madde/<no>` (anon madde sayfası, SEO), girişliye aynı URL'de `ArticleWorkspace` (resmî metin, künye, soru örnekleri) ve üç panelli `LawReader`. Mobil: `oku/[slug]` (madde listesi, kaydet, not, paylaş, "N soru ›"), konu odası, Doc 53 özet okuyucuda madde sheet'i. |
| Kullanıcı etkileşimi | Madde favorisi, vurgulama, not, okuma ilerlemesi (`reading_progress`), maddeden seans (`articleNo`). |
| İçerik yönetimi | Admin "Madde Metinleri" (PDF/metin içe aktarma, yayın), Doc 53 "Konu Özetleri" (JSON içe aktar → `in_review` → kart düzenleme → yayın), audit log her işlemde. RBAC: editor hazırlar, admin yayınlar. |
| Doğrulama altyapısı | Doc 53 `ozet-dogrulayici.ts`: her sayı referans madde metninde geçmeli (Türkçe sayı sözcükleri, ekler, değişiklik notu ayıklama, türetilmiş formül, karşı örnek). |
| Soru köprüsü | PVSK konusunda 96 yayında soru, 89'u maddeye bağlı; en çok: md 16 (9), Ek 7 (9), 4/A (7). |
| Erişim | Supabase JWT (ES256) → NestJS guard; RLS yok, erişim NestJS'te. Public uçlar ISR/`Cache-Control`. |

**Güncellik taraması (28 Eki 2026, `mevzuat-degisiklik-tara.ts --konu "Polis Vazife"`):** 42 maddeden **1'i eski**:
**Ek 7** — 24/7/2026 tarihli 7590 s.K. md 27 ile "Bilgi Teknolojileri ve İletişim Kurumu" ibaresi
"Siber Güvenlik Başkanlığı" oldu; bankadaki metinde eski ibare duruyor. Yeni madde yok, yeni mülga yok.
Tazeleme (`mevzuat-madde-tazele.ts --yaz`, yedekli) bu oturumda izin katmanına takıldı; **kullanıcı
çalıştıracak** (bkz. §7). Ek 7 özeti güncel ibareyle yazılır, kaynak alanında "metin tazeleme bekliyor" işaretlenir.

**Mülga maddeler (şerh dışında gövdesi yok):** 3, 18, Ek 8 → özet değil, tek satırlık mülga kaydı. (md 6 "Mülga; Yeniden düzenleme" ile yürürlükte, Ek 2 yalnız birinci fıkrası mülga — ikisi de tam özet alır; `isRepealedText` bu ayrımı yapar.)
(hangi kanunla kaldırıldığı metinden).

**Karar: ikinci bir sistem kurulmaz.** İstemdeki A–J alanları (başlık, kısa özet, ayrıntı, temel noktalar,
süre/sayı/şart, yetki ve sınır, istisna, sınav hatırlatması, bağlantı, kaynak/doğrulama) madde başına bir
kayıt olarak **`law_articles`'a 1:1 bağlı yeni `article_summaries` tablosunda** tutulur; Doc 53'ün
doğrulayıcı, durum akışı (`in_review` → yayın), sürüm ve eskime mantığı aynen kullanılır. Doc 53 üniteleri
(kart dizisi) konu düzeyi; bu katman madde düzeyi — ikisi birbirini tamamlar, madde sayfasında yan yana durur.

## 2. İçerik modeli

```
model ArticleSummary {
  id, lawArticleId @unique (→ LawArticle, cascade)
  title                 String      // "Zor ve silah kullanma yetkisi"
  shortSummary          String      // 2–4 cümle
  detailed              String      // markdown-lite (kalın, liste); paragraflar kısa
  keyPoints             String[]
  conditions            String[]    // yetkinin şartları
  exceptions            String[]    // istisnalar ve dikkat
  timeLimits            Json?       // [{label, value, ref}]   ref: fıkra/bent
  numericalValues       Json?       // [{label, value, ref}]
  authorityAndLimits    Json?       // [{authority, limit}]
  relatedLegislation    Json?       // [{law, article?, note, verified: bool}]
  examReminders         String[]
  derivedNumbers        Json?       // Doc 53 ile aynı: metinde geçmeyen sayı formülle
  counterNumbers        Int[]       // "yanlış şık" sayıları, metinde GEÇMEMELİ
  articleVersionNo      Int?        // özetin yazıldığı madde sürümü (eskime)
  staleSince            DateTime?
  verificationStatus    enum: pending_review | verified | needs_refresh
  verifiedAt            DateTime?   // mevzuat kontrol tarihi (28 Eki 2026 taraması)
  sourceLabel           String      // "AI madde özeti — PVSK md 16" (yalnız admin görür)
  status                ContentStatus @default(in_review)
  version, generatedBy, createdBy, createdAt, updatedAt
  repealed              Boolean     // mülga madde: yalnız title + shortSummary
}
```

Aynı bilgiyi tutan alan açılmaz: kanun no/adı, madde no, resmî kaynak URL'si ve madde doğrulama tarihi
`legislation`/`law_articles`'ta zaten var; özet onlara referansla gider.

## 3. Doğrulama (otomatik + insan)

Otomatik (`madde-ozeti-dogrula.ts`, Doc 53 çekirdeği): tüm metin alanlarındaki her sayı, maddenin
kendi metninde ya da `relatedLegislation`'da adı geçen aynı kanundaki maddede geçmeli; türetilmiş sayı
formülle; karşı örnek metinde geçmemeli; `relatedLegislation` içindeki PVSK madde atıfları bankada var
olmalı; mülga maddede yalnız izinli alanlar dolu. JSON şema doğrulaması (zorunlu alanlar, tipler).

İnsan (admin): otomatik kontrol anlamı göremez — "yetki/şart karışmış mı", "kanunda olmayan bilgi
var mı", "diğer mevzuat atfı doğru mu". Bu yüzden yayın insanın; betik geçse de `in_review`.

## 4. Yüzeyler

- **Web madde sayfası (anon, SEO):** resmî metin yoktur orada (sınav analizi sayfası); "Madde özeti" kartı
  eklenir: başlık, kısa özet, temel noktalar; ayrıntı ve tablolar **girişli** `ArticleWorkspace`'te
  (resmî metnin ALTINDA, "lafız" ve "açıklama" görsel olarak ayrı). Kaynak satırı: "Özet; resmî metin
  değildir · mevzuat kontrolü <tarih>".
- **Web okuyucu (`/kanun/<slug>/oku`, LawReader):** madde altında katlanır "Özet" bloğu (kısa özet +
  temel noktalar; "tamamı" madde sayfasına).
- **Mobil `oku/[slug]`:** madde metninin altında katlanır "Özet" (kısa özet, temel noktalar, süre/sayı
  satırları, sınav hatırlatması). Doc 53 madde sheet'i de aynı bloğu gösterir.
- Alan adları web/mobil ortak: `title, shortSummary, detailed, keyPoints, conditions, exceptions,
  timeLimits, numericalValues, authorityAndLimits, relatedLegislation, examReminders`.

## 5. Üretim hattı

`madde-ozeti-girdi.ts` (madde metni + aynı kanunun komşu maddeleri + o maddeden çıkmış soruların kök/şıkları)
→ `madde-ozeti-uret.ts` (claude-opus-5-5; kurallar §6) → `madde-ozeti-dogrula.ts` → `madde-ozeti-yukle.ts`
(in_review) → admin inceleme → yayın. Partiler: 1–10 · 11–17 · 19–28 · Ek maddeler · Geçici (mülga ve kısa
maddeler tek partide). Tek yanıtta bütün kanun üretilmez.

## 6. Üretim kuralları (istemde)

Lafız ile açıklama ayrı; kanunda olmayan yetki/süre/şart/istisna yok; fıkra ve bent atıfları korunur;
sayı yalnız metinde geçerse; "yürürlükten kalkmış/değişmiş" hüküm güncel gibi sunulmaz (değişiklik şerhleri
girdide verilir); diğer mevzuat atfı yalnız metinde açıkça anılan kanun/madde (ör. "5271 sayılı CMK md 250")
ve `verified:false` ile; sınav hatırlatması kesin tahmin değil, metne dayalı vurgu; kaynak etiketi istemde
yok; dil sade, terim ilk geçtiği yerde açıklanır.

## 7. Aşamalar

| Aşama | İş | Durum |
|---|---|---|
| 1 | Proje analizi, içerik modeli, plan | bu doküman |
| 2 | Mevzuat envanteri: 42 madde, 3 mülga (3, 18, Ek 8), Ek 7 eski (7590) | yapıldı; **Ek 7 tazeleme kullanıcıda** |
| 3 | İçerik standardı: md 16 örnek özeti + doğrulama + kalite listesi | yapıldı (`ornek/pvsk-md-16.json`, GEÇTİ) |
| 4 | Şema + migration + doğrulayıcı + betikler + API + admin + web/mobil | yapıldı — `01-altyapi-ve-yuzeyler.md` |
| 5 | Seri üretim (5 parti) + otomatik kontrol | 28 Eki: p1 (11 madde) 0 kusur; p2–p5 üretiliyor; Ek 7 tazeleme sonrası |
| 6 | Entegrasyon ve E2E | yerel E2E yapıldı; prod: deploy + yükleme + admin inceleme bekliyor |
| 7 | Son rapor | |

**Kullanıcıdan istenen tek işlem (geri alınabilir, yedekli):**
```bash
cd apps/api && npx tsx scripts/mevzuat-madde-tazele.ts /private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/9aaf31d5-9904-4b8a-9bc7-bc1096af5350/scratchpad/pvsk-tazele-plan.json --yaz
```
(önce `--yaz`sız kuru çalışma eski/yeni metni yan yana basar.)
