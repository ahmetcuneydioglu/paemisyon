# Doc 56 / 04 — Aşama 5: akıllı öğrenme (Bugün, koç, günlük hedef, seri, bildirim, Performans)

Tarih: 5 Kasım 2026. Durum: **kod yazıldı, testler geçti; bayrak kapalı, yayında kart yok.** Modlar
(due/new/hard/favorites/all/mixed) aşama 3–4'te zaten sunucuda ve istemcilerdeydi; bu aşama kartları
günün akışına bağlar. Kural sunucuda (CLAUDE.md): rota, porsiyon, kural eşiği ve bildirim kararı
`apps/api`'de; istemciler yalnız çizer.

## 1. Sunucu

| Parça | Dosya | Not |
|---|---|---|
| Tipler | `coach/home-v2.types.ts`, `home-v3.types.ts`, `coach.types.ts` | `TodayTaskAction.type += open_flashcards` (`route` = `/kartlar?mode=due`), `NextStepKind += flashcards`, `RouteItemKind += flashcards`, `ForYouKind += flashcards_due`, `CoachCardType += flashcards_due`, `CoachContext.flashcards {due, reviewedToday, dailyGoal} \| null`. |
| Bugün v3 | `coach/bugun-v3.logic.ts` (+spec, 4 yeni test) | `BugunV3Input.flashcards`. **Porsiyon** = min(günlük kart hedefi, bugün çalışılan + bekleyen). Rota: "Kart tekrarı · N kart", ayrıntı "5/20 · 40 bekliyor" / "kuyruk temiz", ~dk = kart × 12 sn, tamam = hedef doldu ya da kuyruk boş. Senin için: "Kart tekrarı · N kart · Çalış" (sıradaki adım kart değilse). Sıradaki: soru hedefi dolunca ve yanlış porsiyonu bitince, günün quizinden ÖNCE "N kart tekrar bekliyor". |
| Koç kuralı | `coach/rules/flashcards-due.rule.ts` (+spec) | ≥5 vadeli kart ve bugün hiç kart çalışılmamışsa `flashcards_due`, öncelik 60 (quick_review 70 ve streak_risk 85 altında); CTA `/kartlar?mode=due`. Kartlar kapalıysa bağlam null → susar. |
| Koç servisi | `coach/coach.service.ts`, `coach.module.ts` | `kartDurumu()` bağlam toplama turuna eklendi: `enabledFor` kapısı (bayrak + admin/beta), `dueTotal`, `dailyGoal`; hata rotayı düşürmez (null). `CoachModule → FlashcardsModule`. |
| İstatistik ucu | `GET /me/flashcards/stats` (`flashcards.service.ts stats`, +spec) | `{counts, dailyGoal, last30{reviewed,known,knownPct}, last7[], courses[]}`. Oran en az 10 olayla (yoksa null — sıfır yüzde yazılmaz). Ders satırında kilitli kart sayısı ayrı. |
| Seri (karar 6) | `flashcards.service.ts recordEvent`, `FlashcardsModule → ProgressModule` | Günün ilk gerçek kart olayı `ProgressService.touchActivity` ile seriyi yazar (idempotent tekrar dokunmaz; hata puanı düşürmez). Seri soru ya da kartla korunur; `DailyUsage` değişmedi (şema değişikliği yok). |
| Olay | `completeSession`, `notifications/app-events.service.ts` | İlk tamamlamada `flashcard_session_completed` (yük: reviewed, known, again); bildirim dönüşümü bunu sayar. |
| Ortak sorgular | `flashcards/kart-sorgular.ts` | `countDueCards`, `countReviewedToday`, `flashcardsEnabledFor` — servis, koç ve bildirim preset'i aynı kuralı kullanır (kilitli kart ücretsiz kullanıcıya sayılmaz, geri alınmış olay sayılmaz, gün TR 04.00). `flashcardsAcik` `flashcard.constants.ts`'e taşındı. |
| Bildirim | `notifications/automation.presets.ts`, `deep-links.ts`, `template.ts`, `automation.logic.ts` | Preset **`flashcards_due`**: `study_reminder`, `low`, yalnız push, hatırlatma saati + 60 dk, kitle `pushEnabled ∧ lastActiveDays ≤ 14`; kişi başına `enrich` ile kapı + bugün çalışılmadı + vadeli kart sayısı (`{{kart_sayisi}}`), yoksa `no_payload`. Cooldown 20 s, günde 1, sessiz saat, TTL 6 s; **`paused` doğar**, panel açar. Derin bağlantı hedefi `flashcards` → mobil `flashcards`, web `/kartlar?mode=due&source=notif`, `minAppVersion 2.1.0` (kart ekranı o mağaza sürümüyle çıkar; eskisi kutuya düşer). |
| Profil | `GET /me` | `flashcardDailyGoal`; kartlar bu kullanıcıya kapalıysa **null** (istemci ayar satırını çizmez). Değişiklik `PATCH /me/flashcards/preferences`. |

