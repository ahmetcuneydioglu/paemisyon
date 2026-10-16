import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Billing (billing.controller). Planlar ve mağaza ürün kimlikleri SUNUCUDAN (sabit kodlanmaz);
 * doğrulama `POST /billing/verify` — Apple için StoreKit 2 imzalı işlem (JWS). Yalnız 400/422
 * kalıcı hata; ağ/401/403/5xx geçici (işlem açık bırakılır, senkron yeniden dener).
 */
export interface BillingPlan {
  key: string;
  name: string;
  /** Decimal → string ("599.99"); yalnız mağaza fiyatı yoksa yedek. */
  price: string | null;
  currency: string;
  period: "none" | "monthly" | "quarterly" | "yearly" | "lifetime";
  storeProductIdIos: string | null;
  storeProductIdAndroid: string | null;
}

export interface VerifyResult {
  isPremium: boolean;
  validUntil: string | null;
  plan: string;
  environment: string;
}

export const billingKeys = { plans: ["billing", "plans"] as const };

export function usePlans() {
  return useQuery({ queryKey: billingKeys.plans, queryFn: () => api<BillingPlan[]>("/billing/plans"), staleTime: 10 * 60_000 });
}

export const billingApi = {
  verify: (body: { platform: "apple" | "google"; transactionJws: string; productId?: string }) => api<VerifyResult>("/billing/verify", { method: "POST", body }),
};

export const PERIOD_LABEL: Record<BillingPlan["period"], string> = { none: "", monthly: "/ ay", quarterly: "/ 3 ay", yearly: "/ yıl", lifetime: "tek ödeme" };
