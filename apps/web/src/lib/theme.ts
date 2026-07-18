/**
 * Tema modu: "auto" (gündüz/gece — saate göre), "light", "dark".
 * Varsayılan "auto": tüm cihazlarda tutarlı, gündüz açık / gece koyu.
 */
export type ThemeMode = "auto" | "light" | "dark";
export const THEME_KEY = "tk-theme";

/** Gece penceresi: 19.00–07.00 arası koyu (yerel saat). */
export function isNightHour(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 19 || h < 7;
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  return isNightHour() ? "dark" : "light";
}

/**
 * <head>'e gömülecek boya-öncesi script (flash yok). ThemeProvider'dan bağımsız
 * çalışır; localStorage'daki modu okuyup <html data-theme> ayarlar.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${THEME_KEY}')||'auto';var t;if(m==='light'||m==='dark'){t=m}else{var h=new Date().getHours();t=(h>=19||h<7)?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;
