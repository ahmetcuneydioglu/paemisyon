import { Check } from "lucide-react-native";
import { View } from "react-native";
import { AppText } from "@/components/ui";
import type { WeekDayState } from "@/features/home/queries";
import { useTheme } from "@/theme/ThemeProvider";

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/**
 * 7 günlük nöbet çizelgesi (Doc 49/13 §2): Pzt→Paz tek satır. Aktif gün ✓ (surfaceAlt),
 * bugün altın kutu (nokta; görev bitince ✓), kaçan ve gelecek günler boş kutu.
 * Durumlar sunucudan (`gamification.weekly.days`); istemci hesap yapmaz.
 */
export function WeekStrip7({ days }: { days: WeekDayState[] }) {
  const { colors, radius, space } = useTheme();
  const done = days.filter((d) => d === "done").length;
  return (
    <View accessible accessibilityLabel={`Nöbet çizelgesi: bu hafta ${done} aktif gün`} style={{ flexDirection: "row", gap: space.s2 }}>
      {GUNLER.map((ad, i) => {
        const d = days[i] ?? "future";
        const today = d === "today";
        const isDone = d === "done";
        return (
          <View key={ad} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <AppText variant="label" tone={today ? "accentInk" : "subtle"} style={{ textTransform: "none", letterSpacing: 0 }}>
              {ad}
            </AppText>
            <View
              style={{
                alignSelf: "stretch",
                height: 44,
                borderRadius: radius.control,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDone ? colors.surfaceAlt : today ? colors.accent : colors.surface,
                borderWidth: today || isDone ? 0 : 1,
                borderColor: colors.line,
              }}
            >
              {isDone ? <Check color={colors.ink} size={18} strokeWidth={2.25} /> : today ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onAccent }} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
