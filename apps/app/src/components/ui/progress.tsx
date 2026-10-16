import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export type ProgressTone = "accent" | "success" | "warning" | "danger";

function toneColor(colors: ReturnType<typeof useTheme>["colors"], tone: ProgressTone) {
  return tone === "success" ? colors.success : tone === "warning" ? colors.warning : tone === "danger" ? colors.danger : colors.accent;
}

/** Sürekli ilerleme çubuğu (0..1). Hazırlık satırlarında ders doğruluğu. */
export function ProgressBar({ value, tone = "accent", height = 5, label, style }: { value: number; tone?: ProgressTone; height?: number; label?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height, borderRadius: height / 2, backgroundColor: colors.surfaceAlt, overflow: "hidden" }, style]}
    >
      <View style={{ width: `${pct * 100}%`, height: "100%", borderRadius: height / 2, backgroundColor: toneColor(colors, tone) }} />
    </View>
  );
}

/** Dilimli ilerleme (görev kartı: 12 soruluk turda 3/12). Dilim sayısı küçükken (≤ 20) okunur. */
export function SegmentBar({ total, done, tone = "accent", style }: { total: number; done: number; tone?: ProgressTone; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const n = Math.max(1, Math.min(20, total));
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }} style={[{ flexDirection: "row", gap: 4 }, style]}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < done ? toneColor(colors, tone) : colors.surfaceAlt }} />
      ))}
    </View>
  );
}

export type DayState = "done" | "today" | "empty";

/** Haftalık aktif gün noktaları (D1: tek istikrar ölçüsü). Bugün bakır çerçeve, tamamlanan adaçayı dolu. */
export function WeekDots({ days, style }: { days: DayState[]; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const done = days.filter((d) => d === "done").length;
  return (
    <View accessible accessibilityLabel={`Bu hafta ${done} aktif gün`} style={[{ flexDirection: "row", gap: 6 }, style]}>
      {days.map((d, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: d === "done" ? colors.success : colors.surfaceAlt,
            borderWidth: 1,
            borderColor: d === "done" ? colors.success : d === "today" ? colors.accent : colors.line,
          }}
        />
      ))}
    </View>
  );
}
