import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { Lora_400Regular, Lora_500Medium, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AppText, Notice, Screen } from "@/components/ui";
import { useStoreSync } from "@/features/billing/store";
import { useMe } from "@/features/home/queries";
import { flushQueue } from "@/lib/offline-queue";
import { usePushNavigation } from "@/lib/push";
import { refreshReminder } from "@/lib/reminders";
import { addNetworkStateListener } from "expo-network";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import { useIntroSeen } from "@/lib/intro-seen";
import { envError } from "@/lib/env";
import { queryClient } from "@/lib/query";
import { initSentry, Sentry } from "@/lib/sentry";
import { isConfigured } from "@/lib/supabase";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
 * Yönlendirme kapısı (Doc 25 §7: açılış her zaman Bugün).
 * Oturum yok: tanıtım görülmediyse /tanitim, görüldüyse (auth). Oturum var: onboarding
 * tamamlanmadıysa /onboarding, aksi halde (tabs). Bayraklar okunana kadar bekler.
 */
function RootNavigator() {
  const auth = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const introSeen = useIntroSeen();
  const me = useMe(auth.status === "signedIn");
  const group = segments[0];

  useEffect(() => {
    if (auth.status === "loading" || introSeen === null) return;
    // Bileşen galerisi yalnız geliştirme derlemesinde ve oturumsuz da açılır (göz testi).
    if (__DEV__ && group === "galeri") return;
    if (auth.status === "signedOut") {
      if (!introSeen && group !== "tanitim") router.replace("/tanitim");
      else if (introSeen && group !== "(auth)") router.replace("/(auth)/login");
      return;
    }
    // Oturum açık: onboarding kararı /me'den (yüklenene kadar yönlendirme yok).
    if (!me.data) return;
    if (!me.data.onboardingCompleted) {
      if (group !== "onboarding") router.replace("/onboarding");
      return;
    }
    if (group === "(auth)" || group === "tanitim" || group === "onboarding" || group === undefined) router.replace("/(tabs)");
  }, [auth.status, group, router, introSeen, me.data]);

  const ready = auth.status === "signedIn" && Boolean(me.data?.onboardingCompleted) && group !== "(auth)" && group !== "tanitim" && group !== "onboarding";
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppServices userId={auth.status === "signedIn" ? (auth.session?.user.id ?? null) : null} ready={ready} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="tanitim" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="galeri" options={{ presentation: "modal" }} />
        {/* Oynatıcılar tam ekran (Doc 25 §7); kaydırarak geri kapalı, çıkış onayla. */}
        <Stack.Screen name="seans" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="sonuc" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="oku/[slug]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
        <Stack.Screen name="planim" options={{ headerShown: true, title: "Planım" }} />
        <Stack.Screen name="deneme-sonuc" options={{ headerShown: false }} />
        <Stack.Screen name="bildirimler" options={{ headerShown: true, title: "Bildirimler" }} />
      </Stack>
    </View>
  );
}

/**
 * Oturum boyu servisler (F5): mağaza senkronu, push kaydı ve yönlendirme, çevrimdışı kuyruk
 * (açılışta ve ağ gelince), günlük hatırlatma penceresi. Ekran çizmez.
 */
function AppServices({ userId, ready }: { userId: string | null; ready: boolean }) {
  useStoreSync(userId);
  usePushNavigation(ready);
  useEffect(() => {
    if (!ready) return;
    void flushQueue();
    void refreshReminder();
    const sub = addNetworkStateListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) void flushQueue();
    });
    return () => sub.remove();
  }, [ready]);
  return null;
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
