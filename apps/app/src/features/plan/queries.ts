import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeKeys } from "@/features/home/queries";
import { api } from "@/lib/api";

/**
 * Haftalık plan sözleşmesi (Doc 49/12 F8-A §4; API: plan.service.ts). Karar SUNUCUDA:
 * evre, kilit, yüzde ve sıradaki kalem buradan gelir; istemci yalnız çizer (CLAUDE.md).
 */
export type PlanPhase = "build" | "exam_mode" | "taper";
export type PlanItemKind = "topic" | "review" | "mock";
export type PlanItemStatus = "pending" | "done" | "skipped";

export interface PlanItem {
  id: string;
  kind: PlanItemKind;
  topicId: string | null;
  topicName: string | null;
  courseName: string | null;
  targetMinutes: number;
  targetQuestions: number;
  doneMinutes: number;
  doneQuestions: number;
  remainingMinutes: number;
  status: PlanItemStatus;
}

export interface PlanSummary {
  targetMinutes: number;
  doneMinutes: number;
  targetQuestions: number;
  doneQuestions: number;
  pct: number;
}

export interface PlanWeek {
  weekStart: string;
  phase: PlanPhase;
  state: "past" | "current" | "future";
  locked: boolean;
  summary: PlanSummary;
  itemCount: number;
  items: PlanItem[];
}

export interface Plan {
  id: string;
  examDate: string | null;
  examTypeId: string | null;
  weeklyMinutes: number;
  horizonWeeks: number;
  createdAt: string;
  revisedAt: string | null;
  currentWeekStart: string;
  phase: PlanPhase;
  ended: boolean;
  coverage: { topics: number; syllabusTopics: number; pctOfSyllabus: number };
  thisWeek: PlanWeek & { summary: PlanSummary & { offPlanQuestions: number } };
  weeks: PlanWeek[];
  nextItem: PlanItem | null;
  premiumLocked: boolean;
  suggestions: ("exam_date" | "premium")[];
}

/** Koç brief'indeki kompakt özet (CoachBrief.plan). */
export interface PlanBrief {
  exists: true;
  phase: PlanPhase;
  weekStart: string;
  summary: PlanSummary;
  nextItem: { id: string; kind: PlanItemKind; topicId: string | null; topicName: string | null; remainingMinutes: number } | null;
  ended: boolean;
}

export interface PlanDefaults {
  examTypeId: string | null;
  examTypeName: string | null;
  examDate: string | null;
  examDateSource: "personal" | "official" | null;
  suggestedWeeklyMinutes: number;
  dailyMinutes: number | null;
}

export interface UpsertPlanBody {
  weeklyMinutes?: number;
  /** "YYYY-MM-DD" | null (tarih yok) | yok (mevcut hedef). */
  examDate?: string | null;
}

export const planKeys = { plan: ["me", "plan"] as const, defaults: ["me", "plan", "defaults"] as const };

export function usePlan(enabled = true) {
  return useQuery({ queryKey: planKeys.plan, queryFn: () => api<{ plan: Plan | null }>("/me/plan"), enabled });
}

export function usePlanDefaults(enabled = true) {
  return useQuery({ queryKey: planKeys.defaults, queryFn: () => api<PlanDefaults>("/me/plan/defaults"), enabled });
}

function useInvalidatePlan() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: planKeys.plan });
    void qc.invalidateQueries({ queryKey: homeKeys.brief });
    void qc.invalidateQueries({ queryKey: homeKeys.me }); // sınav tarihi değişmiş olabilir
  };
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: (body: UpsertPlanBody) => api<{ plan: Plan }>("/me/plan", { method: "POST", body }), onSuccess: invalidate });
}

export function useRevisePlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: (body: UpsertPlanBody) => api<{ plan: Plan }>("/me/plan", { method: "PATCH", body }), onSuccess: invalidate });
}

export function useArchivePlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({ mutationFn: () => api<{ archived: boolean }>("/me/plan", { method: "DELETE" }), onSuccess: invalidate });
}

/** Evre etiketi — kısa, sunucu evresinin Türkçesi (metin kuralı değil, sözlük). */
export function phaseLabel(phase: PlanPhase): string {
  return phase === "taper" ? "Son günler" : phase === "exam_mode" ? "Pekiştirme" : "Konu çalışması";
}

/** Kalem başlığı: konu adı ya da tekrar/deneme. */
export function itemTitle(i: Pick<PlanItem, "kind" | "topicName">): string {
  return i.kind === "topic" ? (i.topicName ?? "Konu") : i.kind === "review" ? "Tekrar turu" : "Deneme";
}

/** Haftalık dakikayı "5 sa 30 dk" biçiminde yazar. */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} dk`;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

/** "YYYY-MM-DD" → "12 Eki" (hafta şeridi için kısa). */
export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
}
