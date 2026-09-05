import { redirect } from "next/navigation";
import { webRoute } from "@/lib/routes";

/**
 * Bildirim tıklama sıçrama noktası.
 *
 * Push yükündeki `route` mobil uygulamanın dilindedir ("/quiz", "/review"…);
 * web karşılıkları farklı ("/seans", "/seans?mode=review"…). Bu eşleme
 * `webRoute` içinde tek yerde duruyor. Sunucu bildirimin bağlantısını
 * `/bildirim?git=<route>` olarak gönderir, burası çevirip yönlendirir —
 * böylece eşleme API'de ve service worker'da TEKRARLANMAZ.
 */
export const dynamic = "force-dynamic";

export default async function BildirimPage({
  searchParams,
}: {
  searchParams: Promise<{ git?: string }>;
}) {
  const { git } = await searchParams;
  // Açık yönlendirme koruması: yalnız uygulama içi göreli yollar.
  const guvenli =
    typeof git === "string" && git.startsWith("/") && !git.startsWith("//") && !git.includes("\\")
      ? git
      : "/bugun";
  redirect(webRoute(guvenli));
}
