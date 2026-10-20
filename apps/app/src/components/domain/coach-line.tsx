import { View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/** Koç cümlesi: sol altın çizgi + tek cümle (Doc 49/14). Cümle yoksa hiç çizilmez. */
export function CoachLine({ text }: { text: string | null }) {
  const { colors, space } = useTheme();
  if (!text) return null;
  return (
    <View style={{ flexDirection: "row", gap: space.s3 }}>
      <View style={{ width: 2, backgroundColor: colors.accent, borderRadius: 1 }} />
      <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}
