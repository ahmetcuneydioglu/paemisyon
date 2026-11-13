import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { createContext, useContext, useState, type ComponentRef, type ReactNode, type Ref } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle, RefreshControl } from "react-native";
import { Eye as EyeIcon, EyeOff } from "lucide-react-native";
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
export type Tone = "ink" | "soft" | "subtle" | "accent" | "accentInk" | "gold" | "success" | "danger" | "info" | "onAccent" | "panelInk" | "panelSoft";

/**
 * Alt ağaçtaki her `AppText` için dinamik yazı tavanı. YALNIZ süs/önizleme alanları içindir
 * (tanıtım kahramanı): orada metin okunmak için değil ürünü göstermek için durur ve ekran
 * okuyucudan gizlidir; okunacak metin bu sarmalın dışında kalır ve tam büyür.
 */
const TextScaleCapContext = createContext<number | null>(null);
export function TextScaleCap({ max, children }: { max: number; children: ReactNode }) {
  return <TextScaleCapContext.Provider value={max}>{children}</TextScaleCapContext.Provider>;
}

/** `variant` tipografi rolüdür; RN `Text`in kendi `role` (erişilebilirlik) prop'u ayrı kalır. */
export function AppText({
  variant = "body",
  tone = "ink",
  style,
  children,
  maxFontSizeMultiplier,
  ...props
}: { variant?: TypeRole; tone?: Tone; style?: StyleProp<TextStyle>; children: ReactNode } & Omit<React.ComponentProps<typeof Text>, "style" | "children">) {
  const { colors, type } = useTheme();
  const cap = useContext(TextScaleCapContext);
  const role = variant;
  // iOS `textTransform: "uppercase"` Türkçe bilmez ("Birincisi" → "BIRINCISI"); büyük harf rolü
  // metni tr-TR ile kendimiz çeviririz (13 Kas 2026). Stil açıkça "none" verirse dokunulmaz.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const upper = type[role].textTransform === "uppercase" && flat?.textTransform !== "none";
  const color =
    tone === "soft" ? colors.inkSoft
    : tone === "subtle" ? colors.inkSubtle
    : tone === "accent" ? colors.accentInk
    : tone === "accentInk" ? colors.accentInk
    : tone === "gold" ? colors.accent
    : tone === "success" ? colors.success
    : tone === "danger" ? colors.danger
    : tone === "info" ? colors.info
    : tone === "onAccent" ? colors.onAccent
    : tone === "panelInk" ? colors.panelInk
    : tone === "panelSoft" ? colors.panelSoft
    : colors.ink;
  // Dinamik yazı tavanı: bileşen kendi tavanını verebilir (BigNumber 1,2×, liderlik satırları 1,3×);
  // verilmezse büyük boylar 1,35×, metin boyları 2× (5 Kas 2026'ya kadar dıştan verilen değer eziliyordu).
  return (
    <Text {...props} maxFontSizeMultiplier={capped(maxFontSizeMultiplier ?? (type[role].fontSize > 17 ? 1.35 : 2), cap)} style={[type[role], { color }, style, upper ? { textTransform: "none" } : null]}>
      {upper ? trUpper(children) : children}
    </Text>
  );
}

/** Çocuklardaki düz metni tr-TR büyük harfe çevirir; iç içe öğeler olduğu gibi kalır. */
function trUpper(node: ReactNode): ReactNode {
  if (typeof node === "string") return node.toLocaleUpperCase("tr-TR");
  if (Array.isArray(node)) return node.map((n) => (typeof n === "string" ? n.toLocaleUpperCase("tr-TR") : n));
  return node;
}

function capped(own: number, cap: number | null): number {
  return cap == null ? own : Math.min(own, cap);
}

/* ---------------------------------------------------------------- Ekran */

