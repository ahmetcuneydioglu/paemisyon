# Doc 55 / F1 — Adaptör: şema, istemci, eşleyici, uygulayıcı, kuru koşu

Tarih: 2 Kasım 2026. Durum: **F1 tamam; yerel kopyada tam akış kuru koşusu hatasız.** Ham rapor: [04-f1-kuru-kosu-raporu.md](04-f1-kuru-kosu-raporu.md).

## 1. Ne yazıldı

| Parça | Yer | Not |
|---|---|---|
| Şema (yalnız ekleme) | `apps/api/prisma/migrations/20261102130000_hub_sync` | `questions.hub_question_id/hub_code`, `question_versions.hub_version_id`, `QuestionArticleSource += hub`, `hub_sync_state`, `hub_topic_map`, `hub_legislation_map`, `hub_sync_log`. Yerel Docker'a uygulandı, drift yok; **prod'a henüz uygulanmadı** (deploy ile gider) |
| İstemci | `src/modules/hub-sync/hub-sync.client.ts` | Bearer; `events` / `payloads` (≤100) / `ack` / `reports`; 503-429-5xx ve ağ hatası üstel geri çekilme → `HubTemporaryError`, 4xx → `HubPermanentError`; anahtar hiçbir mesaja girmez |
| Eşleyici (saf) | `hub-sync.mapper.ts` | §3 kuralları: içerik aynıysa sürüm yok (`link-existing`), farklıysa `versionNo+1` ve sürüm id = merkez sürüm id, seçenek id = uuid v5(sürüm, 'A'..'E'), zorluk 1–2/3/4–5, kaynak adı → `sourceLabel` ("Kaynak belirtilmemiş (PAEMİSYON)" → boş), bağ → `QuestionArticle(source=hub)` + `LegalReference`, `articleNo` yalnız sorunun konusunun kanunundaki zorunlu bağdan |
| Uygulayıcı | `hub-sync.applier.ts` | Olay başına tek işlem; taksonomi → `hub_topic_map` (tohum `hub-topic-map.seed.ts`), mevzuat sürümü → `hub_legislation_map` (metin alınmaz), soru upsert / withdraw; kuru koşuda işlem geri alınır, eşlemeler belleğe taşınır |
| Servis | `hub-sync.service.ts` | çek → yük → uygula → ack; akış dönemi değişince after=0; kalıcı veri hatası olayı durdurmaz, ack `error`'la gider; geçici hata ack'siz durur; `@Cron('*/10 * * * *')` yalnız `HUB_SYNC_ENABLED=true` |
| Elle tetik | `apps/api/scripts/hub-sync.ts` | `--dry-run --from-zero --pages --page-size --report`; canlı DB'ye gerçek koşu `--confirm-live` ister |
| Yardımcılar | `rich-text.ts`, `uuid-v5.ts`, `article-key.ts` | Merkez TipTap belgesi → düz metin (paragraf satır satır, liste önekleri, tablo satırı); uuid-ossp v5 eşdeğeri; `legislation_article_key` köprüsü ("Ek 7" ↔ "ek 7") |
| Testler | 5 spec, 29 test; tüm API 635/635 | Kayıtlı yük örnekleri `__fixtures__/` (yerel merkezden, 2 Kas) |

