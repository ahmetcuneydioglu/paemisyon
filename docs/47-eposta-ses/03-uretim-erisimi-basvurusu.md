# SES üretim erişimi başvurusu

Ne zaman: DKIM + MAIL FROM iki kimlikte de SUCCESS, SNS aboneliği canlı API'ye bağlı (webhook çalışıyor),
`/eposta/abonelik/<token>` sayfası yayında. Nereden: SES konsolu → Account dashboard → **Request production
access** (bölge eu-central-1). Form İngilizce doldurulur; AWS genelde 24 saat içinde yanıtlar, ek soru sorabilir.

## Form alanları

- **Mail type:** Transactional (işlem postaları da aynı hesaptan çıkacağı için; pazarlama alt alanda ayrı).
- **Website URL:** https://www.paemisyon.com
- **Use case description:**

```
Paemisyon (paemisyon.com) is a Turkish exam-preparation application (iOS, Android, web) for police
candidates and personnel. We will send two kinds of email from this account, from separate identities
and configuration sets:

1) Transactional (paemisyon.com, configuration set "paemisyon-islem"): Supabase Auth messages — email
   confirmation and password reset — triggered by the user's own action. Expected volume: under 100/day.

2) Product announcements (duyuru.paemisyon.com, configuration set "paemisyon-duyuru"): service updates
   (new features, exam calendar, legislation changes) and occasional promotions to users who registered
   in our application and gave their address at sign-up. Our list is ~4,500 addresses: ~500 current
   users plus ~4,000 users of our previous application who are being informed that the service has
   relaunched. Expected volume after warm-up: 5,000–10,000/month, sent in daily batches starting at
   150/day and increasing only while bounce < 5% and complaint < 0.1%.

How we obtain addresses: only from our own registration flow (never purchased or scraped). Each
contact record stores consent source and date.

Bounce and complaint handling: SES events (Send, Delivery, Bounce, Complaint, Reject, DeliveryDelay)
go to an SNS topic subscribed by our API (signature-verified). Permanent bounces and complaints set the
contact to a blocked status immediately and the account-level suppression list is enabled for BOUNCE and
COMPLAINT. Three transient bounces also suppress the address. Our sender re-checks the contact status
right before every send and auto-pauses a campaign when bounce ≥ 5% or complaint ≥ 0.1% over the last
1,000 sends.

Unsubscribe: every announcement carries List-Unsubscribe (https + mailto) and List-Unsubscribe-Post
(RFC 8058 one-click), plus a visible footer link to a preference page that requires no login. Unsubscribe
requests are honored instantly and apply to all future announcements.

Sending rate control: we read GetAccount quota before each batch and stop at 80% of the 24-hour quota;
per-second rate is capped below MaxSendRate.
```

- **Additional contacts / preferences:** destek@paemisyon.com, dil İngilizce ya da Türkçe.

## Onaydan sonra

1. `GetAccount` → `ProductionAccessEnabled: true`, kota genelde 50.000/gün, 14/sn.
2. Supabase Auth → SES SMTP geçişi (Faz 2'): `paemisyon-smtp` IAM kullanıcısı (yalnız `ses:SendRawEmail`,
   `ses:FromAddress` = `*@paemisyon.com`), SES → SMTP settings → Create SMTP credentials; Supabase →
   Authentication → SMTP Settings: host `email-smtp.eu-central-1.amazonaws.com`, port 465, gönderici
   `Paemisyon <hesap@paemisyon.com>`; Auth → Rate Limits: e-posta/saat değerini yükselt. Türkçe şablonlar.
3. İlk duyuru: kademe planı 02-tasarim.md §5 (gün 1: 150, 2023 kayıtlılardan).
