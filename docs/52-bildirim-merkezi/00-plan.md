# Doc 52 — Bildirim Merkezi: çok kanallı bildirim motoru (push + kutu + e-posta)

Tarih: 26 Ekim 2026. Durum: **plan ONAYLI (26 Eki) · Figma tamam (26 Eki) · F1 bekliyor.**
Figma: "Paemisyon 2.0 — Nöbet" › sayfa **Bildirim Merkezi (Doc 52)**
(<https://www.figma.com/design/1YZRWO3azniW8NU5CvV1BZ?node-id=51-2>), beş section: Bileşenler · Admin (Light, 10 ekran)
· Mobil (Dark, 4 ekran) · Mobil (Light, 4 ekran) · Web (Dark, 2 sayfa + zil paneli). Ayrıntı §15.
Kaynak model: jsps `docs/notification-engine-plan.md` (23 Eyl 2026) ve sonraki yayın notları
(otomasyon geriye dönük gönderim yok, web push, AI metin önerisi, Brevo kanalı, soru bildirimi dönüşü).
Ürün anayasası: Doc 24 §7.6 bildirim disiplini, Doc 25 §B/D/E/F akışları, Doc 26 "Bildirim dili".

## 0. Karar özeti

| # | Karar | Kaynak |
|---|---|---|
| 1 | **Ürün modeli jsps ile aynı**: tek giriş noktası, kutu, karar akışı, kategori ve tercih listesi, segment DSL, şablon, kampanya, otomasyon, test cihazı, kill switch, ölçüm dürüstlüğü, 15 ürün sahibi kararı. | Kullanıcı, 26 Eki |
| 2 | **E-posta motora kanal olarak girer.** Bir bildirimin kanalları `push`, `inbox`, `email`; aynı karar akışı, aynı tercih, aynı geçmiş. Mevcut SES göndericisi ve kişi/rıza tabloları korunur, motorun e-posta kanalı olur. | Kullanıcı, 26 Eki |
| 3 | **Faz kesimi**: F1 çekirdek · F2 otomasyon seti ve aday tercihleri · F3 A/B, akıllı saat, AI metin önerisi. | Kullanıcı, 26 Eki |
| 4 | **Uygulama Paemisyon mimarisinde yeniden yazılır**: iş mantığı NestJS servislerinde (plpgsql değil), Prisma şeması, süreç içi `@Cron`, FCM tek adımlı teslim, Postgres kuyruğu `SKIP LOCKED`. Jsps kodu kopyalanmaz. | Claude, §3 gerekçeli |
| 5 | **Mobil kutu yüzeyi**: Bugün ekranı üst çubuğunda zil + okunmamış rozeti → `/bildirimler` yığın ekranı. Tercihler Ben › Ayarlar › Bildirimler'de (mevcut bölüm sunucuya bağlanır). Web: kabuk başlığında zil → `/bildirimler`; tercihler `/profil/bildirimler`. | Claude, §9 |
| 6 | **İki canlı derin bağlantı hatası motordan önce, ayrı küçük düzeltmeyle kapanır** (§1.3). | Claude |
| 7 | **Mobil yerel günlük hatırlatma sunucuya taşınır** (`daily_study_reminder` otomasyonu); jsps 25 Eyl kararıyla aynı. Yerel zamanlayıcı F2 mobil sürümünden sonra kaldırılır. | Claude |
| 8 | **Doc 24 frekans sönümü motora girer** (jsps'te yoktu): 7 gün dokunulmamış push → haftada 2; 30 gün → yalnız haftalık e-posta. Karar akışında kural 10a. | Claude, anayasa gereği |
| 9 | **Push ile premium teklifi yapılmaz** (Doc 26). `marketing` kategorisi push kanalında kapalıdır; yalnız e-posta (`kampanya` rızası). | Anayasa |
| 10 | Bildirim metinlerinde **emoji yok** (jsps 7e43549 kararı). Mevcut admin şablonlarındaki emojiler kalkar. Kullanıcı isterse tek satırla geri alınır. | Claude, jsps kararı |
| 11 | Rol eşlemesi: Paemisyon'da izin tablosu yok, iki rol var. **`editor` = hazırlar + test gönderir**, **`admin` = gönderir, otomasyon açar, kill switch**. Yeni izin tablosu açılmaz. | Claude |
| 12 | Varsayılan hatırlatma saati **19:00** (mevcut mobil varsayılan; jsps 20:00). Sessiz saat 23:00–08:00. Zaman dilimi tek: Europe/Istanbul (`profiles.timezone` eşdeğeri yok, alan açılır ama UI F3). | Claude |

Sıra: bu plan → onay → Figma (Bildirim Merkezi sayfası: admin 10 ekran, mobil kutu + tercih, web kutu + tercih)
→ F1 API + şema → F1 admin → F1 web/mobil olaylar → F2 → F3. Her faz gerçek veriyle ve E2E doğrulanır.

---

## 1. Bugünkü durum (26 Eki 2026, kod üzerinden)

### 1.1 Var olan

| Parça | Nerede | Not |
|---|---|---|
| Push sağlayıcı | `apps/api/src/modules/notifications/push.service.ts` (firebase-admin, proje paemisyon-29523) | iOS, Android ve **web aynı FCM kanalı**. `sendToUser`, `sendToAll(all / inactive-today)`, 500'lük parti, `{ad}` kişiselleştirme, geçersiz token silme. Env yoksa sessizce kapalı |
| Cihaz tablosu | `PushToken(token PK, userId, platform, updatedAt)` | Token cihaza ait, hesap değişince taşınır; çıkışta mobil siler, **web silmiyor** |
| Admin gönderim | `POST /admin/notifications/send` (yalnız admin), panel `(panel)/notifications` | İki hazır şablon, iki rota; audit `notification.send` |
| Sıralama dürtmesi | `leaderboard-nudge.service.ts`, cron 20:30 | "Seni geçti" dili; günde 1; `NUDGE_CRON=0` ile kapanır |
| Deneme bildirimleri | `exams.service.ts` cron'ları (`closeWindows` her dk, `sendReminders` 5 dk), `ExamReminder(examId,userId,kind)`, `Exam.remindEnabled` | 1 gün / 1 saat önce ve `result_ready`; yayınlarken `announce`; soru iptalinde "Netin güncellendi" |
| E-posta | `modules/email/` (SES v2, SNS olayları, kampanya işçisi 30 sn, `EmailContact`, `EmailTopicPreference(duyuru/kampanya)`, `EmailSend`, `EmailEvent`) | Doc 47. Kampanya düzeyi; işlemsel/kişisel e-posta yolu yok |
| Web | `lib/web-push.ts` (FCM web), `push-opt-in.tsx` (yalnız Bugün), `/bildirim?git=` sıçrama, `remind-button` | Tercih ekranı yok |
| Expo | `src/lib/push.ts` (izin, kayıt, `usePushNavigation`), `reminders.ts` (yerel, 19:00, cihazda tutulur), `deep-links.ts` (tek tablo) | Ayarlar › Bildirimler: hatırlatma anahtarı + saat çipleri + "Koç bildirimleri" |
| Günlük tanım | `common/gun.ts`: uygulama günü TR 04:00'te döner | Sayaçlar bu günü kullanır; saat türünden şeyler TR saat |
| Ayarlar / audit | `infra/settings/settings.service.ts` (`AppSetting`), `modules/admin/audit.service.ts` | Kill switch ve kapılar için hazır kalıp |

### 1.2 Yok olan

Kutu tablosu ve aday bildirim listesi, kullanıcı tercih modeli (kategori, saat, sessiz saat), frekans kapısı,
karar akışı, gönderim geçmişi (yalnız audit), şablon/segment/kampanya/otomasyon kayıtları, olay omurgası,
açılma ve dönüşüm ölçümü, test cihazı listesi, kill switch, ortam kapısı, sunucu tarafı günlük hatırlatma,
haftalık e-posta raporu (Doc 24 §7.7), deneme hatırlatma e-postası (Doc 50 §0 "push + e-posta" maddesi).

### 1.3 Motordan bağımsız düzeltmeler (bu hafta, tek küçük PR)

1. `apps/web/src/app/bildirim/page.tsx` yalnız `/` ile başlayan rotayı kabul ediyor; sunucu `daily-quiz`,
   `denemeler`, `leaderboard`, `deneme-sonuc/<id>` gönderiyor → web tıklaması hep `/bugun`. Sıçrama sayfası
   mobil sözlüğünü de çevirsin (`webRoute` genişler: `daily-quiz → /seans?mode=daily`, `denemeler → /denemeler`,
   `leaderboard → /liderlik`, `deneme-sonuc/<id> → /sonuc/<id>`).
2. `apps/app/src/lib/deep-links.ts` `deneme-sonuc/<id>` tanımıyor → "sonucun açıklandı" ana sekmeye düşüyor.
3. Web çıkışında FCM token silinmiyor (`DELETE /me/push-token` çağrısı eklenir).
4. Admin panelde leaderboard-nudge `dryRun` için düğme yok (endpoint var); motorla birlikte Otomatik
   Bildirimler ekranına taşınacağı için bu madde beklenebilir.

---

## 2. Hedef mimari

```
  Kaynaklar                         Motor (NestJS, Prisma)                         Teslim
  ─────────                         ─────────────────────                          ─────
  Admin: kampanya ─┐                NotificationTemplate / Segment / Campaign
  Admin: şablon    ├──────▶         (Variant F3)                             ┌─▶ push: PushToken → FCM (iOS/Android/web)
  Admin: segment  ─┘                        │                                │
                                            ▼                                ├─▶ inbox: Notification satırı (kutu)
  @Cron (dk / 15 dk / saat / gece) ─▶ AutomationEvaluator                    │
  AppEvent (servisler yazar)  ─────▶ (schedule | event)                      └─▶ email: SES (EmailSend'e bağlı)
                                            │
                                   DecisionService (§6)
                                   tercih · rıza · öncelik · sessiz saat ·
                                   kapı · sönüm · cooldown · dedupe
                                            │
                                   Notification (kutu, tek giriş noktası)
                                            │
                                   NotificationDelivery (kanal × cihaz kuyruğu, SKIP LOCKED)
                                            ▲
                                   DeliveryWorker @Cron('*/30 * * * * *')  (e-posta işçisiyle aynı kalıp)
                                            │
                                   NotificationEvent (opened / clicked / read / converted)
                                            │
                                   NotificationDailyStat (gece rollup) → admin analiz
```

İlkeler (jsps ile aynı, iki ek):

- **Tek giriş noktası.** Her bildirim `NotificationsService.enqueue(...)` ile doğar; `PushService.sendToUser/
  sendToAll` doğrudan çağrılmaz (private olur). Mevcut dört gönderici (admin formu, deneme cron'ları, sıralama
  dürtmesi, yayın duyurusu) F1'de motora bağlanır.
- **Kutu gerçek kaynaktır**; push ve e-posta kutu satırının kanallarıdır. `notificationId` her yükte.
- **Üreticiler motoru tanımaz.** Servisler `AppEvent` yazar; otomasyonlar tüketir.
- **Her karar iz bırakır.** Gönderilmeyen de `suppressed` + neden olarak yazılır.
- **Kanal politikası kategoride** (ek): her kategorinin izinli kanalları sabittir (§4.7); `marketing` push alamaz.
- **Pooler disiplini** (ek): işçi API süreciyle aynı havuzu paylaşır (Supabase pooler 15, lokalde `connection_limit=4`).
  Parti ≤ 200 teslim, kanal çağrıları sıralı, tek `running` kilidi (e-posta işçisi kalıbı).

---

## 3. Teknoloji kararları ve jsps'ten sapma gerekçeleri

| Konu | Jsps | Paemisyon | Neden |
|---|---|---|---|
| Çalışma zamanı | Kalıcı süreç yok; plpgsql RPC + trigger, pg_cron → pg_net → route handler | Railway'de kalıcı NestJS; `@nestjs/schedule` (10 cron zaten çalışıyor) | Dış tetik gerekmez; karar akışı TypeScript'te test edilir |
| Veri erişimi | supabase-js + RLS | Prisma; yetki guard'da (`RolesGuard`) | Proje kalıbı |
| Push | Expo Push: ticket → 15 dk sonra makbuz | FCM `sendEachForMulticast`: yanıt anında, `messaging/registration-token-not-registered` → token silinir | Makbuz adımı yok; işçi tek geçişli |
| Web push | Ayrı VAPID + `web-push` | FCM web zaten var | Tek kanal |
| E-posta | Sonradan Brevo, kendi yolu | Baştan kanal; SES + mevcut `EmailSend/EmailEvent` | Karar 2 |
| Kuyruk | `notification_deliveries` + `SKIP LOCKED` | Aynı; `$queryRaw` ile claim (e-posta işçisi `claim()` kalıbı) | Redis yok |
| Kitle tablosu | Saatlik plpgsql yenileme | Saatlik Nest cron, 500'lük kullanıcı dilimleri; artımlı: `lastActiveAt` değişenler | Pooler |
| Segment DSL | JSON → parametreli SQL | Aynı JSON → Prisma `where` (beyaz liste) + sayım için `$queryRaw` | Tek beyaz liste, iki derleyici değil; `where` üretimi testli |
| İzin | `notifications.manage/send` | `editor` / `admin` | Karar 11 |
| Gün | `profiles.timezone`, yerel gün | `gun.ts` 04:00 günü sayaçlar için; sessiz saat ve hatırlatma saati TR saat | Doc 48 D2 |
| Dönüşüm atfı | RPC içinden | İlgili servislerde (`quiz.service` seans bitişi, `exams.service` teslim) `attribute(userId, event)` | Aynı mantık, servis katmanında |

Ortam kapısı: `AppSetting notifications.environment` (`production` yalnız Railway prod'da yazılır) ile
`NOTIFICATIONS_ENV` eşleşmezse işçi **hiçbir şey göndermez** ve log'a düşer; `NOTIFICATIONS_PROVIDER=console`
lokalde FCM ve SES çağrılarını taklit eder. Production dışı ortam yalnız tester cihazlarına gönderir.

---

## 4. Prisma şeması (öneri; mevcut adlandırma: PascalCase model, `@@map` snake_case, `@db.Uuid`)

Migration: `20261027_notification_engine` (F1), `20261100_notification_automations` (F2), `..._smart` (F3).
Mevcut tablolara dokunulmaz, yalnız `PushToken` genişler. Doc 50/04 deploy notu geçerlidir: migration önce,
API sonra; yazma penceresinde yerel API kapalı.

### 4.1 Cihaz: `PushToken` genişler

```
+ id              String  @default(uuid)   (raporlama; PK token kalır)
+ deviceId        String?                  (expo-application installationId; aynı cihazda token yenilenince eski kapanır)
+ appVersion      String?
+ isActive        Boolean @default(true)
+ disabledReason  String?                  ('not_registered' | 'logout' | 'stale' | 'user_disabled')
+ lastSeenAt      DateTime @default(now()) (uygulama açılışında upsert dokunur)
+ lastErrorAt     DateTime?
```
`platform` string kalır (`ios | android | web`). 90 gün `lastSeenAt` yoksa gece işi `stale`; gönderim yalnız `isActive`.

### 4.2 Kitle: `NotificationAudience` (kullanıcı başına bir satır, saatlik)

```
userId PK, refreshedAt,
accountActive, registeredAt, registeredDays,
lastActiveAt, lastActiveDays,                 -- yeni: User.lastActiveAt (§4.9)
isPremium, premiumUntil,                      -- Entitlement
preferredModuleId, targetExamDate, examDaysLeft,
pushEnabled, pushPlatforms String[], emailSubscribed,
streakCurrent, streakBest,                    -- Streak
dailyGoalDoneToday, answeredToday, studySecondsToday,   -- DailyUsage (gün = gunAnahtari)
dailyQuestionDoneToday,                       -- QuizSession mode=daily bugün tamamlandı
answeredTotal, answered7d, answered30d, accuracy30d,
lastExamAt, lastExamNet, examCount, openExamSessionId,   -- QuizSession exam modu
weakTopicIds String[],                        -- UserTopicProgress (solved ≥ 3, accuracy < 0.7) ∪ son mastery
onboardingDone, planActive,                   -- StudyPlan
engagementTier Int,                           -- §6 sönüm: 0 normal · 1 haftada 2 · 2 yalnız e-posta
lastPushOpenedAt,
notificationsSentToday, marketingSentToday
```
Kaynaklar koç snapshot'ıyla (`coach/snapshot.service.ts`, `TopicMasterySnapshot`) çakışmaz; zayıf konu için
mevcut eşik kullanılır. `DailyFocus` ve `Streak.freeze*` okunmaz (koç kuralıdır, istemci/segment bilmez).

### 4.3 İçerik ve hedefleme

**`NotificationTemplate`**: `id, code @unique, name, category, title, body, imageUrl?, ctaLabel?,
deepLink Json ({target, params}), emailSubject?, emailBody? (markdown; `email-render.ts` ile HTML),
variables String[], defaultPriority, status (active|archived), createdById, updatedById, createdAt, updatedAt`.

**`NotificationSegment`**: `id, name, description?, rules Json, status, lastCount?, lastCountedAt?, createdById…`.

**`NotificationCampaign`**:
```
id, name, category, priority (low|normal|high|critical),
channels String[] (['push','inbox'] varsayılan; 'email' seçilebilir — kategori politikasına uyar),
audienceMode (all|segment|users|testers), segmentId?, segmentRulesSnapshot Json?, userIds String[] (≤500),
sendMode (now|scheduled|smart), scheduledAt?, smartWindowStart?, smartWindowEnd? (F3),
conversionEvent?, attributionWindowHours @default(24),
respectQuietHours @default(true), countTowardCaps @default(true), ttlHours @default(24),
createInAppBanner @default(false)  -- jsps karar 2 karşılığı: Bugün ekranında koç kartı olarak duyuru (F2)
status (draft|scheduled|sending|sent|paused|cancelled|failed),
estimatedRecipients, materializedRecipients, sentCount, failedCount, suppressedCount,
startedAt, completedAt, cancelledAt, cancelledById, cancelReason,
createdById, updatedById, createdAt, updatedAt
```
**`NotificationCampaignVariant`** (F1'de tek varyant; A/B F3): `id, campaignId, key, weight, title, body,
imageUrl, ctaLabel, deepLink, emailSubject, emailBody, templateId?`. Atama `md5(campaignId+userId)` ile deterministik.

### 4.4 Otomasyon (F2)

**`NotificationAutomation`**: `id, code @unique, name, category, priority, channels String[],
triggerType (schedule|event), schedule Json ({kind:'daily', at:'19:00'} | {kind:'user_time', field:'reminderTime'} |
{kind:'cron', expr}), eventType?, delayHours @default(0), conditions Json (DSL), templateId, deepLink Json,
conversionEvent?, attributionWindowHours, cooldownHours @default(48), maxPerUserPerDay @default(1),
respectQuietHours, countTowardCaps, status (draft|active|paused), lastRunAt?, nextRunAt?, createdById…`.

**`NotificationAutomationRun`**: `id, automationId, startedAt, finishedAt, triggerType, evaluated, matched,
queued, suppressed, error?`.
**`NotificationAutomationEvent`**: `(automationId, eventId) PK, processedAt` — jsps 25 Eyl kuralı: otomasyon
açılınca o ana kadar vadesi gelmiş olaylar işlenmiş sayılır; **geriye dönük gönderim yok**.

### 4.5 Olay omurgası: `AppEvent`

`id BigInt identity, eventType, userId, entityType?, entityId?, payload Json, occurredAt, processedAt?`.
Üreticiler servislerde (trigger yok): `quiz.service` (`session_completed`, `daily_question_completed`,
`daily_goal_completed`, `exam_submitted`, `exam_abandoned` yarım tur işinden), `users.service` (`user_registered`,
`onboarding_completed`), `billing` (`subscription_started/expired`), `admin-exams.service` (`exam_published`),
`reports` (`question_report_resolved`), `progress` (`badge_unlocked`), kitle yenilemesi (`user_inactive 3/5/7/30`,
`streak_at_risk`). Tablo ileride rozet ve koç için de kaynaktır.

### 4.6 Kutu, teslim, olay, özet

**`Notification`** (kutu):
```
id, userId, category, priority, title, body, imageUrl?, ctaLabel?,
route String? (mobil sözlüğü; §5), webPath String?, data Json,
channels String[], campaignId?, variantId?, automationId?, automationRunId?, templateId?,
dedupeKey String?  @@unique([userId, dedupeKey]),
conversionEvent?, attributionUntil?,
scheduledAt (erteleme ileri alır), expiresAt?,
readAt?, openedAt?, clickedAt?, convertedAt?, dismissedAt?,
deliveryStatus (queued|sent|failed|suppressed|no_device|expired), suppressionReason?,
createdAt
@@index([userId, createdAt]) @@index([userId, readAt])
```
Aday listesi: `scheduledAt <= now()` ve `expiresAt` dolmamış ve `deliveryStatus != suppressed` satırlar.

**`NotificationDelivery`** (kuyruk):
```
id BigInt, notificationId, userId, channel (push|email), target String? (token ya da e-posta; inbox kanalı kuyruğa girmez),
status (queued|sending|sent|failed|suppressed|expired), suppressionReason?,
attempts, nextAttemptAt, lockedAt?, lockedBy?,
providerMessageId?, errorCode?, errorMessage?, emailSendId? (EmailSend bağı),
queuedAt, sentAt?, failedAt?
@@unique([notificationId, channel, target]) @@index([status, nextAttemptAt])
```
**`NotificationEvent`**: `id BigInt, notificationId, userId, eventType (opened|clicked|read|converted|dismissed),
source (push|inbox|web|email), platform?, appVersion?, occurredAt, payload Json?`. E-posta `click` ve `delivery`
olayları SES webhook'undan `EmailSend → NotificationDelivery` bağıyla aktarılır.
**`NotificationDailyStat`**: `day, campaignId?, variantId?, automationId?, category, channel, platform?,
queued, sent, failed, suppressed, opened, clicked, converted` — gece 04:20 rollup; ekranlar bunu okur.

### 4.7 Kategoriler, kanal politikası, tercihler, rıza

Kategori listesi (tür = tercih anahtarı = analiz boyutu):

| Kategori | Push | Inbox | E-posta | Kapatılabilir | Not |
|---|---|---|---|---|---|
| `daily_question` | ✓ | ✓ | – | ✓ | Günün sorusu |
| `study_reminder` | ✓ | – | – | ✓ | Günlük hedef, pasiflik 3/5/7 |
| `streak` | ✓ | ✓ | – | ✓ | Seri riski |
| `exam` | ✓ | ✓ | ✓ | ✓ | Deneme yayın, hatırlatma, sonuç, net güncellemesi (Doc 50) |
| `exam_countdown` | ✓ | ✓ | – | ✓ | Hedef sınav tarihi (`User.targetExamDate`) ve resmî takvim (`ExamCalendar`) |
| `new_content` | ✓ | ✓ | ✓ | ✓ | Yeni soru/çıkmış sınav/mevzuat |
| `achievement` | – | ✓ | – | ✓ | Rozet (push yok; Doc 26 sade dil) |
| `statistics` | – | ✓ | ✓ | ✓ | Haftalık rapor (Doc 24 §7.7, e-posta birincil) |
| `leaderboard` | ✓ | ✓ | – | ✓ | Pozitif dil, günde 1 |
| `question_report` | ✓ | ✓ | – | – | Bildirdiğin soru çözüldü (hizmet) |
| `marketing` | **✗** | – | ✓ | ✓ (rıza) | Yalnız e-posta `kampanya` rızası; push yasak (Doc 26) |
| `system` | ✓ | ✓ | ✓ | **✗** | Bakım, güvenlik, hesap; `critical` yalnız burada |

**`UserNotificationSettings`**: `userId PK, categories Json ({"daily_question":true,…}; eksik = true; system kapatılamaz),
reminderTime String @default("19:00"), quietStart "23:00", quietEnd "08:00", timezone @default("Europe/Istanbul"),
pushEnabled @default(true) (kullanıcı düzeyinde ana anahtar), smartTimingEnabled @default(true) (F3), updatedAt`.

E-posta rızası **mevcut** `EmailContact.status` + `EmailTopicPreference`'ta kalır; motor oraya bakar. Konu eşlemesi:
`marketing → kampanya`; `exam, statistics, new_content, system → duyuru`. Karar: `EmailTopic`'e **`kisisel`** eklenmez;
`duyuru` "ürün bilgilendirmesi" tanımıyla kişisel raporu da kapsar, çıkış bağlantısı aynıdır. Kayıtlı her kullanıcı için
`EmailContact(source=live_user)` zaten açılıyor; yoksa motor açar (consentSource `signup`).

**`NotificationTester`**: `userId PK, addedById, createdAt` — e-postayla işaretlenir, aktif cihazları test listesine girer.
**`ExamCalendar`** (F2): `id, name ('PAEM 2027'), examTypeId?, examAt, applicationEndsAt?, certainty (tahmini|kesin),
status (draft|published|archived), countdownDays Int[] @default([60,30,14,7,3,1])`. Geri sayım yalnız `published + kesin`.
Kullanıcının kendi `targetExamDate`'i ayrıca `exam_countdown`'a girer (aday kendi tarihini girdi, kesin sayılır).

### 4.8 Mevcut tabloların kaderi

- `ExamReminder` **kalır**, anlamı daralır: adayın "bu denemeyi hatırlat" tercihidir (`Exam.remindEnabled` ile birlikte).
  Gönderimi motor yapar (`exam_reminder_day_before / hour_before` otomasyonları, dedupe `exam:<id>:<kind>`); `sentAt` kalkar,
  kutu satırı iz olur. `result_ready` ve "netin güncellendi" aynı yolla.
- Mobil `reminders.ts` tercihi (`enabled, hour`) F2 mobil sürümünde `UserNotificationSettings.reminderTime`'a taşınır
  (ilk açılışta cihazdaki değer sunucuya yazılır, sonra yerel zamanlayıcı kaldırılır).
- `leaderboard-nudge.service.ts` → `leaderboard_climb` otomasyonu, metin pozitif ("3 doğruyla bir basamak yükselebilirsin").
- Admin `(panel)/notifications` formu → Bildirim Merkezi › Yeni Bildirim; eski uç `POST /admin/notifications/send`
  kampanya oluşturup gönderen ince bir sarmalayıcıya döner, bir sürüm sonra kalkar.

### 4.9 Küçük değişiklikler

- `User.lastActiveAt` + `POST /me/touch` (saatte en çok bir, uygulama açılışı); `quiz.service` cevap yazarken günceller.
- `AppSetting` anahtarları: `notifications.killSwitch` (bool), `notifications.dailyCap` (3), `notifications.marketingDailyCap` (1),
  `notifications.environment`, `notifications.retention` (JSON). `SETTING_KEYS`'e eklenir, panel Ayarlar'da görünür.
- `SettingsService` kill switch'i 10 sn önbellekle okur (her teslimde sorgu yok).

---

## 5. Derin bağlantı kayıt defteri

Bugün üç kopya var: sunucu rota dizgeleri, `apps/app/src/lib/deep-links.ts`, `apps/web/src/lib/routes.ts`.
Hedef: **sunucuda tek kayıt defteri** `apps/api/src/modules/notifications/deep-links.ts`; her hedef iki çıktı üretir:
`route` (mobil sözlüğü, mevcut `routeToHref` değişmeden anlar) ve `webPath` (FCM `webpush.fcmOptions.link` doğrudan
bunu alır; `/bildirim?git=` sıçraması yalnız eski yükler için kalır).

| Hedef | Param | `route` (mobil) | `webPath` | minAppVersion |
|---|---|---|---|---|
| `daily_question` | – | `daily-quiz` | `/seans?mode=daily&source=notif` | 2.0 |
| `question` | id | `question:<id>` | `/seans?mode=practice&questionId=<id>` | 2.0 |
| `exams` | – | `denemeler` | `/denemeler` | 2.0 |
| `exam` | examId | `/denemeler/<id>` | `/denemeler/<id>` | 2.0 |
| `exam_result` | sessionId | `deneme-sonuc/<id>` | `/sonuc/<id>` | 2.0 (mobil düzeltmesi §1.3) |
| `leaderboard` | – | `leaderboard` | `/liderlik` | 2.0 |
| `review` | – | `/review` | `/seans?mode=review…` | 2.0 |
| `library` | – | `/catalog` | `/kutuphane` | 2.0 |
| `legislation` | legislationId | `/kanunlar/<id>` | `/kanunlar/<id>` | 2.1 (mobil eşleme eklenecek) |
| `past_exam` | slug | `/denemeler/cikmis` | `/paem-cikmis-sorular/<slug>` | 2.0 |
| `statistics` | – | `/performans` | `/performans` | 2.1 |
| `plan` | – | `/planim` | `/planim` | 2.1 |
| `badges` | – | `/ben/rozetler` | `/profil/rozetler` | 2.1 |
| `membership` | – | `/ben/uyelik` | `/profil` (web'de üyelik sayfası ayrı değil) | 2.0 |
| `notifications` | – | `/bildirimler` | `/bildirimler` | 2.1 |
| `settings_notifications` | – | `/ben/ayarlar#bildirimler` | `/profil/bildirimler` | 2.1 |

Yük sözleşmesi (`data`): `{ notificationId, target, params, route, minAppVersion }`. Mobil: `target` tanınmıyorsa ya da
`minAppVersion` büyükse `/bildirimler`'e düşer ve "güncelleme gerekli" satırı gösterir. Admin ekranında hedef seçimi
"Dokununca açılacak ekran ▼" + bağlama göre ikinci seçici (deneme listesi, soru arama, kanun listesi; jsps 84886cd kalıbı).
Vitest/Jest testi: kayıt defteri × `routeToHref` × `webRoute` üçlüsünün tutarlılığı.

---

## 6. Karar akışı (`DecisionService.decide`)

Girdi: `userId, category, priority, channels, automationCode?, dedupeKey?, countTowardCaps, respectQuietHours, ttlHours`.
Çıktı kanal başına: `send | defer(until) | drop(reason)`. Sıra kesindir, ilk eşleşen karar verir:

| # | Kontrol | Sonuç |
|---|---|---|
| 1 | Kill switch | drop `kill_switch` (kutu satırı da yazılmaz) |
| 2 | Ortam kapısı | drop `environment` |
| 3 | Hesap pasif / silinmiş | drop `account_inactive` |
| 4 | Dedupe `(userId, dedupeKey)` var | drop `duplicate` |
| 5 | `critical` (yalnız `system`; başka kategoride `high`'a iner) | **send** tüm kanallar, kalan kurallar atlanır |
| 6 | Kategori kanal politikası kanala izin vermiyor | o kanal drop `channel_policy` |
| 7 | Kategori tercihi kapalı | drop `category_disabled` |
| 8 | E-posta kanalı: `EmailContact` yok / abone değil / konu kapalı | e-posta drop `no_consent` |
| 9 | Otomasyon cooldown içinde | drop `cooldown` |
| 10 | Sessiz saat ve `respectQuietHours` | `high` → defer bitime; `normal/low` → defer, bitim `ttlHours` dışındaysa drop `quiet_hours_expired`; günlük kategoriler (`daily_question, streak, study_reminder`) ertesi güne ertelenmez → drop |
| 10a | **Sönüm (Doc 24):** `engagementTier=1` ve bu hafta 2 push gitti → push drop `decay_weekly`; `engagementTier=2` → push drop `decay_email_only` (inbox ve e-posta etkilenmez) |
| 11 | Günlük kapı (`notificationsSentToday ≥ dailyCap`) ve `countTowardCaps` | `high` → send; `normal` → defer ertesi güne (ttl izin veriyorsa) yoksa drop `daily_cap`; `low` → drop |
| 12 | Pazarlama günlük kapısı | drop `marketing_cap` |
| 13 | Push kanalı: aktif cihaz yok | push drop `no_device` (kutu yine yazılır) |
| 14 | Kalan | send |

Notlar: erteleme `Notification.scheduledAt`'i ileri alır (aday listesi bu satırı görmez). Kapı sayaçları `Notification`
üzerinden TR takvim gününde sayılır (kitle tablosunun saatlik gecikmesi kapıyı deldirmesin). Öncelik varsayılanları:
deneme `normal`, streak/günün sorusu/hatırlatma `low`, sınava 1 gün ve sistem duyurusu `high`, `critical` yalnız
bakım/güvenlik. Sönüm katmanı: `engagementTier` kitle yenilemesinde hesaplanır: son 7 günde hiç `opened/read` yok ve
≥ 5 push gitti → 1; son 30 günde yok → 2; herhangi bir açılma → 0'a döner.

---

## 7. Backend modülü (`apps/api/src/modules/notifications/`)

| Dosya | Sorumluluk |
|---|---|
| `notifications.module.ts` | `@Global` kalır; aşağıdaki servisleri sağlar |
| `schema/*.ts` | Zod: kampanya, varyant, şablon, segment DSL, otomasyon, tercih, deep link (admin + aday DTO'ları; proje `ZodValidationPipe` kalıbı) |
| `deep-links.ts` | Kayıt defteri (§5) |
| `template.ts` | `{{ad|öğrenci}}` çözümü; değişken beyaz listesi: `ad, streak, zayif_konu, sinava_kalan_gun, deneme_adi, hafta_soru, hafta_dogruluk, dun_dogruluk, kalan_soru_no`; başlık 40 / gövde 150 karakter uyarıları (Doc 26) |
| `segment-dsl.ts` | DSL doğrulama, Prisma `where` derleme (alan/operatör beyaz listesi, derinlik ≤ 3, kural ≤ 20), okunur özet |
| `decision.service.ts` | §6 |
| `notifications.service.ts` | `enqueue(...)`: kutu satırı + teslim satırları tek transaction; aday listesi, okundu, olay kaydı, tercih okuma/yazma |
| `audience.service.ts` | Saatlik yenileme (`@Cron('7 * * * *')`), tek kullanıcı anlık yenileme, segment sayımı/üyeleri |
| `campaigns.service.ts` | CRUD, tahmin, prova (10 örnek maskeli), test gönderim, durum geçişleri (ikinci onay: `confirmedRecipients` güncel tahminle eşleşmezse reddeder), parti açma (500'lük imleç) |
| `automations.service.ts` (F2) | Zamanlı değerlendirme (`@Cron('*/15 * * * *')`, kullanıcı saati penceresi), olay tüketimi, koşu kaydı; üst üste 3 hata → `paused` + admin'e `system` bildirimi |
| `delivery.worker.ts` | `@Cron('*/30 * * * * *')`: zamanı gelen kampanyaları açar, `claim(200)` SKIP LOCKED, push'u FCM'e (500'lük multicast içinde kanal başına), e-postayı `SesService.send`'e `EmailSend` satırıyla, sonuçları yazar; retry 1/5/30 dk, en çok 5; kalıcı hata retry etmez. Tek `running` kilidi; `lockedAt` 5 dk aşımı yeniden alınır |
| `push.service.ts` | FCM istemcisi olarak kalır; `sendToUser/sendToAll` kaldırılır, `sendMulticast(tokens, payload)` ve token temizliği kalır |
| `email-channel.ts` | Şablonun e-posta gövdesini `email-render.ts` ile HTML'e çevirir; `EmailSend` açar (kampanya dışı, `notificationDeliveryId` bağlı); çıkış/tercih bağlantısı aynı token |
| `events.service.ts` | `opened/clicked/read/converted/dismissed`; SES `click/delivery` olaylarını `EmailSend` → teslim → bildirim zinciriyle aktarır |
| `attribution.ts` | `attribute(userId, event)`: `attributionUntil > now` ve `conversionEvent` eşleşen son bildirime `convertedAt` (son dokunuş) |
| `rollup.service.ts` | Gece 04:20 `NotificationDailyStat`; 04:25 temizlik (§12); 04:30 `stale` cihazlar |
| `testers.service.ts` | Tester ekle/çıkar, aktif cihazları |

Her yazma `AuditService.log` ile iz bırakır (§10.2). Mevcut üreticiler F1'de şu çağrılara döner:
`exams.service` hatırlatma/sonuç/net → `enqueue({category:'exam', …, dedupeKey:'exam:<id>:<kind>'})`;
`admin-exams.service` yayın duyurusu → kampanya (`audienceMode:'all'`, kategori `exam`); `leaderboard-nudge` → F2'ye kadar
`enqueue` ile (kategori `leaderboard`, pozitif metin), F2'de otomasyona geçer.

---

## 8. Otomasyon seti (F2; hazır gelir, kapalı doğar, admin açar)

| Kod | Tetik | Koşul | İçerik | Kanal |
|---|---|---|---|---|
| `daily_question` | 09:00 TR | `dailyQuestionDoneToday=false`, push var | "Günün sorusu hazır" + dünkü doğru yüzdesi | push, inbox |
| `daily_study_reminder` | `reminderTime` (vars. 19:00) | `dailyGoalDoneToday=false` | "Bugünkü hedefin seni bekliyor" (Doc 26: eylem imalı, jenerik yasak) | push |
| `streak_at_risk` | `reminderTime+2s` | `streakCurrent ≥ 3 and dailyGoalDoneToday=false` | "Serin 23.00'te bozuluyor" (Doc 25 D) | push, inbox |
| `inactive_3 / 5 / 7` | günlük 19:00 | `lastActiveDays = 3/5/7` | üç ayrı metin, cooldown 48 s; 7. gün yumuşak dönüş (Doc 25 F) | push |
| `inactive_30_email` | Pazartesi 09:00 | `lastActiveDays ≥ 30`, e-posta abone | Haftalık rapor yerine kısa köprü e-postası | email |
| `exam_published` | olay | hedef modül eşleşir | soru sayısı, süre, tarih | push, inbox, email |
| `exam_reminder_day_before` / `hour_before` | olay `exam_reminder_due` (exams cron'u üretir) | `ExamReminder` var | Doc 50: "yarın 21.00" / "1 saat kaldı" | push, inbox, (day_before: email) |
| `exam_result_ready` | olay | katılan | "Sonucun açıklandı: net X" | push, inbox |
| `exam_net_updated` | olay (soru iptali) | katılan | "Netin güncellendi" | push, inbox |
| `exam_abandoned` | olay (yarım tur işi) | `openExamSessionId` | "42. sorudan devam" | push, inbox |
| `exam_countdown` | günlük 10:00 | `examDaysLeft ∈ countdownDays` | 60/30/14/7/3/1 ayrı metin; 1 gün `high` | push, inbox |
| `weekly_report` | Pazartesi 09:00 | `answered7d > 0`, e-posta abone | Doc 24 §7.7: mastery değişimi + haftanın çıkmış sorusu; inbox özeti | email, inbox |
| `question_report_resolved` | olay | bildiren | "Bildirdiğin soru düzeltildi / değişiklik gerekmedi" (jsps 22 Eki kalıbı) | push, inbox |
| `badge_unlocked` | olay | – | Rozet adı | inbox |
| `leaderboard_climb` | 20:30 | bugün oynamış, geçilmiş | pozitif dil, günde 1 | push |
| `new_past_exam` | olay (admin yayınlar) | – | "PAEM 2026 soruları eklendi" | push, inbox, email |

F3: `weak_topic` (son 30 soruda konu doğruluğu < %50), `personal_record` (`exam_submitted` yükü `net > önceki en iyi`),
`personalized_session` (otomasyon eylemi: koç reçetesiyle 10 soruluk seans; deep link `daily_question` değil `session:<id>`),
akıllı saat (`bestEngagementHour`: son 28 gün cevap saat histogramı; Doc 24 "ilk 3 gün giriş saatine sabitlenir" kuralı
yeni kullanıcıda ilk 3 günün saatini alır).

Kurallar: otomasyon açılınca geriye dönük gönderim yok; günün sorusu yalnız kendi gününün olayıyla; her koşu kaydedilir;
hata otomasyonu durdurmaz, 3 üst üste hata durdurur.

---

## 9. Aday yüzeyleri (Figma önce; Doc 49 Nöbet dili, token v3)

**Mobil (Expo, `apps/app`)**
- Bugün üst çubuğu: zil ikonu + okunmamış rozeti (`GET /me/notifications/unread-count`, odakta ve push gelince yenilenir).
- `/bildirimler` yığın ekranı: kategori ikonu, başlık, gövde, göreli zaman, görsel, CTA; dokununca `routeToHref(route)`
  ve `clicked` olayı; görünür olunca `read`; sola kaydır "kapat" (`dismissed`); "Tümünü okundu say". Boş durum sakin.
- Ben › Ayarlar › Bildirimler: mevcut bölüm sunucuya bağlanır: ana anahtar (izin durumu), kategori anahtarları
  (12 kategori, gruplu), hatırlatma saati çipleri (`reminderTime`), sessiz saat, e-posta tercihleri bağlantısı
  (mevcut `/eposta/abonelik/<token>` web sayfasına; mobilde yeniden yazılmaz).
- `usePushNavigation`: açılışta `opened` olayı (`POST /me/notifications/:id/events`), `minAppVersion` düşüşü.
- Push izni isteme yeri değişmez (ilk anlamlı an, Doc 49/08); izin kartı metni "Günde en fazla bir" vaadini söyler.

**Web (`apps/web`, Nöbet kabuğu)**
- Kabuk başlığında zil + rozet → `/bildirimler` (aynı liste, masaüstünde sağ panel olarak açılabilir).
- `/profil/bildirimler`: mobil tercihlerin aynısı; web push aç/kapat (mevcut `push-opt-in` buraya da gelir).
- Bugün ekranı `createInAppBanner` kampanyaları koç kartı olarak gösterir (F2; sunucu `/me/coach` kartı üretir).

**Erişilebilirlik ve tasarım kuralı**: liste satırı ≥ 44pt, rozet rengi token'dan, dark mode, Dynamic Type; bileşenler
mevcut galeriden (`ListRow`, `Card`, `Chip`, `SectionHeader`); yeni bileşen yalnız `NotificationRow` ve `UnreadBadge`,
ikisi de varyantlı ve galeriye eklenir.

---

## 10. API uçları

Admin (`/admin/notifications/*`; `JwtAuthGuard + RolesGuard`; `editor` okur/hazırlar, `admin` gönderir):

| Yöntem ve yol | Rol | İş |
|---|---|---|
| `GET overview` | editor | dashboard metrikleri (rollup) |
| `GET/POST campaigns`, `GET/PATCH/DELETE campaigns/:id` | editor | CRUD (yalnız draft/scheduled düzenlenir) |
| `POST campaigns/:id/estimate` | editor | kitle tahmini |
| `POST campaigns/:id/preview` | editor | prova: tahmin, 10 örnek (maskeli), çözülmüş metin, uyarılar |
| `POST campaigns/:id/test` | editor | yalnız tester cihazlarına / tester e-postalarına |
| `POST campaigns/:id/status` (`schedule / send_now / pause / resume / cancel`) | **admin** | `confirmedRecipients` zorunlu |
| `GET campaigns/:id/analytics` | editor | varyant sayaçları + günlük seri |
| `GET/POST templates`, `:id`, `POST templates/:id/render` | editor | CRUD + önizleme |
| `GET/POST segments`, `:id`, `POST segments/estimate` | editor | CRUD + anlık sayım |
| `GET/POST automations`, `:id`, `POST automations/:id/status`, `GET automations/:id/runs`, `POST automations/:id/preview` | editor / **admin** (status) | F2 |
| `GET history`, `GET history/export` (F3 CSV) | editor | teslim geçmişi; e-posta maskeli, token maskeli |
| `GET devices` | editor | platform dağılımı, pasifleşenler |
| `GET/POST testers`, `DELETE testers/:userId` | admin | |
| `GET/POST exam-calendar`, `:id` | editor | F2 |
| `POST kill-switch` | admin | `AppSetting` + audit |
| `GET link-options?target=` | editor | deneme/soru/kanun seçici verisi |
| `POST suggest` (F3) | editor | Claude metin önerisi, makine doğrulaması (karakter, yasaklı kelime, emoji) |

Aday (`/me/notifications/*`, `JwtAuthGuard`):
`GET /me/notifications?cursor=` · `GET /me/notifications/unread-count` · `POST /me/notifications/:id/read` ·
`POST /me/notifications/read-all` · `POST /me/notifications/:id/events` (`opened|clicked|dismissed`) ·
`GET/PATCH /me/notifications/settings` · `POST /me/touch`. Mevcut `POST/DELETE /me/push-token` kalır, gövdeye
`deviceId, appVersion` eklenir. İşlemsel: dönüşüm olayını istemci değil sunucu üretir (§7 `attribution.ts`).

---

## 11. Güvenlik, audit, ölçüm dürüstlüğü, saklama

- **Audit eylemleri**: `notification.campaign.create/update/schedule/send/pause/cancel`, `notification.test_send`,
  `notification.automation.activate/pause/update`, `notification.template.update`, `notification.segment.update`,
  `notification.kill_switch`, `notification.tester.add/remove`, `exam_calendar.update`. `detail`: segment özeti,
  tahmini/gerçek alıcı, zamanlama. Gönderim kararı kampanyada `sentById/sentAt`.
- **Veri güvenliği**: token ve e-posta admin ekranında maskeli; DSL ham SQL almaz; şablon değişkenleri beyaz liste,
  `displayName` kaçışlanır; `critical` yalnız `system` ve yalnız `admin`; ikinci onayda alıcı sayısı.
- **Ölçüm**: `sent` = FCM kabul etti (cihaz ekranı değil; ekranda "FCM'e teslim"); e-postada SES `delivery` gerçek
  teslimdir ve ayrı gösterilir; `opened` yalnız dokunma; `dismissed` push için ölçülmez (yalnız kutu "kapat");
  `converted` son dokunuş atfı, 24 s. Open Rate = opened/sent, CTR = clicked/sent, Conversion = converted/sent.
- **Saklama** (gece temizliği): kutu 180 gün · teslim ham 90 gün sonra yalnız özet · olaylar 180 gün · `AppEvent`
  işlenmiş 30 gün · koşular 90 gün · pasif cihaz 180 gün · `NotificationDailyStat` süresiz · audit 2 yıl (ayrı karar).
  Süreler `notifications.retention` ayarında.
- **KVKK**: hesap silinince cascade; pazarlama yalnız e-posta ve yalnız `kampanya` rızasıyla; rıza değişimi `AppEvent`'e;
  gizlilik metnine F3'te "akıllı saat için toplulaştırılmış saatlik sayılar, 90 gün, kapatılabilir" eklenir.

---

## 12. Admin UI — Bildirim Merkezi (`apps/admin`, `(panel)/notifications/*`)

Menü: "Bildirim Gönder" → **"Bildirim Merkezi"** (editor + admin). Tasarım: Figma'da admin sayfası önce; mevcut
`ui.tsx` (PageHeader, Card, StatusBadge) yetmez, Doc 50/03 admin sihirbazındaki bileşen seti (stepper, DataTable,
slide-over, ConfirmDialog, StatCard) genişletilir ve yeniden kullanılır.

| Sayfa | İçerik |
|---|---|
| Genel Bakış | 7 StatCard (bugün gönderilen, FCM/SES teslim, açılma, CTR, dönüşüm, aktif otomasyon, planlı kampanya), 30 gün seri, en iyi 5, bastırma nedenleri, kill switch şeridi |
| Yeni Bildirim | Üç sütun: içerik (kategori → kanal kutuları politikaya göre, şablon, başlık, gövde, görsel, CTA, hedef seçici + bağlamsal seçici, değişken chip'leri, karakter sayacı; e-posta seçiliyse konu + markdown gövde) · hedefleme (Herkes / Segment / Kural kurucu AND-OR / Testerlar; canlı "Tahmini kitle: 1.842, örnek 10") · telefon + e-posta önizlemesi. Alt çubuk: Şimdi / Zamanla / Akıllı (F3), öncelik, dönüşüm olayı, "Sessiz saatlere uy", Taslak / Prova / Test gönder / Gönder (admin; onay penceresi alıcı sayısıyla) |
| Kampanyalar | tablo + slide-over detay (kanal kırılımı, seri, duraklat/iptal) |
| Otomatik Bildirimler (F2) | kart ızgarası: tetik, koşul özeti, son koşu, 7 gün, aç/kapat (admin); koşu geçmişi; prova |
| Segmentler | tablo + kural kurucu; "Bu segmente bildirim oluştur" |
| Şablonlar | kategori sekmeleri; kart önizleme (push ve e-posta); arşivle |
| Planlanmış | liste; iptal |
| Gönderim Geçmişi | teslim satırları: kullanıcı (maskeli), kaynak, kanal, platform, durum, neden, zaman; filtreler; CSV F3 |
| Analizler | 7/30/90 gün; kategori, kanal, saat, platform, segment; varyant karşılaştırma (F3) |
| Ayarlar | kapılar, sessiz saat varsayılanı, saklama, testerlar, sınav takvimi (F2), ortam, kill switch |

---

## 13. Faz planı ve doğrulama

### F0 — Hazırlık (1 gün)
§1.3 düzeltmeleri ayrı PR. Figma "Paemisyon 2.0 — Nöbet" › yeni sayfa **Bildirim Merkezi**: admin 10 ekran (light),
mobil kutu + tercihler (dark/light), web kutu + tercihler. Onay.

### F1 — Çekirdek (tahmini 6 çalışma günü)
1. Şema: §4.1, 4.2, 4.3 (varyant tek), 4.6, 4.7 (`UserNotificationSettings`, `NotificationTester`), 4.9. Migration + seed
   (kategori sabitleri kodda, şablon başlangıç seti seed'de).
2. Servisler: decision, notifications (enqueue, liste, olay), audience, campaigns, delivery worker, push (multicast),
   email-channel, events, attribution, rollup, testers. Mevcut dört gönderici motora bağlanır.
3. Admin: Genel Bakış, Yeni Bildirim (önizleme + prova + test), Kampanyalar, Segmentler, Şablonlar, Planlanmış, Geçmiş,
   temel Analizler, Ayarlar (kill switch, testerlar).
4. Aday: web `/bildirimler` + zil + `/profil/bildirimler`; mobil zil + `/bildirimler` + Ayarlar bölümü sunucuya bağlı
   (tercihler), `opened/clicked` olayları. Mobil yerel hatırlatma bu fazda kalır.
5. Testler: Jest (DSL derleme, şablon, karar akışı tablosu §6 satır satır, deep link üçlüsü, FCM hata sınıflandırma,
   sönüm), API e2e (kampanya oluştur → prova → test → gönder → geçmiş), Playwright admin akışı, Expo simülatörde zil ve
   kutu, gerçek cihazda FCM tıklama → `opened`.
6. Belgeler: `docs/52-bildirim-merkezi/01-f1-*.md`, CLAUDE.md'ye "bildirim yalnız `enqueue` ile gider" kuralı.

Kapsam dışı: A/B, akıllı saat, otomasyonlar, AI öneri, CSV.

### F2 — Otomasyon ve tercihler (5 gün)
`AppEvent` + üreticiler, `NotificationAutomation*`, değerlendirici, §8 seti (kapalı), `ExamCalendar`, Otomatik Bildirimler
ekranı, Bugün'de kampanya kartı, mobil yerel hatırlatmanın sunucuya taşınması ve kaldırılması (mobil sürüm), haftalık
e-posta raporu şablonu, `ExamReminder` daralması, sıralama dürtmesinin otomasyona geçişi.

### F3 — Kişiselleştirme (5 gün)
A/B varyant UI + analiz, akıllı saat (`bestEngagementHour`, `smart` modu, gizlilik metni), zayıf konu / kişisel rekor /
kişiselleştirilmiş seans otomasyonları, AI metin önerisi (Claude; insan onayı zorunlu; emoji ve yasaklı kelime denetimi),
CSV, gelişmiş analiz.

### Yayın sırası ve geri alma (her faz)
Yedek → migration (yerel API kapalı, `connection_limit=1`) → Railway API → admin → web → mobil (TestFlight, sonra mağaza).
Eski trigger yok, bu yüzden "çift gönderim" riski jsps'teki gibi değildir; tek risk mevcut cron'ların motora geçişi: F1'de
`exams.service` ve `leaderboard-nudge` aynı deploy'da `enqueue`'ya döner, dedupe anahtarı aynı gün ikinci gönderimi engeller.
Geri alma: `NOTIFICATIONS_WORKER=0` işçiyi durdurur; kill switch anında keser; migration geri alma betiği `apps/api/scripts/`.

---

## 14. Açık noktalar (uygulama sırasında varsayım yapıldı, ürün sahibi düzeltebilir)

1. Günlük kapı dolunca `high` kapıyı aşar (jsps varsayımı korundu).
2. Varsayılan hatırlatma 19:00, sessiz saat 23:00–08:00 (karar 12).
3. E-posta konu eşlemesi: kişisel rapor `duyuru` altında; ayrı `kisisel` konusu açılmadı (§4.7).
4. Kategori listesi 12 (jsps 11 + `question_report`; `marketing` push kapalı).
5. Mobil kutu zili Bugün üst çubuğunda; sekme eklenmedi (dört sekme kuralı, Doc 49/07).
6. Emoji yasağı (karar 10) mevcut iki admin şablonunu değiştirir.

---

## 15. Figma durumu (26 Eki 2026)

Sayfa `Bildirim Merkezi (Doc 52)`; mevcut Nöbet token'ları (Nöbet / Color, Spacing, Radius), Nöbet metin stilleri ve
kütüphanedeki `Button`, `Badge`, `TabBar / Sekmeler` bileşenleri kullanıldı. Renkler ve dolgular değişkene bağlı; section'lar
açık/koyu modu `setExplicitVariableModeForCollection` ile taşır.

| Section | Ekranlar | Not |
|---|---|---|
| Bileşenler | `Admin / Sidebar` (Bildirim Merkezi aktif, sayaç), `Admin / AltSekme` (Aktif·Pasif, Label), `Admin / StatCard` (Label·Value·Delta), `BildirimSatırı` (Okunmamış·Okundu; Title·Body·Time) | Dört yeni yerel bileşen; satır mobilde 353, web'de FILL |
| Admin (Light) | Genel Bakış · Yeni Bildirim · Kampanyalar · Otomatik Bildirimler · Segmentler · Şablonlar · Planlanmış · Gönderim Geçmişi · Analizler · Ayarlar (1440) | §12 tablosuyla birebir; kampanya detayı slide-over yerine tam genişlik gösterildi |
| Mobil (Dark/Light) | Bugün üst çubuk zil (rozet 3) · Bildirimler kutu (gün grupları, "güncelleme gerekli" satırı) · Boş durum · Ayarlar › Bildirimler (ana anahtar, saat çipleri, sessiz saat, 10 kategori + sistem, e-posta bağlantısı) | Karar 5: zil Bugün üst çubuğunda, beşinci sekme yok |
| Web (Dark) | `/bildirimler` (liste + tercih özeti raylı) · `/profil/bildirimler` (push, saat, kategoriler iki sütun, e-posta rızaları) · zil açılır paneli (400) | Nöbet kabuğu (TopNav) Denemeler V2 web ekranındaki yapıyla aynı |

Uygulama sırasında Figma'ya sadık kalınacak noktalar: satır ikonu kategoriye göre değişir (Figma'da tek zil ikonu; kodda
kategori → ikon eşlemesi), kill switch kartı yalnız admin rolünde görünür, Analizler'deki A/B kartı F3'e kadar pasif metin.
