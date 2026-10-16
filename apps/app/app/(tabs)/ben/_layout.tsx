import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Ben yığını: profil → ayarlar · rozetler · üyelik. */
export default function BenLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      <Stack.Screen name="rozetler" options={{ title: "Rozetler" }} />
      <Stack.Screen name="uyelik" options={{ title: "Üyelik" }} />
    </Stack>
  );
}
