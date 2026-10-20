import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Araç satırı: sol ikon kutusu, başlık/alt satır, sağ ok. `href` yoksa pasif (soluk). */
export function ToolRow({
  icon: Icon,
  title,
  subtitle,
  href,
  divider = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href?: string | null;
  divider?: boolean;
}) {
  const inner = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-alt">
        <Icon
          size={18}
          strokeWidth={1.75}
          className="text-ink-soft"
          aria-hidden
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn("type-subhead", href ? "text-ink" : "text-ink-soft")}
        >
          {title}
        </span>
        <span className="type-body-sm text-ink-subtle">{subtitle}</span>
      </span>
      {href ? (
        <ChevronRight
          size={18}
          className="shrink-0 text-ink-subtle"
          aria-hidden
        />
      ) : null}
    </>
  );
  const cls = cn(
    "flex min-h-14 items-center gap-3 py-2",
    divider && "border-b border-line",
  );
  return href ? (
    <Link href={href} className={cn(cls, "tk-interactive hover:opacity-80")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
