import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { fetchProducts, finishTransaction, getAvailablePurchases, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase, restorePurchases, type Product, type ProductSubscription, type Purchase } from "expo-iap";
import { ApiError } from "@/lib/api";
import { homeKeys } from "@/features/home/queries";
import { billingApi, type BillingPlan, type VerifyResult } from "./queries";

/**
 * Mağaza katmanı (expo-iap). Kural: satın alma sunucuda doğrulanmadan premium açılmaz; işlem
 * yalnız doğrulama başarılı olunca ya da kalıcı hata (400/422) verince bitirilir. 409 ödeme
 * beklemededir (işlem açık kalır). Bekleyen/yarım işlemler oturum açılınca ve uygulama öne
 * her geldiğinde senkronlanır (`useStoreSync`); geçici hata arka planda yeniden denenir.
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

/**
 * Kullanıcının şu an başlattığı satın almanın ürün kimliği. Dinleyiciye düşen işlem bu ürünse
 * "purchase", değilse (yenileme, uygulama kapalıyken onaylanan, açılışta bekleyen) "auto"
 * sayılır. Sunucu "auto" işlemle aboneliği BAŞKA hesaba taşımaz (Fable denetimi bulgu 9).
 */
let purchaseInFlight: string | null = null;

export async function startPurchase(plan: BillingPlan, userId: string): Promise<void> {
  const sku = Platform.OS === "ios" ? plan.storeProductIdIos : plan.storeProductIdAndroid;
  if (!sku) throw new Error("Bu paket mağazada tanımlı değil.");
  await connectStore();
  const isSub = plan.period !== "lifetime" && plan.period !== "none";
  purchaseInFlight = sku;
  try {
    if (isSub) await requestPurchase({ type: "subs", request: { apple: { sku, appAccountToken: userId }, google: { skus: [sku], obfuscatedAccountId: userId } } });
    else await requestPurchase({ type: "in-app", request: { apple: { sku, appAccountToken: userId }, google: { skus: [sku], obfuscatedAccountId: userId } } });
  } catch (e) {
    purchaseInFlight = null;
    throw e;
  }
  // Sonuç purchaseUpdatedListener'a düşer (useStoreSync doğrular ve bitirir).
}

/** Doğrulamanın kaynağı: sunucu yalnız "purchase" ve "restore"da aboneliği hesaplar arası taşır. */
export type VerifySource = "purchase" | "restore" | "auto";

export type VerifyOutcome = { outcome: "applied"; result: VerifyResult } | { outcome: "pending" } | { outcome: "not_premium"; result: VerifyResult };

/** Kalıcı ret (400/422): işlem kapatılır. 409: ödeme beklemede (işlem açık kalır, yeniden denenmez). */
const isPermanent = (e: unknown) => e instanceof ApiError && (e.status === 400 || e.status === 422);
const isAwaitingPayment = (e: unknown) => e instanceof ApiError && e.status === 409;

/** Doğrula ve (uygunsa) bitir. Kalıcı hatada (400/422) işlem bitirilir ve hata fırlatılır. */
export async function verifyAndFinish(purchase: Purchase, source: VerifySource): Promise<VerifyOutcome> {
  if (purchase.purchaseState === "pending") return { outcome: "pending" };
  const token = purchase.purchaseToken;
  if (!token) throw new Error("Satın alma bilgisi eksik; biraz sonra yeniden dene.");
  try {
    const result = await billingApi.verify(
      Platform.OS === "ios" ? { platform: "apple", transactionJws: token, source } : { platform: "google", transactionJws: token, productId: purchase.productId, source },
    );
    await finishTransaction({ purchase, isConsumable: false });
    return result.isPremium ? { outcome: "applied", result } : { outcome: "not_premium", result };
  } catch (e) {
    if (isAwaitingPayment(e)) return { outcome: "pending" };
    if (isPermanent(e)) {
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
      const r = await verifyAndFinish(p, "restore");
      if (r.outcome === "applied") applied = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Satın alma doğrulanamadı.";
    }
  }
  return { applied, count: purchases.length, error };
}

