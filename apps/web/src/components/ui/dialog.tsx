"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";

/**
 * Diyalog — Expo `Sheet`'in web karşılığı. Yerel <dialog>: odak tuzağı, Esc ve
 * arka plan tarayıcıdan. Dar ekranda alttan sayfa, geniş ekranda ortalı kart.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  const width =
    size === "sm"
      ? "md:max-w-sm"
      : size === "lg"
        ? "md:max-w-2xl"
        : "md:max-w-lg";
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
      className={cn(
        "m-0 w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-black/50",
        // dar: alttan; geniş: ortalı
        "fixed inset-x-0 bottom-0 top-auto md:inset-0 md:m-auto md:h-fit",
        width,
      )}
    >
      <div className="flex max-h-[85dvh] flex-col rounded-t-sheet border border-line bg-surface md:rounded-sheet">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <h2 className="type-heading flex-1 text-ink">{title}</h2>
          <IconButton
            icon={X}
            label="Kapat"
            variant="ghost"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? (
          <div className="border-t border-line px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
