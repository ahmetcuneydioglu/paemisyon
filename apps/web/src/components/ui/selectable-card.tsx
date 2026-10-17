"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
  label,
  className = "",
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pasif kartın içinde görünen kısa açıklama (ör. "Henüz çıkmış soru yok"). */
  disabledHint?: string;
  /** @deprecated v2 — tek vurgu; yok sayılır. */
  accent?: "brand" | "atlas";
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
      className={cn(
        "tk-interactive relative flex min-h-11 w-full cursor-pointer flex-col items-start rounded-card border p-4 pr-12 text-left text-ink",
        selected
          ? "border-accent bg-accent-soft"
          : "border-line bg-surface hover:border-ink-soft",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-4 right-4 flex size-5 items-center justify-center rounded-[6px] border",
          selected
            ? "border-accent bg-accent text-on-accent"
            : "border-line bg-surface",
        )}
      >
        {selected ? <Check size={14} strokeWidth={2.5} /> : null}
      </span>
      {children}
      {disabled && disabledHint && (
        <span className="type-body-sm mt-2 text-ink-soft">{disabledHint}</span>
      )}
    </button>
  );
}
