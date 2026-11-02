# Doc 55 — F3: Panel salt okunur, bildirim iletimi, cron

Tarih: 2 Kasım 2026. Durum: **F3 tamam; prod'a dokunulmadı.** Plan: [00-plan.md](00-plan.md) §5, §8.
Önceki: [05-f2-uctan-uca.md](05-f2-uctan-uca.md).

## 1. Ne yapıldı

| Parça | Değişiklik |
|---|---|
| Yanlış / favori listesi | `ReviewService.getWrongAnswers` ve `getBookmarks` yayından kalkan soruyu (`deletedAt` dolu ya da güncel sürümsüz) listelemez. Kayıt silinmez; tur incelemesi cevaplanan sürümü okumaya devam eder. F2'deki "defter 4 sayar, tur 3 kurar" tutarsızlığı kapandı. Sayfa kısalmasın diye fazladan 30 kayıt okunup süzülür. |
| Bildirim iletimi | `question_reports`'a beş alan (migration `20261102190000_hub_report_forward`, yalnız ekleme): `hub_forwarded_at`, `hub_report_id`, `hub_flagged`, `hub_forward_error`, `hub_forward_tries`. `HubReportForwarder` merkez sorusunun bildirimini `POST /api/sync/paemisyon/reports` ile iletir: dış kimlik = bildirim id, `reason_code` `user_report`, açıklama = kullanıcı mesajı (≤2000), `solve_count` = sorunun toplam cevap sayısı. **Kişisel veri gitmez** (kullanıcı kimliği, e-posta yok; birim testi alan kümesini sabitler). PAEMİSYON sorusunun bildirimi iletilmez. |
| Yeniden deneme | Geçici hata (ağ, 5xx) → deneme +1, hata satırda, bildirim oluşturma etkilenmez. Kalıcı ret (4xx, ör. 422 "ürün bu soruyu almadı") → deneme hakkı biter, panelde "iletilemedi" olarak durur. Bekleyenler cron'da (`HubSyncService.tick`, senkrondan sonra, ondan bağımsız) ve `scripts/hub-sync.ts --reports` ile yeniden denenir. Merkez aynı dış kimliği ikinci kez alırsa `created:false` → yerelde "iletildi" sayılır (idempotent). |
| Panel salt okunur (API) | `AdminQuestionsService.merkezKilidi`: `hubQuestionId` dolu soruda `update`, `submitForReview`, `approve`, `reject`, `archive`, `updateExplanation` **403** "Bu soru Soru Merkezi'nde düzenlenir: SM-xxxxxx". `bulkApprove`/`bulkReject` merkez sorusunu süzer; `bulkSetTopic` merkez sorusunu atlar ve `skippedHub` döner (konu `hub_topic_map`'ten gelir — plan §10). Liste `hubCode`, detay `hubQuestionId`/`hubCode`/`hubUrl` (merkezin `/admin/questions/<kod>` sayfası; `HUB_SYNC_URL`'den) taşır. |
| Panel salt okunur (UI) | `HubBadge` bileşeni (liste, detay, bildirimler). Detayda merkez uyarısı + "Merkezde aç" bağlantısı; editoryal düğmeler gizli; `QuestionForm` `readOnly` (fieldset[disabled], kaydet yok). Bildirimler sayfasında iletim durumu: *Merkeze iletildi · Merkezde incelemede · Merkeze iletim bekliyor · Merkeze iletilemedi* (hata ipucu başlıkta) ve "düzeltme merkezde yapılır" notu. |
| Cron | F1'deki 10 dakikalık `@Cron` korundu; tick artık bildirim iletimini de dener. Olaysız koşu da `hub_sync_state.last_run_at` yazar (canlılık göstergesi; önceden yalnız ack'li sayfada yazılıyordu). |

Yeni dosyalar: `hub-sync/hub-report-forwarder.ts` (+spec), `hub-sync/hub-sync.tokens.ts` (döngüsel içe aktarmayı kıran enjeksiyon anahtarları), `hub-sync/hub-url.ts`.

## 2. Doğrulama (yerel kopya, gerçek API ve panel)

