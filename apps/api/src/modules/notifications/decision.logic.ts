import { NotificationCategory, NotificationChannel, NotificationPriority } from '@prisma/client';
import { CATEGORY_POLICY, categoryEnabled } from './notification.categories';

/**
 * Karar akışı (Doc 52 §6) — saf mantık; veri bağlamını DecisionService toplar.
 * Sıra kesindir, ilk eşleşen kural karar verir. Kanal başına sonuç:
 * send | defer(until) | drop(reason). `inbox` yazılır mı ayrı döner.
 */
/** Rıza hesabı için kişi görünümü (EmailContact'ın gerekli kısmı). */
export type EmailContactView = {
  status: string;
  /** Yalnız KAPALI (subscribed=false) konu tercihleri. */
  unsubscribedTopics: readonly string[];
};

/**
 * E-posta rızası (Doc 52 karar 2): rıza EmailContact'ta yaşar.
 *  - Kişi varsa: `subscribed` durumunda ve konu kapatılmamışsa rıza var.
 *  - Kişi YOKSA: hesap sahibi `duyuru` (hizmet) e-postaları için rızalı sayılır —
 *    gönderim katmanı (`EmailChannelService.consentedContact`) kişiyi zaten
 *    `live_user`/`signup` dayanağıyla açar; karar katmanı onunla aynı dili konuşur.
 *    `kampanya` için kişi şarttır (pazarlama rızası örtük verilmez).
 */
export function emailConsentFor(
  topic: 'duyuru' | 'kampanya' | null,
  contacts: readonly EmailContactView[],
): boolean {
  if (!topic) return false;
  if (contacts.length === 0) return topic === 'duyuru';
  const contact = contacts.find((c) => c.status === 'subscribed') ?? contacts[0];
  return contact.status === 'subscribed' && !contact.unsubscribedTopics.includes(topic);
}

/** Sönüm için "aktif" eşiği: son 7 günde bu kadar cevap (Doc 52/08). */
export const ACTIVE_ANSWERS_7D = 20;
/** Sönüm için "aktif" eşiği: son 3 günde en az bir cevap. */
export const ACTIVE_ANSWER_DAYS = 3;

export type EngagementSignals = {
  now: Date;
  /** Son 7 / 30 günde gönderilmiş (status=sent) push sayısı. */
  pushSent7d: number;
  pushSent30d: number;
  /** Son push açma/tıklama olayı (`notification_events` opened/clicked). */
  lastPushOpenedAt: Date | null;
  /** Son 7 günde verilen cevap sayısı ve son cevap anı (quiz_answers). */
  answered7d: number;
  lastAnsweredAt: Date | null;
};

/**
 * Sönüm katmanı (Doc 24 §7 madde 6): "7 gün cevapsızsa haftada 2'ye düşer,
 * 30 gün sonra yalnız haftalık e-posta." Cevap = push açma/tıklama YA DA
 * uygulama içi etkinlik: uygulamada soru çözen kullanıcı ürüne cevap
 * vermektedir; push'u açmaması sönüm değil kanal tercihidir (10 Kas 2026
 * bulgusu — günde 105 soru çözen kullanıcı tier 2'ye düşmüştü).
 * Kitle SQL'indeki CASE (audience.service.ts) bu fonksiyonun aynısıdır.
 *  0 normal · 1 haftada `decayWeeklyCap` push · 2 yalnız e-posta/kutu.
 */
export function engagementTierFor(s: EngagementSignals): 0 | 1 | 2 {
  const day = 86_400_000;
  const t = s.now.getTime();
  const activeRecently =
    s.answered7d >= ACTIVE_ANSWERS_7D ||
    (s.lastAnsweredAt !== null && t - s.lastAnsweredAt.getTime() <= ACTIVE_ANSWER_DAYS * day);
  if (activeRecently) return 0;
  const openedWithin = (days: number) =>
    s.lastPushOpenedAt !== null && t - s.lastPushOpenedAt.getTime() <= days * day;
  if (s.pushSent30d >= 5 && !openedWithin(30)) return 2;
  if (s.pushSent7d >= 5 && !openedWithin(7)) return 1;
  return 0;
}

export type ChannelDecision =
  { action: 'send' } | { action: 'defer'; until: Date } | { action: 'drop'; reason: string };

