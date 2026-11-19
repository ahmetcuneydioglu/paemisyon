import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getAPNSToken,
  getInitialNotification,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  type Messaging,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Linking, Platform } from "react-native";
import { invalidateUnread, recordNotificationEvent } from "@/features/notifications/queries";
import { api } from "./api";
import { appVersion, deviceId, storeUrl, versionAtLeast } from "./app-meta";
import { routeToHref, storeAction } from "./deep-links";
import { readLocal, writeLocal } from "./local-store";
import { Sentry } from "./sentry";

/**
 * Push (sunucu FCM ile gönderir → jeton FCM kayıt jetonu; Flutter ile aynı Firebase projesi).
 * İzin tanıtımda değil, anlamlı anda istenir (`requestPushPermission`); kayıt oturum açılınca,
 * jeton yenilenince ve uygulama her öne geldiğinde (seyreltilmiş) denenir, `deviceId` +
 * `appVersion` ile (Doc 52 §4.3). Ön planda gelen mesaj yerel bildirim olarak gösterilir; dokunuş
 * `data.route` ile yönlendirir (deep-links.ts) ve `data.notificationId` varsa `opened` olayı yazar.
 * `data.minAppVersion` bu sürümden büyükse hedef yerine Bildirimler kutusu açılır (orada
 * "Güncelleme gerekli"). `store` rotası (uygulama güncellemesi) ekran değil: eski sürüm doğrudan
 * cihazın mağazasını açar, güncel sürüm Bugün'de kalır. Çıkışta jeton silinir.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const TOKEN_KEY = "push.token";
const REGISTERED_AT_KEY = "push.registeredAt";
/** Öne gelişte aynı jeton bu süreden kısa önce yazıldıysa sunucuya yeniden gidilmez. */
const REFRESH_MS = 12 * 3_600_000;
/** iOS'ta APNs jetonunu bekleme: 10 × 1 sn. */
const APNS_WAIT_TRIES = 10;

export async function pushPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  const s = await Notifications.getPermissionsAsync();
  return s.granted ? "granted" : s.canAskAgain ? "undetermined" : "denied";
}

/** İzin ister (kullanıcı eylemiyle); verilirse jetonu kaydeder. */
export async function requestPushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const auth = await requestPermission(getMessaging(getApp()));
  const ok = auth === AuthorizationStatus.AUTHORIZED || auth === AuthorizationStatus.PROVISIONAL;
  if (ok) await registerPushToken({ force: true });
  return ok;
}

/**
 * iOS: FCM jetonu APNs jetonu olmadan alınamaz (firebase-ios-sdk ≥10.4) ve açılışta APNs kaydı
 * henüz bitmemiş olabilir. Eskiden `getToken` bu yarışta hata veriyor, hata sessizce yutuluyor ve
 * cihaz bir sonraki soğuk açılışa kadar hiç kaydolmuyordu (19 Kas 2026: 2.0 iPhone'da push yok,
 * sunucuda iOS jetonu yok). Kayıt yoksa ister, jeton gelene kadar kısa süre bekler.
 */
