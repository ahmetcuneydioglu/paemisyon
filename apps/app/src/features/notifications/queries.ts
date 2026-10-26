import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { api } from "@/lib/api";
import { appVersion, versionAtLeast } from "@/lib/app-meta";
import { queryClient } from "@/lib/query";

/**
 * Aday bildirim kutusu ve tercihleri (Doc 52 §9–10). API: /me/notifications/*. Kural sunucuda;
 * istemci yalnız listeler, olay yazar ve tercih düzenler. Web karşılığı apps/web/src/lib/notifications.ts
 * (aynı tipler, aynı gruplama).
 */
export type NotificationCategory =
  | "daily_question"
  | "study_reminder"
  | "streak"
  | "exam"
  | "exam_countdown"
  | "new_content"
  | "achievement"
  | "statistics"
  | "leaderboard"
  | "question_report"
  | "marketing"
  | "system";

export interface InboxItem {
  id: string;
  category: NotificationCategory;
  priority: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  route: string | null;
  webPath: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  openedAt: string | null;
  scheduledAt: string;
  createdAt: string;
}

export interface InboxPage {
  items: InboxItem[];
  nextCursor: string | null;
}

export interface NotificationSettings {
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
}

export type SettingsPatch = Partial<Pick<NotificationSettings, "reminderTime" | "quietStart" | "quietEnd" | "pushEnabled" | "smartTimingEnabled">> & {
  categories?: Partial<Record<NotificationCategory, boolean>>;
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
export const QUIET_START_PRESETS = ["21:00", "22:00", "23:00", "00:00"] as const;
export const QUIET_END_PRESETS = ["06:00", "07:00", "08:00", "09:00"] as const;

export const notificationKeys = {
  all: ["me", "notifications"] as const,
  unread: ["me", "notifications", "unread"] as const,
  inbox: (unreadOnly: boolean) => ["me", "notifications", "inbox", unreadOnly] as const,
  settings: ["me", "notifications", "settings"] as const,
};

/** Zil rozeti: 60 sn bayatlar, odakta ve push gelince `invalidateUnread` ile tazelenir. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => api<{ count: number }>("/me/notifications/unread-count"),
    enabled,
    staleTime: 60_000,
    select: (r) => r.count,
  });
}

export function invalidateUnread() {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
}

export function useInbox(unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.inbox(unreadOnly),
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: "30" });
      if (unreadOnly) qs.set("unreadOnly", "true");
      if (pageParam) qs.set("cursor", pageParam);
      return api<InboxPage>(`/me/notifications?${qs.toString()}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings,
    queryFn: () => api<NotificationSettings>("/me/notifications/settings"),
  });
}

/** İyimser: anahtar anında döner; sunucu reddederse eski değere geri alınır. */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api<NotificationSettings>("/me/notifications/settings", { method: "PATCH", body: patch }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings });
      const previous = qc.getQueryData<NotificationSettings>(notificationKeys.settings);
      if (previous) {
        qc.setQueryData<NotificationSettings>(notificationKeys.settings, {
          ...previous,
          ...patch,
          categories: { ...previous.categories, ...(patch.categories ?? {}) },
        });
      }
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(notificationKeys.settings, ctx.previous);
    },
    onSuccess: (r) => qc.setQueryData(notificationKeys.settings, r),
  });
}

export function useReadAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true; count: number }>("/me/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(notificationKeys.unread, { count: 0 });
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Olay yazımı (opened: push dokunuşu · clicked: kutuda satır · dismissed: kapat). Sunucu
 * opened/clicked'ı okundu da sayar; rozet yerelde düşürülür, ağ hatası sessiz geçer.
 */
export async function recordNotificationEvent(id: string, type: "opened" | "clicked" | "dismissed", source: "push" | "inbox", payload?: Record<string, unknown>): Promise<void> {
  if (type !== "dismissed") markReadLocally(id);
  try {
    await api(`/me/notifications/${id}/events`, {
      method: "POST",
      body: { type, source, platform: Platform.OS, appVersion: appVersion(), ...(payload ? { payload } : {}) },
    });
  } catch {
    // Olay kaydı en iyi çaba; yönlendirme bundan bağımsız sürer.
  } finally {
    invalidateUnread();
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }
}

type InboxCache = { pages: InboxPage[]; pageParams: unknown[] };

/** Kutu ve rozet önbelleğinde satırı hemen okundu işaretler (sunucu yanıtı beklenmez). */
function markReadLocally(id: string) {
  const unread = queryClient.getQueryData<{ count: number }>(notificationKeys.unread);
  let wasUnread = false;
  const now = new Date().toISOString();
  for (const flag of [false, true]) {
    queryClient.setQueryData<InboxCache>(notificationKeys.inbox(flag), (cache) => {
      if (!cache) return cache;
      return {
        ...cache,
        pages: cache.pages.map((p) => ({
          ...p,
          items: p.items.map((it) => {
            if (it.id !== id || it.readAt) return it;
            wasUnread = true;
            return { ...it, readAt: now };
          }),
        })),
      };
    });
  }
  if (unread && unread.count > 0 && (wasUnread || !queryClient.getQueryData(notificationKeys.inbox(false)))) {
    queryClient.setQueryData(notificationKeys.unread, { count: unread.count - 1 });
  }
}

/** Bu bildirim bu sürümde açılabilir mi? (`data.minAppVersion` sunucudan; yoksa açılır.) */
export function needsUpdate(item: Pick<InboxItem, "data">): boolean {
  const min = item.data?.minAppVersion;
  return typeof min === "string" && !versionAtLeast(appVersion(), min);
}

/** Göreli zaman: "şimdi", "12 dk", "3 sa", "Dün", "Pzt", "20 Eki" (web ile aynı kurallar). */
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface InboxGroup {
  label: string;
  items: InboxItem[];
}

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
    if (sameDay(t, now)) groups[0]!.items.push(it);
    else if (sameDay(t, yesterday)) groups[1]!.items.push(it);
    else if (days < 7) groups[2]!.items.push(it);
    else groups[3]!.items.push(it);
  }
  return groups.filter((g) => g.items.length > 0);
}
