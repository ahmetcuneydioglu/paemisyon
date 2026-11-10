import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { useLargeText } from "@/theme/text-scale";
import { WeekStrip7 } from "./week-strip7";
import type { WeekDayState } from "@/features/home/queries";

/**
 * Bağlam satırı (Bugün v3 karar 1): geri sayım küçük ama görünür — Lora 600 28 "184" + " gün ·
 * PAEM 2027", sağda "bu hafta 3/5"; altında 7 dilimli ince çizelge. Kahraman değil, bağlam.
 * Büyük yazıda (`useLargeText`) "bu hafta" geri sayımın ALTINA iner; yan yana sıkışıp üst üste
 * binmez, sınav adı kesilmez.
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
  const large = useLargeText();
  return (
    <View style={{ gap: space.s2 }}>
      <View style={large ? { gap: space.s1 } : { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
        {daysLeft != null ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: 4, flex: large ? undefined : 1, minWidth: 0 }} accessible accessibilityLabel={`${examName ?? "Sınava"} ${daysLeft} gün`}>
            <AppText variant="title" style={{ fontFamily: fontFamily.display[600], fontSize: 28, lineHeight: 34, fontVariant: ["tabular-nums"] }}>
              {daysLeft}
            </AppText>
            <AppText variant="body" tone="soft" style={{ fontSize: 15, lineHeight: 20, flexShrink: 1 }} numberOfLines={large ? undefined : 1}>
              gün{examName ? ` · ${examName}` : ""}
            </AppText>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={onPickDate} hitSlop={8} style={{ flex: large ? undefined : 1, minHeight: 44, justifyContent: "center" }}>
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