async function apnsReady(messaging: Messaging): Promise<boolean> {
  if (Platform.OS !== "ios") return true;
  if (!isDeviceRegisteredForRemoteMessages(messaging)) await registerDeviceForRemoteMessages(messaging);
  for (let i = 0; i < APNS_WAIT_TRIES; i++) {
    if (await getAPNSToken(messaging)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Kayıt hatası Sentry'ye; aynı aşama oturum başına bir kez (öne gelişte tekrar denenince yağmasın). */
const reported = new Set<string>();
function reportRegisterFailure(stage: string, error?: unknown) {
  if (reported.has(stage)) return;
  reported.add(stage);
  const ctx = { tags: { area: "push_register", stage }, extra: { platform: Platform.OS, appVersion: appVersion() } };
  if (error) Sentry.captureException(error, ctx);
  else Sentry.captureMessage(`push_register: ${stage}`, { level: "warning", ...ctx });
}

let inflight: Promise<string | null> | null = null;

/**
 * İzin varsa FCM jetonunu alır ve sunucuya yazar (idempotent upsert; cihaz kimliği + sürüm eşlik
 * eder). `force` yoksa aynı jeton son 12 saatte yazıldıysa sunucuya gidilmez (öne geliş denemeleri).
 * Eşzamanlı çağrılar tek denemede birleşir.
 */
export function registerPushToken(opts: { force?: boolean } = {}): Promise<string | null> {
  inflight ??= doRegister(opts.force ?? false).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRegister(force: boolean): Promise<string | null> {
  if (!Device.isDevice) return null;
  if ((await pushPermissionStatus()) !== "granted") return null;
  let stage = "apns";
  try {
    const messaging = getMessaging(getApp());
    if (!(await apnsReady(messaging))) {
      reportRegisterFailure("apns_timeout");
      return null;
    }
    stage = "fcm";
    const token = await getToken(messaging);
    if (!token) return null;
    const [last, at] = await Promise.all([readLocal<string | null>(TOKEN_KEY, null), readLocal<number>(REGISTERED_AT_KEY, 0)]);
    if (!force && last === token && Date.now() - at < REFRESH_MS) return token;
    stage = "api";
    await api("/me/push-token", {
      method: "POST",
      body: { token, platform: Platform.OS === "android" ? "android" : "ios", deviceId: await deviceId(), appVersion: appVersion() },
    });
    await writeLocal(TOKEN_KEY, token);
    await writeLocal(REGISTERED_AT_KEY, Date.now());
    return token;
  } catch (e) {
    reportRegisterFailure(stage, e);
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  const token = await readLocal<string | null>(TOKEN_KEY, null);
  if (!token) return;
  await api("/me/push-token", { method: "DELETE", body: { token } }).catch(() => {});
  await writeLocal(TOKEN_KEY, null);
  await writeLocal(REGISTERED_AT_KEY, 0);
}

/** Push verisi (FCM `data` ve yerel bildirim `content.data` aynı anahtarları taşır). */
type PushData = { route?: unknown; notificationId?: unknown; minAppVersion?: unknown };

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** Dokunuş: olay yazımı + hedef (ya da sürüm eski ise kutu). Tüm giriş noktaları buradan geçer. */
function openFromPush(data: PushData | null | undefined, go: (href: ReturnType<typeof routeToHref>) => void) {
  const id = str(data?.notificationId);
  if (id) void recordNotificationEvent(id, "opened", "push");
  else invalidateUnread();
  const route = str(data?.route);
  const upToDate = versionAtLeast(appVersion(), str(data?.minAppVersion));
  // Güncelleme bildirimi: eski sürüm kutuya uğramadan bu platformun mağazasına (iOS App Store /
  // Google Play), güncel sürüm Bugün'e.
  const store = storeAction(route, upToDate);
  if (store === "store") {
    void Linking.openURL(storeUrl());
    return;
  }
  if (store === "stay") {
    go(routeToHref(null));
    return;
  }
  if (!upToDate) {
    go({ pathname: "/bildirimler" });
    return;
  }
  go(routeToHref(route));
}

type RemoteMessage = Parameters<Parameters<typeof onMessage>[1]>[0];

/**
 * Kökte bir kez: jeton yenilenince kayıt; ön plan mesajı → yerel bildirim; arka plan/kapalı
 * uygulamadan dokunuş → olay + yönlendirme. `ready` = oturum açık ve kapı geçildi.
 */
export function usePushNavigation(ready: boolean) {
  const router = useRouter();
  const handledInitial = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const messaging = getMessaging(getApp());
    const go = (href: ReturnType<typeof routeToHref>) => router.push(href as never);
    // Oturum açılışı: jeton bu hesaba bağlansın diye her zaman yazılır.
    void registerPushToken({ force: true });
    // Öne geliş: açılıştaki deneme düştüyse ya da izin sonradan Ayarlar'dan verildiyse yakalar.
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") void registerPushToken();
    });
    const subs = [
      onTokenRefresh(messaging, () => void registerPushToken({ force: true })),
      onMessage(messaging, async (m: RemoteMessage) => {
        // Ön planda: zil rozeti hemen güncellenir; yerel bildirim aynı veriyi taşır ki dokunuş aynı yoldan geçsin.
        invalidateUnread();
        const d = (m.data ?? {}) as Record<string, unknown>;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: m.notification?.title ?? "Paemisyon",
            body: m.notification?.body ?? "",
            data: { route: str(d.route) ?? "", notificationId: str(d.notificationId) ?? "", minAppVersion: str(d.minAppVersion) ?? "" },
          },
          trigger: null,
        });
      }),
      onNotificationOpenedApp(messaging, (m: RemoteMessage) => openFromPush(m.data as PushData, go)),
    ];
    if (!handledInitial.current) {
      handledInitial.current = true;
      void getInitialNotification(messaging).then((m) => {
        if (m) openFromPush(m.data as PushData, go);
      });
    }
    // Ön planda gösterdiğimiz yerel bildirime dokunuş.
    const local = Notifications.addNotificationResponseReceivedListener((resp) => {
      openFromPush(resp.notification.request.content.data as PushData, go);
    });
    return () => {
      for (const s of subs) s();
      local.remove();
      appState.remove();
    };
  }, [ready, router]);
}
