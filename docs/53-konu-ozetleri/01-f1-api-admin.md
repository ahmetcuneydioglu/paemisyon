# Doc 53 / 01 — F1: şema, API, admin, betikler

Tarih: 26 Ekim 2026. Durum: **yazıldı, yerel E2E geçti, commit ve deploy bekliyor.**
Admin düzenleyici için Figma açılmadı: iç araç, mevcut panel bileşenleriyle (Card, PageHeader, StatusBadge) kuruldu.
Figma F2 web konu sayfası ve F3 mobil okuyucu için açılacak.

## Yazılanlar

| Katman | Dosya | Not |
|---|---|---|
| Şema | `apps/api/prisma/schema.prisma` + `migrations/20261027120000_konu_ozetleri` | `summary_units`, `summary_blocks`, `summary_block_articles`, `summary_progress`, enum `SummaryBlockType`. Ekleme­li; boş Postgres 16'da 52 migration'lık zincir geçti. |
| Doğrulayıcı (saf) | `src/modules/summaries/ozet-dogrulayici.ts` (+ spec, 20 test) | Betik ve servis ortak. Türkçe sayı sözcüğü, ek, onluk-birlik sınırı, değişiklik notu ayıklama, formül, karşı örnek. |
| İçe aktarma | `src/modules/summaries/ozet-ice-aktar.ts` | JSON → doğrula → istatistik veriden → in_review. Geçmeyen ünite yazılmaz. `--replace` sürüm artırır. |
| Public + me | `GET /public/summaries/topic/:topicId`, `GET /public/summaries/:slug`, `POST/GET /me/summaries/progress` | OptionalJwt; kilit sunucuda (premium ünite + premium olmayan → ilk 2 kart). `sourceLabel` asla dönmez. |
| Admin | `/admin/summaries` (liste, stale, import, :id, PATCH :id, blocks ekle/düzenle/arşivle, reorder, refresh-stats, publish, unpublish, DELETE) | editor: içe aktar/düzenle/istatistik; admin: yayın/yayından al/sil. Her kart kaydı sunucuda yeniden doğrulanır; geçmeyen 400 + kusur satırları. |
| Eskime | `AdminLawArticlesService.markSummariesStale` | Panelden madde metni değişince (tekil upsert ve PDF içe aktarma) bağlı insan kartları `staleSince` alır; betik üretimi kartlar eskimez. Eskimiş kartı olan ünite yayınlanamaz. |
| Panel | `apps/admin/src/app/(panel)/summaries/page.tsx`, `[id]/page.tsx`, nav "Konu Özetleri" | Liste (ders › konu), özet sayaçlar, eskimiş kuyruğu, JSON içe aktar; düzenleyici: kartlar solda (düzenle, sırala, arşivle, ekle, doğrulama satırları), referans madde metinleri sağda yapışık. |
| Betikler | `scripts/ozet-girdi.ts`, `ozet-uret.ts`, `ozet-dogrula.ts`, `ozet-yukle.ts` | girdi (madde + soru kökü/şık) → üretim (claude-opus-5-5, sunucu tarafı fallback) → doğrula (--md) → yükle (in_review). |

## Yerel E2E (26 Eki 2026, Docker Postgres 16 :55432, üretimden salt-okur tohum)

Tohum: Anayasa konusu, `t-c-anayasasi` 199 madde + sürümleri, md 75–86'ya bağlı 77 soru, admin kullanıcı. Pilot `ozet-yukle` ile yüklendi (22 kart, in_review).

| Adım | Sonuç |
|---|---|
| Kötü düzenleme ("7 gün" → "10 gün") | 400, kusur satırı ile reddedildi |
| İyi düzenleme (başlık) | kaydedildi, doğrulama geçti |
| md 85 değişti → 3 insan kartı eskidi | yayın "3 eskimiş kart var" ile reddedildi |
| Eskimiş kartlar kaydedilince | kuyruk 0 |
| Editör yayın denedi | 403 "admin yetkisi ister" |
| Admin yayınladı, ünite premium yapıldı | public misafir: locked, 2/22 kart; premium: 22 kart, köprü seans parametreli |
| sourceLabel sızıntısı | yok |
| İlerleme kaydı + konu listesi | `progress.lastBlockIndex=5`, `locked=true` |
| İstatistik yenile | 77 bağlı soru |
| HTTP | `/public/summaries/:slug` ve `/topic/:id` 200, `Cache-Control: private, max-age=60`; `/admin/summaries` 401 |
| Panel rotaları | `/summaries`, `/summaries/[id]` derlendi (200); giriş gerektirdiği için ekran görüntüsü kullanıcı girişinden sonra |

API: 508 test geçti (50 suite). Admin: tsc + eslint temiz.

## Deploy notu

- Migration ekleme­li; `prisma migrate deploy` Railway'de çalışır. Prova: `prisma/` klasörünü `.env`'siz geçici dizine kopyala, yerel URL ile `migrate deploy` (Doc 50 dersi). Yapıldı, geçti.
- Pilot üniteyi canlıya yüklemek: `cd apps/api && npx tsx scripts/ozet-yukle.ts ../../docs/53-konu-ozetleri/pilot/anayasa-yasama-1.json` (deploy sonrası, backend durdurulmadan — tek yazma, connection_limit=1). Sonra panelden yayın.
- Dal diğer oturumların değişiklikleriyle karışık; deploy tek kalemde (Deploy Tek Kalem kuralı).

## Yerel test ortamını yeniden kurmak

```
docker run -d --name paem-ozet-pg -e POSTGRES_PASSWORD=paem -e POSTGRES_DB=paem -p 55432:5432 postgres:16
# .env'siz prisma kopyasıyla migrate deploy; prisma/seed.ts; üretimden salt-okur tohum (oturum betiği, docs'ta yok)
# launch.json: api-e2e-local (:3007, yerel DB), admin-e2e (:3011 → :3007)
```
