import { api } from "@/lib/api";
import type { HomeSource } from "@/features/home/queries";

/**
 * Quiz motoru sözleşmesi (API: quiz.controller / quiz.service). Şıklarda doğru anahtarı
 * YOKTUR; sunucu cevapla birlikte döner. Kaynak etiketi alıştırmada sunucu ayarına bağlı,
 * ekranda GÖSTERİLMEZ (CLAUDE.md 4 Eyl 2026 kararı) — alan yalnız tipte durur.
 */
export interface QuizOption {
  id: string;
  label: string;
  text: string;
}
export interface QuizQuestion {
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: QuizOption[];
}
export interface QuizSession {
  sessionId: string;
  mode: "practice" | "exam" | "daily" | "review" | "deneme";
  plannedDurationSeconds: number | null;
  questions: QuizQuestion[];
  /** resume: verilen cevaplar. */
  givenAnswers?: { questionId: string; selectedOptionId: string | null; isCorrect: boolean | null }[];
  remainingSeconds?: number | null;
  /** Canlı deneme: pencerenin küresel bitişi (exams/:id/start). */
  endsAt?: string;
}

/**
 * Sunucu kuralları (quiz.service): `exam` için courseId|topicId ya da archiveExamId|personalExam;
 * `review`/`daily` kapsamsız; `fromBookmarks` kapsamsız practice; `articleNo` topicId ile.
 */
export interface StartSessionBody {
  mode: "practice" | "review" | "exam" | "daily";
  recipe?: "coach" | "comeback";
  source?: HomeSource | "notif";
  topicId?: string;
  courseId?: string;
  articleNo?: string;
  fromBookmarks?: boolean;
  archiveExamId?: string;
  personalExam?: boolean;
  questionCount?: number;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  legalReference: string | null;
  relatedArticle: {
    lawSlug: string;
    no: string;
    slug: string;
    text: { body: string; source: string; sourceUrl: string | null; effectiveInfo: string | null; verifiedAt: string | null } | null;
  } | null;
  source?: string | null;
}

export interface SessionResult {
  sessionId: string;
  mode: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number;
  durationSeconds: number;
  plannedDurationSeconds: number | null;
  topicBreakdown: { topicId: string; topicName: string; correct: number; total: number }[] | null;
  earnedBadges?: { key: string; name: string }[];
}

export const quizApi = {
  start: (body: StartSessionBody) => api<QuizSession>("/quiz/sessions", { method: "POST", body }),
  resume: (sessionId: string) => api<QuizSession>(`/quiz/sessions/${sessionId}/resume`),
  answer: (sessionId: string, body: { questionId: string; questionVersionId: string; selectedOptionId?: string; timeSpentMs?: number }) =>
    api<AnswerFeedback | { recorded: true }>(`/quiz/sessions/${sessionId}/answers`, { method: "POST", body }),
  complete: (sessionId: string) => api<SessionResult>(`/quiz/sessions/${sessionId}/complete`, { method: "POST" }),
};
