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
export type QuizDifficulty = "easy" | "medium" | "hard";
/** Cevaptan ÖNCE görünen madde bağı (F10-0): yalnız alıştırma türü turlarda, metin yok. */
export interface QuizArticleRef {
  lawSlug: string;
  no: string;
  slug: string;
  /** "PVSK md. 4/A" */
  label: string;
  /** Mevzuat okuyucu (`/oku/[slug]`); mevzuat kaydı yoksa null. */
  legislationSlug: string | null;
}
export interface QuizQuestion {
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: QuizOption[];
  /** Eski sunucuda yok → meta satırı boş kalır. */
  difficulty?: QuizDifficulty;
  relatedArticleRef?: QuizArticleRef | null;
  /** Ders adı — yalnız deneme paketinde (Figma M3 rozeti). */
  course?: string | null;
}
export interface QuizSession {
  sessionId: string;
  mode: "practice" | "exam" | "daily" | "review" | "deneme";
  plannedDurationSeconds: number | null;
  questions: QuizQuestion[];
  /** Başlık bloğu: kapsam adı ("Anayasa Hukuku", "Yanlış tekrarı"); eski sunucuda yok. */
  scopeName?: string | null;
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
  /** Tek soru (push derin bağlantısı); diğer kapsamları ezer. */
  questionId?: string;
  articleNo?: string;
  /** Konu özeti köprüsü (Doc 53): ünitenin maddeleri; topicId ile, articleNo ile birlikte değil. */
  articleNos?: string[];
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

/** Seans içi araçlar (web oynatıcıyla aynı uçlar): favori, not, koç, hata bildirimi. */
export const sessionToolsApi = {
  bookmarks: () => api<{ questionId: string }[]>("/review/bookmarks"),
  setBookmark: (questionId: string, on: boolean) => api<{ bookmarked: boolean }>(`/review/bookmarks/${questionId}`, { method: on ? "POST" : "DELETE" }),
  explain: (versionId: string, chosenOptionId: string) => api<{ text: string; cached: boolean; remainingToday: number | null }>("/ai/explain", { method: "POST", body: { versionId, chosenOptionId } }),
  report: (questionId: string, message: string) => api<{ alreadyReported: boolean }>(`/questions/${questionId}/report`, { method: "POST", body: { message } }),
};

export const quizApi = {
  start: (body: StartSessionBody) => api<QuizSession>("/quiz/sessions", { method: "POST", body }),
  resume: (sessionId: string) => api<QuizSession>(`/quiz/sessions/${sessionId}/resume`),
  answer: (sessionId: string, body: { questionId: string; questionVersionId: string; selectedOptionId?: string; timeSpentMs?: number }) =>
    api<AnswerFeedback | { recorded: true }>(`/quiz/sessions/${sessionId}/answers`, { method: "POST", body }),
  complete: (sessionId: string) => api<SessionResult>(`/quiz/sessions/${sessionId}/complete`, { method: "POST" }),
};
