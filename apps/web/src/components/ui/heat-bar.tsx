/**
 * Madde ısı çubuğu (Doc 26 #12): bu maddeden kaç soru çıkmış — kanun içi
 * en yüksek değere oranlanır. Girişsiz sayfada da çalışır (kişisel veri yok).
 */
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
      className={["h-2 overflow-hidden rounded-full bg-line", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`${count} çıkmış soru`}
    >
      <span
        className="block h-full rounded-full bg-atlas"
        style={{ width: `${Math.max(6, ratio * 100)}%`, opacity: 0.35 + 0.65 * ratio }}
      />
    </span>
  );
}