export type DecisionInput = {
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  respectQuietHours: boolean;
  countTowardCaps: boolean;
  ttlHours: number;
  /** Otomasyon cooldown içinde mi (F2; F1'de false). */
  cooldownActive: boolean;
};

export type DecisionContext = {
  now: Date;
  killSwitch: boolean;
  environmentOk: boolean;
  accountActive: boolean;
  duplicate: boolean;
  settings: {
    categories: Record<string, unknown> | null;
    quietStart: string; // 'HH:MM' TR
    quietEnd: string;
    pushEnabled: boolean;
  };
  emailConsent: boolean;
  hasActiveDevice: boolean;
  sentToday: number; // kapıya sayılan (system dışı) push bildirimleri, TR günü
  marketingSentToday: number;
  dailyCap: number;
  marketingDailyCap: number;
  engagementTier: number; // 0 · 1 · 2
  pushesThisWeek: number;
  decayWeeklyCap: number;
};

export type Decision = {
  /** Hiçbir şey yazılmaz (kutu dahil). */
  dropAll: string | null;
  inbox: boolean;
  channels: Partial<Record<NotificationChannel, ChannelDecision>>;
  /** Kutu satırının scheduledAt'i (erteleme varsa en erken erteleme anı). */
  scheduledAt: Date;
  priority: NotificationPriority;
};

export const TR_TZ = 'Europe/Istanbul';

/** Verilen anın TR saat/dakikası. */
export function trClock(d: Date): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { h, m };
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h % 24) * 60 + (m || 0);
}

