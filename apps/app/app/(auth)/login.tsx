import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LegalNote } from "@/components/domain";
import { AppText, BrandMark, Button, GoogleMark, Notice } from "@/components/ui";
import { googleAvailable, signInWithProvider, SocialSignInCancelled, type SocialProvider } from "@/lib/auth/social";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Giriş · karşılama (Figma "Yayın Öncesi — Açılış", Giriş / Karşılama): marka, tek cümle, üç yol.
 * Apple düğmesi sistemin `AppleAuthenticationButton`'ıdır (HIG + App Review 4.8: koyu temada
 * beyaz, açıkta siyah; metni cihaz dilinde). Google yalnız bu derlemede yapılandırılmışsa görünür
 * (`googleAvailable`). E-posta ayrı ekranda (giriş / kayıt / şifre yenileme). Yönlendirme kök
 * kapıda: oturum açılınca kapı onboarding'e ya da Bugün'e geçirir.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space, radius, scheme } = useTheme();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleOk, setAppleOk] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void AppleAuthentication.isAvailableAsync().then(setAppleOk).catch(() => setAppleOk(false));
  }, []);

  async function social(kind: SocialProvider) {
    setError(null);
    setBusy(kind);
    try {
      await signInWithProvider(kind);
    } catch (e) {
      if (!(e instanceof SocialSignInCancelled)) setError(e instanceof Error ? e.message : "Giriş tamamlanamadı.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + space.s4, paddingHorizontal: space.screenGutter }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.s4 }}>
        <BrandMark size={88} accessibilityLabel="Paemisyon" />
        <View style={{ gap: space.s2, alignItems: "center" }}>
          <AppText variant="title" accessibilityRole="header" style={{ textAlign: "center" }}>
            Nöbete hoş geldin
          </AppText>
          <AppText variant="body" tone="soft" style={{ textAlign: "center" }}>
            Komiser Yardımcılığı hazırlığın tek yerde: koçun, denemelerin, mevzuatın.
          </AppText>
        </View>
      </View>

      <View style={{ gap: space.s3 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {appleOk ? (
          <View pointerEvents={busy ? "none" : "auto"} style={{ height: 54, opacity: busy && busy !== "apple" ? 0.5 : 1 }}>
            {busy === "apple" ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radius.card, backgroundColor: scheme === "dark" ? "#FFFFFF" : "#000000" }}>
                <ActivityIndicator color={scheme === "dark" ? "#000000" : "#FFFFFF"} />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={scheme === "dark" ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={radius.card}
                style={{ flex: 1 }}
                onPress={() => void social("apple")}
              />
            )}
          </View>
        ) : null}
        {googleAvailable() ? (
          <Button title="Google ile devam et" variant="secondary" icon={<GoogleMark />} loading={busy === "google"} disabled={busy !== null} onPress={() => void social("google")} />
        ) : null}
        <Button
          title="E-posta ile devam et"
          variant="secondary"
          icon={<Mail size={20} color={colors.ink} strokeWidth={1.75} />}
          disabled={busy !== null}
          onPress={() => router.push("/(auth)/eposta")}
        />
        <View style={{ paddingTop: space.s2 }}>
          <LegalNote />
        </View>
      </View>
    </View>
  );
}
