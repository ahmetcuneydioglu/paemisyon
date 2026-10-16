import * as Haptics from "expo-haptics";
import { Check, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Badge } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/** Soru kökü: numara/toplam, konu rozeti, metin 16/25 (Doc 49 §1.2 body). Kaynak etiketi GÖSTERİLMEZ. */
export function QuestionStem({ index, total, topic, stem }: { index: number; total: number; topic?: string | null; stem: string }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <AppText variant="label" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
          Soru {index}/{total}
        </AppText>
        {topic ? <Badge tone="neutral">{topic}</Badge> : null}
      </View>
      <AppText variant="body" accessibilityRole="header">
        {stem}
      </AppText>
    </View>
  );
}

export type OptionState = "default" | "selected" | "correct" | "incorrect" | "missed" | "disabled";

/**
 * Şık satırı. Yedi durum (Doc 49 §2.3): cevapsız/seçili/kontrol edilmiş (doğru, yanlış,
 * kaçırılan doğru)/pasif. Doğru-yanlış rengi animasyonsuz ve anında (Doc 26 §3.4); ikon eşlik
 * eder, renk tek başına değil. Şık sayısı sabit kodlanmaz; etiket sunucudan gelir.
 */
export function QuestionOption({ label, text, state = "default", onPress }: { label: string; text: string; state?: OptionState; onPress?: () => void }) {
  const { colors, radius, space } = useTheme();
  const palette = {
    default: { bg: colors.surface, border: colors.line, badgeBg: colors.surfaceAlt, badgeFg: colors.inkSoft, fg: colors.ink },
    selected: { bg: colors.accentSoft, border: colors.accent, badgeBg: colors.accent, badgeFg: colors.onAccent, fg: colors.ink },
    correct: { bg: colors.successSoft, border: colors.success, badgeBg: colors.success, badgeFg: colors.onAccent, fg: colors.ink },
    incorrect: { bg: colors.dangerSoft, border: colors.danger, badgeBg: colors.danger, badgeFg: colors.onAccent, fg: colors.ink },
    missed: { bg: colors.surface, border: colors.success, badgeBg: colors.surfaceAlt, badgeFg: colors.successInk, fg: colors.ink },
    disabled: { bg: colors.surface, border: colors.line, badgeBg: colors.surfaceAlt, badgeFg: colors.inkSubtle, fg: colors.inkSubtle },
  }[state];
  const interactive = state === "default" || state === "selected";
  const trailing = state === "correct" || state === "missed" ? <Check color={colors.success} size={20} strokeWidth={2.25} /> : state === "incorrect" ? <X color={colors.danger} size={20} strokeWidth={2.25} /> : null;
  const a11y = state === "correct" ? "doğru cevap" : state === "incorrect" ? "yanlış işaretlendi" : state === "missed" ? "doğru cevap buydu" : state === "selected" ? "seçili" : "";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} şıkkı, ${text}${a11y ? `, ${a11y}` : ""}`}
      accessibilityState={{ selected: state === "selected", disabled: !interactive }}
      disabled={!interactive || !onPress}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        paddingHorizontal: space.s4,
        paddingVertical: space.s3,
        borderRadius: radius.card,
        backgroundColor: palette.bg,
        borderWidth: state === "default" || state === "disabled" ? StyleSheet.hairlineWidth : 1.5,
        borderColor: palette.border,
        opacity: pressed && interactive ? 0.85 : 1,
      })}
    >
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: palette.badgeBg, alignItems: "center", justifyContent: "center" }}>
        <AppText variant="subhead" style={{ color: palette.badgeFg }}>
          {label}
        </AppText>
      </View>
      <AppText variant="body" style={{ flex: 1, color: palette.fg, fontSize: 15, lineHeight: 21 }}>
        {text}
      </AppText>
      {trailing}
    </Pressable>
  );
}
