import Link from "next/link";
import { ArrowRight, Pause } from "lucide-react";
import { api } from "@/lib/api";
import {
  activeSessionHref,
  type ActiveSession,
  type CoachBrief,
} from "@/lib/public-api";
import { webRoute } from "@/lib/routes";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { RailToggle } from "./rail-toggle";

/**
 * Koç rayı (Doc 27 §2.3 — YALNIZ L2 çalışma sayfalarında; L3'te asla; Bugün'de
 * sahne koçun kendisi). En fazla 2 kart + günlük hedef. Metin sunucudan; web kural
 * bilmez. Veri alınamazsa ray sessizce kaybolur.
 */
export async function CoachRail() {
  const [brief, active] = await Promise.all([
    api<CoachBrief>("/me/coach").catch(() => null),
    api<ActiveSession | null>("/quiz/active-session").catch(() => null),
  ]);
  if (!brief) return null;
  const cards = brief.cards.slice(0, 2);
  const goal = Math.max(1, brief.today.goal);
  const done = brief.today.answered >= brief.today.goal && brief.today.goal > 0;

  return (
    <RailToggle>
      <aside aria-label="Koç" className="flex flex-col gap-3">
        {active?.resumable ? (
          <Link
            href={activeSessionHref(active)}
            className="tk-interactive flex items-center justify-between gap-2 rounded-pill bg-warning-soft px-3 py-2 text-[13px] font-semibold text-warning-ink hover:brightness-105"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Pause size={14} aria-hidden />
              <span className="tabular truncate">
                {active.answeredCount}/{active.totalQuestions} — kaldığın yerden
                devam
              </span>
            </span>
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
        {cards.map((c) => (
          <Card key={c.type + c.title} className="flex flex-col gap-1">
            <p className="type-subhead text-ink">{c.title}</p>
            {c.body ? (
              <p className="type-body-sm text-ink-soft">{c.body}</p>
            ) : null}
            {c.cta ? (
              <Link
                href={webRoute(c.cta.route, c.type, c.meta)}
                className="type-subhead mt-1 inline-flex items-center gap-1 text-accent-ink hover:underline"
              >
                {c.cta.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : null}
          </Card>
        ))}
        <Card className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="type-label text-ink-subtle">Bugünkü hedef</span>
            <span className="type-subhead tabular text-ink">
              {brief.today.answered}
              <span className="font-normal text-ink-soft">
                /{brief.today.goal} soru
              </span>
            </span>
          </div>
          <ProgressBar
            value={brief.today.answered / goal}
            tone={done ? "success" : "accent"}
            label="Bugünkü hedef"
          />
        </Card>
      </aside>
    </RailToggle>
  );
}
