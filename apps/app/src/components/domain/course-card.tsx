import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText, ProgressBar } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders kartı (Çalış, Figma 240:1104 "Ders kartı"): ad üstte; altta "Hâkimiyet" etiketi ve mavi
 * yüzde, 4 pt çubuk, tek künye (sunucu seçer: "238 yanlış", "Sınav ağırlığı %30"…). Hâkimiyet
 * ölçüm durumudur, başarı/hata rengi taşımaz (`info`). Ölçüm yoksa "Henüz ölçülmedi", yüzde yok.
 * Satırdaki kartlar eşit boy; içerik kırpılmaz, ad sarar.
 *
 * Öne çıkan varyant (`eyebrow` verilince; Çalış'ta en üstte tam genişlik): üstte altın ön etiket,
 * 3 pt sol altın çizgi ve belirgin altın kenar ("Kaldığın yer" şeridinin dili). Zemin boyanmaz:
 * koyu temada amber karışımı çamurlu kalıyor, fark çizgi + etiketle (renge bağlı olmayan ipucu).
 */
export function CourseCard({
  name,
  accuracyPct,
  note,
  eyebrow,
  onPress,
  style,
}: {
  name: string;
  /** 0..100; ölçülmemişse null. */
  accuracyPct: number | null;
  note: string;
  /** Öne çıkan ders ön etiketi; verilirse kart öne çıkan varyantta çizilir. */
  eyebrow?: string | null;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const olculdu = accuracyPct != null;
  const oneCikan = Boolean(eyebrow);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${oneCikan ? `${eyebrow}: ` : ""}${name}, ${olculdu ? `hâkimiyet yüzde ${accuracyPct}` : "henüz ölçülmedi"}, ${note}`}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 44,
          justifyContent: "space-between",
          gap: space.s2,
          padding: 14,
          borderRadius: radius.card,
          borderWidth: 1,
          // Öne çıkan: kenar altının %60'ı (koyu zeminde ~4:1), sol çizgi tam altın.
          borderColor: oneCikan ? `${colors.accent}99` : colors.line,
          borderLeftWidth: oneCikan ? 3 : 1,
          borderLeftColor: oneCikan ? colors.accent : colors.line,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        },
        style,
      ]}
    >
      <View style={{ gap: 2 }}>
        {oneCikan ? (
          <AppText variant="label" tone="accentInk">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="subhead" style={{ fontSize: 16, lineHeight: 22 }}>
          {name}
        </AppText>
      </View>
      <View style={{ paddingTop: space.s2, gap: space.s2 }}>
        <View style={{ gap: space.s2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2, minHeight: 22 }}>
            <AppText variant="bodySm" tone="soft" style={{ fontSize: 12, lineHeight: 18, flexShrink: 1 }}>
              {olculdu ? "Hâkimiyet" : "Henüz ölçülmedi"}
            </AppText>
            {olculdu ? (
              <AppText variant="subhead" tone="info" style={{ fontSize: 16, lineHeight: 22, fontVariant: ["tabular-nums"] }}>
                %{accuracyPct}
              </AppText>
            ) : null}
          </View>
          <ProgressBar value={(accuracyPct ?? 0) / 100} tone="info" height={4} />
        </View>
        <AppText variant="bodySm" tone="soft" style={{ fontSize: 12, lineHeight: 18, fontVariant: ["tabular-nums"] }}>
          {note}
        </AppText>
      </View>
    </Pressable>
  );
}
