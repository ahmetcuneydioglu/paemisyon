import { Stack, useLocalSearchParams } from "expo-router";
import { Timer, Trophy } from "lucide-react-native";
import { View } from "react-native";
import { RankRow } from "@/components/domain";
import { AppText, Card, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { fmtClock, fmtDate, fmtDuration, fmtNet, useExamLeaderboard } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Deneme sıralaması (Doc 50 M6, Figma birebir): deneme adı + "N resmî çözüm · katılımla
 * güncellenir", "sen" paneli (yüzdelik yalnız ilk %50), isimli tablo (süre s:dd), listede yoksan
 * en altta kendi satırın; eşitlik notu en altta. Takvimli: pencere kapanınca donar.
 */
export default function SiralamaScreen() {
  const { colors, radius, space } = useTheme();
  const p = useLocalSearchParams<{ examId: string; title?: string }>();
  const q = useExamLeaderboard(p.examId ?? null);
  const d = q.data;
  const meInTop = d?.top.some((r) => r.isMe) ?? false;
  const subtitle = d?.frozenAt ? `${d.participantCount?.toLocaleString("tr-TR")} resmî çözüm · ${fmtDate(d.frozenAt, { day: "numeric", month: "short" })}'de donduruldu` : d?.available ? `${d.participantCount?.toLocaleString("tr-TR")} resmî çözüm · katılımla güncellenir` : d?.reason === "result_pending" ? "Haftalık deneme · sonuçlar pencere kapanınca" : "Serbest deneme · sıralama katılımla güncellenir";

  return (
    <>
      <Stack.Screen options={{ title: "Sıralama" }} />
      <Screen inset="none">
        {q.isPending ? (
          <Skeleton height={300} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Sıralama yüklenemedi">
            {q.error.message}
          </Notice>
        ) : (
          <>
            <View style={{ gap: 2 }}>
              <AppText variant="title" accessibilityRole="header">
                {p.title ?? "Deneme"}
              </AppText>
              <AppText variant="bodySm" tone="soft">
                {subtitle}
              </AppText>
            </View>

            {!d || !d.available ? (
              d?.reason === "min_sample" ? (
                <EmptyState icon={Trophy} title="Sıralama henüz açılmadı" body={`En az ${d.minSample ?? 10} resmî çözümle açılır; şu an ${d.participantCount ?? 0} çözüm var. Sonucun ve netin sende duruyor.`} />
              ) : (
                <EmptyState icon={Timer} title="Sonuçlar pencere kapanınca açıklanır" body={`Sıralama ${d ? fmtDate(d.endAt) : ""} herkese aynı anda açılır.`} />
              )
            ) : d.top.length === 0 ? (
              <EmptyState icon={Trophy} title="Henüz kimse katılmadı" />
            ) : (
              <>
                {d.me ? (
                  <View accessible accessibilityLabel={`Senin sıran ${d.me.rank}, ${fmtNet(d.me.score)} net`} style={{ backgroundColor: colors.panel, borderRadius: radius.card, padding: space.s4, flexDirection: "row", alignItems: "center", gap: space.s3 }}>
                    <AppText variant="stat" tone="gold" style={{ fontVariant: ["tabular-nums"] }}>
                      {d.me.rank}.
                    </AppText>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="subhead" tone="panelInk">
                        {d.me.name ?? d.me.displayName} · sen
                      </AppText>
                      <AppText variant="bodySm" tone="panelSoft" style={{ fontVariant: ["tabular-nums"] }}>
                        {fmtNet(d.me.score)} net · {d.me.wrongCount} yanlış · {fmtDuration(d.me.durationSeconds)}
                      </AppText>
                    </View>
                    {d.me.percentile && d.me.percentile <= 50 ? (
                      <AppText variant="subhead" tone="gold">
                        ilk %{d.me.percentile}
                      </AppText>
                    ) : null}
                  </View>
                ) : null}

                <Card style={{ paddingVertical: 0, paddingHorizontal: 0, gap: 0 }}>
                  <View style={{ flexDirection: "row", gap: space.s3, paddingVertical: space.s2, paddingHorizontal: space.s4, backgroundColor: colors.surfaceAlt, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}>
                    <AppText variant="label" tone="subtle" style={{ width: 40 }}>#</AppText>
                    <AppText variant="label" tone="subtle" style={{ flex: 1 }}>Ad</AppText>
                    <AppText variant="label" tone="subtle" style={{ width: 56, textAlign: "right" }}>Net</AppText>
                    <AppText variant="label" tone="subtle" style={{ width: 28, textAlign: "right" }}>Y</AppText>
                    <AppText variant="label" tone="subtle" style={{ width: 64, textAlign: "right" }}>Süre</AppText>
                  </View>
                  {d.top.map((r, i) => (
                    <View key={`${r.rank}-${r.displayName}-${i}`} style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
                      <RankRow rank={r.rank} name={r.name ?? r.displayName} score={fmtNet(r.score)} wrong={r.wrongCount} duration={fmtClock(r.durationSeconds)} me={r.isMe} highlight={r.isMe} />
                    </View>
                  ))}
                  {d.me && !meInTop ? (
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
                      <RankRow rank={d.me.rank} name={d.me.name ?? d.me.displayName} score={fmtNet(d.me.score)} wrong={d.me.wrongCount} duration={fmtClock(d.me.durationSeconds)} me highlight />
                    </View>
                  ) : null}
                </Card>
                <AppText variant="bodySm" tone="subtle">
                  Eşitlikte sıra: net, az yanlış, kısa süre, erken teslim. Dördü de eşitse sıra ortaktır (2, 2, 4).
                </AppText>
              </>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
