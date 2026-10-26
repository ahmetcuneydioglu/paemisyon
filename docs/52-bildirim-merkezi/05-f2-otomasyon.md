# Doc 52 / 05 — F2: olay omurgası, otomasyonlar, sınav takvimi, duyuru kartı (26 Eki 2026)

Durum: **yazıldı, Docker Postgres'te uçtan uca duman testinden geçti (22 kontrol), admin ekranı canlı doğrulandı.**
Prod'a çıkış: migration `20261027230000_notification_automations` (eklemeli; 5 tablo, 2 tip) `prisma migrate deploy` ile,
sonra Railway deploy. Hazır set kapalı doğar; dört preset F1 davranışı kesilmesin diye **açık** doğar (aşağıda).

## Mimari (Doc 52 §2, §4.4, §4.5)
- **`AppEvent`** (`app_events`): üreticiler motoru tanımaz, `AppEventsService.emit` ile olay yazar (asla fırlatmaz).
  Üreticiler: `quiz.service` (`session_completed`, `daily_question_completed`, `daily_goal_completed`, `exam_submitted`,
  `badge_unlocked`), `exams.service` cron'ları (`exam_reminder_due` {kind}, `exam_result_ready`), `admin-exam-adjustments`
  (`exam_net_updated`), `admin-exams.publish` (`exam_published`), `admin-past-exams.engineLink` (`past_exam_published`),
  `reports.setStatus` (`question_report_resolved`), `users.completeOnboarding` (`onboarding_completed`),
  `leaderboard-nudge` (`leaderboard_overtaken` {rival, need}).
- **`NotificationAutomation`**: preset seti `automation.presets.ts`'ten tohumlanır (`onModuleInit`, eksik satır eklenir,
  panelde düzenlenen satıra dokunulmaz). Satır metni, kanalları, takvimi, koşulu (segment DSL), cooldown/ttl/kapı
  bayraklarını taşır; `when` (olay yükü süzgeci) ve `dedupe` (tekil anahtar) kod içindedir.
