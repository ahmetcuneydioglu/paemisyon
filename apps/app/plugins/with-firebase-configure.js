// @ts-check
const { withAppDelegate } = require("expo/config-plugins");

/**
 * SDK 58'in Swift AppDelegate'inde @react-native-firebase/app eklentisi `FirebaseApp.configure()`
 * çağrısını yerleştiremiyor ("Unable to determine correct Firebase insertion point").
 * Bu eklenti çağrıyı didFinishLaunchingWithOptions'ın başına ekler (FCM jetonu için şart).
 */
module.exports = function withFirebaseConfigure(config) {
  return withAppDelegate(config, (c) => {
    const src = c.modResults.contents;
    if (c.modResults.language !== "swift" || src.includes("FirebaseApp.configure()")) return c;
    const marker = /(didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\? = nil\s*\) -> Bool \{\n)/;
    if (!marker.test(src)) throw new Error("with-firebase-configure: AppDelegate.swift beklenen imzada değil.");
    c.modResults.contents = src.replace(marker, "$1    FirebaseApp.configure()\n");
    if (!c.modResults.contents.includes("import FirebaseCore")) {
      c.modResults.contents = c.modResults.contents.replace("import React\n", "import FirebaseCore\nimport React\n");
    }
    return c;
  });
};
