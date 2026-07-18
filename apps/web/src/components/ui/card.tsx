import type { ComponentProps } from "react";

/** Temel kart yüzeyi — tüm yeni ekranların yapı taşı (Doc 26 radius md, elevation card). */
export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={["rounded-md border border-line bg-surface p-4", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return (
    <h3
      className={["font-heading text-[15px] font-bold text-ink", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
