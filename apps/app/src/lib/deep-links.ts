/**
 * Push `data.route` ve `paemisyon.com/bildirim?git=` sözlüğü → uygulama yolu (tek tablo).
 * Sunucu/panel değerleri: daily-quiz, denemeler, leaderboard, deneme-sonuc/<oturum>,
 * question:<uuid>, boş (aç). Web karşılığı: apps/web/src/lib/routes.ts bildirimRotasi.
 * Koç CTA'larının eğik çizgili yolları da (/quiz, /review, /catalog, /denemeler, /denemeler/<id>)
 * burada eşlenir. Bilinmeyen değer Bugün'e düşer (kayıp iş yok, sürpriz yok).
 */
export type AppHref = { pathname: string; params?: Record<string, string> };

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
/** Kart modları (sunucu FLASHCARD_MODES ile aynı). */
const KART_MODLARI = ["due", "new", "hard", "favorites", "all", "mixed"];

export function routeToHref(route: string | null | undefined): AppHref {
  const r = (route ?? "").trim();
  if (!r) return { pathname: "/(tabs)" };
  if (r === "daily-quiz") return { pathname: "/seans", params: { mode: "daily", count: "10", source: "notif" } };
  if (r === "denemeler" || r === "/denemeler") return { pathname: "/(tabs)/denemeler" };
  if (r === "leaderboard" || r === "/leaderboard") return { pathname: "/(tabs)/ben/liderlik" };
  // Düello daveti (Doc 59): merkez; bekleyen davet orada kabul edilir.
  if (r === "duello" || r === "/duello") return { pathname: "/(tabs)/kutuphane/duello" };
  // "Sonucun açıklandı" ve "Netin güncellendi" push'ları (exams.service, admin-exam-adjustments).
  // 26 Eki 2026'ya kadar tanınmıyordu, Bugün'e düşüyordu.
  const sonuc = r.match(/^deneme-sonuc\/([0-9a-fA-F-]{36})$/);
  if (sonuc) return { pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: sonuc[1]! } };
  // Zayıf konu turu (Doc 52 F3): 10 soruluk konu alıştırması.
  const topic = r.match(/^topic:([0-9a-fA-F-]{36})$/);
  if (topic) return { pathname: "/seans", params: { mode: "practice", source: "notif", count: "10", focusKind: "topic", topicId: topic[1]!, courseId: "", recipe: "" } };
  const q = r.match(/^question:(.+)$/);
  if (q && UUID.test(q[1]!)) return { pathname: "/seans", params: { mode: "practice", questionId: q[1]!, count: "1", source: "notif" } };
  const exam = r.match(/^\/denemeler\/([0-9a-fA-F-]{36})$/);
  // Deneme bildirimi oynatıcıya değil "Başlamadan önce" ekranına iner (20 Kas 2026): süre o ekrandaki
  // düğmeyle başlar; devam eden, çözülmüş ya da henüz açılmamış deneme de doğru düğmeyi orada görür.
  if (exam) return { pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: exam[1]!, role: "" } };
  // Konu özeti ünitesi (Doc 53): web /ozet/<slug> ile aynı adres.
  const ozet = r.match(/^\/?ozet\/([a-z0-9-]+)$/);
  if (ozet) return { pathname: "/ozet/[slug]", params: { slug: ozet[1]! } };
  // Bilgi kartları (Doc 56): "/kartlar[?mode=…&topicId=…]" (koç kartı, bildirim, web ile aynı adres);
  // "flashcards" (push sözlüğü); "flashcards:<topicUuid>" konu kapsamı. Mod sunucu listesinden değilse vade.
  const kartlar = r.match(/^(?:\/kartlar|kartlar|flashcards)(?:\?(.*))?$/);
  if (kartlar) {
    const qs = new URLSearchParams(kartlar[1] ?? "");
    const mode = qs.get("mode") ?? "due";
    const params: Record<string, string> = { mode: KART_MODLARI.includes(mode) ? mode : "due", source: qs.get("source") ?? "notif" };
    for (const k of ["topicId", "courseId", "unitSlug"] as const) {
      const v = qs.get(k);
      if (v) params[k] = v;
    }
    return { pathname: "/kartlar", params };
  }
  const kart = r.match(/^flashcards:([0-9a-fA-F-]{36})$/);
  if (kart) return { pathname: "/kartlar", params: { mode: "due", source: "notif", topicId: kart[1]! } };
  if (r === "/quiz") return { pathname: "/seans", params: { mode: "practice", count: "10", source: "notif" } };
  if (r === "/review") return { pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "yanlislar" } };
  if (r === "/catalog") return { pathname: "/(tabs)/kutuphane" };
  if (r === "/onboarding") return { pathname: "/onboarding" };
  return { pathname: "/(tabs)" };
}

/**
 * Mağaza rotası (sunucu `app_update` hedefi, 19 Kas 2026): uygulama içi ekran değil, cihazın kendi
 * mağazası (`storeUrl`, app-meta.ts). Bildirimin `minAppVersion`'ı mağazadaki sürümdür: ondan eski
 * uygulama mağazaya gider, o sürüm ve üstü güncel sayılır ve uygulamada kalır. Dokunuş noktaları
 * `routeToHref`'ten ve genel sürüm kapısından ÖNCE `storeAction` sorar (güncel olmayan uygulama
 * kutuya uğramadan doğrudan mağazaya gitsin). Rotayı tanımayan 2.0 güncelse Bugün'e, eskiyse
 * sunucu kapısından kutuya düşer.
 */
export const STORE_ROUTE = "store";

export function isStoreRoute(route: string | null | undefined): boolean {
  return (route ?? "").trim() === STORE_ROUTE;
}

/** Mağaza rotasında yapılacak: `store` mağazayı aç, `stay` uygulama güncel; başka rotada null. */
export function storeAction(route: string | null | undefined, upToDate: boolean): "store" | "stay" | null {
  if (!isStoreRoute(route)) return null;
  return upToDate ? "stay" : "store";
}

/** `https://paemisyon.com/bildirim?git=<route>` → route; başka URL'de null. */
export function routeFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)paemisyon\.com$/.test(u.hostname) || !u.pathname.startsWith("/bildirim")) return null;
    return u.searchParams.get("git") ?? "";
  } catch {
    return null;
  }
}
