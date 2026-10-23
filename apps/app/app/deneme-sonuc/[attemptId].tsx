import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Flag, Star, StarOff } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { QuestionOption, ResultPanel, type OptionState } from "@/components/domain";
import { AppText, Badge, Button, Card, IconButton, Notice, Screen, SectionHeader, Sheet, Skeleton } from "@/components/ui";
import { mmss, useAttempt, useMyAttempts, useReportQuestion } from "@/features/exams/queries";
import { useBookmarks, useSetBookmark } from "@/features/review/queries";
import { ApiError } from "@/lib/api";
import { useStackOptions } from "@/navigation/stack-options";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Deneme sonucu + analiz (Doc 25 Bölge 3: "şok değil yol haritası"): net ve önceki denemeyle
 * fark, D/Y/B, kaybettiren konular (yanlış×1.25 + boş), zamanlama şeridi, cevap incelemesi
 * (favori, hata bildir), sıralama. Kaynak etiketi okunmaz (CLAUDE.md).
 */
export default function DenemeSonucScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const options = useStackOptions();
  const p = useLocalSearchParams<{ attemptId: string }>();
  const q = useAttempt(p.attemptId ?? null);
  const mine = useMyAttempts();
  const bookmarks = useBookmarks();
  const setBookmark = useSetBookmark();
  const report = useReportQuestion();
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");

  const d = q.data;
  const starred = useMemo(() => new Set((bookmarks.data ?? []).map((b) => b.questionId)), [bookmarks.data]);

  // Önceki tamamlanmış canlı denemeyle fark (yalnız canlı; arşivde yüzde ölçeği farklı).
  const delta = useMemo(() => {
    if (!d || d.isArchive || d.score == null || !mine.data) return null;
    const prev = mine.data.filter((a) => a.status === "completed" && a.attemptId !== d.attemptId && a.score != null && Date.parse(a.startedAt) < Date.parse(d.exam.startAt)).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
    return prev?.score == null ? null : d.score - prev.score;
  }, [d, mine.data]);

  const lost = useMemo(() => (d ? [...d.topicBreakdown].map((t) => ({ ...t, lost: t.wrong * 1.25 + t.blank })).filter((t) => t.lost > 0).sort((a, b) => b.lost - a.lost) : []), [d]);
  const avgMs = useMemo(() => {
    const xs = (d?.timing ?? []).map((t) => t.timeSpentMs).filter((x): x is number => x != null && x > 0);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }, [d]);
  const slowest = useMemo(() => (d?.timing ?? []).reduce<{ order: number; ms: number } | null>((m, t) => (t.timeSpentMs != null && (!m || t.timeSpentMs > m.ms) ? { order: t.order, ms: t.timeSpentMs } : m), null), [d]);
  const inProgress = q.isError && q.error instanceof ApiError && q.error.code === "EXAM_IN_PROGRESS";

  return (
    <>
      <Stack.Screen options={{ ...options, title: d?.exam.title ?? "Deneme sonucu" }} />
      <Screen inset="none" style={{ paddingBottom: space.s8 }}>
        {q.isPending ? (
          <>
            <Skeleton height={140} radiusKey="card" />
            <Skeleton height={200} radiusKey="card" />
          </>
        ) : inProgress ? (
          <Notice tone="info" title="Sonuç pencere kapanınca açılır">
            Canlı deneme sürüyor; herkes bitirince net ve sıralama hesaplanır. Bu arada cevapların güvende.
          </Notice>
        ) : q.isError ? (
          <Notice tone="error" title="Sonuç yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d ? (
          <>
            <ResultPanel
              label={d.isArchive ? "Arşiv denemesi" : "Deneme sonucu"}
              hero={d.score == null ? "—" : d.isArchive ? `%${Math.round(d.score)}` : d.score.toFixed(2).replace(".", ",")}
              correct={d.correctCount}
              total={d.totalQuestions}
              pct={null}
              durationLabel={null}
              sub={`${d.isArchive ? "doğruluk" : "net"} · D ${d.correctCount} · Y ${d.wrongCount} · B ${d.blankCount}${d.durationSeconds != null ? ` · ${mmss(d.durationSeconds)}` : ""}`}
            />
            <AppText variant="bodySm" tone={delta == null ? "soft" : delta >= 0 ? "success" : "danger"}>
              {delta != null ? `Geçen denemeden ${delta >= 0 ? "+" : ""}${delta.toFixed(2).replace(".", ",")} net` : d.isArchive ? `${d.totalQuestions} soru` : "İlk canlı denemen; karşılaştırma bir sonrakinde."}
              {d.completedAt ? ` · ${new Date(d.completedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}` : ""}
            </AppText>
            {!d.isArchive ? <Button title="Sıralama" variant="secondary" onPress={() => router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: d.exam.id, title: d.exam.title } })} /> : null}

            {lost.length > 0 ? (
              <View style={{ gap: space.s1 }}>
                <AppText variant="label" tone="subtle">
                  Kaybettiren konular
                </AppText>
                {/* İnce çizgili satırlar (S5 dili): konu + Y/B + −net; "Kapat ›" kapatma turunu başlatır. */}
                {lost.slice(0, 6).map((t, i) => (
                  <Pressable
                    key={t.topicId}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.topicName}: ${t.wrong} yanlış, ${t.blank} boş, ${t.lost.toFixed(2)} net kayıp. Kapatma turu başlat`}
                    onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })}
                    style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, borderBottomWidth: i < Math.min(lost.length, 6) - 1 ? 1 : 0, borderBottomColor: colors.line, minHeight: 56 }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="body" numberOfLines={2}>
                        {t.topicName}
                      </AppText>
                      <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                        Y {t.wrong} · B {t.blank} · {t.total} soru
                      </AppText>
                    </View>
                    <AppText variant="subhead" tone="danger" style={{ fontVariant: ["tabular-nums"] }}>
                      −{t.lost.toFixed(2).replace(".", ",")}
                    </AppText>
                    <AppText variant="subhead" tone="accentInk">
                      Kapat ›
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {d.timing.length > 0 && avgMs > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Zamanlama" />
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 56 }}>
                    {d.timing.map((t) => {
                      const ms = t.timeSpentMs ?? 0;
                      const h = Math.max(4, Math.min(56, (ms / (avgMs * 2)) * 56));
                      const slow = ms > avgMs * 1.5;
                      return <View key={t.order} accessibilityLabel={`Soru ${t.order}, ${Math.round(ms / 1000)} saniye`} style={{ flex: 1, height: h, borderRadius: 2, backgroundColor: t.status === "correct" ? colors.success : t.status === "wrong" ? colors.danger : colors.surfaceAlt, borderWidth: slow ? 1 : 0, borderColor: colors.warning }} />;
                    })}
                  </View>
                  <AppText variant="bodySm" tone="soft">
                    Ortalama {Math.round(avgMs / 1000)} sn/soru
                    {slowest ? ` · en yavaş: ${slowest.order}. soru (${Math.round(slowest.ms / 1000)} sn)` : ""}. Sarı kenar: ortalamanın 1,5 katından yavaş.
                  </AppText>
                </Card>
              </View>
            ) : null}

            {d.review.length > 0 ? (
              <View style={{ gap: space.s3 }}>
                <SectionHeader title="Cevap incelemesi" />
                {d.review.map((r) => {
                  const state = (id: string, isCorrect: boolean): OptionState => (isCorrect ? (r.selectedOptionId === id ? "correct" : "missed") : r.selectedOptionId === id ? "incorrect" : "disabled");
                  const status = r.selectedOptionId == null ? "blank" : r.options.find((o) => o.id === r.selectedOptionId)?.isCorrect ? "correct" : "wrong";
                  return (
                    <Card key={r.questionId} style={{ gap: space.s3 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <AppText variant="label" tone="subtle">
                          Soru {r.order}
                        </AppText>
                        <Badge tone={status === "correct" ? "success" : status === "wrong" ? "danger" : "neutral"}>{status === "correct" ? "Doğru" : status === "wrong" ? "Yanlış" : "Boş"}</Badge>
                      </View>
                      <AppText variant="body">{r.stem}</AppText>
                      {r.options.map((o) => (
                        <QuestionOption key={o.id} label={o.label} text={o.text} state={state(o.id, o.isCorrect)} />
                      ))}
                      {r.explanation ? (
                        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.control, padding: space.s3 }}>
                          <AppText variant="bodySm">{r.explanation}</AppText>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: "row", gap: space.s2 }}>
                        <IconButton icon={starred.has(r.questionId) ? StarOff : Star} label={starred.has(r.questionId) ? "Favoriden çıkar" : "Favorile"} variant={starred.has(r.questionId) ? "primary" : "secondary"} onPress={() => setBookmark.mutate({ questionId: r.questionId, on: !starred.has(r.questionId) })} />
                        <IconButton icon={Flag} label="Hata bildir" variant="secondary" onPress={() => { setReportFor(r.questionId); setReportText(""); }} />
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : null}
            <Button title="Denemelere dön" onPress={() => router.dismissTo("/(tabs)/denemeler")} />
          </>
        ) : null}
      </Screen>

      <Sheet visible={reportFor != null} onClose={() => setReportFor(null)} title="Hata bildir" footer={<Button title="Gönder" disabled={reportText.trim().length < 5} loading={report.isPending} onPress={() => reportFor && report.mutate({ questionId: reportFor, message: reportText.trim() }, { onSuccess: () => setReportFor(null) })} />}>
        <AppText variant="bodySm" tone="soft">
          Yanlış anahtar, eskimiş madde, yazım hatası… Ne gördüğünü kısaca yaz; editör inceler.
        </AppText>
        <TextInput value={reportText} onChangeText={(v) => setReportText(v.slice(0, 500))} multiline placeholder="En az 5 karakter" placeholderTextColor={colors.inkSubtle} accessibilityLabel="Hata açıklaması" style={{ color: colors.ink, minHeight: 100, textAlignVertical: "top", backgroundColor: colors.bg, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, padding: 12, fontSize: 16 }} />
        {report.isError ? <Notice tone="error">{report.error.message}</Notice> : null}
      </Sheet>
    </>
  );
}
