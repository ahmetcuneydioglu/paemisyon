/** Anahtar sırasından bağımsız JSON karşılaştırması (jsonb anahtar sırasını korumaz). */
export function canonicalJson(v: unknown): string {
  const norm = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(norm);
    if (x && typeof x === 'object')
      return Object.fromEntries(
        Object.entries(x as Record<string, unknown>)
          .filter(([, val]) => val !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, val]) => [k, norm(val)]),
      );
    return x;
  };
  return JSON.stringify(norm(v));
}
