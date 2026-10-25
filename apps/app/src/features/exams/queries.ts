import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizOption } from "@/features/quiz/api";

/**
 * Denemeler (exams.controller, past-exams.controller, public cikmis-sinavlar) — Doc 50 sözleşmesi.
 * Pencere, premium, katılım, rol ve hak kuralları SUNUCUDA; istemci `availability`, `myState`,
 * `canStart*` ve hata kodlarını çizer. Cevap ve bitirme canlı denemede de /quiz/sessions üstünden
 * gider (tek oynatıcı).
 */
export type ExamState = "upcoming" | "active" | "ended";
export type ExamPublishMode = "serbest" | "takvimli";
export type ExamAvailability = "upcoming" | "open" | "closed";
export type MyExamState = "new" | "in_progress" | "completed";
export type AttemptRole = "official" | "practice";
export type ExamDifficulty = "kolay" | "orta" | "zor";

export interface ExamListItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  questionCount: number;
  isPremium: boolean;
  questionsOpenAfterEnd: boolean;
  archiveOpenAfterEnd: boolean;
  state: ExamState;
  participantCount: number;
  avgScore: number | null;
  myAttempt: { id: string; status: "in_progress" | "completed" | "abandoned" } | null;
  myArchiveAttempt: { id: string; status: "completed"; correctCount: number; wrongCount: number; blankCount: number; completedAt: string | null } | null;
  // Doc 50
  publishMode: ExamPublishMode;
  difficulty: ExamDifficulty | null;
  examTypeId: string | null;
  liveAnswerReveal: boolean;
  practiceAfterEnd: boolean;
  availability: ExamAvailability;
  myState: MyExamState;
  canStartOfficial: boolean;
  canStartPractice: boolean;
  my: {
    official: { attemptId: string; status: "in_progress" | "completed" | "abandoned"; resultLocked: boolean; score: number | null; correct: number | null; wrong: number | null; blank: number | null; rank: number | null; total: number; completedAt: string | null } | null;
    active: { attemptId: string; role: AttemptRole | null; deadlineAt: string | null; answered: number } | null;
    practiceCount: number;
    lastPractice: { attemptId: string; score: number | null; completedAt: string | null } | null;
  };
}
export interface ExamDetail extends ExamListItem {
  distribution: { name: string; count: number; weightPercent: number }[];
}

export interface ExamQuestion {
  order: number;
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: QuizOption[];
  /** Ders adı (oynatıcı rozeti, Figma M3); eski paketlerde yok. */
  course?: string | null;
}

export interface ExamStartResponse {
  sessionId: string;
  examId: string;
  title: string;
  mode: "deneme";
  role: AttemptRole;
  resumed: boolean;
  publishMode: ExamPublishMode;
  endsAt: string;
  deadlineAt: string;
  serverNow: string;
  remainingSeconds: number;
  liveAnswerReveal: boolean;
  questions: ExamQuestion[];
  givenAnswers: { questionId: string; selectedOptionId: string | null; flagged?: boolean }[];
}

