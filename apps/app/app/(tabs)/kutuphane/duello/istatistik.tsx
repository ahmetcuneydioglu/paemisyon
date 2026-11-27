import { View } from "react-native";
import { AppText, Card, Notice, Screen, Skeleton, StatTile } from "@/components/ui";
import { points, seconds1 } from "@/features/duel/clock";
import { useDuelHub } from "@/features/duel/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Düello istatistikleri (Doc 59 · Figma 41). Sayılar yalnız tamamlanmış maçlardan, sunucu
 * kayıtlarından gelir (`/me/duel` → stats). Rozetler Aşama 4'te eklenecek; o zamana kadar bölüm yok.
 */
export default function DuelloIstatistik() {
  const { space } = useTheme();
  const q = useDuelHub();
  const s = q.data?.stats;
  const grid = (title: string, items: [string, string | number | null, string?][]) => (
    <View style={{ gap: space.s3 }}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {Array.from({ length: Math.ceil(items.length / 2) }, (_, r) => items.slice(r * 2, r * 2 + 2)).map((row, i) => (
        <View key={i} style={{ flexDirection: "row", gap: space.s3 }}>
          {row.map(([label, value, unit]) => (
            <StatTile key={label} label={label} value={value} unit={unit} />
          ))}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
  return (
    <Screen inset="none">
      {q.isPending ? (
        <>
          <Skeleton height={110} radiusKey="card" />
          <Skeleton height={90} radiusKey="card" />
          <Skeleton height={90} radiusKey="card" />
        </>
      ) : q.isError || !s ? (
        <Notice tone="error" title="İstatistikler yüklenemedi">
          {q.error?.message}
        </Notice>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            {(
              [
                ["Lig puanı · 1'e 1", s.rating],
                ["Salon puanı", s.roomRating],
              ] as const
            ).map(([label, value]) => (
              <Card key={label} style={{ flex: 1, minWidth: 0, padding: space.s4, gap: 2 }}>
                <AppText variant="bodySm" tone="soft" numberOfLines={2}>
                  {label}
                </AppText>
                <AppText variant="display" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.15} style={{ fontSize: 34, lineHeight: 40 }}>
                  {points(value)}
                </AppText>
              </Card>
            ))}
          </View>
          {grid("1'e 1", [
            ["Düello", s.duels],
            ["Galibiyet", s.wins],
            ["Mağlubiyet", s.losses],
            ["Beraberlik", s.draws],
            ["Kazanma oranı", s.winRate == null ? null : `%${s.winRate}`],
            ["Mevcut seri", s.currentStreak],
            ["En uzun seri", s.bestStreak],
            ["Toplam doğru", s.correctTotal],
            ["Ortalama süre", s.avgAnswerMs == null ? null : seconds1(s.avgAnswerMs)],
          ])}
          {grid("Salon", [
            ["Salon", s.rooms],
            ["Birincilik", s.roomWins],
            ["Kazanılan XP", s.xpEarned],
          ])}
          <AppText variant="bodySm" tone="subtle">
            Sayılar yalnız tamamlanmış maçlardan, sunucu kayıtlarından gelir.
          </AppText>
        </>
      )}
    </Screen>
  );
}
