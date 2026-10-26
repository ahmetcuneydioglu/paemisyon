/**
 * Aday bildirim kutusu ve tercihleri (Doc 52 §9–10). API: /me/notifications/*.
 * Web yalnız API tüketir; kural sunucuda.
 */
export type NotificationCategory =
  | "daily_question" | "study_reminder" | "streak" | "exam" | "exam_countdown" | "new_content"
  | "achievement" | "statistics" | "leaderboard" | "question_report" | "marketing" | "system";

export type InboxItem = {
  id: string;
  category: NotificationCategory;
  priority: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  route: string | null;
  webPath: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  openedAt: string | null;
  scheduledAt: string;
  createdAt: string;
};

export type InboxPage = { items: InboxItem[]; nextCursor: string | null };

export type NotificationSettings = {
  categories: Record<NotificationCategory, boolean>;
  reminderTime: string;
  quietStart: string;
  quietEnd: string;
  timezone: string;
  pushEnabled: boolean;
  smartTimingEnabled: boolean;
  email: {
    subscribed: boolean;
    status: string;
    topics: { duyuru: boolean; kampanya: boolean };
    preferencesUrl: string;
  } | null;
  devices: { platform: string; lastSeenAt: string }[];
  policy: Record<NotificationCategory, { label: string; optional: boolean; channels: string[] }>;
};

export const CATEGORY_HINT: Record<NotificationCategory, string> = {
  daily_question: "Her sabah 09.00, tek soru",
  study_reminder: "Hedef dolmadıysa seçtiğin saatte",
  streak: "Serin bozulmadan 2 saat önce",
  exam: "Yayın, hatırlatma, sonuç, net güncellemesi",
  exam_countdown: "60 · 30 · 14 · 7 · 3 · 1 gün",
  new_content: "Çıkmış sorular, yeni kanun metinleri",
  achievement: "Yalnız uygulama içinde",
  statistics: "Pazartesi 09.00 · e-posta ve kutu",
  leaderboard: "Akşam 20.30, günde bir",
  question_report: "Bildirdiğin soru sonuçlanınca",
  marketing: "Yalnız e-posta; ayrı rıza",
  system: "Hesap, bakım, güvenlik · kapatılamaz",
};

export const REMINDER_PRESETS = ["07:00", "12:00", "19:00", "21:00", "23:00"] as const;

/** Göreli zaman: "şimdi", "12 dk", "3 sa", "Dün", "Pzt", "20 Eki". */
export function relativeTime(iso: string, now = new Date()): string {
  const t = new Date(iso);
  const diffMin = Math.round((now.getTime() - t.getTime()) / 60_000);
  if (diffMin < 1) return "şimdi";
  if (diffMin < 60) return `${diffMin} dk`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24 && sameDay(t, now)) return `${diffH} sa`;
  if (sameDay(t, new Date(now.getTime() - 86_400_000))) return "Dün";
  const diffD = Math.round((now.getTime() - t.getTime()) / 86_400_000);
  if (diffD < 7) return new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(t);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(t);
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export type InboxGroup = { label: string; items: InboxItem[] };

/** Gün grupları (Figma: BUGÜN · DÜN · BU HAFTA · DAHA ÖNCE). */
export function groupInbox(items: InboxItem[], now = new Date()): InboxGroup[] {
  const groups: InboxGroup[] = [
    { label: "Bugün", items: [] },
    { label: "Dün", items: [] },
    { label: "Bu hafta", items: [] },
    { label: "Daha önce", items: [] },
  ];
  const yesterday = new Date(now.getTime() - 86_400_000);
  for (const it of items) {
    const t = new Date(it.scheduledAt);
    const days = (now.getTime() - t.getTime()) / 86_400_000;
    if (sameDay(t, now)) groups[0].items.push(it);
    else if (sameDay(t, yesterday)) groups[1].items.push(it);
    else if (days < 7) groups[2].items.push(it);
    else groups[3].items.push(it);
  }
  return groups.filter((g) => g.items.length > 0);
}

/** Web yolu güvenli mi? Yalnız uygulama içi göreli yol. */
export function safeWebPath(p: string | null | undefined): string {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.includes("\\")) return "/bugun";
  return p;
}