/** Sessiz saat içinde mi? Aralık gece yarısını aşabilir (23:00–08:00). */
export function inQuietHours(now: Date, start: string, end: string): boolean {
  const s = minutes(start);
  const e = minutes(end);
  if (s === e) return false;
  const { h, m } = trClock(now);
  const cur = h * 60 + m;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

/** Sessiz saatin bittiği bir sonraki an (TR saatiyle `end`). */
export function quietHoursEnd(now: Date, end: string): Date {
  const e = minutes(end);
  const { h, m } = trClock(now);
  const cur = h * 60 + m;
  let delta = e - cur;
  if (delta <= 0) delta += 24 * 60;
  const d = new Date(now.getTime() + delta * 60_000);
  d.setUTCSeconds(0, 0);
  return d;
}

export function decide(input: DecisionInput, ctx: DecisionContext): Decision {
  const base: Decision = {
    dropAll: null,
    inbox: false,
    channels: {},
    scheduledAt: ctx.now,
    priority: input.priority,
  };
  // 1–4: tümünü düşüren kapılar
  if (ctx.killSwitch) return { ...base, dropAll: 'kill_switch' };
  if (!ctx.environmentOk) return { ...base, dropAll: 'environment' };
  if (!ctx.accountActive) return { ...base, dropAll: 'account_inactive' };
  if (ctx.duplicate) return { ...base, dropAll: 'duplicate' };

  // 5: critical yalnız system; başka kategoride high'a iner
  let priority = input.priority;
  if (priority === 'critical' && input.category !== 'system') priority = 'high';
  const critical = priority === 'critical';

  const policy = CATEGORY_POLICY[input.category];
  const requested = input.channels.filter((c) => policy.channels.includes(c));
  const wantsInbox = input.channels.includes('inbox');

  // 6–7: kanal politikası ve kategori tercihi
  const enabled = critical || categoryEnabled(input.category, ctx.settings.categories);
  if (!enabled) {
    const channels: Decision['channels'] = {};
    for (const c of input.channels) channels[c] = { action: 'drop', reason: 'category_disabled' };
    return { ...base, priority, channels, inbox: false };
  }
  for (const c of input.channels)
    if (!policy.channels.includes(c))
      base.channels[c] = { action: 'drop', reason: 'channel_policy' };

  const out: Decision = {
    ...base,
    priority,
    inbox: wantsInbox && policy.channels.includes('inbox'),
  };
  let deferUntil: Date | null = null;
  const defer = (until: Date) => {
    deferUntil = deferUntil && deferUntil < until ? deferUntil : until;
  };

  for (const c of requested) {
    if (c === 'inbox') {
      out.channels.inbox = { action: 'send' };
      continue;
    }
    if (critical) {
      out.channels[c] =
        c === 'push' && !ctx.hasActiveDevice
          ? { action: 'drop', reason: 'no_device' }
          : { action: 'send' };
      continue;
    }
    // 8: e-posta rızası
    if (c === 'email' && !ctx.emailConsent) {
      out.channels.email = { action: 'drop', reason: 'no_consent' };
      continue;
    }
    if (c === 'push' && !ctx.settings.pushEnabled) {
      out.channels.push = { action: 'drop', reason: 'push_disabled' };
      continue;
    }
    // 9: cooldown
    if (input.cooldownActive) {
      out.channels[c] = { action: 'drop', reason: 'cooldown' };
      continue;
    }
    // 10: sessiz saat (yalnız push; e-posta sessiz saatten etkilenmez)
    if (
      c === 'push' &&
      input.respectQuietHours &&
      inQuietHours(ctx.now, ctx.settings.quietStart, ctx.settings.quietEnd)
    ) {
      const until = quietHoursEnd(ctx.now, ctx.settings.quietEnd);
      const withinTtl = until.getTime() - ctx.now.getTime() <= input.ttlHours * 3_600_000;
      if (policy.dailyOnly) {
        out.channels.push = { action: 'drop', reason: 'quiet_hours' };
        continue;
      }
      if (priority === 'high' || withinTtl) {
        out.channels.push = { action: 'defer', until };
        defer(until);
        continue;
      }
      out.channels.push = { action: 'drop', reason: 'quiet_hours_expired' };
      continue;
    }
    // 10a: sönüm (Doc 24) — yalnız push; kullanıcının kendi eylemine yanıt
    // olan kategoriler (question_report) ve system muaf (policy.decayExempt).
    if (c === 'push' && !policy.decayExempt && ctx.engagementTier >= 2) {
      out.channels.push = { action: 'drop', reason: 'decay_email_only' };
      continue;
    }
    if (
      c === 'push' &&
      !policy.decayExempt &&
      ctx.engagementTier === 1 &&
      ctx.pushesThisWeek >= ctx.decayWeeklyCap
    ) {
      out.channels.push = { action: 'drop', reason: 'decay_weekly' };
      continue;
    }
    // 11: günlük kapı (push)
    if (
      c === 'push' &&
      input.countTowardCaps &&
      input.category !== 'system' &&
      ctx.sentToday >= ctx.dailyCap
    ) {
      if (priority === 'high') {
        /* kapıyı aşar */
      } else if (priority === 'normal' && input.ttlHours >= 24 && !policy.dailyOnly) {
        const until = nextDayStart(ctx.now);
        out.channels.push = { action: 'defer', until };
        defer(until);
        continue;
      } else {
        out.channels.push = { action: 'drop', reason: 'daily_cap' };
        continue;
      }
    }
    // 12: pazarlama günlük kapısı (e-posta)
    if (input.category === 'marketing' && ctx.marketingSentToday >= ctx.marketingDailyCap) {
      out.channels[c] = { action: 'drop', reason: 'marketing_cap' };
      continue;
    }
    // 13: cihaz yok
    if (c === 'push' && !ctx.hasActiveDevice) {
      out.channels.push = { action: 'drop', reason: 'no_device' };
      continue;
    }
    out.channels[c] = { action: 'send' };
  }
  if (deferUntil) out.scheduledAt = deferUntil as Date;
  return out;
}

/** Ertesi TR günü 08:00 (sessiz saat bitimiyle aynı varsayılan). */
export function nextDayStart(now: Date): Date {
  const { h, m } = trClock(now);
  const cur = h * 60 + m;
  const target = 8 * 60;
  let delta = target - cur;
  if (delta <= 0) delta += 24 * 60;
  const d = new Date(now.getTime() + delta * 60_000);
  d.setUTCSeconds(0, 0);
  return d;
}

export const SUPPRESSION_REASONS = [
  'kill_switch',
  'environment',
  'account_inactive',
  'duplicate',
  'category_disabled',
  'channel_policy',
  'no_consent',
  'push_disabled',
  'cooldown',
  'quiet_hours',
  'quiet_hours_expired',
  'decay_email_only',
  'decay_weekly',
  'daily_cap',
  'marketing_cap',
  'no_device',
] as const;
