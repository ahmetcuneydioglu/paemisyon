import { cn } from "@/lib/cn";

/** Klavye ipucu (⌘K, 1–5, Enter): yalnız işaretçi fareyse anlamlı; ekran okuyucuya gizli. */
export function KeyHint({
  keys,
  className,
}: {
  keys: string;
  className?: string;
}) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "hidden rounded-[6px] border border-line bg-surface-alt px-1.5 py-0.5 font-body text-[11px] leading-4 font-semibold text-ink-soft md:inline-block",
        className,
      )}
    >
      {keys}
    </kbd>
  );
}
