import { cn } from "@/lib/cn";

/** Madde ısı çubuğu: bu maddeden kaç soru çıkmış — kanun içi en yüksek değere oranlı. */
export function HeatBar({
  count,
  max,
  className,
}: {
  count: number;
  max: number;
  className?: string;
}) {
  const ratio = max > 0 ? count / max : 0;
  return (
    <span
      className={cn(
        "h-2 overflow-hidden rounded-pill bg-surface-alt",
        className,
      )}
      role="img"
      aria-label={`${count} çıkmış soru`}
    >
      <span
        className="block h-full rounded-pill bg-accent"
        style={{
          width: `${Math.max(6, ratio * 100)}%`,
          opacity: 0.35 + 0.65 * ratio,
        }}
      />
    </span>
  );
}
