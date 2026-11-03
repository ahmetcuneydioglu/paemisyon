import { useRouter } from "expo-router";
import { CalendarClock, Check, Lock } from "lucide-react-native";
import { View } from "react-native";
import { WeeklyPanel } from "@/components/domain";
import { AppText, Card, EmptyState, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { fmtDate, fmtNet, useExams, type ExamListItem } from "@/features/exams/queries";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";
import { useExamAction } from "./serbest";

/**
 * Haftalık denemeler (IA A tür listesi, renk seçeneği B — Figma 110:1573): sıradaki deneme tek
 * bordo panel, geçmiş haftalar liste satırı (net ve sıra sağda). Kurallar sunucuda.
 */
export default function HaftalikScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const exams = useExams();
  const act = useExamAction(router);
  const list = (exams.data ?? []).filter((e) => e.publishMode === "takvimli");
  const upcoming = list.filter((e) => e.availability !== "closed").sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const pastOnes = list.filter((e) => e.availability === "closed").sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
  const now = useNow(1000, upcoming.length > 0);
  const rules = (e: ExamListItem) => act(e, { label: "", variant: "ghost", go: { kind: "rules" } });
  const primary = (e: ExamListItem) => {
    if (e.myState === "completed" && e.my?.official) return act(e, { label: "", variant: "primary", go: { kind: "result", attemptId: e.my.official.attemptId } });
    if (e.myState === "in_progress") return act(e, { label: "", variant: "primary", go: { kind: "play", role: e.my?.active?.role ?? undefined } });
    return rules(e);
  };
  const pastRow = (e: ExamListItem, i: number) => {
    const o = e.my?.official;
    const done = o?.status === "completed";
    const right = done ? (o.resultLocked ? "bekliyor" : fmtNet(o.score) + " net") : "—";
    const sub = done ? (o.rank != null ? `${o.total.toLocaleString("tr-TR")} kişide ${o.rank}.` : "resmî çözüm") : e.canStartPractice ? "katılmadın · pratik açık" : "katılmadın";
    const Icon = done ? Check : Lock;
    return (
      <ListRow
        key={e.id}
        title={e.title}
        subtitle={`${fmtDate(e.startAt, { day: "numeric", month: "short" })} · ${sub}`}
        leading={<Icon color={done ? colors.successInk : colors.inkSubtle} size={18} strokeWidth={1.75} />}
        trailing={
          <View style={{ alignItems: "flex-end" }}>
            <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>{right}</AppText>
            <AppText variant="bodySm" tone="subtle">{done ? "Sonuç" : e.canStartPractice ? "Pratik" : "Sıralama"}</AppText>
          </View>
        }
        divider={i < pastOnes.length - 1}
        onPress={() => (done ? act(e, { label: "", variant: "ghost", go: { kind: "result", attemptId: o.attemptId } }) : e.canStartPractice ? act(e, { label: "", variant: "ghost", go: { kind: "rules", role: "practice" } }) : act(e, { label: "", variant: "ghost", go: { kind: "ranking" } }))}
      />
    );
  };

  return (
    <Screen inset="none">
      <AppText variant="bodySm" tone="soft">
        Her Pazar 21:00. Herkes aynı anda, bir resmî çözüm; sıralama pencere kapanınca açıklanır.
      </AppText>
      {exams.isPending ? (
        <Skeleton height={200} radiusKey="card" />
      ) : exams.isError ? (
        <Notice tone="error" title="Yüklenemedi">
          {exams.error.message}
        </Notice>
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Henüz haftalık deneme yok" body="İlk haftalık deneme açıklanınca burada görünür; hatırlatmayı buradan açarsın." />
      ) : (
        <>
          {upcoming.length ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Sıradaki" />
              {upcoming.map((e) => (
                <WeeklyPanel key={e.id} label="SIRADAKİ" exam={e} now={now} onPrimary={() => primary(e)} onRules={() => rules(e)} />
              ))}
            </View>
          ) : null}
          {pastOnes.length ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Geçmiş haftalar" />
              <Card style={{ paddingVertical: 0 }}>{pastOnes.map(pastRow)}</Card>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
