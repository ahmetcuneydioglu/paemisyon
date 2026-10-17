import Link from "next/link";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * L3 Odak şablonu (Doc 27 §1): ince şerit (çıkış · bağlam · ilerleme · süre) +
 * soru alanı (≤65ch) + yardımcı panel. Sidebar ve koç rayı YOK. Seans ve deneme
 * oynatıcıları bunun içine yerleşir (W-D).
 */
export function FocusFrame({
  context,
  progress,
  timer,
  exitHref,
  onExit,
  children,
  aside,
  asideLabel = "Yardımcı panel",
  className,
}: {
  /** "Bugün: CMK ağırlıklı — 3 haftadır düşüş" gibi tek satır reçete şeffaflığı. */
  context?: ReactNode;
  progress?: ReactNode;
  timer?: ReactNode;
  exitHref?: string;
  onExit?: () => void;
  children: ReactNode;
  aside?: ReactNode;
  asideLabel?: string;
  className?: string;
}) {
  const exitCls =
    "tk-interactive flex size-11 shrink-0 items-center justify-center rounded-control text-ink-soft hover:bg-surface-alt hover:text-ink";
  return (
    <div className={cn("flex min-h-dvh flex-col bg-bg", className)}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-3 backdrop-blur md:px-6">
        {exitHref ? (
          <Link href={exitHref} aria-label="Çıkış" className={exitCls}>
            <X size={22} strokeWidth={1.75} aria-hidden />
          </Link>
        ) : onExit ? (
          <button
            type="button"
            onClick={onExit}
            aria-label="Çıkış"
            className={exitCls}
          >
            <X size={22} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
        <div className="type-body-sm min-w-0 flex-1 truncate text-ink-soft">
          {context}
        </div>
        {progress ? (
          <div className="hidden min-w-40 md:block">{progress}</div>
        ) : null}
        {timer ? (
          <div className="type-stat tabular text-ink">{timer}</div>
        ) : null}
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 md:px-6">
        <main className="min-w-0 flex-1 lg:max-w-[65ch]">{children}</main>
        {aside ? (
          <aside
            aria-label={asideLabel}
            className="hidden w-80 shrink-0 lg:block"
          >
            <div className="sticky top-20">{aside}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
