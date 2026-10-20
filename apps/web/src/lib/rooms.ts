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

/** Düğme etiketi için kısa ders adı: "Anayasa Hukuku" → "Anayasa". Ek yok (ünlü uyumu). */
export function kisaAd(name: string): string {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 && /hukuku|bilgisi/i.test(w[w.length - 1]!)
    ? w.slice(0, -1).join(" ")
    : name;
}
