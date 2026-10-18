import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays, Lock } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { AppText, Badge, Button, Card, EmptyState, ListRow, Notice, ProgressBar, Screen, SectionHeader, Skeleton, StatTile } from "@/components/ui";
import { PlanSheet } from "@/features/plan/plan-sheet";
import { formatMinutes, itemTitle, phaseLabel, shortDate, useArchivePlan, usePlan, type Plan, type PlanItem, type PlanWeek } from "@/features/plan/queries";
import { useStackOptions } from "@/navigation/stack-options";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Planım (Doc 49/12 F8-A §5): hafta şeridi, seçili haftanın kalemleri, özet, kur/yenile/kaldır.
 * Ücretsizde gelecek haftalar kilitli gelir (sunucu kalem göndermez); kilit metni ve paywall
 * kapısı burada. Plan yoksa boş durum + kur sheet'i. `?kur=1` ile açılırsa sheet doğrudan açılır.
 */
export default function PlanimScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{ kur?: string }>();
  const { colors, space } = useTheme();
  const options = useStackOptions();
  const plan = usePlan();
  const archive = useArchivePlan();
  const [sheet, setSheet] = useState<null | "create" | "revise">(p.kur === "1" ? "create" : null);
  const [weekKey, setWeekKey] = useState<string | null>(null);

  const d = plan.data?.plan ?? null;
  const week: PlanWeek | null = d ? (d.weeks.find((w) => w.weekStart === (weekKey ?? d.currentWeekStart)) ?? d.thisWeek) : null;

  const start = (item: PlanItem) => {
    if (item.kind === "topic" && item.topicId) {
      const kalan = Math.max(5, Math.min(20, item.targetQuestions - item.doneQuestions));
      router.push({ pathname: "/seans", params: { source: "plan", count: String(kalan), focusKind: "topic", topicId: item.topicId, courseId: "", recipe: "" } });
    } else if (item.kind === "review") {
      router.push({ pathname: "/seans", params: { mode: "review", source: "plan", count: "10", focusKind: "wrongs", courseId: "", topicId: "", recipe: "" } });
    } else {
      router.push("/(tabs)/denemeler");
    }
  };

  const remove = () =>
    Alert.alert("Planı kaldır", "Plan arşivlenir; istediğin zaman yenisini kurabilirsin.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Kaldır", style: "destructive", onPress: () => archive.mutate() },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ ...options, title: "Planım" }} />
      <Screen inset="none">
        {plan.isPending ? (
          <View style={{ gap: space.s3 }}>
            <Skeleton height={56} radiusKey="card" />
            <Skeleton height={120} radiusKey="card" />
            <Skeleton height={220} radiusKey="card" />
          </View>
        ) : plan.isError ? (
          <Notice tone="error" title="Plan yüklenemedi">
            {plan.error.message}
          </Notice>
        ) : !d ? (
          <>
            <EmptyState icon={CalendarDays} title="Henüz planın yok" body="Haftada ayırabildiğin süreyi söyle; konuları sınav ağırlığına ve zayıf noktalarına göre haftalara dağıtayım. Her Pazartesi plan taze verilerle yenilenir." action={<Button title="Planı kur" onPress={() => setSheet("create")} />} />
          </>
        ) : (
          <>
            <PlanHeader plan={d} onRevise={() => setSheet("revise")} />
            {d.ended ? (
              <Notice tone="info" title="Plan tamamlandı">
                Sınav tarihi geçti ya da ufuk doldu. Yeni dönem için planı yeniden kurabilirsin.
              </Notice>
            ) : null}
            {d.suggestions.includes("exam_date") ? (
              <Notice tone="warning" title="Sınav tarihi yok">
                Plan 12 haftalık kuruldu. Tarihi girersen sınava kalan haftaya göre yeniden dağıtırım.
              </Notice>
            ) : null}

            <WeekStrip weeks={d.weeks} selected={week?.weekStart ?? d.currentWeekStart} onSelect={setWeekKey} />

            {week ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title={week.state === "current" ? "Bu hafta" : `${shortDate(week.weekStart)} haftası`} />
                {week.locked ? (
                  <Card tone="alt" style={{ gap: space.s2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
                      <Lock color={colors.inkSoft} size={18} strokeWidth={1.75} />
                      <AppText variant="subhead" style={{ flex: 1 }}>
                        Gelecek haftalar Premium’da
                      </AppText>
                    </View>
                    <AppText variant="bodySm" tone="soft">
                      Bu haftanın planı herkese açık. Sonraki haftalar, her Pazartesi otomatik yenileme ve sınav modundaki tekrar/deneme kalemleri Premium’la açılır.
                    </AppText>
                    <Button title="Premium’u incele" variant="secondary" onPress={() => router.push("/paywall")} />
                  </Card>
                ) : week.items.length === 0 ? (
                  <Card>
                    <AppText variant="bodySm" tone="soft">
                      Bu haftaya kalem düşmedi.
                    </AppText>
                  </Card>
                ) : (
                  <Card style={{ paddingVertical: 0 }}>
                    {week.items.map((i, idx) => (
                      <PlanItemRow key={i.id} item={i} current={week.state === "current"} divider={idx < week.items.length - 1} onStart={() => start(i)} />
                    ))}
                  </Card>
                )}
                {week.state === "current" && d.thisWeek.summary.offPlanQuestions > 0 ? (
                  <AppText variant="bodySm" tone="subtle">
                    Bu hafta plan dışı {d.thisWeek.summary.offPlanQuestions} soru çözdün — onlar da sayılır, yalnız kalemlere yazılmaz.
                  </AppText>
                ) : null}
              </View>
            ) : null}

            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Plan" />
              <Card style={{ paddingVertical: 0 }}>
                <ListRow title="Haftalık süre" subtitle={formatMinutes(d.weeklyMinutes)} onPress={() => setSheet("revise")} />
                <ListRow title="Sınav tarihi" subtitle={d.examDate ? new Date(`${d.examDate}T00:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Belli değil"} onPress={() => setSheet("revise")} />
                <ListRow title="Kapsam" subtitle={`${d.coverage.topics} / ${d.coverage.syllabusTopics} konu (%${d.coverage.pctOfSyllabus})`} chevron={false} />
                <ListRow title={d.revisedAt ? "Son yenileme" : "Kuruluş"} subtitle={new Date(d.revisedAt ?? d.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} chevron={false} divider={false} />
              </Card>
              <Button title="Planı kaldır" variant="ghost" loading={archive.isPending} onPress={remove} />
            </View>
          </>
        )}
      </Screen>
      <PlanSheet visible={sheet != null} mode={sheet ?? "create"} current={d} onClose={() => setSheet(null)} onDone={() => setWeekKey(null)} />
    </View>
  );
}

function PlanHeader({ plan, onRevise }: { plan: Plan; onRevise: () => void }) {
  const { space } = useTheme();
  const s = plan.thisWeek.summary;
  return (
    <View style={{ gap: space.s3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
        <AppText variant="title" style={{ flex: 1 }}>
          Planım
        </AppText>
        <Badge tone={plan.phase === "build" ? "neutral" : "warning"}>{phaseLabel(plan.phase)}</Badge>
      </View>
      <Card style={{ gap: space.s2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <AppText variant="subhead">Bu hafta</AppText>
          <AppText variant="stat">%{s.pct}</AppText>
        </View>
        <ProgressBar value={s.pct / 100} tone={s.pct >= 100 ? "success" : "accent"} label="Bu haftanın ilerlemesi" />
        <AppText variant="bodySm" tone="soft">
          {formatMinutes(s.doneMinutes)} / {formatMinutes(s.targetMinutes)} · {s.doneQuestions} / {s.targetQuestions} soru
        </AppText>
      </Card>
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <StatTile label="Hafta" value={`${plan.weeks.findIndex((w) => w.weekStart === plan.currentWeekStart) + 1} / ${plan.weeks.length}`} style={{ flex: 1 }} />
        <StatTile label="Kapsam" value={plan.coverage.pctOfSyllabus} unit="%" hint="müfredat" style={{ flex: 1 }} />
      </View>
      <Button title="Planı yenile" variant="secondary" onPress={onRevise} />
    </View>
  );
}

/** Hafta şeridi: geçmiş soluk, bu hafta vurgulu, kilitli haftalar kilit ikonlu. */
function WeekStrip({ weeks, selected, onSelect }: { weeks: PlanWeek[]; selected: string; onSelect: (k: string) => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s2 }}>
      {weeks.map((w, i) => {
        const sel = w.weekStart === selected;
        return (
          <Pressable
            key={w.weekStart}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={`${i + 1}. hafta, ${shortDate(w.weekStart)}${w.locked ? ", kilitli" : ""}`}
            onPress={() => onSelect(w.weekStart)}
            style={{ minWidth: 64, minHeight: 56, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.card, borderWidth: 1, borderColor: sel ? colors.accent : colors.line, backgroundColor: sel ? colors.accentSoft : w.state === "past" ? colors.surfaceAlt : colors.surface, alignItems: "center", justifyContent: "center", gap: 2, opacity: w.state === "past" ? 0.7 : 1 }}
          >
            <AppText variant="label" tone={sel ? "accentInk" : "subtle"}>
              Hf {i + 1}
            </AppText>
            <AppText variant="bodySm" tone={sel ? "accentInk" : "soft"}>
              {shortDate(w.weekStart)}
            </AppText>
            {w.locked ? <Lock color={colors.inkSubtle} size={12} strokeWidth={2} /> : <AppText variant="label" tone={w.summary.pct >= 100 ? "success" : "subtle"}>{w.state === "future" ? phaseLabel(w.phase).slice(0, 4) : `%${w.summary.pct}`}</AppText>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function PlanItemRow({ item, current, divider, onStart }: { item: PlanItem; current: boolean; divider: boolean; onStart: () => void }) {
  const { space } = useTheme();
  const done = item.status === "done";
  const pct = item.targetMinutes > 0 ? Math.min(1, item.doneMinutes / item.targetMinutes) : 0;
  return (
    <ListRow
      title={itemTitle(item)}
      subtitle={item.courseName ?? (item.kind === "review" ? "SRS ve yanlış turu" : item.kind === "mock" ? "Kişisel ya da canlı deneme" : null)}
      divider={divider}
      chevron={false}
      onPress={current && !done ? onStart : undefined}
      trailing={
        <View style={{ alignItems: "flex-end", gap: 4, minWidth: 96 }}>
          {done ? (
            <Badge tone="success">Tamam</Badge>
          ) : item.status === "skipped" ? (
            <Badge tone="neutral">Geçti</Badge>
          ) : (
            <AppText variant="subhead" tone={current ? "accentInk" : "soft"}>
              {current ? `${formatMinutes(item.remainingMinutes)} kaldı` : formatMinutes(item.targetMinutes)}
            </AppText>
          )}
          <ProgressBar value={done ? 1 : pct} tone={done ? "success" : "accent"} height={4} style={{ width: 96, marginTop: space.s1 }} />
        </View>
      }
    />
  );
}
