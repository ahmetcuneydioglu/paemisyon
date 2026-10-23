import { Check } from "lucide-react-native";
import { forwardRef, type ComponentRef } from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SHARE_CARD_HEIGHT, SHARE_CARD_SCALE, SHARE_CARD_WIDTH, type ShareCardData } from "@/features/quiz/share";
import { fontFamily, palette } from "@/theme/tokens";

/**
 * Paylaşım kartı (Figma "Paylaşım kartı · Soru" 49:2233 / "· Cevaplı" 49:2290; 1080×1350).
 * TEMADAN BAĞIMSIZ: alıcının ekranında marka varlığıdır — zemin `panel` laciverti, kart
 * kağıt (`bg` açık), altın yalnız marka sözcüğü. Renkler açık paletten sabitlenir; yakalama
 * ölçeği 3 (360×450 mantıksal). Figma'dan sapmalar (Doc 49/15 §5f): "Doğru" etiketi
 * `successInk`; uzun soruda sıkışık mod; kök ≤5, şık ≤2 satır; taşan kart içinde kırpılır.
 */
const L = palette.light;
const K = {
  panel: L.panel,
  panelInk: L.panelInk,
  panelSoft: L.panelSoft,
  paper: L.bg,
  surface: L.surface,
  surfaceAlt: L.surfaceAlt,
  line: L.line,
  ink: L.ink,
  inkSoft: L.inkSoft,
  accent: L.accent,
  accentSoft: L.accentSoft,
  accentInk: L.accentInk,
  success: L.success,
  successSoft: L.successSoft,
  successInk: L.successInk,
};
const W = SHARE_CARD_WIDTH / SHARE_CARD_SCALE; // 360
const H = SHARE_CARD_HEIGHT / SHARE_CARD_SCALE; // 450

