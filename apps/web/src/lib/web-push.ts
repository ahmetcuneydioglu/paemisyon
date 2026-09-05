/**
 * Web push aboneliği (FCM).
 *
 * Neden var: 5 Eylül 2026 denemesine 152 kullanıcıdan 6'sı katıldı. Sebep
 * sistem değil ERİŞİM'di — bildirim yalnız 17 mobil cihaza gidebiliyordu, web
 * tarafında push altyapısı hiç yoktu. Son 7 günde soru çözen 70 kişinin 61'ine
 * hiçbir kanaldan ulaşılamıyordu.
 *
 * İlkeler:
 *  - Sayfa açılışında izin İSTENMEZ. Tarayıcı iznini soğuktan istemek hem
 *    reddedilme oranını uçurur hem de Chrome'da site itibarını düşürür; izin,
 *    kullanıcı "haber ver" dediğinde istenir (yumuşak ön-soru).
 *  - Yapılandırma yoksa (Firebase web anahtarları girilmemişse) özellik
 *    SESSİZCE kapalıdır — hata göstermez, düğme çıkmaz.
 *  - Token yenilenirse sunucuya yeniden yazılır; aynı token için tekrar
 *    yazmak zararsızdır (upsert).
 */

export type PushDurumu =
  | "desteklenmiyor" // tarayıcı/işletim sistemi push'a izin vermiyor
  | "kapali" // yapılandırma yok
  | "sorulmadi" // izin henüz istenmedi
  | "verildi"
  | "reddedildi";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
};

export function pushYapilandirildiMi(): boolean {
  return Object.values(cfg).every((v) => typeof v === "string" && v.length > 0);
}

/** Tarayıcı desteği + mevcut izin durumu. Hiçbir şey İSTEMEZ. */
export function pushDurumu(): PushDurumu {
  if (typeof window === "undefined") return "kapali";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "desteklenmiyor";
  }
  if (!pushYapilandirildiMi()) return "kapali";
  const izin = Notification.permission;
  return izin === "granted" ? "verildi" : izin === "denied" ? "reddedildi" : "sorulmadi";
}

/**
 * İzin ister, FCM token'ı alır ve sunucuya yazar.
 * Dönüş: token (başarılı) ya da null (izin yok / desteklenmiyor / hata).
 *
 * `kaydet` çağrısı dışarıdan verilir — bu modül API istemcisini tanımaz
 * (istemci tarafı bileşen kendi oturumlu isteğini kullanır).
 */
export async function pushAboneOl(
  kaydet: (token: string) => Promise<void>,
): Promise<string | null> {
  if (pushDurumu() === "desteklenmiyor" || !pushYapilandirildiMi()) return null;

  const izin = await Notification.requestPermission();
  if (izin !== "granted") return null;

  // Firebase SDK yalnız kullanıcı kabul ettiğinde indirilir — ilk açılışın
  // paket boyutunu büyütmez.
  const [{ initializeApp, getApps }, { getMessaging, getToken }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: cfg.apiKey!,
      projectId: cfg.projectId!,
      messagingSenderId: cfg.messagingSenderId!,
      appId: cfg.appId!,
    });

  // Service worker statik dosyadır; Firebase yapılandırmasını sorgu dizesinden
  // okur (public/firebase-messaging-sw.js). Böylece anahtarlar dosyaya gömülü
  // olmaz ve ortamlar arasında değişebilir.
  const params = new URLSearchParams({
    apiKey: cfg.apiKey!,
    projectId: cfg.projectId!,
    messagingSenderId: cfg.messagingSenderId!,
    appId: cfg.appId!,
  });
  const kayit = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    { scope: "/" },
  );

  const token = await getToken(getMessaging(app), {
    vapidKey: cfg.vapidKey!,
    serviceWorkerRegistration: kayit,
  });
  if (!token) return null;

  await kaydet(token);
  return token;
}
