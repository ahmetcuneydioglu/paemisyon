import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText, ProgressBar } from "@/components/ui";
import { bandBarTone, type Band } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Hâkimiyet yüzdesinin rengi — band sunucudan; istemci eşik bilmez. */
function pctTone(b: Band): "danger" | "success" | "accentInk" | "subtle" {
  return b === "weak" ? "danger" : b === "strong" ? "success" : b === "new" || b === "sparse" ? "subtle" : "accentInk";
}

/**
 * Ders kartı (Çalış v2, Doc 49/17 — Figma 108:295): ad (≤3 satır), serif hâkimiyet yüzdesi,
 * tek künye (sunucu seçer: "18 yanlış", "Sınavda %30"…) ve 4 pt çubuk. Yükseklik ızgaradan
 * gelir (`style`); en az 96 pt, içerik kırpılmaz. Dokununca ders odası.
 */
export function CourseCard({
  name,
  accuracyPct,
  band,
  note,
  onPress,
  style,
}: {
  name: string;
  accuracyPct: number | null;
  band: Band;
  note: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${accuracyPct == null ? "henüz ölçülmedi" : `hâkimiyet yüzde ${accuracyPct}`}, ${note}`}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 96,
          justifyContent: "space-between",
          gap: space.s2,
          paddingHorizontal: 14,
          paddingVertical: space.s3,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <AppText variant="subhead" numberOfLines={3}>
        {name}
      </AppText>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s2 }}>
          <AppText variant="stat" tone={pctTone(band)}>
            {accuracyPct == null ? "—" : `%${accuracyPct}`}
          </AppText>
          <AppText variant="bodySm" tone="soft" numberOfLines={1} style={{ flexShrink: 1, fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
            {note}
          </AppText>
        </View>
        <ProgressBar value={(accuracyPct ?? 0) / 100} tone={bandBarTone(band)} height={4} />
      </View>
    </Pressable>
  );
}
