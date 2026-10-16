import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { fetchProducts, finishTransaction, getAvailablePurchases, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase, restorePurchases, type Product, type ProductSubscription, type Purchase } from "expo-iap";
import { ApiError } from "@/lib/api";
import { homeKeys } from "@/features/home/queries";
import { billingApi, type BillingPlan, type VerifyResult } from "./queries";

/**
 * Mağaza katmanı (expo-iap). Kural: satın alma sunucuda doğrulanmadan premium açılmaz; işlem
 * yalnız doğrulama "uygulandı" ya da kalıcı hata (400/422) verince bitirilir. Bekleyen/yarım
 * işlemler oturum açılınca bir kez senkronlanır (`useStoreSync`). Karar ve metinler Flutter
 * `purchase_sync_service.dart` ile aynı.
 */
export const storeSupported = (Platform.OS === "ios" || Platform.OS === "android") && requireOptionalNativeModule("ExpoIap") != null;

let connection: Promise<boolean> | null = null;
export function connectStore(): Promise<boolean> {
  if (!storeSupported) return Promise.resolve(false);
  connection ??= initConnection().catch((e) => {
    connection = null;
    throw e;
  });
  return connection;
}

export type StoreProduct = Product | ProductSubscription;

/** Planların bu platformdaki ürün kimlikleri → mağaza ürünleri (fiyat mağazadan). */
export async function loadStoreProducts(plans: BillingPlan[]): Promise<Map<string, StoreProduct>> {
  const out = new Map<string, StoreProduct>();
  if (!(await connectStore())) return out;
  const skuOf = (p: BillingPlan) => (Platform.OS === "ios" ? p.storeProductIdIos : p.storeProductIdAndroid);
  const subs = plans.filter((p) => skuOf(p) && p.period !== "lifetime" && p.period !== "none").map((p) => skuOf(p)!);
  const inApp = plans.filter((p) => skuOf(p) && (p.period === "lifetime" || p.period === "none")).map((p) => skuOf(p)!);
  const [s, i] = await Promise.all([subs.length ? fetchProducts({ skus: subs, type: "subs" }) : Promise.resolve([]), inApp.length ? fetchProducts({ skus: inApp, type: "in-app" }) : Promise.resolve([])]);
  for (const p of [...(s ?? []), ...(i ?? [])] as StoreProduct[]) out.set(p.id, p);
  return out;
}

export async function startPurchase(plan: BillingPlan, userId: string): Promise<void> {
  const sku = Platform.OS === "ios" ? plan.storeProductIdIos : plan.storeProductIdAndroid;
  if (!sku) throw new Error("Bu paket mağazada tanımlı değil.");
  await connectStore();
  const isSub = plan.period !== "lifetime" && plan.period !== "none";
  if (isSub) await requestPurchase({ type: "subs", request: { apple: { sku, appAccountToken: userId }, google: { skus: [sku], obfuscatedAccountId: userId } } });
  else await requestPurchase({ type: "in-app", request: { apple: { sku, appAccountToken: userId }, google: { skus: [sku], obfuscatedAccountId: userId } } });
  // Sonuç purchaseUpdatedListener'a düşer (useStoreSync doğrular ve bitirir).
}

export type VerifyOutcome = { outcome: "applied"; result: VerifyResult } | { outcome: "pending" } | { outcome: "not_premium"; result: VerifyResult };

/** Doğrula ve (uygunsa) bitir. Kalıcı hatada (400/422) işlem bitirilir ve hata fırlatılır. */
export async function verifyAndFinish(purchase: Purchase): Promise<VerifyOutcome> {
  if (purchase.purchaseState === "pending") return { outcome: "pending" };
  const token = purchase.purchaseToken;
  if (!token) throw new Error("Satın alma bilgisi eksik; biraz sonra yeniden dene.");
  try {
    const result = await billingApi.verify(Platform.OS === "ios" ? { platform: "apple", transactionJws: token } : { platform: "google", transactionJws: token, productId: purchase.productId });
    await finishTransaction({ purchase, isConsumable: false });
    return result.isPremium ? { outcome: "applied", result } : { outcome: "not_premium", result };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 422)) {
      // Kalıcı: mağaza işlemi kapatılır, kullanıcıya nedeni söylenir.
      await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    }
    throw e;
  }
}

/** Geri yükleme: mağazadaki geçerli işlemleri yeniden doğrular; premium açılan var mı döner. */
export async function restoreStorePurchases(): Promise<{ applied: boolean; count: number; error?: string }> {
  await connectStore();
  await restorePurchases().catch(() => {});
  const purchases = (await getAvailablePurchases()) ?? [];
  let applied = false;
  let error: string | undefined;
  for (const p of purchases) {
    try {
      const r = await verifyAndFinish(p);
      if (r.outcome === "applied") applied = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Satın alma doğrulanamadı.";
    }
  }
  return { applied, count: purchases.length, error };
}

export type StoreEvent = { type: "verified"; outcome: VerifyOutcome } | { type: "pending" } | { type: "cancelled" } | { type: "error"; message: string };
const listeners = new Set<(e: StoreEvent) => void>();
export function onStoreEvent(l: (e: StoreEvent) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emit(e: StoreEvent) {
  for (const l of listeners) l(e);
}

export function isUserCancelled(e: { code?: string; message?: string }): boolean {
  return e.code === "user-cancelled" || /cancel/i.test(e.message ?? "");
}

const synced = new Set<string>();

/**
 * Oturum boyunca mağaza olaylarını dinler; kullanıcı başına bir kez bekleyen işlemleri
 * doğrular. Kökte (RootNavigator) bir kez bağlanır.
 */
export function useStoreSync(userId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId || !storeSupported) return;
    const refresh = () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: ["me", "dashboard"] });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
    };
    const handle = (purchase: Purchase) => {
      verifyAndFinish(purchase)
        .then((outcome) => {
          if (outcome.outcome === "applied") refresh();
          emit(outcome.outcome === "pending" ? { type: "pending" } : { type: "verified", outcome });
        })
        .catch((e: unknown) => emit({ type: "error", message: e instanceof Error ? e.message : "Satın alma doğrulanamadı." }));
    };
    const updated = purchaseUpdatedListener(handle);
    const failed = purchaseErrorListener((e) => emit(isUserCancelled(e) ? { type: "cancelled" } : { type: "error", message: e.message || "Satın alma tamamlanamadı." }));
    if (!synced.has(userId)) {
      synced.add(userId);
      void connectStore()
        .then(() => getAvailablePurchases())
        .then(async (purchases) => {
          let applied = false;
          for (const p of purchases ?? []) {
            try {
              applied = (await verifyAndFinish(p)).outcome === "applied" || applied;
            } catch {
              /* geçici hata: işlem açık kalır, sonraki açılışta yeniden denenir */
            }
          }
          if (applied) refresh();
        })
        .catch(() => synced.delete(userId));
    }
    return () => {
      updated.remove();
      failed.remove();
    };
  }, [qc, userId]);
}
