// @ts-check
const { withAndroidManifest } = require("expo/config-plugins");

/**
 * expo-notifications (kanal "default", renk @color/notification_icon_color) ile
 * @react-native-firebase/messaging aynı FCM meta-data'larını farklı değerlerle yazar; Android
 * manifest birleştirmesi bu yüzden derlemeyi kırar. Uygulamanın değeri kütüphanenin
 * varsayılanını ezsin diye ilgili <meta-data>'lara tools:replace eklenir.
 */
const REPLACE = {
  "com.google.firebase.messaging.default_notification_channel_id": "android:value",
  "com.google.firebase.messaging.default_notification_color": "android:resource",
};

module.exports = function withFcmManifestReplace(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";
    for (const app of manifest.application ?? []) {
      for (const meta of app["meta-data"] ?? []) {
        const attr = REPLACE[meta.$["android:name"]];
        if (attr) meta.$["tools:replace"] = attr;
      }
    }
    return c;
  });
};
