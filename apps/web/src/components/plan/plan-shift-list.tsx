import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { PlanBrief } from "@/lib/public-api";
import { formatMinutes, itemTitle, phaseLabel, planItemHref } from "@/lib/plan";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

/**
 * Bugün'deki haftalık plan — "vardiya listesi" (Doc 49/13 §2): sol altın dikey çizgi, her
 * kalemde ad / ders, sağda kalan dakika ya da Tamam rozeti, altında ince ilerleme. Plan
 * yoksa ve sunucu `plan_offer` verdiyse davet. Sunucu bileşeni; kalemler brief'ten.
 */
export function PlanShiftList({
  plan,
  offer,
}: {
  plan: PlanBrief | null | undefined;
  offer: boolean;
}) {
  if (!plan) {
    if (!offer) return null;
    return (
      <Card tone="alt" className="flex flex-col gap-2">
        <span className="type-subhead inline-flex items-center gap-2 text-ink">
          <CalendarDays size={18} className="text-accent" aria-hidden />
          Haftalık plan çıkarayım mı?
        </span>
        <p className="type-body-sm text-ink-soft">
          Ayırabildiğin süreyi söyle; konuları sınava kadar haftalara ben
          dağıtayım.
        </p>
        <div>
          <ButtonLink href="/planim?kur=1" variant="secondary">
            Planı kur
          </ButtonLink>
        </div>
      </Card>
    );
  }
  const items = plan.items ?? [];
  return (
    <section aria-label="Haftalık plan" className="flex flex-col gap-2">
      <Link
        href="/planim"
        className="flex min-h-11 items-baseline justify-between gap-2 hover:underline"
      >
        <span className="type-label text-ink-subtle">
          Haftalık plan · {phaseLabel(plan.phase)}
        </span>
        <span className="type-subhead text-accent-ink">
          {plan.ended ? "Yenile ›" : `%${plan.summary.pct} ›`}
        </span>
      </Link>
      {items.length === 0 ? (
        <p className="type-body-sm text-ink-soft">
          {plan.ended
            ? "Plan tamamlandı; yeni dönem için yeniden kurabilirsin."
            : "Bu haftaya kalem düşmedi."}
        </p>
      ) : (
        <ul className="flex flex-col border-l-2 border-accent pl-3">
          {items.map((it, idx) => {
            const done = it.status === "done";
            const active = !done && it.status !== "skipped";
            const pct =
              it.targetMinutes > 0
                ? Math.min(1, it.doneMinutes / it.targetMinutes)
                : 0;
            const body = (
              <>
                <span className="flex items-start gap-3">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "type-subhead",
                        done ? "text-ink-soft" : "text-ink",
                      )}
                    >
                      {itemTitle(it)}
                    </span>
                    {it.courseName ? (
                      <span className="type-body-sm text-ink-subtle">
                        {it.courseName}
                      </span>
                    ) : null}
                  </span>
                  {done ? (
                    <Badge tone="success">Tamam</Badge>
                  ) : it.status === "skipped" ? (
                    <Badge tone="neutral">Geçti</Badge>
                  ) : (
                    <span className="type-body-sm tabular shrink-0 text-ink-soft">
                      {formatMinutes(it.remainingMinutes)} kaldı
                    </span>
                  )}
                </span>
                <ProgressBar
                  value={done ? 1 : pct}
                  tone={done ? "success" : "accent"}
                  height={3}
                  label={`${itemTitle(it)} ilerlemesi`}
                />
              </>
            );
            const cls = cn(
              "flex flex-col gap-2 py-3",
              idx < items.length - 1 && "border-b border-line",
            );
            return (
              <li key={it.id}>
                {active ? (
                  <Link
                    href={planItemHref({
                      ...it,
                      targetQuestions: it.remainingMinutes,
                      doneQuestions: 0,
                    })}
                    className={cn(cls, "tk-interactive hover:opacity-80")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
