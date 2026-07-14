// /api/v1/exams yanıt tipleri (Doc 18 §7) — backend ile elle hizalı.

export type ExamState = "upcoming" | "active" | "ended";

export interface ReviewOption {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}
export interface ReviewQuestion {
  order: number;
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  explanation?: string | null;
  options: ReviewOption[];
  selectedOptionId?: string | null;
}
export interface AttemptResult {
  attemptId: string;
  exam: { id: string; title: string; startAt: string; durationMinutes: number };
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number | null;
  durationSeconds: number | null;
  completedAt: string | null;
  review: ReviewQuestion[];
}
export interface RankRow {
  rank: number;
  displayName: string;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number;
  durationSeconds: number | null;
  isMe: boolean;
}
export interface Leaderboard {
  available: boolean;
  endAt: string;
  participantCount?: number;
  top: RankRow[];
  me: RankRow | null;
}
export interface GlobalRankRow {
  rank: number;
  displayName: string;
  avgScore: number;
  attempts: number;
  totalCorrect: number;
  isMe: boolean;
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
  state: ExamState;
  participantCount: number;
  avgScore: number | null;
  myAttempt: { id: string; status: "in_progress" | "completed" | "abandoned" } | null;
}
