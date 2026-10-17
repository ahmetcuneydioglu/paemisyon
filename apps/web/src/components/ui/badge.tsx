import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-alt text-ink-soft",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
};

/** Durum rozeti: renk tek başına anlam taşımaz, metin zorunlu (Doc 26 §5). */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 font-body text-[12px] leading-4 font-semibold",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
