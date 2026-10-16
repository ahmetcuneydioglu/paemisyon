import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * /me/coach sözleşmesinin F1'de kullanılan EKLEMELİ alanları (Doc 48 home-v2.types.ts).
 * Karar sunucuda: istemci todayTask'ı çizer, hesaplamaz (CLAUDE.md).
 */
export type TodayTaskKind = "exam" | "resume" | "first" | "comeback" | "weekly_risk" | "start" | "done";

export interface CoachBrief {
  flags: { homeV2: boolean };
  exam: { name: string | null; date: string | null; daysLeft: number | null; source: "personal" | "official" | null };
  readiness: {
    courses: { courseId: string; name: string; icon: string | null; solved: number; correct: number; accuracy: number | null; state: "normal" | "weak" | "sparse" }[];
    weakest: { topicId: string; name: string; courseName: string; accuracy: number; solved: number }[];
    unresolvedWrongCount: number;
  };
  todayTask: {
    kind: TodayTaskKind;
    title: string;
    subtitle?: string | null;
    questionCount?: number | null;
    progress?: { done: number; total: number } | null;
    action?: { label: string } | null;
  } | null;
  weeklyPhoto?: { activeDays?: number; targetDays?: number } | null;
}

export const coachKeys = { brief: ["me", "coach"] as const };

export function useCoachBrief() {
  return useQuery({ queryKey: coachKeys.brief, queryFn: () => api<CoachBrief>("/me/coach") });
}

export interface Me {
  id: string;
  email: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  preferredModule: { id: string; name: string } | null;
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me") });
}
