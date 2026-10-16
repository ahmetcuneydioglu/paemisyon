import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Flag, Grid3x3, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionOption, QuestionStem, type OptionState } from "@/components/domain";
import { AppText, Button, Card, IconButton, Notice, SegmentBar, Sheet, Skeleton } from "@/components/ui";
import { examApi, examKeys, mmss } from "@/features/exams/queries";
import { homeKeys } from "@/features/home/queries";
import { quizApi, type AnswerFeedback, type QuizSession, type StartSessionBody } from "@/features/quiz/api";
import { ApiError, NetworkError } from "@/lib/api";
import { enqueueAnswer, flushQueue } from "@/lib/offline-queue";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/** Saat erişimi render dışında kalsın (React Compiler kuralı); yalnız olay işleyicileri çağırır. */
const saat = { simdi: () => Date.now() };

/**
 * Seans Oynatıcı (Doc 25 Karar 1: tek oynatıcı; seanslar reçetedir).
 * - Alıştırma/yanlış turu: dokunuş cevaptır, geri bildirim anında, açıklama + dayanak, ileri.
 * - Deneme modu (canlı deneme, kişisel, ders/konu denemesi, arşiv): süre, sayfa sayfa ileri/geri,
 *   bayrak (yerel), optik form, "Bitir" onayı; cevap anahtarı yok (sunucu `{recorded}` döner).
 * Kurallar sunucuda: pencere, premium, hak, süre aşımı (EXAM_TIME_OVER) kodla gelir.
 * Params: resume | exam=<examId> | archiveExamId | personalExam=1 | mode, source, count, recipe,
 *   focusKind, courseId, topicId, articleNo, fromBookmarks.
 */
type Phase = "loading" | "error" | "playing" | "finishing";
type SaveState = "saving" | "saved" | "failed";

