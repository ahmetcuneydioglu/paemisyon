# Doc 52 / 01 — F1 çekirdek: şema ve servisler (26 Eki 2026)

Durum: **API katmanı yazıldı, geçici Postgres'te uçtan uca doğrulandı; prod migration ve deploy bekliyor.**
Admin ekranları, web ve mobil kutu/tercih yüzeyleri F1'in kalan parçaları (sıradaki adım).

## Yazılanlar

### Şema (`prisma/migrations/20261027150000_notification_engine`)
Ekleyici migration: 11 tablo, 12 enum, `users.last_active_at`, `push_tokens` genişletmesi
(`device_id, app_version, is_active, disabled_reason, last_seen_at, last_error_at`; mevcut satırlar aktif kalır).
Tablolar: `notifications` (kutu), `notification_deliveries` (kanal × cihaz kuyruğu), `notification_events`,
`notification_daily_stats`, `notification_audience`, `user_notification_settings`, `notification_testers`,
`notification_templates`, `notification_segments`, `notification_campaigns`, `notification_campaign_variants`.
Otomasyon tabloları F2'de. Migration SQL `prisma migrate diff` ile şemadan üretildi ve sıfır veritabanına
tüm geçmişle birlikte uygulanıp doğrulandı.

### Modül `apps/api/src/modules/notifications/`
| Dosya | Sorumluluk |
|---|---|
| `notification.categories.ts` | 12 kategori, kanal politikası (marketing push alamaz; system ve question_report kapatılamaz), e-posta konusu eşlemesi |
| `deep-links.ts` | Tek kayıt defteri: hedef → `route` (mobil sözlüğü) + `webPath` + `minAppVersion`; eski rota dizgesi çevirici |
| `template.ts` | `{{ad}}`, `{{ad|Aday}}`, eski `{ad}`; değişken beyaz listesi; uyarılar (40/150 karakter, emoji, jenerik ifade) |
| `segment-dsl.ts` | Beyaz listeli JSON DSL → Prisma `where`; derinlik ≤ 3, kural ≤ 20; okunur özet |
| `decision.logic.ts` | Saf karar akışı (§6, 14 kural + Doc 24 sönümü); TR sessiz saat hesabı |
| `decision.service.ts` | Bağlam: kill switch, ortam kapısı, tercih, rıza, cihaz, TR günü sayaçları, sönüm katmanı |
| `notifications.service.ts` | **`enqueue` tek giriş noktası**; kutu listesi/okundu/olaylar; tercihler; dönüşüm atfı; `touchLastActive` |
| `audience.service.ts` | Saat başı tek set-tabanlı SQL ile kitle tablosu (`@Cron('7 * * * *')`), kullanıcı başına yenileme |
| `campaigns.service.ts` | CRUD, tahmin, prova (10 maskeli örnek), test gönderimi (testerlara, sayaçlara girmez), durum geçişleri (ikinci onay alıcı sayısıyla), parti parti açma, `quickSend` |
| `delivery.worker.ts` | 30 sn'de bir: kampanya açma, `SKIP LOCKED` çekme (200), FCM/SES, retry 1/5/30/60/120 dk, ttl süresi dolanlar, kampanya kapanışı |
| `push.service.ts` | FCM istemcisi; `sendBatch` (500'lük `sendEach`), geçersiz token pasifleştirme, `registerToken(deviceId, appVersion)`. `sendToUser/sendToAll` kaldırıldı |
| `email-channel.service.ts` | SES ile kanal; rıza `EmailContact/EmailTopicPreference`; hizmet → `islem`, pazarlama → `duyuru` seti; kişi yoksa açılır |
| `rollup.service.ts` | 04.20 günlük özet, 04.25 saklama temizliği (kutu 180, teslim 90, olay 180, pasif cihaz 180, 90 gün görünmeyen token `stale`) |
| `testers.service.ts` | E-postayla tester; cihazları otomatik |
| `notifications-admin.controller.ts` | `/admin/notifications/*`: overview, campaigns (+estimate/preview/test/status/analytics), templates, segments (+estimate), history, devices, testers, settings, kill-switch, link-options, worker/tick, audience/refresh, eski `send`, `leaderboard-nudge` |
| `notifications-me.controller.ts` | `/me/notifications` liste, `unread-count`, `settings` (GET/PATCH), `read-all`, `:id/read`, `:id/events` |
| `dto/notifications.dto.ts` | class-validator DTO'ları (ValidationPipe whitelist) |

Diğer değişiklikler: `SettingsService` yeni anahtarlar (`notifications.kill_switch, daily_cap, marketing_daily_cap,
decay_weekly_cap, environment, retention`) ve `getString/getInt/entries`; `EmailModule` `EmailContactsService` dışa
açar; `POST /me/push-token` `deviceId/appVersion` alır; `POST /me/touch` eklendi; admin `notifications/send` ve
`leaderboard-nudge` uçları yeni controller'a taşındı (yollar aynı kaldı).

### Mevcut üreticiler motora bağlandı
- `exams.service` `closeWindows` → `enqueue(exam, exam_result, dedupe exam:<id>:result_ready, conversion exam_review)`;
  `sendReminders` → day_before (push+kutu+e-posta) / hour_before (high, ttl 1 sa, sessiz saati dinlemez).
- `admin-exams.service` yayın duyurusu → `campaigns.quickSend` (kampanya + send_now; audit kampanyada).
- `admin-exam-adjustments` "Netin güncellendi" → `enqueue`.
- `leaderboard-nudge` → `enqueue(leaderboard, low, günde 1)`; metin pozitif ("bir basamak önüne geçti"), emoji kaldırıldı.
- Admin "Bildirim Gönder" formu → kampanya (`all` ya da `answeredToday = 0` segmenti).

## Doğrulama
- Birim: `npx jest src/modules/notifications` — karar akışı (12), segment DSL (4), şablon + derin bağlantı (5).
  Tüm paket: 53 suite / 529 test yeşil. `tsc` ve eslint temiz.
- Uçtan uca: `scripts/notifications/f1-smoke.ts` geçici Docker Postgres'te (prod'a dokunmaz):
  ```bash
  docker run -d --name paem-pg-doc52 -e POSTGRES_PASSWORD=doc52 -e POSTGRES_DB=paemisyon -p 55433:5432 postgres:17
  cd apps/api && DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon DIRECT_URL=$DATABASE_URL npx prisma migrate deploy
  DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon DIRECT_URL=$DATABASE_URL \
    NOTIFICATIONS_PROVIDER=console NOTIFICATIONS_WORKER=0 EMAIL_WORKER=0 NUDGE_CRON=0 \
    npx ts-node -r tsconfig-paths/register scripts/notifications/f1-smoke.ts
  ```
  25 kontrol geçti: enqueue/şablon/deep link, dedupe, sessiz saat ertelemesi, kategori kapalı, cihazsız (yalnız kutu),
  emoji reddi, kitle yenileme, segment tahmini, prova, test gönderimi, ikinci onay, kampanya açma + işçi tick + kapanış,
  kutu/okundu/olay, tercih (system kapatılamaz), kill switch, rollup, temizlik.

