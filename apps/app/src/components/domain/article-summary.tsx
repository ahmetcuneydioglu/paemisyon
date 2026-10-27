import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { LayoutAnimation, Pressable, View } from "react-native";
import { AppText, Badge } from "@/components/ui";
import type { ArticleSummaryBrief } from "@/features/mevzuat/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Her özet yüzeyinde aynı uyarı (Doc 54 §4): özet resmî metin değildir. */
export function ArticleSummaryDisclaimer() {
  return (
    <AppText variant="label" tone="subtle">
      Özet; resmî metin değildir.
    </AppText>
  );
}

function Bullets({ items, warning }: { items: string[]; warning?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ gap: space.s1 }}>
      {items.map((t, i) => (
        <View key={i} style={{ flexDirection: "row", gap: space.s2 }}>
          <AppText variant="bodySm" tone="subtle" style={warning ? { color: colors.warningInk } : undefined}>
            •
          </AppText>
          <AppText variant="bodySm" tone="ink" style={[{ flex: 1 }, warning ? { color: colors.warningInk } : null]}>
            {t}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Süre/sayı satırları: etiket · değer (fıkra). Dar ekranda satır yığını; tablo yok. */
function ValueRows({ rows }: { rows: ArticleSummaryBrief["timeLimits"] }) {
  const { colors, space } = useTheme();
  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.s3, paddingVertical: space.s1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
          <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
            {r.label}
          </AppText>
          <AppText variant="subhead" tone="ink" style={{ textAlign: "right", maxWidth: "50%" }}>
            {r.value}
            {r.ref ? <AppText variant="label" tone="subtle">{` (${r.ref})`}</AppText> : null}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/**
 * Madde özeti — katlanır blok (Doc 54 §4). Resmî metnin ALTINDA durur, metnin yerine geçmez;
 * kısa özet, temel noktalar, süre/sayı satırları ve sınav hatırlatması. Mülga maddede yalnız başlık + kısa özet.
 * Okuyucuda ve madde sheet'inde aynı bileşen. Kaynak etiketi hiçbir yüzeye gelmez.
 */
export function ArticleSummaryDisclosure({ summary, initiallyOpen = false }: { summary: ArticleSummaryBrief; initiallyOpen?: boolean }) {
  const { colors, space, radius } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const rows = [...summary.timeLimits, ...summary.numericalValues];
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Madde özeti: ${summary.title}`}
        onPress={toggle}
        style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.s3, paddingVertical: space.s2 }}
      >
        <Badge tone="accent">Özet</Badge>
        {summary.repealed ? <Badge tone="neutral">Mülga</Badge> : null}
        <AppText variant="subhead" tone="ink" numberOfLines={open ? undefined : 1} style={{ flex: 1 }}>
          {summary.title}
        </AppText>
        <Chevron size={18} color={colors.inkSubtle} />
      </Pressable>
      {open ? (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: space.s3, paddingVertical: space.s3, gap: space.s3 }}>
          <AppText variant="bodySm" tone="ink">
            {summary.shortSummary}
          </AppText>
          {!summary.repealed && summary.keyPoints.length > 0 ? <Bullets items={summary.keyPoints} /> : null}
          {!summary.repealed && rows.length > 0 ? <ValueRows rows={rows} /> : null}
          {!summary.repealed && summary.examReminders.length > 0 ? (
            <View style={{ backgroundColor: colors.warningSoft, borderLeftWidth: 3, borderLeftColor: colors.warning, borderRadius: radius.control, padding: space.s3, gap: space.s1 }}>
              <AppText variant="label" style={{ color: colors.warningInk }}>
                Sınavda dikkat
              </AppText>
              <Bullets items={summary.examReminders} warning />
            </View>
          ) : null}
          <ArticleSummaryDisclaimer />
        </View>
      ) : null}
    </View>
  );
}
