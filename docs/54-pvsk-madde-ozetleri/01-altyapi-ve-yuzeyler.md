# Doc 54 — Aşama 4: Altyapı ve yüzeyler (28 Eki 2026)

Durum: **kod tamam, yerelde E2E doğrulandı; main'e push edildi (28 Eki).** Üretim hattı (Aşama 5) paralel yürüyor.

## Veri modeli

- `article_summaries` (Prisma `ArticleSummary`): `LawArticle` ile 1:1 (`lawArticleId @unique`). Alanlar: A–J
  (`title, shortSummary, detailed, keyPoints[], conditions[], exceptions[], timeLimits, numericalValues,
  authorityAndLimits, relatedLegislation, examReminders[]`), sayı kanıtı (`derivedNumbers, counterNumbers`),
  `repealed`, durum (`status` = in_review/published/archived, `version`), doğrulama
  (`verificationStatus` = pending_review/verified/needs_refresh, `verifiedAt`, `articleVersionNo`, `staleSince`),
  kaynak (`sourceLabel` "AI madde özeti — …", `generatedBy`). Migration `20261029100000_madde_ozetleri`.
- Eskime: `AdminLawArticlesService.markSummariesStale` madde metni değişince özeti `staleSince` +
  `needs_refresh` yapar; eskimiş özet yayınlanamaz.
- Mülga tespiti: `isRepealedText` — baştaki şerh parantezleri düşünce gövde kalmıyorsa ve şerh "Mülga"
  içeriyorsa. md 6 ("Mülga; Yeniden düzenleme" + gövde) ve Ek 2 (yalnız birinci fıkrası mülga) YÜRÜRLÜKTE.
  Gerçek mülga: 3, 18, Ek 8.

## Doğrulayıcı (`madde-ozeti-dogrulayici.ts`, 11 test)

Doc 53 çekirdeği üstüne madde kuralları: zorunlu alanlar ve "AI madde özeti" ön eki; madde no eşleşmesi;
mülga maddede yalnız izinli alanlar; aynı kanun "md N" atfı bankada olmalı (1–3 hane, yıl değil; önünde
başka kanun anılıyorsa aynı kanun sayılmaz); `relatedLegislation` kanun numarası madde metninde geçmeli,
kanunun kendisi olamaz, başka kanun `verified:true` olamaz; her sayı madde metninde / atıf maddesinde /
`derivedNumbers` formülünde; yıl (1900–2100) değişiklik şerhinde geçiyorsa geçer; "değil/yoktur/tuzak"
cümlesindeki metin-dışı sayı örtük karşı örnek; `counterNumbers` metinde GEÇMEMELİ; "f.N" fıkra sayısı
kaba kontrolü; `keyPoints` boş olamaz.

## API

- Public: `GET /public/laws/:slug/articles/:no` → `summary` (tam, yalnız published, sourceLabel yok);
  `GET /public/mevzuat/:slug/oku` → her maddede `summary` (kısa biçim). `madde-ozeti-public.ts`.
- Admin `/admin/article-summaries`: `laws` (kapsama), `stale`, `law/:slug` (madde listesi + özet durumu),
  `import` (tek/liste, `?replace=1`), `:id` (özet + resmî metin + canlı doğrulama), `PATCH :id` (kayıt öncesi
  doğrulama; eskime damgası kalkar), `:id/verification`, `:id/publish` (admin; eskimiş/kusurlu/needs_refresh
  engel), `:id/unpublish`, `DELETE :id` (yayındaki silinmez).
- Betikler: `madde-ozeti-girdi.ts` (madde + komşu + atıf maddeleri + soru kök/şık), `madde-ozeti-uret.ts`
  (claude-opus-5-5, madde başına çağrı, kendi kanununu relatedLegislation'dan düşer),
  `madde-ozeti-dogrula.ts` (`--md` ile okunur rapor), `madde-ozeti-yukle.ts` (in_review).

## Yüzeyler

- Web `components/ozet/article-summary.tsx`: `ArticleSummaryCard` (`variant="full"` → girişli
  `ArticleWorkspace`, resmî metnin ALTINDA; `variant="compact"` → anon madde sayfası: başlık, kısa özet,
  temel noktalar, "Ayrıntılı özet" bağlantısı), `ArticleSummaryDisclosure` (native `<details>`; site okuyucu,
  `LawReader`, `ArticlePeek` penceresi). Her yüzeyde "Özet; resmî metin değildir · mevzuat kontrolü <tarih>".
- Expo `components/domain/article-summary.tsx`: `ArticleSummaryDisclosure` (katlanır; `oku/[slug]` madde
  satırı ve Doc 53 `ArticlePeekSheet`). `LawRead.articles[].summary` tipi.
- Admin `/article-summaries` (kanun kapsaması, eskimiş kuyruğu, JSON içe aktarma), `/article-summaries/law/
  [slug]` (madde listesi), `/article-summaries/[id]` (özet alanları düzenlenebilir, sağda resmî metin, doğrulama
  satırları, mevzuat kontrol durumu, yayın).

## Yerel E2E (28 Eki)

Yerel Postgres'e migration uygulandı; PVSK (42 madde) + 59 tohum soru + PAEM bölümü eklendi; p1 özetleri
in_review yüklendi; md 1, 3, 16 yerelde yayınlanıp anon madde sayfası (compact kart, mobil + masaüstü,
koyu + açık), okuyucu (`<details>` bloğu, mülga örneği) ve public API çıktıları doğrulandı. Konsol hatası yok.
Admin paneli (kapsama, kanun listesi, md 4/A inceleme, doğrulama satırları, yayın) ve girişli çalışma alanı (tam kart) ekranda doğrulandı.

## Açık

- Ek 7 metni eski (7590 s.K.): `mevzuat-madde-tazele.ts … --yaz` kullanıcıda; özeti ondan sonra üretilecek.
- Deploy (migration + API + web + admin) ve prod'a in_review yükleme → admin incelemesi → yayın.
