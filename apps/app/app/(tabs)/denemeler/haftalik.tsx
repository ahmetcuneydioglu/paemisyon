import { useRouter } from "expo-router";
import { CalendarClock } from "lucide-react-native";
import { View } from "react-native";
import { WeeklyExamCard } from "@/components/domain";
import { AppText, EmptyState, Notice, Screen, SectionHeader, Skeleton } from "@/components/ui";
import { useExams, type ExamCardAction, type ExamListItem } from "@/features/exams/queries";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";
import { useExamAction } from "./serbest";

/** Haftalık denemeler (IA A, tür listesi): sıradaki üstte, geçmiş altında; rozet yok, tarih satırı ayrı. */
export default function HaftalikScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const exams = useExams();
  const act = useExamAction(router);
  const list = (exams.data ?? []).filter((e) => e.publishMode === "takvimli");
  const upcoming = list.filter((e) => e.availability !== "closed").sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const pastOnes = list.filter((e) => e.availability === "closed").sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
  const now = useNow(1000, upcoming.length > 0);

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
                <WeeklyExamCard key={e.id} exam={e} now={now} showKind={false} onAction={(a: ExamCardAction) => act(e, a)} />
              ))}
            </View>
          ) : null}
          {pastOnes.length ? (
            <View style={{ gap: space.s2 }}>
              <SectionHeader title="Geçmiş haftalar" />
              {pastOnes.map((e: ExamListItem) => (
                <WeeklyExamCard key={e.id} exam={e} now={now} showKind={false} onAction={(a: ExamCardAction) => act(e, a)} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
