"use client";

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dim";

const stateClasses: Record<OptionState, string> = {
  idle: "border-line bg-surface text-ink hover:border-ink-soft",
  selected: "border-session bg-session/10 text-ink",
  correct: "border-success bg-success/10 text-success",
  wrong: "border-danger bg-danger/10 text-danger",
  dim: "border-line bg-surface text-ink-soft opacity-55",
};

/**
 * Şık satırı (Doc 26 #5). Doğru/yanlış renk + ikon + metinle ANINDA verilir
 * (animasyonla geciktirilmez); renk tek başına anlam taşımaz (a11y).
 */
export function OptionRow({
  label,
  text,
  state = "idle",
  keyHint,
  disabled,
  onSelect,
}: {
  label: string;
  text: string;
  state?: OptionState;
  /** Klavye ipucu (web: "1"–"4") — Doc 27 §2.2. */
  keyHint?: string;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const suffix =
    state === "correct" ? (
      <span className="shrink-0 font-bold" aria-label="doğru cevap">✓</span>
    ) : state === "wrong" ? (
      <span className="shrink-0 font-bold" aria-label="yanlış cevap">✗</span>
    ) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={[
        "tk-interactive flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-left text-[15px]",
        "disabled:cursor-default",
        stateClasses[state],
      ].join(" ")}
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-sm border border-current/30 font-heading text-[13px] font-bold"
        aria-hidden
      >
        {label}
      </span>
      <span className="min-w-0 flex-1">{text}</span>
      {suffix}
      {keyHint && state === "idle" && !disabled && (
        <kbd className="tk-caption shrink-0 rounded border border-line px-1.5 py-0.5" aria-hidden>
          {keyHint}
        </kbd>
      )}
    </button>
  );
}
