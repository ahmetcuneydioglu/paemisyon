import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { View } from "react-native";
import { TrendChart } from "@/components/domain";
import { AppText, Button, Card, EmptyState, ListRow, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { fmtDate, fmtNet, useExamHistory, type ExamHistoryItem } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/** Deneme geçmişi (Doc 50 M8): net gelişimi (Premium) + üç grup: Denemeler · Haftalık · Bana özel. */
export default function DenemelerimScreen() {
  const router = useRouter();
  const q = useExamHistory();
  const h = q.data;
  const empty = h ? h.denemeler.length + h.haftalik.length + h.kisisel.length === 0 : false;

  return (
    <Screen inset="none">
      {q.isPending ? (
        <Skeleton height={300} radiusKey="card" />
      ) : q.isError ? (
        <Notice tone="error" title="Geçmiş yüklenemedi">
          {q.error.message}
        </Notice>
      ) : !h || empty ? (
        <EmptyState icon={ClipboardList} title="Henüz çözüm yok" body="İlk denemeni çöz, gelişimin burada görünsün." action={<Button title="Denemelere git" variant="secondary" onPress={() => router.push("/(tabs)/denemeler")} />} />
      ) : (
        <>
          <TrendChart trend={h.trend} onUnlock={() => router.push("/paywall")} />
          <Group title="Denemeler" items={h.denemeler} />
          <Group title="Haftalık" items={h.haftalik} />
          <Group title="Bana özel" items={h.kisisel} />
        </>
      )}
    </Screen>
  );
}

function Group({ title, items }: { title: string; items: ExamHistoryItem[] }) {
  const router = useRouter();
  const { space } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: space.s2 }}>
      <SectionHeader title={title} />
      <Card style={{ paddingVertical: 0 }}>
        {items.map((it, i) => {
          const role = it.role === "official" ? "resmî" : it.role === "practice" ? "tekrar" : it.role === "personal" ? `${it.totalQuestions} soru` : "";
          const sub = `${it.completedAt ? fmtDate(it.completedAt, { day: "numeric", month: "short" }) : "—"} · ${role}${it.closedReason === "timeout" ? " · süre doldu" : ""}`;
          const right = it.resultLocked ? "sonuç bekliyor" : it.rank != null ? `${it.rank}.` : it.role === "official" ? "sıralama bekliyor" : "sırasız";
          return (
            <ListRow
              key={it.attemptId}
              title={it.title}
              subtitle={sub}
              divider={i < items.length - 1}
              trailing={
                <View style={{ alignItems: "flex-end" }}>
                  <AppText variant="subhead" tone={it.resultLocked ? "subtle" : "ink"} style={{ fontVariant: ["tabular-nums"] }}>
                    {it.resultLocked ? "—" : fmtNet(it.score)}
                  </AppText>
                  <AppText variant="bodySm" tone="subtle">
                    {right}
                  </AppText>
                </View>
              }
              onPress={() => router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: it.attemptId } })}
            />
          );
        })}
      </Card>
    </View>
  );
}
