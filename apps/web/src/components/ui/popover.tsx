"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Açılır panel (odak seçici, küçük menüler). Tetikleyici render-prop ile gelir;
 * panel tetikleyicinin altına açılır, dış tıklama ve Esc kapatır. Dar ekranda
 * Dialog tercih edilir — bu bileşen masaüstü konforu içindir.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  className,
}: {
  trigger: (p: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={root} className="relative inline-block">
      {trigger({ open, toggle: () => setOpen((v) => !v), id })}
      {open ? (
        <div
          id={id}
          role="dialog"
          className={cn(
            "absolute top-full z-30 mt-2 min-w-64 rounded-card border border-line bg-surface p-2",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}
