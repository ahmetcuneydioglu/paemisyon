"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Expo `ButtonVariant` ile aynı dört ad. `danger`/`atlas` v2 takma adlarıdır (W-E'de silinir). */
export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "danger" | "atlas";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "tk-interactive inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap " +
  "rounded-control type-subhead disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110 active:scale-[0.99]",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink-soft active:scale-[0.99]",
  ghost: "text-accent-ink hover:bg-accent-soft",
  destructive:
    "bg-danger text-on-accent hover:brightness-110 active:scale-[0.99]",
  danger:
    "border border-danger/40 bg-surface text-danger-ink hover:bg-danger-soft",
  atlas: "bg-accent text-on-accent hover:brightness-110 active:scale-[0.99]",
};

/* Dokunma hedefi ≥ 44 px (md). sm yalnız yoğun tablolarda. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4",
  lg: "h-12 px-6 text-[17px]",
};

function cls(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  className,
  children,
  disabled,
  ...rest
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cls(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  leadingIcon,
  className,
  href,
  children,
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cls(variant, size, className)} {...rest}>
      {leadingIcon}
      {children}
    </Link>
  );
}
