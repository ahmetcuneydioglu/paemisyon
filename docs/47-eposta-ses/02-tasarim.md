# E-posta modülü tasarımı (Faz 3–5 onay belgesi)

Tarih: 2 Ekim 2026. Durum: kararlar A–E onaylandı (2 Eki 2026); **Faz 3 ve 4 kodlandı ve commit'lendi**
(`fca4197`, `74c30f6`), migration canlıda, kişi listesi dolu (480 canlı + 3.980 eski), duman testi
simülatörle geçti. Açık: Railway değişkenleri + dağıtım, SNS HTTPS aboneliği, Faz 5 admin ekranı,
üretim erişimi (03-uretim-erisimi-basvurusu.md).

## 1. Keşif bulguları (canlı veriden, salt okunur)

| Olgu | Değer |
|---|---|
| Canlı `users` | 489 (488 e-postası doğrulanmış, 9 silinmiş), ilk kayıt 12 Tem 2026 |
| `legacy_user_map` | **0 satır** — paem705 göçü canlıya hiç uygulanmamış |
| paem705 dökümü | 4.095 tekil geçerli adres (2020–2023), 92'si Apple gizli aktarma |
| Push cihazı | 30 |
| Supabase Auth SMTP | kapalı (varsayılan Supabase göndericisi) |

Sonuç: eski 4.095 adres bugünkü sistemin kullanıcısı değil. Duyuru onları ya **kayıt olmaya** çağırır
ya da önce göç uygulanıp **şifre belirlemeye** çağırır. Bu ürün kararıdır (§8, karar A).

Mevcut kalıplar yeniden kullanılır: `AuditLog` (denetim kaydı), `JwtAuthGuard + RolesGuard('admin')`
(admin uçları), `@nestjs/schedule` (zamanlanmış işler; `snapshot.service.ts` örneği), `PushService`
(env yoksa sessizce devre dışı), yanıt zarfı `{data}/{error}`, admin `api()` istemcisi,
web `(site)` grubundaki herkese açık sayfa kalıbı (`hesap-sil`).

## 2. Modül yerleşimi

- API: `apps/api/src/modules/email/` — `email.module.ts`, `ses.service.ts` (SES v2 istemcisi),
  `email-contacts.service.ts`, `email-campaigns.service.ts`, `email-sender.service.ts` (işçi),
  `email-events.controller.ts` (SNS webhook, herkese açık), `email-unsubscribe.controller.ts`
  (herkese açık), `email-admin.controller.ts` (`/admin/email/*`, admin rolü), `email-render.ts` (şablon).
- Admin: `apps/admin/src/app/(panel)/email/` — kampanyalar, kişiler, sağlık.
- Web: `apps/web/src/app/(site)/eposta/abonelik/[token]/page.tsx` — tercih/çıkış sayfası.
- Betik: `apps/api/scripts/import-legacy-email-contacts.ts` (paem705 → `email_contacts`, idempotent).

Ortam değişkenleri (API, Railway): `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`EMAIL_SES_TOPIC_ARN` (SNS konusu; webhook yalnız bu konudan gelen mesajı kabul eder),
`EMAIL_PUBLIC_BASE_URL` (`https://paemisyon.com`), `EMAIL_API_BASE_URL` (`https://api.paemisyon.com`).
Anahtar yoksa modül `PushService` gibi sessizce devre dışı kalır.

## 3. Şema (Prisma, 4 tablo + 1 ilişki tablosu)

**email_contacts** — kişi, projenin posta listesi.
`id uuid`, `email citext UNIQUE`, `user_id uuid? FK users (set null)`, `display_name text?`,
`source enum(live_user, legacy_paem705, manual)`, `legacy_year int?` (kademe için),
`status enum(subscribed, unsubscribed, bounced, complained, suppressed)`,
`consent_at timestamptz?`, `consent_source text?` (ör. `app_registration`, `legacy_app_registration`),
`unsubscribed_at`, `unsubscribe_reason text?`, `unsubscribe_token text UNIQUE` (32 bayt rastgele, base64url),
`soft_bounce_count int default 0`, `last_sent_at`, `last_event_at`, `created_at`, `updated_at`.
İndeks: `status`, `source`, `legacy_year`, `user_id`.

**email_topic_preferences** — konu bazlı tercih. `contact_id FK`, `topic enum(duyuru, kampanya)`,
`subscribed bool`, `updated_at`; PK `(contact_id, topic)`. Satır yoksa varsayılan **abone**.
"Hepsinden çık" = `contacts.status = unsubscribed` (konu tercihlerinden bağımsız üstün kural).

