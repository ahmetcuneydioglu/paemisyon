import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight } from "lucide-react";
import type { PlanBrief } from "@/lib/public-api";
import { formatMinutes, itemTitle, phaseLabel, planItemHref } from "@/lib/plan";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

/**
 * Bugün'deki haftalık plan kartı (Doc 49/12 F8-A §5) — sunucu bileşeni: yüzde, evre ve
 * sıradaki kalem brief'ten gelir; kart yalnız çizer. `plan` yoksa koçun `plan_offer`
 * kartı varsa davet hâli.
 */
export function PlanWeekCard({ plan, offer }: { plan: PlanBrief | null | undefined; offer: boolean }) {
  if (!plan) {
    if (!offer) return null;
    return (
      <Card tone="alt" className="flex flex-col gap-2">
        <span className="type-subhead inline-flex items-center gap-2 text-ink">
          <CalendarDays size={18} className="text-accent" aria-hidden />
          Haftalık plan çıkarayım mı?
        </span>
        <p className="type-body-sm text-ink-soft">
          Ayırabildiğin süreyi söyle; konuları sınava kadar haftalara ben dağıtayım.
        </p>
        <div>
          <ButtonLink href="/planim?kur=1" variant="secondary">
            Planı kur
          </ButtonLink>
        </div>
      </Card>
    );
  }
  const pct = plan.summary.pct;
  const next = plan.nextItem;
  return (
    <Card className="flex flex-col gap-3">
      <Link href="/planim" className="flex items-center gap-2 hover:underline" aria-label="Planım">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="type-label text-ink-subtle">Haftalık plan</span>
            <Badge tone={plan.phase === "build" ? "neutral" : "warning"}>{phaseLabel(plan.phase)}</Badge>
          </span>
          <span className="type-heading text-ink">{plan.ended ? "Planın tamamlandı" : `%${pct}`}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-ink-subtle" aria-hidden />
      </Link>
      {plan.ended ? (
        <div>
          <ButtonLink href="/planim" variant="secondary">
            Planı yenile
          </ButtonLink>
        </div>
      ) : (
        <>
          <ProgressBar value={pct / 100} tone={pct >= 100 ? "success" : "accent"} label="Haftalık plan ilerlemesi" />
          <p className="type-body-sm tabular text-ink-soft">
            {formatMinutes(plan.summary.doneMinutes)} / {formatMinutes(plan.summary.targetMinutes)}
            {plan.summary.doneQuestions > 0 ? ` · ${plan.summary.doneQuestions} soru` : ""}
          </p>
          {next ? (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="type-label text-ink-subtle">Sıradaki</p>
                <p className="type-subhead truncate text-ink">{itemTitle(next)}</p>
                <p className="type-body-sm text-ink-soft">{formatMinutes(next.remainingMinutes)} kaldı</p>
              </div>
              <ButtonLink href={planItemHref({ ...next, targetQuestions: next.remainingMinutes, doneQuestions: 0 })} variant="secondary">
                {next.kind === "topic" ? "Başla" : next.kind === "review" ? "Tekrar" : "Deneme"}
                <ArrowRight size={16} aria-hidden />
              </ButtonLink>
            </div>
          ) : (
            <p className="type-body-sm text-success-ink">Bu haftanın hedefi tamam. İstersen plan dışı devam et.</p>
          )}
        </>
      )}
    </Card>
  );
}
