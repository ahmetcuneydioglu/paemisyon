import * as Haptics from "expo-haptics";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** Durum rozeti: renk tek başına anlam taşımaz, metin zorunlu (Doc 26 §5). */
export function Badge({ tone = "neutral", children, style }: { tone?: BadgeTone; children: string; style?: StyleProp<ViewStyle> }) {
  const { colors, radius } = useTheme();
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.inkSoft },
    accent: { bg: colors.accentSoft, fg: colors.accentInk },
    success: { bg: colors.successSoft, fg: colors.successInk },
    warning: { bg: colors.warningSoft, fg: colors.warningInk },
    danger: { bg: colors.dangerSoft, fg: colors.dangerInk },
  }[tone];
  return (
    <View style={[{ alignSelf: "flex-start", backgroundColor: map.bg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }, style]}>
      <AppText variant="label" style={{ color: map.fg, letterSpacing: 0.4, textTransform: "none", fontSize: 12, lineHeight: 16 }}>
        {children}
      </AppText>
    </View>
  );
}

type IconProps = { color: string; size?: number; strokeWidth?: number };

/** Seçilebilir çip (filtre, odak satırı): ≥44 pt dokunma yüksekliği. */
export function Chip({
  label,
  selected = false,
  onPress,
  icon: Icon,
  disabled,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ComponentType<IconProps>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, type } = useTheme();
  const fg = selected ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.accent : colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? colors.accent : colors.line,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {Icon ? <Icon color={fg} size={18} strokeWidth={1.75} /> : null}
      <AppText variant="subhead" style={[type.subhead, { color: fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}
