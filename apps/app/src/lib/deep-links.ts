/**
 * Push `data.route` ve `paemisyon.com/bildirim?git=` sözlüğü → uygulama yolu (tek tablo).
 * Sunucu/panel değerleri: daily-quiz, denemeler, leaderboard, deneme-sonuc/<oturum>,
 * question:<uuid>, boş (aç). Web karşılığı: apps/web/src/lib/routes.ts bildirimRotasi.
 * Koç CTA'larının eğik çizgili yolları da (/quiz, /review, /catalog, /denemeler, /denemeler/<id>)
 * burada eşlenir. Bilinmeyen değer Bugün'e düşer (kayıp iş yok, sürpriz yok).
 */
export type AppHref = { pathname: string; params?: Record<string, string> };

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function routeToHref(route: string | null | undefined): AppHref {
  const r = (route ?? "").trim();
  if (!r) return { pathname: "/(tabs)" };
  if (r === "daily-quiz") return { pathname: "/seans", params: { mode: "daily", count: "10", source: "notif" } };
  if (r === "denemeler" || r === "/denemeler") return { pathname: "/(tabs)/denemeler" };
  if (r === "leaderboard" || r === "/leaderboard") return { pathname: "/(tabs)/performans/liderlik" };
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
  if (exam) return { pathname: "/seans", params: { exam: exam[1]! } };
  // Konu özeti ünitesi (Doc 53): web /ozet/<slug> ile aynı adres.
  const ozet = r.match(/^\/?ozet\/([a-z0-9-]+)$/);
  if (ozet) return { pathname: "/ozet/[slug]", params: { slug: ozet[1]! } };
  if (r === "/quiz") return { pathname: "/seans", params: { mode: "practice", count: "10", source: "notif" } };
  if (r === "/review") return { pathname: "/(tabs)/kutuphane/tekrar", params: { sekme: "yanlislar" } };
  if (r === "/catalog") return { pathname: "/(tabs)/kutuphane" };
  if (r === "/onboarding") return { pathname: "/onboarding" };
  return { pathname: "/(tabs)" };
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
