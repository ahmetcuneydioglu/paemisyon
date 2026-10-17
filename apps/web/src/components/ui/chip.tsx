"use client";

import type { ComponentProps, ComponentType } from "react";
import { cn } from "@/lib/cn";

type IconProps = {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
};

/** Seçilebilir çip (filtre, odak seçimi): ≥44 px hedef; seçili = vurgu dolgu. */
export function Chip({
  label,
  selected = false,
  icon: Icon,
  className,
  ...rest
}: Omit<ComponentProps<"button">, "children"> & {
  label: string;
  selected?: boolean;
  icon?: ComponentType<IconProps>;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "tk-interactive inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 type-subhead disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-accent bg-accent text-on-accent"
          : "border-line bg-surface text-ink hover:border-ink-soft",
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={18} strokeWidth={1.75} aria-hidden /> : null}
      {label}
    </button>
  );
}
