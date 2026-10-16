import type { ExpoConfig } from "expo/config";

/**
 * Paemisyon 2.0 mobil (Doc 49 F1). Development build hedeflenir (Expo Go değil):
 * SecureStore, Apple/Google girişi, push ve satın alma yerel bağımlılık ister.
 *
 * Kimlik Flutter uygulamasıyla AYNI: `com.paemisyon.paemisyon` (iOS ve Android). 2.0 aynı
 * mağaza kaydının üstüne sürüm olarak çıkar; IAP ürünleri ve Firebase projesi
 * (paemisyon-29523) ortaktır. Sürüm 2.0.0'dan başlar; Flutter 1.x'in üstüne geçer.
 */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const googleIosUrlScheme = googleIosClientId.endsWith(".apps.googleusercontent.com")
  ? `com.googleusercontent.apps.${googleIosClientId.replace(".apps.googleusercontent.com", "")}`
  : null;

const config: ExpoConfig = {
  name: "Paemisyon",
  slug: "paemisyon",
  version: "2.0.0",
  scheme: "paemisyon",
  orientation: "portrait",
  icon: "./assets/icon.png",
  // Nöbet: koyu tema birincil; sistem tercihi izlenir, uygulama içinden değiştirilebilir.
  userInterfaceStyle: "automatic",
  locales: { tr: "./locales/tr.json" },
  ios: {
    bundleIdentifier: "com.paemisyon.paemisyon",
    buildNumber: "1",
    // Ücretli takım (mağaza profillerinin takımı); kişisel takım yetenekleri imzalayamaz.
    appleTeamId: "3U4QPG9Q82",
    // FCM (sunucu firebase-admin ile gönderir); Flutter ile aynı Firebase projesi.
    googleServicesFile: "./GoogleService-Info.plist",
    entitlements: { "aps-environment": "production" },
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
    // Universal link: paemisyon.com'daki bildirim ve paylaşım bağlantıları uygulamada açılır.
    // AASA dosyası web'de (F5'te doğrulanır); doğrulanana kadar Safari açar.
    associatedDomains: ["applinks:paemisyon.com", "applinks:www.paemisyon.com"],
    infoPlist: {
      CFBundleDevelopmentRegion: "tr",
      CFBundleLocalizations: ["tr"],
      CFBundleAllowMixedLocalizations: true,
    },
  },
  android: {
    package: "com.paemisyon.paemisyon",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#17161A",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "paemisyon.com", pathPrefix: "/bildirim" },
          { scheme: "https", host: "www.paemisyon.com", pathPrefix: "/bildirim" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-router",
    // RNFirebase statik framework ister; diğer paketler (Sentry, Google girişi) uyumlu.
    ["expo-build-properties", { ios: { useFrameworks: "static" } }],
    // SPM kapalı: statik framework ile Firebase kopyaları çakışır (RNFirebase 26 uyarısı).
    ["@react-native-firebase/app", { ios: { disableSPM: true } }],
    "@react-native-firebase/messaging",
    "./plugins/with-firebase-configure.js",
    ["expo-notifications", { color: "#E3804F", defaultChannel: "default" }],
    "expo-iap",
    ["expo-secure-store", { faceIDPermission: false }],
    "expo-dev-client",
    "expo-apple-authentication",
    ...(googleIosUrlScheme
      ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }] as [string, unknown]]
      : []),
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        backgroundColor: "#17161A",
        dark: { backgroundColor: "#17161A" },
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        // Kaynak haritası yüklemesi yalnız SENTRY_AUTH_TOKEN ile (EAS/Xcode ortamından); yoksa atlanır.
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: (process.env.EAS_PROJECT_ID ?? "").trim() || undefined } },
};

export default config;
