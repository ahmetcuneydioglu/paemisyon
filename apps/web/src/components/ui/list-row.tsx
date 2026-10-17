import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Base = {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  divider?: boolean;
  className?: string;
};

/**
 * Liste satırı: başlık, alt başlık, sol öğe, sağ öğe, ok. 1 px çizgiyle ayrılır; ≥52 px.
 * `href` → Link, `onClick` → button, ikisi yoksa statik satır.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  divider = true,
  className,
  href,
  onClick,
}: Base & {
  href?: ComponentProps<typeof Link>["href"];
  onClick?: () => void;
}) {
  const interactive = Boolean(href || onClick);
  const showChevron = chevron ?? interactive;
  const content = (
    <>
      {leading ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-alt text-ink-soft">
          {leading}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="type-subhead text-ink">{title}</span>
        {subtitle ? (
          <span className="type-body-sm text-ink-soft">{subtitle}</span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      {showChevron ? (
        <ChevronRight
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-ink-subtle"
          aria-hidden
        />
      ) : null}
    </>
  );
  const cls = cn(
    "flex min-h-13 w-full items-center gap-3 py-3",
    divider && "border-b border-line",
    interactive &&
      "tk-interactive cursor-pointer hover:bg-surface-alt/60 -mx-2 px-2 rounded-control",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}
