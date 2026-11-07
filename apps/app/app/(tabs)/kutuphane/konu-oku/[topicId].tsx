import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, ScrollText } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Button, Card, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { useTopicRoom } from "@/features/rooms/queries";
import { useTopicUnits } from "@/features/summaries/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Konu oku — okuma seçimi (Doc 53/06, Figma 121:1545 "01 / Okuma seçimi"): ders odasından konu
 * seçilince "Ünite içerikleri" (konu anlatımı + hızlı tekrar) ile "Mevzuat metni" arasında seçim.
 * Satırlar sunucu verisine göre çizilir: ünite yoksa / mevzuat bağı yoksa o satır yoktur.
 */
export default function KonuOkuSecimScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ topicId: string; name?: string }>();
  const q = useTopicRoom(p.topicId ?? null);
  const units = useTopicUnits(p.topicId ?? null);
  const d = q.data;
  const title = d?.topic.name ?? p.name ?? "Konu";
  const law = d?.legislation?.slug ? d.legislation : null;
  const uniteSayisi = units.data?.length ?? 0;
  const yukleniyor = q.isPending || units.isPending;

  return (
    <>
      <Stack.Screen options={{ title: "Konu oku", headerBackTitle: "Geri" }} />
      <Screen inset="none">
        <View style={{ gap: space.s2 }}>
          <AppText variant="label" tone="accentInk">{(d?.topic.courseName ?? "").toLocaleUpperCase("tr-TR")}</AppText>
          <AppText variant="title">Nasıl okumak istersin?</AppText>
          <AppText tone="soft">{law ? "Konuyu öğren, kısa tekrar yap veya resmî madde metnine bak." : "Konuyu öğren ya da kısa tekrar yap."}</AppText>
        </View>
        {yukleniyor ? (
          <Skeleton height={160} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Konu yüklenemedi">
            <Button title="Tekrar dene" onPress={() => void q.refetch()} />
          </Notice>
        ) : (
          <View style={{ gap: space.s3 }}>
            {uniteSayisi > 0 ? (
              <Card style={{ paddingVertical: 0 }}>
                <ListRow
                  title="Ünite içerikleri"
                  subtitle="Konu anlatımı ve hızlı tekrar"
                  leading={<BookOpen color={colors.ink} size={20} strokeWidth={1.75} />}
                  divider={false}
                  onPress={() => router.push({ pathname: "/(tabs)/kutuphane/uniteler/[topicId]", params: { topicId: p.topicId!, name: title } })}
                />
              </Card>
            ) : null}
            {law ? (
              <Card style={{ paddingVertical: 0 }}>
                <ListRow
                  title="Mevzuat metni"
                  subtitle={`${law.name ?? "Kanun"} · Maddeleri oku`}
                  leading={<ScrollText color={colors.ink} size={20} strokeWidth={1.75} />}
                  divider={false}
                  onPress={() => router.push({ pathname: "/oku/[slug]", params: { slug: law.slug! } })}
                />
              </Card>
            ) : null}
            {uniteSayisi === 0 && !law ? <Notice title="Henüz okunacak metin yok">Bu konuda ünite içeriği ve mevzuat bağı henüz yayınlanmadı.</Notice> : null}
            {uniteSayisi > 0 ? (
              <Card tone="alt">
                <AppText variant="subhead">Tek ünite, iki okuma biçimi</AppText>
                <AppText tone="soft">İlk kez öğreniyorsan anlatımla başla. Bildiklerini hatırlamak için hızlı tekrara geç.</AppText>
              </Card>
            ) : null}
          </View>
        )}
      </Screen>
    </>
  );
}
