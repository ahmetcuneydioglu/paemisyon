"use client";

import type { ComponentProps, ComponentType } from "react";
import { cn } from "@/lib/cn";

type IconProps = {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
};

const variants = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary: "border border-line bg-surface text-ink hover:border-ink-soft",
  ghost: "text-ink-soft hover:bg-surface-alt hover:text-ink",
};

/** Yalnız ikonlu düğme: 44 px hedef, zorunlu erişilebilir ad (`label`). */
export function IconButton({
  icon: Icon,
  label,
  variant = "secondary",
  className,
  ...rest
}: Omit<ComponentProps<"button">, "children"> & {
  icon: ComponentType<IconProps>;
  label: string;
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "tk-interactive inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
