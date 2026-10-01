"use client";

import type { ReactNode } from "react";

type Accent = "brand" | "atlas";

const seciliYuzey: Record<Accent, string> = {
  brand: "border-brand bg-brand/5",
  atlas: "border-atlas bg-atlas/5",
};

const isaretKutusu: Record<Accent, string> = {
  brand: "border-brand bg-brand text-surface",
  atlas: "border-atlas bg-atlas text-surface",
};

/**
 * Seçilebilir kart — çoklu seçim listelerinin yapı taşı (Doc 26 kart yüzeyi +
 * onay kutusu semantiği). Kartın tamamı dokunma hedefidir (≥44pt), klavyeyle
 * Space/Enter ile işaretlenir; durum `aria-checked` ile ekran okuyucuya gider.
 *
 * İçerik metinseldir: bir `button` içine başka etkileşimli öğe konmaz.
 * `disabled` kart soluklaşır ve isteğe bağlı kısa gerekçesini kendi içinde
 * söyler (ipucu balonuna bağımlı kalmaz — dokunmatikte balon yok).
 */
export function SelectableCard({
  selected,
  onToggle,
  disabled = false,
  disabledHint,
  accent = "brand",
  label,
  className = "",
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pasif kartın içinde görünen kısa açıklama (ör. "Henüz çıkmış soru yok"). */
  disabledHint?: string;
  accent?: Accent;
  /** Ekran okuyucu etiketi — görünen metin yeterince açıklayıcı değilse. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "tk-interactive relative flex min-h-11 w-full cursor-pointer flex-col items-start rounded-md border p-4 pr-12 text-left text-ink",
        selected ? seciliYuzey[accent] : "border-line bg-surface hover:border-ink-soft",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden
        className={[
          "absolute top-4 right-4 flex size-5 items-center justify-center rounded-sm border text-[12px] font-bold",
          selected ? isaretKutusu[accent] : "border-line bg-surface",
        ].join(" ")}
      >
        {selected ? "✓" : ""}
      </span>
      {children}
      {disabled && disabledHint && (
        <span className="mt-2 text-[11px] text-ink-soft">{disabledHint}</span>
      )}
    </button>
  );
}
