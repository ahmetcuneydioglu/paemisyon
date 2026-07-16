import Link from "next/link";
import type { CoachBrief } from "@/lib/public-api";

/** Koç kartı route'ları webde karşılığı olan sayfalara eşlenir (Doc 23). */
function webRoute(route: string): string {
  if (route.startsWith("/denemeler")) return route;
  if (route === "/review" || route === "/quiz" || route === "/catalog") return "/denemeler";
  return route;
}

/**
 * Girişli ana sayfa = KOÇ (Doc 23): mobille aynı /me/coach kartları.
 * Sunucu bileşeni — kartlar backend'den gelir, web hiçbir kural bilmez.
 */
export function CoachDashboard({ brief }: { brief: CoachBrief }) {
  const { today, cards, gamification, greeting } = brief;
  const pct = Math.min(100, Math.round((today.answered / Math.max(1, today.goal)) * 100));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-(--color-navy)">
          {greeting.displayName ? `Merhaba, ${greeting.displayName}` : "Merhaba"} — bugün senin için ne var?
        </h1>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
          🔥 {today.streak.current} gün seri
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Sol: hedef + koç kartları */}
        <div className="space-y-3 md:col-span-2">
          <div className="rounded-xl border border-(--color-navy)/20 bg-(--color-navy) p-5 text-white">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Bugünkü hedef</span>
              <span className="font-bold">
                {today.answered}/{today.goal} soru
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
            </div>
            <Link href={webRoute(brief.primaryAction.route)} className="btn2 btn2-green inline-block">
              {brief.primaryAction.label}
            </Link>
          </div>

          {cards.map((c) => (
            <div key={c.type + c.title} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xl" aria-hidden>
                {c.type.startsWith("exam") ? "📢" : c.type === "quick_review" ? "🔁" : c.type === "weak_topic" ? "📉" : c.type === "streak_risk" ? "⚠️" : "🎯"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.title}</p>
                {c.body && <p className="text-sm text-gray-500">{c.body}</p>}
              </div>
              {c.cta && (
                <Link href={webRoute(c.cta.route)} className="shrink-0 text-sm font-bold text-(--color-navy) hover:underline">
                  {c.cta.label} →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Sağ: gamification */}
        <div className="space-y-3">
          {gamification.nextBadge && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-1 text-sm font-bold">🏅 Sıradaki rozet</p>
              <p className="text-sm text-gray-600">{gamification.nextBadge.name}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.round((gamification.nextBadge.progress / gamification.nextBadge.target) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {gamification.nextBadge.progress}/{gamification.nextBadge.target}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <p className="mb-2 font-bold">📊 Rekorların</p>
            <div className="space-y-1 text-gray-600">
              <p>En iyi net: {gamification.records.bestNet ?? "—"}</p>
              <p>En uzun seri: {gamification.records.longestStreak} gün</p>
              <p>Bir günde en çok: {gamification.records.maxDailyQuestions} soru</p>
              <p>
                Bu hafta: {gamification.weekly.activeDays}/{gamification.weekly.goalDays} aktif gün
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Daha derin analiz (zayıflık haritası, konu bazlı ilerleme) mobil uygulamada —{" "}
            <a href="https://apps.apple.com" className="font-bold text-(--color-navy) hover:underline">
              indir
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
