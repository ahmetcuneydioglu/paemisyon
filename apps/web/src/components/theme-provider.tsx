"use client";

import { useEffect } from "react";
import { THEME_KEY, resolveTheme, type ThemeMode } from "@/lib/theme";

/** ThemeToggle bu olayla yeniden değerlendirme tetikler. */
export const THEME_EVENT = "paemisyon:theme";

function apply() {
  const mode = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "auto";
  document.documentElement.dataset.theme = resolveTheme(mode);
}

/**
 * Tema sürücüsü (Doc 26 dark-mode): "auto" modda gündüz/gece geçişini canlı
 * uygular. Sekmeler arası senkron + saat başı yeniden değerlendirme.
 */
export function ThemeProvider() {
  useEffect(() => {
    apply();
    // "auto" için periyodik yeniden değerlendirme (gece/gündüz sınırı).
    const t = setInterval(apply, 5 * 60_000);
    // Diğer sekmede değişince + toggle olayında + sekmeye dönünce.
    const onStorage = (e: StorageEvent) => e.key === THEME_KEY && apply();
    const onVisible = () => document.visibilityState === "visible" && apply();
    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, apply);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, apply);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
