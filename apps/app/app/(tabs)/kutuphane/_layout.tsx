import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Kütüphane yığını: ana → ders → (atlas) · mevzuat → kanun; okuyucu kök Stack'te tam ekran. */
export default function KutuphaneLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ders/[id]" options={{ title: "Ders" }} />
      <Stack.Screen name="atlas/[topicId]" options={{ title: "Madde Atlası" }} />
      <Stack.Screen name="mevzuat/index" options={{ title: "Mevzuat" }} />
      <Stack.Screen name="mevzuat/[slug]" options={{ title: "Kanun" }} />
      <Stack.Screen name="tekrar" options={{ title: "Tekrar" }} />
    </Stack>
  );
}
