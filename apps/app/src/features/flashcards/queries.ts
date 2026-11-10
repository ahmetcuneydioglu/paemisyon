import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { homeKeys } from "@/features/home/queries";

/**
 * Bilgi kartları (Doc 56) — tipler backend `flashcards.service.ts` yanıtlarıyla birebir; web
 * `apps/web/src/lib/kartlar.ts` ile aynı sözleşme. Kilit, kuyruk sırası, öğrenme durumu ve günlük
 * hedef sunucudan; istemci yalnız çizer ve puanı iletir. Kaynak etiketi yanıtta yoktur.
 */
export type FlashcardKind = "qa" | "cloze" | "numeric" | "trap";
export type FlashcardRating = "again" | "known" | "easy";
export type FlashcardMode = "due" | "new" | "hard" | "favorites" | "all" | "mixed";
export type LearningState = "new" | "learning" | "learned";

export interface CardState {
  state: LearningState;
  due: boolean;
  hard: boolean;
  dueAt: string | null;
}

export interface Flashcard {
  id: string;
  kind: FlashcardKind;
  front: string;
  back: string;
  explanation: string | null;
  difficulty: number;
  topic: { id: string; name: string };
  unit: { slug: string; title: string } | null;
  /** Madde rozetleri (ArticlePeek): kamuya açık madde; kitap/sınav etiketi değil. */
  articles: { no: string; title: string | null; legislationSlug: string | null }[];
  bookmarked: boolean;
  state: CardState;
}

export interface ModeCounts {
  total: number;
  new: number;
  learning: number;
  learned: number;
  due: number;
  hard: number;
  favorites: number;
  /** Kilitli (premium) kartlar sayımlara girmez; yalnız burada. */
  locked: number;
}

export interface FlashcardScope {
  courseId?: string;
  topicId?: string;
  unitSlug?: string;
}

export interface DailyGoal {
  target: number;
  done: number;
}

export interface FlashcardOverview {
  scope: { courseId: string | null; topicId: string | null; unitSlug: string | null; label: string };
  counts: ModeCounts;
  /** Kapsamın tamamı kilitli (ücretsiz kullanıcı, premium ünite/konu). */
  locked: boolean;
  suggestedMode: FlashcardMode;
  dailyGoal: DailyGoal;
  /** Günlük kart hakkı (Doc 56 §3h): `limit` null = sınırsız (Premium ya da ayar 0). Eski sunucuda yok. */
  dailyLimit?: { limit: number | null; used: number; remaining: number | null };
  resume: { sessionId: string; mode: FlashcardMode; remaining: number } | null;
}

export interface FlashcardSession {
  sessionId: string;
  mode: FlashcardMode;
  scope: { courseId: string | null; topicId: string | null; unitSlug: string | null; label?: string };
  cards: Flashcard[];
  total: number;
  counts?: ModeCounts;
  /** Sürdürülen oturumda: kaç kart görüldü. */
  cursor?: number;
}

export interface FlashcardEventResult {
  state: CardState;
  idempotent: boolean;
  requeued: boolean;
  remaining?: number;
  dailyGoal: DailyGoal;
}

export interface FlashcardSessionSummary {
  sessionId: string;
  summary: { reviewed: number; known: number; again: number; uniqueCards: number; knownPct: number | null };
  due: { count: number; nextAt: string | null };
  dailyGoal: DailyGoal;
}

export type FlashcardSource = "course_room" | "topic_room" | "study_hub" | "home_next" | "home_route" | "home_for_you" | "notif" | "summary";

/** Performans bloğu (`GET /me/flashcards/stats`): kapsamsız sayımlar, ders dağılımı, son 7 gün, 30 günlük oran. */
export interface FlashcardStats {
  counts: ModeCounts;
  dailyGoal: DailyGoal;
  last30: { reviewed: number; known: number; knownPct: number | null };
  last7: { date: string; reviewed: number; known: number }[];
  courses: { courseId: string; courseName: string; total: number; learned: number; learning: number; due: number; locked: number }[];
}

export const flashcardKeys = {
  all: ["flashcards"] as const,
  stats: ["flashcards", "stats"] as const,
  overview: (s: FlashcardScope) => ["flashcards", "overview", s.unitSlug ?? null, s.topicId ?? null, s.courseId ?? null] as const,
  bookmarks: ["flashcards", "bookmarks"] as const,
};

function scopeQuery(s: FlashcardScope): string {
  const q = new URLSearchParams();
  if (s.unitSlug) q.set("unitSlug", s.unitSlug);
  else if (s.topicId) q.set("topicId", s.topicId);
  else if (s.courseId) q.set("courseId", s.courseId);
  return q.toString();
}