- **Değerlendirici** (`automations.service.ts`, `@Cron('* * * * *')`, tek `running` kilidi):
  1. Atıf: `processedAt` boş olaylar → `NotificationsService.attribute(userId, eventType)`; damgalanır.
  2. Zamanlı: `scheduleDue` (daily/weekly: TR anı + 90 dk telafi penceresi, aynı an için tek koşu; `user_time`: dakikada
     bir, hedef saat = şimdi − ofset; tercih satırı olmayanlar 19:00'da). Kitle parti parti (250), cooldown tek sorgu,
     dedupe `<code>:<TR günü>`.
  3. Olaylı: `occurredAt ≥ activatedAt` (açılış öncesi olaylar işlenmiş sayılır — geriye dönük gönderim yok),
     `occurredAt ≤ now − delay`, `(automation, event)` daha önce yoksa; `when` süzgeci → koşul (kitle satırı) → cooldown →
     `enqueue`. `broadcast` presetlerde (deneme/çıkmış sınav yayını) olay bir kişiye değil koşulu sağlayan bütün kitleye açılır.
  4. Her koşu `NotificationAutomationRun`; üç üst üste hata otomasyonu duraklatır (`lastError`).
- **Derin bağlantı**: preset `deepLink.params` `$payload.<alan>` ile olay yükünden çözülür (`resolveAutomationLink`);
  parametre eksikse gönderim yapılmaz (`no_link`).
- **Değişkenler** (`automationVars`): kitle satırı (`streak`, `sinava_kalan_gun`, `hafta_soru`, `hafta_dogruluk`, `kalan_soru`)
  + olay yükü (`deneme_adi`, `net`, `onceki_net`, `saat`, `soru_sayisi`, `sure`, `rakip`, `gerekli_dogru`, `rozet`, `sonuc`,
  `sinav_adi`, `link`). Beyaz liste `template.ts`.
- **Sınav takvimi** (`exam_calendar`): kullanıcının hedef tarihi yoksa modülünün (ya da genel kaydın) en yakın
  aktif + kesin tarihi kitle `exam_days_left`'e düşer (`audience.service` LATERAL). `exam_countdown` bunu sayar.
- **Duyuru kartı** (`createInAppBanner`): `/me/coach` kutudaki okunmamış duyuruyu `announcement` kartı olarak hero'dan sonra
  verir; web `CoachCard` (`meta.webPath`), Expo Bugün "DUYURU" kartı (dokununca `clicked`). Okununca/kapatılınca düşer.
- **Saklama**: `app_events` gece temizliğinde `retention.events` günüyle silinir (otomasyon izi cascade).

## Preset seti (Doc 52 §8) ve doğuş durumu
| Kod | Tetik | Doğuş | Not |
|---|---|---|---|
| daily_question | her gün 09:00 | kapalı | günün sorusu çözülmemiş + push |
| daily_study_reminder | kullanıcı saati | kapalı | hedef dolmamış; `{{kalan_soru}}` |
| streak_at_risk | kullanıcı saati +120 dk | kapalı | seri ≥ 3 |
| inactive_3 / 5 / 7 | her gün 19:00 | kapalı | `lastActiveDays = N`, cooldown 48 sa |
| inactive_30_email | Pzt 09:00 | kapalı | yalnız e-posta |
| exam_published | olay, broadcast | kapalı | yayın ekranındaki "duyur" kutusuyla aynı anda kullanılmaz (çift gönderim) |
| exam_reminder_day_before / hour_before | olay `exam_reminder_due` | **açık** | F1 cron'un yerine geçti |
| exam_result_ready | olay | **açık** | F1 cron'un yerine geçti |
| exam_net_updated | olay | **açık** | soru iptali yeniden puanlama |
| exam_abandoned | olay +30 dk | kapalı | üretici henüz yok (yarım tur işi olay yazmıyor) |
| exam_countdown | her gün 10:00 | kapalı | `examDaysLeft ∈ {60,30,14,7,3,1}` |
| weekly_report | Pzt 09:00 | kapalı | e-posta + kutu; mastery değişimi F3 |
| question_report_resolved | olay | kapalı | `{{sonuc}}` metni üreticiden |
| badge_unlocked | olay | kapalı | yalnız kutu |
| leaderboard_climb | olay `leaderboard_overtaken` | **açık** | 20.30 cron olay yazar; metin panelden |
| new_past_exam | olay, broadcast | kapalı | çıkmış sınav motora bağlanınca |

## API (`/admin/notifications/*`)
`GET automations` · `GET automations/:id` (koşular dahil) · `PATCH automations/:id` (editor) · `POST automations/:id/status`
(admin; `active`/`paused`) · `GET automations/:id/runs` · `POST automations/:id/preview` · `POST automations/:id/run`
(admin; `{dryRun}`) · `GET/POST exam-calendar`, `PATCH/DELETE exam-calendar/:id` · `POST worker/tick` artık otomasyon
turunu da koşturur.

## Admin
`notifications/automations`: StatCard'lar, süzgeç çipleri, kart ızgarası (tetik, koşul özeti, 7 gün, son koşu, aç/kapat
onaylı), sağ panel: düzenleme (metin, kanal, takvim düzenleyici, kural kurucu, sıklık), prova (kitle, örnek alıcılar,
çözülmüş metin, vade, bağlantı), kuru koşu / şimdi çalıştır (admin), koşu geçmişi. `notifications/settings`: Sınav takvimi kartı.

## Doğrulama
`apps/api/scripts/notifications/f2-smoke.ts` (Docker DB): tohum → zamanlı koşu + günlük dedupe + koşu kaydı → `user_time`
eşlemesi + `{{kalan_soru}}` → olaylı sonuç (`$payload.sessionId` rota) → `kind` süzgeci → açılış öncesi olay işlenmez →
broadcast → atıf (`convertedAt`) → liste/prova → 3 hata = duraklatma. Jest: `automation.logic.spec.ts` (8), toplam
bildirim testleri 29 + quiz 36. Admin ekranı :3001'de canlı: liste, panel, prova.

## Bilinen sınırlar / F3'e kalanlar
- `exam_abandoned` üreticisi yok (yarım tur işi olay yazmalı); `user_registered` olayı üretilmiyor (preset de yok).
- `weekly_report` mastery değişimi ve "haftanın çıkmış sorusu" yok (F3 kişiselleştirme).
- Olay otomasyonunda `conditions` yalnız kitle tablosuna bakar; yük koşulu kod içi `when`.
- Zamanlı koşu kaçırma penceresi 90 dk; işçi daha uzun kapalı kalırsa o gün atlanır (bilinçli: geriye dönük gönderim yok).
- `exam_published` otomasyonu ile yayın ekranındaki "duyur" kutusu ikisi birden kullanılırsa iki bildirim gider; biri seçilmeli.
