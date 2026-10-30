import { View } from "react-native";
import { AppText, Button } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Sıradaki kartı (Bugün v3, Figma 68:474): ekranın TEK birincil eylemi. `panel` laciverti
 * (iki temada koyu), köşe `radius.panel`, iç boşluk 20; üstte etiket + küçük hap, Lora başlık,
 * tek cümle gerekçe, altın düğme. Koyu temada panel = surface; ayrım kenarsızlık + köşe 4 +
 * düğmeyle (Doc 49/16 §8 not 1).
 */
export function NextStepCard({
  eyebrow,
  title,
  reason,
  badge,
  ctaLabel,
  onPress,
  disabled = false,
  secondary,
}: {
  eyebrow: string;
  title: string;
  reason: string;
  badge?: string | null;
  ctaLabel: string;
  onPress: () => void;
  disabled?: boolean;
  /** Yarım turda "Şimdilik bitir, sonucu gör" gibi ikincil ghost satır. */
  secondary?: { label: string; onPress: () => void } | null;
}) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Sıradaki: ${title}. ${reason}`}
      style={{ backgroundColor: colors.panel, borderRadius: radius.panel, padding: space.s5, gap: space.s4 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2 }}>
        <AppText variant="label" tone="panelSoft" numberOfLines={1} style={{ flex: 1 }}>
          {eyebrow}
        </AppText>
        {badge ? (
          <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <AppText variant="bodySm" tone="panelInk" style={{ fontSize: 11, lineHeight: 14 }}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={{ gap: space.s2 }}>
        <AppText variant="title" tone="panelInk" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="body" tone="panelSoft" style={{ fontSize: 15, lineHeight: 22 }}>
          {reason}
        </AppText>
      </View>
      <Button title={ctaLabel} onPress={onPress} disabled={disabled} />
      {secondary ? (
        <Button title={secondary.label} variant="ghost" onPress={secondary.onPress} style={{ marginTop: -space.s2 }} />
      ) : null}
    </View>
  );
}
