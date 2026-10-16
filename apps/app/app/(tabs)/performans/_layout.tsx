import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Performans yığını: ana → konu haritası · liderlik · denemelerim. */
export default function PerformansLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="konu-haritasi" options={{ title: "Konu haritası" }} />
      <Stack.Screen name="liderlik" options={{ title: "Liderlik" }} />
      <Stack.Screen name="denemelerim" options={{ title: "Denemelerim" }} />
    </Stack>
  );
}
