import { redirect } from "next/navigation";
import { bildirimRotasi } from "@/lib/routes";

/**
 * Bildirim tıklama sıçrama noktası.
 *
 * Push yükündeki `route` mobil uygulamanın dilindedir: eğik çizgisiz sözlük
 * ("daily-quiz", "deneme-sonuc/<id>"…) ya da koç kartı yolu ("/quiz", "/review").
 * Web karşılıkları farklı ("/seans", "/sonuc/<id>"…). Eşleme `bildirimRotasi`
 * içinde tek yerde duruyor; güvenlik (açık yönlendirme yok) da orada. Sunucu
 * bildirimin bağlantısını `/bildirim?git=<route>` olarak gönderir, burası
 * çevirip yönlendirir — böylece eşleme API'de ve service worker'da TEKRARLANMAZ.
 *
 * 26 Eki 2026'ya kadar yalnız "/" ile başlayan değer kabul ediliyordu; sunucunun
 * gönderdiği sözlük eğik çizgisiz olduğu için her web tıklaması /bugun'a düşüyordu.
 */
export const dynamic = "force-dynamic";

export default async function BildirimPage({
  searchParams,
}: {
  searchParams: Promise<{ git?: string; nid?: string }>;
}) {
  const { git, nid } = await searchParams;
  const hedef = bildirimRotasi(git);
  // Web push tıklaması: kabuk `nid` ile `opened` olayını yazar (Doc 52 §9).
  const temizNid = typeof nid === "string" && /^[0-9a-f-]{36}$/i.test(nid) ? nid : null;
  redirect(temizNid ? `${hedef}${hedef.includes("?") ? "&" : "?"}nid=${temizNid}` : hedef);
}