## Ortam değişkenleri (Railway)
`NOTIFICATIONS_ENV=production` (AppSetting `notifications.environment` ile eşleşmeli; ikisi de boşsa kapı yok),
`NOTIFICATIONS_WORKER` (0 = işçi ve kitle yenilemesi kapalı), `NOTIFICATIONS_PROVIDER=console` (yalnız lokal).
FCM ve SES mevcut değişkenlerle çalışır.

## Prod'a alma sırası (Doc 50/04 kalıbı)
1. Yedek. 2. Yerel API kapalıyken `prisma migrate deploy` (ekleyici; eski trigger yok, çift gönderim riski yok).
3. API deploy (Railway; `NOTIFICATIONS_ENV=production`). İlk saatte kitle tablosu dolar (`POST /admin/notifications/audience/refresh` ile hemen).
4. Panelde kill switch kapalı, Ayarlar › Testerlar'a en az bir kişi. 5. Deneme hatırlatma/sonuç cron'ları aynı deploy'da motora geçtiği için
   `exam:<id>:<kind>` dedupe anahtarı aynı gün ikinci gönderimi engeller.

## Bilinen sınırlar (F1)
- Otomasyonlar, `AppEvent`, `ExamCalendar`, A/B, akıllı saat yok (F2/F3).
- E-posta kanalında SES teslim/tık olayları `EmailSend` kaydına bağlı değil (motor postası kampanya dışı); `sent` SES yanıtından.
- `inactive-today` eski formu `answeredToday = 0` segmentine çevrilir (kitle tablosu ≤ 1 sa gecikmeli).
- Admin paneli, web ve mobil yüzeyleri henüz yazılmadı; uçlar hazır.
