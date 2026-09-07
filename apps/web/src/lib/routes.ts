/**
 * Koç kartı route'ları (mobil sözleşmesi) → web sayfası eşlemesi (Doc 23/27).
 * Kartlar sunucudan gelir; web yalnız adres çevirir, kural bilmez.
 */
export function webRoute(route: string, type?: string): string {
  // Çıkmış sınavlar (Doc 36): sunucu güvenli rota (/denemeler) gönderir, hedefi
  // kart TİPİ belirler — eski mobil sürümler bilmedikleri rotada hata ekranı
  // görmesin diye. Web'de karşılığı public vitrindir.
  if (type === "cikmis_sinav") return "/paem-cikmis-sorular";
  // Sunucu ileride doğrudan bu rotayı gönderirse de doğru yere gitsin; satır
  // "/denemeler" geçişinden ÖNCE olmalı, yoksa olduğu gibi geçip 404 verir.
  if (route.startsWith("/denemeler/cikmis")) return "/paem-cikmis-sorular";
  if (route.startsWith("/denemeler")) return route;
  if (route === "/quiz") return "/seans";
  if (route === "/review") return "/seans?mode=review&scope=Yanl%C4%B1%C5%9F%20tekrar%C4%B1";
  if (route === "/catalog") return "/kanunlar";
  return route;
}
