import { View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Kapsama paneli (Doc 49/18): lacivert panel (iki temada koyu), "148 / 1001 soru" ve sağda
 * kısa bir özet; altta ince çubuk. Testlerin asıl ilerleme ölçüsü görülen soru sayısıdır.
 */
export function CoveragePanel({ label, value, total, unit, right }: { label: string; value: number; total: number; unit: string; right?: string | null }) {
  const { colors, radius, space } = useTheme();
  const oran = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${total} ${unit} içinden ${value}${right ? `, ${right}` : ""}`}
      style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s4, gap: space.s2 }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.s3 }}>
        <View style={{ gap: 2 }}>
          <AppText variant="label" tone="panelSoft">
            {label}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <AppText variant="display" tone="gold" style={{ fontSize: 32, lineHeight: 38 }}>
              {value}
            </AppText>
            <AppText variant="bodySm" tone="panelSoft" style={{ fontVariant: ["tabular-nums"] }}>
              / {total} {unit}
            </AppText>
          </View>
        </View>
        {right ? (
          <AppText variant="bodySm" tone="panelInk" style={{ textAlign: "right", flexShrink: 1, fontVariant: ["tabular-nums"] }}>
            {right}
          </AppText>
        ) : null}
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <View style={{ width: `${oran * 100}%`, height: "100%", borderRadius: 2, backgroundColor: colors.accent }} />
      </View>
    </View>
  );
}
