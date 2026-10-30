import { View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/** "Bu hafta" tek satır (Bugün v3): surfaceAlt zemin, köşe 10, iç 12; sol tabular özet, sağ rütbe. */
export function WeekSummaryLine({ left, right }: { left: string; right: string | null }) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Bu hafta: ${left}${right ? `, ${right}` : ""}`}
      style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.card, paddingHorizontal: space.s3, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s3 }}
    >
      <AppText variant="body" style={{ fontSize: 15, fontVariant: ["tabular-nums"] }} numberOfLines={1}>
        {left}
      </AppText>
      {right ? (
        <AppText variant="bodySm" tone="soft" numberOfLines={1}>
          {right}
        </AppText>
      ) : null}
    </View>
  );
}
