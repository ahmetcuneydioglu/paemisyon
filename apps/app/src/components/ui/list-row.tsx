import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "./temel";

/** Sol öğe kutusunun tonu: `success` tamamlanmış satırı (okundu) işaretler; renk tek başına anlam taşımaz,
 * çağıran ikon (onay) ve metin rozeti de verir (Doc 26 §5). */
export type ListRowLeadingTone = "neutral" | "accent" | "success";

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
  leadingTone = "neutral",
  accessibilityLabel,
  style,
  children,
}: {
  title: string;
  subtitle?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  /** Sol öğe kutusunun zemini (varsayılan nötr). */
  leadingTone?: ListRowLeadingTone;
  /** Ekran okuyucu etiketi; durum (ör. "okundu") görsel rozetteyse burada da söylenir. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Alt başlığın altında ek içerik (ilerleme/durum çubuğu). */
  children?: ReactNode;
}) {
  const { colors, space } = useTheme();
  const leadingBg = leadingTone === "success" ? colors.successSoft : leadingTone === "accent" ? colors.accentSoft : colors.surfaceAlt;
  const content = (
    <>
      {leading ? <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: leadingBg, alignItems: "center", justifyContent: "center" }}>{leading}</View> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" tone="soft" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
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
  if (!onPress) return <View accessible={accessibilityLabel ? true : undefined} accessibilityLabel={accessibilityLabel} style={[base, style]}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.7 : 1 }, style]}>
      {content}
    </Pressable>
  );
}
