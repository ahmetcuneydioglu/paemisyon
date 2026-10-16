import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Linking, Platform, View } from "react-native";
import { AppText, Badge, Button, Card, Notice, Screen, Skeleton } from "@/components/ui";
import { useMeFull } from "@/features/me/queries";
import { useTheme } from "@/theme/ThemeProvider";

const VALUE = ["Sınırsız soru ve tur", "Süresiz tekrar hafızası (ücretsizde son 7 gün)", "Sınırsız AI açıklaması", "Tüm premium konular ve çıkmış sınavlar", "Kişisel denemede 120 soruya kadar"];

/**
 * Üyelik (Doc 25 Bölge 5: Premium). F4'te yalnız durum ve değer anlatımı; satın alma, geri
 * yükleme ve mağaza bağlantısı F5 (expo-iap) ile gelir. Fiyat burada yazılmaz (tek kaynak mağaza).
 */
export default function UyelikScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const me = useMeFull();
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
            <Badge tone={d.isPremium ? "accent" : "neutral"}>{d.isPremium ? "Premium" : "Ücretsiz plan"}</Badge>
            <AppText variant="title">{d.isPremium ? "Koçun tam kapasitede" : "Koçun kısıtlı modda"}</AppText>
            <AppText variant="bodySm" tone="soft">
              {d.isPremium ? (d.validUntil ? `${new Date(d.validUntil).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar` : "Süresiz erişim") : "Günde 30 soru, 1 kişisel deneme, son 7 günün yanlışları."}
            </AppText>
          </Card>
          <Card>
            <AppText variant="label" tone="subtle">
              Premium’da neler var
            </AppText>
            {VALUE.map((v) => (
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
