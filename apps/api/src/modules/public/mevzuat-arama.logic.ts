/**
 * Mevzuat araması — Türkçe ek toleranslı önek sorgusu (13 Kas 2026, Faz 4).
 *
 * Madde indeksi `to_tsvector('simple', tr_unaccent(...))`: kök bulma yok. "kimlik sorma" araması
 * PVSK md 4/A'yı ("kimliğini sorabilir") bulamıyordu; arama ekranının kendi örneği boş dönüyordu.
 * Tam stemmer yerine kaba ve öngörülebilir bir kural: her kelimeden mastar/isim-fiil eki atılır,
 * sondaki sert ünsüz (k, p, t, ç) yumuşamaya karşı düşürülür, kalan gövde ÖNEK olarak aranır.
 *   "kimlik sorma" → "kimli:* & sor:*"     "zor kullanma" → "zor:* & kullan:*"
 * Yalnız birincil arama az sonuç verdiğinde YEDEK olarak çalışır; gürültü bu yüzden sınırlı kalır.
 */
const TR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

function sade(kelime: string): string {
  return kelime
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^a-z0-9]/g, '');
}

/** Tek kelimenin aranacak gövdesi; çok kısa kalan (≤2) kelime null (gürültü). */
export function kelimeGovdesi(kelime: string): string | null {
  let g = sade(kelime);
  if (/^\d+$/.test(g)) return g.length >= 1 ? g : null;
  // Mastar ve isim-fiil: "kullanmak", "sorma", "gözaltına alma" → gövde.
  g = g.replace(/(mak|mek|ma|me)$/, (ek) => (g.length - ek.length >= 3 ? '' : ek));
  // Sert ünsüz yumuşaması: "kimlik" ~ "kimligini", "kitap" ~ "kitabi".
  if (g.length >= 5 && /[kptc]$/.test(g)) g = g.slice(0, -1);
  return g.length >= 3 ? g : null;
}

/** `to_tsquery('simple', …)` için güvenli önek sorgusu; kullanılabilir kelime yoksa null. */
export function onekSorgusu(q: string): string | null {
  const govdeler = q
    .split(/\s+/)
    .map(kelimeGovdesi)
    .filter((x): x is string => x != null)
    .slice(0, 6);
  if (govdeler.length === 0) return null;
  return [...new Set(govdeler)].map((g) => `${g}:*`).join(' & ');
}
