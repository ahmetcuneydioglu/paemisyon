import { View } from "react-native";
import { AppText, WeekDots, type DayState } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { useLargeText } from "@/theme/text-scale";
import { ekle } from "@/lib/tr-ek";

/**
 * Durum satırı (Yerleşim B üstü): sınava kalan gün büyük rakam (display), haftalık aktif
 * gün noktaları. Tarih yoksa "—" ve "tarih bekleniyor" (sayı uydurulmaz). Büyük yazıda
 * (`useLargeText`) noktalar ve "Bu hafta" sayının altına iner; sağdan taşmaz.
 */
export function CountdownHeader({
  examName,
  daysLeft,
  activeDays,
  targetDays = 5,
  todayIndex,
}: {
  examName: string | null;
  daysLeft: number | null;
  activeDays: number;
  targetDays?: number;
  /** 0..6; haftanın bugünkü günü (TR 04.00 sınırıyla sunucu verir). */
  todayIndex: number;
}) {
  const { space } = useTheme();
  const large = useLargeText();
  const days: DayState[] = Array.from({ length: 7 }, (_, i) => (i < activeDays ? "done" : i === todayIndex ? "today" : "empty"));
  return (
    <View style={large ? { gap: space.s3 } : { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.s4 }}>
      <View style={{ gap: 2, flexShrink: 1 }}>
        <AppText variant="label" tone="subtle">
          {examName ? ekle(examName, "e") : "Hedef sınava"}
        </AppText>
        {daysLeft == null ? (
          // Tarih yoksa büyük rakamın yerine sakin bir cümle; dev bir "—" çizgisi değil.
          <AppText variant="title" tone="subtle">
            Tarih bekleniyor
          </AppText>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <AppText variant="display" tone="accent">
              {daysLeft}
            </AppText>
            <AppText variant="heading">gün</AppText>
          </View>
        )}
      </View>
      <View style={{ alignItems: large ? "flex-start" : "flex-end", gap: 8, paddingBottom: large ? 0 : 6 }}>
        <WeekDots days={days} />
        <AppText variant="bodySm" tone="soft">
          Bu hafta {activeDays}/{targetDays} gün
        </AppText>
      </View>
    </View>
  );
}
