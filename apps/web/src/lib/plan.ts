import type { PlanItem, PlanItemKind, PlanPhase } from "./public-api";

/** Haftalık plan sözlüğü ve rota yardımcıları (Doc 49/12 F8-A) — Expo `features/plan` ile aynı metinler. */

export function phaseLabel(phase: PlanPhase): string {
  return phase === "taper" ? "Son günler" : phase === "exam_mode" ? "Pekiştirme" : "Konu çalışması";
}

export function itemTitle(i: { kind: PlanItemKind; topicName: string | null }): string {
  return i.kind === "topic" ? (i.topicName ?? "Konu") : i.kind === "review" ? "Tekrar turu" : "Deneme";
}

/** 150 → "2 sa 30 dk", 60 → "1 sa", 45 → "45 dk". */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} dk`;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

/** "2026-10-12" → "12 Eki" (hafta şeridi). Deterministik: UTC, locale yalnız ay adı. */
export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Kalemden tur adresi: konu → /seans konu kapsamı (kalan soru 5–20), tekrar → yanlış turu, deneme → Denemeler. */
export function planItemHref(item: Pick<PlanItem, "id" | "kind" | "topicId" | "topicName" | "targetQuestions" | "doneQuestions">): string {
  if (item.kind === "topic" && item.topicId) {
    const kalan = Math.max(5, Math.min(20, item.targetQuestions - item.doneQuestions));
    const q = new URLSearchParams({ topicId: item.topicId, count: String(kalan), scope: item.topicName ?? "Plan kalemi", n: item.id });
    return `/seans?${q.toString()}`;
  }
  if (item.kind === "review") return "/seans?mode=review&scope=Yanl%C4%B1%C5%9F%20tekrar%C4%B1";
  return "/denemeler";
}