export default function SeansScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, space, radius } = useTheme();
  const p = useLocalSearchParams<{ resume?: string; source?: string; count?: string; recipe?: string; focusKind?: string; courseId?: string; topicId?: string; mode?: string; articleNo?: string; fromBookmarks?: string; exam?: string; archiveExamId?: string; personalExam?: string; title?: string; questionId?: string }>();
  const [premiumGate, setPremiumGate] = useState(false);
  const [queuedNote, setQueuedNote] = useState(false);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [title, setTitle] = useState<string | null>(p.title ?? null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  // Deneme modu durumu
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [gridOpen, setGridOpen] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const shownAt = useRef(0);
  const finishing = useRef(false);

  const isExam = session?.mode === "exam" || session?.mode === "deneme";
  const now = useNow(1000, Boolean(deadline) && phase === "playing");
  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let s: QuizSession;
        const t0 = saat.simdi();
        if (p.resume) {
          s = await quizApi.resume(p.resume);
        } else if (p.exam) {
          // Canlı deneme: pencere/premium/katılım kuralı sunucuda; cevaplar /quiz/sessions'a gider.
          const r = await examApi.start(p.exam);
          s = { sessionId: r.sessionId, mode: "deneme", plannedDurationSeconds: null, questions: r.questions, givenAnswers: r.givenAnswers.map((a) => ({ ...a, isCorrect: null })), endsAt: r.endsAt };
          if (active) setTitle(r.title);
        } else {
          const mode: StartSessionBody["mode"] = p.mode === "exam" || p.mode === "review" || p.mode === "practice" || p.mode === "daily" ? p.mode : p.focusKind === "wrongs" ? "review" : "practice";
          const body: StartSessionBody = { mode };
          // `source` yalnız Bugün kanallarında (sunucu enum'u); Kütüphane girişleri kaynaksız.
          if (p.source) body.source = p.source as StartSessionBody["source"];
          const count = Number(p.count);
          if (Number.isFinite(count) && count > 0) body.questionCount = count;
          if (p.recipe === "coach" || p.recipe === "comeback") body.recipe = p.recipe;
          if (p.questionId) body.questionId = p.questionId;
          else if (p.archiveExamId) body.archiveExamId = p.archiveExamId;
          else if (p.personalExam === "1") body.personalExam = true;
          else if (mode !== "daily") {
            if (p.focusKind === "topic" && p.topicId) body.topicId = p.topicId;
            if (p.focusKind === "course" && p.courseId) body.courseId = p.courseId;
            if (p.articleNo && body.topicId) body.articleNo = p.articleNo;
            if (p.fromBookmarks === "1") body.fromBookmarks = true;
          }
          s = await quizApi.start(body);
        }
        if (!active) return;
        const given = s.givenAnswers ?? [];
        const answered = new Set(given.map((a) => a.questionId));
        const exam = s.mode === "exam" || s.mode === "deneme";
        if (exam) {
          const map: Record<string, string> = {};
          const saved: Record<string, SaveState> = {};
          for (const a of given) if (a.selectedOptionId) { map[a.questionId] = a.selectedOptionId; saved[a.questionId] = "saved"; }
          setAnswers(map);
          setSaveState(saved);
          const end = s.endsAt ? Date.parse(s.endsAt) : s.remainingSeconds != null ? t0 + s.remainingSeconds * 1000 : s.plannedDurationSeconds ? t0 + s.plannedDurationSeconds * 1000 : null;
          setDeadline(end);
        }
        const first = s.questions.findIndex((q) => !answered.has(q.questionId));
        setSession(s);
        shownAt.current = saat.simdi();
        if (s.questions.length === 0 || (!exam && (p.resume && first < 0))) {
          // Çözülecek soru kalmamış: doğrudan sonuca.
          setPhase("finishing");
          await completeAndGo(s.sessionId, exam, Boolean(p.exam || p.archiveExamId));
          return;
        }
        setIndex(first < 0 ? 0 : first);
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        setError(describe(e));
        if (e instanceof ApiError && (e.code === "PREMIUM_REQUIRED" || e.code === "PERSONAL_EXAM_LIMIT")) setPremiumGate(true);
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
    // Parametreler ekran açılırken sabittir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Süre doldu → tek seferlik bitirme (sunucu zaten 30 sn sonra cevap kabul etmez).
  useEffect(() => {
    if (phase !== "playing" || !isExam || remaining == null || remaining > 0) return;
    void finishExam(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, isExam]);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[index] ?? null;

  function describe(e: unknown): string {
    if (e instanceof ApiError) {
      const d = e.details as { startAt?: string; attemptId?: string } | undefined;
      switch (e.code) {
        case "PREMIUM_REQUIRED": return "Bu içerik Premium üyelikte açılır.";
        case "PERSONAL_EXAM_LIMIT": return "Bugünkü kişisel deneme hakkın doldu; yarın yenilenir.";
        case "EXAM_NOT_STARTED": return d?.startAt ? `Deneme ${new Date(d.startAt).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} başlıyor.` : "Deneme henüz başlamadı.";
        case "EXAM_ENDED": return "Deneme penceresi kapandı.";
        case "EXAM_ALREADY_TAKEN": return "Bu denemeye zaten katıldın; sonucunu Denemeler › Geçmiş'ten görebilirsin.";
        case "EXAM_EMPTY": return "Denemede henüz soru yok.";
        case "ARCHIVE_CLOSED": return "Bu deneme arşive açılmadı.";
        case "DAILY_ALREADY_PLAYED": return "Günün sorusunu bugün çözdün.";
        default: return e.message;
      }
    }
    if (e instanceof NetworkError) return "Bağlantı yok; tur başlatılamadı.";
    return "Tur başlatılamadı.";
  }

  async function completeAndGo(sessionId: string, exam: boolean, attemptResult: boolean) {
    const r = await quizApi.complete(sessionId);
    void qc.invalidateQueries({ queryKey: homeKeys.brief });
    void qc.invalidateQueries({ queryKey: examKeys.list });
    void qc.invalidateQueries({ queryKey: examKeys.mine });
    void qc.invalidateQueries({ queryKey: examKeys.dashboard });
    if (exam && attemptResult) router.replace({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: sessionId } });
    else router.replace({ pathname: "/sonuc", params: { sessionId: r.sessionId, data: JSON.stringify(r) } });
  }

  /* ---------------- Alıştırma ---------------- */
  async function answer(optionId: string) {
    if (!session || !question || submitting || feedback) return;
    setSelected(optionId);
    setSubmitting(true);
    try {
      const fb = await quizApi.answer(session.sessionId, { questionId: question.questionId, questionVersionId: question.versionId, selectedOptionId: optionId, timeSpentMs: saat.simdi() - shownAt.current });
      if ("isCorrect" in fb) setFeedback(fb);
      else next();
    } catch (e) {
      if (e instanceof NetworkError) {
        // Çevrimdışı: cevap kuyruğa, geri bildirimsiz ileri (bağlantı gelince gönderilir).
        await enqueueAnswer({ sessionId: session.sessionId, questionId: question.questionId, versionId: question.versionId, selectedOptionId: optionId, timeSpentMs: saat.simdi() - shownAt.current });
        setQueuedNote(true);
        next();
        return;
      }
      setSelected(null);
      if (e instanceof ApiError && e.code === "DAILY_LIMIT_REACHED") {
        Alert.alert("Günlük soru hakkın doldu", "Yarın devam edebilirsin; Premium'da sınır yok.", [{ text: "Tamam", style: "cancel" }, { text: "Premium'u gör", onPress: () => router.push("/paywall") }]);
      } else Alert.alert("Cevap kaydedilemedi", e instanceof Error ? e.message : "Yeniden dene.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setFeedback(null);
    setSelected(null);
    setArticleOpen(false);
    shownAt.current = saat.simdi();
    if (index + 1 >= total) {
      void finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  async function finish() {
    if (!session) return;
    setPhase("finishing");
    try {
      // Kuyrukta cevap varsa önce o gitsin; gitmezse tur sunucuda yarım kalır (Bugün'den devam).
      const q = await flushQueue();
      if (q.stoppedByNetwork) {
        setError("Bağlantı yok; cevapların cihazda saklandı, bağlantı gelince gönderilir. Tura Bugün'den devam edebilirsin.");
        setPhase("error");
        return;
      }
      await completeAndGo(session.sessionId, false, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tur bitirilemedi.");
      setPhase("error");
    }
  }

  /* ---------------- Deneme ---------------- */
  async function save(qid: string, versionId: string, optionId: string) {
    if (!session) return;
    setSaveState((s) => ({ ...s, [qid]: "saving" }));
    try {
      await quizApi.answer(session.sessionId, { questionId: qid, questionVersionId: versionId, selectedOptionId: optionId, timeSpentMs: saat.simdi() - shownAt.current });
      setSaveState((s) => ({ ...s, [qid]: "saved" }));
    } catch (e) {
      setSaveState((s) => ({ ...s, [qid]: "failed" }));
      if (e instanceof ApiError && e.code === "EXAM_TIME_OVER") void finishExam(true);
    }
  }

  function pick(optionId: string) {
    if (!question) return;
    const first = !answers[question.questionId];
    setAnswers((a) => ({ ...a, [question.questionId]: optionId }));
    void save(question.questionId, question.versionId, optionId);
    // İlk cevapta kısa gecikmeyle ilerle; cevabı değiştirirken yerinde kal.
    if (first && index + 1 < total) setTimeout(() => go(index + 1), 220);
  }

  function go(i: number) {
    setIndex(Math.max(0, Math.min(total - 1, i)));
    shownAt.current = saat.simdi();
    setGridOpen(false);
  }

  function toggleFlag() {
    if (!question) return;
    setFlags((f) => {
      const n = new Set(f);
      if (n.has(question.questionId)) n.delete(question.questionId);
      else n.add(question.questionId);
      return n;
    });
  }

  async function finishExam(auto = false) {
    if (!session || finishing.current) return;
    const blank = session.questions.filter((q) => !answers[q.questionId]).length;
    const run = async () => {
      finishing.current = true;
      setPhase("finishing");
      // Kaydedilemeyen cevapları bir kez daha dene; sonra kapat.
      for (const q of session.questions) {
        const opt = answers[q.questionId];
        if (opt && saveState[q.questionId] === "failed") {
          await quizApi.answer(session.sessionId, { questionId: q.questionId, questionVersionId: q.versionId, selectedOptionId: opt }).catch(() => {});
        }
      }
      try {
        await completeAndGo(session.sessionId, true, Boolean(p.exam || p.archiveExamId));
      } catch (e) {
        finishing.current = false;
        setError(e instanceof Error ? e.message : "Deneme bitirilemedi.");
        setPhase("error");
      }
    };
    if (auto) {
      void run();
      return;
    }
    Alert.alert("Testi bitir?", `${blank} boş${flags.size ? ` ve ${flags.size} bayraklı` : ""} sorun var. Bitirince cevaplar kilitlenir.`, [
      { text: "Devam et", style: "cancel" },
      { text: "Bitir", style: "destructive", onPress: () => void run() },
    ]);
  }

  function confirmExit() {
    if (!session || phase !== "playing") {
      router.back();
      return;
    }
    Alert.alert(isExam ? "Sınavdan çık?" : "Turdan çık?", isExam ? "Cevapların kaydedildi; süre dolmadan geri dönüp devam edebilirsin." : "Cevapların kaydedildi; Bugün'den kaldığın yerden devam edebilirsin.", [
      { text: "Kal", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: () => router.back() },
    ]);
  }

  const optionState = (id: string): OptionState => {
    if (isExam) return answers[question?.questionId ?? ""] === id ? "selected" : "default";
    if (!feedback) return selected === id ? "selected" : "default";
    if (id === feedback.correctOptionId) return selected === id ? "correct" : "missed";
    if (id === selected) return "incorrect";
    return "disabled";
  };

  const answeredCount = session ? session.questions.filter((q) => answers[q.questionId]).length : 0;
  const lastMinute = remaining != null && remaining <= 60;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.screenGutter, paddingVertical: space.s2 }}>
        <IconButton icon={X} label={isExam ? "Sınavdan çık" : "Turdan çık"} variant="ghost" onPress={confirmExit} />
        {isExam ? (
          <>
            <View style={{ flex: 1 }}>
              {title ? (
                <AppText variant="bodySm" tone="soft" numberOfLines={1}>
                  {title}
                </AppText>
              ) : null}
              <AppText variant="subhead" tone={lastMinute ? "danger" : "ink"} style={{ fontVariant: ["tabular-nums"] }} accessibilityLabel={remaining != null ? `Kalan süre ${mmss(remaining)}` : "Süresiz"}>
                {remaining != null ? mmss(remaining) : "Süresiz"}
              </AppText>
            </View>
            {phase === "playing" ? (
              <Pressable accessibilityRole="button" onPress={() => void finishExam()} hitSlop={8}>
                <AppText variant="subhead" tone="accentInk">
                  Bitir
                </AppText>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>{total > 0 ? <SegmentBar total={Math.min(total, 20)} done={Math.min(index, 20)} /> : null}</View>
            <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
              {total > 0 ? `${Math.min(index + 1, total)}/${total}` : ""}
            </AppText>
          </>
        )}
      </View>

      {phase === "loading" || phase === "finishing" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={20} width="40%" />
          <Skeleton height={90} radiusKey="card" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radiusKey="card" />
          ))}
          <AppText variant="bodySm" tone="soft">
            {phase === "finishing" ? (isExam ? "Deneme bitiriliyor, sonuç hesaplanıyor…" : "Tur bitiriliyor…") : "Sorular geliyor…"}
          </AppText>
        </View>
      ) : phase === "error" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Notice tone={premiumGate ? "warning" : "error"} title={premiumGate ? "Premium gerekiyor" : isExam ? "Deneme açılamadı" : "Tur açılamadı"}>
            {error}
          </Notice>
          {premiumGate ? <Button title="Premium'u gör" onPress={() => router.replace("/paywall")} /> : null}
          <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : question ? (
        <>
          <ScrollView contentContainerStyle={{ padding: space.screenGutter, paddingBottom: 140, gap: space.s3 }}>
            {isExam && saveState[question.questionId] === "failed" ? (
              <Notice tone="warning">Cevap kaydedilemedi; şıkka yeniden dokun ya da bağlantıyı kontrol et.</Notice>
            ) : null}
            {queuedNote && !isExam ? <Notice tone="info">Çevrimdışısın; cevapların cihazda saklanıyor, bağlantı gelince gönderilecek. Geri bildirim o zaman görünür.</Notice> : null}
            <QuestionStem index={index + 1} total={total} stem={question.stem} />
            {question.options.map((o) => (
              <QuestionOption key={o.id} label={o.label} text={o.text} state={optionState(o.id)} onPress={() => (isExam ? pick(o.id) : void answer(o.id))} />
            ))}
            {!isExam && feedback ? (
              <Card tone={feedback.isCorrect ? "surface" : "alt"} style={{ marginTop: space.s2 }}>
                <AppText variant="label" tone={feedback.isCorrect ? "success" : "danger"}>
                  {feedback.isCorrect ? "Doğru" : "Yanlış"}
                </AppText>
                {feedback.explanation ? <AppText variant="body">{feedback.explanation}</AppText> : <AppText variant="bodySm" tone="soft">Bu soru için açıklama henüz yazılmadı.</AppText>}
                {feedback.legalReference ? (
                  <AppText variant="bodySm" tone="soft">
                    Dayanak: {feedback.legalReference}
                  </AppText>
                ) : null}
                {feedback.relatedArticle?.text ? <Button title={`Maddeyi oku · md. ${feedback.relatedArticle.no}`} variant="secondary" onPress={() => setArticleOpen(true)} /> : null}
              </Card>
            ) : null}
          </ScrollView>

          {isExam ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: space.s2, paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: insets.bottom + space.s3, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.line }}>
              <IconButton icon={ChevronLeft} label="Önceki soru" disabled={index === 0} onPress={() => go(index - 1)} />
              <IconButton icon={Flag} label={flags.has(question.questionId) ? "Bayrağı kaldır" : "Emin değilim, bayrakla"} variant={flags.has(question.questionId) ? "primary" : "secondary"} onPress={toggleFlag} />
              <Pressable accessibilityRole="button" accessibilityLabel={`Optik form, ${answeredCount} / ${total} dolu`} onPress={() => setGridOpen(true)} style={{ flex: 1, minHeight: 44, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
                <Grid3x3 color={colors.ink} size={18} strokeWidth={1.75} />
                <AppText variant="subhead" style={{ fontVariant: ["tabular-nums"] }}>
                  {answeredCount}/{total}
                  {flags.size ? ` · ⚑${flags.size}` : ""}
                </AppText>
              </Pressable>
              <IconButton icon={ChevronRight} label="Sonraki soru" variant="primary" disabled={index >= total - 1} onPress={() => go(index + 1)} />
            </View>
          ) : feedback ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: insets.bottom + space.s3, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.line }}>
              <Button title={index + 1 >= total ? "Turu bitir" : "Sonraki soru"} onPress={next} />
            </View>
          ) : null}

          {!isExam && feedback?.relatedArticle?.text ? (
            <Sheet visible={articleOpen} onClose={() => setArticleOpen(false)} title={`Madde ${feedback.relatedArticle.no}`}>
              <AppText variant="body">{feedback.relatedArticle.text.body}</AppText>
              <AppText variant="bodySm" tone="subtle">
                {feedback.relatedArticle.text.source}
                {feedback.relatedArticle.text.verifiedAt ? ` · Doğrulandı: ${new Date(feedback.relatedArticle.text.verifiedAt).toLocaleDateString("tr-TR")}` : ""}
              </AppText>
            </Sheet>
          ) : null}

          {isExam && session ? (
            <Sheet visible={gridOpen} onClose={() => setGridOpen(false)} title="Optik form">
              <AppText variant="bodySm" tone="soft">
                {answeredCount}/{total} dolu
                {remaining != null && total - answeredCount > 0 ? ` · boş soru başına ~${Math.floor(remaining / (total - answeredCount))} sn` : ""}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {session.questions.map((q, i) => {
                  const filled = Boolean(answers[q.questionId]);
                  const flagged = flags.has(q.questionId);
                  return (
                    <Pressable key={q.questionId} accessibilityRole="button" accessibilityLabel={`Soru ${i + 1}${filled ? ", cevaplı" : ", boş"}${flagged ? ", bayraklı" : ""}`} onPress={() => go(i)} style={{ width: 48, height: 44, borderRadius: radius.control, backgroundColor: flagged ? colors.warningSoft : filled ? colors.accentSoft : colors.surface, borderWidth: i === index ? 2 : 1, borderColor: i === index ? colors.accent : colors.line, alignItems: "center", justifyContent: "center" }}>
                      <AppText variant="subhead" style={{ color: flagged ? colors.warningInk : filled ? colors.accentInk : colors.ink }}>
                        {i + 1}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              <Button title="Testi bitir" variant="secondary" onPress={() => { setGridOpen(false); void finishExam(); }} />
            </Sheet>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
