import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { ProgressBar, type ProgressTone } from "./progress";
import { AppText } from "./temel";

/**
 * İstatistik kutusu: etiket, büyük değer (tabular), birim, isteğe bağlı ilerleme.
 * Değer yoksa "—" ve açıklama; rakam uydurulmaz (Doc 24 §4).
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  progress,
  tone = "accent",
  emphasis = false,
  style,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  hint?: string;
  progress?: number;
  tone?: ProgressTone;
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const valueTone = value == null ? "subtle" : tone === "danger" ? "danger" : tone === "warning" ? "accentInk" : emphasis ? "accent" : "ink";
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.s4, gap: 6, minWidth: 0 }, style]}>
      {/* Büyük yazıda etiket kırpılmasın: iki satıra sarar. */}
      <AppText variant="label" tone="subtle" numberOfLines={2}>
        {label}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <AppText variant="stat" tone={valueTone}>
          {value ?? "—"}
        </AppText>
        {unit ? (
          <AppText variant="bodySm" tone="soft">
            {unit}
          </AppText>
        ) : null}
      </View>
      {progress != null ? <ProgressBar value={progress} tone={tone} height={4} /> : null}
      {hint ? (
        <AppText variant="bodySm" tone="subtle" numberOfLines={3}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
