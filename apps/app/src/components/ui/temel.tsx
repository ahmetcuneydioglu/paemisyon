import * as Haptics from "expo-haptics";
import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { size, type TypeRole } from "@/theme/tokens";

/**
 * Temel bileşen kiti v3 (Doc 49 §1.4) — F1'de iskelet için gereken alt küme:
 * Screen, AppText, Button, TextField, Notice, Card, Skeleton. F2 galeride tamamlanır.
 * Her bileşen varyant parametreli; ekrana özel bileşen yok (CLAUDE.md §3).
 */

/* ---------------------------------------------------------------- Metin */

/** `accent`: vurgu METNİ — koyuda altın, açıkta kahve (token accentInk; altın açıkta okunmaz, Doc 49/13 §4).
 *  `gold`: ham altın — yalnız koyu panel üstünde (geri sayım rakamı). */
export type Tone = "ink" | "soft" | "subtle" | "accent" | "accentInk" | "gold" | "success" | "danger" | "onAccent" | "panelInk" | "panelSoft";

/** `variant` tipografi rolüdür; RN `Text`in kendi `role` (erişilebilirlik) prop'u ayrı kalır. */
export function AppText({
  variant = "body",
  tone = "ink",
  style,
  children,
  ...props
}: { variant?: TypeRole; tone?: Tone; style?: StyleProp<TextStyle>; children: ReactNode } & Omit<React.ComponentProps<typeof Text>, "style" | "children">) {
  const { colors, type } = useTheme();
  const role = variant;
  const color =
    tone === "soft" ? colors.inkSoft
    : tone === "subtle" ? colors.inkSubtle
    : tone === "accent" ? colors.accentInk
    : tone === "accentInk" ? colors.accentInk
    : tone === "gold" ? colors.accent
    : tone === "success" ? colors.success
    : tone === "danger" ? colors.danger
    : tone === "onAccent" ? colors.onAccent
    : tone === "panelInk" ? colors.panelInk
    : tone === "panelSoft" ? colors.panelSoft
    : colors.ink;
  return (
    <Text {...props} maxFontSizeMultiplier={type[role].fontSize > 17 ? 1.35 : 2} style={[type[role], { color }, style]}>
      {children}
    </Text>
  );
}

/* ---------------------------------------------------------------- Ekran */

/** `inset="none"`: modal/sheet sunumunda sistem zaten üst boşluk bırakır. */
export function Screen({ children, scroll = true, padded = true, inset = "safe", style }: { children: ReactNode; scroll?: boolean; padded?: boolean; inset?: "safe" | "none"; style?: StyleProp<ViewStyle> }) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const top = inset === "safe" ? insets.top + space.s4 : space.s4;
  const padding = padded ? { paddingHorizontal: space.screenGutter, paddingTop: top, paddingBottom: space.s8 } : { paddingTop: top };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, padding, style]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[padding, { gap: space.s5 }, style]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never">
      {children}
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- Kart */

export function Card({ children, style, tone = "surface" }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: "surface" | "alt" | "accent" }) {
  const { colors, radius, space } = useTheme();
  const bg = tone === "alt" ? colors.surfaceAlt : tone === "accent" ? colors.accentSoft : colors.surface;
  return (
    <View style={[{ backgroundColor: bg, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: space.s5, gap: space.s3 }, style]}>
      {children}
    </View>
  );
}

/* ---------------------------------------------------------------- Düğme */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  onPress,
  style,
  ...props
}: { title: string; variant?: ButtonVariant; loading?: boolean; style?: StyleProp<ViewStyle> } & Omit<PressableProps, "style" | "children">) {
  const { colors, radius, type } = useTheme();
  const bg = variant === "primary" ? colors.accent : variant === "secondary" ? colors.surface : variant === "destructive" ? colors.danger : "transparent";
  const fg = variant === "primary" ? colors.onAccent : variant === "destructive" ? colors.onAccent : variant === "ghost" ? colors.accentInk : colors.ink;
  const isDisabled = Boolean(disabled) || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(e) => {
        void Haptics.selectionAsync();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          minHeight: 54,
          borderRadius: radius.card,
          backgroundColor: bg,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[type.subhead, { fontSize: 17, lineHeight: 22, color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Metin alanı */

export function TextField({ label, error, style, ...props }: { label: string; error?: string | null } & TextInputProps) {
  const { colors, radius, type, space } = useTheme();
  return (
    <View style={{ gap: space.s2 }}>
      <AppText variant="subhead">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSubtle}
        style={[
          type.body,
          // lineHeight paragraf stili iOS'ta odak dışındaki tek satırlı alanı sardırıp
          // kutunun dışına taşırıyordu (SE 375 pt, 18 Eki 2026) — alanlarda kullanılmaz.
          { lineHeight: undefined, minHeight: 52, borderRadius: radius.control, borderWidth: 1, borderColor: error ? colors.danger : colors.line, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: space.s4 },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="bodySm" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Bildirim kutusu */

export function Notice({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "error"; title?: string; children?: ReactNode }) {
  const { colors, radius, space } = useTheme();
  const map = {
    info: { bg: colors.surfaceAlt, fg: colors.ink },
    success: { bg: colors.successSoft, fg: colors.successInk },
    warning: { bg: colors.warningSoft, fg: colors.warningInk },
    error: { bg: colors.dangerSoft, fg: colors.dangerInk },
  }[tone];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: map.bg, borderRadius: radius.card, padding: space.s4, gap: space.s1 }}>
      {title ? <AppText variant="subhead" style={{ color: map.fg }}>{title}</AppText> : null}
      {children ? <AppText variant="bodySm" style={{ color: map.fg }}>{children}</AppText> : null}
    </View>
  );
}

/* ---------------------------------------------------------------- İskelet */

export function Skeleton({ height = 16, width = "100%", radiusKey = "control" }: { height?: number; width?: number | `${number}%`; radiusKey?: "control" | "card" | "pill" }) {
  const { colors, radius } = useTheme();
  return <View accessibilityElementsHidden style={{ height, width, borderRadius: radius[radiusKey], backgroundColor: colors.surfaceAlt }} />;
}

export const touchTarget = size.touchTarget;