**email_campaigns** — `id`, `name`, `topic`, `subject`, `preview_text`, `from_name`, `from_email`,
`reply_to`, `body_markdown text`, `html_snapshot text?` (gönderim başında dondurulur),
`status enum(draft, test_sent, scheduled, sending, paused, completed, cancelled, failed)`,
`audience jsonb` (bkz. §5), `daily_cap int`, `send_rate_per_sec numeric`, `scheduled_at`, `started_at`,
`completed_at`, `created_by uuid`, sayaçlar `targeted, sent, delivered, bounced, complained, unsubscribed`
(olaylardan güncellenen önbellek), `created_at`, `updated_at`.

**email_sends** — kampanya × kişi, **tekillik ve kurtarma burada**.
`id`, `campaign_id FK`, `contact_id FK`, `email` (gönderim anındaki), `status enum(queued, claimed, sent,
delivered, bounced, complained, failed, skipped)`, `ses_message_id text? UNIQUE`, `attempts int`,
`claimed_at`, `sent_at`, `last_event_at`, `error text?`. `UNIQUE (campaign_id, contact_id)`.
İndeks: `(campaign_id, status)`, `ses_message_id`.

**email_events** — ham SES olayı. `id`, `ses_message_id`, `send_id FK?`, `type enum(send, delivery,
bounce, complaint, reject, delivery_delay, click, rendering_failure)`, `subtype text?` (Permanent/Transient,
bounce türü), `recipient citext`, `payload jsonb` (kırpılmış: tanılama kodu, zaman, kullanıcı aracısı yok),
`occurred_at`, `received_at`. İndeks: `ses_message_id`, `(type, occurred_at)`.
Saklama: 90 günden eski ham olaylar günlük işle silinir; kampanya sayaçları kalır.

Bastırma: tek kaynak **SES hesap düzeyi listesi** (bounce + şikâyet, zaten açık). Bizim tarafta
`contacts.status` bunun aynası; gönderimden önce yalnız `status = subscribed` ve konu tercihi açık olanlar
seçilir. Üçüncü bir liste tutulmaz.

## 4. Gönderim işçisi

