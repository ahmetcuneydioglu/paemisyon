import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, Notice, ProgressBar, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { useTopicAtlas } from "@/features/catalog/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Madde Atlası (Doc 25 Bölge 2): kanun konusunun madde haritası — fethedildi / kısmi / boş.
 * Dokunuş maddenin sorularıyla tur başlatır (`articleNo`). "En çok çıkan maddeler" soru
 * sayısına göre; sayılar sunucudan, ısı çubuğu orana göre.
 */
export default function AtlasScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const p = useLocalSearchParams<{ topicId: string; name?: string; lawSlug?: string }>();
  const q = useTopicAtlas(p.topicId ?? null);

  const startArticle = (no: string, count: number) =>
    router.push({ pathname: "/seans", params: { mode: "practice", count: String(Math.min(10, Math.max(1, count))), focusKind: "topic", topicId: p.topicId, articleNo: no, courseId: "", recipe: "" } });

  const top = q.data ? [...q.data.articles].sort((a, b) => b.questionCount - a.questionCount).slice(0, 8) : [];
  const max = top[0]?.questionCount ?? 1;

  return (
    <>
      <Stack.Screen options={{ title: p.name ?? "Madde Atlası" }} />
      <Screen inset="none">
        {q.isPending ? (
          <Skeleton height={200} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Atlas yüklenemedi">
            {q.error.message}
          </Notice>
        ) : q.data.articles.length === 0 ? (
          <Card>
            <AppText variant="subhead">Etiketli madde henüz yok</AppText>
            <AppText variant="bodySm" tone="soft">
              Bu konunun soruları maddeye bağlandıkça harita burada oluşur.
            </AppText>
          </Card>
        ) : (
          <>
            <View style={{ gap: space.s1 }}>
              <AppText variant="label" tone="accentInk">
                Fetih haritan
              </AppText>
              <AppText variant="title">
                {q.data.conqueredCount}/{q.data.articles.length} madde temiz
              </AppText>
              <ProgressBar value={q.data.conqueredCount / q.data.articles.length} tone="success" height={5} />
              <AppText variant="bodySm" tone="soft">
                Temiz: maddenin tüm soruları en az bir kez doğru. Dokun, maddeden tur başlat.
              </AppText>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
              {q.data.articles.map((a) => {
                const state = a.conquered ? "done" : a.clearedCount > 0 ? "partial" : "empty";
                const bg = state === "done" ? colors.successSoft : state === "partial" ? colors.accentSoft : colors.surface;
                const fg = state === "done" ? colors.successInk : state === "partial" ? colors.accentInk : colors.ink;
                return (
                  <Pressable
                    key={a.no}
                    accessibilityRole="button"
                    accessibilityLabel={`Madde ${a.no}, ${a.clearedCount} / ${a.questionCount} temiz`}
                    onPress={() => startArticle(a.no, a.questionCount)}
                    style={({ pressed }) => ({ minWidth: 64, minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.control, backgroundColor: bg, borderWidth: 1, borderColor: state === "empty" ? colors.line : "transparent", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}
                  >
                    <AppText variant="subhead" style={{ color: fg }}>
                      m.{a.no}
                    </AppText>
                    <AppText variant="bodySm" style={{ color: fg, fontSize: 12, lineHeight: 16 }}>
                      {a.clearedCount}/{a.questionCount}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="En çok soru çıkan maddeler" />
              <Card style={{ gap: space.s3 }}>
                {top.map((a) => (
                  <Pressable key={a.no} accessibilityRole="button" onPress={() => startArticle(a.no, a.questionCount)} style={({ pressed }) => ({ gap: 6, opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <AppText variant="subhead">Madde {a.no}</AppText>
                      <AppText variant="subhead" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                        {a.questionCount} soru
                      </AppText>
                    </View>
                    <ProgressBar value={a.questionCount / max} tone={a.conquered ? "success" : "accent"} height={6} />
                  </Pressable>
                ))}
              </Card>
            </View>

            {p.lawSlug ? <Button title="Kanun metnini oku" variant="secondary" onPress={() => router.push({ pathname: "/oku/[slug]", params: { slug: p.lawSlug! } })} /> : null}
          </>
        )}
      </Screen>
    </>
  );
}
