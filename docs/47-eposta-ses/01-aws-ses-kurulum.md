# E-posta altyapısı — Amazon SES kurulumu (Faz 1)

Tarih: 2 Ekim 2026. Bölge: **eu-central-1 (Frankfurt)**. Hesap: tek AWS hesabı, proje başına ayrı
kimlik ve yapılandırma seti. Secret değer içermez.

## Karar özeti

- Toplu bilgilendirme ve pazarlama postaları **Amazon SES** ile, `duyuru.paemisyon.com` alt alanından.
- Supabase Auth postaları (doğrulama, şifre sıfırlama) **SES SMTP** ile `paemisyon.com` kök alanından
  (Faz 2). Bugün Supabase'in varsayılan SMTP'si kullanılıyor; saatlik sınırı duyuru trafiğini kaldırmaz.
- Brevo DNS kayıtlarına (DKIM `brevo1/brevo2`, SPF `include:spf.brevo.com`, DMARC rua) **dokunulmaz**;
  SES yanına eklenir.
- Paylaşımlı IP; özel IP alınmaz.
- Yanıt adresi `destek@paemisyon.com` (Natro kurumsal posta kutusu, okunuyor).
- Eski, doğrulanamamış `paemisyon.com` kimliği silindi ve 2048 bit DKIM ile yeniden kuruldu
  (ürün sahibi onayı 2 Ekim 2026).

## AWS'de oluşturulanlar (CLI ile, 2 Ekim 2026)

| Kaynak | Ad | Not |
|---|---|---|
| Kimlik | `paemisyon.com` | Easy DKIM RSA 2048, MAIL FROM `bounce.paemisyon.com`, varsayılan set `paemisyon-islem` |
| Kimlik | `duyuru.paemisyon.com` | Easy DKIM RSA 2048, MAIL FROM `bounce.duyuru.paemisyon.com`, varsayılan set `paemisyon-duyuru` |
| Yapılandırma seti | `paemisyon-islem` | itibar metrikleri açık, bastırma BOUNCE+COMPLAINT |
| Yapılandırma seti | `paemisyon-duyuru` | itibar metrikleri açık, bastırma BOUNCE+COMPLAINT |
| SNS konusu | `ses-events-paemisyon` | iki setin olay hedefi: SEND, DELIVERY, BOUNCE, COMPLAINT, REJECT, DELIVERY_DELAY, RENDERING_FAILURE. **CLICK yok** (4 Eki 2026): açıkken SES her bağlantıyı ortak `*.awstrack.me` alan adına çeviriyordu; From ile uyumsuz, paylaşılan itibarlı bağlantı Gmail'de spam sinyali |

Webhook aboneliği (HTTPS) Faz 4'te eklenir. OPEN olayı bilerek yok (açılma takibi kapalı).

## Natro'ya girilecek DNS kayıtları

Natro panelinde "Host/Alt alan" alanına yalnız alt alan kısmı yazılır (ör. `bounce`), alan adı eklenmez.
CNAME ve MX hedeflerinin sonundaki nokta panel kabul etmezse kaldırılır. TTL varsayılan kalabilir.

### A. `paemisyon.com` (işlem postaları)

| Tür | Host | Değer |
|---|---|---|
| CNAME | `tvgk2r6mbrtc7re2cxuvaestbnrpiafp._domainkey` | `tvgk2r6mbrtc7re2cxuvaestbnrpiafp.dkim.amazonses.com` |
| CNAME | `focexqfznbqdicn7qx4f2d72uikxzwdo._domainkey` | `focexqfznbqdicn7qx4f2d72uikxzwdo.dkim.amazonses.com` |
| CNAME | `775kutnitpmx266bcnhdsgie6g64wifa._domainkey` | `775kutnitpmx266bcnhdsgie6g64wifa.dkim.amazonses.com` |
| MX | `bounce` | öncelik `10`, hedef `feedback-smtp.eu-central-1.amazonses.com` |
| TXT | `bounce` | `v=spf1 include:amazonses.com ~all` |

### B. `duyuru.paemisyon.com` (toplu postalar)

