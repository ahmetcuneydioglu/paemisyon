import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Flag } from "lucide-react-native";
import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { QuestionOption, type OptionState } from "@/components/domain";
import { AppText, Badge, Button, Card, Notice, Screen, Sheet, Skeleton, StatTile } from "@/components/ui";
import { fmtMs, useAttempt, useAttemptReview, useReportQuestion } from "@/features/exams/queries";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Soru ayrıntısı (Doc 50 M5-b, Figma birebir): ders etiketi + durum rozeti, kök, şıklar
 * (doğru/kaçırılan/yanlış), Açıklama kartı, dayanak satırı, Türkiye / Süren kutuları
 * (Premium kilidi sunucudan), "çoğunluk bildi" notu, "Bu soruyu bildir". Kaynak etiketi okunmaz.
 */
export default function SoruAyrintiScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const p = useLocalSearchParams<{ attemptId: string; no: string }>();
  const no = Number(p.no);
  const attempt = useAttempt(p.attemptId ?? null);
  const review = useAttemptReview(p.attemptId ?? null, true);
  const report = useReportQuestion();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");

  const total = attempt.data?.totalQuestions ?? 0;
  const q = useMemo(() => attempt.data?.review.find((r) => r.order === no) ?? null, [attempt.data, no]);
  const item = useMemo(() => review.data?.items.find((i) => i.no === no) ?? null, [review.data, no]);
  const locked = review.data?.locked ?? true;
  const status = item?.status ?? (q ? (q.selectedOptionId == null ? "blank" : q.options.find((o) => o.id === q.selectedOptionId)?.isCorrect ? "correct" : "wrong") : null);
  const state = (id: string, isCorrect: boolean): OptionState => (isCorrect ? (q?.selectedOptionId === id ? "correct" : "missed") : q?.selectedOptionId === id ? "incorrect" : "disabled");

  return (
    <>
      <Stack.Screen
        options={{
          title: total ? `Soru ${no} / ${total}` : `Soru ${no}`,
          headerRight: () => (item?.flagged ?? q?.flagged) ? <Flag color={colors.accentInk} size={20} strokeWidth={1.75} fill={colors.accent} accessibilityLabel="Sınavda işaretlenmiş" /> : null,
        }}
      />
      <Screen inset="none" style={{ paddingBottom: space.s8 }}>
        {attempt.isPending ? (
          <>
            <Skeleton height={24} width="50%" />
            <Skeleton height={120} radiusKey="card" />
            <Skeleton height={300} radiusKey="card" />
          </>
        ) : !q ? (
          <Notice tone="error" title="Soru bulunamadı">
            Bu çözümde {no}. soru yok.
          </Notice>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2 }}>
              <AppText variant="label" tone="subtle" numberOfLines={1} style={{ flex: 1 }}>
                {(item?.course ?? "").toLocaleUpperCase("tr-TR")}
              </AppText>
              {status ? <Badge tone={status === "correct" ? "success" : status === "wrong" ? "danger" : "neutral"}>{status === "correct" ? "Doğru" : status === "wrong" ? "Yanlış" : "Boş"}</Badge> : null}
            </View>
            <AppText variant="body" accessibilityRole="header" style={{ fontSize: 17, lineHeight: 26 }}>
              {q.stem}
            </AppText>
            <View style={{ gap: 10 }}>
              {q.options.map((o) => (
                <QuestionOption key={o.id} label={o.label} text={o.text} state={state(o.id, o.isCorrect)} />
              ))}
            </View>
            {q.adjustment ? <Notice tone="warning">{q.adjustment === "credit_all" ? "Bu soru iptal edildi; herkese doğru sayıldı." : "Bu soru iptal edildi; hesaptan çıkarıldı."}</Notice> : null}

            {q.explanation ? (
              <Card tone="alt" style={{ gap: space.s1 }}>
                <AppText variant="subhead">Açıklama</AppText>
                <AppText variant="bodySm" tone="soft">
                  {q.explanation}
                </AppText>
              </Card>
            ) : null}

            {q.legalReference ? (
              <Card style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s4 }}>
                <BookOpen color={colors.ink} size={20} strokeWidth={1.75} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="subhead" numberOfLines={2}>
                    {q.legalReference}
                  </AppText>
                  {item?.topic ? (
                    <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                      {item.topic}
                    </AppText>
                  ) : null}
                </View>
              </Card>
            ) : null}

            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <StatTile label="Türkiye" value={locked ? null : item?.turkeyRate != null ? `%${item.turkeyRate}` : null} hint={locked ? "Premium ile açılır" : "doğru yaptı"} style={{ flex: 1 }} />
              <StatTile label="Süren" value={item?.seconds != null ? fmtMs(item.seconds) : null} hint={!locked && item?.avgSeconds != null ? `ortalama ${fmtMs(item.avgSeconds)}` : undefined} style={{ flex: 1 }} />
            </View>
            {item?.missedMajority ? <Notice tone="warning">Çoğunluğun bildiği bir soru. Bu konuyu Çalış listene ekledik.</Notice> : null}

            <Button title="Bu soruyu bildir" variant="ghost" onPress={() => { setReportText(""); setReportOpen(true); }} />
            {no < total ? (
              <Button title="Sonraki soru" variant="secondary" onPress={() => router.replace({ pathname: "/deneme-sonuc/[attemptId]/soru/[no]", params: { attemptId: p.attemptId ?? "", no: String(no + 1) } })} />
            ) : null}
          </>
        )}
      </Screen>

      <Sheet visible={reportOpen} onClose={() => setReportOpen(false)} title="Hata bildir" footer={<Button title="Gönder" disabled={reportText.trim().length < 5} loading={report.isPending} onPress={() => q && report.mutate({ questionId: q.questionId, message: reportText.trim() }, { onSuccess: () => setReportOpen(false) })} />}>
        <AppText variant="bodySm" tone="soft">
          Yanlış anahtar, eskimiş madde, yazım hatası… Ne gördüğünü kısaca yaz; editör inceler.
        </AppText>
        <TextInput value={reportText} onChangeText={(v) => setReportText(v.slice(0, 500))} multiline placeholder="En az 5 karakter" placeholderTextColor={colors.inkSubtle} accessibilityLabel="Hata açıklaması" style={{ color: colors.ink, minHeight: 100, textAlignVertical: "top", backgroundColor: colors.bg, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, padding: 12, fontSize: 16 }} />
        {report.isError ? <Notice tone="error">{report.error.message}</Notice> : null}
      </Sheet>
    </>
  );
}
