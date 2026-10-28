import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Ben yığını: profil → ayarlar · rozetler · üyelik · performans (konu haritası, liderlik, denemelerim — 28 Eki 2026'da Performans sekmesinden taşındı). */
export default function BenLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      <Stack.Screen name="rozetler" options={{ title: "Rozetler" }} />
      <Stack.Screen name="uyelik" options={{ title: "Üyelik" }} />
      <Stack.Screen name="performans" options={{ title: "Performans" }} />
      <Stack.Screen name="konu-haritasi" options={{ title: "Konu haritası" }} />
      <Stack.Screen name="liderlik" options={{ title: "Liderlik" }} />
      <Stack.Screen name="denemelerim" options={{ title: "Denemelerim" }} />
    </Stack>
  );
}
