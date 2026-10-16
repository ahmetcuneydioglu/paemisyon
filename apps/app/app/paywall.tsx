import { useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Badge, Button, Card, IconButton, Notice, Screen, Skeleton } from "@/components/ui";
import { PERIOD_LABEL, usePlans, type BillingPlan } from "@/features/billing/queries";
import { loadStoreProducts, onStoreEvent, restoreStorePurchases, startPurchase, storeSupported, type StoreProduct } from "@/features/billing/store";
import { useMeFull } from "@/features/me/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/theme/ThemeProvider";

const VALUE: [string, string][] = [
  ["Sınırsız soru", "Koç seni hiçbir gün durdurmaz."],
  ["Süresiz tekrar hafızası", "Yanlışların asla unutulmaz; tam akıllı tekrar motoru."],
  ["Sınırsız AI açıklaması", "“Neden bu şık değil?” İstediğin kadar sor."],
  ["Haftada 3 seri sigortası", "Vardiya dostu: nöbet gecesi serini yakmaz."],
  ["Tüm premium konular ve çıkmış sınavlar", "Müfredatın tamamı, kilitsiz."],
];

/**
 * Paywall (Doc 25 Bölge 5: Premium). Fiyat mağazadan; plan ve ürün kimliği sunucudan.
 * Elle satış bölümü mobilde yok (Apple 3.1.1 / Play). Satın alma sonucu `useStoreSync`
 * olayından gelir; sunucu doğrulamadan premium açılmaz.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, space, radius } = useTheme();
  const me = useMeFull();
  const plans = usePlans();
  const [products, setProducts] = useState<Map<string, StoreProduct> | null>(storeSupported ? null : new Map());
  const [storeError, setStoreError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);

  const skuOf = (p: BillingPlan) => (Platform.OS === "ios" ? p.storeProductIdIos : p.storeProductIdAndroid);
  const storePlans = (plans.data ?? []).filter((p) => skuOf(p));
  const picked = storePlans.find((p) => p.key === selected) ?? storePlans.find((p) => p.period === "yearly") ?? storePlans[0] ?? null;

  useEffect(() => {
    if (!plans.data || !storeSupported) return;
    loadStoreProducts(plans.data)
      .then(setProducts)
      .catch((e: Error) => {
        setProducts(new Map());
        setStoreError(e.message);
      });
  }, [plans.data]);

  useEffect(
    () =>
      onStoreEvent((e) => {
        setBusy(null);
        if (e.type === "verified" && e.outcome.outcome === "applied") {
          Alert.alert("Premium etkin 🎉", "Koçun tam kapasitede.", [{ text: "Tamam", onPress: () => router.back() }]);
        } else if (e.type === "verified") Alert.alert("Bu hesapta aktif bir premium bulunamadı.");
        else if (e.type === "pending") Alert.alert("Ödemen onay bekliyor", "Tamamlanınca premium kendiliğinden açılır.");
        else if (e.type === "error") Alert.alert("Satın alma tamamlanamadı", e.message);
      }),
    [router],
  );

  const buy = async () => {
    if (!picked || !auth.session?.user.id) return;
    setBusy("buy");
    try {
      await startPurchase(picked, auth.session.user.id);
    } catch (e) {
      setBusy(null);
      Alert.alert("Satın alma başlatılamadı", e instanceof Error ? e.message : "Yeniden dene.");
    }
  };

  const restore = async () => {
    setBusy("restore");
    try {
      const r = await restoreStorePurchases();
      if (r.applied) Alert.alert("Premium geri yüklendi 🎉", "", [{ text: "Tamam", onPress: () => router.back() }]);
      else if (r.error) Alert.alert("Geri yükleme", r.error);
      else Alert.alert(r.count === 0 ? "Bu hesapta geri yüklenecek satın alma bulunamadı." : "Bu hesapta aktif bir premium bulunamadı.");
    } catch (e) {
      Alert.alert("Geri yükleme başarısız", e instanceof Error ? e.message : "Yeniden dene.");
    } finally {
      setBusy(null);
    }
  };

  const priceOf = (p: BillingPlan) => products?.get(skuOf(p) ?? "")?.displayPrice ?? (p.price ? `${Number(p.price).toLocaleString("tr-TR", { style: "currency", currency: p.currency })}` : "—");
  const monthlyOf = (p: BillingPlan) => {
    const prod = products?.get(skuOf(p) ?? "");
    const amount = prod?.price ?? (p.price ? Number(p.price) : null);
    if (amount == null || p.period !== "yearly") return null;
    return (amount / 12).toLocaleString("tr-TR", { style: "currency", currency: prod?.currency ?? p.currency });
  };
  const isPremium = me.data?.isPremium ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + space.s2, paddingHorizontal: space.s3 }}>
        <IconButton icon={X} label="Kapat" variant="ghost" onPress={() => router.back()} />
        {storePlans.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void restore()} disabled={busy != null} hitSlop={8}>
            <AppText variant="subhead" tone="accentInk">
              {busy === "restore" ? "Yükleniyor…" : "Geri yükle"}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <Screen inset="none" style={{ paddingBottom: insets.bottom + space.s6 }}>
        <View style={{ gap: space.s2 }}>
          <Badge tone="accent">Premium</Badge>
          <AppText variant="title">Koçunun tam beynini aç</AppText>
          <AppText variant="body" tone="soft">
            Ücretsiz katman gerçek antrenman verir; Premium, seni tanıyan antrenörün tamamıdır.
          </AppText>
        </View>

        <Card style={{ gap: space.s3 }}>
          {VALUE.map(([t, s]) => (
            <View key={t} style={{ flexDirection: "row", gap: space.s3, alignItems: "flex-start" }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
                <Check color={colors.successInk} size={16} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="subhead">{t}</AppText>
                <AppText variant="bodySm" tone="soft">
                  {s}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        {isPremium ? (
          <Notice tone="success" title="Premium zaten açık">
            {me.data?.validUntil ? `${new Date(me.data.validUntil).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar geçerli.` : "Süresiz erişim."}
          </Notice>
        ) : plans.isPending || products == null ? (
          <Skeleton height={160} radiusKey="card" />
        ) : plans.isError ? (
          <Notice tone="error" title="Paketler yüklenemedi">
            {plans.error.message}
          </Notice>
        ) : storePlans.length === 0 ? (
          <Notice tone="info">Premium, hesabına tanımlıdır; aynı hesapla giriş yaptığın her yerde geçerli olur. Mağaza paketi şu an tanımlı değil.</Notice>
        ) : !storeSupported || storeError ? (
          <Notice tone="warning" title="Mağaza şu an kullanılamıyor">
            {storeError ?? (Platform.OS === "ios" ? "Cihazda App Store hesabı gerekli." : "Cihazda Google Play ve oturum açılmış bir Google hesabı gerekli.")}
          </Notice>
        ) : (
          <>
            <View style={{ gap: space.s2 }}>
              {storePlans.map((p) => {
                const on = picked?.key === p.key;
                const missing = !products.get(skuOf(p)!);
                const monthly = monthlyOf(p);
                return (
                  <Pressable key={p.key} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: missing }} disabled={missing} onPress={() => setSelected(p.key)} style={{ borderRadius: radius.card, borderWidth: on ? 2 : 1, borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accentSoft : colors.surface, padding: space.s4, gap: 6, opacity: missing ? 0.6 : 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <AppText variant="subhead" style={{ flex: 1 }}>
                        {p.name}
                      </AppText>
                      {p.period === "yearly" ? <Badge tone="accent">En avantajlı</Badge> : null}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                      <AppText variant="stat" tone={on ? "accent" : "ink"}>
                        {priceOf(p)}
                      </AppText>
                      <AppText variant="bodySm" tone="soft">
                        {PERIOD_LABEL[p.period]}
                      </AppText>
                    </View>
                    <AppText variant="bodySm" tone="soft">
                      {missing ? "Bu paket mağazada bulunamadı." : p.period === "lifetime" ? "Tek ödeme; ömür boyu premium." : monthly ? `Ayda ${monthly} ödemeye denk gelir.` : "Yılda bir yenilenir."}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <Button title={picked ? (picked.period === "lifetime" ? "Ömürlük Premium al" : `${picked.name} başlat`) : "Paket seç"} disabled={!picked || !products.get(skuOf(picked)!)} loading={busy === "buy"} onPress={() => void buy()} />
            <AppText variant="bodySm" tone="subtle">
              {Platform.OS === "ios"
                ? "Yıllık abonelik, dönem bitiminden en az 24 saat önce iptal edilmedikçe App Store hesabından otomatik yenilenir. Aboneliği App Store › Abonelikler bölümünden istediğin an iptal edebilirsin. Ömürlük paket tek seferlik ödemedir, yenilenmez."
                : "Yıllık abonelik, dönem sonunda iptal edilmedikçe Google Play hesabından otomatik yenilenir. Aboneliği Google Play › Ödemeler ve abonelikler › Abonelikler bölümünden istediğin an iptal edebilirsin. Ömürlük paket tek seferlik ödemedir, yenilenmez."}
            </AppText>
          </>
        )}

        <View style={{ flexDirection: "row", gap: space.s4, justifyContent: "center", flexWrap: "wrap" }}>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://paemisyon.com/kosullar")} hitSlop={8}>
            <AppText variant="bodySm" tone="accentInk">
              Kullanım Koşulları
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://paemisyon.com/gizlilik")} hitSlop={8}>
            <AppText variant="bodySm" tone="accentInk">
              Gizlilik Politikası
            </AppText>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}