export interface MyAttempt {
  attemptId: string;
  exam: { id: string; title: string; startAt: string; durationMinutes: number; publishMode?: ExamPublishMode } | null;
  role?: AttemptRole | null;
  status: "in_progress" | "completed" | "abandoned";
  closedReason?: "submitted" | "timeout" | null;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface CourseBreakdownRow {
  sectionId: string | null;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
}
export interface AttemptDetail {
  attemptId: string;
  isArchive: boolean;
  isPersonal: boolean;
  role: AttemptRole;
  publishMode: ExamPublishMode | null;
  personal: boolean;
  closedReason: "submitted" | "timeout" | null;
  exam: { id: string; title: string; startAt: string; durationMinutes: number };
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  totalQuestions: number;
  resultLocked: boolean;
  resultAt: string | null;
  answeredCount?: number;
  correctCount: number | null;
  wrongCount: number | null;
  blankCount: number | null;
  /** Deneme: NET. Eski çıkmış sınav çözümü: yüzde. */
  score: number | null;
  rank: { available: boolean; rank: number | null; total: number; percentile: number | null; reason?: string } | null;
  courses: CourseBreakdownRow[];
  turkey: { locked: boolean; sample: number; minSample: number; mean: number | null; median: number | null; diff: number | null } | null;
  weakTopics: { topicId: string; topicName: string; correct: number; wrong: number; blank: number; total: number }[];
  scoreUpdate: { from: number; to: number; at: string } | null;
  topicBreakdown: { topicId: string; topicName: string; correct: number; wrong: number; blank: number; total: number }[];
  timing: { order: number; timeSpentMs: number | null; status: "correct" | "wrong" | "blank" }[];
  review: (Omit<ExamQuestion, "options"> & { explanation: string | null; legalReference?: string | null; topic?: string | null; options: (QuizOption & { isCorrect: boolean })[]; selectedOptionId: string | null; flagged?: boolean; adjustment?: "credit_all" | "exclude" | null })[];
}
export interface AttemptReview {
  attemptId: string;
  locked: boolean;
  majorityMissed: number | null;
  items: { no: number; questionId: string; course: string | null; topic: string | null; status: "correct" | "wrong" | "blank"; flagged: boolean; selectedOptionId: string | null; correctOptionId: string | null; seconds: number | null; turkeyRate: number | null; avgSeconds: number | null; missedMajority: boolean; adjustment: "credit_all" | "exclude" | null }[];
}

export interface ExamLeaderboardRow {
  rank: number;
  name?: string;
  displayName: string;
  correctCount: number | null;
  wrongCount: number;
  blankCount: number | null;
  score: number;
  durationSeconds: number | null;
  isMe: boolean;
  percentile?: number;
}
export interface ExamLeaderboard {
  available: boolean;
  reason?: "result_pending" | "min_sample";
  endAt: string;
  frozenAt?: string | null;
  participantCount?: number;
  minSample?: number;
  top: ExamLeaderboardRow[];
  me: ExamLeaderboardRow | null;
}

export interface ExamHistoryItem {
  attemptId: string;
  examId: string | null;
  title: string;
  publishMode: ExamPublishMode | null;
  role: AttemptRole | "personal" | null;
  completedAt: string | null;
  closedReason: "submitted" | "timeout" | null;
  resultLocked: boolean;
  resultAt: string | null;
  score: number | null;
  rank: number | null;
  totalQuestions: number;
}
export interface ExamHistory {
  trend: { locked: boolean; points: { attemptId: string; at: string | null; score: number; title: string }[]; mean: number | null; best: number | null; delta: number | null };
  denemeler: ExamHistoryItem[];
  haftalik: ExamHistoryItem[];
  kisisel: ExamHistoryItem[];
}

export interface Dashboard {
  isPremium: boolean;
  streak: { current: number; longest: number };
  today: { answered: number; dailyLimit: number | null };
  personalExam: { usedToday: number; dailyAllowance: number | null; maxQuestions: number };
  stats: { totalSolved: number; totalSessions: number; accuracy: number };
}

export interface PastExamSummary {
  slug: string;
  ad: string;
  kurum: string;
  donem: number | null;
  tarih: string | null;
  tur: "resmi" | "analiz";
  ozet: string | null;
  soruSayisi: number | null;
  examId: string | null;
  isPremium: boolean;
  dersDagilimi: { ders: string; adet: number }[];
}

export interface PastExamDetail extends PastExamSummary {
  acikSoru: number;
  kapaliSoru: number;
  iptalSayisi: number;
  sorular: { sira: number; iptal: boolean; ders: string; konu: string; kok: string; gorselUrl: string | null; siklar: { harf: string; metin: string; dogru: boolean }[]; aciklama: string | null; dayanak: { baslik: string; url: string | null }[] }[];
  devamEden: { attemptId: string; cevaplanan: number; toplamSoru: number; kalanSaniye: number | null } | null;
  benimSonucum: { attemptId: string; correctCount: number; wrongCount: number; blankCount: number; score: number | null; totalQuestions: number; completedAt: string | null } | null;
}

export const examKeys = {
  list: ["exams"] as const,
  detail: (id: string | null) => ["exams", "detail", id] as const,
  mine: ["exams", "attempts", "mine"] as const,
  history: ["exams", "history"] as const,
  attempt: (id: string | null) => ["exams", "attempt", id] as const,
  review: (id: string | null) => ["exams", "review", id] as const,
  leaderboard: (id: string | null) => ["exams", "leaderboard", id] as const,
  reminder: (id: string | null) => ["exams", "reminder", id] as const,
  dashboard: ["me", "dashboard"] as const,
  past: ["cikmis"] as const,
  pastDetail: (slug: string | null) => ["cikmis", slug] as const,
};

export function useExams() {
  return useQuery({ queryKey: examKeys.list, queryFn: () => api<ExamListItem[]>("/exams"), staleTime: 30_000 });
}
export function useExam(id: string | null) {
  return useQuery({ queryKey: examKeys.detail(id), queryFn: () => api<ExamDetail>(`/exams/${id}`), enabled: Boolean(id) });
}
export function useMyAttempts() {
  return useQuery({ queryKey: examKeys.mine, queryFn: () => api<MyAttempt[]>("/exams/attempts/mine") });
}
export function useExamHistory() {
  return useQuery({ queryKey: examKeys.history, queryFn: () => api<ExamHistory>("/exams/history/mine") });
}
export function useAttempt(id: string | null) {
  return useQuery({ queryKey: examKeys.attempt(id), queryFn: () => api<AttemptDetail>(`/exams/attempts/${id}`), enabled: Boolean(id) });
}
export function useAttemptReview(id: string | null, enabled = true) {
  return useQuery({ queryKey: examKeys.review(id), queryFn: () => api<AttemptReview>(`/exams/attempts/${id}/review`), enabled: Boolean(id) && enabled });
}
export function useExamLeaderboard(id: string | null) {
  return useQuery({ queryKey: examKeys.leaderboard(id), queryFn: () => api<ExamLeaderboard>(`/exams/${id}/leaderboard`), enabled: Boolean(id) });
}
export function useReminder(id: string | null) {
  return useQuery({ queryKey: examKeys.reminder(id), queryFn: () => api<{ reminding: boolean }>(`/exams/${id}/remind`), enabled: Boolean(id) });
}
export function useSetReminder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (on: boolean) => api<{ reminding: boolean }>(`/exams/${id}/remind`, { method: "POST", body: { on } }),
    onSuccess: (r) => qc.setQueryData(examKeys.reminder(id), r),
  });
}
export function useDashboard() {
  return useQuery({ queryKey: examKeys.dashboard, queryFn: () => api<Dashboard>("/me/dashboard") });
}
export function usePastExams() {
  return useQuery({ queryKey: examKeys.past, queryFn: () => api<PastExamSummary[]>("/public/cikmis-sinavlar", { auth: false }), staleTime: 10 * 60_000 });
}
export function usePastExam(slug: string | null) {
  return useQuery({ queryKey: examKeys.pastDetail(slug), queryFn: () => api<PastExamDetail>(`/cikmis-sinavlar/${slug}`), enabled: Boolean(slug) });
}

