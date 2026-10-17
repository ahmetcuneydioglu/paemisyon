import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "surface" | "alt" | "accent";

const toneClass: Record<CardTone, string> = {
  surface: "border-line bg-surface",
  alt: "border-line bg-surface-alt",
  accent: "border-accent/40 bg-accent-soft",
};

/** Temel kart yüzeyi (v3): gölge yok, 1 px çizgi, `rounded-card`. Expo `Card tone` ile aynı. */
export function Card({
  className,
  tone = "surface",
  ...rest
}: ComponentProps<"div"> & { tone?: CardTone }) {
  return (
    <div
      className={cn("rounded-card border p-4", toneClass[tone], className)}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return <h3 className={cn("type-heading text-ink", className)} {...rest} />;
}
