"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, normalizeMode, type ThemeMode } from "@/lib/theme";
import { THEME_EVENT } from "./theme-provider";

const OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: "system", label: "Sistem", icon: "◐" },
  { mode: "light", label: "Açık", icon: "☀" },
  { mode: "dark", label: "Koyu", icon: "☾" },
];

/**
 * Tema geçişi (Doc 49/11 karar 1): Sistem · Açık · Koyu. Seçim localStorage'da;
 * ThemeProvider anında uygular. Varsayılan Sistem (koyu birincil tasarım).
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const t = setTimeout(
      () => setMode(normalizeMode(localStorage.getItem(THEME_KEY))),
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
          title={o.mode === "system" ? "Cihaz tercihini izle" : o.label}
          className={[
            "tk-interactive cursor-pointer rounded-full px-2 py-1 text-[12px] font-bold",
            mode === o.mode
              ? "bg-accent-soft text-accent-ink"
              : "text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          <span aria-hidden>{o.icon}</span>
          {!compact && <span className="ml-1">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}
