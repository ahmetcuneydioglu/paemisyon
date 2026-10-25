import { Stack } from "expo-router";
import { useStackOptions } from "@/navigation/stack-options";

/** Deneme sonucu yığını (Doc 50 M4–M5): sonuç → cevap incelemesi → soru ayrıntısı. */
export default function DenemeSonucLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="[attemptId]/index" options={{ title: "Deneme sonucu" }} />
      <Stack.Screen name="[attemptId]/inceleme" options={{ title: "Cevap incelemesi" }} />
      <Stack.Screen name="[attemptId]/soru/[no]" options={{ title: "Soru" }} />
    </Stack>
  );
}
