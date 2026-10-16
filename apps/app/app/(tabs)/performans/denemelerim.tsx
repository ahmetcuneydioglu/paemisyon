import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { AppText, Badge, Card, EmptyState, ListRow, Notice, Screen, Skeleton } from "@/components/ui";
import { fmtDate, useMyAttempts } from "@/features/exams/queries";

/** Denemelerim (Doc 25: arşiv — geçmiş sonuçlar). Canlı denemeler; satır → sonuç. */
export default function DenemelerimScreen() {
  const router = useRouter();
  const q = useMyAttempts();
  const rows = (q.data ?? []).filter((a) => a.exam);

  return (
    <Screen inset="none">
      {q.isPending ? (
        <Skeleton height={300} radiusKey="card" />
      ) : q.isError ? (
        <Notice tone="error" title="Liste yüklenemedi">
          {q.error.message}
        </Notice>
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Henüz denemeye katılmadın" body="Canlı denemeler Denemeler sekmesinde; katıldıkça burada birikir." />
      ) : (
        <>
          <AppText variant="bodySm" tone="soft">
            {rows.length} deneme · net = doğru − yanlış/4
          </AppText>
          <Card style={{ paddingVertical: 0 }}>
            {rows.map((a, i) => (
              <ListRow
                key={a.attemptId}
                title={a.exam!.title}
                subtitle={`${fmtDate(a.startedAt, { day: "numeric", month: "short", year: "numeric" })} · D ${a.correctCount} · Y ${a.wrongCount} · B ${a.blankCount}`}
                divider={i < rows.length - 1}
                trailing={a.status === "completed" ? <Badge tone="accent">{`${(a.score ?? 0).toFixed(2)} net`}</Badge> : <Badge tone="warning">{a.status === "in_progress" ? "Sürüyor" : "Yarım"}</Badge>}
                onPress={a.status === "completed" ? () => router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: a.attemptId } }) : undefined}
              />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
