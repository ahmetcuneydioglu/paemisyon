import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { WeekStrip7 } from "./week-strip7";
import type { WeekDayState } from "@/features/home/queries";

/**
 * Bağlam satırı (Bugün v3 karar 1): geri sayım küçük ama görünür — Lora 600 28 "184" + " gün ·
 * PAEM 2027", sağda "bu hafta 3/5"; altında 7 dilimli ince çizelge. Kahraman değil, bağlam.
 */
export function ExamContextLine({
  daysLeft,
  examName,
  activeDays,
  goalDays,
  days,
  onPickDate,
}: {
  daysLeft: number | null;
  examName: string | null;
  activeDays: number;
  goalDays: number;
  days: WeekDayState[];
  onPickDate: () => void;
}) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
        {daysLeft != null ? (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, flex: 1 }} accessible accessibilityLabel={`${examName ?? "Sınava"} ${daysLeft} gün`}>
            <AppText variant="title" style={{ fontFamily: fontFamily.display[600], fontSize: 28, lineHeight: 34, fontVariant: ["tabular-nums"] }}>
              {daysLeft}
            </AppText>
            <AppText variant="body" tone="soft" style={{ fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
              gün{examName ? ` · ${examName}` : ""}
            </AppText>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={onPickDate} hitSlop={8} style={{ flex: 1, minHeight: 34, justifyContent: "center" }}>
            <AppText variant="body" tone="accentInk" style={{ fontSize: 15 }}>
              Sınav tarihini seç ›
            </AppText>
          </Pressable>
        )}
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          bu hafta {activeDays}/{goalDays}
        </AppText>
      </View>
      <WeekStrip7 days={days} />
    </View>
  );
}
