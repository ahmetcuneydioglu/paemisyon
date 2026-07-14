// /api/v1/exams yanıt tipleri (Doc 18 §7) — backend ile elle hizalı.

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
  state: ExamState;
  participantCount: number;
  avgScore: number | null;
  myAttempt: { id: string; status: "in_progress" | "completed" | "abandoned" } | null;
}
