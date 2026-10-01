"use client";

import type { KeyboardEvent } from "react";

type Accent = "brand" | "atlas";

const seciliParca: Record<Accent, string> = {
  brand: "bg-brand text-surface",
  atlas: "bg-atlas text-surface",
};

/**
 * Bölmeli seçici — az sayıda (2–5) birbirini dışlayan seçenek için (soru
 * sayısı, görünüm modu…). Radyo grubu semantiği: ok tuşlarıyla gezilir,
 * her parça ≥44pt dokunma hedefidir. Renk tek başına anlam taşımaz;
 * seçili parça hem zemin hem `aria-checked` ile ayırt edilir.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  accent = "brand",
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Grubun ekran okuyucu adı (ör. "Soru sayısı"). */
  label: string;
  accent?: Accent;
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
    const sonraki = options[(index + yon + options.length) % options.length];
    onChange(sonraki.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={[
        "inline-flex gap-0.5 rounded-md border border-line bg-surface p-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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
            className={[
              // ≥44pt dokunma hedefi (HIG): parça tek başına 44px yüksek.
              "tk-interactive h-11 min-w-11 cursor-pointer rounded-sm px-3 font-heading text-[13px] font-bold",
              secili ? seciliParca[accent] : "text-ink hover:bg-line/40",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
