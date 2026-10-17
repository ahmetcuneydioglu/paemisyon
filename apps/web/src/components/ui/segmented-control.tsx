"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Bölmeli seçici — 2–5 birbirini dışlayan seçenek. Radyo grubu semantiği, ok tuşları,
 * parça ≥44 px. Seçili parça zemin + `aria-checked` ile ayırt edilir (tek vurgu).
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** @deprecated v2 — tek vurgu kuralıyla anlamsız; yok sayılır. */
  accent?: "brand" | "atlas";
  className?: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const yon = e.key === "ArrowRight" ? 1 : -1;
    onChange(options[(index + yon + options.length) % options.length].value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex gap-0.5 rounded-control border border-line bg-surface p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const secili = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={secili}
            tabIndex={secili ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "tk-interactive h-10 min-w-11 cursor-pointer rounded-[8px] px-3 type-subhead",
              secili
                ? "bg-accent text-on-accent"
                : "text-ink hover:bg-surface-alt",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