## 2. Expo

- `ben/ayarlar.tsx`: "Günlük kart hedefi · N kart" çipleri (10·20·30·40·60), yalnız `/me` null vermediyse; ayrı uca gider, tek Kaydet.
- `ben/performans.tsx`: "Bilgi kartları" bölümü — Öğrenildi x/y (çubuk), Tekrar (vade), Bugün n/hedef (30 günlük oran ipucu); ders satırları → `/kartlar` (vade varsa due, yoksa all); başlık eylemi "Tekrar · N". Kartlar kapalıysa (404) bölüm yok.
- `features/flashcards/queries.ts`: `FlashcardStats`, `useFlashcardStats`, `useSetFlashcardDailyGoal`; `features/home/queries.ts` `NextStepKind += flashcards`.
- `lib/deep-links.ts`: `/kartlar?mode=…&topicId=…` sorgulu adres çözülür (koç kartı CTA'sı ve web ile aynı adres), mod doğrulanır; test 2/2.
- Bugün ekranı rota/senin için/sıradaki satırlarını türden bağımsız çizdiği için ek iş yok; `open_flashcards` aşama 4'te bağlanmıştı.

## 3. Web

- `profil/profile-settings-form.tsx`: "Günlük kart hedefi" seçimi (null ise gizli); kaydetmede yalnız değiştiyse `PATCH /me/flashcards/preferences`.
- `performans/page.tsx`: "Bilgi kartları" kartı (üç `StatTile`, ders satırları, "Tekrara başla · N"); `/me/flashcards/stats` 404 → kart yok.
- `lib/public-api.ts`: `MeProfile.flashcardDailyGoal`, `NextStepKind += flashcards`; `lib/kartlar.ts`: `FlashcardStats`. Bugün listeleri ve `homeActionHref` aşama 4'ten hazır.

## 4. Doğrulama

| Katman | Sonuç |
|---|---|
| API | Tüm paket geçti (sayılar commit mesajında); yeni testler: Bugün v3 kart dalları (4), kart kuralı (2), seri/olay/istatistik (3). `typecheck` ve lint temiz. |
| Expo | `tsc` temiz, `eslint` 0, deep-links testi 2/2. Cihaz testi yeni dev build ile. |
| Web | `tsc`, `eslint`, vitest 15 dosya / 131 test, `tokens:check` temiz. |

Canlıda görünmesi için: PR merge (Railway/Vercel deploy), kartların yayınlanması (aşama 6 paneli),
bayrak ya da beta/admin rolü. Bildirim preset'i panelden (Bildirim Merkezi › Otomasyonlar) açılır.

## 5. Sıradaki (aşama 6)

Admin: `modules/admin/flashcards/*` (liste, detay, yayınla/yayından al/arşivle, içe aktar dry-run,
toplu yayın — AI kaynaklı kartlar toplu onaydan geçmez), panel sayfaları `(panel)/flashcards`,
madde tazelenince kart eskitme (`admin-law-articles.service` stale kancası), `Stat`/`Toast`/`FilterBar`
ortaklaştırma. Pilot deste panelden yayınlanınca aşama 7 (cihaz ve web göz testi, beta rolüyle canlı).
