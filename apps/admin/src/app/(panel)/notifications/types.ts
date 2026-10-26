/** Bildirim Merkezi tipleri — API (apps/api/src/modules/notifications) ile birebir. */
export type Category =
  | 'daily_question' | 'study_reminder' | 'streak' | 'exam' | 'exam_countdown' | 'new_content'
  | 'achievement' | 'statistics' | 'leaderboard' | 'question_report' | 'marketing' | 'system';
export type Channel = 'push' | 'inbox' | 'email';
export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type AudienceMode = 'all' | 'segment' | 'users' | 'testers';
export type SendMode = 'now' | 'scheduled' | 'smart';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';
export type DeliveryStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'suppressed' | 'expired';

export const CATEGORY_LABEL: Record<Category, string> = {
  daily_question: 'Günün sorusu', study_reminder: 'Çalışma hatırlatması', streak: 'Seri', exam: 'Denemeler',
  exam_countdown: 'Sınav geri sayımı', new_content: 'Yeni içerik', achievement: 'Rozetler', statistics: 'Haftalık rapor',
  leaderboard: 'Sıralama', question_report: 'Soru bildirimleri', marketing: 'Kampanyalar', system: 'Sistem',
};
/** Kanal politikası (sunucudaki notification.categories.ts ile aynı; sunucu yine doğrular). */
export const CATEGORY_CHANNELS: Record<Category, Channel[]> = {
  daily_question: ['push', 'inbox'], study_reminder: ['push'], streak: ['push', 'inbox'], exam: ['push', 'inbox', 'email'],
  exam_countdown: ['push', 'inbox'], new_content: ['push', 'inbox', 'email'], achievement: ['inbox'], statistics: ['inbox', 'email'],
  leaderboard: ['push', 'inbox'], question_report: ['push', 'inbox'], marketing: ['email'], system: ['push', 'inbox', 'email'],
};
export const CHANNEL_LABEL: Record<Channel, string> = { push: 'Push', inbox: 'Kutu', email: 'E-posta' };
export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', critical: 'Kritik (yalnız sistem)' };
export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-slate-100 text-slate-700' },
  scheduled: { label: 'Planlı', cls: 'bg-indigo-100 text-indigo-700' },
  sending: { label: 'Gönderiliyor', cls: 'bg-amber-100 text-amber-800' },
  sent: { label: 'Gönderildi', cls: 'bg-emerald-100 text-emerald-800' },
  paused: { label: 'Duraklatıldı', cls: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
  failed: { label: 'Başarısız', cls: 'bg-red-100 text-red-700' },
};
export const DELIVERY_STATUS: Record<DeliveryStatus, { label: string; cls: string }> = {
  queued: { label: 'Kuyrukta', cls: 'bg-indigo-100 text-indigo-700' },
  sending: { label: 'Gönderiliyor', cls: 'bg-amber-100 text-amber-800' },
  sent: { label: 'Gönderildi', cls: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Başarısız', cls: 'bg-red-100 text-red-700' },
  suppressed: { label: 'Bastırıldı', cls: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Süresi doldu', cls: 'bg-slate-100 text-slate-500' },
};
export const REASON_LABEL: Record<string, string> = {
  kill_switch: 'Kill switch', environment: 'Ortam kapısı', account_inactive: 'Hesap pasif', duplicate: 'Tekrar (dedupe)',
  category_disabled: 'Kategori kapalı', channel_policy: 'Kanal politikası', no_consent: 'E-posta rızası yok', push_disabled: 'Push kapalı (kullanıcı)',
  cooldown: 'Cooldown', quiet_hours: 'Sessiz saat', quiet_hours_expired: 'Sessiz saat (ttl doldu)', decay_email_only: 'Sönüm: yalnız e-posta',
  decay_weekly: 'Sönüm: haftada 2', daily_cap: 'Günlük kapı', marketing_cap: 'Pazarlama kapısı', no_device: 'Cihaz yok', ttl: 'TTL doldu',
  campaign_cancelled: 'Kampanya iptal',
};

export type DeepLink = { target: string; params?: Record<string, string> };
export type Rule = { field: string; cmp: string; value?: unknown };
export type Group = { op: 'and' | 'or'; rules: (Rule | Group)[] };
export const isGroup = (n: Rule | Group): n is Group => 'op' in n;

export type Variant = {
  id: string; key: string; title: string; body: string; imageUrl: string | null; ctaLabel: string | null; deepLink: DeepLink;
  emailSubject: string | null; emailBody: string | null; templateId: string | null;
};
export type Campaign = {
  id: string; name: string; category: Category; priority: Priority; channels: Channel[]; audienceMode: AudienceMode;
  segmentId: string | null; segmentRulesSnapshot: Group | null; userIds: string[]; sendMode: SendMode; scheduledAt: string | null;
  conversionEvent: string | null; attributionWindowHours: number; respectQuietHours: boolean; countTowardCaps: boolean; ttlHours: number;
  createInAppBanner: boolean; status: CampaignStatus; estimatedRecipients: number | null; materializedRecipients: number; sentCount: number;
  failedCount: number; suppressedCount: number; materializedAt: string | null; startedAt: string | null; completedAt: string | null;
  cancelledAt: string | null; sentAt: string | null; createdAt: string; updatedAt: string;
  variant: Variant | null; variants: Variant[]; segment: { id: string; name: string } | null; warnings: Warning[];
};
export type Warning = { code: string; message: string };
export type Estimate = { total: number; push: number; inboxOnly: number; email: number; refreshedAt: string | null };
export type Preview = {
  estimate: Estimate;
  sample: { email: string; lastActiveDays: number | null; isPremium: boolean; platforms: string[] }[];
  rendered: { title: string; body: string; route: string; webPath: string; minAppVersion: string };
  warnings: Warning[]; segmentSummary: string | null;
};
export type Template = {
  id: string; code: string; name: string; category: Category; title: string; body: string; imageUrl: string | null; ctaLabel: string | null;
  deepLink: DeepLink; emailSubject: string | null; emailBody: string | null; variables: string[]; defaultPriority: Priority;
  status: 'active' | 'archived'; warnings: Warning[]; updatedAt: string;
};
export type Segment = {
  id: string; name: string; description: string | null; rules: Group; status: 'active' | 'archived'; lastCount: number | null;
  lastCountedAt: string | null; summary: string; updatedAt: string;
};
export type SegmentField = { type: 'number' | 'boolean' | 'uuid' | 'uuid_array' | 'string_array' | 'exists'; label: string };
export type Overview = {
  today: { channel: Channel; status: DeliveryStatus; count: number }[];
  openedToday: number; clickedToday: number; convertedToday: number;
  suppression: { reason: string | null; count: number }[];
  series: { day: string; sent: number; opened: number }[];
  scheduled: { id: string; name: string; status: CampaignStatus; scheduledAt: string | null; estimatedRecipients: number | null }[];
  killSwitch: boolean;
  environment: { setting: string; worker: string; ok: boolean; provider: string };
  audienceRefreshedAt: string | null; pendingQueue: number;
};
export type Analytics = {
  days: number;
  totals: { sent: number; failed: number; suppressed: number; opened: number; clicked: number; converted: number };
  byCategory: { key: string; sent: number; opened: number; clicked: number; converted: number; failed: number }[];
  byChannel: { key: string; sent: number; opened: number; clicked: number; converted: number; failed: number }[];
  byPlatform: { key: string; sent: number; opened: number; clicked: number; converted: number; failed: number }[];
  series: { day: string; sent: number; opened: number }[];
  hourly: { h: number; n: number }[];
  segments: { id: string; name: string; campaigns: number; sent: number }[];
};
export type HistoryItem = {
  id: string; queuedAt: string; sentAt: string | null; channel: Channel; status: DeliveryStatus; suppressionReason: string | null;
  errorCode: string | null; attempts: number; platform: string | null; user: string; source: string; title: string; category: Category;
  opened: boolean; clicked: boolean; converted: boolean;
};
export type Tester = { userId: string; email: string; displayName: string; devices: { platform: string; lastSeenAt: string; token: string }[]; addedAt: string };
export type AdminSettings = {
  values: Record<string, string | null>;
  defaults: { dailyCap: number; marketingDailyCap: number; decayWeeklyCap: number; retention: Record<string, number> };
  worker: { env: string; provider: string };
  retention: Record<string, number>;
};
export type LinkOptions = { targets: { target: string; param: string | null; minAppVersion: string }[]; options: { id: string; label: string }[] };
export const TARGET_LABEL: Record<string, string> = {
  home: 'Bugün (uygulamayı aç)', daily_question: 'Günün sorusu', question: 'Tek soru', exams: 'Denemeler listesi', exam: 'Deneme',
  exam_result: 'Deneme sonucu', leaderboard: 'Sıralama', review: 'Yanlış tekrarı', library: 'Kütüphane', legislation: 'Kanun metni',
  past_exam: 'Çıkmış sınavlar', statistics: 'Performans', plan: 'Planım', badges: 'Rozetler', membership: 'Üyelik',
  notifications: 'Bildirimler', settings_notifications: 'Bildirim tercihleri',
};

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const fmtInt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('tr-TR'));
export const pct = (a: number, b: number) => (b > 0 ? `%${((100 * a) / b).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—');

// ── F2: otomasyonlar ve sınav takvimi ──
export type AutomationStatus = 'draft' | 'active' | 'paused';
export type AutomationSchedule =
  | { kind: 'daily'; at: string }
  | { kind: 'weekly'; at: string; weekday: number }
  | { kind: 'user_time'; field: 'reminderTime'; offsetMinutes: number };
export type AutomationRun = {
  id: string; startedAt: string; finishedAt: string | null; triggerType: 'schedule' | 'event';
  evaluated: number; matched: number; queued: number; suppressed: number; error: string | null;
};
export type Automation = {
  id: string; code: string; name: string; description: string | null; category: Category; priority: Priority; channels: Channel[];
  triggerType: 'schedule' | 'event'; schedule: AutomationSchedule | Record<string, never>; eventType: string | null; delayMinutes: number;
  conditions: Group | Record<string, never>; title: string; body: string; ctaLabel: string | null; imageUrl: string | null; deepLink: DeepLink;
  emailSubject: string | null; emailBody: string | null; conversionEvent: string | null; attributionWindowHours: number;
  cooldownHours: number; maxPerUserPerDay: number; respectQuietHours: boolean; countTowardCaps: boolean; ttlHours: number;
  status: AutomationStatus; activatedAt: string | null; lastRunAt: string | null; consecutiveErrors: number; lastError: string | null;
  updatedAt: string;
  scheduleSummary: string; conditionsSummary: string; hasPayloadFilter: boolean; isPreset: boolean; policyChannels: Channel[]; warnings: Warning[];
  total7d?: number; sent7d?: number; opened7d?: number;
  lastRun?: { startedAt: string; queued: number; evaluated: number; error: string | null } | null;
  runs?: AutomationRun[];
};
export type AutomationPreview = {
  estimate: { total: number; pendingEvents: number; refreshedAt: string | null };
  sample: { email: string; lastActiveDays: number | null; streak: number; platforms: string[] }[];
  rendered: { title: string; body: string; emailSubject: string | null; route: string | null; webPath: string | null; minAppVersion: string | null; linkResolved: boolean };
  warnings: Warning[]; samplePayload: Record<string, unknown>;
  schedule: { due: boolean; fireAt: string | null } | null;
};
export type ExamCalendarItem = {
  id: string; examTypeId: string | null; name: string; examDate: string; countdownDays: number[]; isConfirmed: boolean; isActive: boolean;
  note: string | null; examType: { id: string; name: string } | null; updatedAt: string;
};
export const AUTOMATION_STATUS: Record<AutomationStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-slate-100 text-slate-600' },
  active: { label: 'Açık', cls: 'bg-emerald-100 text-emerald-800' },
  paused: { label: 'Kapalı', cls: 'bg-slate-200 text-slate-700' },
};
export const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
