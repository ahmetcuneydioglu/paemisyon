import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useLargeText } from "@/theme/text-scale";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

/**
 * Eylem kutusu (Doc 49/17, Figma 104:64): ikon + başlık + tek satırlık durum. 2×2 ızgarada
 * kullanılır; `primary` altın zeminli tek birincil eylemdir. Sayı yoksa `disabled` — sönük
 * durur, alt yazı nedenini söyler, ekran okuyucu "devre dışı" der.
 */
export function ActionTile({
  icon: Icon,
  title,
  subtitle,
  variant = "default",
  disabled = false,
  onPress,
  style,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  variant?: "primary" | "default";
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const large = useLargeText();
  const primary = variant === "primary";
  const fg = primary ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          // Alt alta dizilişte (büyük yazı) flex:1 yüksekliği sıfır tabanla kurup içeriği taşırırdı.
          ...(large ? { alignSelf: "stretch" as const } : { flex: 1 }),
          minHeight: 112,
          padding: space.s4,
          gap: space.s3,
          borderRadius: radius.card,
          backgroundColor: primary ? colors.accent : colors.surface,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.line,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Icon color={primary ? colors.onAccent : disabled ? colors.inkSubtle : colors.accentInk} size={24} strokeWidth={1.75} />
      <View style={{ gap: 2 }}>
        <AppText variant="subhead" style={{ color: fg, fontSize: 16, lineHeight: 22 }} numberOfLines={large ? 2 : 1}>
          {title}
        </AppText>
        <AppText variant="bodySm" style={{ color: primary ? colors.onAccent : colors.inkSoft, opacity: primary ? 0.85 : 1 }} numberOfLines={large ? 4 : 2}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

/**
 * ActionTile ızgarasının bir satırı: normalde yan yana; büyük yazıda (AX) alt alta — iki sütunda
 * başlık ("Çıkmış…") ve durum kesiliyordu (Faz 6, 14 Kas 2026).
 */
export function ActionTileRow({ children, gap }: { children: ReactNode; gap?: number }) {
  const { space } = useTheme();
  const large = useLargeText();
  return <View style={{ flexDirection: large ? "column" : "row", gap: gap ?? space.s2 }}>{children}</View>;
}
