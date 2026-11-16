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
    // expo-store-review yedek yolu (yerel istem yoksa mağaza sayfası) — Doc 57.
    appStoreUrl: "https://apps.apple.com/tr/app/paemisyon/id6802087692",
    // buildNumber EAS'ta uzaktan tutulur (appVersionSource: remote); burada yazılmaz.
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
      // Paylaşım sayfasındaki "Görseli Kaydet" Fotoğraflar'a yazar; metin yoksa iOS uygulamayı
      // sonlandırır (Fable denetimi, 15 Kas 2026). Yalnız ekleme izni; arşiv okunmaz.
      NSPhotoLibraryAddUsageDescription: "Paylaşım kartını Fotoğraflar'a kaydedebilmen için.",
      // Okuma izni metni: react-native-share'in Instagram paylaşımı kartı Fotoğraflar'a kaydedip
      // oradan alır; expo-file-system ve Firebase de fotoğraf API'lerine başvurur. Metin yoksa
      // App Store yüklemeyi reddeder (ITMS-90683, 2.0.0 (6), 15 Kas 2026).
      NSPhotoLibraryUsageDescription: "Paylaşım kartını Instagram gibi uygulamalara gönderebilmen için Fotoğraflar'a erişim gerekir.",
    },
  },
  android: {
    package: "com.paemisyon.paemisyon",
    googleServicesFile: "./google-services.json",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.paemisyon.paemisyon",
    // versionCode EAS'ta uzaktan tutulur (appVersionSource: remote); burada yazılmaz. Flutter 1.x
    // Play'de 1.1.0+3 ile yayında: ilk Android derlemesinden önce uzak sürüm Play'dekinin üstüne
    // ayarlanır (`eas build:version:set -p android`), yoksa EAS 1'den başlar ve Play reddeder.
    adaptiveIcon: {
      backgroundColor: "#121A26",
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
    "./plugins/with-fcm-manifest-replace.js",
    ["expo-notifications", { color: "#E3804F", defaultChannel: "default" }],
    "expo-iap",
    ["expo-secure-store", { faceIDPermission: false }],
    "expo-dev-client",
    // Paylaşım kartı (F10-P): görsel + metin birlikte sistem paylaşım sayfasına. Eklenti
    // seçeneksiz çöküyor; sorgu şemaları/paketleri hedef uygulamalara doğrudan paylaşım için.
    ["react-native-share", { ios: ["whatsapp", "telegram", "instagram"], android: ["com.whatsapp", "org.telegram.messenger", "com.instagram.android"] }],
    "expo-apple-authentication",
    ...(googleIosUrlScheme
      ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }] as [string, unknown]]
      : []),
    [
      "expo-splash-screen",
      {
        // Nişangâh P glifi (brand/splash-glyph-*.svg; Figma "Yayın Öncesi — Açılış", 139:7).
        // Zemin = color/bg: uygulamanın ilk karesiyle aynı, geçişte renk atlaması olmaz.
        // 1024'lük tuvalde glif ~518 px → imageWidth 220 ile glif ≈ 112 pt.
        image: "./assets/splash-glyph-light.png",
        imageWidth: 220,
        backgroundColor: "#FFFCF6",
        dark: { image: "./assets/splash-glyph-dark.png", backgroundColor: "#121A26" },
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
  owner: "ahmetcnd",
  // EAS projesi (F6): canahmettt@gmail.com hesabı; derleme ve gönderim buradan.
  extra: { eas: { projectId: "1c502a04-6223-44f3-a0dd-558de040cae6" } },
};

export default config;