- `@nestjs/schedule` ile her 30 saniyede bir `tick`: `status = sending` kampanyalar için.
- Tavanlar: SES `GetAccount` kotası (5 dk önbellek), kampanyanın `daily_cap` (İstanbul günü) ve
  `send_rate_per_sec` (sandbox 1/sn; üretimde 14/sn'in yarısı). Hesap kotasının %80'i aşılınca tick durur.
- Parti: `UPDATE email_sends SET status='claimed', claimed_at=now() WHERE id IN (SELECT id … WHERE
  status='queued' LIMIT 50 FOR UPDATE SKIP LOCKED) RETURNING *` → her satır için gönderimden hemen önce kişi
  durumu yeniden okunur (çıkmışsa `skipped`) → `SendEmail` v2 (Content.Simple, UTF-8, `Headers`:
  `List-Unsubscribe: <https://api.paemisyon.com/email/unsubscribe/<token>>, <mailto:…>` ve
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; `ConfigurationSetName=paemisyon-duyuru`;
  `EmailTags: campaign=<id>`) → `status='sent', ses_message_id`.
- Çökme kurtarma: `claimed` durumunda 10 dakikadan eski satır **otomatik yeniden gönderilmez**;
  "belirsiz" sayılır, admin ekranında sayı olarak görünür. SES'in `SEND` olayı gelirse `sent`'e düşer
  (olay `ses_message_id` taşır, biz kaydedememiş olsak da `recipient + campaign etiketi` ile eşlenir).
  Böylece aynı kişiye ikinci posta gitmez; en kötü durumda birkaç kişi hiç almaz ve elle karar verilir.
- Hata: SES `Throttling` → bekle; `MessageRejected`/`AccountSendingPaused` → kampanya `paused` + denetim kaydı;
  adres bazlı red → `failed`.
- Otomatik emniyet (ilk sürümde var, basit): son 1.000 gönderimde bounce ≥ %5 ya da şikâyet ≥ ‰1 ise
  kampanya `paused`.

## 5. Kitle ve kademe

`audience` JSON: `{ "source": ["legacy_paem705","live_user"], "legacyYears": [2023,2022], "topic": "duyuru",
"excludeSentInCampaignIds": [...] }`. Gönderim başlatılırken kitle **dondurulur** (`email_sends` satırları
yazılır; `targeted` sayısı buradan). Kademeli plan = aynı kampanyanın `daily_cap`'i: gün 1 150, sonra admin
günlük oranlara bakıp artırır (otomatik katlama yok; karar insanın).

## 6. Herkese açık uçlar

- `POST /email/unsubscribe/:token` — RFC 8058 tek tık (gövde `List-Unsubscribe=One-Click`), konu bağımsız
  **hepsinden çıkış**; 200 döner, kimlik göstermez. Hız sınırı IP başına 30/dk.
- `GET /email/preferences/:token`, `PUT /email/preferences/:token` — web sayfası için (konu tercihleri,
  hepsinden çık). Token geçersizse 404, aynı mesaj.
- `POST /email/ses-events` — SNS. İmza `sns-validator` ile doğrulanır (sertifika yalnız
  `sns.eu-central-1.amazonaws.com`), `TopicArn` env ile birebir, `SubscriptionConfirmation` otomatik
  onaylanır, `Notification` içindeki SES olayı işlenir: bounce `Permanent` → kişi `bounced`; `Transient` →
  `soft_bounce_count++`, 3'te `suppressed`; complaint → `complained`; delivery → gönderim `delivered`.
  Yinelenen olay (`ses_message_id + type + occurred_at`) yok sayılır.

Çıkış sayfası: `paemisyon.com/eposta/abonelik/<token>` — oturum istemez, tek düğme "Bu e-postaları durdur"
ve iki konu anahtarı.

## 7. Şablon ve admin

- Tek, elle yazılmış tablo düzenli responsive şablon (inline CSS, koyu mod `color-scheme`, Outlook için
  `mso` koşulları). Gövde **Markdown** → `marked` + `sanitize-html` (bağlantı, kalın, liste, başlık, resim;
  betik/HTML yok). Blok editörü ilk sürümde yok.
- Admin "E-posta" menüsü: **Kampanyalar** (liste, yeni, ayrıntı: huni sayaçları + günlük oran + belirsiz
  gönderimler + Duraklat/Sürdür/İptal), **Kişiler** (durum/kaynak/yıl süzgeci, e-posta arama, elle çıkar),
  **Sağlık** (SES kotası ve üretim durumu, iki kimliğin DKIM/MAIL FROM durumu, 24 saat teslim/bounce/şikâyet,
  bastırma sayısı; hepsi AWS API'den, hesaplanmış etiket yok).
- Kampanya akışı: taslak → test postası (admin'in kendi adresi; sandbox'ta doğrulanmış olmalı) → kitle
  önizleme (sayı + ilk 20 adres maskeli) → onay metni ("`N` kişi, konu, gönderici, günlük tavan") → `sending`.
  Test postası gönderilmeden `sending`'e geçilemez.
- Denetim: `AuditLog` eylemleri `email.campaign.create/start/pause/cancel`, `email.contact.unsubscribe`,
  `email.contacts.import`.

## 8. Ürün sahibinden beklenen kararlar

A. **Eski kullanıcılar:** (1) yalnız kayıt daveti gönder, göç yapma; (2) önce `migrate-paem705-users.ts`
   ile hesapları aç (parolasız), postada "şifreni belirle" bağlantısı. (2) daha iyi dönüş verir ama 4.000
   parolasız hesap ve Auth SMTP'nin SES'e geçmiş olması şart.
B. **Konu adları:** `duyuru` (ürün/uygulama bilgilendirmesi) + `kampanya` (pazarlama). Başka konu var mı?
C. **Gönderici adresi:** `Paemisyon <bilgi@duyuru.paemisyon.com>`, yanıt `destek@paemisyon.com`.
D. **Canlı kullanıcıların onay dayanağı:** 489 kullanıcı kayıt sırasında e-posta bilgilendirmesini kabul
   etmiş sayılacak mı (`consent_source = app_registration`)? Gizlilik metninde ne yazıyorsa ona göre.
E. **Migration penceresi:** repo kuralı gereği Prisma migration backend durdurularak `DIRECT_URL` ile
   uygulanır; uygun saat.

## 9. Faz planı (kodlu)

| Faz | İş | Çıktı |
|---|---|---|
| 3 | Prisma şeması + migration, kişi aktarım betiği (canlı kullanıcılar + paem705), birim testleri | tablolar dolu, 0 posta |
| 4 | SES servisi, işçi, SNS webhook, çıkış uçları + web sayfası, simülatörle test | zincir uçtan uca |
| 5 | Admin ekranları, şablon, test postası | ilk taslak kampanya |
| — | Üretim erişimi başvurusu (metin hazır), onay | kota ↑ |
| 2' | Supabase Auth → SES SMTP, Türkçe şablonlar, hız sınırı ayarı | işlem postaları SES'te |
| 6 | Kademeli duyuru (A kararına göre) | ölçüm, DMARC sıkılaştırma kararı |
