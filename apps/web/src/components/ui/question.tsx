"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import { KeyHint } from "./key-hint";

/**
 * Soru kökü (Doc 49/15 Figma): editoryal — kart yok, zemin üstünde Lora 400 20/28.
 * `counter` kapalıysa "Soru N/M" satırı gösterilmez (Seans başlık bloğu zaten sayar).
 * Kaynak etiketi GÖSTERİLMEZ.
 */
export function QuestionStem({
  index,
  total,
  topic,
  stem,
  counter = true,
  className,
}: {
  index: number;
  total: number;
  topic?: string | null;
  stem: string;
  counter?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {counter || topic ? (
        <div className="flex items-center gap-2">
          {counter ? (
            <span className="type-label tabular text-ink-subtle">
              Soru {index}/{total}
            </span>
          ) : null}
          {topic ? <Badge>{topic}</Badge> : null}
        </div>
      ) : null}
      <p
        className="max-w-[65ch] font-display text-[20px] leading-7 font-normal text-ink"
        role="heading"
        aria-level={2}
      >
        {stem}
      </p>
    </div>
  );
}

export type QuestionOptionState =
  | "default"
  | "selected"
  | "correct"
  | "incorrect"
  | "missed"
  | "disabled";

const palette: Record<
  QuestionOptionState,
  { row: string; badge: string; text: string }
> = {
  default: {
    row: "border-line bg-surface hover:bg-surface-alt",
    badge: "bg-surface-alt text-ink-soft",
    text: "text-ink",
  },
  selected: {
    row: "border-accent bg-accent-soft border-[1.5px]",
    badge: "bg-accent-soft text-accent-ink",
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
  // Kaçırılan doğru = doğru görünümü (Figma S3: doğru şık yeşil, seçilen kırmızı).
  missed: {
    row: "border-success bg-success-soft border-[1.5px]",
    badge: "bg-success text-on-accent",
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
 * Şık satırı (Figma Seans/ŞıkSatırı, 6 durum — Expo ile aynı): 56 px, surface + 1 px line,
 * radius 10; solda 28 px daire; doğru/yanlışta harf yerine dairede ✓/✕. Renk tek başına
 * anlam taşımaz. Klavye ipucu masaüstünde ("1"–"5").
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
  const glyph =
    state === "correct" || state === "missed" ? (
      <Check size={16} strokeWidth={2.5} aria-hidden />
    ) : state === "incorrect" ? (
      <X size={16} strokeWidth={2.5} aria-hidden />
    ) : (
      label
    );
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
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[14px] leading-none font-semibold",
          p.badge,
        )}
      >
        {glyph}
      </span>
      <span className={cn("type-body flex-1", p.text)}>{text}</span>
      {interactive && keyHint ? <KeyHint keys={keyHint} /> : null}
    </button>
  );
}
