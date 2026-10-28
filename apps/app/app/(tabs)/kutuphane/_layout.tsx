import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Kütüphane yığını: ana → ders → (atlas) · tekrar; mevzuat kendi sekmesinde (28 Eki 2026), okuyucu kök Stack'te tam ekran. */
export default function KutuphaneLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ders/[id]" options={{ title: "Ders" }} />
      <Stack.Screen name="konu/[topicId]" options={{ title: "Konu" }} />
      <Stack.Screen name="atlas/[topicId]" options={{ title: "Madde Atlası" }} />
      <Stack.Screen name="tekrar" options={{ title: "Tekrar" }} />
    </Stack>
  );
}
