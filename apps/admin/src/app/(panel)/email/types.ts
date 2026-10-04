export type EmailTopic = "duyuru" | "kampanya";
export type EmailCampaignStatus =
  | "draft"
  | "test_sent"
  | "scheduled"
  | "sending"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";
export type EmailContactStatus =
  "subscribed" | "unsubscribed" | "bounced" | "complained" | "suppressed";

export type Audience = {
  sources?: string[];
  legacyYears?: number[];
  tags?: string[];
  excludeCampaignIds?: string[];
};

export type EmailCampaign = {
  id: string;
  name: string;
  topic: EmailTopic;
  subject: string;
  previewText: string | null;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  bodyMarkdown: string;
  status: EmailCampaignStatus;
  audience: Audience;
  dailyCap: number;
  sendRatePerSec: number | string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  pausedReason: string | null;
  targetedCount: number;
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  /** Tekil tıklayan alıcı (kendi yönlendirme ucumuz). */
  clickedCount: number;
  createdAt: string;
};

export type EmailCampaignDetail = EmailCampaign & {
  sends: Partial<
    Record<
      | "queued"
      | "claimed"
      | "sent"
      | "delivered"
      | "bounced"
      | "complained"
      | "failed"
      | "skipped",
      number
    >
  >;
  uncertain: number;
  sentToday: number;
};

export type AudiencePreview = {
  count: number;
  sample: { email: string; source: string; legacyYear: number | null }[];
  breakdown: { source: string; legacyYear: number | null; count: number }[];
};

export type EmailHealth =
  | { enabled: false }
  | {
      enabled: true;
      account: {
        productionAccess: boolean;
        sendingEnabled: boolean;
        enforcementStatus: string;
        max24HourSend: number;
        maxSendRate: number;
        sentLast24Hours: number;
        suppressedReasons: string[];
      };
      identities: {
        name: string;
        verified: boolean;
        dkim: string;
        mailFromDomain: string | null;
        mailFrom: string;
      }[];
      suppressedOnSes: number | null;
      last24h: {
        sent: number;
        delivered: number;
        bounced: number;
        complained: number;
        deliveryRate: number | null;
        bounceRate: number | null;
        complaintRate: number | null;
      };
      contacts: Partial<Record<EmailContactStatus, number>>;
      thresholds: {
        bounceRate: number;
        complaintRate: number;
        minSample: number;
        window: number;
      };
      defaults: { name: string; email: string; replyTo: string };
    };

export type EmailContact = {
  id: string;
  email: string;
  displayName: string | null;
  source: string;
  legacyYear: number | null;
  status: EmailContactStatus;
  topics: Partial<Record<EmailTopic, boolean>>;
  consentAt: string | null;
  unsubscribedAt: string | null;
  lastSentAt: string | null;
  softBounceCount: number;
  tags?: string[];
};

export const CAMPAIGN_STATUS: Record<
  EmailCampaignStatus,
  { label: string; cls: string }
> = {
  draft: { label: "Taslak", cls: "bg-slate-100 text-slate-700" },
  test_sent: { label: "Test gönderildi", cls: "bg-sky-100 text-sky-800" },
  scheduled: { label: "Planlandı", cls: "bg-indigo-100 text-indigo-800" },
  sending: { label: "Gönderiliyor", cls: "bg-amber-100 text-amber-800" },
  paused: { label: "Duraklatıldı", cls: "bg-orange-100 text-orange-800" },
  completed: { label: "Tamamlandı", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "İptal", cls: "bg-slate-100 text-slate-400" },
  failed: { label: "Hata", cls: "bg-red-100 text-red-800" },
};

export const CONTACT_STATUS: Record<
  EmailContactStatus,
  { label: string; cls: string }
> = {
  subscribed: { label: "Abone", cls: "bg-emerald-100 text-emerald-800" },
  unsubscribed: { label: "Çıktı", cls: "bg-slate-100 text-slate-600" },
  bounced: { label: "Geri döndü", cls: "bg-red-100 text-red-800" },
  complained: { label: "Şikâyet", cls: "bg-red-100 text-red-800" },
  suppressed: { label: "Bastırıldı", cls: "bg-orange-100 text-orange-800" },
};

export const SOURCE_LABEL: Record<string, string> = {
  live_user: "Kayıtlı kullanıcı",
  legacy_paem705: "Eski uygulama",
  manual: "Elle",
};

export const TOPIC_LABEL: Record<EmailTopic, string> = {
  duyuru: "Duyuru",
  kampanya: "Kampanya",
};

export const pct = (v: number | null | undefined, digits = 1) =>
  v == null ? "—" : `%${(v * 100).toFixed(digits)}`;
export const fmtDate = (s: string | null | undefined) =>
  s
    ? new Date(s).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
