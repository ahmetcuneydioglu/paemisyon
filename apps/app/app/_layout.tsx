import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold, useFonts } from "@expo-google-fonts/instrument-sans";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AppText, Notice, Screen } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import { envError } from "@/lib/env";
import { queryClient } from "@/lib/query";
import { initSentry, Sentry } from "@/lib/sentry";
import { isConfigured } from "@/lib/supabase";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemedStatusBar />
            <AppErrorBoundary>{isConfigured ? <RootNavigator /> : <ConfigurationError />}</AppErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

/**
 * Yönlendirme kapısı (Doc 25 §7: açılış her zaman Bugün). Oturum yoksa (auth); varsa (tabs).
 * Onboarding ve tanıtım F4'te eklenir.
 */
function RootNavigator() {
  const auth = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const group = segments[0];

  useEffect(() => {
    if (auth.status === "loading") return;
    // Bileşen galerisi yalnız geliştirme derlemesinde ve oturumsuz da açılır (göz testi).
    if (__DEV__ && group === "galeri") return;
    if (auth.status === "signedOut" && group !== "(auth)") router.replace("/(auth)/login");
    if (auth.status === "signedIn" && (group === "(auth)" || group === undefined)) router.replace("/(tabs)");
  }, [auth.status, group, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="galeri" options={{ presentation: "modal" }} />
        {/* Oynatıcılar tam ekran (Doc 25 §7); kaydırarak geri kapalı, çıkış onayla. */}
        <Stack.Screen name="seans" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="sonuc" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="oku/[slug]" options={{ presentation: "fullScreenModal" }} />
      </Stack>
    </View>
  );
}

function ConfigurationError() {
  return (
    <Screen>
      <AppText variant="title" style={{ marginTop: 40 }}>
        Yapılandırma eksik
      </AppText>
      <Notice tone="error" title="Ortam değişkenleri tanımlı değil">
        {envError ?? "EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY gerekli."}
      </Notice>
      <AppText variant="bodySm" tone="soft">
        `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri yaz, uygulamayı yeniden başlat.
      </AppText>
    </Screen>
  );
}
