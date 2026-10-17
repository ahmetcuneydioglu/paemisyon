"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Metin alanı: etiket üstte, hata/ipucu altta; 44 px yükseklik; hata rengi + metin birlikte. */
export function TextField({
  label,
  error,
  hint,
  trailing,
  className,
  id,
  ...rest
}: ComponentProps<"input"> & {
  label: string;
  error?: string | null;
  hint?: string;
  trailing?: ReactNode;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const descId = `${inputId}-desc`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="type-subhead text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            "type-body h-11 w-full rounded-control border bg-surface px-3.5 text-ink placeholder:text-ink-subtle",
            "disabled:opacity-50",
            error ? "border-danger" : "border-line focus:border-ink-soft",
            trailing ? "pr-20" : undefined,
          )}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={descId} className="type-body-sm text-danger-ink" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="type-body-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
