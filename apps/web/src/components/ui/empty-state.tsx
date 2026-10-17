import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconProps = {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
};

/** Boş durum: ikon, başlık, bir cümle, isteğe bağlı eylem. "Henüz yeterli veri yok" dili. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ComponentType<IconProps>;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-14 items-center justify-center rounded-card bg-surface-alt text-ink-soft">
          <Icon size={26} strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <h2 className="type-heading text-ink">{title}</h2>
      {body ? (
        <p className="type-body-sm max-w-md text-ink-soft">{body}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
