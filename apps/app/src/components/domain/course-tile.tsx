import { Pressable, View } from "react-native";
import { AppText, Badge, ProgressBar } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { CourseIcon } from "./course-icon";

export type CourseState = "normal" | "weak" | "sparse";

/**
 * Hazırlık satırı (Doc 48 §3 ③): ders ikonu (veriden), ad, doğruluk ve durum. "Zayıf" rozeti
 * metinle; renk tek başına anlam taşımaz. Doğruluk yoksa "—" ve "az veri".
 */
export function CourseTile({
  name,
  icon,
  accuracy,
  solved,
  state,
  onPress,
}: {
  name: string;
  icon: string | null;
  accuracy: number | null;
  solved: number;
  state: CourseState;
  onPress?: () => void;
}) {
  const { colors, space, radius } = useTheme();
  const pct = accuracy == null ? null : Math.round(accuracy * 100);
  const tone = state === "weak" ? "danger" : pct != null && pct < 60 ? "warning" : "accent";
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${name}, ${pct == null ? "yeterli veri yok" : `yüzde ${pct} doğru`}${state === "weak" ? ", zayıf" : ""}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: radius.control, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
        <CourseIcon name={icon} color={colors.ink} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
          <AppText variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
            {name}
          </AppText>
          {state === "weak" ? <Badge tone="danger">Zayıf</Badge> : null}
          <AppText variant="subhead" tone={pct == null ? "subtle" : state === "weak" ? "danger" : "soft"} style={{ fontVariant: ["tabular-nums"] }}>
            {pct == null ? "—" : `%${pct}`}
          </AppText>
        </View>
        {pct == null ? (
          <AppText variant="bodySm" tone="subtle">
            {solved === 0 ? "Henüz çözülmedi" : `${solved} soru · az veri`}
          </AppText>
        ) : (
          <ProgressBar value={pct / 100} tone={tone} height={4} label={`${name} doğruluk`} />
        )}
      </View>
    </Pressable>
  );
}
