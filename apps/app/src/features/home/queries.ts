import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * /me/coach sözleşmesi — F3'te kullanılan alanlar (API: coach/home-v2.types.ts). Karar
 * SUNUCUDA: istemci todayTask'ı çizer, hesaplamaz (CLAUDE.md). Hepsi EKLEMELİ alanlar.
 */
export type FocusKind = "coach" | "course" | "topic" | "wrongs";
export interface DailyFocus {
  kind: FocusKind;
  courseId: string | null;
  topicId: string | null;
  label: string | null;
}

export type HomeSource = "home_task" | "home_resume" | "home_weak_topic" | "home_suggestion";

export interface TodayTaskAction {
  type: "start_session" | "resume_session" | "open_exams";
  label: string;
  count?: number;
  recipe?: "coach" | "comeback";
  focus?: DailyFocus;
  sessionId?: string;
  route?: string;
  source: HomeSource;
}

export type TodayTaskKind = "exam" | "resume" | "first" | "comeback" | "weekly_risk" | "start" | "done";

export interface TodayTaskSecondary {
  kind: "stale_session" | "wrongs" | "warmup";
  title: string;
  subtitle: string;
  actionLabel: string;
  action: TodayTaskAction;
}

export interface TodayTask {
  kind: TodayTaskKind;
  title: string;
  reason: string;
  progress: { label: string; answered: number; total: number } | null;
  action: TodayTaskAction;
  finishSessionId: string | null;
  secondary: TodayTaskSecondary | null;
}

export interface ReadinessCourse {
  courseId: string;
  name: string;
  icon: string | null;
  solved: number;
  correct: number;
  accuracy: number | null;
  state: "normal" | "weak" | "sparse";
  deltaPct: number | null;
}
export interface ReadinessTopic {
  topicId: string;
  name: string;
  courseName: string;
  accuracy: number;
  solved: number;
}

export interface CoachBrief {
  flags: { homeV2: boolean };
  exam: { name: string | null; date: string | null; daysLeft: number | null; source: "personal" | "official" | null };
  readiness: { courses: ReadinessCourse[]; weakest: ReadinessTopic[]; unresolvedWrongCount: number };
  focus: DailyFocus | null;
  todayTask: TodayTask | null;
  gamification?: { weekly?: { activeDays: number; goalDays: number } };
}

export const homeKeys = { brief: ["me", "coach"] as const, me: ["me"] as const };

export function useCoachBrief() {
  return useQuery({ queryKey: homeKeys.brief, queryFn: () => api<CoachBrief>("/me/coach") });
}

export interface Me {
  id: string;
  email: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  preferredModule: { id: string; name: string } | null;
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: homeKeys.me, queryFn: () => api<Me>("/me"), enabled });
}

/** PUT /me/focus — günün odağı; yanıt brief.focus ile aynı şekil. Brief yeniden çekilir (CTA değişir). */
export function useSetFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { kind: FocusKind; courseId?: string; topicId?: string }) => api<DailyFocus>("/me/focus", { method: "PUT", body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: homeKeys.brief }),
  });
}

/** Haftanın bugünkü günü (0 = Pazartesi), TR 04.00 sınırıyla yaklaşık — yalnız nokta vurgusu için. */
export function todayIndexTr(now = new Date()): number {
  const tr = new Date(now.getTime() + 3 * 3600 * 1000 - 4 * 3600 * 1000);
  return (tr.getUTCDay() + 6) % 7;
}