export const flashcardsApi = {
  overview: (s: FlashcardScope) => api<FlashcardOverview>(`/me/flashcards/overview?${scopeQuery(s)}`),
  start: (body: { scope: FlashcardScope; mode: FlashcardMode; limit?: number; source?: FlashcardSource }) => api<FlashcardSession>("/me/flashcards/sessions", { method: "POST", body }),
  resume: () => api<FlashcardSession | null>("/me/flashcards/sessions/resume"),
  event: (sessionId: string, body: { clientEventId: string; flashcardId: string; rating: FlashcardRating; timeSpentMs?: number }) =>
    api<FlashcardEventResult>(`/me/flashcards/sessions/${sessionId}/events`, { method: "POST", body }),
  undo: (sessionId: string, clientEventId: string) => api<{ state: CardState; idempotent: boolean }>(`/me/flashcards/sessions/${sessionId}/events/${clientEventId}/undo`, { method: "POST" }),
  complete: (sessionId: string) => api<FlashcardSessionSummary>(`/me/flashcards/sessions/${sessionId}/complete`, { method: "POST" }),
  bookmarks: () => api<Flashcard[]>("/me/flashcards/bookmarks"),
  /** İlerlemeyi sıfırla (Doc 56 §3g): kapsamdaki SRS durumu silinir, favoriler ve geçmiş korunur. */
  resetProgress: (scope: FlashcardScope) => api<{ reset: number; scope: { label: string } }>("/me/flashcards/progress/reset", { method: "POST", body: scope }),
  /** Kart hata bildirimi (Doc 56 §3f): aynı karta açık bildirim varsa `alreadyReported`. */
  report: (flashcardId: string, message: string) => api<{ id: string; alreadyReported: boolean }>(`/me/flashcards/${flashcardId}/report`, { method: "POST", body: { message } }),
  setBookmark: (flashcardId: string, on: boolean) => api<{ bookmarked: boolean }>(`/me/flashcards/bookmarks/${flashcardId}`, { method: on ? "POST" : "DELETE" }),
  preferences: (body: { dailyGoal?: number }) => api<{ dailyGoal: DailyGoal }>("/me/flashcards/preferences", { method: "PATCH", body }),
  stats: () => api<FlashcardStats>("/me/flashcards/stats"),
};

/** Performans bloğu; kartlar kapalıyken 404 → hata, blok çizilmez (yeniden deneme yok). */
export function useFlashcardStats() {
  return useQuery({ queryKey: flashcardKeys.stats, queryFn: flashcardsApi.stats, retry: false, staleTime: 30_000 });
}

/** Günlük kart hedefi (Ben › Ayarlar); profil, Bugün ve kart sorguları tazelenir. */
export function useSetFlashcardDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dailyGoal: number) => flashcardsApi.preferences({ dailyGoal }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
      void qc.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useFlashcardOverview(scope: FlashcardScope | null) {
  return useQuery({
    queryKey: flashcardKeys.overview(scope ?? {}),
    queryFn: () => flashcardsApi.overview(scope!),
    enabled: scope != null && Boolean(scope.unitSlug || scope.topicId || scope.courseId),
  });
}

export function useFlashcardBookmarks() {
  return useQuery({ queryKey: flashcardKeys.bookmarks, queryFn: flashcardsApi.bookmarks });
}

export function useSetFlashcardBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ flashcardId, on }: { flashcardId: string; on: boolean }) => flashcardsApi.setBookmark(flashcardId, on),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: flashcardKeys.bookmarks });
      void qc.invalidateQueries({ queryKey: ["flashcards", "overview"] });
    },
  });
}

/** Mod etiketleri: sayı ve sıra sunucudan, sözcükler burada (web ile aynı). */
export const FLASHCARD_MODE: Record<FlashcardMode, { title: string; subtitle: string }> = {
  due: { title: "Tekrar zamanı gelenler", subtitle: "Vadesi geçen kartlar, en eski önce" },
  new: { title: "Yeni kartlar", subtitle: "Henüz görmediklerin" },
  hard: { title: "Zorlandıklarım", subtitle: "Son turda “Tekrar” dediklerin" },
  favorites: { title: "Favorilerim", subtitle: "Kaydettiklerin" },
  all: { title: "Tüm kartlar", subtitle: "Vade → yeni → kalan sırasıyla" },
  mixed: { title: "Karışık çalış", subtitle: "Rastgele 20 kart" },
};

export const FLASHCARD_KIND_LABEL: Record<FlashcardKind, string> = {
  qa: "Kavram",
  cloze: "Boşluk",
  numeric: "Sayı",
  trap: "Tuzak",
};

/** Modun kaç kart sunduğu (karışık: tüm açık kartlar). */
export function modeCount(c: ModeCounts, m: FlashcardMode): number {
  return m === "due" ? c.due : m === "new" ? c.new : m === "hard" ? c.hard : m === "favorites" ? c.favorites : c.total;
}

/** Giriş satırı künyesi: "24 kart · 10 öğrenildi · 6 tekrar bekliyor". */
export function countsNote(c: ModeCounts): string {
  const parts = [`${c.total} kart`];
  if (c.learned > 0) parts.push(`${c.learned} öğrenildi`);
  if (c.due > 0) parts.push(`${c.due} tekrar bekliyor`);
  else if (c.new > 0 && c.new < c.total) parts.push(`${c.new} yeni`);
  return parts.join(" · ");
}

/** Oturum sonu cümlesi: rakam konuşur (Doc 26 §1). */
export function sessionLine(s: FlashcardSessionSummary): string {
  const pct = s.summary.knownPct;
  const sonraki = s.due.count > 0 ? `${s.due.count} kart tekrar bekliyor.` : s.due.nextAt ? `Sıradaki tekrar ${relativeDay(s.due.nextAt)}.` : "Tekrar kuyruğun boş.";
  return pct == null ? sonraki : `Kartların %${pct}'ini hatırladın. ${sonraki}`;
}

/** "yarın", "3 gün sonra", "bugün". */
export function relativeDay(iso: string, now = new Date()): string {
  const gun = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
  return gun <= 0 ? "bugün" : gun === 1 ? "yarın" : `${gun} gün sonra`;
}
