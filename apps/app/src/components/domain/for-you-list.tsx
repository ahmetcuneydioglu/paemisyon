import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export interface ForYouRow {
  key: string;
  label: string;
  ctaLabel: string;
  onPress: () => void;
}

/**
 * Senin için (Bugün v3, Figma 68:474): en çok 3 satır, 56 pt, 1 px çizgi; sağda altın kenarlı
 * hap (koyuda altın metin, açıkta kahve). Satırın tamamı dokunulur; hap yalnız etikettir.
 */
export function ForYouList({ rows }: { rows: ForYouRow[] }) {
  const { colors, radius, space } = useTheme();
  if (rows.length === 0) return null;
  return (
    <View style={{ gap: space.s2 }}>
      <AppText variant="label" tone="subtle" accessibilityRole="header">
        SENİN İÇİN
      </AppText>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.s4 }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.key}
            accessibilityRole="button"
            accessibilityLabel={`${r.label}. ${r.ctaLabel}`}
            onPress={r.onPress}
            style={({ pressed }) => ({
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              gap: space.s3,
              borderBottomWidth: i < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.line,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText variant="bodySm" style={{ flex: 1, fontSize: 15, lineHeight: 20 }} numberOfLines={2}>
              {r.label}
            </AppText>
            <View style={{ borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 12, minHeight: 32, justifyContent: "center" }}>
              <AppText variant="subhead" tone="accentInk" style={{ fontSize: 14, lineHeight: 18 }}>
                {r.ctaLabel}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
