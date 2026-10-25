import { Stack, useRouter } from "expo-router";
import { Clock, Lock, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Card, Chip, Notice, Screen } from "@/components/ui";
import { useDashboard, useExams } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

const LENGTHS = [25, 50, 100] as const;

/**
 * Kişisel deneme oluşturma (Doc 50 M7): uzunluk çipleri (hak ve tavan sunucudan), dağılım
 * açıklaması, başka deneme sürerken engel. "Oluştur" anında başlatır (/seans personalExam).
 * Havuz anahtarı ("yanlışlarımdan") sunucu desteğiyle sonra gelir.
 */
export default function KisiselDenemeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const dash = useDashboard();
  const exams = useExams();
  const pe = dash.data?.personalExam;
  const peLeft = pe ? (pe.dailyAllowance == null ? null : Math.max(0, pe.dailyAllowance - pe.usedToday)) : null;
  const max = pe?.maxQuestions ?? 100;
  const enabled = LENGTHS.filter((n) => n <= max);
  const [count, setCount] = useState<number>(enabled[enabled.length - 1] ?? 25);
  const active = (exams.data ?? []).find((e) => e.myState === "in_progress" && e.my.active);
  const blocked = Boolean(active) || peLeft === 0;

  return (
    <>
      <Stack.Screen options={{ title: "Kişisel deneme" }} />
      <Screen inset="none" style={{ paddingBottom: insets.bottom + space.s8 }}>
        <View style={{ gap: space.s2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.s2 }}>
            <Sparkles color={colors.accentInk} size={20} strokeWidth={1.75} />
            <AppText variant="title">Kişisel deneme</AppText>
          </View>
          <AppText variant="body" tone="soft">
            Yanlışlarından ve zayıf konularından seçilen sorular, resmî PAEM dağılımıyla. Sıralamaya girmez; sana ölçüm.
          </AppText>
        </View>

        {active ? (
          <Notice tone="warning" title="Önce devam eden denemeni bitir">
            {active.title} · {active.my.active?.answered}/{active.questionCount} cevaplandı.
          </Notice>
        ) : null}
        {active ? <Button title="Denemeye dön" variant="secondary" onPress={() => router.replace({ pathname: "/seans", params: { exam: active.id, role: active.my.active?.role ?? "", title: active.title } })} /> : null}

        <Card style={{ gap: space.s3 }}>
          <AppText variant="label" tone="subtle">
            Uzunluk
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
            {LENGTHS.map((n) => {
              const locked = n > max;
              return <Chip key={n} label={`${n} soru`} selected={count === n && !locked} icon={locked ? Lock : undefined} onPress={() => (locked ? router.push("/paywall") : setCount(n))} />;
            })}
          </View>
          <AppText variant="bodySm" tone="subtle">
            100 soru gerçek sınav formatı; 25 ve 50 kısa turlar.{max < 100 ? " Üstü Premium'a özel." : ""}
          </AppText>
        </Card>

        <Card style={{ gap: space.s2 }}>
          <AppText variant="heading">Dağılım</AppText>
          <AppText variant="bodySm" tone="soft">
            Pay resmî PAEM tablosudur: Genel Kültür ve Analitik Düşünme %30, yedi hukuk ve mevzuat dersi %10&apos;ar. Kısa turlarda aynı oranla ölçeklenir. Soru seçimi görmediğin ve yanlış yaptığın sorulardan başlar.
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Clock color={colors.inkSoft} size={16} strokeWidth={1.75} />
            <AppText variant="bodySm" tone="soft">
              Soru başına 75 sn ({Math.round((count * 75) / 60)} dk); seçince başlar ve durmaz.
            </AppText>
          </View>
        </Card>

        <Button title="Denemeyi oluştur ve başla" disabled={blocked || dash.isPending} onPress={() => router.replace({ pathname: "/seans", params: { personalExam: "1", mode: "exam", count: String(count), title: "Kişisel deneme" } })} />
        <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center" }}>
          {peLeft == null ? "Kişisel deneme sıralamaya girmez; Premium hakkınla sınırsız." : peLeft === 0 ? "Bugünkü hakkını kullandın — yarın yenileniyor. Premium'da sınırsız." : `Bugün ${peLeft} hakkın var.`}
        </AppText>
      </Screen>
    </>
  );
}
