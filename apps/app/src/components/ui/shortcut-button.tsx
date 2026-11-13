import type { LucideIcon } from "lucide-react-native";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { AppText } from "./temel";

/**
 * Çalışma kısayolu (Figma 240:1104 "Çalışma kısayolu"): 24 pt ikon + kısa etiket, ortalı.
 * `primary` altın zeminli tek birincil kısayol (Kart tekrarı); `secondary` yüzey + kenar.
 * Basılıyken zemin koyulaşır (primary) ya da açılır (secondary); en az 48 pt, metin sarar.
 */
export function ShortcutButton({
  icon: Icon,
  label,
  variant = "secondary",
  onPress,
  accessibilityLabel,
  style,
}: {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const primary = variant === "primary";
  const fg = primary ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.s2,
          padding: space.s3,
          borderRadius: radius.control,
          backgroundColor: primary ? colors.accent : pressed ? colors.surfaceAlt : colors.surface,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.line,
          opacity: primary && pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      <Icon color={fg} size={24} strokeWidth={1.75} />
      <AppText variant="body" style={{ color: fg, fontFamily: fontFamily.body[500], fontSize: 15, lineHeight: 22, flexShrink: 1, textAlign: "center" }}>
        {label}
      </AppText>
    </Pressable>
  );
}
