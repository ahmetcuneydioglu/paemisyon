import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QuizOption } from "@/features/quiz/api";

/**
 * Denemeler (exams.controller, past-exams.controller, public cikmis-sinavlar). Pencere, premium,
 * katılım ve hak kuralları SUNUCUDA; istemci yalnız `state`, `myAttempt` ve hata kodlarını çizer.
 * Cevap ve bitirme canlı denemede de /quiz/sessions üstünden gider (tek oynatıcı).
 */
export type ExamState = "upcoming" | "active" | "ended";

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
  myAttempt: { id: string; examId: string; status: "in_progress" | "completed" | "abandoned" } | null;
  myArchiveAttempt: { id: string; status: "completed"; correctCount: number; wrongCount: number; blankCount: number; completedAt: string | null } | null;
}

export interface ExamQuestion {
  order: number;
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: QuizOption[];
}

export interface ExamStartResponse {
  sessionId: string;
  examId: string;
  title: string;
  mode: "deneme";
  endsAt: string;
  liveAnswerReveal: boolean;
  questions: ExamQuestion[];
  givenAnswers: { questionId: string; selectedOptionId: string | null }[];
}

export interface MyAttempt {
  attemptId: string;
  exam: { id: string; title: string; startAt: string; durationMinutes: number } | null;
  status: "in_progress" | "completed" | "abandoned";
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AttemptDetail {
  attemptId: string;
  isArchive: boolean;
  exam: { id: string; title: string; startAt: string; durationMinutes: number };
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  /** Canlı deneme: NET; arşiv: yüzde. */
  score: number | null;
  durationSeconds: number | null;
  completedAt: string | null;
  topicBreakdown: { topicId: string; topicName: string; correct: number; wrong: number; blank: number; total: number }[];
  timing: { order: number; timeSpentMs: number | null; status: "correct" | "wrong" | "blank" }[];
  review: (Omit<ExamQuestion, "options"> & { explanation: string | null; options: (QuizOption & { isCorrect: boolean })[]; selectedOptionId: string | null })[];
}

export interface ExamLeaderboardRow {
  rank: number;
  displayName: string;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number;
  durationSeconds: number | null;
  isMe: boolean;
}
export type ExamLeaderboard = { available: false; endAt: string; top: []; me: null } | { available: true; endAt: string; participantCount: number; top: ExamLeaderboardRow[]; me: ExamLeaderboardRow | null };

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
  mine: ["exams", "attempts", "mine"] as const,
  attempt: (id: string | null) => ["exams", "attempt", id] as const,
  leaderboard: (id: string | null) => ["exams", "leaderboard", id] as const,
  dashboard: ["me", "dashboard"] as const,
  past: ["cikmis"] as const,
  pastDetail: (slug: string | null) => ["cikmis", slug] as const,
};

export function useExams() {
  return useQuery({ queryKey: examKeys.list, queryFn: () => api<ExamListItem[]>("/exams"), staleTime: 30_000 });
}
export function useMyAttempts() {
  return useQuery({ queryKey: examKeys.mine, queryFn: () => api<MyAttempt[]>("/exams/attempts/mine") });
}
export function useAttempt(id: string | null) {
  return useQuery({ queryKey: examKeys.attempt(id), queryFn: () => api<AttemptDetail>(`/exams/attempts/${id}`), enabled: Boolean(id) });
}
export function useExamLeaderboard(id: string | null) {
  return useQuery({ queryKey: examKeys.leaderboard(id), queryFn: () => api<ExamLeaderboard>(`/exams/${id}/leaderboard`), enabled: Boolean(id) });
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
  start: (examId: string) => api<ExamStartResponse>(`/exams/${examId}/start`, { method: "POST" }),
  presence: (examId: string) => api<{ active: number; completed: number }>(`/exams/${examId}/presence`, { auth: false }),
  studyWrong: (slug: string, body: { sira: number; harf: string }) => api<{ kaydedildi: boolean }>(`/cikmis-sinavlar/${slug}/calisma-yanlisi`, { method: "POST", body }),
};

export function useReportQuestion() {
  return useMutation({ mutationFn: ({ questionId, message }: { questionId: string; message: string }) => api<unknown>(`/questions/${questionId}/report`, { method: "POST", body: { message } }) });
}

/** Deneme sonrası listeler bayatlar: liste, denemelerim, dashboard (kişisel hak). */
export function useInvalidateExams() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: examKeys.list });
    void qc.invalidateQueries({ queryKey: examKeys.mine });
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

/** Dönem kısa adı: "PAEM 10 · 2026" gibi; resmî sınavın adı gösterilir (Doc 36 istisnası). */
export function pastExamShortName(p: Pick<PastExamSummary, "ad" | "kurum" | "donem" | "tarih">): string {
  const yil = p.tarih ? p.tarih.slice(0, 4) : (p.ad.match(/\b(20\d{2})\b/)?.[1] ?? null);
  const kisa = p.ad.match(/\b(PAEM|MİSYON|Misyon)\b/)?.[1];
  if (p.donem && kisa) return `${kisa} ${p.donem}${yil ? ` · ${yil}` : ""}`;
  return p.ad;
}
