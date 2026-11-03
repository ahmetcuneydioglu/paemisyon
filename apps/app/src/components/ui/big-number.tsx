import type { ReactNode } from "react";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { AppText, type Tone } from "./temel";

/**
 * Büyük sayı (Figma 109:1567 kuralı): Lora Medium, satır kutusu = 1,15 × punto, üstte 4pt
 * boşluk; önündeki metinle asla aynı satır kutusunu paylaşmaz. Yanındaki açıklama ("kalan süre")
 * taban çizgisinde hizalı 14/20. Dinamik yazı 1,2× ile sınırlı — sayı kartı taşırmaz.
 */
export function BigNumber({ value, size = 56, tone = "panelInk", suffix, suffixTone = "panelSoft", style, textStyle, accessibilityLabel }: { value: string; size?: number; tone?: Tone; suffix?: ReactNode; suffixTone?: Tone; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; accessibilityLabel?: string }) {
  const { space } = useTheme();
  return (
    <View accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} style={[{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: space.s2, paddingTop: 4 }, style]}>
      <AppText variant="display" tone={tone} maxFontSizeMultiplier={1.2} style={[{ fontFamily: fontFamily.display[500], fontSize: size, lineHeight: Math.round(size * 1.15), fontVariant: ["tabular-nums"] }, textStyle]}>
        {value}
      </AppText>
      {typeof suffix === "string" ? (
        <AppText variant="bodySm" tone={suffixTone}>
          {suffix}
        </AppText>
      ) : (
        suffix ?? null
      )}
    </View>
  );
}
