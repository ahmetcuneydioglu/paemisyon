import { View } from "react-native";
import { AppText, Button } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * "Kaldığın yer" şeridi (Çalış v2, Doc 49/17): sol altın çizgi, kapsam + ilerleme, tek "Devam et".
 * Yalnız sunucu taze bir yarım tur döndürdüğünde çizilir (Bugün'deki "devam et" ile aynı tur).
 */
export function ResumeStrip({ scopeName, detail, onPress }: { scopeName: string; detail: string; onPress: () => void }) {
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
        borderRadius: radius.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label" tone="subtle">
          Kaldığın yer
        </AppText>
        <AppText variant="subhead" numberOfLines={1}>
          {scopeName}
        </AppText>
        <AppText variant="bodySm" tone="soft" numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>
          {detail}
        </AppText>
      </View>
      <Button title="Devam et" size="sm" onPress={onPress} accessibilityLabel={`${scopeName} turuna devam et, ${detail}`} />
    </View>
  );
}
