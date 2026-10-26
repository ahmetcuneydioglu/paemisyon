import { NotificationCategory, NotificationChannel } from '@prisma/client';

/**
 * Kategori = tercih anahtarı = analiz boyutu (Doc 52 §4.7). Kanal politikası
 * sabittir: `marketing` push alamaz (Doc 26: premium teklifi push ile yapılmaz),
 * `system` kapatılamaz, `achievement` ve `statistics` push göndermez.
 */
export type CategoryPolicy = {
  label: string;
  channels: readonly NotificationChannel[];
  /** Kullanıcı tercihle kapatabilir mi? */
  optional: boolean;
  /** E-posta kanalı için rıza konusu (EmailTopicPreference). */
  emailTopic: 'duyuru' | 'kampanya' | null;
  /** Günlük kategori: sessiz saatte ertesi güne ertelenmez, düşer (§6 kural 10). */
  dailyOnly: boolean;
};

export const CATEGORY_POLICY: Record<NotificationCategory, CategoryPolicy> = {
  daily_question: {
    label: 'Günün sorusu',
    channels: ['push', 'inbox'],
    optional: true,
    emailTopic: null,
    dailyOnly: true,
  },
  study_reminder: {
    label: 'Çalışma hatırlatması',
    channels: ['push'],
    optional: true,
    emailTopic: null,
    dailyOnly: true,
  },
  streak: {
    label: 'Seri',
    channels: ['push', 'inbox'],
    optional: true,
    emailTopic: null,
    dailyOnly: true,
  },
  exam: {
    label: 'Denemeler',
    channels: ['push', 'inbox', 'email'],
    optional: true,
    emailTopic: 'duyuru',
    dailyOnly: false,
  },
  exam_countdown: {
    label: 'Sınav geri sayımı',
    channels: ['push', 'inbox'],
    optional: true,
    emailTopic: null,
    dailyOnly: false,
  },
  new_content: {
    label: 'Yeni içerik',
    channels: ['push', 'inbox', 'email'],
    optional: true,
    emailTopic: 'duyuru',
    dailyOnly: false,
  },
  achievement: {
    label: 'Rozetler',
    channels: ['inbox'],
    optional: true,
    emailTopic: null,
    dailyOnly: false,
  },
  statistics: {
    label: 'Haftalık rapor',
    channels: ['inbox', 'email'],
    optional: true,
    emailTopic: 'duyuru',
    dailyOnly: false,
  },
  leaderboard: {
    label: 'Sıralama',
    channels: ['push', 'inbox'],
    optional: true,
    emailTopic: null,
    dailyOnly: true,
  },
  question_report: {
    label: 'Soru bildirimleri',
    channels: ['push', 'inbox'],
    optional: false,
    emailTopic: null,
    dailyOnly: false,
  },
  marketing: {
    label: 'Kampanyalar',
    channels: ['email'],
    optional: true,
    emailTopic: 'kampanya',
    dailyOnly: false,
  },
  system: {
    label: 'Sistem ve güvenlik',
    channels: ['push', 'inbox', 'email'],
    optional: false,
    emailTopic: 'duyuru',
    dailyOnly: false,
  },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_POLICY) as NotificationCategory[];

/** İstenen kanalları kategori politikasıyla kesiştirir; politika dışı kanal sessizce düşer. */
export function allowedChannels(
  category: NotificationCategory,
  requested: readonly NotificationChannel[] | undefined,
): NotificationChannel[] {
  const policy = CATEGORY_POLICY[category].channels;
  const want = requested && requested.length > 0 ? requested : policy;
  return policy.filter((c) => want.includes(c));
}

/** Tercih JSON'unda eksik anahtar = açık; `system` ve `question_report` kapatılamaz. */
export function categoryEnabled(
  category: NotificationCategory,
  categories: Record<string, unknown> | null | undefined,
): boolean {
  if (!CATEGORY_POLICY[category].optional) return true;
  const v = categories?.[category];
  return v == null ? true : v !== false;
}
