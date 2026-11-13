import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Linking, Platform, View } from "react-native";
import { AppText, Button, Card, Notice, Screen, Skeleton } from "@/components/ui";
import { PREMIUM_DEGERLERI } from "@/features/billing/premium-degerleri";
import { useDashboard } from "@/features/exams/queries";
import { ucretsizPlanOzeti } from "@/features/me/plan-metni";
import { useMeFull } from "@/features/me/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Üyelik (Doc 25 Bölge 5: Premium): durum, değer anlatımı; satın alma ve geri yükleme paywall'da
 * (expo-iap), abonelik yönetimi mağazada. Fiyat burada yazılmaz (tek kaynak mağaza); ücretsiz
 * plan sayıları sunucudan (`ucretsizPlanOzeti`).
 */
export default function UyelikScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const me = useMeFull();
  const dash = useDashboard();
  const d = me.data;

  return (
    <Screen inset="none">
      {me.isPending ? (
        <Skeleton height={140} radiusKey="card" />
      ) : me.isError ? (
        <Notice tone="error">{me.error.message}</Notice>
      ) : d ? (
        <>
          <Card tone={d.isPremium ? "accent" : "surface"}>
            <AppText variant="label" tone={d.isPremium ? "accentInk" : "subtle"}>
              {d.isPremium ? "Premium" : "Ücretsiz plan"}
            </AppText>
            <AppText variant="title">{d.isPremium ? "Koçun tam kapasitede" : "Koçun kısıtlı modda"}</AppText>
            <AppText variant="bodySm" tone="soft">
              {d.isPremium ? (d.validUntil ? `${new Date(d.validUntil).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar` : "Süresiz erişim") : `${ucretsizPlanOzeti(dash.data, ", ")}.`}
            </AppText>
          </Card>
          <Card>
            <AppText variant="label" tone="subtle">
              Premium’da neler var
            </AppText>
            {PREMIUM_DEGERLERI.map(({ baslik: v }) => (
              <View key={v} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s2 }}>
                <Check color={colors.success} size={18} strokeWidth={2} />
                <AppText variant="body" style={{ flex: 1 }}>
                  {v}
                </AppText>
              </View>
            ))}
          </Card>
          {!d.isPremium ? (
            <>
              <Button title="Premium'a geç" onPress={() => router.push("/paywall")} />
              <Button title="Satın alımları geri yükle" variant="ghost" onPress={() => router.push("/paywall")} />
            </>
          ) : (
            <Button title="Aboneliği yönet" variant="secondary" onPress={() => void Linking.openURL(Platform.OS === "ios" ? "https://apps.apple.com/account/subscriptions" : "https://play.google.com/store/account/subscriptions")} />
          )}
        </>
      ) : null}
    </Screen>
  );
}
