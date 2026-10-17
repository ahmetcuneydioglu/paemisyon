import { cn } from "@/lib/cn";

/** Rütbe nişanı — profil ve terfi yüzeylerinde ortak. */
export function RankInsignia({
  level,
  name,
  size = "md",
}: {
  level: number;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "size-20 text-2xl"
      : size === "sm"
        ? "size-10 text-sm"
        : "size-14 text-lg";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-accent-soft font-display font-bold text-accent-ink",
        dims,
      )}
      aria-label={`${name}, seviye ${level}`}
    >
      <span aria-hidden>{level}</span>
      <span className="type-label absolute -bottom-1.5 rounded-pill bg-accent px-1.5 py-0.5 text-[9px] text-on-accent">
        Rütbe
      </span>
    </div>
  );
}
