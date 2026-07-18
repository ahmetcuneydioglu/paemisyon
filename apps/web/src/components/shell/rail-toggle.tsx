"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tk-coach-rail";

/**
 * Koç rayı aç/kapat sarmalayıcısı (Doc 27 §2.3): kapatılabilir, durumu
 * oturumlar arası hatırlanır. İçerik sunucuda render edilir; bu bileşen
 * yalnız görünürlüğü yönetir.
 */
export function RailToggle({ children }: { children: React.ReactNode }) {
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

  if (!ready) return <div className="w-72 shrink-0 max-xl:hidden">{children}</div>;

  if (!open) {
    return (
      <div className="shrink-0 max-xl:hidden">
        <button
          type="button"
          onClick={toggle}
          className="tk-interactive sticky top-6 cursor-pointer rounded-sm border border-line px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-soft [writing-mode:vertical-rl] hover:border-ink-soft hover:text-ink"
          aria-expanded={false}
        >
          Koç ▸
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 max-xl:hidden">
      {children}
      <button
        type="button"
        onClick={toggle}
        className="tk-caption mt-2 block w-full cursor-pointer text-center hover:text-ink"
        aria-expanded
      >
        rayı gizle ⌃
      </button>
    </div>
  );
}
