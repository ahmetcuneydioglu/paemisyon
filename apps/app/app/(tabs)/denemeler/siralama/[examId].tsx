import { Stack, useLocalSearchParams } from "expo-router";
import { Trophy } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Card, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { fmtDate, mmss, useExamLeaderboard, type ExamLeaderboardRow } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Deneme sıralaması (Doc 25: "Türkiye geneli gerçeklik testi"). Pencere kapanmadan açılmaz. */
export default function SiralamaScreen() {
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ examId: string; title?: string }>();
  const q = useExamLeaderboard(p.examId ?? null);
  const d = q.data;

  return (
    <>
      <Stack.Screen options={{ title: p.title ?? "Sıralama" }} />
      <Screen inset="none">
        {q.isPending ? (
          <Skeleton height={300} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Sıralama yüklenemedi">
            {q.error.message}
          </Notice>
        ) : !d || !d.available ? (
          <EmptyState icon={Trophy} title="Sıralama henüz açılmadı" body={`Sınav penceresi ${d ? fmtDate(d.endAt) : ""} kapanınca sıralama açılır.`} />
        ) : d.top.length === 0 ? (
          <EmptyState icon={Trophy} title="Henüz kimse katılmadı" />
        ) : (
          <>
            <AppText variant="bodySm" tone="soft">
              {d.participantCount} katılımcı · net = doğru − yanlış/4
            </AppText>
            {d.me && !d.top.some((r) => r.isMe) ? (
              <Card tone="accent">
                <Row r={d.me} />
              </Card>
            ) : null}
            <Card style={{ paddingVertical: 0 }}>
              {d.top.map((r, i) => (
                <View key={`${r.rank}-${r.displayName}`} style={{ borderBottomWidth: i < d.top.length - 1 ? 0.5 : 0, borderBottomColor: colors.line, backgroundColor: r.isMe ? colors.accentSoft : "transparent", marginHorizontal: -space.s5, paddingHorizontal: space.s5 }}>
                  <Row r={r} />
                </View>
              ))}
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}

function Row({ r }: { r: ExamLeaderboardRow }) {
  const { space } = useTheme();
  const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, minHeight: 52 }}>
      <AppText variant="subhead" style={{ width: 44, fontVariant: ["tabular-nums"] }}>
        {medal}
      </AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="subhead" numberOfLines={1}>
          {r.isMe ? "Sen" : r.displayName}
        </AppText>
        <AppText variant="bodySm" tone="soft">
          D {r.correctCount} · Y {r.wrongCount} · B {r.blankCount}
          {r.durationSeconds != null ? ` · ${mmss(r.durationSeconds)}` : ""}
        </AppText>
      </View>
      <AppText variant="stat" tone={r.isMe ? "accent" : "ink"}>
        {r.score.toFixed(2)}
      </AppText>
    </View>
  );
}
