import { View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useLargeText } from "@/theme/text-scale";

/**
 * "Bu hafta" tek satır (Bugün v3): surfaceAlt zemin, köşe 10, iç 12; sol tabular özet, sağ rütbe.
 * Büyük yazıda (`useLargeText`) iki blok alt alta dizilir; rütbe adı sağdan kesilmez.
 */
export function WeekSummaryLine({ left, right }: { left: string; right: string | null }) {
  const { colors, radius, space } = useTheme();
  const large = useLargeText();
  return (
    <View
      accessible
      accessibilityLabel={`Bu hafta: ${left}${right ? `, ${right}` : ""}`}
      style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.card, paddingHorizontal: space.s3, minHeight: 46, ...(large ? { paddingVertical: space.s2, justifyContent: "center", gap: 2 } : { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s3 }) }}
    >
      <AppText variant="body" style={{ fontSize: 15, fontVariant: ["tabular-nums"], flexShrink: 1 }} numberOfLines={large ? undefined : 1}>
        {left}
      </AppText>
      {right ? (
        <AppText variant="bodySm" tone="soft" numberOfLines={large ? undefined : 1} style={{ flexShrink: 1 }}>
          {right}
        </AppText>
      ) : null}
    </View>
  );
}
