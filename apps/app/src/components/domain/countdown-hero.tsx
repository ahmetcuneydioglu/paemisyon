import { Pressable, View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/ui";
import { COMPACT_WIDTH, fontFamily } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Geri sayım afişi (Doc 49/13 §2 — "Büyük sayı"): lacivert panel, dev Lora rakam, altında
 * sınav adı + tarih, sağda haftanın aktif gün sayısı. Tarih yoksa sayı uydurulmaz: sakin
 * cümle ve hedef tarihi seçme bağlantısı. Panel iki temada da koyudur (token `panel`).
 */
export function CountdownHero({
  examName,
  examDateLabel,
  daysLeft,
  activeDays,
  goalDays,
  onPickDate,
}: {
  examName: string | null;
  /** "12 Haziran" gibi; tarih yoksa null. */
  examDateLabel: string | null;
  daysLeft: number | null;
  activeDays: number;
  goalDays: number;
  onPickDate?: () => void;
}) {
  const { colors, radius, space, type } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_WIDTH;
  const heroSize = compact ? 96 : type.hero.fontSize;
  // Lora'nın üst çıkıntıları: satır yüksekliği boyun altına inerse rakamın tepesi kırpılır.
  const heroLine = Math.round(heroSize * 1.04);
  return (
    <View
      accessible
      accessibilityLabel={daysLeft == null ? "Hedef sınav tarihi seçilmedi" : `${examName ?? "Hedef sınava"} ${daysLeft} gün kaldı. Bu hafta ${activeDays} / ${goalDays} gün`}
      style={{ backgroundColor: colors.panel, borderRadius: radius.panel, paddingHorizontal: space.s4, paddingTop: space.s2, paddingBottom: space.s4, gap: space.s1 }}
    >
      {daysLeft == null ? (
        <View style={{ paddingVertical: space.s3, gap: space.s2 }}>
          <AppText variant="brand" tone="panelInk" style={{ fontFamily: fontFamily.display[400], fontSize: 28, lineHeight: 34 }}>
            Tarih bekleniyor
          </AppText>
          <AppText variant="bodySm" tone="panelSoft">
            {examName ? `${examName} için hedef tarihini seç; geri sayım ve plan ona göre kurulur.` : "Hedef sınavını ve tarihini seç; geri sayım buradan başlar."}
          </AppText>
          {onPickDate ? (
            <Pressable accessibilityRole="button" onPress={onPickDate} hitSlop={8} style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}>
              <AppText variant="subhead" tone="gold">
                Hedef tarihini seç ›
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <AppText variant="hero" tone="gold" style={{ fontSize: heroSize, lineHeight: heroLine }} maxFontSizeMultiplier={1}>
            {daysLeft > 999 ? "999+" : String(daysLeft)}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.s3 }}>
            <AppText variant="subhead" tone="panelInk" style={{ flex: 1 }} numberOfLines={1}>
              {examName ? `${examName}'ye` : "Hedef sınava"}
              {examDateLabel ? ` · ${examDateLabel}` : ""}
            </AppText>
            <AppText variant="bodySm" tone="panelSoft">
              {activeDays}/{goalDays} gün
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}
