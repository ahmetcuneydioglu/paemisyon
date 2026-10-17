/** Sınıf birleştirici: falsy değerleri atar (bağımlılıksız). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
