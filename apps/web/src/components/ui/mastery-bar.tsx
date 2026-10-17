import { cn } from "@/lib/cn";

/**
 * Hakimiyet çubuğu: % + eşik tonu (danger<40, warning<60, success). Renk tek başına
 * anlam taşımaz — yüzde her zaman sayıyla yazılır. `value === null` → "—" (yeni).
 */
export function MasteryBar({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value == null) {
    return (
      <span className={cn("type-label text-ink-subtle", className)}>—</span>
    );
  }
  const fill =
    value < 40 ? "bg-danger" : value < 60 ? "bg-warning" : "bg-success";
  const text =
    value < 40
      ? "text-danger-ink"
      : value < 60
        ? "text-warning-ink"
        : "text-success-ink";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-pill bg-surface-alt"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Hakimiyet yüzde ${value}`}
      >
        <span
          className={cn("block h-full rounded-pill", fill)}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className={cn("type-subhead tabular", text)}>%{value}</span>
    </span>
  );
}
