import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, Lock } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, ListRow, Notice, ProgressBar, Screen, SectionHeader, Sheet, Skeleton, StatTile } from "@/components/ui";
import { useCourseTopics, type CatalogTopic } from "@/features/catalog/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ders detay (Doc 25 Bölge 2: "dersin TEK yaşayan mekânı"): hakimiyet özeti, konular (alt
 * konular açılır), eylemler. Konuya dokunuş bir sheet açar: alıştırma, konu denemesi, madde
 * atlası / kanun metni (kanun konusu). Premium kilidi sunucuda; burada yalnız rozet.
 */
export default function DersScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const p = useLocalSearchParams<{ id: string; name?: string }>();
  const q = useCourseTopics(p.id ?? null);
  const [picked, setPicked] = useState<CatalogTopic | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const startCourse = (mode: "practice" | "exam", count: number) =>
    router.push({ pathname: "/seans", params: { mode, count: String(count), focusKind: "course", courseId: p.id, topicId: "", recipe: "" } });

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const summary = q.data?.summary;
  const lawCount = q.data?.topics.filter((t) => t.isLaw).length ?? 0;

  return (
    <>
      <Stack.Screen options={{ title: p.name ?? "Ders" }} />
      <Screen inset="none">
        {q.isPending ? (
          <>
            <Skeleton height={96} radiusKey="card" />
            <Skeleton height={260} radiusKey="card" />
          </>
        ) : q.isError ? (
          <Notice tone="error" title="Ders yüklenemedi">
            {q.error.message}
          </Notice>
        ) : (
          <>
            {/* Hakimiyet: ölçüm yoksa "—" (StatTile); sıfır uydurulmaz. */}
            <View style={{ flexDirection: "row", gap: space.s3 }}>
              <StatTile label="Hakimiyet" value={summary?.mastery == null ? null : `%${summary.mastery}`} hint={summary?.mastery == null ? "Henüz ölçülmedi" : undefined} progress={summary?.mastery == null ? undefined : summary.mastery / 100} emphasis />
              <StatTile label="Çözülen" value={summary?.solvedCount ?? 0} unit="soru" />
              <StatTile label="Açık yanlış" value={summary?.unresolvedWrongCount ?? 0} tone={summary && summary.unresolvedWrongCount > 0 ? "danger" : "accent"} />
            </View>

            <View style={{ gap: space.s2 }}>
              <Button title="Bu dersten 10 soru" onPress={() => startCourse("practice", 10)} />
              <Button title="Ders denemesi · 20 soru, süreli" variant="secondary" onPress={() => startCourse("exam", 20)} />
              {lawCount >= 2 ? (
                <AppText variant="bodySm" tone="soft">
                  Bu derste {lawCount} kanun var; karışık tur hepsini dengeler.
                </AppText>
              ) : null}
            </View>

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Konular" />
              {q.data.topics.length === 0 ? (
                <Card>
                  <AppText variant="subhead">Bu derste henüz konu yok</AppText>
                </Card>
              ) : (
                <Card style={{ paddingVertical: 0 }}>
                  {q.data.topics.map((t, i) => (
                    <View key={t.id}>
                      <TopicRow topic={t} divider={i < q.data.topics.length - 1 || open.has(t.id)} onPress={() => setPicked(t)} expanded={open.has(t.id)} onToggle={t.children.length > 0 ? () => toggle(t.id) : undefined} />
                      {open.has(t.id)
                        ? t.children.map((c, j) => (
                            <View key={c.id} style={{ paddingLeft: space.s6 }}>
                              <TopicRow topic={c} divider={j < t.children.length - 1 || i < q.data.topics.length - 1} onPress={() => setPicked(c)} />
                            </View>
                          ))
                        : null}
                    </View>
                  ))}
                </Card>
              )}
            </View>
          </>
        )}
      </Screen>

      <Sheet visible={picked != null} onClose={() => setPicked(null)} title={picked?.name ?? ""}>
        {picked ? (
          <>
            <AppText variant="bodySm" tone="soft">
              {picked.mastery == null ? "Henüz çözülmedi" : `%${picked.mastery} doğru · ${picked.solvedCount} soru${picked.weak ? " · zayıf" : ""}`}
              {picked.isPremium ? " · Premium konu" : ""}
            </AppText>
            <Button
              title="Alıştırma · 10 soru"
              onPress={() => {
                const t = picked;
                setPicked(null);
                router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.id, courseId: "", recipe: "" } });
              }}
            />
            <Button
              title="Konu denemesi · 20 soru, süreli"
              variant="secondary"
              onPress={() => {
                const t = picked;
                setPicked(null);
                router.push({ pathname: "/seans", params: { mode: "exam", count: "20", focusKind: "topic", topicId: t.id, courseId: "", recipe: "" } });
              }}
            />
            {picked.isLaw ? (
              <Button
                title="Madde Atlası"
                variant="secondary"
                onPress={() => {
                  const t = picked;
                  setPicked(null);
                  router.push({ pathname: "/(tabs)/kutuphane/atlas/[topicId]", params: { topicId: t.id, name: t.name, lawSlug: t.lawSlug ?? "" } });
                }}
              />
            ) : null}
            {picked.lawSlug ? (
              <Button
                title="Kanun metnini oku"
                variant="ghost"
                onPress={() => {
                  const slug = picked.lawSlug!;
                  setPicked(null);
                  router.push({ pathname: "/oku/[slug]", params: { slug } });
                }}
              />
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function TopicRow({ topic, divider, onPress, expanded, onToggle }: { topic: CatalogTopic; divider: boolean; onPress: () => void; expanded?: boolean; onToggle?: () => void }) {
  const { colors } = useTheme();
  const pct = topic.mastery;
  return (
    <ListRow
      title={topic.name}
      divider={divider}
      onPress={onPress}
      chevron={false}
      subtitle={pct == null ? (topic.solvedCount === 0 ? "Henüz çözülmedi" : `${topic.solvedCount} soru · az veri`) : `%${pct} doğru · ${topic.solvedCount} soru`}
      trailing={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {topic.isPremium ? <Lock color={colors.inkSubtle} size={16} strokeWidth={1.75} /> : null}
          {topic.weak ? <Badge tone="danger">Zayıf</Badge> : null}
          {pct != null ? <ProgressBar value={pct / 100} tone={topic.weak ? "danger" : pct < 60 ? "warning" : "accent"} height={4} style={{ width: 56 }} /> : null}
          {onToggle ? (
            <Pressable accessibilityRole="button" accessibilityLabel={expanded ? "Alt konuları gizle" : "Alt konuları göster"} onPress={onToggle} hitSlop={10}>
              {expanded ? <ChevronUp color={colors.inkSoft} size={20} strokeWidth={1.75} /> : <ChevronDown color={colors.inkSoft} size={20} strokeWidth={1.75} />}
            </Pressable>
          ) : null}
        </View>
      }
    />
  );
}
