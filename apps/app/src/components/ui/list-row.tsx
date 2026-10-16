import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

/**
 * Liste satırı: başlık, alt başlık, sol öğe (ikon/rozet), sağ öğe (değer/rozet), ok.
 * Satırlar `divider` ile ayrılır (gölge yok, 1 px çizgi). Dokunma yüksekliği ≥ 52.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = Boolean(onPress),
  divider = true,
  style,
}: {
  title: string;
  subtitle?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, space } = useTheme();
  const content = (
    <>
      {leading ? <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>{leading}</View> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" tone="soft" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {chevron ? <ChevronRight color={colors.inkSubtle} size={20} strokeWidth={1.75} /> : null}
    </>
  );
  const base: ViewStyle = {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.s3,
    paddingVertical: space.s3,
    borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: colors.line,
  };
  if (!onPress) return <View style={[base, style]}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.7 : 1 }, style]}>
      {content}
    </Pressable>
  );
}
