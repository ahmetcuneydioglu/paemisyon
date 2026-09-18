/**
 * Premium rozeti — "bu içerik/hak Premium'a ait" işareti (Doc 46).
 *
 * Tek ekrana özel yazılmış bir rozet olarak Çıkmış Sınavlar listesinde
 * yaşıyordu; kişisel deneme kartında da gerekince tasarım sistemine taşındı.
 * Varyantlar: `solid` (liste satırında dikkat çeken sarı rozet) ve `soft`
 * (kart içinde, metnin yanında sessiz duran hâli).
 *
 * Erişilebilirlik: kilit emojisi dekoratiftir (aria-hidden), anlamı taşıyan
 * "Premium" metni ekran okuyucuya ulaşır — renk tek başına anlam taşımaz.
 */
export function PremiumBadge({
  variant = "solid",
  label = "Premium",
  className = "",
}: {
  variant?: "solid" | "soft";
  label?: string;
  className?: string;
}) {
  const stil =
    variant === "solid"
      ? "bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
      : "border border-line bg-surface px-2 py-0.5 text-ink-soft";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm text-[12px] font-bold ${stil} ${className}`}
    >
      <span aria-hidden>🔒</span>
      {label}
    </span>
  );
}
