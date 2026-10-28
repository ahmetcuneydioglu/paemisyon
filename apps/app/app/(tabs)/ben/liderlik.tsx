import { Trophy } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AppText, Card, Chip, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { useLeaderboard, type LeaderboardPeriod, type LeaderboardRow } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "all", label: "Genel" },
];

/** Liderlik (Doc 25: "neredeyim?"). Puan = dönemdeki doğru sayısı; podyum 2-1-3; benim sıram ve fark. */
export default function LiderlikScreen() {
  const { colors, space, radius } = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const q = useLeaderboard(period);
  const d = q.data;
  const podium = d ? [d.top[1], d.top[0], d.top[2]] : [];
  const rest = d ? d.top.slice(3) : [];

  return (
    <Screen inset="none">
      <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
        ))}
      </View>
      {q.isPending ? (
        <Skeleton height={320} radiusKey="card" />
      ) : q.isError ? (
        <Notice tone="error" title="Liderlik yüklenemedi">
          {q.error.message}
        </Notice>
      ) : !d || d.top.length === 0 ? (
        <EmptyState icon={Trophy} title="Henüz kimse puan almadı" body="Bu dönemde ilk doğruyu sen çöz; puan = doğru sayısı." />
      ) : (
        <>
          <Card tone={d.me.rank > 0 ? "accent" : "surface"}>
            {d.me.rank > 0 ? (
              <>
                <AppText variant="label" tone="accentInk">
                  Senin sıran
                </AppText>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.s2 }}>
                  <AppText variant="display" tone="accent">
                    #{d.me.rank}
                  </AppText>
                  <AppText variant="heading">{d.me.points} puan</AppText>
                </View>
                <AppText variant="bodySm" tone="soft">
                  {d.me.rank === 1 ? "Zirvedesin." : d.me.pointsToNext != null && d.me.nextName ? `${d.me.nextName} önünde · fark ${d.me.pointsToNext} doğru` : `${d.me.rankName} · seviye ${d.me.level}`}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="subhead">Henüz puanın yok</AppText>
                <AppText variant="bodySm" tone="soft">
                  Bu dönemde çözdüğün her doğru bir puan; ilk turla listeye girersin.
                </AppText>
              </>
            )}
          </Card>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.s2 }}>
            {podium.map((r, i) =>
              r ? (
                <View key={r.rank} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: r.isMe ? colors.accent : colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
                    <AppText variant="subhead" style={{ color: r.isMe ? colors.onAccent : colors.ink }}>
                      {r.displayName.slice(0, 1).toLocaleUpperCase("tr")}
                    </AppText>
                  </View>
                  <AppText variant="subhead" numberOfLines={1}>
                    {r.isMe ? "Sen" : r.displayName}
                  </AppText>
                  <View style={{ width: "100%", height: i === 1 ? 72 : i === 0 ? 52 : 40, borderRadius: radius.control, backgroundColor: i === 1 ? colors.accentSoft : colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <AppText variant="heading">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</AppText>
                    <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                      {r.points} p
                    </AppText>
                  </View>
                </View>
              ) : (
                <View key={`empty-${i}`} style={{ flex: 1 }} />
              ),
            )}
          </View>

          {rest.length > 0 ? (
            <Card style={{ paddingVertical: 0 }}>
              {rest.map((r, i) => (
                <Row key={r.rank} r={r} last={i === rest.length - 1} />
              ))}
            </Card>
          ) : null}
          <AppText variant="bodySm" tone="subtle">
            {d.stats.totalUsers} kişi · bugün {d.stats.todayQuizCount} tur{d.stats.todaysLeader ? ` · günün lideri ${d.stats.todaysLeader}` : ""}
          </AppText>
        </>
      )}
    </Screen>
  );
}

function Row({ r, last }: { r: LeaderboardRow; last: boolean }) {
  const { colors, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, minHeight: 52, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: colors.line }}>
      <AppText variant="subhead" tone="soft" style={{ width: 36, fontVariant: ["tabular-nums"] }}>
        #{r.rank}
      </AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="subhead" numberOfLines={1} tone={r.isMe ? "accentInk" : "ink"}>
          {r.isMe ? "Sen" : r.displayName}
        </AppText>
        <AppText variant="bodySm" tone="soft">
          {r.rankName} · %{Math.round(r.accuracy)} doğruluk
        </AppText>
      </View>
      <AppText variant="stat" tone={r.isMe ? "accent" : "ink"}>
        {r.points}
      </AppText>
    </View>
  );
}
