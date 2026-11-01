import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Eylem kutusu (Doc 49/17; Expo `ActionTile` karşılığı): ikon + başlık + tek satır durum.
 * `primary` altın zeminli tek birincil eylem. `href` ya da `onClick` yoksa pasif: sönük,
 * alt yazı nedenini söyler, `aria-disabled`.
 */
export function ActionTile({
  icon: Icon,
  title,
  subtitle,
  variant = "default",
  href,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  variant?: "primary" | "default";
  href?: string | null;
  onClick?: (() => void) | null;
}) {
  const primary = variant === "primary";
  const active = Boolean(href || onClick);
  const cls = cn(
    "flex min-h-28 flex-col gap-3 rounded-card p-4 text-left",
    primary
      ? "bg-accent text-on-accent"
      : "border border-line bg-surface text-ink",
    active
      ? "tk-interactive cursor-pointer hover:brightness-105 active:scale-[0.99]"
      : "cursor-not-allowed opacity-50",
  );
  const inner = (
    <>
      <Icon
        size={24}
        strokeWidth={1.75}
        aria-hidden
        className={
          primary
            ? "text-on-accent"
            : active
              ? "text-accent-ink"
              : "text-ink-subtle"
        }
      />
      <span className="flex flex-col gap-0.5">
        <span className="type-subhead text-[16px]">{title}</span>
        <span
          className={cn(
            "type-body-sm",
            primary ? "text-on-accent/85" : "text-ink-soft",
          )}
        >
          {subtitle}
        </span>
      </span>
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-disabled={!onClick}
    >
      {inner}
    </button>
  );
}
