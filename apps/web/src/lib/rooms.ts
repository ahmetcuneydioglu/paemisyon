import type { Band } from "./public-api";

/** Band → metin sınıfı; eşik sunucuda. Açık temada altın metin yok (accent-ink kahve). */
export function bandTextClass(b: Band): string {
  return b === "weak"
    ? "text-accent-ink"
    : b === "strong"
      ? "text-success-ink"
      : b === "new" || b === "sparse"
        ? "text-ink-subtle"
        : "text-ink";
}

/** Hâkimiyet yüzdesi sınıfı (Çalış v2 kartı): zayıf mercan, güçlü yeşil, diğerleri altın/kahve. */
export function bandPctClass(b: Band): string {
  return b === "weak"
    ? "text-danger-ink"
    : b === "strong"
      ? "text-success-ink"
      : b === "new" || b === "sparse"
        ? "text-ink-subtle"
        : "text-accent-ink";
}

/** Çubuk tonu — band sunucudan. */
export function bandBarTone(b: Band): "danger" | "success" | "accent" {
  return b === "weak" ? "danger" : b === "strong" ? "success" : "accent";
}
