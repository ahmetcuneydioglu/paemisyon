"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import { KeyHint } from "./key-hint";

/** Soru kökü: numara/toplam, konu rozeti, metin 16/25. Kaynak etiketi GÖSTERİLMEZ. */
export function QuestionStem({
  index,
  total,
  topic,
  stem,
  className,
}: {
  index: number;
  total: number;
  topic?: string | null;
  stem: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className="type-label tabular text-ink-subtle">
          Soru {index}/{total}
        </span>
        {topic ? <Badge>{topic}</Badge> : null}
      </div>
      <p
        className="type-body max-w-[65ch] text-ink"
        role="heading"
        aria-level={2}
      >
        {stem}
      </p>
    </div>
  );
}

export type QuestionOptionState =
  "default" | "selected" | "correct" | "incorrect" | "missed" | "disabled";

const palette: Record<
  QuestionOptionState,
  { row: string; badge: string; text: string }
> = {
  default: {
    row: "border-line bg-surface hover:border-ink-soft",
    badge: "bg-surface-alt text-ink-soft",
    text: "text-ink",
  },
  selected: {
    row: "border-accent bg-accent-soft border-[1.5px]",
    badge: "bg-accent text-on-accent",
    text: "text-ink",
  },
  correct: {
    row: "border-success bg-success-soft border-[1.5px]",
    badge: "bg-success text-on-accent",
    text: "text-ink",
  },
  incorrect: {
    row: "border-danger bg-danger-soft border-[1.5px]",
    badge: "bg-danger text-on-accent",
    text: "text-ink",
  },
  missed: {
    row: "border-success bg-surface border-[1.5px]",
    badge: "bg-surface-alt text-success-ink",
    text: "text-ink",
  },
  disabled: {
    row: "border-line bg-surface",
    badge: "bg-surface-alt text-ink-subtle",
    text: "text-ink-subtle",
  },
};
const a11y: Record<QuestionOptionState, string> = {
  default: "",
  selected: "seçili",
  correct: "doğru cevap",
  incorrect: "yanlış işaretlendi",
  missed: "doğru cevap buydu",
  disabled: "",
};

/**
 * Şık satırı — altı durum (Expo ile aynı). Doğru/yanlış rengi anında, ikon eşlik eder;
 * renk tek başına anlam taşımaz. Klavye ipucu masaüstünde ("1"–"5").
 */
export function QuestionOption({
  label,
  text,
  state = "default",
  keyHint,
  onSelect,
  className,
}: {
  label: string;
  text: string;
  state?: QuestionOptionState;
  keyHint?: string;
  onSelect?: () => void;
  className?: string;
}) {
  const p = palette[state];
  const interactive =
    (state === "default" || state === "selected") && Boolean(onSelect);
  const trailing =
    state === "correct" || state === "missed" ? (
      <Check
        size={20}
        strokeWidth={2.25}
        className="shrink-0 text-success"
        aria-hidden
      />
    ) : state === "incorrect" ? (
      <X
        size={20}
        strokeWidth={2.25}
        className="shrink-0 text-danger"
        aria-hidden
      />
    ) : keyHint ? (
      <KeyHint keys={keyHint} />
    ) : null;
  return (
    <button
      type="button"
      role={interactive ? "radio" : undefined}
      aria-checked={interactive ? state === "selected" : undefined}
      // Görünen metin ("A Lüksemburg") erişilebilir adın İÇİNDE olmalı (WCAG 2.5.3,
      // axe label-content-name-mismatch); durum sona eklenir.
      aria-label={`${label} ${text}${a11y[state] ? `, ${a11y[state]}` : ""}`}
      disabled={!interactive}
      onClick={onSelect}
      className={cn(
        "tk-interactive flex min-h-14 w-full items-center gap-3 rounded-card border px-4 py-3 text-left disabled:cursor-default",
        interactive && "cursor-pointer",
        p.row,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-full type-subhead",
          p.badge,
        )}
      >
        {label}
      </span>
      <span
        className={cn("type-body flex-1 text-[15px] leading-[21px]", p.text)}
      >
        {text}
      </span>
      {trailing}
    </button>
  );
}
