import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Mevzuat yığını (28 Eki 2026): ana → kanun detayı · arama; okuyucu kök Stack'te tam ekran. */
export default function MevzuatLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[slug]" options={{ title: "Kanun" }} />
      <Stack.Screen name="ara" options={{ title: "Mevzuatta ara" }} />
    </Stack>
  );
}