Düzenek F2 ile aynı (`paem-pg-doc55`, yerel merkez :3200, API :3055 `HUB_SYNC_ENABLED=true`); kimlik için yerel JWKS, üç sentetik kimlik
(F2 kullanıcısı, ikinci kullanıcı, admin — yerel `roles` tablosuna `admin/editor/user` eklendi). Panel :3056, yerel oturum.

| Adım | Sonuç |
|---|---|
| `review/wrong-answers` | 4 → **3** (geri çekilen `58a15ad0` yok); tur sayısıyla tutarlı |
| `review/bookmarks` | 2 → **1** (geri çekilen yok) |
| Kullanıcı → merkez sorusu (SM-007505) bildirimi | 201; merkez kapalıyken "fetch failed" → deneme 1, bildirim yerinde |
| Merkez açıldı, `--reports` | 2 bildirim `sent`; ikincisinde merkez **flag**: `question_reviews` "paemisyon: 2 bildirim / 1 çözüm (eşik 2)" |
| Merkez `question_reports` | `product=paemisyon`, `external_report_id` = yerel id, `reason_code=user_report`, `product_solve_count=1`, **`user_id` boş** |
| Aynı kullanıcı tekrar | `alreadyReported:true`, yeni satır yok |
| PAEMİSYON sorusu bildirimi | 201, iletilmedi (`tries 0`, hub alanları boş) |
| Geri çekilmiş soruya bildirim | 404 (`deletedAt` süzgeci, mevcut davranış) |
| İdempotentlik | `hub_forwarded_at` silinip yeniden gönderildi → merkez `created:false`, yerelde `duplicate`, merkezde satır sayısı 2 kaldı |
| Admin API (merkez sorusu) | PATCH, submit, approve, reject, archive, explanation → **403** aynı mesajla; sürüm ve konu değişmedi |
| Admin API (PAEMİSYON sorusu) | submit → 400 "yalnızca taslak…" (kilit seçici) |
| `bulk-set-topic` [merkez, yerel] | `{updated:1, skippedHub:1}` |
| `admin/reports` | merkez bildirimlerinde `hub{code, forwardedAt, flagged, error, tries}`; yerel soruda `null` |
| Panel detay (ekran) | rozet `⇄ SM-007505`, uyarı + "Merkezde aç", düğme yok, fieldset `disabled`, kaydet yok |
| Panel bildirimler (ekran) | "Merkezde incelemede" ve "Merkeze iletildi" rozetleri, merkez notu |
| Cron | 16:40:00 tick: "hub-sync: 0 olay, {}, imleç 240494"; API günlüğünde hata yok |

Birim: `hub-report-forwarder.spec.ts` 6 test (alan kümesi, duplicate, not-hub/already/missing, kapalı adaptör, geçici/kalıcı hata, bekleyen tarama); hub-sync toplam 35/35. API `tsc` (build) ve panel `tsc`/eslint temiz.

## 3. Notlar

- **Yerel kopyada katalog ağacı boş** (`modules` tablosu 0 satır — F1 kopyası sorular ve konuları aldı, modülleri değil): panelde konu seçicisi "Konu seç…" gösterir. Kopya eksiği, kod değil; prod'da ağaç dolu.
- Merkez tarafı: bu turda merkez deposunda değişiklik yok; `ingest_product_question_report` ve eşik gözcüsü olduğu gibi çalıştı.
- Yerel merkezde artık SM-007505 için iki PAEMİSYON bildirimi ve bir `flagged` kaydı var (yerel; `db:reset` siler).
- Plan §5'teki "geçişten sonra `create` ve `import` kapatılır" canlı geçiş adımıdır; bu turda dokunulmadı.

## 4. Prod'a geçiş için kalanlar

İki migration deploy ile (`20261102130000_hub_sync`, `20261102190000_hub_report_forward`); `HUB_SYNC_URL`/`HUB_SYNC_SECRET` Railway'e elle;
ilk koşu DB-yazma penceresinde `--confirm-live`; sonra `HUB_SYNC_ENABLED=true` (cron + bildirim iletimi). Barındırılan merkezin adresi `hubUrl`
bağlantısını da belirler. Açık kararlar [03-f1-adaptor.md](03-f1-adaptor.md) §6'da (`--links`, 109 görünmeyen soru, 13 mevzuat, Anayasa aralıkları).
