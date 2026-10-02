/**
 * E-posta modülü sabitleri ve ortam okuması (docs/47-eposta-ses/01, 02).
 * Secret yok; anahtarlar AWS SDK'nın varsayılan zincirinden (AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY, yalnız Railway değişkenleri) gelir.
 */
export const EMAIL_CONFIG = {
  region: process.env.AWS_REGION ?? 'eu-central-1',
  /** SNS konusu; webhook yalnız bu konudan gelen mesajı kabul eder. */
  topicArn: process.env.EMAIL_SES_TOPIC_ARN ?? '',
  /** Çıkış/tercih sayfasının kökü (web). */
  publicBaseUrl: (process.env.EMAIL_PUBLIC_BASE_URL ?? 'https://paemisyon.com').replace(/\/$/, ''),
  /** Tek tık çıkış ucunun kökü (API, /api/v1 dahil). */
  apiBaseUrl: (process.env.EMAIL_API_BASE_URL ?? 'https://api.paemisyon.com/api/v1').replace(
    /\/$/,
    '',
  ),
  /** SES yapılandırma setleri (01-aws-ses-kurulum.md). */
  configurationSets: { islem: 'paemisyon-islem', duyuru: 'paemisyon-duyuru' } as const,
  identities: ['paemisyon.com', 'duyuru.paemisyon.com'] as const,
  /** Toplu gönderici kimliği (ürün sahibi kararı C, 2 Eki 2026). */
  defaultFrom: {
    name: 'Paemisyon',
    email: 'bilgi@duyuru.paemisyon.com',
    replyTo: 'destek@paemisyon.com',
  },
  /** Şablon marka varlıkları (web'de yayımlı; posta istemcileri görseli https'ten yükler). */
  brand: {
    /** Lacivert bant için BEYAZ logotip (webdeki mobileLogo.png, 137×40). */
    logoUrl: 'https://www.paemisyon.com/img/mobileLogo.png',
    logoW: 137,
    logoH: 40,
    siteUrl: 'https://www.paemisyon.com',
    appStore: {
      url: 'https://apps.apple.com/tr/app/paemisyon/id6802087692',
      img: 'https://www.paemisyon.com/img/appStore.png',
      w: 96,
      h: 34,
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.paemisyon.paemisyon',
      img: 'https://www.paemisyon.com/img/playStore.png',
      w: 114,
      h: 34,
    },
    social: [
      { label: 'Telegram', href: 'https://t.me/paemisyon' },
      {
        label: 'Instagram',
        href: 'https://instagram.com/paemvemisyon',
        img: 'https://www.paemisyon.com/img/instagram.png',
      },
    ],
  },
  /** Hesap 24 saat kotasının bu oranı dolunca işçi durur. */
  accountQuotaStopRatio: 0.8,
  /** Bir tick'te en çok bu kadar gönderim (işçi 30 sn'de bir çalışır). */
  maxPerTick: 50,
  /** `claimed` bu süreden eskiyse "belirsiz" sayılır; otomatik yeniden gönderilmez. */
  claimStaleMs: 10 * 60_000,
  /** Geçici bounce bu sayıya ulaşınca kişi suppressed olur. */
  softBounceLimit: 3,
  /** Otomatik emniyet: son N gönderimde bounce ≥ %5 ya da şikâyet ≥ ‰1 → kampanya durur. */
  safety: { window: 1000, minSample: 200, bounceRate: 0.05, complaintRate: 0.001 },
  /** Ham olay saklama süresi (gün). */
  eventRetentionDays: 90,
} as const;

export const emailWorkerEnabled = () => process.env.EMAIL_WORKER !== '0';
