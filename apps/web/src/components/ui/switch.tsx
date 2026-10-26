"use client";

import { cn } from "@/lib/cn";

/** Aç/kapa anahtarı (tercihler): 44 px dokunma hedefi, erişilebilir `role="switch"`. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "tk-interactive inline-flex h-11 w-14 shrink-0 cursor-pointer items-center rounded-pill px-1 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-alt",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-7 rounded-full shadow-sm transition-transform",
          checked ? "translate-x-5 bg-on-accent" : "translate-x-0 bg-surface",
        )}
      />
    </button>
  );
}
