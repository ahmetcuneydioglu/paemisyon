"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, type ThemeMode } from "@/lib/theme";
import { THEME_EVENT } from "./theme-provider";

const OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: "auto", label: "Oto", icon: "◐" },
  { mode: "light", label: "Açık", icon: "☀" },
  { mode: "dark", label: "Koyu", icon: "☾" },
];

/**
 * Tema geçişi (Doc 26): Oto (gündüz/gece) · Açık · Koyu. Seçim localStorage'da;
 * ThemeProvider anında uygular. Varsayılan Oto.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const t = setTimeout(
      () => setMode((localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "auto"),
      0,
    );
    return () => clearTimeout(t);
  }, []);

  function pick(next: ThemeMode) {
    setMode(next);
    localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.mode}
          type="button"
          role="radio"
          aria-checked={mode === o.mode}
          onClick={() => pick(o.mode)}
          title={o.mode === "auto" ? "Otomatik — gündüz açık, gece koyu" : o.label}
          className={[
            "tk-interactive cursor-pointer rounded-full px-2 py-1 text-[12px] font-bold",
            mode === o.mode ? "bg-brand/10 text-brand" : "text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          <span aria-hidden>{o.icon}</span>
          {!compact && <span className="ml-1">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}
