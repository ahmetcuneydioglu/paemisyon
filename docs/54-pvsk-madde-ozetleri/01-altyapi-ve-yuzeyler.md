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
  `ArticleWorkspace`, resmî metnin ALTINDA; 28 Eki kararı: açılışta kısa özet + temel noktalar + "sınavda dikkat", ayrıntılı açıklama/şartlar/yetki/süre-sayı/istisna/ilgili mevzuat "Ayrıntıyı aç" altında katlı — geri bildirime göre düzenlenecek; `variant="compact"` → anon madde sayfası: başlık, kısa özet,
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

## Web önbelleği yenilemesi ve Vercel Firewall (28 Eki 2026 eki)

- API, özet yayınlanınca/yayından alınınca `POST https://paemisyon.com/api/revalidate` çağırır
  (`web-revalidate.ts`, `user-agent: paemisyon-api/revalidate`, `x-revalidate-secret`). Toplu yayın ve
  "Web önbelleğini tazele" bütün yolları **tek paket** (≤50 yol/istek) gönderir; özet başına ayrı
  istek atılmaz.
- Üretimde çağrı Vercel'den **429** aldı (Railway günlüğü: `[WebRevalidate] web yenileme 429`). Günlük
  artık `x-vercel-mitigated`, `x-vercel-id` ve `retry-after` başlıklarını yazar; `mitigated=challenge`
  görülürse neden Vercel Firewall'un Bot Protection / Attack Challenge katmanıdır (sunucu isteği tarayıcı
  challenge'ını geçemez), aksi hâlde özel bir hız sınırı kuralıdır.
- **Çözüm (Vercel paneli, paemisyon-web → Firewall):** Custom Rule ekle — koşul `Request Path` equals
  `/api/revalidate` **ve** `Header x-revalidate-secret` exists; action **Bypass**. Bypass, yönetilen kural
  setlerini (bot koruması, challenge, hız sınırı) bu yol için devre dışı bırakır; uç kendi secret
  kontrolünü yaptığı için (401) açık kalması güvenlidir.
- Sonuç artık admin'e döner: tazeleme düğmesi 429'da hata gösterir (eskiden "tazelendi" diyordu);
  tek/toplu yayın sonucu `web`/`webOk` alanlarıyla gelir. Doğrulama: admin → Madde Özetleri → PVSK →
  "Web önbelleğini tazele" yeşil; girişsiz `/kanun/…/madde/5`, `madde/13`, `madde/ek-6` sayfalarında
  "Madde özeti" kartı görünür.
- **Üretim ayarı (28 Eki 2026, çözüldü):** Firewall Bypass kuralı (`/api/revalidate` + `x-revalidate-secret` exists)
  eklendi; 429 bitti. Ardından 401 görüldü: Railway'de `WEB_REVALIDATE_SECRET` Vercel'deki `REVALIDATE_SECRET` ile
  aynı değere çekildi ve `WEB_BASE_URL=https://www.paemisyon.com` eklendi (apex 308 ile www'ye yönlendiriyor).
  Railway'de değişken kaydı "Apply changes" ile dağıtılmadan uygulanmaz. Elle test:
  `curl -i -X POST https://www.paemisyon.com/api/revalidate -H 'content-type: application/json' -H 'x-revalidate-secret: …' -d '{"paths":["/kanun/…/oku"]}'`
  → 200 `{"revalidated":[…]}`. Admin "Web önbelleğini tazele" yeşil.
