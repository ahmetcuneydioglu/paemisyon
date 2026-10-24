import type { CourseBreakdownRow } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

/**
 * Ders dağılımı kartı (Doc 50 M4): resmî tablo sırası sabit; %60 altı ders
 * amber (metinle birlikte, renk tek başına anlam taşımaz).
 */
export function CourseBreakdown({
  rows,
  className,
}: {
  rows: CourseBreakdownRow[];
  className?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between">
        <h2 className="type-heading text-ink">Ders dağılımı</h2>
        <span className="type-body-sm text-ink-subtle">doğru / soru</span>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const pct = r.total > 0 ? r.correct / r.total : 0;
          const weak = r.total > 0 && pct < 0.6;
          return (
            <li key={r.sectionId ?? r.name} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="type-body-sm text-ink">{r.name}</span>
                <span className={cn("type-subhead tabular", weak ? "text-warning-ink" : "text-ink")}>
                  {r.correct}/{r.total}
                  {weak ? <span className="type-body-sm ml-1.5 font-normal">zayıf</span> : null}
                </span>
              </div>
              <ProgressBar value={pct} tone={weak ? "warning" : "accent"} height={5} label={r.name} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
