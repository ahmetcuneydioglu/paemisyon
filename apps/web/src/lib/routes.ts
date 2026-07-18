/**
 * Koç kartı route'ları (mobil sözleşmesi) → web sayfası eşlemesi (Doc 23/27).
 * Kartlar sunucudan gelir; web yalnız adres çevirir, kural bilmez.
 */
export function webRoute(route: string): string {
  if (route.startsWith("/denemeler")) return route;
  if (route === "/quiz" || route === "/review") return "/seans";
  if (route === "/catalog") return "/kanunlar";
  return route;
}
