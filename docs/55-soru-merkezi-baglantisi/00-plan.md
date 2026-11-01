# Doc 55 — Soru Merkezi bağlantısı: merkezden tek yönlü soru alımı (adaptör)

Tarih: 1 Kasım 2026. Durum: **plan ONAYLANDI (2 Kas 2026); F0 kuru koşu tamam → [01-f0-fark-aktarimi.md](01-f0-fark-aktarimi.md), gerçek koşu onay bekliyor.**
Karşı taraf: `soru-merkezi` deposu. Yayın sözleşmesi `docs/soru-merkezi-veri-modeli.md` §8, senkron uçları `src/app/api/sync/[product]/**`, PAEMİSYON → merkez aktarım eşlemesi §11, köken tablosu §5.6.

## 0. Karar özeti

| # | Karar | Kaynak |
|---|---|---|
| 1 | **Önce yerel kopyada.** Adaptör yazılır ve PAEMİSYON veritabanının yerel bir kopyasında, yerel merkeze karşı uçtan uca denenir. Canlıya bağlantı, barındırılan merkez açılınca ayrı onayla yapılır. | Kullanıcı, 1 Kas |
| 2 | **Soru içeriğinin tek sahibi merkezdir.** Merkezden gelen sorular PAEMİSYON panelinde salt okunur olur. Geçişten sonra yeni soru yazımı, içe aktarma ve düzeltme merkezde yapılır. | Kullanıcı, 1 Kas |
| 3 | **Merkezde doğrulanmış AI soruları PAEMİSYON'da doğrudan yayımlı başlar.** CLAUDE.md'deki "AI soru üretimi yapılmaz" kuralı, merkezden gelen sorular için bu kararla değişir. Ayırt edici kaynak korunur: merkezin AI soruları "Soru Merkezi mevzuat türetimi" kaynağıyla gelir ve `sourceLabel`'a yazılır; panelde gerçek çıkmış sorulardan her zaman ayrılır, kullanıcıya gösterim mevcut `show_question_source` ayarına bağlıdır. | Kullanıcı, 1 Kas |
| 4 | **Kullanıcı geçmişi korunur.** Merkezdeki sorunun PAEMİSYON'da karşılığı varsa (`local_id`, S2 köken kaydı) yeni soru açılmaz; değişiklik aynı soruya yeni sürüm olarak eklenir. Eski sürümler, `QuizAnswer.questionVersionId` ve seçenek kimlikleri dokunulmadan kalır. | Sözleşme §8 |
| 5 | **Mevzuat metni PAEMİSYON'da kalır (onaylandı, 2 Kas).** `LawArticle`'a kullanıcı vurguları, notları, yer imleri, konu ve PVSK özetleri bağlı. Adaptör merkezin mevzuat sürümlerini yalnız soru ↔ madde bağını kurmak için okur; madde metnini değiştirmez. Mevzuat metni ayrı bir kararla ve `LawArticleVersion` üzerinden ileride bağlanır. | Claude, §6 |
| 6 | **Geçişten önce fark aktarımı.** Merkezdeki PAEMİSYON verisi 01.10.2026 anlık görüntüsüdür (9.135 soru). O tarihten sonra PAEMİSYON'da açılan ya da değişen sorular önce merkeze aktarılır (merkezin S2 betikleri tekrar çalıştırılabilir ve köken kaydıyla eşleşir). Aksi hâlde merkez bu sorulardan habersiz kalır ve karar 2 onları dondurur. | Claude, §8 |
| 7 | Uygulama NestJS içinde yazılır (`apps/api/src/modules/hub-sync`), ayrı süreç değil. Tetikleyici önce elle çalışan betik (`apps/api/scripts/hub-sync.ts`), sonra süreç içi `@Cron` (Doc 52 düzeniyle). | Claude |

Sıra: bu plan → onay → F0 (fark aktarımı, merkez tarafı) → F1 (şema + adaptör + kuru koşu) → F2 (yerel kopyada uçtan uca) → F3 (panel salt okunur, bildirim iletimi) → canlı geçiş (ayrı onay).

## 1. Sözleşmenin özeti (merkez tarafı, değişmez)

- Ürün `Authorization: Bearer <anahtar>` ile çeker: `GET events?after=<seq>` → her `question upsert` için `POST payloads` (≤100) → uygula → `POST ack {seq}`.
- Teslim en az bir kez; uygulama idempotent olmalı. `upsert` eski sürümü geri yazmaz. Bağımlılıklar (taksonomi, mevzuat sürümü, kaynak) sorudan önce gelir.
- `stream_epoch` değişirse ürün `after = 0`'dan okur; `snapshot_end_seq`'e kadarki olaylar tam anlık görüntüdür.
- **Kimlikler:** sürüm satırının birincil anahtarı merkezdeki `version.id`'dir. Seçenek kimliği `uuid_generate_v5(version.id, 'A'..'E')` ile türetilir (rastgele kimlik çözüm kayıtlarını koparır).
- `local_id` / `local_aliases`: PAEMİSYON'un eski soru kimlikleri (S2 kökeni).
- `cancelled: true` olan soru havuza alınmaz. `withdraw` olayı soruyu geri çeker.
- Hata bildirimi: `POST reports {external_report_id, question_id, reason_code, description, solve_count}`. Kişisel veri gitmez.

