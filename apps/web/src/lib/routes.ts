/**
 * Koç kartı route'ları (mobil sözleşmesi) → web sayfası eşlemesi (Doc 23/27).
 * Kartlar sunucudan gelir; web yalnız adres çevirir, kural bilmez.
 */
export function webRoute(route: string): string {
  if (route.startsWith("/denemeler")) return route;
  if (route === "/quiz") return "/seans";
  if (route === "/review") return "/seans?mode=review&scope=Yanl%C4%B1%C5%9F%20tekrar%C4%B1";
  if (route === "/catalog") return "/kanunlar";
  return route;
}
