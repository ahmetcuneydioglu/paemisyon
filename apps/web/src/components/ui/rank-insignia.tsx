/** Mesleki kimlik rozeti — profil ve terfi yüzeylerinde ortak kullanılır. */
export function RankInsignia({
  level,
  name,
  size = "md",
}: {
  level: number;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg"
      ? "size-20 text-2xl"
      : size === "sm"
        ? "size-10 text-sm"
        : "size-14 text-lg";
  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center rounded-full border-2 border-brand/30 bg-brand/10 font-heading font-bold text-brand",
        dimensions,
      ].join(" ")}
      aria-label={`${name}, seviye ${level}`}
    >
      <span aria-hidden>{level}</span>
      <span className="absolute -bottom-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-surface">
        Rütbe
      </span>
    </div>
  );
}
