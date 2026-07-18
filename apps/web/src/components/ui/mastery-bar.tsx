/**
 * Hakimiyet çubuğu (Doc 26 #10): % + renk eşiği (danger<40, warning<60).
 * Renk tek başına anlam taşımaz — yüzde her zaman sayıyla yazılır (a11y).
 * `value === null` → hiç çalışılmamış ("yeni"), %0 ile karıştırılmaz.
 */
export function MasteryBar({ value, className }: { value: number | null; className?: string }) {
  if (value == null) {
    return (
      <span className={["tk-caption", className].filter(Boolean).join(" ")}>—</span>
    );
  }
  const tone = value < 40 ? "bg-danger" : value < 60 ? "bg-warning" : "bg-success";
  const text = value < 40 ? "text-danger" : value < 60 ? "text-warning" : "text-success";
  return (
    <span className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Hakimiyet yüzde ${value}`}
      >
        <span className={["block h-full rounded-full", tone].join(" ")} style={{ width: `${value}%` }} />
      </span>
      <span className={["tabular text-[13px] font-bold", text].join(" ")}>%{value}</span>
    </span>
  );
}
