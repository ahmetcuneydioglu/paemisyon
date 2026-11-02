# Doc 55 — F2: Yerel kopyada uçtan uca senkron

Tarih: 2 Kasım 2026. Durum: **F2 tamam; prod'a dokunulmadı.** Plan: [00-plan.md](00-plan.md) §F2.
Önceki: [03-f1-adaptor.md](03-f1-adaptor.md) (adaptör + kuru koşu).

## 1. Düzenek

| Parça | Değer |
|---|---|
| PAEMİSYON yerel kopyası | Docker `paem-pg-doc55` (:55434), taze anlık görüntüden katalog + sorular; kullanıcı verisi yok (F1'de kuruldu) |
| Yerel merkez | Supabase yığını `supabase_db_soru-merkezi` (:54422), web `pnpm dev` :3200 (launch.json `merkez-web`) |
| Yerel PAEMİSYON API | `npm run start:dev` :3055, yerel kopyaya bağlı (launch.json `api-doc55`; `NUDGE_CRON=0`, `EMAIL_WORKER=0`, bildirim `console`) |
| Kimlik | Yerel JWKS yardımcısı (:3299, ES256) — `SUPABASE_URL` ona yönlendirildi, test token'ı `sub` = sentetik kullanıcı. Gerçek JWT doğrulama yolu değişmeden çalıştı. |
| Senkron | `npx tsx scripts/hub-sync.ts` (gerçek koşu; `--report=`), anahtar ortamdan |

Sentetik kullanıcı (`f2-test@paemisyon.local`, premium, rol `beta`): iki tamamlanmış alıştırma turu,
5 cevap (4 yanlış 1 doğru), 4 yanlış kaydı, 2 favori, 5 tekrar kaydı (SRS), 2 konu ilerlemesi, 2 günlük kullanım.
Seçilen sorular ve senaryodaki rolleri:

| Soru | Merkez | Rol |
|---|---|---|
| `f2df4b11` Cumhuriyetin nitelikleri | SM-007505 | içerik aynı → yalnız bağlanır |
| `58a15ad0` Egemenlik kime aittir | SM-007506 | senaryoda merkezden **geri çekilir** |
| `019c30b1` Temel hak ve hürriyet değildir | SM-007507 | senaryoda merkezde **düzeltilir** (yeni sürüm) |
| `c1748503` 1856 Islahat Fermanı | SM-004116 | ilk senkronda 4→5 şık **yeni sürüm** |
| `9b1620d8` Meclis hükümeti sistemi | SM-010144 | doğru cevaplanan kontrol sorusu |

Her adımdan önce ve sonra iki iz alındı: (a) kullanıcının bütün satırları (7 tablo + cevaplanan sürümler + seçilen şıklar) sıralı JSON,
(b) gerçek API yüzeyleri: `review/wrong-answers`, `review/bookmarks`, `review/due`, `progress/history`, `progress/summary`,
iki turun `quiz/sessions/:id/review` çıktısı.

## 2. Koşular

| Koşu | Girdi | Sonuç | Süre | Ack |
|---|---|---|---|---|
| 1 — ilk senkron | imleç 0, 20 sayfa, 9.763 olay | 2.413 applied (1.878 create, 395 new-version, 58 mevzuat, 82 taksonomi), 7.202 linked, 126 unmapped, 22 ignored, **0 hata** | 74 sn | evet, imleç 240465 |
| 2 — artımlı | imleç 240465 | 0 sayfa, 0 olay | 0 sn | gerek yok |
| 3 — `--from-zero` (idempotentlik) | aynı 9.763 olay yeniden | **9.475 soru `skipped` (already-current)**, 140 eşleme satırı yeniden uygulandı, 0 hata | 45 sn | evet |
| 4 — senaryo | 3 olay (240490, 240492, 240494) | 1 new-version, 1 withdraw, 1 create; 0 hata | <1 sn | evet, imleç 240494 |

Koşu 1 sayımları F1 kuru koşusuyla birebir aynı. Koşu 3'te tablo sayımları değişmedi
(`questions` 11.013, `question_versions` 11.475, `question_options` 56.236, `question_articles` 6.284, `legal_references` 5.220;
son `created_at` koşu 1'in zamanı), yalnız `hub_sync_log` ikinci kez yazıldı (19.526). `hub_topic_map`'teki elle düzenlenen
`topic_id` yeniden uygulamada korunur (uygulayıcı varsa güncellemez; yalnız kod/ad tazeler).
Merkez tarafında `product_sync_state.last_acked_seq` her ack'li koşuda eşleşti (240465 → 240494).

## 3. Senaryo (merkez tarafı)

Yazım yolu F0 fark aktarımıyla aynı: servis rolü, doğrudan satır, `record_question_publication`, `emit_question_publication_events`
(betik: oturum scratchpad `f2-merkez-senaryo.mjs`; merkez deposuna girmedi). Editoryal RPC zinciri kullanılamadı: `publish_question_head`
kaynak güveni A–C ister, S2'den gelen PAEMİSYON soruları D güvenlidir.

1. **Düzeltme** SM-007507 → sürüm 2: kök "1982 Anayasası'na göre …" diye netleştirildi, E şıkkı eklendi (4→5), çözüm genişletildi; `republished`.
2. **Geri çekme** SM-007506: `archived` + `withdrawn_at`; olay `withdraw/archived`.
3. **AI sorusu** SM-015452: Anayasa md 6 (egemenliğin kullanılması), 5 şık, zorunlu bağ md 6, `ai_generated` + `ai_generations` kaydı,
   doğrulanmış (B), kaynak "Soru Merkezi mevzuat türetimi"; olay `upsert/published`.

Merkez kısıtları betiğe iki düzeltme yaptırdı (ikisi de merkezin doğru davranışı): `published_version` ancak sürüm satırından sonra yazılır
(FK), `ai_generated` sürüm `ai_generation_id` ister. İlk iki deneme geri alındı; merkezde yarım kayıt kalmadı.

## 4. PAEMİSYON tarafında sonuç

| Kontrol | Sonuç |
|---|---|
| SM-007507 | `019c30b1` sürüm 2 (5 şık, `hub_version_id` = merkez sürüm id), sürüm 1 `archived`; `question_articles` korunmuş |
| SM-007506 | `58a15ad0` `deleted_at` yazıldı, sürüm `archived` (satır silinmedi) |
| SM-015452 | yeni soru, konu "T.C. Anayasası" (varsayılan satır; madde aralığı girilmedi), `medium`, 5 şık A doğru, `question_articles` hub/primary md 6, `legal_references` "Anayasa md. 6", `sourceLabel` "Soru Merkezi mevzuat türetimi" |
| SM-004116 | `c1748503` sürüm 2 (5 şık) ilk senkronda; sürüm 1 `archived` |

Kullanıcı izi (koşu 1 → 4 boyunca):

| Yüzey | Sonuç |
|---|---|
| 7 kullanıcı tablosu (oturum, cevap, yanlış, favori, SRS, ilerleme, günlük) | **bayt bayt aynı** |
| Cevaplanan sürümler | 5/5 yerinde; üçünün durumu `published → archived` (q2, q3, q4), şık id'leri çözülüyor |
| `quiz/sessions/:id/review` (iki tur) | **aynı**: cevaplanan sürümün kökü/şıkları, seçilen şık, doğru/yanlış — düzeltme ve geri çekme sonrasında da |
| `progress/history`, `progress/summary`, `review/due`, `review/bookmarks` | **aynı** |
| `review/wrong-answers` | 4 kayıt yerinde; yalnız `019c30b1`'in kökü güncel sürümün (düzeltilmiş) metni oldu — beklenen |
| Yanlış tekrarı turu (POST `quiz/sessions` mode=review) | 3 soru: `f2df4b11` v1, `019c30b1` **v2 (5 şık)**, `c1748503` **v2 (5 şık)**; geri çekilen `58a15ad0` **turda yok** |

API günlüğünde hata yok.

## 5. Gözlemler (F3 / karar)

- **Geri çekilen soru yanlış defterinde kalır, turda çıkmaz.** `review/wrong-answers` 4 kayıt sayarken tur 3 soru kurdu. Bu, admin
  arşivlemesiyle (aynı `deletedAt` deseni) bugün de olan davranış; iptal soruları için `iptalSoruIdleri` ile çözülmüş benzeri.
  Öneri (F3): yanlış/favori listelerinde `deletedAt` olanı ya düş ya "yayından kalktı" rozetiyle göster.
- **AI sorusu yayımlı başlar** (plan karar 3), kaynak etiketi ayrıştırıcı; kullanıcıya gösterim `show_question_source` ayarına bağlı (varsayılan kapalı).
- **172 sürümsüz soru** yerel kopyada (`current_version_id` NULL, Ağustos 2026, hub bağı yok): aktarım kaynaklı değil, prod'da da var;
  ayrı temizlik konusu.
- **Anayasa madde aralıkları** `hub_topic_map`'e girilmediği için merkezden gelen yeni Anayasa soruları varsayılan "T.C. Anayasası" konusuna düşüyor.
- **Yerel merkez verisi** senaryo kayıtlarını taşıyor (SM-007507 v2, SM-007506 geri çekilmiş, SM-015452). Merkez deposu `db:reset`
  kuralıyla commit'lenirse silinir; prod merkezde yok.

## 6. Prod'a geçiş için kalanlar (değişmedi)

Migration `20261102130000_hub_sync` deploy ile prod'a; `HUB_SYNC_URL/SECRET` Railway'e elle; ilk koşu DB-yazma penceresinde
`--confirm-live` ile elle; cron bayrağı sonra. `--links` kararı (326 sürüm), 19 rol çelişkisi, 109 görünmeyen + 27 konu-dışı soru,
13 eksik mevzuat, soru-merkezi commit'i: [03-f1-adaptor.md](03-f1-adaptor.md) §6.
