"use client";

import { useEffect } from "react";
import { THEME_KEY, normalizeMode, themeAttribute } from "@/lib/theme";

/** ThemeToggle bu olayla yeniden değerlendirme tetikler. */
export const THEME_EVENT = "paemisyon:theme";

function apply() {
  const attr = themeAttribute(normalizeMode(localStorage.getItem(THEME_KEY)));
  const d = document.documentElement;
  if (attr) d.dataset.theme = attr;
  else delete d.dataset.theme;
}

/**
 * Tema sürücüsü (Doc 49/11 karar 1): kalıcı seçim varsa uygular; "system" modda
 * hiçbir öznitelik basmaz, geçişi CSS medya sorgusu yapar (zamanlayıcı yok).
 * Sekmeler arası senkron + toggle olayı.
 */
export function ThemeProvider() {
  useEffect(() => {
    apply();
    const onStorage = (e: StorageEvent) => e.key === THEME_KEY && apply();
    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, apply);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, apply);
    };
  }, []);
  return null;
}
