import * as Haptics from "expo-haptics";
import { Check, X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge } from "@/components/ui";
import { fontFamily } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Soru kökü (Doc 49/15 Figma): editoryal — kart yok, zemin üstünde Lora 400 20/28.
 * `counter` kapalıysa "Soru N/M" satırı gösterilmez (Seans başlık bloğu zaten sayar).
 * `scale` yazı boyu tercihi (0,9 / 1 / 1,15). Kaynak etiketi GÖSTERİLMEZ.
 */
export function QuestionStem({ index, total, topic, stem, counter = true, scale = 1 }: { index: number; total: number; topic?: string | null; stem: string; counter?: boolean; scale?: number }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s3 }}>
      {counter || topic ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          {counter ? (
            <AppText variant="label" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
              Soru {index}/{total}
            </AppText>
          ) : null}
          {topic ? <Badge tone="neutral">{topic}</Badge> : null}
        </View>
      ) : null}
      <AppText variant="heading" accessibilityRole="header" style={{ fontFamily: fontFamily.display[400], fontSize: Math.round(20 * scale), lineHeight: Math.round(28 * scale) }}>
        {stem}
      </AppText>
    </View>
  );
}

export type OptionState = "default" | "selected" | "correct" | "incorrect" | "missed" | "disabled";

/**
 * Şık satırı (Figma Seans/ŞıkSatırı, 6 durum): 56 pt, surface + 1 px line, radius 10; solda
 * 28 pt daire. Seçili: altın 1,5 px kenar + accentSoft. Doğru: successSoft, dairede ✓;
 * yanlış: dangerSoft, dairede ✕; kaçırılan doğru = doğru görünümü; pasif: sönük metin.
 * Renk tek başına anlam taşımaz, ikon eşlik eder (Doc 26 §3.4). Şık sayısı sabit değil.
 */
export function QuestionOption({ label, text, state = "default", onPress, scale = 1 }: { label: string; text: string; state?: OptionState; onPress?: () => void; scale?: number }) {
  const { colors, radius, space } = useTheme();
  const palette = {
    default: { bg: colors.surface, border: colors.line, badgeBg: colors.surfaceAlt, badgeFg: colors.inkSoft, fg: colors.ink },
    selected: { bg: colors.accentSoft, border: colors.accent, badgeBg: colors.accentSoft, badgeFg: colors.accentInk, fg: colors.ink },
    correct: { bg: colors.successSoft, border: colors.success, badgeBg: colors.success, badgeFg: colors.onAccent, fg: colors.ink },
    incorrect: { bg: colors.dangerSoft, border: colors.danger, badgeBg: colors.danger, badgeFg: colors.onAccent, fg: colors.ink },
    missed: { bg: colors.successSoft, border: colors.success, badgeBg: colors.success, badgeFg: colors.onAccent, fg: colors.ink },
    disabled: { bg: colors.surface, border: colors.line, badgeBg: colors.surfaceAlt, badgeFg: colors.inkSubtle, fg: colors.inkSubtle },
  }[state];
  const interactive = state === "default" || state === "selected";
  const glyph = state === "correct" || state === "missed" ? <Check color={palette.badgeFg} size={16} strokeWidth={2.5} /> : state === "incorrect" ? <X color={palette.badgeFg} size={16} strokeWidth={2.5} /> : null;
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
        backgroundColor: pressed && interactive ? colors.surfaceAlt : palette.bg,
        borderWidth: state === "default" || state === "disabled" ? 1 : 1.5,
        borderColor: palette.border,
      })}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: palette.badgeBg, alignItems: "center", justifyContent: "center" }}>
        {glyph ?? (
          <AppText variant="subhead" style={{ color: palette.badgeFg, fontSize: 14, lineHeight: 18 }}>
            {label}
          </AppText>
        )}
      </View>
      <AppText variant="body" style={{ flex: 1, color: palette.fg, fontSize: Math.round(16 * scale), lineHeight: Math.round(24 * scale) }}>
        {text}
      </AppText>
    </Pressable>
  );
}
