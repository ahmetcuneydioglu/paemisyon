/**
 * Bilgi kartları (Doc 56) — web tipleri ve saf yardımcılar. Tipler backend
 * `flashcards.service.ts` yanıtlarıyla birebir; Expo `features/flashcards/queries.ts` ile aynı
 * sözleşme. Kilit, kuyruk sırası, öğrenme durumu ve günlük hedef sunucudan; web yalnız çizer.
 * Kaynak etiketi yanıtta yoktur.
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

/** Oda yanıtındaki sayım (`course-room.tools.flashcards`, konu satırı, `topic-room.flashcards`); null = satır çizilmez. */
export interface FlashcardRoomCounts {
  count: number;
  due: number;
  learned: number;
  locked: number;
}

export const FLASHCARD_SOURCES = ["course_room", "topic_room", "study_hub", "home_next", "home_route", "home_for_you", "notif", "summary"] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];
export function isFlashcardSource(v: string | undefined): v is FlashcardSource {
  return v != null && (FLASHCARD_SOURCES as readonly string[]).includes(v);
}

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

/** Mod sırası (öneri her zaman en üstte, birincil düğme olarak). */
export const FLASHCARD_MODE_ORDER: FlashcardMode[] = ["due", "new", "hard", "favorites", "all", "mixed"];
export function isFlashcardMode(v: string | undefined): v is FlashcardMode {
  return v != null && (FLASHCARD_MODE_ORDER as readonly string[]).includes(v);
}

export function modeCount(c: ModeCounts, m: FlashcardMode): number {
  return m === "due" ? c.due : m === "new" ? c.new : m === "hard" ? c.hard : m === "favorites" ? c.favorites : c.total;
}

/** Oda sayımı → mod sayımı (durum çubuğu için öğreniliyor = kalan). */
export function roomCountsToModeCounts(f: FlashcardRoomCounts): ModeCounts {
  return { total: f.count, learned: f.learned, learning: Math.max(0, f.count - f.learned), new: 0, due: f.due, hard: 0, favorites: 0, locked: f.locked };
}

/** Oda sayımı satır çizdirir mi: yayında kart ya da kilitli kart varsa. */
export function hasFlashcards(f: FlashcardRoomCounts | null | undefined): f is FlashcardRoomCounts {
  return f != null && (f.count > 0 || f.locked > 0);
}

/** Kapsamın tamamı kilitli (ücretsiz kullanıcı, premium kapsam). */
export function isLockedScope(f: FlashcardRoomCounts): boolean {
  return f.count === 0 && f.locked > 0;
}

/** Giriş satırı künyesi: "24 kart · 10 öğrenildi · 6 tekrar bekliyor". */
export function countsNote(c: Pick<ModeCounts, "total" | "learned" | "due" | "new">): string {
  const parts = [`${c.total} kart`];
  if (c.learned > 0) parts.push(`${c.learned} öğrenildi`);
  if (c.due > 0) parts.push(`${c.due} tekrar bekliyor`);
  else if (c.new > 0 && c.new < c.total) parts.push(`${c.new} yeni`);
  return parts.join(" · ");
}

/**
 * Oynatıcı adresi: kapsam + mod + kaynak; `scope` etiketi üst şeride gider. Kapsamsız adres
 * (Kütüphane "Kart tekrarı") sunucuda "Tüm kartlar" olur. `resume` kaldığın yeri açar; `nonce`
 * aynı sorguyla yeniden gidince oynatıcının yeniden kurulmasını sağlar (seans `n` ile aynı).
 */
export function kartlarHref(scope: FlashcardScope, mode: FlashcardMode, source?: FlashcardSource, label?: string, opts?: { resume?: boolean; nonce?: string | number }): string {
  const q = new URLSearchParams();
  if (scope.unitSlug) q.set("unitSlug", scope.unitSlug);
  else if (scope.topicId) q.set("topicId", scope.topicId);
  else if (scope.courseId) q.set("courseId", scope.courseId);
  q.set("mode", mode);
  if (source) q.set("source", source);
  if (label) q.set("scope", label);
  if (opts?.resume) q.set("resume", "1");
  if (opts?.nonce != null) q.set("n", String(opts.nonce));
  return `/kartlar?${q.toString()}`;
}

/** Oynatıcıdan "geldiğin yere dön": kaynak Bugün ise Bugün, yoksa kapsamın odası; kapsamsız Kütüphane. */
export function kartDonusHref(scope: FlashcardScope, source?: FlashcardSource): string {
  if (source && (source.startsWith("home_") || source === "notif")) return "/bugun";
  if (scope.unitSlug) return `/ozet/${scope.unitSlug}`;
  if (scope.topicId) return `/kutuphane/konu/${scope.topicId}`;
  if (scope.courseId) return `/kutuphane/ders/${scope.courseId}`;
  return "/kutuphane";
}

/** "yarın", "3 gün sonra", "bugün". */
export function relativeDay(iso: string, now = new Date()): string {
  const gun = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
  return gun <= 0 ? "bugün" : gun === 1 ? "yarın" : `${gun} gün sonra`;
}

/** Oturum sonu cümlesi: rakam konuşur (Doc 26 §1). */
export function sessionLine(s: FlashcardSessionSummary, now = new Date()): string {
  const pct = s.summary.knownPct;
  const sonraki = s.due.count > 0 ? `${s.due.count} kart tekrar bekliyor.` : s.due.nextAt ? `Sıradaki tekrar ${relativeDay(s.due.nextAt, now)}.` : "Tekrar kuyruğun boş.";
  return pct == null ? sonraki : `Kartların %${pct}'ini hatırladın. ${sonraki}`;
}

/** Oturum içi tekrar: "Tekrar" denen kart kuyruğun sonuna döner; turda en çok 2 görünüm (sunucuyla aynı). */
export const OTURUM_ICI_TEKRAR_EN_COK = 2;
export function requeueAgain<T extends { id: string }>(queue: readonly T[], card: T): T[] {
  const gorunme = queue.filter((c) => c.id === card.id).length;
  return gorunme >= OTURUM_ICI_TEKRAR_EN_COK ? [...queue] : [...queue, card];
}

/** Klavye: ← Tekrar · → Biliyorum · Boşluk/Enter çevir · F favori · Z geri al · Esc çıkış. */
export type KartKisayolu = "again" | "known" | "flip" | "bookmark" | "undo" | "exit" | null;
export function kartKisayolu(key: string): KartKisayolu {
  if (key === "ArrowLeft") return "again";
  if (key === "ArrowRight") return "known";
  if (key === " " || key === "Enter") return "flip";
  if (key === "Escape") return "exit";
  const low = key.toLocaleLowerCase("tr-TR");
  if (low === "f") return "bookmark";
  if (low === "z") return "undo";
  return null;
}

/** Bu tur sayaç satırı. */
export function tallyLine(known: number, again: number): string {
  return known + again === 0 ? "← Tekrar · → Biliyorum · Boşluk çevirir" : `Bu tur · ${known} biliyorum · ${again} tekrar`;
}
