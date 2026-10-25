import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Flag, Lock, Star, StarOff, Timer } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { CourseBreakdown, QuestionOption, ResultPanel, type OptionState } from "@/components/domain";
import { AppText, Badge, Button, Card, Chip, IconButton, Notice, Screen, SectionHeader, Sheet, Skeleton, StatTile } from "@/components/ui";
import { fmtDate, fmtDuration, fmtNet, mmss, rankSentence, useAttempt, useAttemptReview, useReportQuestion, type AttemptReview } from "@/features/exams/queries";
import { useBookmarks, useSetBookmark } from "@/features/review/queries";
import { ApiError } from "@/lib/api";
import { useStackOptions } from "@/navigation/stack-options";
import { useTheme } from "@/theme/ThemeProvider";

type Filter = "all" | "wrong" | "blank" | "flagged" | "majority";

/**
 * Deneme sonucu (Doc 50 M4) + cevap incelemesi (M5). Dört varyant tek ekran: resmî (sıra +
 * Türkiye kıyası), tekrar çözüm, kişisel, haftalık sonuç bekliyor (kilit). 8 dersli dağılım,
 * çalışılacak konular, süzgeçli inceleme (Türkiye oranı Premium — kilit sunucudan). Kaynak
 * etiketi okunmaz (CLAUDE.md).
 */
