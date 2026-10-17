import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";

/** Seri rozeti: alev + gün; risk halinde warning tonu (metin + ikon, renk tek başına değil). */
export function StreakBadge({
  days,
  atRisk = false,
}: {
  days: number;
  atRisk?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-[13px] font-semibold tabular",
        atRisk
          ? "border-warning/40 bg-warning-soft text-warning-ink"
          : "border-line bg-surface text-ink",
      )}
      title={atRisk ? "Serin bugün risk altında" : "Günlük seri"}
    >
      <Flame
        size={16}
        strokeWidth={2}
        aria-hidden
        className={atRisk ? "text-warning-ink" : "text-accent"}
      />
      {days} gün
      {atRisk ? <span className="sr-only">, risk altında</span> : null}
    </span>
  );
}
