import { View, type StyleProp, type ViewStyle } from "react-native";
import { COMPACT_TEXT_SCALE } from "@/theme/text-scale";
import { useTheme } from "@/theme/ThemeProvider";
import { ProgressBar, type ProgressTone } from "./progress";
import { AppText } from "./temel";

/**
 * İstatistik kutusu: etiket, büyük değer (tabular), birim, isteğe bağlı ilerleme.
 * Değer yoksa "—" ve açıklama; rakam uydurulmaz (Doc 24 §4).
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  progress,
  tone = "accent",
  emphasis = false,
  style,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  hint?: string;
  progress?: number;
  tone?: ProgressTone;
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, space } = useTheme();
  const valueTone = value == null ? "subtle" : tone === "danger" ? "danger" : tone === "warning" ? "accentInk" : emphasis ? "accent" : "ink";
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: space.s4, gap: 6, minWidth: 0 }, style]}>
      {/* Etiket büyük yazıda 1,3× ile sınırlı: üç kutuda "SERİ" iri, "DOĞRULUK" küçülmüş kalıyordu (Faz 6).
          Tek sözcüklü etiket dar kutuda ("DOĞRULUK", SE'de üç kutu) ortadan kırılıyordu: tek satır, sığmazsa %85'e kadar küçülür. */}
      <AppText variant="label" tone="subtle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={COMPACT_TEXT_SCALE}>
        {label}
      </AppText>
      {/* Sayı Türkçe binlik ayırıcıyla ("2.234"). Sığmazsa önce birim alt satıra iner (rakam boyu
          yan kutularla aynı kalır); rakam tek başına da sığmıyorsa tek satırda küçülür. */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: 6 }}>
        <AppText variant="stat" tone={valueTone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ maxWidth: "100%" }}>
          {typeof value === "number" ? value.toLocaleString("tr-TR") : (value ?? "—")}
        </AppText>
        {unit ? (
          <AppText variant="bodySm" tone="soft">
            {unit}
          </AppText>
        ) : null}
      </View>
      {progress != null ? <ProgressBar value={progress} tone={tone} height={4} /> : null}
      {hint ? (
        <AppText variant="bodySm" tone="subtle" numberOfLines={3}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
