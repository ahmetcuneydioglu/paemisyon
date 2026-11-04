import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export const flashcardKeys = {
  all: ["flashcards"] as const,
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
  setBookmark: (flashcardId: string, on: boolean) => api<{ bookmarked: boolean }>(`/me/flashcards/bookmarks/${flashcardId}`, { method: on ? "POST" : "DELETE" }),
  preferences: (body: { dailyGoal?: number }) => api<{ dailyGoal: DailyGoal }>("/me/flashcards/preferences", { method: "PATCH", body }),
};

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
