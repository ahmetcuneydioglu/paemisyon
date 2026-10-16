import { useRouter } from "expo-router";
import { Map as MapIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { AppText, Badge, Card, Chip, EmptyState, ListRow, Notice, ProgressBar, Screen, Skeleton } from "@/components/ui";
import { useTopicProgress } from "@/features/progress/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Konu haritası (Doc 25: güç-zaaf haritası). Ders filtresi, "yalnız zayıf" (<60), satır → tur. */
export default function KonuHaritasiScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const q = useTopicProgress();
  const [course, setCourse] = useState<string | null>(null);
  const [weakOnly, setWeakOnly] = useState(false);

  const courses = useMemo(() => Array.from(new Set((q.data ?? []).map((t) => t.courseName))), [q.data]);
  const rows = (q.data ?? []).filter((t) => (!course || t.courseName === course) && (!weakOnly || t.mastery < 60));
  const grouped = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const r of rows) m.set(r.courseName, [...(m.get(r.courseName) ?? []), r]);
    return [...m.entries()];
  }, [rows]);

  return (
    <Screen inset="none" padded={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.screenGutter, gap: space.s2 }}>
        <Chip label="Yalnız zayıf" selected={weakOnly} onPress={() => setWeakOnly((v) => !v)} />
        <Chip label="Tüm dersler" selected={course == null} onPress={() => setCourse(null)} />
        {courses.map((c) => (
          <Chip key={c} label={c} selected={course === c} onPress={() => setCourse(c)} />
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: space.screenGutter, gap: space.s4 }}>
        {q.isPending ? (
          <Skeleton height={300} radiusKey="card" />
        ) : q.isError ? (
          <Notice tone="error" title="Harita yüklenemedi">
            {q.error.message}
          </Notice>
        ) : grouped.length === 0 ? (
          <EmptyState icon={MapIcon} title={weakOnly ? "Zayıf konu yok" : "Harita ilk turla başlar"} body={weakOnly ? "Bu filtrede %60 altı konu yok." : "Çözdüğün her konu burada ders ders dizilir."} />
        ) : (
          grouped.map(([name, list]) => (
            <View key={name} style={{ gap: space.s2 }}>
              <AppText variant="label" tone="subtle">
                {name}
              </AppText>
              <Card style={{ paddingVertical: 0 }}>
                {list.map((t, i) => (
                  <ListRow
                    key={t.topicId}
                    title={t.topicName}
                    subtitle={`${t.correctCount}/${t.solvedCount} doğru${t.solvedCount < 5 ? " · az veri" : ""}`}
                    divider={i < list.length - 1}
                    chevron={false}
                    trailing={
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Badge tone={t.solvedCount < 5 ? "neutral" : t.mastery < 40 ? "danger" : t.mastery < 60 ? "warning" : "success"}>{`%${t.mastery}`}</Badge>
                        <ProgressBar value={t.mastery / 100} tone={t.mastery < 40 ? "danger" : t.mastery < 60 ? "warning" : "accent"} height={4} style={{ width: 56 }} />
                      </View>
                    }
                    onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })}
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
