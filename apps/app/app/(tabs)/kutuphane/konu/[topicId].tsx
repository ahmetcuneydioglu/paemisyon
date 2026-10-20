import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Bookmark, XCircle } from "lucide-react-native";
import { View } from "react-native";
import { CoachLine, RoomStatPanel } from "@/components/domain";
import { ActionBar, AppText, Badge, Button, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { useTopicRoom } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Konu odası (Doc 49/14): kompakt durum → koç cümlesi → "Bu konuda" (yanlışlar, favoriler,
 * ilgili maddeler) → "Başla · <konu>'dan 10 soru" + ikincil "Yanlışları çöz".
 * Bilgi kartları ve tur geçmişi karar/veri bekliyor — burada yok.
 */
export default function KonuOdasiScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ topicId: string; name?: string }>();
  const q = useTopicRoom(p.topicId ?? null);
  const d = q.data;
  const title = d?.topic.name ?? p.name ?? "Konu";

  const start = (n = 10) => router.push({ pathname: "/seans", params: { source: "topic_room", count: String(n), focusKind: "topic", topicId: p.topicId, courseId: "", recipe: "" } });
  const yanlislar = () => router.push({ pathname: "/seans", params: { mode: "review", source: "topic_room", count: String(Math.min(20, d?.wrongCount ?? 10)), focusKind: "topic", topicId: p.topicId, courseId: "", recipe: "" } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title }} />
      <Screen inset="none" style={{ paddingBottom: 140 }}>
        {q.isPending ? (
          <>
            <Skeleton height={100} radiusKey="card" />
            <Skeleton height={200} radiusKey="card" />
          </>
        ) : q.isError ? (
          <Notice tone="error" title="Konu yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <RoomStatPanel
              label={d.topic.courseName}
              pct={d.summary.accuracyPct}
              sub={d.summary.solved > 0 ? `${d.summary.solved} soru · ${d.summary.correct} doğru` : "10 soruyla başla"}
              right={d.summary.inPlanThisWeek ? <Badge tone="accent">Planında bu hafta</Badge> : null}
            />
            <CoachLine text={d.coach} />

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Bu konuda" />
              <ListRow title="Yanlışların" subtitle={d.wrongCount > 0 ? `${d.wrongCount} soru` : "Açık yanlış yok"} leading={<Ikon icon={XCircle} />} onPress={d.wrongCount > 0 ? yanlislar : undefined} />
              <ListRow title="Favorilerin" subtitle={d.favoriteCount > 0 ? `${d.favoriteCount} soru` : "Henüz favori yok"} leading={<Ikon icon={Bookmark} />} onPress={d.favoriteCount > 0 ? () => router.push("/(tabs)/kutuphane/tekrar") : undefined} divider={d.legislation != null} />
              {d.legislation ? (
                <ListRow
                  title="İlgili maddeler"
                  subtitle={[d.legislation.name, d.legislation.articleRange ?? (d.legislation.articleCount ? `${d.legislation.articleCount} madde` : null)].filter(Boolean).join(" ")}
                  leading={<Ikon icon={BookOpen} />}
                  onPress={d.legislation.slug ? () => router.push({ pathname: "/(tabs)/kutuphane/atlas/[topicId]", params: { topicId: d.topic.id, name: d.topic.name, lawSlug: d.legislation!.slug! } }) : undefined}
                  divider={false}
                />
              ) : null}
            </View>
            {d.summary.planRemainingMinutes != null ? (
              <AppText variant="bodySm" tone="subtle">
                Bu hafta planında {d.summary.planRemainingMinutes} dk kaldı.
              </AppText>
            ) : null}
          </>
        ) : null}
      </Screen>
      {d ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <ActionBar title={`Başla · 10 soru · ${d.topic.name}`} onPress={() => start(10)} secondary={d.wrongCount > 0 ? <Button title={`Yanlışları çöz · ${Math.min(20, d.wrongCount)}`} variant="secondary" onPress={yanlislar} /> : undefined} />
        </View>
      ) : null}
    </View>
  );
}

function Ikon({ icon: Icon }: { icon: typeof XCircle }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ width: 36, height: 36, borderRadius: radius.control, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
      <Icon color={colors.inkSoft} size={18} strokeWidth={1.75} />
    </View>
  );
}
