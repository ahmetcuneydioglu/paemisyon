import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Düello tam ekran akışı (Doc 59): rakip arama, maç, salon kurma, yanlış inceleme. Merkez,
 * sıralama ve istatistik Çalış sekmesinin yığınındadır (alt gezinme görünür kalsın diye).
 * Maçta geri kaydırma kapalı: yanlışlıkla çıkış mağlubiyet demektir, çıkış onayla olur.
 */
export default function DuelloLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="ara" options={{ gestureEnabled: false }} />
      <Stack.Screen name="mac/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="salon-kur" />
      <Stack.Screen name="inceleme/[id]" />
    </Stack>
  );
}
