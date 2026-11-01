import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui";
import type { SessionReviewItem } from "@/features/quiz/api";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Cevap inceleme satırı (Doc 49/18 §8, Figma 113:800): numara rozeti (doğru yeşil, yanlış mercan,
 * boş gri), kökün ilk iki satırı ve "Senin: B · Doğru: D". Açılınca beş şık (işaretlenen ve doğru
 * vurgulu) ve açıklama. Kaynak etiketi gösterilmez (4 Eyl 2026 kuralı) — API zaten vermez.
 */
export function AnswerReviewItem({ item, open, onToggle }: { item: SessionReviewItem; open: boolean; onToggle: () => void }) {
  const { colors, radius, space } = useTheme();
  const durum = item.isCorrect === true ? "dogru" : item.isCorrect === false ? "yanlis" : "bos";
  const renk = durum === "dogru" ? colors.success : durum === "yanlis" ? colors.danger : colors.inkSubtle;
  const zemin = durum === "dogru" ? colors.successSoft : durum === "yanlis" ? colors.dangerSoft : colors.surfaceAlt;
  const dogru = item.options.find((o) => o.isCorrect);
  const secilen = item.options.find((o) => o.id === item.selectedOptionId);
  const ozet = durum === "dogru" ? `Doğru: ${dogru?.label ?? "—"}` : durum === "yanlis" ? `Senin: ${secilen?.label ?? "—"} · Doğru: ${dogru?.label ?? "—"}` : `Boş · Doğru: ${dogru?.label ?? "—"}`;
  const Ok = open ? ChevronUp : ChevronDown;
  return (
    <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: open && durum === "yanlis" ? colors.danger : colors.line, backgroundColor: colors.surface, overflow: "hidden" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Soru ${item.index}, ${durum === "dogru" ? "doğru" : durum === "yanlis" ? "yanlış" : "boş"}. ${ozet}`}
        onPress={onToggle}
        style={({ pressed }) => ({ flexDirection: "row", gap: space.s3, padding: space.s3, paddingHorizontal: 14, opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: zemin, alignItems: "center", justifyContent: "center" }}>
          <AppText variant="subhead" style={{ color: renk, fontSize: 13, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
            {item.index}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="bodySm" numberOfLines={open ? undefined : 2}>
            {item.stem}
          </AppText>
          <AppText variant="bodySm" style={{ color: renk, fontSize: 12, lineHeight: 16 }}>
            {ozet}
          </AppText>
        </View>
        <Ok color={colors.inkSubtle} size={18} strokeWidth={1.75} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: space.s2 }}>
          {item.options.map((o) => {
            const benim = o.id === item.selectedOptionId;
            const vurgu = o.isCorrect ? colors.success : benim ? colors.danger : null;
            return (
              <View
                key={o.id}
                accessible
                accessibilityLabel={`${o.label}: ${o.text}${o.isCorrect ? ", doğru cevap" : ""}${benim ? ", senin cevabın" : ""}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.s3,
                  paddingHorizontal: space.s3,
                  paddingVertical: space.s2,
                  minHeight: 40,
                  borderRadius: radius.control,
                  borderWidth: 1,
                  borderColor: vurgu ?? colors.line,
                  backgroundColor: o.isCorrect ? colors.successSoft : benim ? colors.dangerSoft : "transparent",
                }}
              >
                <AppText variant="subhead" style={{ color: vurgu ?? colors.inkSoft, fontSize: 13 }}>
                  {o.label}
                </AppText>
                <AppText variant="bodySm" style={{ flex: 1 }}>
                  {o.text}
                </AppText>
                {o.isCorrect ? <Check color={colors.success} size={16} strokeWidth={2} /> : null}
                {benim && !o.isCorrect ? (
                  <AppText variant="bodySm" style={{ color: colors.danger, fontSize: 11, lineHeight: 14 }}>
                    senin
                  </AppText>
                ) : null}
              </View>
            );
          })}
          {item.explanation || item.legalReference ? (
            <View style={{ backgroundColor: colors.bg, borderRadius: radius.control, padding: space.s3, gap: 4 }}>
              <AppText variant="label" tone="subtle">
                Açıklama
              </AppText>
              {item.explanation ? (
                <AppText variant="bodySm" tone="soft">
                  {item.explanation}
                </AppText>
              ) : null}
              {item.legalReference ? (
                <AppText variant="bodySm" tone="subtle" style={{ fontSize: 12, lineHeight: 16 }}>
                  {item.legalReference}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
