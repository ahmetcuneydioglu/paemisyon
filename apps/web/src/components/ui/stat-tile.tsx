import { cn } from "@/lib/cn";
import { ProgressBar, type ProgressTone } from "./progress";

/**
 * İstatistik kutusu: etiket, büyük değer (tabular), birim, ilerleme, ipucu.
 * Değer yoksa "—" — rakam uydurulmaz (Doc 24 §4).
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  progress,
  tone = "accent",
  emphasis = false,
  className,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  hint?: string;
  progress?: number;
  tone?: ProgressTone;
  emphasis?: boolean;
  className?: string;
}) {
  const valueClass =
    value == null
      ? "text-ink-subtle"
      : tone === "danger"
        ? "text-danger-ink"
        : tone === "warning"
          ? "text-warning-ink"
          : emphasis
            ? "text-accent"
            : "text-ink";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-card border border-line bg-surface p-4",
        className,
      )}
    >
      <span className="type-label text-ink-subtle">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className={cn("type-stat", valueClass)}>{value ?? "—"}</span>
        {unit ? (
          <span className="type-body-sm text-ink-soft">{unit}</span>
        ) : null}
      </span>
      {progress != null ? (
        <ProgressBar value={progress} tone={tone} height={4} />
      ) : null}
      {hint ? (
        <span className="type-body-sm text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
}
