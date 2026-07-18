import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "atlas";
type Size = "md" | "lg" | "sm";

const base =
  "tk-interactive inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm font-heading font-bold " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-surface hover:opacity-90 active:scale-[0.99]",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink-soft active:scale-[0.99]",
  ghost: "text-ink-soft hover:bg-line/40 hover:text-ink",
  danger: "border border-danger/40 bg-surface text-danger hover:bg-danger/10",
  atlas: "bg-atlas text-surface hover:opacity-90 active:scale-[0.99]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[13px]",
  lg: "h-12 px-6 text-[15px]",
};

function cls(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cls(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={cls(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
