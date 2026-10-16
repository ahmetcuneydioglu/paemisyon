import { getApp } from "@react-native-firebase/app";
import { AuthorizationStatus, getInitialNotification, getMessaging, getToken, onMessage, onNotificationOpenedApp, onTokenRefresh, requestPermission } from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { api } from "./api";
import { routeToHref } from "./deep-links";
import { readLocal, writeLocal } from "./local-store";

/**
 * Push (sunucu FCM ile gönderir → jeton FCM kayıt jetonu; Flutter ile aynı Firebase projesi).
 * İzin tanıtımda değil, anlamlı anda istenir (`requestPushPermission`); kayıt oturum açıkken ve
 * jeton yenilenince. Ön planda gelen mesaj yerel bildirim olarak gösterilir; dokunuş `data.route`
 * ile yönlendirir (deep-links.ts). Çıkışta jeton sunucudan silinir.
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

/** İzin varsa FCM jetonunu alır ve sunucuya yazar (idempotent upsert). */
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if ((await pushPermissionStatus()) !== "granted") return null;
  try {
    const token = await getToken(getMessaging(getApp()));
    if (!token) return null;
    await api("/me/push-token", { method: "POST", body: { token, platform: Platform.OS === "android" ? "android" : "ios" } });
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

type RemoteMessage = Parameters<Parameters<typeof onMessage>[1]>[0];
function routeOf(msg: RemoteMessage | null | undefined): string | null {
  const r = msg?.data?.route;
  return typeof r === "string" ? r : null;
}

/**
 * Kökte bir kez: jeton yenilenince kayıt; ön plan mesajı → yerel bildirim; arka plan/kapalı
 * uygulamadan dokunuş → yönlendirme. `ready` = oturum açık ve kapı geçildi.
 */
export function usePushNavigation(ready: boolean) {
  const router = useRouter();
  const handledInitial = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const messaging = getMessaging(getApp());
    void registerPushToken();
    const subs = [
      onTokenRefresh(messaging, () => void registerPushToken()),
      onMessage(messaging, async (m) => {
        await Notifications.scheduleNotificationAsync({ content: { title: m.notification?.title ?? "Paemisyon", body: m.notification?.body ?? "", data: { route: routeOf(m) ?? "" } }, trigger: null });
      }),
      onNotificationOpenedApp(messaging, (m) => router.push(routeToHref(routeOf(m)) as never)),
    ];
    if (!handledInitial.current) {
      handledInitial.current = true;
      void getInitialNotification(messaging).then((m) => {
        if (m) router.push(routeToHref(routeOf(m)) as never);
      });
    }
    // Ön planda gösterdiğimiz yerel bildirime (ve günlük hatırlatmaya) dokunuş.
    const local = Notifications.addNotificationResponseReceivedListener((resp) => {
      const route = resp.notification.request.content.data?.route;
      router.push(routeToHref(typeof route === "string" ? route : null) as never);
    });
    return () => {
      for (const s of subs) s();
      local.remove();
    };
  }, [ready, router]);
}