export default function DenemeSonucScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const options = useStackOptions();
  const p = useLocalSearchParams<{ attemptId: string }>();
  const q = useAttempt(p.attemptId ?? null);
  const d = q.data;
  const review = useAttemptReview(p.attemptId ?? null, Boolean(d && !d.resultLocked));
  const bookmarks = useBookmarks();
  const setBookmark = useSetBookmark();
  const report = useReportQuestion();
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const starred = useMemo(() => new Set((bookmarks.data ?? []).map((b) => b.questionId)), [bookmarks.data]);
  const inProgress = q.isError && q.error instanceof ApiError && q.error.code === "EXAM_IN_PROGRESS";
  const official = d ? d.role === "official" && !d.personal && !d.isArchive : false;
  const rank = d?.rank ?? null;
  const rankText = rank?.available && rank.rank != null ? rankSentence(rank.rank, rank.total) : null;
  const weak = d?.weakTopics ?? [];
  const courses = d?.courses ?? [];
  const reviewQ = useMemo(() => new Map((d?.review ?? []).map((r) => [r.questionId, r])), [d?.review]);
  const items = review.data?.items ?? [];
  const counts = { wrong: items.filter((i) => i.status === "wrong").length, blank: items.filter((i) => i.status === "blank").length, flagged: items.filter((i) => i.flagged).length };
  const rows = items.filter((i) => (filter === "all" ? true : filter === "wrong" ? i.status === "wrong" : filter === "blank" ? i.status === "blank" : filter === "flagged" ? i.flagged : i.missedMajority));

  return (
    <>
      <Stack.Screen options={{ ...options, title: d ? (d.personal ? "Kişisel deneme" : d.exam.title) : "Deneme sonucu" }} />
      <Screen inset="none" style={{ paddingBottom: space.s8 }}>
        {q.isPending ? (
          <>
            <Skeleton height={140} radiusKey="card" />
            <Skeleton height={200} radiusKey="card" />
          </>
        ) : inProgress ? (
          <Notice tone="info" title="Sınav devam ediyor">
            Süre dolmadan sonuç açılmaz; cevapların güvende.
          </Notice>
        ) : q.isError ? (
          <Notice tone="error" title="Sonuç yüklenemedi">
            {q.error.message}
          </Notice>
        ) : d?.resultLocked ? (
          /* Haftalık: sonuç bekliyor (M4-d) */
          <>
            <View style={{ backgroundColor: colors.panel, borderRadius: radius.card, padding: space.s5, alignItems: "center", gap: space.s2 }}>
              <Timer color={colors.accent} size={28} strokeWidth={1.75} />
              <AppText variant="subhead" tone="panelInk">
                Teslim edildi{d.completedAt ? ` · ${fmtDate(d.completedAt, { hour: "2-digit", minute: "2-digit" })}` : ""}
              </AppText>
              <AppText variant="bodySm" tone="panelSoft" style={{ textAlign: "center" }}>
                Sonuçlar ve sıralama {d.resultAt ? `${fmtDate(d.resultAt)}'de` : "sınav penceresi kapanınca"} herkese aynı anda açıklanır. Sana bildirim göndereceğiz.
              </AppText>
            </View>
            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <StatTile label="Cevaplanan" value={d.answeredCount ?? null} style={{ flex: 1 }} />
              <StatTile label="Boş" value={d.blankCount} style={{ flex: 1 }} />
              <StatTile label="Süre" value={fmtDuration(d.durationSeconds)} style={{ flex: 1 }} />
            </View>
            <Button title="Denemelere dön" variant="secondary" onPress={() => router.dismissTo("/(tabs)/denemeler")} />
          </>
        ) : d ? (
          <>
            {d.scoreUpdate ? (
              <Notice tone="success" title="Netin güncellendi">
                Bir soru iptal edildi; netin {fmtNet(d.scoreUpdate.from)}&apos;ten {fmtNet(d.scoreUpdate.to)}&apos;e çıktı.
              </Notice>
            ) : null}
            {d.role === "practice" && !d.personal ? <Notice tone="info">Bu çözüm sıralamaya girmedi; resmî sonucun kartta duruyor.</Notice> : null}
            {d.closedReason === "timeout" ? <Notice tone="warning">Süre doldu; cevapların otomatik teslim edildi.</Notice> : null}

            <ResultPanel
              label={`Deneme sonucu · ${official ? "resmî çözüm" : d.personal ? "kişisel deneme" : d.isArchive && d.role !== "practice" ? "çıkmış sınav" : "tekrar çözüm"}`}
              hero={d.score == null ? "—" : `${fmtNet(d.score)} net`}
              correct={d.correctCount ?? 0}
              total={d.totalQuestions}
              pct={null}
              durationLabel={null}
              sub={rankText ? `${rankText}${rank?.percentile && rank.percentile <= 50 ? ` · ilk %${rank.percentile}` : ""}` : official && rank && !rank.available ? `Sıralama en az 10 resmî çözümle açılır · şu an ${rank.total}` : `D ${d.correctCount} · Y ${d.wrongCount} · B ${d.blankCount}`}
            />
            <View style={{ flexDirection: "row", gap: space.s2 }}>
              <StatTile label="Doğru" value={d.correctCount} tone="success" style={{ flex: 1 }} />
              <StatTile label="Yanlış" value={d.wrongCount} tone="danger" style={{ flex: 1 }} />
              <StatTile label="Boş" value={d.blankCount} style={{ flex: 1 }} />
            </View>
            <AppText variant="bodySm" tone="subtle">
              {d.totalQuestions} soru · {fmtDuration(d.durationSeconds)}{d.completedAt ? ` · ${fmtDate(d.completedAt, { day: "numeric", month: "long" })}` : ""} · net = doğru − yanlış/4
            </AppText>

            <CourseBreakdown rows={courses} />

            {official && d.turkey ? (
              <Card style={{ gap: space.s2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">Türkiye kıyası</AppText>
                  <Badge tone="warning">Premium</Badge>
                </View>
                {d.turkey.locked ? (
                  <>
                    <View style={{ flexDirection: "row", gap: space.s2, alignItems: "flex-start" }}>
                      <Lock color={colors.inkSubtle} size={16} strokeWidth={1.75} />
                      <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
                        Türkiye ortalaması, medyan ve soru bazlı doğru oranı Premium ile açılır.
                      </AppText>
                    </View>
                    <Button title="Premium ile aç" variant="secondary" onPress={() => router.push("/paywall")} />
                  </>
                ) : d.turkey.sample < d.turkey.minSample ? (
                  <AppText variant="bodySm" tone="soft">
                    En az {d.turkey.minSample} resmî çözümle açılır; şu an {d.turkey.sample} çözüm var.
                  </AppText>
                ) : (
                  <>
                    <Row k="Türkiye ortalaması" v={`${fmtNet(d.turkey.mean)} net`} />
                    <Row k="Medyan" v={`${fmtNet(d.turkey.median)} net`} />
                    <Row k="Sen" v={`${d.turkey.diff != null && d.turkey.diff >= 0 ? "+" : ""}${fmtNet(d.turkey.diff)} net`} accent />
                  </>
                )}
              </Card>
            ) : null}

            {weak.length > 0 ? (
              <View style={{ gap: space.s2 }}>
                <SectionHeader title="Çalışılacak konular" />
                <Card style={{ paddingVertical: 0 }}>
                  {weak.slice(0, 3).map((t, i, arr) => (
                    <Pressable
                      key={t.topicId}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.topicName}: ${t.wrong} yanlış, ${t.blank} boş. Çalış`}
                      onPress={() => router.push({ pathname: "/seans", params: { mode: "practice", count: "10", focusKind: "topic", topicId: t.topicId, courseId: "", recipe: "" } })}
                      style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.line, minHeight: 52 }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="subhead" numberOfLines={2}>
                          {t.topicName}
                        </AppText>
                        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                          Y {t.wrong} · B {t.blank} · {t.total} soru
                        </AppText>
                      </View>
                      <AppText variant="subhead" tone="accentInk">
                        Çalış ›
                      </AppText>
                    </Pressable>
                  ))}
                </Card>
              </View>
            ) : null}

            <View style={{ gap: space.s2 }}>
              {official ? <Button title="Sıralamayı gör" variant="secondary" onPress={() => router.push({ pathname: "/(tabs)/denemeler/siralama/[examId]", params: { examId: d.exam.id, title: d.exam.title } })} /> : null}
              {d.personal ? <Button title="Yeni kişisel deneme" variant="secondary" onPress={() => router.replace("/(tabs)/denemeler/kisisel")} /> : null}
              {!official && !d.personal ? <Button title="Deneme geçmişi" variant="secondary" onPress={() => router.push("/(tabs)/performans/denemelerim")} /> : null}
            </View>
            {d.personal ? (
              <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center" }}>
                Kişisel deneme sıralamaya ve net gelişim çizgisine girmez.
              </AppText>
            ) : null}

            {/* ── Cevap incelemesi (M5) ── */}
            <View style={{ gap: space.s3 }}>
              <SectionHeader title="Cevap incelemesi" />
              {review.data ? (
                <>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s2 }}>
                    <Chip label="Tümü" selected={filter === "all"} onPress={() => setFilter("all")} />
                    <Chip label={`Yanlış ${counts.wrong}`} selected={filter === "wrong"} onPress={() => setFilter("wrong")} />
                    <Chip label={`Boş ${counts.blank}`} selected={filter === "blank"} onPress={() => setFilter("blank")} />
                    <Chip label={`İşaretli ${counts.flagged}`} icon={Flag} selected={filter === "flagged"} onPress={() => setFilter("flagged")} />
                    <Chip label="Çoğunluk bildi" icon={review.data.locked ? Lock : undefined} selected={filter === "majority"} disabled={review.data.locked} onPress={() => setFilter("majority")} />
                  </View>
                  {!review.data.locked && review.data.majorityMissed ? (
                    <Card tone="accent" style={{ gap: 2 }}>
                      <AppText variant="subhead" tone="accentInk">
                        Çoğunluğun bildiği {review.data.majorityMissed} soruyu kaçırdın
                      </AppText>
                      <AppText variant="bodySm" tone="soft">
                        Türkiye&apos;nin %70&apos;inden fazlasının doğru yaptığı sorular. Önce bunlara bak.
                      </AppText>
                    </Card>
                  ) : null}
                  {review.data.locked ? (
                    <Card style={{ flexDirection: "row", gap: space.s2, alignItems: "center" }}>
                      <Lock color={colors.inkSubtle} size={18} strokeWidth={1.75} />
                      <AppText variant="bodySm" tone="soft" style={{ flex: 1 }}>
                        Soru bazlı Türkiye doğru oranı, ortalama süre ve &quot;çoğunluk bildi&quot; süzgeci Premium ile açılır.
                      </AppText>
                    </Card>
                  ) : null}
                  <Card style={{ paddingVertical: 0, paddingHorizontal: 0, gap: 0 }}>
                    {rows.length === 0 ? (
                      <AppText variant="bodySm" tone="subtle" style={{ textAlign: "center", padding: space.s5 }}>
                        Bu süzgeçte soru yok.
                      </AppText>
                    ) : null}
                    {rows.map((it, i) => {
                      const rq = reviewQ.get(it.questionId);
                      const isOpen = open === it.questionId;
                      return (
                        <View key={it.questionId} style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.line, backgroundColor: isOpen ? colors.surfaceAlt : "transparent" }}>
                          <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : it.questionId)} style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingVertical: space.s3, paddingHorizontal: space.s4, minHeight: 56 }}>
                            <AppText variant="subhead" style={{ width: 28, fontVariant: ["tabular-nums"] }}>
                              {it.no}
                            </AppText>
                            <View style={{ flex: 1 }}>
                              <AppText variant="subhead" numberOfLines={1}>
                                {it.course ?? "—"}
                              </AppText>
                              <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                                {it.topic ?? ""}
                              </AppText>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                              <Badge tone={it.status === "correct" ? "success" : it.status === "wrong" ? "danger" : "neutral"}>{it.status === "correct" ? "Doğru" : it.status === "wrong" ? "Yanlış" : "Boş"}</Badge>
                              <AppText variant="bodySm" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
                                {it.turkeyRate != null ? `Türkiye %${it.turkeyRate}` : ""}{it.seconds != null ? `${it.turkeyRate != null ? " · " : ""}${mmss(it.seconds)}` : ""}
                              </AppText>
                            </View>
                          </Pressable>
                          {isOpen && rq ? <Detail q={rq} item={it} locked={review.data!.locked} starred={starred.has(rq.questionId)} onStar={() => setBookmark.mutate({ questionId: rq.questionId, on: !starred.has(rq.questionId) })} onReport={() => { setReportFor(rq.questionId); setReportText(""); }} /> : null}
                        </View>
                      );
                    })}
                  </Card>
                </>
              ) : review.isError ? (
                <Notice tone="error">İnceleme yüklenemedi.</Notice>
              ) : (
                <Skeleton height={200} radiusKey="card" />
              )}
            </View>
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

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <AppText variant="bodySm" tone="soft">
        {k}
      </AppText>
      <AppText variant="subhead" tone={accent ? "accentInk" : "ink"} style={{ fontVariant: ["tabular-nums"] }}>
        {v}
      </AppText>
    </View>
  );
}

function Detail({ q, item, locked, starred, onStar, onReport }: { q: NonNullable<ReturnType<typeof useAttempt>["data"]>["review"][number]; item: AttemptReview["items"][number]; locked: boolean; starred: boolean; onStar: () => void; onReport: () => void }) {
  const { colors, radius, space } = useTheme();
  const state = (id: string, isCorrect: boolean): OptionState => (isCorrect ? (q.selectedOptionId === id ? "correct" : "missed") : q.selectedOptionId === id ? "incorrect" : "disabled");
  return (
    <View style={{ gap: space.s3, paddingHorizontal: space.s4, paddingBottom: space.s4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.s3 }}>
      <AppText variant="body">{q.stem}</AppText>
      {q.options.map((o) => (
        <QuestionOption key={o.id} label={o.label} text={o.text} state={state(o.id, o.isCorrect)} />
      ))}
      {q.adjustment ? <Badge tone="warning">{q.adjustment === "credit_all" ? "İptal: herkese doğru sayıldı" : "İptal: hesaptan çıkarıldı"}</Badge> : null}
      {q.explanation ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.control, padding: space.s3, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BookOpen color={colors.ink} size={16} strokeWidth={1.75} />
            <AppText variant="subhead">Açıklama</AppText>
          </View>
          <AppText variant="bodySm" tone="soft">
            {q.explanation}
          </AppText>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <StatTile label="Türkiye" value={locked ? null : item.turkeyRate != null ? `%${item.turkeyRate}` : null} hint={locked ? "Premium ile açılır" : "doğru yaptı"} style={{ flex: 1 }} />
        <StatTile label="Süren" value={item.seconds != null ? mmss(item.seconds) : null} hint={!locked && item.avgSeconds != null ? `ortalama ${mmss(item.avgSeconds)}` : undefined} style={{ flex: 1 }} />
      </View>
      {item.missedMajority ? <Notice tone="warning">Çoğunluğun bildiği bir soru; bu konuyu çalışılacaklara ekledik.</Notice> : null}
      <View style={{ flexDirection: "row", gap: space.s2 }}>
        <IconButton icon={starred ? StarOff : Star} label={starred ? "Favoriden çıkar" : "Favorile"} variant={starred ? "primary" : "secondary"} onPress={onStar} />
        <IconButton icon={Flag} label="Hata bildir" variant="secondary" onPress={onReport} />
      </View>
    </View>
  );
}
