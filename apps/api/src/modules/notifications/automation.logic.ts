import { BadRequestException } from '@nestjs/common';
import type { NotificationAudience } from '@prisma/client';
import type { AutomationDeepLink, AutomationSchedule } from './automation.presets';
import { isDeepLinkTarget, type DeepLink } from './deep-links';
import { trClock, TR_TZ } from './decision.logic';
import type { TemplateVars } from './template';

/** TR takvim günü anahtarı (YYYY-MM-DD) — günlük dedupe anahtarlarının parçası. */
export function trDayKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TR_TZ }).format(now);
}

/** TR haftanın günü: 1 = Pazartesi … 7 = Pazar. */
export function trWeekday(now: Date): number {
  const w = new Intl.DateTimeFormat('en-US', { timeZone: TR_TZ, weekday: 'short' }).format(now);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(w) + 1;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return ((h || 0) % 24) * 60 + (m || 0);
}

export function minutesToHhmm(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** Bugünün (TR) HH:MM anını mutlak zamana çevirir. */
export function trTodayAt(now: Date, hhmm: string): Date {
  const { h, m } = trClock(now);
  const delta = hhmmToMinutes(hhmm) - (h * 60 + m);
  const d = new Date(now.getTime() + delta * 60_000);
  d.setUTCSeconds(0, 0);
  return d;
}

/** Bir koşunun kaçırılmış sayılmadığı pencere: işçi yeniden başlasa da 90 dk içinde telafi eder. */
export const SCHEDULE_GRACE_MS = 90 * 60_000;

/**
 * Zamanlı otomasyon şimdi çalışmalı mı? `daily`/`weekly`: bugünkü an gelmiş, pencere aşılmamış ve
 * bu an için daha önce koşulmamış. `user_time`: her dakika aday (kullanıcı eşlemesi sorguda).
 */
export function scheduleDue(
  schedule: AutomationSchedule,
  lastRunAt: Date | null,
  now: Date,
): { due: boolean; fireAt: Date | null } {
  if (schedule.kind === 'user_time') {
    // Dakikada en çok bir koşu.
    const minute = new Date(now);
    minute.setUTCSeconds(0, 0);
    return { due: !lastRunAt || lastRunAt < minute, fireAt: minute };
  }
  if (schedule.kind === 'weekly' && trWeekday(now) !== schedule.weekday)
    return { due: false, fireAt: null };
  const fireAt = trTodayAt(now, schedule.at);
  const inWindow = now >= fireAt && now.getTime() - fireAt.getTime() < SCHEDULE_GRACE_MS;
  const alreadyRan = !!lastRunAt && lastRunAt >= fireAt;
  return { due: inWindow && !alreadyRan, fireAt };
}

/** `user_time` için şu dakikada hangi tercih saati tetiklenir (ofset geri alınır). */
export function userTimeTarget(now: Date, offsetMinutes: number): string {
  const { h, m } = trClock(now);
  return minutesToHhmm(h * 60 + m - offsetMinutes);
}

export function parseSchedule(input: unknown): AutomationSchedule | null {
  if (!input || typeof input !== 'object') return null;
  const s = input as Record<string, unknown>;
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (s.kind === 'daily') {
    if (typeof s.at !== 'string' || !hhmm.test(s.at))
      throw new BadRequestException('Takvim saati HH:MM olmalı.');
    return { kind: 'daily', at: s.at };
  }
  if (s.kind === 'weekly') {
    if (typeof s.at !== 'string' || !hhmm.test(s.at))
      throw new BadRequestException('Takvim saati HH:MM olmalı.');
    const wd = Number(s.weekday);
    if (!Number.isInteger(wd) || wd < 1 || wd > 7)
      throw new BadRequestException('Haftanın günü 1–7 olmalı.');
    return { kind: 'weekly', at: s.at, weekday: wd };
  }
  if (s.kind === 'user_time') {
    const off = Number(s.offsetMinutes ?? 0);
    if (!Number.isInteger(off) || off < -720 || off > 720)
      throw new BadRequestException('Ofset −720…720 dakika olmalı.');
    return { kind: 'user_time', field: 'reminderTime', offsetMinutes: off };
  }
  throw new BadRequestException('Takvim türü daily, weekly ya da user_time olmalı.');
}

export function scheduleSummary(s: AutomationSchedule | null): string {
  if (!s) return '—';
  if (s.kind === 'daily') return `Her gün ${s.at}`;
  if (s.kind === 'weekly')
    return `${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][s.weekday - 1]} ${s.at}`;
  const off = s.offsetMinutes;
  return off === 0
    ? 'Kullanıcının hatırlatma saati'
    : `Hatırlatma saati ${off > 0 ? '+' : '−'}${Math.abs(off)} dk`;
}

/** `$payload.alan` parametrelerini olay yükünden çözer; eksikse null (gönderim yapılmaz). */
export function resolveAutomationLink(
  link: AutomationDeepLink | Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>,
): DeepLink | null {
  if (!link || typeof link !== 'object') return null;
  const target = (link as { target?: unknown }).target;
  if (!isDeepLinkTarget(target)) return null;
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries((link as { params?: Record<string, string> }).params ?? {})) {
    if (typeof v === 'string' && v.startsWith('$payload.')) {
      const val = payload[v.slice('$payload.'.length)];
      if (val == null || val === '') return null;
      params[k] = String(val);
    } else params[k] = String(v);
  }
  return { target, params };
}

const num = (v: unknown): number | null =>
  v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const fmt = (v: unknown): string | null => {
  const n = num(v);
  return n == null ? null : n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
};

/**
 * Şablon değişkenleri: kitle satırı + olay yükü. Yük anahtarları (title, net, rank…) kısa Türkçe
 * değişken adlarına eşlenir; bilinmeyen anahtar yok sayılır (beyaz liste template.ts'te).
 */
export function automationVars(
  audience: Pick<
    NotificationAudience,
    'streakCurrent' | 'examDaysLeft' | 'answered7d' | 'accuracy30d' | 'dailyGoal' | 'answeredToday'
  > | null,
  payload: Record<string, unknown>,
  link: string | null,
): TemplateVars {
  const p = payload;
  return {
    streak: audience?.streakCurrent ?? null,
    sinava_kalan_gun: audience?.examDaysLeft ?? null,
    hafta_soru: audience?.answered7d ?? null,
    hafta_dogruluk: audience?.accuracy30d != null ? Math.round(Number(audience.accuracy30d)) : null,
    kalan_soru: audience ? Math.max(0, audience.dailyGoal - audience.answeredToday) : null,
    deneme_adi: (p.title as string | undefined) ?? (p.examTitle as string | undefined) ?? null,
    sinav_adi: (p.name as string | undefined) ?? (p.title as string | undefined) ?? null,
    net: fmt(p.net ?? p.score ?? p.after),
    onceki_net: fmt(p.before),
    sira: fmt(p.rank),
    soru_no: fmt(p.questionNo),
    kalan_soru_no: fmt(p.questionNo),
    soru_sayisi: fmt(p.questionCount),
    sure: fmt(p.durationMinutes),
    saat: (p.saat as string | undefined) ?? null,
    rakip: (p.rival as string | undefined) ?? null,
    gerekli_dogru: fmt(p.need),
    rozet: (p.badgeName as string | undefined) ?? (p.name as string | undefined) ?? null,
    sonuc: (p.message as string | undefined) ?? null,
    zayif_konu: (p.topicName as string | undefined) ?? null,
    gelisen_konu: (p.topicName as string | undefined) ?? null,
    link,
  };
}
