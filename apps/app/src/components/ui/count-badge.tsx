import type { ComponentType } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, size as tokenSize } from "@/theme/tokens";
import { AppText } from "./temel";

type IconProps = { color: string; size?: number; strokeWidth?: number };

/** Sayı rozeti: 1–99 ve "99+"; sıfırda çizilmez. Renk tek başına anlam taşımaz, sayı okunur. */
export function CountBadge({ count, tone = "accent" }: { count: number; tone?: "accent" | "danger" }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  const bg = tone === "danger" ? colors.danger : colors.accent;
  const fg = tone === "danger" ? colors.onAccent : colors.onAccent;
  const text = count > 99 ? "99+" : String(count);
  return (
    <View
      accessibilityLabel={`${text} okunmamış`}
      style={{ minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}
    >
      <AppText variant="label" style={{ color: fg, fontFamily: fontFamily.body[700], fontSize: 11, lineHeight: 13, letterSpacing: 0, textTransform: "none" }} maxFontSizeMultiplier={1.2}>
        {text}
      </AppText>
    </View>
  );
}

/**
 * İkon + köşe rozeti (zil, kutu): 44 pt dokunma hedefi, rozet ikonun sağ üstünde; erişilebilirlik
 * etiketi sayıyı söyler ("Bildirimler, 3 okunmamış").
 */
export function IconBadgeButton({
  icon: Icon,
  label,
  count,
  onPress,
  color,
  style,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  count: number;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${label}, ${count > 99 ? "99+" : count} okunmamış` : label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: tokenSize.touchTarget,
          height: tokenSize.touchTarget,
          borderRadius: radius.control,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon color={color ?? colors.ink} size={tokenSize.icon} strokeWidth={tokenSize.iconStroke} />
      {count > 0 ? (
        <View style={{ position: "absolute", top: 4, right: 2 }}>
          <CountBadge count={count} />
        </View>
      ) : null}
    </Pressable>
  );
}
