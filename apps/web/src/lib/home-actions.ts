import type { TodayTaskAction } from "./public-api";

const UUID =
  /^\/denemeler\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

/**
 * Bugün v3 eylemi → web adresi (Doc 49/16). Mobil karşılığı `(tabs)/index.tsx run()`:
 * aynı sözleşme, farklı adres kitabı. Kural sunucuda — burada yalnız çeviri vardır.
 *
 * - open_summary → /ozet/<slug>
 * - open_exams   → /denemeler/<id>/baslamadan-once (kimlik varsa), yoksa /denemeler
 * - resume       → /seans?resume=<oturum>
 * - start        → /seans?… (mode=review yanlış odağında, favorites favorilerde,
 *                  articleNos ünite reçetesinde; scope etiketi üst şeride gider)
 */
export function homeActionHref(action: TodayTaskAction): string {
  if (action.type === "open_summary") {
    const slug = (action.route ?? "").replace(/^\/ozet\//, "");
    return slug && !slug.includes("/") ? `/ozet/${slug}` : "/kutuphane";
  }
  if (action.type === "open_exams") {
    const m = (action.route ?? "").match(UUID);
    return m ? `/denemeler/${m[1]}/baslamadan-once` : "/denemeler";
  }
  if (action.type === "resume_session" && action.sessionId) {
    const q = new URLSearchParams({ resume: action.sessionId });
    if (action.source) q.set("source", String(action.source));
    return `/seans?${q.toString()}`;
  }
  const q = new URLSearchParams();
  if (action.source) q.set("source", String(action.source));
  q.set("count", String(action.count ?? 10));
  const f = action.focus;
  if (f?.courseId) q.set("courseId", f.courseId);
  if (f?.topicId) q.set("topicId", f.topicId);
  if (f?.kind === "wrongs") q.set("mode", "review");
  if (action.fromBookmarks) q.set("mode", "favorites");
  if (action.articleNos && action.articleNos.length > 0) {
    q.set("articleNos", action.articleNos.join(","));
  }
  const label = action.fromBookmarks
    ? "Favoriler"
    : f?.kind === "wrongs"
      ? "Yanlış tekrarı"
      : (f?.label ?? "");
  if (label) q.set("scope", label);
  return `/seans?${q.toString()}`;
}
