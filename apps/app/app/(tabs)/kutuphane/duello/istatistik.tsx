import { Award, Lock } from "lucide-react-native";
import { Switch, View } from "react-native";
import { AppText, Card, Notice, Screen, Skeleton, StatTile } from "@/components/ui";
import { points, seconds1 } from "@/features/duel/clock";
import { useDuelActions, useDuelHub } from "@/features/duel/queries";
import { useBadges } from "@/features/me/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Düello istatistikleri (Doc 59 · Figma 41). Sayılar yalnız tamamlanmış maçlardan, sunucu
 * kayıtlarından gelir (`/me/duel` → stats). Rozetler Aşama 4'te eklenecek; o zamana kadar bölüm yok.
 */
export default function DuelloIstatistik() {
  const { colors, radius, space } = useTheme();
  const q = useDuelHub();
  const badges = useBadges();
  const act = useDuelActions();
  // Düello rozetleri genel katalogdan anahtarla süzülür; kural ve ilerleme sunucuda.
  const rozetler = (badges.data?.items ?? []).filter((b) => b.key.startsWith("duel_") || b.key === "room_champion");
  const bulunabilir = q.data?.settings?.discoverable ?? true;
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
          {rozetler.length > 0 ? (
            <View style={{ gap: space.s3 }}>
              <AppText variant="heading" accessibilityRole="header">
                Rozetler
              </AppText>
              <Card style={{ padding: 0, gap: 0 }}>
                {rozetler.map((b, i) => (
                  <View key={b.key} accessible accessibilityLabel={`${b.name}, ${b.earned ? "kazanıldı" : `kilitli, ${b.progress ?? 0} / ${b.threshold ?? 0}`}`} style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.s4, paddingVertical: space.s3, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                    <View style={{ width: 40, height: 40, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: b.earned ? colors.accentSoft : colors.surfaceAlt }}>
                      {b.earned ? <Award size={20} strokeWidth={1.75} color={colors.accentInk} /> : <Lock size={18} strokeWidth={1.75} color={colors.inkSubtle} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText variant="subhead" tone={b.earned ? "ink" : "soft"}>
                        {b.name}
                      </AppText>
                      <AppText variant="bodySm" tone="soft">
                        {b.description}
                      </AppText>
                    </View>
                    {!b.earned && b.threshold && b.threshold > 1 ? (
                      <AppText variant="bodySm" tone="subtle" maxFontSizeMultiplier={1.3} style={{ fontVariant: ["tabular-nums"] }}>
                        {b.progress ?? 0} / {b.threshold}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>
          ) : null}
          <View style={{ gap: space.s3 }}>
            <AppText variant="heading" accessibilityRole="header">
              Gizlilik
            </AppText>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: space.s3, padding: space.s4 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="subhead">Ada göre bulunabileyim</AppText>
                <AppText variant="bodySm" tone="soft">
                  {bulunabilir ? "Kendi sınavının adayları seni arayıp düelloya çağırabilir. Adın kısaltılmış görünür." : "Yalnız arkadaşların seni görür ve çağırabilir."}
                </AppText>
              </View>
              <Switch accessibilityLabel="Ada göre bulunabileyim" value={bulunabilir} disabled={act.setDiscoverable.isPending} onValueChange={(v) => act.setDiscoverable.mutate(v)} trackColor={{ true: colors.accent }} />
            </Card>
          </View>
          <AppText variant="bodySm" tone="subtle">
            Sayılar yalnız tamamlanmış maçlardan, sunucu kayıtlarından gelir.
          </AppText>
        </>
      )}
    </Screen>
  );
}
