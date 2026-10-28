import { useRouter } from "expo-router";
import { Flame, Map, Trophy } from "lucide-react-native";
import { View } from "react-native";
import { AppText, Badge, Card, ListRow, Notice, ProgressBar, Screen, SectionHeader, Skeleton, StatTile } from "@/components/ui";
import { useMyAttempts } from "@/features/exams/queries";
import { useActivity, useProgressSummary, useTopicProgress } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Performans ana (Doc 25 Bölge 4): tek bakışta durum — seri, doğruluk, çözülen; 12 hafta ısı
 * şeridi; deneme net eğrisi; en zayıf 3 konu. Rakam konuşur, sıfat susar; ölçüm yoksa "henüz
 * yeterli veri yok" (Doc 24 §4). Yorum cümleleri F8.
 */
export default function PerformansScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const summary = useProgressSummary();
  const topics = useTopicProgress();
  const activity = useActivity(84);
  const attempts = useMyAttempts();

  const s = summary.data;
  const weakest = (topics.data ?? []).filter((t) => t.solvedCount >= 5).slice(0, 3);
  const days = activity.data ?? [];
  const activeDays = days.filter((d) => d.questionsAnswered > 0).length;
  const maxDay = Math.max(1, ...days.map((d) => d.questionsAnswered));
  const nets = (attempts.data ?? []).filter((a) => a.status === "completed" && a.score != null).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt)).slice(-8);
  const maxNet = Math.max(1, ...nets.map((n) => n.score ?? 0));

  return (
    <Screen inset="none">
      {summary.isPending ? (
        <Skeleton height={120} radiusKey="card" />
      ) : summary.isError ? (
        <Notice tone="error" title="Özet yüklenemedi">
          {summary.error.message}
        </Notice>
      ) : s ? (
        <>
          <View style={{ flexDirection: "row", gap: space.s3 }}>
            <StatTile label="Seri" value={s.currentStreak} unit="gün" hint={s.longestStreak > s.currentStreak ? `En uzun ${s.longestStreak}` : "Rekor seri"} tone="success" emphasis={s.currentStreak > 0} />
            <StatTile label="Doğruluk" value={s.totalSolved < 10 ? null : `%${Math.round(s.accuracy)}`} hint={s.totalSolved < 10 ? "10 sorudan sonra" : undefined} progress={s.totalSolved < 10 ? undefined : s.accuracy / 100} />
            <StatTile label="Çözülen" value={s.totalSolved} unit="soru" hint={`${s.totalSessions} tur`} />
          </View>
        </>
      ) : null}

      {/* 12 haftalık ısı şeridi: 84 gün, 7 satır × 12 sütun; yoğunluk güne göre. */}
      <View style={{ gap: space.s2 }}>
        <SectionHeader title={`Son 12 hafta${days.length ? ` · ${activeDays}/${days.length} aktif gün` : ""}`} />
        {activity.isPending ? (
          <Skeleton height={120} radiusKey="card" />
        ) : days.length === 0 || activeDays === 0 ? (
          <Card>
            <AppText variant="subhead">Henüz aktif gün yok</AppText>
            <AppText variant="bodySm" tone="soft">
              İlk turdan sonra her çalıştığın gün burada koyulaşır.
            </AppText>
          </Card>
        ) : (
          <Card>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => (
                <View key={w} style={{ flex: 1, gap: 4 }}>
                  {days.slice(w * 7, w * 7 + 7).map((d) => {
                    const r = d.questionsAnswered / maxDay;
                    const bg = d.questionsAnswered === 0 ? colors.surfaceAlt : r < 0.34 ? colors.accentSoft : r < 0.67 ? colors.accentInk : colors.accent;
                    return <View key={d.date} accessibilityLabel={`${d.date}: ${d.questionsAnswered} soru`} style={{ height: 12, borderRadius: 3, backgroundColor: bg }} />;
                  })}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Flame color={colors.success} size={14} strokeWidth={1.75} />
              <AppText variant="bodySm" tone="soft">
                En yoğun gün {maxDay} soru · {activeDays} aktif gün
              </AppText>
            </View>
          </Card>
        )}
      </View>

      {/* Deneme net eğrisi: son 8 tamamlanmış canlı deneme. */}
      <View style={{ gap: space.s2 }}>
        <SectionHeader title="Deneme netlerim" action={nets.length ? "Tümü" : undefined} onAction={() => router.push("/(tabs)/ben/denemelerim")} />
        {attempts.isPending ? (
          <Skeleton height={120} radiusKey="card" />
        ) : nets.length === 0 ? (
          <Card>
            <AppText variant="subhead">Henüz tamamlanmış deneme yok</AppText>
            <AppText variant="bodySm" tone="soft">
              Canlı denemeye katıl ya da kişisel deneme kur; net çizgin burada başlar.
            </AppText>
          </Card>
        ) : (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 96 }}>
              {nets.map((n) => (
                <View key={n.attemptId} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <AppText variant="bodySm" tone="soft" style={{ fontSize: 11, lineHeight: 14, fontVariant: ["tabular-nums"] }}>
                    {(n.score ?? 0).toFixed(1)}
                  </AppText>
                  <View style={{ width: "100%", height: Math.max(6, ((n.score ?? 0) / maxNet) * 64), borderRadius: 4, backgroundColor: colors.accent }} />
                </View>
              ))}
            </View>
            <AppText variant="bodySm" tone="soft">
              {nets.length > 1 ? `Son deneme ${(nets[nets.length - 1]!.score ?? 0).toFixed(2)} net · ilk deneme ${(nets[0]!.score ?? 0).toFixed(2)}` : `Tek deneme: ${(nets[0]!.score ?? 0).toFixed(2)} net`}
            </AppText>
          </Card>
        )}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionHeader title="En zayıf konular" action="Konu haritası" onAction={() => router.push("/(tabs)/ben/konu-haritasi")} />
        {topics.isPending ? (
          <Skeleton height={160} radiusKey="card" />
        ) : weakest.length === 0 ? (
          <Card>
            <AppText variant="subhead">Henüz yeterli veri yok</AppText>
            <AppText variant="bodySm" tone="soft">
              Bir konuda en az 5 soru çözünce zayıflık ölçülür; sıfır yazmıyoruz.
            </AppText>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 0 }}>
            {weakest.map((t, i) => (
              <ListRow
                key={t.topicId}
                title={t.topicName}
                subtitle={`${t.courseName} · ${t.correctCount}/${t.solvedCount} doğru`}
                divider={i < weakest.length - 1}
                chevron={false}
                trailing={
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Badge tone={t.mastery < 40 ? "danger" : t.mastery < 60 ? "warning" : "success"}>{`%${t.mastery}`}</Badge>
                    <ProgressBar value={t.mastery / 100} tone={t.mastery < 40 ? "danger" : t.mastery < 60 ? "warning" : "accent"} height={4} style={{ width: 56 }} />
                  </View>
                }
                onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })}
              />
            ))}
          </Card>
        )}
      </View>

      <Card style={{ paddingVertical: 0 }}>
        <ListRow title="Liderlik" subtitle="Bugün, bu hafta, bu ay, genel" leading={<Trophy color={colors.accent} size={20} strokeWidth={1.75} />} onPress={() => router.push("/(tabs)/ben/liderlik")} />
        <ListRow title="Konu haritası" subtitle="Ders filtresi ve yalnız zayıflar" leading={<Map color={colors.accent} size={20} strokeWidth={1.75} />} divider={false} onPress={() => router.push("/(tabs)/ben/konu-haritasi")} />
      </Card>
      <View style={{ height: radius.card }} />
    </Screen>
  );
}
