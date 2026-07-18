import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { CoachBrief } from "@/lib/public-api";
import { webRoute } from "@/lib/routes";
import { Card, CardTitle } from "@/components/ui/card";
import { CoachCard } from "@/components/ui/coach-card";
import { GoalProgress } from "@/components/ui/goal-progress";
import { StreakBadge } from "@/components/ui/streak-badge";
import { ButtonLink } from "@/components/ui/button";
import { FocusPicker } from "@/components/bugun/focus-picker";

export const metadata: Metadata = { title: "Bugün", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Bugün — girişli ana sayfa (Doc 27 §3.2, wireframe 02).
 * Sahne koçundur: hero = durum makinesinin kartı (/me/coach), yanı günün özeti.
 */
export default async function BugunPage() {
  const brief = await api<CoachBrief>("/me/coach");
  const { today, gamification, greeting } = brief;
  // Hero = durum makinesinin en öncelikli kartı (Doc 25 Karar 3); kalanlar destek.
  const [hero, ...cards] = brief.cards;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Üst şerit: selamlama + seri */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-ink">
          {greeting.displayName ? `Merhaba, ${greeting.displayName}` : "Merhaba"}
        </h1>
        <StreakBadge days={today.streak.current} atRisk={today.streak.atRisk} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sol sahne (8 kolon): hero + destek kartları */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-brand/30 p-6">
            <span className="tk-caption text-brand">Koç</span>
            <p className="mt-1.5 font-heading text-lg font-bold leading-snug text-ink">
              {hero?.title ?? "Bugün senin için bir seans hazır."}
            </p>
            {hero?.body && (
              <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{hero.body}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ButtonLink href={webRoute(brief.primaryAction.route)} size="lg">
                Bugün Çalış
              </ButtonLink>
              <FocusPicker />
            </div>
          </Card>

          {cards.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => (
                <CoachCard
                  key={c.type + c.title}
                  type={c.type}
                  title={c.title}
                  body={c.body}
                  cta={c.cta}
                  routeMapper={webRoute}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sağ kolon (4 kolon): günün özeti — salt okunur, en fazla 4 kart */}
        <div className="space-y-3">
          <Card>
            <GoalProgress answered={today.answered} goal={today.goal} />
          </Card>

          {gamification.nextBadge && (
            <Card>
              <CardTitle className="text-[13px]">🎖 Sıradaki rozet</CardTitle>
              <p className="mt-1 text-[13px] text-ink-soft">{gamification.nextBadge.name}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-atlas"
                  style={{
                    width: `${Math.min(100, Math.round((gamification.nextBadge.progress / Math.max(1, gamification.nextBadge.target)) * 100))}%`,
                  }}
                />
              </div>
              <p className="tabular mt-1 text-[11px] text-ink-soft">
                {gamification.nextBadge.progress}/{gamification.nextBadge.target}
              </p>
            </Card>
          )}

          <Card>
            <CardTitle className="text-[13px]">Bu hafta</CardTitle>
            <p className="tabular mt-1 text-[13px] text-ink-soft">
              {gamification.weekly.activeDays}/{gamification.weekly.goalDays} aktif gün
            </p>
          </Card>

          <Card>
            <CardTitle className="text-[13px]">Rekorların</CardTitle>
            <dl className="tabular mt-2 space-y-1.5 text-[13px] text-ink-soft">
              <div className="flex justify-between">
                <dt>En iyi net</dt>
                <dd className="font-bold text-ink">{gamification.records.bestNet ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>En uzun seri</dt>
                <dd className="font-bold text-ink">{gamification.records.longestStreak} gün</dd>
              </div>
              <div className="flex justify-between">
                <dt>Günlük rekor</dt>
                <dd className="font-bold text-ink">
                  {gamification.records.maxDailyQuestions} soru
                </dd>
              </div>
            </dl>
          </Card>

          {!greeting.isPremium && (
            <Link
              href="/premium"
              className="tk-interactive block rounded-md border border-dashed border-line p-4 text-[13px] text-ink-soft hover:border-ink-soft"
            >
              <span className="font-bold text-ink">Premium</span> — koçun tam beyni: sınırsız
              soru, tam tekrar hafızası. →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
