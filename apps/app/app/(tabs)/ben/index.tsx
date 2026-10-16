import { useRouter } from "expo-router";
import { Award, ChevronRight, ClipboardList, Settings, Trophy } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, ListRow, Notice, ProgressBar, Screen, Skeleton, StatTile } from "@/components/ui";
import { useDashboard } from "@/features/exams/queries";
import { useBadges, useMeFull } from "@/features/me/queries";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Profil (Doc 25 Bölge 5): kimlik kartı, plan, ölçütler, sıradaki rozet, hızlı erişim.
 * Rütbe/terfi yolu V1.5 (Doc 25); burada yok. Ölçümler me/dashboard'dan, sıfır uydurulmaz.
 */
export default function BenScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { colors, space, radius } = useTheme();
  const me = useMeFull();
  const dash = useDashboard();
  const badges = useBadges();
  const d = me.data;
  const nextBadge = badges.data?.items.find((b) => !b.earned) ?? null;
  const initial = (d?.displayName ?? d?.email ?? "?").trim().slice(0, 1).toLocaleUpperCase("tr");

  return (
    <Screen>
      <View style={{ gap: space.s1 }}>
        <AppText variant="bodySm" tone="soft">
          Hesap, üyelik, ayarlar
        </AppText>
        <AppText variant="title">Ben</AppText>
      </View>

      {me.isPending ? (
        <Skeleton height={100} radiusKey="card" />
      ) : me.isError ? (
        <Notice tone="error" title="Profil yüklenemedi">
          {me.error.message}
        </Notice>
      ) : d ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="Ayarlar" onPress={() => router.push("/(tabs)/ben/ayarlar")}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <AppText variant="heading" tone="accentInk">
                    {initial}
                  </AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="heading" numberOfLines={1}>
                    {d.displayName ?? "Adsız aday"}
                  </AppText>
                  <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                    {d.email}
                  </AppText>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", paddingTop: 2 }}>
                    {d.preferredModule ? <Badge tone="neutral">{d.preferredModule.name}</Badge> : <Badge tone="warning">Hedef sınav seçilmedi</Badge>}
                    {d.memberSince ? <Badge tone="neutral">{`Üye · ${new Date(d.memberSince).toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}`}</Badge> : null}
                  </View>
                </View>
                <ChevronRight color={colors.inkSubtle} size={20} strokeWidth={1.75} />
              </View>
            </Card>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/ben/uyelik")}>
            <Card tone={d.isPremium ? "accent" : "surface"}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText variant="label" tone={d.isPremium ? "accentInk" : "subtle"}>
                  {d.isPremium ? "Premium" : "Ücretsiz plan"}
                </AppText>
                <ChevronRight color={colors.inkSubtle} size={18} strokeWidth={1.75} />
              </View>
              <AppText variant="subhead">{d.isPremium ? (d.validUntil ? `${new Date(d.validUntil).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar` : "Süresiz erişim") : "Günde 30 soru · 1 kişisel deneme · son 7 günün yanlışları"}</AppText>
            </Card>
          </Pressable>

          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="Çözülen" value={dash.data?.stats.totalSolved ?? null} unit="soru" />
            <StatTile label="Doğruluk" value={dash.data ? (dash.data.stats.totalSolved < 10 ? null : `%${Math.round(dash.data.stats.accuracy)}`) : null} hint={dash.data && dash.data.stats.totalSolved < 10 ? "10 sorudan sonra" : undefined} />
            <StatTile label="Seri" value={dash.data?.streak.current ?? null} unit="gün" tone="success" emphasis={Boolean(dash.data?.streak.current)} />
          </View>

          {nextBadge ? (
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/ben/rozetler")}>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3 }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.control, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
                    <Award color={colors.accent} size={20} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="label" tone="subtle">
                      Sıradaki rozet
                    </AppText>
                    <AppText variant="subhead">{nextBadge.name}</AppText>
                    <AppText variant="bodySm" tone="soft">
                      {nextBadge.description}
                    </AppText>
                  </View>
                </View>
                {badges.data ? <ProgressBar value={badges.data.totalCount ? badges.data.earnedCount / badges.data.totalCount : 0} tone="success" height={4} /> : null}
              </Card>
            </Pressable>
          ) : null}

          <Card style={{ paddingVertical: 0 }}>
            <ListRow title="Rozetlerim" subtitle={badges.data ? `${badges.data.earnedCount}/${badges.data.totalCount}` : null} leading={<Award color={colors.accent} size={20} strokeWidth={1.75} />} onPress={() => router.push("/(tabs)/ben/rozetler")} />
            <ListRow title="Denemelerim" subtitle="Geçmiş sonuçlar" leading={<ClipboardList color={colors.accent} size={20} strokeWidth={1.75} />} onPress={() => router.push("/(tabs)/performans/denemelerim")} />
            <ListRow title="Liderlik" leading={<Trophy color={colors.accent} size={20} strokeWidth={1.75} />} onPress={() => router.push("/(tabs)/performans/liderlik")} />
            <ListRow title="Ayarlar" subtitle="Ad, hedef sınav, tarih, günlük hedef, görünüm" leading={<Settings color={colors.accent} size={20} strokeWidth={1.75} />} divider={false} onPress={() => router.push("/(tabs)/ben/ayarlar")} />
          </Card>

          {__DEV__ ? <Button title="Bileşen galerisi (geliştirici)" variant="secondary" onPress={() => router.push("/galeri")} /> : null}
          <Button title="Çıkış yap" variant="ghost" onPress={() => void auth.signOut()} />
        </>
      ) : null}
    </Screen>
  );
}
