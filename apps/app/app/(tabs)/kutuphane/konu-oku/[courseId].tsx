import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Scale } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Button, Card, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { topicHasReading, topicReadingNote, useCourseRoom } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Konu oku — okuma seçimi (Doc 53/06, Figma 121:1545 "01 / Okuma seçimi"; kullanıcı kararı 7 Kas 2026: ders
 * odasındaki Konu oku kutusu doğrudan bu ekranı açar, ara sheet yok). Ders düzeyinde: ünite içeriği olan konular
 * (konu anlatımı + hızlı tekrar) ve dersin mevzuat metinleri. Satırlar sunucu verisine göre çizilir.
 */
export default function KonuOkuSecimScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ courseId: string; name?: string }>();
  const q = useCourseRoom(p.courseId ?? null);
  const d = q.data;
  const konular = (d?.topics ?? []).flatMap((t) => [t, ...t.children]).filter(topicHasReading);
  const mevzuat = d?.tools.legislation ?? [];
  const bos = !q.isPending && !q.isError && konular.length === 0 && mevzuat.length === 0;

  return (
    <>
      <Stack.Screen options={{ title: "Konu oku", headerBackTitle: "Geri" }} />
      <Screen inset="none">
        <View style={{ gap: space.s2 }}>
          <AppText variant="label" tone="accentInk">{(d?.course.name ?? p.name ?? "").toLocaleUpperCase("tr-TR")}</AppText>
          <AppText variant="title">Nasıl okumak istersin?</AppText>
          <AppText tone="soft">{mevzuat.length > 0 ? "Konuyu öğren, kısa tekrar yap veya resmî madde metnine bak." : "Konuyu öğren ya da kısa tekrar yap."}</AppText>
        </View>
        {q.isPending ? (
          <Skeleton height={200} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Ders yüklenemedi">
            <Button title="Tekrar dene" onPress={() => void q.refetch()} />
          </Notice>
        ) : (
          <>
            {konular.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <AppText variant="label" tone="subtle">Ünite içerikleri</AppText>
                {konular.map((t) => (
                  <Card key={t.id} style={{ paddingVertical: 0 }}>
                    <ListRow
                      title={t.name}
                      subtitle={`${t.units.count > 0 ? "Konu anlatımı ve hızlı tekrar" : "Konu anlatımı"} · ${topicReadingNote(t)}`}
                      leading={<BookOpen color={colors.ink} size={20} strokeWidth={1.75} />}
                      trailing={t.locked ? <AppText variant="label">Premium</AppText> : undefined}
                      divider={false}
                      onPress={() => router.push({ pathname: "/(tabs)/kutuphane/uniteler/[topicId]", params: { topicId: t.id, name: t.name } })}
                    />
                  </Card>
                ))}
              </View>
            ) : null}
            {mevzuat.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <AppText variant="label" tone="subtle">Mevzuat metni</AppText>
                {mevzuat.map((l) => (
                  <Card key={l.slug} style={{ paddingVertical: 0 }}>
                    <ListRow
                      title={l.name}
                      subtitle={`${l.articleCount} madde · Maddeleri oku`}
                      leading={<Scale color={colors.ink} size={20} strokeWidth={1.75} />}
                      divider={false}
                      onPress={() => router.push({ pathname: "/oku/[slug]", params: { slug: l.slug } })}
                    />
                  </Card>
                ))}
              </View>
            ) : null}
            {bos ? <Notice title="Henüz okunacak metin yok">Bu derste ünite içeriği ve mevzuat metni henüz yayınlanmadı.</Notice> : null}
            {konular.length > 0 ? (
              <Card tone="alt">
                <AppText variant="subhead">Tek ünite, iki okuma biçimi</AppText>
                <AppText tone="soft">İlk kez öğreniyorsan anlatımla başla. Bildiklerini hatırlamak için hızlı tekrara geç.</AppText>
              </Card>
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}
