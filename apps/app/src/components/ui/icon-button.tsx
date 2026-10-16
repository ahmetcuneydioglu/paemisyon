import * as Haptics from "expo-haptics";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { size as tokenSize } from "@/theme/tokens";

type IconProps = { color: string; size?: number; strokeWidth?: number };

/** Yalnız ikonlu düğme: 44 pt hedef, zorunlu erişilebilirlik etiketi. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = "secondary",
  disabled,
  style,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  const fg = variant === "primary" ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          width: tokenSize.touchTarget,
          height: tokenSize.touchTarget,
          borderRadius: radius.control,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: variant === "primary" ? colors.accent : variant === "secondary" ? colors.surface : "transparent",
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.line,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon color={fg} size={tokenSize.icon} strokeWidth={tokenSize.iconStroke} />
    </Pressable>
  );
}
