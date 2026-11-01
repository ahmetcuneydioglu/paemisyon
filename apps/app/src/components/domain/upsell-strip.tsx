import { Crown } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Button } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Premium şeridi (Doc 49/18): kilitli içeriğin TEK satış noktası — kilitli kartların her biri
 * ayrı satış alanı olmaz. Altın tonlu zemin, taç, iki satır ve kısa eylem.
 */
export function UpsellStrip({ title, body, cta = "Aç", onPress }: { title: string; body: string; cta?: string; onPress: () => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s3,
        paddingLeft: space.s4,
        paddingRight: space.s3,
        paddingVertical: space.s3,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: colors.accentSoft,
      }}
    >
      <Crown color={colors.accentInk} size={24} strokeWidth={1.75} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subhead">{title}</AppText>
        <AppText variant="bodySm" tone="soft">
          {body}
        </AppText>
      </View>
      <Button title={cta} size="sm" onPress={onPress} accessibilityLabel={`${title}. ${cta}`} />
    </View>
  );
}