export const examApi = {
  /** `role` verilmezse resmî çözüm; `practice` tekrar çözüm (Doc 50 §3). */
  start: (examId: string, role?: AttemptRole) => api<ExamStartResponse>(`/exams/${examId}/start`, { method: "POST", body: role ? { role } : {} }),
  presence: (examId: string) => api<{ active: number; completed: number }>(`/exams/${examId}/presence`, { auth: false }),
  studyWrong: (slug: string, body: { sira: number; harf: string }) => api<{ kaydedildi: boolean }>(`/cikmis-sinavlar/${slug}/calisma-yanlisi`, { method: "POST", body }),
};

export function useReportQuestion() {
  return useMutation({ mutationFn: ({ questionId, message }: { questionId: string; message: string }) => api<unknown>(`/questions/${questionId}/report`, { method: "POST", body: { message } }) });
}

/** Deneme sonrası listeler bayatlar: liste, denemelerim, geçmiş, dashboard (kişisel hak). */
export function useInvalidateExams() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: examKeys.list });
    void qc.invalidateQueries({ queryKey: examKeys.mine });
    void qc.invalidateQueries({ queryKey: examKeys.history });
    void qc.invalidateQueries({ queryKey: examKeys.dashboard });
  };
}

/** Geri sayım metni: g/sa/dk/sn; negatifte "0 sn". */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d} g ${h} sa`;
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return `${m} dk ${sec} sn`;
  return `${sec} sn`;
}

export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }): string {
  return new Date(iso).toLocaleString("tr-TR", opts);
}

/** Net biçimi: 61,75 → "61,75"; 72 → "72"; null → "—". Web `fmtNet` ile aynı. */
export function fmtNet(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

/** Saniye → "1 sa 48 dk" / "12 dk" / "45 sn". */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return `${m} dk`;
  return `${seconds} sn`;
}

/** Saat:dakika ("1:52", "0:35") — sıralama tablosu ve inceleme listesi (Figma M5/M6). */
export function fmtClock(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** Dakika:saniye ("0:48", "2:05") — soru bazlı süre. */
export function fmtMs(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60), sec = seconds % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Tablo hücresi için tek parça süre: "88 dk" (saat kırılımı yok, sarmaz). */
export function fmtDurationCompact(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.round(seconds / 60);
  return m > 0 ? `${m} dk` : `${seconds} sn`;
}

/** "1.203 kişide 245." — sıra bilinmiyorsa null. */
export function rankSentence(rank: number | null, total: number): string | null {
  if (rank == null || total <= 0) return null;
  return `${total.toLocaleString("tr-TR")} kişide ${rank}.`;
}

/** Dönem kısa adı: "PAEM 10 · 2026" gibi; resmî sınavın adı gösterilir (Doc 36 istisnası). */
export function pastExamShortName(p: Pick<PastExamSummary, "ad" | "kurum" | "donem" | "tarih">): string {
  const yil = p.tarih ? p.tarih.slice(0, 4) : (p.ad.match(/\b(20\d{2})\b/)?.[1] ?? null);
  const kisa = p.ad.match(/\b(PAEM|MİSYON|Misyon)\b/)?.[1];
  if (p.donem && kisa) return `${kisa} ${p.donem}${yil ? ` · ${yil}` : ""}`;
  return p.ad;
}

/* ---------------------------------------------------------------- Kart ve hero modeli (SAF) */

export type ExamCardKind = "in_progress" | "new" | "done" | "locked" | "upcoming" | "weekly_missed" | "closed";
export interface ExamCardAction {
  label: string;
  /** Oynatıcı / kurallar / sonuç / sıralama / paywall hedefi. */
  go: { kind: "rules"; role?: AttemptRole } | { kind: "play"; role?: AttemptRole } | { kind: "result"; attemptId: string } | { kind: "ranking" } | { kind: "paywall" };
  variant: "primary" | "secondary" | "ghost";
}
export interface ExamCardModel {
  kind: ExamCardKind;
  primary: ExamCardAction | null;
  secondary: ExamCardAction | null;
  status: string;
}

/** Kart modeli (Doc 50 M1): kapı yok, kararlar sunucunun `canStart*`/`availability`/`myState`'inden. */
export function examCardModel(e: ExamListItem): ExamCardModel {
  const official = e.my?.official ?? null;
  const participants = `${e.participantCount.toLocaleString("tr-TR")} katılımcı`;
  if (e.myState === "in_progress" && e.my?.active) {
    return { kind: "in_progress", primary: { label: "Devam et", go: { kind: "play", role: e.my.active.role ?? undefined }, variant: "primary" }, secondary: null, status: `${e.my.active.answered}/${e.questionCount} cevaplandı` };
  }
  if (e.availability === "upcoming") {
    return { kind: "upcoming", primary: { label: "Kuralları gör", go: { kind: "rules" }, variant: "secondary" }, secondary: null, status: "Henüz açılmadı" };
  }
  if (official?.status === "completed") {
    const net = official.resultLocked ? "Sonuç bekliyor" : `${fmtNet(official.score)} net`;
    const rank = official.resultLocked ? null : rankSentence(official.rank, official.total);
    return {
      kind: "done",
      primary: { label: official.resultLocked ? "Teslimi gör" : "Sonucunu gör", go: { kind: "result", attemptId: official.attemptId }, variant: "secondary" },
      secondary: e.canStartPractice ? { label: "Tekrar çöz", go: { kind: "rules", role: "practice" }, variant: "ghost" } : e.availability === "closed" ? { label: "Sıralama", go: { kind: "ranking" }, variant: "ghost" } : null,
      status: rank ? `${net} · ${rank}` : net,
    };
  }
  if (e.isPremium && !e.canStartOfficial && e.availability === "open") {
    return { kind: "locked", primary: { label: "Premium ile aç", go: { kind: "paywall" }, variant: "secondary" }, secondary: null, status: participants };
  }
  if (e.availability === "closed") {
    return {
      kind: e.publishMode === "takvimli" ? "weekly_missed" : "closed",
      primary: e.canStartPractice ? { label: "Pratik olarak çöz", go: { kind: "rules", role: "practice" }, variant: "secondary" } : null,
      secondary: { label: "Sıralama", go: { kind: "ranking" }, variant: "ghost" },
      status: `Sıralama kapandı · ${e.participantCount.toLocaleString("tr-TR")} katıldı`,
    };
  }
  return { kind: "new", primary: e.canStartOfficial ? { label: "Başla", go: { kind: "rules" }, variant: "primary" } : null, secondary: null, status: participants };
}

/** Hero seçimi (Doc 50 M1): devam eden > sıradaki haftalık > sakin boşluk. */
export function heroFor(exams: ExamListItem[]): { kind: "active"; exam: ExamListItem } | { kind: "weekly"; exam: ExamListItem } | { kind: "calm" } {
  const active = exams.find((e) => e.myState === "in_progress" && e.my?.active);
  if (active) return { kind: "active", exam: active };
  const weekly = exams.filter((e) => e.publishMode === "takvimli" && e.availability !== "closed").sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  if (weekly) return { kind: "weekly", exam: weekly };
  return { kind: "calm" };
}
