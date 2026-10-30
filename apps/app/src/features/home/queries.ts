import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlanBrief } from "@/features/plan/queries";

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

export type HomeSource = "home_task" | "home_resume" | "home_weak_topic" | "home_suggestion" | "plan" | "course_room" | "topic_room" | "home_next" | "home_route" | "home_for_you";

export interface TodayTaskAction {
  /** open_summary (Doc 49/16): konu özeti ünitesi (`route` = /ozet/<slug>). */
  type: "start_session" | "resume_session" | "open_exams" | "open_summary";
  label: string;
  count?: number;
  recipe?: "coach" | "comeback";
  focus?: DailyFocus;
  /** Ünite reçetesi: yalnız bu maddelerin soruları (Doc 53 F5-2). */
  articleNos?: string[];
  /** Favorilerden tur (Bugün v3 "Senin için"). */
  fromBookmarks?: boolean;
  sessionId?: string;
  route?: string;
  source: HomeSource;
}

/* ── Bugün v3 (Doc 49/16): tek adım + rota + senin için; karar sunucuda (API coach/home-v3.types.ts). ── */
export type NextStepKind = "exam" | "resume" | "summary_then_questions" | "questions" | "review" | "done";
export interface NextStep {
  kind: NextStepKind;
  eyebrow: string;
  title: string;
  reason: string;
  badge: string | null;
  estimateMin: number | null;
  action: TodayTaskAction;
}
export type RouteItemKind = "daily" | "summary" | "questions" | "review" | "exam" | "plan_topic" | "plan_review" | "plan_mock";
export interface RouteItem {
  key: string;
  kind: RouteItemKind;
  label: string;
  detail: string | null;
  /** Tahminî süre (dk); eski sunucuda yok. */
  estimateMin?: number | null;
  done: boolean;
  action: TodayTaskAction | null;
}
export type ForYouKind = "wrongs" | "favorites" | "weak_topic" | "exam" | "mixed";
export interface ForYouItem {
  kind: ForYouKind;
  label: string;
  ctaLabel: string;
  action: TodayTaskAction;
}
export interface HomeV3 {
  nextStep: NextStep;
  route: RouteItem[];
  forYou: ForYouItem[];
  /** Eski sunucuda yok. */
  week?: { solved: number; activeDays: number; goalDays: number; rankName: string };
}

export type WeekDayState = "done" | "missed" | "today" | "future";

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
  /** Ünite reçetesi (Doc 53 F5-2): en zayıf konunun en zayıf ünitesi; eski sunucuda alan yok. */
  unitRecipe?: import("../summaries/queries").UnitRecipe | null;
  flags: { homeV2: boolean };
  exam: { name: string | null; date: string | null; daysLeft: number | null; source: "personal" | "official" | null };
  readiness: { courses: ReadinessCourse[]; weakest: ReadinessTopic[]; unresolvedWrongCount: number };
  focus: DailyFocus | null;
  todayTask: TodayTask | null;
  today?: { goal: number; answered: number; streak?: { current: number; longest: number } };
  /** `days`: Pzt→Paz 7 günlük nöbet çizelgesi (Doc 49/13 F9-B); eski sunucuda alan yok. */
  gamification?: { weekly?: { activeDays: number; goalDays: number; days?: WeekDayState[] } };
  /** Koç kartları (yalnız tip ve metin okunur; Bugün görev motorunu çizer). */
  cards?: { type: string; title: string; body?: string; cta?: { label: string; route: string }; meta?: Record<string, unknown> }[];
  /** Haftalık plan özeti (Doc 49/12 F8-A); plan yoksa null, eski sunucuda alan yok. */
  plan?: PlanBrief | null;
  /** Bugün v3 (Doc 49/16); eski sunucuda alan yok → ekran todayTask'a düşer. */
  homeV3?: HomeV3;
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