## 2. Şema değişiklikleri (Prisma, yalnız ekleme)

| Değişiklik | Neden |
|---|---|
| `Question.hubQuestionId uuid? @unique`, `Question.hubCode text?` | Merkez kimliği; salt okunurluk ve bildirim iletimi bunu okur |
| `QuestionVersion.hubVersionId uuid? @unique` | Merkezden gelen sürüm. Yeni sürümlerde `id = hubVersionId` (sözleşme), mevcut sürümler için eşleme |
| `QuestionArticleSource += hub` | Bağın merkezden geldiği |
| `hub_sync_state` (tek satır: `stream_epoch`, `last_acked_seq`, `last_run_at`, `last_error`) | İmleç |
| `hub_topic_map (hub_topic_id uuid pk, topic_id uuid)` | Merkez konusu → PAEMİSYON konusu |
| `hub_legislation_map (hub_legislation_id uuid pk, legislation_id uuid)` | Merkez mevzuatı → PAEMİSYON mevzuatı (bağ kurmak için) |
| `hub_sync_log (seq, entity, action, result, detail, created_at)` | Denetim ve kuru koşu raporu |

Yeni tablo yok sayılmaz: hiçbiri mevcut veriyi değiştirmez; adaptör kapalıyken uygulama bugünkü gibi çalışır.

## 3. Eşleme kuralları

| Merkez yükü | PAEMİSYON |
|---|---|
| `question.local_id` (varsa) | Mevcut `Question.id`. Yoksa yeni `Question` |
| `question.topic_id` | `hub_topic_map` ile `topicId`. Haritası olmayan konu → olay atlanmaz, `hub_sync_log`'a "konu eşlemesi yok" yazılır ve ack bekler (§7) |
| `version.stem` / `detailed_solution` (zengin metin) | `stem` / `explanation` düz metin (paragraflar satır satır) |
| `difficulty` 1–5 | 1–2 `easy`, 3 `medium`, 4–5 `hard` (S2'nin tersi: easy→2, medium→3, hard→4) |
| `options[]` | `QuestionOption` (`label` = key, `text`, `isCorrect`, `sortOrder`); `id` = uuid v5 |
| `version.source.name` | `sourceLabel` (merkez AI soruları: "Soru Merkezi mevzuat türetimi") |
| `legislation_links[]` (`required` → `primary`, `supporting` → `related`) | `QuestionArticle` (`source = hub`) + `LegalReference.citation` ("<kısa ad> md. <madde>"). Madde bulunamazsa yalnız `LegalReference` yazılır |
| `required` bağın madde anahtarı | `Question.articleNo` (atlas) |
| `cancelled` ya da `withdraw` | Güncel sürüm `archived` (soru silinmez; geçmiş korunur) |
| `option_count = 4` | Olduğu gibi (merkez kararı 8) |

**Mevcut soruya ilk yük:** Merkezdeki sürüm PAEMİSYON'un güncel sürümüyle aynı içerikteyse (kök, şıklar, doğru şık, açıklama normalize edilerek karşılaştırılır) yeni sürüm açılmaz; yalnız `hubQuestionId` ve `hubVersionId` yazılır. Farklıysa (ör. merkezde sd-01 düzeltmesi) yeni sürüm `versionNo + 1` olarak eklenir ve güncel yapılır. İlk senkronun beklenen sonucu: büyük çoğunluk "eşlendi, sürüm yok".

**Konu belirsizliği:** Merkezde tek Anayasa konusu (`anayasa-hukuku-2709`) var, PAEMİSYON'da beş. Mevcut soruların konusu değişmez. Yeni Anayasa sorusu için hedef konu madde aralığından seçilir (`hub_topic_map`'e madde aralığı sütunu) ya da tek varsayılan konuya düşer (onayda seçilecek).

## 4. Mimari

```
apps/api/src/modules/hub-sync/
  hub-sync.client.ts     merkez uçları (events, payloads, ack, reports); 503/55P03 geri çekilme
  hub-sync.mapper.ts     saf eşleme (yük → yazılacak satırlar); birim testli
  hub-sync.applier.ts    olay başına tek Prisma işlemi; idempotent upsert
  hub-sync.service.ts    döngü: çek → uygula → ack; kuru koşu; durdurma anahtarı
  hub-sync.module.ts
apps/api/scripts/hub-sync.ts   elle tetik: --dry-run (yazmaz, rapor), --limit, --from-zero
```

