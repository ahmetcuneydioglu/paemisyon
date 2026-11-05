import { Trophy } from "lucide-react-native";
import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { LeaderboardMyRank, LeaderboardPodium, LeaderboardTable } from "@/components/domain";
import { AppText, Chip, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { useLeaderboard, type LeaderboardPeriod } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "all", label: "Genel" },
];

/** Web tablosunun geniş kırılımı: XP / Doğru / Başarı / Quiz sütunları (büyük telefon yatay, katlanır, tablet). */
const WIDE_WIDTH = 600;

/**
 * Liderlik (Doc 25 "neredeyim?"; web `leaderboard-view` ile aynı tasarım dili, 5 Kas 2026):
 * dönem çipleri → kürsü (2·1·3; 1. taçlı, nefes alan altın halo, lig rengi çerçeve; her kartta
 * lig renkli rütbe rozeti) → kalan sıralar (lig halkalı avatar, rütbe · lig, puan) → altta SABİT
 * "senin sıran" kartı (sıra, rütbe, XP/doğru/başarı, bir üst rütbeye kalan XP).
 * Puan = dönemdeki doğru sayısı; XP = ömür boyu rütbe puanı — ikisi de sunucudan gelir, istemci
 * kural bilmez. Dönem değişince parçalar yeniden kurulur ki giriş animasyonları tekrar oynasın.
 */
export default function LiderlikScreen() {
  const { colors, space } = useTheme();
  const wide = useWindowDimensions().width >= WIDE_WIDTH;
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const q = useLeaderboard(period);
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen inset="none">
        <View style={{ flexDirection: "row", gap: space.s2, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <Chip key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </View>
        {q.isPending ? (
          <>
            <Skeleton height={220} radiusKey="card" />
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
            <LeaderboardPodium key={`podyum-${period}`} rows={d.top.slice(0, 3)} />
            <LeaderboardTable key={`tablo-${period}`} rows={d.top.slice(3)} wide={wide} />
            <AppText variant="bodySm" tone="subtle">
              {d.stats.totalUsers.toLocaleString("tr-TR")} kişi · bugün {d.stats.todayQuizCount.toLocaleString("tr-TR")} tur
              {d.stats.todaysLeader ? ` · günün lideri ${d.stats.todaysLeader}` : ""}
            </AppText>
          </>
        )}
      </Screen>
      {d ? (
        <View style={{ paddingHorizontal: space.screenGutter, paddingTop: space.s2, paddingBottom: space.s3, backgroundColor: colors.bg }}>
          <LeaderboardMyRank key={`sen-${period}`} me={d.me} />
        </View>
      ) : null}
    </View>
  );
}