Ortam: `HUB_SYNC_URL`, `HUB_SYNC_SECRET`, `HUB_SYNC_ENABLED` (`.env.example`'a işlendi). Anahtar yerel merkezde `set-product-sync-secret.mjs paemisyon` ile üretildi; yalnız bu oturumun çalışma dosyasında durur.

## 2. Yerel kopya

Taze anlık görüntüden (kişisel veri yok) `paem-pg-doc55` (Docker, :55434, postgres:17): 59 migration, katalog + 9.135 soru / 9.202 sürüm / 44.875 şık / 3.538 atıf / 3.876 madde bağı / 4.904 madde. Kullanıcı ve çözüm tabloları boş; F2 için bir kullanıcı ve çözüm geçmişi sentezlenecek.

## 3. Kuru koşu (yerel merkez akışı, tamamı)

9.763 olay (20 sayfa), 67 sn, **0 hata**, ack yok.

| Sınıf | Sayı | Anlamı |
|---|---|---|
| `question:link-existing` | 7.202 | İçerik aynı: yalnız merkez kimlikleri ve `hub` bağları yazılır |
| `question:new-version` | 395 | Yeni sürüm. 326'i PAEMİSYON'da 4 şıklı, merkezde 5 şıklı (JSPS hâli esas; karar 8) → **4 şıklı sorunun çoğu bu geçişle 5 şığa tamamlanır**; kalanı gerçek düzeltme/açıklama farkı |
| `question:create` | 1.878 | Merkezden yeni soru: 1.339 yalnız JSPS kökenli, 478 merkez AI üretimi (kaynak "Soru Merkezi mevzuat türetimi", doğrudan yayımlı, karar 3), 63 merkez yazımı |
| `question:skip` (konu yok) | 2 | SM-013184, SM-011710: mevzuat aboneliğiyle üye ama konusu 81 dışında |
| `taxonomy` | 82 eşlendi / 111 eşlenmedi / 20 ders düğümü | Eşlenmeyenler PAEM müfredatı dışı merkez konuları; tohum 81 kodu kapsıyor |
| `legislation_version` | 58 eşlendi / 13 PAEMİSYON'da yok | Yok olanlar (Tebligat Yön., 1 s. CBK, 2803, 4734, 2942, 2935, 6136 Yön. …) yalnız atıf metni olarak gelir |

Bağ çözümü: 9.477 sorunun 276'sında çözülmeyen bağ kaldı — 239'u PAEMİSYON'da olmayan mevzuata, 37'si var olan mevzuatta eksik maddeye (36'sı 6458). İlk koşuda 1.092 Anayasa bağı "madde yok" çıkmıştı: PAEMİSYON'da maddesiz "Anayasa" kabuk kaydı (1 Ekim backfill'i) önce eşleniyordu; aday sıralaması maddeli kaydı öne alacak şekilde düzeltildi.

## 4. Plandan sapmalar ve kararlar

- **İptal (`cancelled`) soru arşivlenmez.** PAEMİSYON'da iptal zaten `PastExamQuestion.cancelled` ile havuz dışıdır ve çıkmış sınav sayfasında rozetle durur (Doc 36). Mevcutsa yalnız kimlik bağlanır; yeniyse alınmaz.
- **Withdraw = sürüm `archived` + soru `deletedAt`** (Doc 31/32 deseni), `currentVersionId` korunur; aynı soruya sonraki upsert canlandırır. Satır silinmez, çözümler kalır.
- `hub_topic_map` plandaki tek sütunlu tablodan geniş: `(hub_topic_id, topic_id, article_from, article_to)`; aralıksız satır varsayılan. Anayasa için aralık satırları **elle** girilecek (hangi PAEMİSYON konusu hangi madde aralığı: kullanıcı).
- Mevcut sorunun konusu DEĞİŞMEZ; merkezden gelen `topic_id` yalnız yeni soru için okunur.
- `link-existing` de `hub` kaynaklı madde bağlarını yazar (merkezin bağ anlık görüntüsü PAEMİSYON'a yansır; editör/legacy bağları korunur).

## 5. F2 için açık işler

1. Yerel kopyada gerçek koşu (ack'li), ikinci koşu (idempotent: hepsi `already-current`), bir düzeltme + bir withdraw + bir AI sorusu senaryosu, bir kullanıcının çözüm geçmişi/yanlış listesi.
2. `hub_topic_map` Anayasa aralıkları; 2 konu-dışı soru için karar.
3. 13 eksik mevzuat: PAEMİSYON'a eklenecek mi, atıf olarak mı kalacak.
4. Panel salt okunurluk + bildirim iletimi (F3).
