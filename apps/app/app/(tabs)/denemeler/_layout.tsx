import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Denemeler yığını: ana → çıkmış sınavlar → dönem → çalışma modu; sıralama. Oynatıcı ve sonuç kökte. */
export default function DenemelerLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="cikmis/index" options={{ title: "Çıkmış sınavlar" }} />
      <Stack.Screen name="cikmis/[slug]" options={{ title: "Çıkmış sınav" }} />
      <Stack.Screen name="cikmis/calis/[slug]" options={{ title: "Çalışma modu" }} />
      <Stack.Screen name="siralama/[examId]" options={{ title: "Sıralama" }} />
    </Stack>
  );
}
