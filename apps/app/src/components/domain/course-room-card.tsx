import { Pressable, View } from "react-native";
import { AppText, ProgressBar } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders odası kartı (Çalış, Figma 68:878): 2 sütun, surface, köşe 10, iç 14; ad, iki küçük satır
 * ("Ağırlık %30" / "Hâkimiyet %62" — Doc 49/16 §8 not 3: tek satır kırılıyordu) ve 2 pt ilerleme.
 */
export function CourseRoomCard({
  name,
  weightPercent,
  accuracy,
  onPress,
}: {
  name: string;
  weightPercent: number | null;
  /** 0..1; ölçüm yoksa null → "henüz ölçülmedi". */
  accuracy: number | null;
  onPress: () => void;
}) {
  const { colors, radius, space } = useTheme();
  const pct = accuracy == null ? null : Math.round(accuracy * 100);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${weightPercent != null ? `, ağırlık yüzde ${weightPercent}` : ""}${pct != null ? `, hâkimiyet yüzde ${pct}` : ", henüz ölçülmedi"}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 92,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.line,
        padding: 14,
        gap: space.s1,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <AppText variant="subhead" numberOfLines={2}>
        {name}
      </AppText>
      <View style={{ flex: 1, justifyContent: "flex-end", gap: 6 }}>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          {weightPercent != null ? `Ağırlık %${weightPercent}` : "Ağırlık —"}
        </AppText>
        <AppText variant="bodySm" tone={pct == null ? "subtle" : "soft"} style={{ fontVariant: ["tabular-nums"] }}>
          {pct != null ? `Hâkimiyet %${pct}` : "Henüz ölçülmedi"}
        </AppText>
        <ProgressBar value={accuracy ?? 0} tone={pct == null ? "accent" : pct >= 75 ? "success" : pct >= 50 ? "accent" : "danger"} height={2} />
      </View>
    </Pressable>
  );
}