export const ShareQuestionCard = forwardRef<ComponentRef<typeof View>, { data: ShareCardData }>(function ShareQuestionCard({ data }, ref) {
  const answer = data.answer;
  // 4:5 sabit tuvalde uzun kök + beş iki satırlık şık sığmalı (GYSROTA kuralı).
  const dense = data.stem.length > 180 || data.options.some((o) => o.text.length > 70);
  const stemSize = dense ? 12.67 : 14.67;
  const stemLh = dense ? 16.67 : 19.33;
  const optSize = dense ? 8.67 : 10;
  const optLh = dense ? 11.33 : 13;
  const rowMinH = dense ? 28 : 32;

  return (
    <View ref={ref} collapsable={false} style={{ width: W, height: H, backgroundColor: K.panel, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, gap: 8 }}>
      {/* Üst şerit: brand + alan adı */}
      <View style={{ height: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <CardText size={14} weight={600} family="display" color={K.accent}>
          paemisyon
        </CardText>
        <CardText size={9} weight={500} color={K.panelSoft}>
          paemisyon.com
        </CardText>
      </View>

      {/* Kağıt kart */}
      <View style={{ flex: 1, backgroundColor: K.paper, borderRadius: 10, borderWidth: 0.33, borderColor: K.line, padding: 16, gap: 8, overflow: "hidden" }}>
        {/* Filigran: kağıt üstünde silik marka sözcüğü; %5 mürekkep, okunurluğu etkilemez (kullanıcı isteği, 23 Eki). */}
        <View pointerEvents="none" style={{ position: "absolute", left: -10, right: -10, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Text allowFontScaling={false} style={{ fontFamily: fontFamily.display[600], fontSize: 92, lineHeight: 110, color: K.ink, opacity: 0.05, letterSpacing: -2, transform: [{ rotate: "-18deg" }] }}>
            paemisyon
          </Text>
        </View>
        {data.difficultyLabel || data.articleLabel ? (
          <View style={{ flexDirection: "row", gap: 5 }}>
            {data.difficultyLabel ? (
              <Hap bg={K.surfaceAlt} color={K.inkSoft} text={data.difficultyLabel.toLocaleUpperCase("tr-TR")} />
            ) : null}
            {data.articleLabel ? <Hap bg={K.accentSoft} color={K.accentInk} text={data.articleLabel} /> : null}
          </View>
        ) : null}
        <CardText size={stemSize} weight={500} family="display" color={K.ink} style={{ lineHeight: stemLh, letterSpacing: -0.15 }} numberOfLines={5}>
          {data.stem}
        </CardText>
        <View style={{ flex: 1, overflow: "hidden" }}>
          {data.options.map((o, i) => {
            const correct = answer?.correctLabel != null && o.label === answer.correctLabel;
            const last = i === data.options.length - 1;
            return (
              <View
                key={o.label}
                style={{
                  minHeight: rowMinH,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: correct ? 8 : 0,
                  paddingVertical: dense ? 3 : 4,
                  backgroundColor: correct ? K.successSoft : "transparent",
                  borderLeftWidth: correct ? 2 : 0,
                  borderLeftColor: K.success,
                  borderBottomWidth: last ? 0 : 0.33,
                  borderBottomColor: K.line,
                }}
              >
                <View style={{ width: 16, height: 16, borderRadius: 3, alignItems: "center", justifyContent: "center", backgroundColor: correct ? K.success : K.surfaceAlt }}>
                  {correct ? (
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <CardText size={9} weight={600} color={K.ink}>
                      {o.label}
                    </CardText>
                  )}
                </View>
                <CardText size={optSize} weight={400} color={K.ink} style={{ flex: 1, lineHeight: optLh }} numberOfLines={2}>
                  {o.text}
                </CardText>
                {correct ? (
                  <CardText size={8.67} weight={600} color={K.successInk}>
                    Doğru
                  </CardText>
                ) : null}
              </View>
            );
          })}
        </View>
        {answer?.explanation || answer?.basis ? (
          <View style={{ gap: 3, paddingTop: 6, borderTopWidth: 0.33, borderTopColor: K.line }}>
            {answer.explanation ? (
              <CardText size={8.67} weight={400} color={K.inkSoft} style={{ lineHeight: 12 }} numberOfLines={3}>
                {answer.explanation}
              </CardText>
            ) : null}
            {answer.basis ? (
              <CardText size={8.67} weight={600} color={K.accentInk} numberOfLines={1}>
                {answer.basis}
              </CardText>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Alt şerit: çağrı + QR */}
      <View style={{ height: 54, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <CardText size={12} weight={600} family="display" color={K.panelInk}>
            Bu soruyu sen de çöz
          </CardText>
          <CardText size={8.67} weight={400} color={K.panelSoft} numberOfLines={1}>
            Kaynağa dayalı açıklama ve madde metniyle.
          </CardText>
          {/* Platform satırı (kullanıcı kararı, 23 Eki): uygulama iki mağazada da var. */}
          <CardText size={8.67} weight={600} color={K.panelInk} numberOfLines={1}>
            {"App Store ve Google Play'de · paemisyon.com"}
          </CardText>
        </View>
        <View style={{ width: 54, height: 54, padding: 5, borderRadius: 8, backgroundColor: K.surface }}>
          <QRCode value={data.url} size={44} color={K.panel} backgroundColor={K.surface} ecl="M" />
        </View>
      </View>
    </View>
  );
});

function Hap({ bg, color, text }: { bg: string; color: string; text: string }) {
  return (
    <View style={{ height: 14, paddingHorizontal: 6, borderRadius: 7, backgroundColor: bg, justifyContent: "center" }}>
      <CardText size={8} weight={600} color={color} style={{ letterSpacing: 0.3 }}>
        {text}
      </CardText>
    </View>
  );
}

function CardText({
  size,
  weight,
  family = "body",
  color,
  style,
  numberOfLines,
  children,
}: {
  size: number;
  weight: 400 | 500 | 600;
  family?: "display" | "body";
  color: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: string;
}) {
  const ff = family === "display" ? fontFamily.display[weight] : fontFamily.body[weight];
  return (
    // Dynamic Type karta girmez (sabit tuval); Android includeFontPadding kartı uzatıyordu.
    <Text allowFontScaling={false} numberOfLines={numberOfLines} style={[{ fontSize: size, lineHeight: Math.round(size * 1.3), fontFamily: ff, color, includeFontPadding: false }, style]}>
      {children}
    </Text>
  );
}