- Ortam: `HUB_SYNC_URL`, `HUB_SYNC_SECRET` (değer loglanmaz), `HUB_SYNC_ENABLED` (varsayılan kapalı).
- Supabase pooler sınırı (15): betik `connection_limit=1`, yazma partileri küçük; DB-yazma penceresi kuralı geçerli.
- Kuru koşu: aynı yolu işlem içinde çalıştırır, sonunda geri alır; `hub_sync_log`'a sayım yazar (yeni soru, yeni sürüm, eşlenen, atlanan, konu eşlemesi yok).

## 5. Panel ve iş akışı (F3)

- `admin-questions.service`: `hubQuestionId` dolu soruda `update`, `updateExplanation`, `approve`, `reject`, `archive`, `bulkSetTopic` 403 döner ("Bu soru Soru Merkezi'nde düzenlenir: SM-xxxxxx"). Panel bu sorularda düzenleme düğmelerini gizler, merkez kodunu gösterir.
- Geçişten sonra `create` ve `import` kapatılır (karar 2). Doc 39 üretim hattı merkeze taşınır (merkez sınav profili `paem`, `misyon`).
- `QuestionReport` → merkeze iletilir (`POST reports`; dış kimlik = rapor id, çözüm sayısı toplam). Merkezde eşik aşılınca inceleme; düzeltme merkezde, yeni sürüm adaptörle gelir.

## 6. Mevzuat (karar 5 gerekçesi)

PAEMİSYON'un Mevzuat sekmesi kendi metnini, dipnot temizliğini (Doc 48) ve kullanıcı verisini taşır. Merkez metnini doğrudan yazmak vurgu ve not konumlarını kaydırabilir. Bu fazda adaptör `legislation_version` olaylarını yalnız `hub_legislation_map` ve madde anahtarı eşlemesi için kullanır. Metin senkronu ayrı plan: `LawArticleVersion`'a yeni sürüm + metin farkı olan maddelerde vurgu/not uyarısı.

## 7. Hata ve ack kuralı

- Olay başarıyla uygulandıysa ack.
- Kalıcı veri hatası (konu eşlemesi yok, madde yok) olayı durdurmaz: soru yazılır ya da atlanır, durum `hub_sync_log`'a girer, ack `error` alanıyla gönderilir (merkez kayda alır).
- Geçici hata (ağ, 503) ack'siz döner; sonraki çalıştırma aynı imleçten sürer.

## 8. Fazlar

| Faz | İş | Doğrulama |
|---|---|---|
| F0 (merkez) | PAEMİSYON fark aktarımı (01.10 sonrası soru ve sürümler), merkezde PAEMİSYON ürünü ve abonelikleri (S2'de PAEMİSYON'dan gelen 81 konu + AI üretimi yapılacak konular), senkron anahtarı | Kuru koşu raporu; köken kayıtlarıyla eşleşme |
| F1 | Şema migration'ı, mapper + applier + client, kuru koşu | Birim testleri (kayıtlı yük örnekleri); kuru koşu raporu |
| F2 | Yerel kopya: PAEMİSYON yedeğinden yerel Postgres, yerel merkez; ilk senkron, ikinci senkron (idempotent), bir düzeltme, bir withdraw, bir AI sorusu | Sayımlar; bir kullanıcının çözüm geçmişinin ve yanlışlar listesinin bozulmadığı |
| F3 | Panel salt okunur, bildirim iletimi, `@Cron` | Panel E2E; bildirimin merkeze düştüğü |
| Canlı | Barındırılan merkez + anahtar + DB-yazma penceresi | Ayrı onay |

## 9. Geri dönüş

Bütün şema değişiklikleri ektir. `HUB_SYNC_ENABLED=false` adaptörü durdurur; panel salt okunurluğu tek bayrakla (`hubQuestionId` denetimi) kaldırılabilir. Merkezden gelen yeni sürümler eski sürümleri silmediği için güncel sürüm göstergesi bir önceki sürüme döndürülebilir.

## 10. Onay bekleyen sorular — KARARLAR (2 Kas 2026)

Üçü de öneri yönünde karara bağlandı: (1) evet, mevzuat metni bu fazda PAEMİSYON'da kalır; (2) yeni Anayasa soruları madde aralığına göre beş konudan birine düşer, `hub_topic_map`'e madde aralığı sütunu; (3) abonelik 81 konu + PAEM/Misyon müfredatıyla eşleşen mevzuat (F0'da 81 konu + 67 mevzuat = 148 düğüm, 9.477 soru).

Özgün sorular:

1. Karar 5: mevzuat metni bu fazda PAEMİSYON'da kalsın mı? (öneri: evet)
2. Yeni Anayasa soruları: madde aralığına göre beş konudan birine mi, tek varsayılan konuya mı? (öneri: madde aralığı)
3. PAEMİSYON'un merkezden alacağı konular: yalnız S2'de PAEMİSYON'dan gelen 81 merkez konusu mu, yoksa PAEM/Misyon müfredatındaki başka merkez konuları da mı (ör. GYS için üretilen CMK, Tebligat soruları)? (öneri: 81 konu + müfredatla eşleşen mevzuat aboneliği)
