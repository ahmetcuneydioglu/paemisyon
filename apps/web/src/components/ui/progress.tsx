import { cn } from "@/lib/cn";

export type ProgressTone = "accent" | "success" | "warning" | "danger";
const fill: Record<ProgressTone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Sürekli ilerleme çubuğu (0..1). */
export function ProgressBar({
  value,
  tone = "accent",
  height = 5,
  label,
  className,
}: {
  value: number;
  tone?: ProgressTone;
  height?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      className={cn(
        "w-full overflow-hidden rounded-pill bg-surface-alt",
        className,
      )}
      style={{ height }}
    >
      <div
        className={cn(
          "h-full rounded-pill transition-[width] duration-300",
          fill[tone],
        )}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

/** Dilimli ilerleme (≤20 dilim): görev kartı 3/12. */
export function SegmentBar({
  total,
  done,
  tone = "accent",
  className,
}: {
  total: number;
  done: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const n = Math.max(1, Math.min(20, total));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className={cn("flex gap-1", className)}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-pill",
            i < done ? fill[tone] : "bg-surface-alt",
          )}
        />
      ))}
    </div>
  );
}

export type DayState = "done" | "today" | "empty";

/** Haftalık aktif gün noktaları (D1). Bugün bakır çerçeve, tamamlanan adaçayı dolu. */
export function WeekDots({
  days,
  className,
}: {
  days: DayState[];
  className?: string;
}) {
  const done = days.filter((d) => d === "done").length;
  return (
    <div
      aria-label={`Bu hafta ${done} aktif gün`}
      role="img"
      className={cn("flex gap-1.5", className)}
    >
      {days.map((d, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-full border",
            d === "done"
              ? "border-success bg-success"
              : d === "today"
                ? "border-accent bg-surface-alt"
                : "border-line bg-surface-alt",
          )}
        />
      ))}
    </div>
  );
}
