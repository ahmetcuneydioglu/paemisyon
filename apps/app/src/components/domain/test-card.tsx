import { CheckCircle2, Lock, Play } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, ProgressBar } from "@/components/ui";
import type { TestState } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Test kartı (Doc 49/18, Figma 110:405): "Test N", durum satırı ve 4 pt çubuk. Durum sunucudan:
 * tamamlandı (yeşil tik, en iyi yüzde), devam ediyor (altın çerçeve, cevap/toplam), başlanmadı,
 * kilitli (sönük, kilit; dokunuş paywall'a gider).
 */
export function TestCard({
  number,
  state,
  questionCount,
  pct,
  answered,
  onPress,
}: {
  number: number;
  state: TestState;
  questionCount: number;
  pct: number | null;
  answered: number | null;
  onPress: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const kilitli = state === "locked";
  const durum =
    state === "done" ? `%${pct} · tamamlandı` : state === "progress" ? `${answered}/${questionCount} · devam ediyor` : state === "locked" ? "Premium" : `${questionCount} soru`;
  const Ikon = state === "done" ? CheckCircle2 : state === "progress" ? Play : state === "locked" ? Lock : null;
  const ikonRengi = state === "done" ? colors.success : state === "progress" ? colors.accentInk : colors.inkSubtle;
  const doluluk = state === "done" ? 1 : state === "progress" ? (answered ?? 0) / Math.max(1, questionCount) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Test ${number}, ${durum}`}
      accessibilityHint={kilitli ? "Premium sayfasını açar" : state === "progress" ? "Kaldığın yerden devam eder" : "Testi başlatır"}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 92,
        justifyContent: "space-between",
        gap: space.s2,
        paddingHorizontal: 14,
        paddingVertical: space.s3,
        borderRadius: radius.card,
        borderWidth: state === "progress" ? 1.5 : 1,
        borderColor: state === "progress" ? colors.accent : colors.line,
        backgroundColor: colors.surface,
        opacity: kilitli ? 0.6 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2 }}>
        <AppText variant="subhead" tone={kilitli ? "subtle" : "ink"} style={{ fontSize: 16, lineHeight: 22 }}>
          Test {number}
        </AppText>
        {Ikon ? <Ikon color={ikonRengi} size={20} strokeWidth={1.75} /> : null}
      </View>
      <AppText variant="bodySm" tone={kilitli ? "subtle" : "soft"} numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
        {durum}
      </AppText>
      <ProgressBar value={doluluk} tone={state === "done" ? "success" : "accent"} height={4} />
    </Pressable>
  );
}
