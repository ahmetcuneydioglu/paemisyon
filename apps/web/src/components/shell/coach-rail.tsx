import Link from "next/link";
import { api } from "@/lib/api";
import type { CoachBrief } from "@/lib/public-api";
import { webRoute } from "@/lib/routes";
import { Card } from "@/components/ui/card";
import { GoalProgress } from "@/components/ui/goal-progress";

/**
 * Koç rayı (Doc 27 §2.3 — onay: YALNIZ L2 çalışma sayfalarında; L3'te asla).
 * En fazla 2 kart + günlük hedef. Kartlar sunucudan; web kural bilmez.
 * Veri alınamazsa ray sessizce kaybolur — çalışma sayfasını asla bloklamaz.
 */
export async function CoachRail() {
  const brief = await api<CoachBrief>("/me/coach").catch(() => null);
  if (!brief) return null;
  const cards = brief.cards.slice(0, 2);

  return (
    <aside aria-label="Koç" className="w-72 shrink-0 max-xl:hidden">
      <div className="sticky top-6 space-y-3">
        <h4 className="tk-caption">Koç</h4>
        {cards.map((c) => (
          <Card key={c.type + c.title}>
            <p className="font-heading text-[14px] font-bold leading-snug text-ink">{c.title}</p>
            {c.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{c.body}</p>}
            {c.cta && (
              <Link
                href={webRoute(c.cta.route)}
                className="mt-2 inline-block text-[13px] font-bold text-brand hover:underline"
              >
                {c.cta.label} →
              </Link>
            )}
          </Card>
        ))}
        <Card>
          <GoalProgress answered={brief.today.answered} goal={brief.today.goal} />
        </Card>
      </div>
    </aside>
  );
}