| Tür | Host | Değer |
|---|---|---|
| CNAME | `3lp6ggfgrb73v5d4recsb3zhfsrxx2cc._domainkey.duyuru` | `3lp6ggfgrb73v5d4recsb3zhfsrxx2cc.dkim.amazonses.com` |
| CNAME | `sl4otlgt4ywiauku322x4balu67cus4l._domainkey.duyuru` | `sl4otlgt4ywiauku322x4balu67cus4l.dkim.amazonses.com` |
| CNAME | `vioemyd2icfb4ltivhsqdr47ceiqqk3m._domainkey.duyuru` | `vioemyd2icfb4ltivhsqdr47ceiqqk3m.dkim.amazonses.com` |
| MX | `bounce.duyuru` | öncelik `10`, hedef `feedback-smtp.eu-central-1.amazonses.com` |
| TXT | `bounce.duyuru` | `v=spf1 include:amazonses.com ~all` |

Toplam 10 kayıt. Kök alanın SPF'ine dokunulmaz: SES, SPF'i MAIL FROM alt alanı (`bounce.*`) üzerinden
geçer. DMARC: kökteki `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` alt alanları da kapsar; ilk
kampanya temiz geçtikten sonra `p=quarantine`'e sıkılaştırma ayrı karar.

Doğrulama: kayıtlar yayıldıktan sonra (Natro'da genellikle 15–60 dk)
`aws sesv2 get-email-identity --email-identity duyuru.paemisyon.com` çıktısında
`DkimAttributes.Status = SUCCESS` ve `MailFromAttributes.MailFromDomainStatus = SUCCESS` beklenir.

## Ürün sahibinin konsoldan yapacakları

### 1. IAM kullanıcısı (kök anahtar yerine)

CLI şu an kök hesap kimliğiyle çalışıyor. Yapılacak:

1. IAM → Users → Create user: `paemisyon-ses` (konsol erişimi yok).
2. Permissions → Attach policies directly → Create policy (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*",
      "Condition": { "StringLike": { "ses:FromAddress": ["*@paemisyon.com", "*@duyuru.paemisyon.com"] } } },
    { "Effect": "Allow", "Action": ["ses:GetAccount", "ses:GetEmailIdentity", "ses:ListSuppressedDestinations",
      "ses:GetSuppressedDestination", "ses:PutSuppressedDestination", "ses:DeleteSuppressedDestination"], "Resource": "*" }
  ]
}
```

   **Not (2 Eki 2026):** ilk sürümde koşul `ses:configuration-set` idi; bu anahtar SES v2 `SendEmail`
   çağrısında dolmadığı için izin hiç uygulanmıyordu (IAM simülasyonu: implicitDeny, eksik bağlam). Koşul
   `ses:FromAddress` ile değiştirildi ve çalıştı.
3. Security credentials → Create access key → "Application running outside AWS". Anahtar yalnız Railway
   (API) değişkenlerine girilir: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Repoya ve
   `.env.example`'a değer yazılmaz.
4. Supabase SMTP için ayrı bir kullanıcı: `paemisyon-smtp`, yalnız `ses:SendRawEmail`
   (`ses:configuration-set` = `paemisyon-islem`); SES → SMTP settings → Create SMTP credentials bu
   kullanıcıdan üretilir (Faz 2).
5. Kök hesabın erişim anahtarı varsa devre dışı bırak; CLI için ileride ayrı bir yönetici IAM kullanıcısı.

### 2. Üretim erişimi başvurusu

DKIM ve MAIL FROM doğrulandıktan ve Faz 4 (bounce/şikâyet webhook'u, tek tıkla çıkış) bittikten sonra
SES → Account dashboard → Request production access. Başvuru metni: `02-uretim-erisimi-basvurusu.md`.

## Sandbox sınırları (bugün)

Günde 200 posta, saniyede 1, yalnız doğrulanmış alıcı adresleri. Test alıcıları:
`success@simulator.amazonses.com`, `bounce@simulator.amazonses.com`, `complaint@simulator.amazonses.com`,
`suppressionlist@simulator.amazonses.com` (doğrulama gerektirmez, kotadan düşmez, itibarı etkilemez).
