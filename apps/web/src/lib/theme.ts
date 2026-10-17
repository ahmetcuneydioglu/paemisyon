/**
 * Tema modu (Doc 49/11 karar 1): "system" (cihaz tercihi — varsayılan; koyu birincil
 * tasarım, tokens.css `prefers-color-scheme` ile), "light", "dark" (kalıcı seçim).
 * Eski "auto" (saate göre) kaldırıldı; kayıtlı "auto" sistem sayılır.
 */
export type ThemeMode = "system" | "light" | "dark";
export const THEME_KEY = "tk-theme";

export function normalizeMode(raw: string | null | undefined): ThemeMode {
  return raw === "light" || raw === "dark" ? raw : "system";
}

/** data-theme değeri: açık seçimde zorlanır, sistemde kaldırılır (CSS medya sorgusu karar verir). */
export function themeAttribute(mode: ThemeMode): "light" | "dark" | null {
  return mode === "system" ? null : mode;
}

/**
 * <head>'e gömülecek boya-öncesi script (flash yok). localStorage'daki modu okur;
 * light/dark ise <html data-theme> ayarlar, sistemde özniteliği kaldırır.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${THEME_KEY}');var d=document.documentElement;if(m==='light'||m==='dark'){d.dataset.theme=m}else{delete d.dataset.theme}}catch(e){}})();`;