/** `inset="none"`: modal/sheet sunumunda sistem zaten üst boşluk bırakır. */
/**
 * Aşağı çekince yenile (kullanıcı geri bildirimi 31 Eki: hiçbir sekmede yenileme yoktu):
 * varsayılan davranış ekrandaki AKTİF react-query sorgularını yeniden çeker; ekran özel bir
 * şey yapacaksa `onRefresh` verir. `refresh={false}` kapatır (form/sihirbaz ekranları).
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  inset = "safe",
  style,
  refresh = true,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  inset?: "safe" | "none";
  style?: StyleProp<ViewStyle>;
  refresh?: boolean;
  onRefresh?: () => Promise<unknown> | void;
}) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const top = inset === "safe" ? insets.top + space.s4 : space.s4;
  const padding = padded ? { paddingHorizontal: space.screenGutter, paddingTop: top, paddingBottom: space.s8 } : { paddingTop: top };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, padding, style]}>{children}</View>;
  // Kaydırmada güvenli alan ScrollView'un DIŞINDA: içeriğe iç boşluk olarak verilince ScrollView
  // ekranın tepesinden başlıyor ve yenileme ikonu durum çubuğu/çentik altında kalıyordu (31 Eki).
  const scrollPadding = padded
    ? { paddingHorizontal: space.screenGutter, paddingTop: space.s4, paddingBottom: space.s8 }
    : { paddingTop: space.s4 };
  const yenile = async () => {
    setRefreshing(true);
    try {
      await (onRefresh ? onRefresh() : qc.refetchQueries({ type: "active" }));
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: inset === "safe" ? insets.top : 0 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[scrollPadding, { gap: space.s5 }, style]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={() => void yenile()} tintColor={colors.inkSoft} colors={[colors.accent]} progressBackgroundColor={colors.surface} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
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
  size = "md",
  disabled,
  onPress,
  style,
  icon,
  ...props
}: { title: string; variant?: ButtonVariant; loading?: boolean; /** `sm`: satır içi ikincil eylem (44 pt), birincil eylemde kullanılmaz. */ size?: "md" | "sm"; style?: StyleProp<ViewStyle>; /** Etiketin solunda (sağlayıcı logosu, ikon); 20 pt önerilir. */ icon?: ReactNode } & Omit<PressableProps, "style" | "children">) {
  const { colors, radius, type } = useTheme();
  const cap = useContext(TextScaleCapContext);
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
          minHeight: size === "sm" ? 44 : 54,
          borderRadius: size === "sm" ? radius.control : radius.card,
          backgroundColor: bg,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: size === "sm" ? 14 : 20,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon}
          <Text maxFontSizeMultiplier={cap ?? undefined} style={[type.subhead, { textAlign: "center", flexShrink: 1 }, size === "sm" ? { color: fg } : { fontSize: 17, lineHeight: 22, color: fg }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Metin alanı */

export function TextField({
  label,
  error,
  hint,
  revealable = false,
  style,
  secureTextEntry,
  ref,
  ...props
}: {
  label: string;
  /** Klavyede "sonraki" ile alana geçiş için (React 19: ref düz prop). */
  ref?: Ref<ComponentRef<typeof TextInput>>;
  error?: string | null;
  /** Hata değil, yönlendirme (yazım önerisi gibi); alanın altında, vurgu renginde. */
  hint?: ReactNode;
  /** Şifre alanı: sağda göster/gizle düğmesi (44 pt). `secureTextEntry` ile birlikte kullanılır. */
  revealable?: boolean;
} & TextInputProps) {
  const { colors, radius, type, space } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const Eye = revealed ? EyeOff : EyeIcon;
  return (
    <View style={{ gap: space.s2 }}>
      <AppText variant="subhead">{label}</AppText>
      <View style={{ justifyContent: "center" }}>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSubtle}
        style={[
          type.body,
          // lineHeight paragraf stili iOS'ta odak dışındaki tek satırlı alanı sardırıp
          // kutunun dışına taşırıyordu (SE 375 pt, 18 Eki 2026) — alanlarda kullanılmaz.
          { lineHeight: undefined, minHeight: 52, borderRadius: radius.control, borderWidth: focused && !error ? 2 : 1, borderColor: error ? colors.danger : focused ? colors.accent : colors.line, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: focused && !error ? space.s4 - 1 : space.s4, paddingRight: revealable ? 52 : undefined },
          style,
        ]}
        secureTextEntry={secureTextEntry && !revealed}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      {revealable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? "Şifreyi gizle" : "Şifreyi göster"}
          onPress={() => setRevealed((v) => !v)}
          style={{ position: "absolute", right: 4, width: size.touchTarget, height: size.touchTarget, alignItems: "center", justifyContent: "center" }}
        >
          <Eye size={20} color={colors.inkSoft} strokeWidth={1.75} />
        </Pressable>
      ) : null}
      </View>
      {hint && !error ? (typeof hint === "string" ? <AppText variant="bodySm" tone="accentInk">{hint}</AppText> : hint) : null}
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
