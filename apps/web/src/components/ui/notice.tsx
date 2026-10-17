import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NoticeTone = "info" | "success" | "warning" | "error";

const toneClass: Record<NoticeTone, string> = {
  info: "bg-surface-alt text-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  error: "bg-danger-soft text-danger-ink",
};

/** Bildirim kutusu: `*Soft` zemin + `*Ink` metin (kontrast çiftleri token testinde). */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-1 rounded-card p-4",
        toneClass[tone],
        className,
      )}
    >
      {title ? <p className="type-subhead">{title}</p> : null}
      {children ? <div className="type-body-sm">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