/**
 * `retrying`: ödeme alındı ama sunucu geçici olarak doğrulayamadı; arka planda yeniden
 * deneniyor (ekran "tamamlanamadı" değil "doğrulama sürüyor" der).
 */
export type StoreEvent = { type: "verified"; outcome: VerifyOutcome } | { type: "pending" } | { type: "cancelled" } | { type: "error"; message: string; retrying?: boolean };
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

/** Geçici doğrulama hatasında yeniden deneme aralıkları (ms). */
export const VERIFY_RETRY_DELAYS = [5_000, 30_000, 120_000] as const;

export const VERIFY_RETRY_MESSAGE =
  "Ödemen alındı, doğrulaması birazdan yeniden denenecek. Premium birkaç dakika içinde açılmazsa Üyelik'te “Satın alımları geri yükle”ye dokun.";

const synced = new Set<string>();

/**
 * Oturum boyunca mağaza olaylarını dinler; kullanıcı başına bir kez (ve uygulama öne her
 * geldiğinde) bekleyen işlemleri doğrular. Geçici doğrulama hatası (ağ, 5xx) arka planda
 * geri çekilerek yeniden denenir (bulgu 8: eskiden yalnız soğuk açılışta deneniyordu).
 * Kökte (RootNavigator) bir kez bağlanır.
 */
export function useStoreSync(userId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId || !storeSupported) return;
    let alive = true;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const refresh = () => {
      void qc.invalidateQueries({ queryKey: homeKeys.me });
      void qc.invalidateQueries({ queryKey: ["me", "dashboard"] });
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
    };

    const handle = (purchase: Purchase, attempt = 0) => {
      const source: VerifySource = purchaseInFlight === purchase.productId ? "purchase" : "auto";
      if (source === "purchase") purchaseInFlight = null;
      verifyAndFinish(purchase, source)
        .then((outcome) => {
          if (outcome.outcome === "applied") refresh();
          emit(outcome.outcome === "pending" ? { type: "pending" } : { type: "verified", outcome });
        })
        .catch((e: unknown) => {
          if (isPermanent(e) || attempt >= VERIFY_RETRY_DELAYS.length || !alive) {
            emit({ type: "error", message: e instanceof Error ? e.message : "Satın alma doğrulanamadı." });
            return;
          }
          // Yalnız ilk hatada haber ver; sonraki denemeler sessiz, başarı "verified" olarak gelir.
          if (attempt === 0) emit({ type: "error", message: VERIFY_RETRY_MESSAGE, retrying: true });
          const t = setTimeout(() => {
            timers.delete(t);
            if (alive) handle({ ...purchase }, attempt + 1);
          }, VERIFY_RETRY_DELAYS[attempt]);
          timers.add(t);
        });
    };

    const syncPending = () =>
      connectStore()
        .then(() => getAvailablePurchases())
        .then(async (purchases) => {
          let applied = false;
          for (const p of purchases ?? []) {
            try {
              applied = (await verifyAndFinish(p, "auto")).outcome === "applied" || applied;
            } catch {
              /* geçici hata: işlem açık kalır, uygulama öne gelince yeniden denenir */
            }
          }
          if (applied) refresh();
        });

    const updated = purchaseUpdatedListener((p) => handle(p));
    const failed = purchaseErrorListener((e) => {
      purchaseInFlight = null;
      emit(isUserCancelled(e) ? { type: "cancelled" } : { type: "error", message: e.message || "Satın alma tamamlanamadı." });
    });
    if (!synced.has(userId)) {
      synced.add(userId);
      void syncPending().catch(() => synced.delete(userId));
    }
    // Öne dönüşte açık kalmış işlemleri yeniden dene (ağ geri geldi, sunucu toparlandı).
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") void syncPending().catch(() => {});
    });
    return () => {
      alive = false;
      for (const t of timers) clearTimeout(t);
      updated.remove();
      failed.remove();
      appState.remove();
    };
  }, [qc, userId]);
}
