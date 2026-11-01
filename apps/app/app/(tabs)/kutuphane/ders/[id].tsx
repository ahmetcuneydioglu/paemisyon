import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, ChevronRight, Lock, Play, RotateCcw, Star } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { CoachLine, ReadingSheet, RoomStatPanel, SolveChoiceSheet, TopicActionSheet } from "@/components/domain";
import { ActionTile, AppText, Badge, Card, Notice, ProgressBar, Screen, SectionHeader, Skeleton, useSheetAction } from "@/components/ui";
import { bandBarTone, bandTone, useCourseRoom, type RoomTopic } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

type Konu = Omit<RoomTopic, "children">;

/**
 * Ders odası (Doc 49/14 → Çalış v2, Doc 49/17; Figma 105:151): durum paneli → koç satırı →
 * 2×2 eylem (Soru çöz · Konu oku · Yanlışlarım · Favorilerim) → konular. Konuya dokunmak aynı
 * dört eylemi konuya daraltan sayfayı açar. Sayılar, eşikler ve cümleler sunucudan.
 */
export default function DersOdasiScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ id: string; name?: string }>();
  const q = useCourseRoom(p.id ?? null);
  const d = q.data;
  const title = d?.course.name ?? p.name ?? "Ders";
  const konuSayfasi = useSheetAction();
  const okuma = useSheetAction();
  const cozum = useSheetAction();
  const [konu, setKonu] = useState<Konu | null>(null);

  const seans = (params: Record<string, string>) => router.push({ pathname: "/seans", params: { count: "10", courseId: "", topicId: "", recipe: "", ...params } });
  const kapsam = (t: Konu | null): Record<string, string> => (t ? { focusKind: "topic", topicId: t.id } : { focusKind: "course", courseId: p.id ?? "" });
  const coz = (t: Konu | null) => seans({ source: t ? "topic_room" : "course_room", ...kapsam(t) });
  const yanlislar = (t: Konu | null, n: number) => seans({ mode: "review", source: t ? "topic_room" : "course_room", count: String(Math.min(20, n)), ...kapsam(t) });
  const favoriler = (t: Konu | null, n: number) => seans({ mode: "practice", fromBookmarks: "1", source: t ? "topic_room" : "course_room", count: String(Math.min(20, n)), ...kapsam(t) });
  // Tek ünite varsa özet doğrudan açılır; birden çoksa konu sayfası üniteleri listeler.
  const oku = (t: Konu) =>
    t.units.count === 1 && t.units.firstSlug
      ? router.push({ pathname: "/ozet/[slug]", params: { slug: t.units.firstSlug } })
      : router.push({ pathname: "/(tabs)/kutuphane/konu/[topicId]", params: { topicId: t.id, name: t.name } });
  const konuAc = (t: Konu) => {
    setKonu(t);
    konuSayfasi.open();
  };

  const okunacak = d ? d.tools.summaryUnitCount > 0 || d.tools.legislation.length > 0 : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title }} />
      <Screen inset="none">
        {q.isPending ? (
          <>
            <Skeleton height={112} radiusKey="card" />
            <Skeleton height={240} radiusKey="card" />
            <Skeleton height={320} radiusKey="card" />
          </>
        ) : q.isError ? (
          <Notice tone="error" title="Ders yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <RoomStatPanel
              pct={d.summary.accuracyPct}
              sub={d.summary.solved > 0 ? `doğruluk · ${d.summary.solved} soru` : "İlk tur seni bekliyor"}
              right={
                <>
                  {d.summary.examWeightPercent != null ? (
                    <AppText variant="bodySm" tone="panelInk">
                      Sınavda %{d.summary.examWeightPercent}
                    </AppText>
                  ) : null}
                  {d.summary.weakest ? (
                    <AppText variant="bodySm" tone="panelSoft" numberOfLines={2} style={{ textAlign: "right" }}>
                      En zayıf: {d.summary.weakest.name} %{d.summary.weakest.accuracyPct}
                    </AppText>
                  ) : null}
                </>
              }
            />
            <CoachLine text={d.coach} />

            <View style={{ gap: space.s3 }}>
              <View style={{ flexDirection: "row", gap: space.s3 }}>
                <ActionTile icon={Play} variant="primary" title="Soru çöz" subtitle={d.tools.tests.count > 0 ? `Akıllı tur ya da ${d.tools.tests.count} test` : "10 soru · bu dersten"} onPress={d.tools.tests.count > 0 ? cozum.open : () => coz(null)} />
                <ActionTile
                  icon={BookOpen}
                  title="Konu oku"
                  subtitle={d.tools.summaryUnitCount > 0 ? `${d.tools.summaryUnitCount} ünite özeti · madde metni` : d.tools.legislation.length > 0 ? "Madde metni" : "Henüz okunacak metin yok"}
                  disabled={!okunacak}
                  onPress={okuma.open}
                />
              </View>
              <View style={{ flexDirection: "row", gap: space.s3 }}>
                <ActionTile icon={RotateCcw} title="Yanlışlarım" subtitle={d.tools.wrongCount > 0 ? `${d.tools.wrongCount} soru bekliyor` : "Açık yanlış yok"} disabled={d.tools.wrongCount === 0} onPress={() => yanlislar(null, d.tools.wrongCount)} />
                <ActionTile icon={Star} title="Favorilerim" subtitle={d.tools.favoriteCount > 0 ? `${d.tools.favoriteCount} soru` : "Henüz favori yok"} disabled={d.tools.favoriteCount === 0} onPress={() => favoriler(null, d.tools.favoriteCount)} />
              </View>
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Konular" />
              {d.topics.length === 0 ? (
                <Card>
                  <AppText variant="subhead">Bu derste henüz konu yok</AppText>
                </Card>
              ) : (
                <View>
                  {d.topics.map((t, i) => (
                    <View key={t.id}>
                      <KonuSatiri topic={t} divider={i < d.topics.length - 1 || t.children.length > 0} onPress={() => konuAc(t)} />
                      {t.children.map((c, j) => (
                        <View key={c.id} style={{ paddingLeft: space.s5 }}>
                          <KonuSatiri topic={c} divider={j < t.children.length - 1 || i < d.topics.length - 1} onPress={() => konuAc(c)} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </Screen>

      <TopicActionSheet
        visible={konuSayfasi.visible}
        onClose={konuSayfasi.close}
        onDismissed={konuSayfasi.onDismissed}
        topic={konu}
        courseName={title}
        onStart={() => konu && konuSayfasi.closeThen(() => coz(konu))}
        onRead={() => konu && konuSayfasi.closeThen(() => oku(konu))}
        onWrongs={() => konu && konuSayfasi.closeThen(() => yanlislar(konu, konu.wrongCount))}
        onFavorites={() => konu && konuSayfasi.closeThen(() => favoriler(konu, konu.favoriteCount))}
        onDetails={() => konu && konuSayfasi.closeThen(() => router.push({ pathname: "/(tabs)/kutuphane/konu/[topicId]", params: { topicId: konu.id, name: konu.name } }))}
      />
      {d ? (
        <SolveChoiceSheet
          visible={cozum.visible}
          onClose={cozum.close}
          onDismissed={cozum.onDismissed}
          courseName={d.course.name}
          tests={d.tools.tests}
          onSmart={() => cozum.closeThen(() => coz(null))}
          onTests={() => cozum.closeThen(() => router.push({ pathname: "/(tabs)/kutuphane/testler/[courseId]", params: { courseId: d.course.id, name: d.course.name } }))}
        />
      ) : null}
      {d ? (
        <ReadingSheet
          visible={okuma.visible}
          onClose={okuma.close}
          onDismissed={okuma.onDismissed}
          topics={d.topics.flatMap((t) => [t, ...t.children])}
          legislation={d.tools.legislation}
          onTopic={(t) => okuma.closeThen(() => oku(t))}
          onLaw={(slug) => okuma.closeThen(() => router.push({ pathname: "/oku/[slug]", params: { slug } }))}
        />
      ) : null}
    </View>
  );
}

function KonuSatiri({ topic, divider, onPress }: { topic: Konu; divider: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const yeni = topic.band === "new";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.name}${topic.accuracyPct == null ? "" : `, yüzde ${topic.accuracyPct} doğru`}, ${topic.note}`}
      accessibilityHint="Konu eylemlerini açar"
      onPress={onPress}
      style={({ pressed }) => ({ paddingVertical: 12, gap: 8, borderBottomWidth: divider ? 0.5 : 0, borderBottomColor: colors.line, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="subhead" tone={yeni ? "soft" : "ink"} numberOfLines={2} style={{ flexShrink: 1 }}>
              {topic.name}
            </AppText>
            {topic.locked ? <Lock color={colors.inkSubtle} size={14} strokeWidth={1.75} /> : null}
            {topic.inPlanThisWeek ? <Badge tone="accent">Planında</Badge> : null}
          </View>
          <AppText variant="bodySm" tone="subtle">
            {topic.note}
          </AppText>
        </View>
        {!yeni ? (
          <AppText variant="subhead" tone={bandTone(topic.band)} style={{ fontVariant: ["tabular-nums"] }}>
            %{topic.accuracyPct}
          </AppText>
        ) : null}
        <ChevronRight color={colors.inkSubtle} size={18} strokeWidth={1.75} />
      </View>
      {!yeni ? <ProgressBar value={(topic.accuracyPct ?? 0) / 100} tone={bandBarTone(topic.band)} height={2} label={`${topic.name} doğruluk`} /> : null}
    </Pressable>
  );
}
