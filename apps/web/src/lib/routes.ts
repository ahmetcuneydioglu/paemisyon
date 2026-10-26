/**
 * Koç kartı route'ları (mobil sözleşmesi) → web sayfası eşlemesi (Doc 23/27).
 * Kartlar sunucudan gelir; web yalnız adres çevirir, kural bilmez.
 */
export function webRoute(route: string, type?: string, meta?: Record<string, unknown>): string {
  // Zayıf konu / ünite reçetesi (Doc 53 F5-3): sunucu güvenli "/quiz" gönderir, kapsamı meta taşır.
  if (route === "/quiz" && meta && typeof meta.topicId === "string") {
    const recipe = meta.recipe as { session?: { topicId: string; articleNos: string[]; count: number } } | undefined;
    const q = new URLSearchParams({
      topicId: meta.topicId,
      count: String(recipe?.session?.count ?? 10),
      source: "home_weak_topic",
      scope: typeof meta.topicName === "string" ? meta.topicName : "Zayıf konu",
    });
    if (recipe?.session?.articleNos?.length) q.set("articleNos", recipe.session.articleNos.join(","));
    return `/seans?${q.toString()}`;
  }
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

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Push yükündeki `route` (mobil sözlüğü, Doc 49/08) → web yolu. Sunucu bu değerleri
 * `/bildirim?git=<route>` olarak gönderir (push.service.ts webLink). Sözlük eğik
 * çizgisizdir: `daily-quiz`, `denemeler`, `leaderboard`, `deneme-sonuc/<oturum>`,
 * `question:<uuid>`; koç kartlarının eğik çizgili yolları da gelebilir, onlar
 * `webRoute` ile çevrilir. Bilinmeyen ya da güvensiz değer Bugün'e düşer — açık
 * yönlendirme yolu yoktur (yalnız uygulama içi göreli yollar üretilir).
 *
 * Mobil karşılığı: apps/app/src/lib/deep-links.ts routeToHref. İki tablo aynı
 * sözlüğü tanımalı; Doc 52 §5 bunu sunucuda tek kayıt defterine taşıyacak.
 */
export function bildirimRotasi(git: string | null | undefined): string {
  const r = (git ?? "").trim();
  if (!r) return "/bugun";
  if (r === "daily-quiz") return "/seans?mode=daily&source=notif";
  if (r === "denemeler") return "/denemeler";
  if (r === "leaderboard") return "/liderlik";
  const sonuc = r.match(/^deneme-sonuc\/([0-9a-fA-F-]{36})$/);
  if (sonuc) return `/sonuc/${sonuc[1]}`;
  const soru = r.match(/^question:(.+)$/);
  if (soru && UUID.test(soru[1]!)) {
    return `/seans?mode=practice&questionId=${soru[1]}&count=1&source=notif`;
  }
  // Eğik çizgili göreli yol: koç kartı sözleşmesi. `//` ve ters bölü açık
  // yönlendirme girişimidir, kabul edilmez.
  if (r.startsWith("/") && !r.startsWith("//") && !r.includes("\\")) {
    return webRoute(r);
  }
  return "/bugun";
}
