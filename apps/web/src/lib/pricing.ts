import { publicApi, type PublicPlan, type PublicPricing } from "./public-api";

/**
 * Fiyatlandırma — doğruluk kaynağı sunucudur (`plans` tablosu → /public/pricing).
 * Pazarlama metinleri "30 soru"/"499,99 TL" gibi sayıları GÖMMEZ; bu modülden okur.
 * API erişilemezse sayfa çökmesin diye emniyet ağı değerleri kullanılır.
 */

/** API okunamazsa kullanılan güvenli varsayılan (apps/api plan.constants ile aynı). */
export const PRICING_FALLBACK: PublicPricing = {
  freeDailyLimit: 30,
  plans: [
    { key: "quarterly", name: "3 Aylık Premium", price: "499.99", currency: "TRY", period: "quarterly" },
  ],
};

/** ISR ile fiyat bilgisi; hata durumunda fallback (sayfa asla çökmez). */
export async function getPricing(revalidateSeconds = 3600): Promise<PublicPricing> {
  return publicApi<PublicPricing>("/public/pricing", revalidateSeconds).catch(
    () => PRICING_FALLBACK,
  );
}

/** Web'de satılan planın anahtarı (apps/api plan.constants.ts PREMIUM_PLAN_KEY ile aynı). */
export const PREMIUM_PLAN_KEY = "quarterly";

/**
 * Gösterilecek plan — SADECE anahtarla eşleşen satır.
 *
 * Bilinçli olarak `plans[0]` kullanılmaz: API planları fiyata göre sıralar, yani
 * eski bir plan (ör. 149,99 TL aylık) hâlâ isActive ise listenin başına geçer ve
 * sayfada YANLIŞ FİYAT çıkardı. Bu özellikle dağıtım penceresinde gerçek bir risk:
 * migration uygulanıp API ayağa kalktığı ama set-premium-plan.ts henüz
 * çalıştırılmadığı anda eski planlar hâlâ aktif olur.
 *
 * Eşleşme yoksa null döner → sayfa fiyat kartını hiç göstermez. Yanlış fiyat
 * göstermektense hiç göstermemek tercih edilir.
 */
export function primaryPlan(pricing: PublicPricing): PublicPlan | null {
  return pricing.plans.find((p) => p.key === PREMIUM_PLAN_KEY) ?? null;
}

const CURRENCY_SUFFIX: Record<string, string> = { TRY: "TL", USD: "$", EUR: "€" };

/** "499.99" + TRY → "499,99 TL" (TR ondalık ayracı, para birimi sonda). */
export function formatPrice(price: string, currency: string): string {
  const n = Number(price);
  const body = Number.isFinite(n)
    ? n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price;
  return `${body} ${CURRENCY_SUFFIX[currency] ?? currency}`;
}

/** Dönem → ay sayısı; bilinmeyen dönem null (aylık maliyet gösterilmez). */
const PERIOD_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** Dönem etiketi — "3 ay", "ay", "yıl". */
export function periodLabel(period: string): string {
  const months = PERIOD_MONTHS[period];
  if (period === "yearly") return "yıl";
  if (months && months > 1) return `${months} ay`;
  return "ay";
}

/** "Ayda ~166,66 TL" hesabı — dönemi bilinmeyen planda null. */
export function monthlyEquivalent(plan: PublicPlan): string | null {
  const months = PERIOD_MONTHS[plan.period];
  const n = Number(plan.price);
  if (!months || months < 2 || !Number.isFinite(n)) return null;
  return formatPrice((n / months).toFixed(2), plan.currency);
}
