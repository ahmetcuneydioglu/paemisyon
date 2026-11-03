import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { ExamCard } from "@/components/domain";
import { AppText, EmptyState, Notice, Screen, Skeleton } from "@/components/ui";
import { useExams, type ExamCardAction, type ExamListItem } from "@/features/exams/queries";

/** Kart eylemi → rota (tür listeleri ortak). Kurallar sunucuda; burada yalnız yönlendirme. */
export function useExamAction(router: ReturnType<typeof useRouter>) {
  return (e: ExamListItem, a: ExamCardAction) => {
    switch (a.go.kind) {
      case "rules": return router.push({ pathname: "/(tabs)/denemeler/[examId]/kurallar", params: { examId: e.id, role: a.go.role ?? "" } });
      case "play": return router.push({ pathname: "/seans", params: { exam: e.id, role: a.go.role ?? "", title: e.title } });
      case "result": return router.push({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: a.go.attemptId } });
      case "ranking": return router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: e.id, title: e.title } });
      case "paywall": return router.push("/paywall");
    }
  };
}

/** Serbest denemeler (IA A, tür listesi): tarih bağımsız; çözülmemişler üstte. */
export default function SerbestScreen() {
  const router = useRouter();
  const exams = useExams();
  const act = useExamAction(router);
  const list = (exams.data ?? []).filter((e) => e.publishMode === "serbest").sort((a, b) => Number(a.myState === "completed") - Number(b.myState === "completed"));

  return (
    <Screen inset="none">
      <AppText variant="bodySm" tone="soft">
        İstediğin zaman çöz. İlk çözüm resmîdir ve sıralamaya girer; sonrakiler tekrar.
      </AppText>
      {exams.isPending ? (
        <Skeleton height={200} radiusKey="card" />
      ) : exams.isError ? (
        <Notice tone="error" title="Yüklenemedi">
          {exams.error.message}
        </Notice>
      ) : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Henüz serbest deneme yok" body="Yeni deneme yayınlanınca burada görünür." />
      ) : (
        list.map((e) => <ExamCard key={e.id} exam={e} onAction={(a) => act(e, a)} />)
      )}
    </Screen>
  );
}
