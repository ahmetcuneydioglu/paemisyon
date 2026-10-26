import { getApp } from "@react-native-firebase/app";
import { AuthorizationStatus, getInitialNotification, getMessaging, getToken, onMessage, onNotificationOpenedApp, onTokenRefresh, requestPermission } from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { invalidateUnread, recordNotificationEvent } from "@/features/notifications/queries";
import { api } from "./api";
import { appVersion, deviceId, versionAtLeast } from "./app-meta";
import { routeToHref } from "./deep-links";
import { readLocal, writeLocal } from "./local-store";

/**
 * Push (sunucu FCM ile gönderir → jeton FCM kayıt jetonu; Flutter ile aynı Firebase projesi).
 * İzin tanıtımda değil, anlamlı anda istenir (`requestPushPermission`); kayıt oturum açıkken ve
 * jeton yenilenince, `deviceId` + `appVersion` ile (Doc 52 §4.3). Ön planda gelen mesaj yerel
 * bildirim olarak gösterilir; dokunuş `data.route` ile yönlendirir (deep-links.ts) ve
 * `data.notificationId` varsa `opened` olayı yazar. `data.minAppVersion` bu sürümden büyükse
 * hedef yerine Bildirimler kutusu açılır (orada "Güncelleme gerekli"). Çıkışta jeton silinir.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const TOKEN_KEY = "push.token";

export async function pushPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  const s = await Notifications.getPermissionsAsync();
  return s.granted ? "granted" : s.canAskAgain ? "undetermined" : "denied";
}

/** İzin ister (kullanıcı eylemiyle); verilirse jetonu kaydeder. */
export async function requestPushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const auth = await requestPermission(getMessaging(getApp()));
  const ok = auth === AuthorizationStatus.AUTHORIZED || auth === AuthorizationStatus.PROVISIONAL;
  if (ok) await registerPushToken();
  return ok;
}

/** İzin varsa FCM jetonunu alır ve sunucuya yazar (idempotent upsert; cihaz kimliği + sürüm eşlik eder). */
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if ((await pushPermissionStatus()) !== "granted") return null;
  try {
    const token = await getToken(getMessaging(getApp()));
    if (!token) return null;
    await api("/me/push-token", {
      method: "POST",
      body: { token, platform: Platform.OS === "android" ? "android" : "ios", deviceId: await deviceId(), appVersion: appVersion() },
    });
    await writeLocal(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  const token = await readLocal<string | null>(TOKEN_KEY, null);
  if (!token) return;
  await api("/me/push-token", { method: "DELETE", body: { token } }).catch(() => {});
  await writeLocal(TOKEN_KEY, null);
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
  if (!versionAtLeast(appVersion(), str(data?.minAppVersion))) {
    go({ pathname: "/bildirimler" });
    return;
  }
  go(routeToHref(str(data?.route)));
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
    void registerPushToken();
    const subs = [
      onTokenRefresh(messaging, () => void registerPushToken()),
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
    };
  }, [ready, router]);
}
