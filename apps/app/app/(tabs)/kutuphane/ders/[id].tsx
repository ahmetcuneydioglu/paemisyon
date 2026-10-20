import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Bookmark, Lock, XCircle } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { CoachLine, RoomStatPanel } from "@/components/domain";
import { ActionBar, AppText, Badge, Card, ListRow, Notice, ProgressBar, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { bandTone, useCourseRoom, type RoomTopic } from "@/features/rooms/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders odası (Doc 49/14): durum paneli → koç satırı → konular (gövde) → araçlar → tek "Başla".
 * Konuya dokunmak konu odasını açar; eşikler ve cümleler sunucudan. Bilgi kartları karar
 * bekliyor — burada yok.
 */
export default function DersOdasiScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ id: string; name?: string }>();
  const q = useCourseRoom(p.id ?? null);
  const d = q.data;
  const title = d?.course.name ?? p.name ?? "Ders";

  const start = () => router.push({ pathname: "/seans", params: { source: "course_room", count: "10", focusKind: "course", courseId: p.id, topicId: "", recipe: "" } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title }} />
      <Screen inset="none" style={{ paddingBottom: 120 }}>
        {q.isPending ? (
          <>
            <Skeleton height={112} radiusKey="card" />
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
                    <AppText variant="bodySm" tone="panelSoft">
                      En zayıf: {d.summary.weakest.name} %{d.summary.weakest.accuracyPct}
                    </AppText>
                  ) : null}
                </>
              }
            />
            <CoachLine text={d.coach} />

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
                      <KonuSatiri topic={t} divider={i < d.topics.length - 1 || t.children.length > 0} onPress={() => router.push({ pathname: "/(tabs)/kutuphane/konu/[topicId]", params: { topicId: t.id, name: t.name } })} />
                      {t.children.map((c, j) => (
                        <View key={c.id} style={{ paddingLeft: space.s5 }}>
                          <KonuSatiri topic={c} divider={j < t.children.length - 1 || i < d.topics.length - 1} onPress={() => router.push({ pathname: "/(tabs)/kutuphane/konu/[topicId]", params: { topicId: c.id, name: c.name } })} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Araçlar" />
              <ListRow
                title="Yanlışlarım"
                subtitle={d.tools.wrongCount > 0 ? `${d.tools.wrongCount} soru` : "Açık yanlış yok"}
                leading={<Ikon icon={XCircle} />}
                onPress={d.tools.wrongCount > 0 ? () => router.push({ pathname: "/seans", params: { mode: "review", source: "course_room", count: String(Math.min(20, d.tools.wrongCount)), focusKind: "course", courseId: p.id, topicId: "", recipe: "" } }) : undefined}
              />
              <ListRow title="Favoriler" subtitle={d.tools.favoriteCount > 0 ? `${d.tools.favoriteCount} soru` : "Henüz favori yok"} leading={<Ikon icon={Bookmark} />} onPress={d.tools.favoriteCount > 0 ? () => router.push("/(tabs)/kutuphane/tekrar") : undefined} divider={d.tools.legislation.length > 0} />
              {/* En çok 3 ana metin (sunucu madde sayısına göre sıralar); kalanı Mevzuat listesinde. */}
              {d.tools.legislation.slice(0, 3).map((l, i) => (
                <ListRow key={l.slug} title={`${l.name} metni`} subtitle={`${l.articleCount} madde`} leading={<Ikon icon={BookOpen} />} onPress={() => router.push({ pathname: "/oku/[slug]", params: { slug: l.slug } })} divider={i < Math.min(3, d.tools.legislation.length) - 1 || d.tools.legislation.length > 3} />
              ))}
              {d.tools.legislation.length > 3 ? <ListRow title={`${d.tools.legislation.length - 3} mevzuat daha`} subtitle="Mevzuat kütüphanesinde" leading={<Ikon icon={BookOpen} />} onPress={() => router.push("/(tabs)/kutuphane/mevzuat")} divider={false} /> : null}
            </View>
          </>
        ) : null}
      </Screen>
      {d ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <ActionBar title={`Başla · 10 soru · ${kisaAd(d.course.name)}`} onPress={start} />
        </View>
      ) : null}
    </View>
  );
}

function KonuSatiri({ topic, divider, onPress }: { topic: Omit<RoomTopic, "children"> | RoomTopic; divider: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const yeni = topic.band === "new";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${topic.name}${topic.accuracyPct == null ? ", henüz çözülmedi" : `, yüzde ${topic.accuracyPct} doğru`}`} onPress={onPress} style={({ pressed }) => ({ paddingVertical: 12, gap: 8, borderBottomWidth: divider ? 0.5 : 0, borderBottomColor: colors.line, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="subhead" tone={yeni ? "soft" : "ink"} numberOfLines={2} style={{ flexShrink: 1 }}>
              {topic.name}
            </AppText>
            {topic.isPremium ? <Lock color={colors.inkSubtle} size={14} strokeWidth={1.75} /> : null}
            {topic.inPlanThisWeek ? <Badge tone="accent">Planında</Badge> : null}
          </View>
          <AppText variant="bodySm" tone="subtle">
            {yeni ? "Henüz çözülmedi" : `${topic.solved} soru · %${topic.accuracyPct} doğru`}
          </AppText>
        </View>
        {!yeni ? (
          <AppText variant="subhead" tone={bandTone(topic.band)} style={{ fontVariant: ["tabular-nums"] }}>
            %{topic.accuracyPct}
          </AppText>
        ) : null}
        <AppText variant="body" tone="subtle">
          ›
        </AppText>
      </View>
      {!yeni ? <ProgressBar value={(topic.accuracyPct ?? 0) / 100} tone={topic.band === "weak" ? "warning" : "accent"} height={2} label={`${topic.name} doğruluk`} /> : null}
    </Pressable>
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

/** Düğme etiketi için kısa ders adı: "Anayasa Hukuku" → "Anayasa"; "Polis Mevzuatı" olduğu gibi. Ek yok (ünlü uyumu tuzağı: "Yürütme'dan"). */
export function kisaAd(name: string): string {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 && /hukuku|bilgisi/i.test(w[w.length - 1]!) ? w.slice(0, -1).join(" ") : name;
}
