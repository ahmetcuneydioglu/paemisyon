import { Stack } from "expo-router";
import { Info, Trophy } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { LeaderboardList, LeaderboardMyRank, LeaderboardPodium, RankSystemSheet } from "@/components/domain";
import { AppText, Chip, EmptyState, IconButton, Notice, Screen, Skeleton } from "@/components/ui";
import { useLeaderboard, type LeaderboardPeriod } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "all", label: "Genel" },
];

/**
 * Liderlik (Doc 25 "neredeyim?"; Figma PaemisyonNew › "Liderlik" 172:990, Doc 49/19, 5 Kas 2026):
 * dönem çipleri → kürsü (tek kart, 2·1·3; 1. büyük avatar + taç; lig halkası ve lig renkli rütbe
 * metni) → kalan sıralar → altta SABİT "senin sıran" kartı (sıra, rütbe · XP, puan, takip cümlesi,
 * bir üst rütbeye ilerleme). Başlık çubuğundaki bilgi düğmesi "Rütbe sistemi" alt sayfasını açar.
 * Puan = dönemdeki doğru sayısı; XP = ömür boyu rütbe puanı; rütbe kataloğu — hepsi sunucudan,
 * istemci kural bilmez.
 */
export default function LiderlikScreen() {
  const { colors, space } = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const [info, setInfo] = useState(false);
  const q = useLeaderboard(period);
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerRight: () => <IconButton icon={Info} label="Rütbe sistemi" variant="ghost" onPress={() => setInfo(true)} /> }} />
      <Screen inset="none">
        <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <Chip key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </View>
        {q.isPending ? (
          <>
            <Skeleton height={232} radiusKey="card" />
            <Skeleton height={56} radiusKey="card" />
            <Skeleton height={56} radiusKey="card" />
          </>
        ) : q.isError ? (
          <Notice tone="error" title="Liderlik yüklenemedi">
            {q.error.message}
          </Notice>
        ) : !d || d.top.length === 0 ? (
          <EmptyState icon={Trophy} title="Henüz kimse puan almadı" body="Bu dönemde ilk doğruyu sen çöz; puan = doğru sayısı." />
        ) : (
          <>
            <LeaderboardPodium rows={d.top.slice(0, 3)} />
            <LeaderboardList rows={d.top.slice(3)} />
            <AppText variant="bodySm" tone="subtle">
              {d.stats.totalUsers.toLocaleString("tr-TR")} kişi · bugün {d.stats.todayQuizCount.toLocaleString("tr-TR")} tur
              {d.stats.todaysLeader ? ` · günün lideri ${d.stats.todaysLeader}` : ""}
            </AppText>
          </>
        )}
      </Screen>
      {d ? (
        <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s2, paddingBottom: space.s3, backgroundColor: colors.bg }}>
          <LeaderboardMyRank me={d.me} ranks={d.ranks} />
        </View>
      ) : null}
      <RankSystemSheet visible={info} onClose={() => setInfo(false)} me={d?.me ?? null} ranks={d?.ranks ?? null} activeDayPoints={d?.activeDayPoints ?? null} />
    </View>
  );
}
