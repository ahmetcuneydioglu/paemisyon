"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "tk-coach-rail";

/**
 * Koç rayı aç/kapat (Doc 27 §2.3): kapatılabilir, durumu oturumlar arası kalıcı.
 * 1024–1279 arasında ray gizlidir (Doc 27 §4); ≥1280 açılır. İçerik sunucudan.
 */
export function RailToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(localStorage.getItem(STORAGE_KEY) !== "closed");
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function toggle() {
    setOpen((v) => {
      localStorage.setItem(STORAGE_KEY, v ? "closed" : "open");
      return !v;
    });
  }

  if (!ready)
    return <div className="w-80 shrink-0 max-xl:hidden">{children}</div>;

  if (!open) {
    return (
      <div className="shrink-0 max-xl:hidden">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={false}
          aria-label="Koç rayını aç"
          title="Koç rayını aç"
          className="tk-interactive sticky top-20 flex size-11 cursor-pointer items-center justify-center rounded-control border border-line text-ink-soft hover:border-ink-soft hover:text-ink"
        >
          <PanelRightOpen size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 max-xl:hidden">
      <div className="sticky top-20">
        <div className="mb-2 flex items-center justify-between">
          <span className="type-label text-ink-subtle">Koç</span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded
            aria-label="Koç rayını gizle"
            title="Koç rayını gizle"
            className="tk-interactive flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-subtle hover:bg-surface-alt hover:text-ink"
          >
            <PanelRightClose size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
