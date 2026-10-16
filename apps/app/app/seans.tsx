import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionOption, QuestionStem, type OptionState } from "@/components/domain";
import { AppText, Button, Card, IconButton, Notice, SegmentBar, Sheet, Skeleton } from "@/components/ui";
import { homeKeys } from "@/features/home/queries";
import { quizApi, type AnswerFeedback, type QuizSession, type StartSessionBody } from "@/features/quiz/api";
import { ApiError, NetworkError } from "@/lib/api";
import { useTheme } from "@/theme/ThemeProvider";

/** Saat erişimi render dışında kalsın (React Compiler kuralı); yalnız olay işleyicileri çağırır. */
const saat = { simdi: () => Date.now() };

/**
 * Seans Oynatıcı (Doc 25 K1: tek oynatıcı; seanslar reçetedir). Alıştırma/yanlış turu:
 * dokunuş cevaptır, geri bildirim anında (Doc 26 §3.4), açıklama + dayanak maddesi,
 * ileri. Çıkış onayı var; tur sunucuda kalır (Bugün kartından devam). Çevrimdışı kuyruk F5.
 * Params: resume=<sessionId> | source, count, recipe, focusKind, courseId, topicId.
 */
type Phase = "loading" | "error" | "playing" | "finishing";

export default function SeansScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ resume?: string; source?: string; count?: string; recipe?: string; focusKind?: string; courseId?: string; topicId?: string; mode?: string; articleNo?: string; fromBookmarks?: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let s: QuizSession;
        if (p.resume) {
          s = await quizApi.resume(p.resume);
          const answered = new Set((s.givenAnswers ?? []).map((a) => a.questionId));
          const first = s.questions.findIndex((q) => !answered.has(q.questionId));
          if (active) setIndex(first < 0 ? s.questions.length : first);
        } else {
          const mode: StartSessionBody["mode"] = p.mode === "exam" || p.mode === "review" || p.mode === "practice" ? p.mode : p.focusKind === "wrongs" ? "review" : "practice";
          const body: StartSessionBody = { mode };
          // `source` yalnız Bugün kanallarında (sunucu enum'u); Kütüphane girişleri kaynaksız.
          if (p.source) body.source = p.source as StartSessionBody["source"];
          const count = Number(p.count);
          if (Number.isFinite(count) && count > 0) body.questionCount = count;
          if (p.recipe === "coach" || p.recipe === "comeback") body.recipe = p.recipe;
          if (p.focusKind === "topic" && p.topicId) body.topicId = p.topicId;
          if (p.focusKind === "course" && p.courseId) body.courseId = p.courseId;
          if (p.articleNo && body.topicId) body.articleNo = p.articleNo;
          if (p.fromBookmarks === "1") body.fromBookmarks = true;
          s = await quizApi.start(body);
        }
        if (!active) return;
        setSession(s);
        shownAt.current = saat.simdi();
        if (s.questions.length === 0 || (p.resume && s.questions.every((q) => (s.givenAnswers ?? []).some((a) => a.questionId === q.questionId)))) {
          // Çözülecek soru kalmamış: doğrudan sonuca.
          setPhase("finishing");
          const r = await quizApi.complete(s.sessionId);
          void qc.invalidateQueries({ queryKey: homeKeys.brief });
          router.replace({ pathname: "/sonuc", params: { sessionId: r.sessionId, data: JSON.stringify(r) } });
          return;
        }
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        setError(e instanceof ApiError ? `${e.message}` : e instanceof NetworkError ? "Bağlantı yok; tur başlatılamadı." : "Tur başlatılamadı.");
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
    // Parametreler ekran açılırken sabittir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[index] ?? null;

  async function answer(optionId: string) {
    if (!session || !question || submitting || feedback) return;
    setSelected(optionId);
    setSubmitting(true);
    try {
      const fb = await quizApi.answer(session.sessionId, { questionId: question.questionId, questionVersionId: question.versionId, selectedOptionId: optionId, timeSpentMs: saat.simdi() - shownAt.current });
      if ("isCorrect" in fb) setFeedback(fb);
      else next();
    } catch (e) {
      setSelected(null);
      Alert.alert("Cevap kaydedilemedi", e instanceof Error ? e.message : "Yeniden dene.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setFeedback(null);
    setSelected(null);
    setArticleOpen(false);
    shownAt.current = saat.simdi();
    // Son soruydu: tur sunucuda kapatılır (olay içinde; effect değil).
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
      const r = await quizApi.complete(session.sessionId);
      void qc.invalidateQueries({ queryKey: homeKeys.brief });
      router.replace({ pathname: "/sonuc", params: { sessionId: r.sessionId, data: JSON.stringify(r) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tur bitirilemedi.");
      setPhase("error");
    }
  }

  function confirmExit() {
    if (!session || phase !== "playing") {
      router.back();
      return;
    }
    Alert.alert("Turdan çık?", "Cevapların kaydedildi; Bugün'den kaldığın yerden devam edebilirsin.", [
      { text: "Kal", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: () => router.back() },
    ]);
  }

  const optionState = (id: string): OptionState => {
    if (!feedback) return selected === id ? "selected" : "default";
    if (id === feedback.correctOptionId) return selected === id ? "correct" : "missed";
    if (id === selected) return "incorrect";
    return "disabled";
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.s3, paddingHorizontal: space.screenGutter, paddingVertical: space.s2 }}>
        <IconButton icon={X} label="Turdan çık" variant="ghost" onPress={confirmExit} />
        <View style={{ flex: 1 }}>{total > 0 ? <SegmentBar total={Math.min(total, 20)} done={Math.min(index, 20)} /> : null}</View>
        <AppText variant="bodySm" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
          {total > 0 ? `${Math.min(index + 1, total)}/${total}` : ""}
        </AppText>
      </View>

      {phase === "loading" || phase === "finishing" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={20} width="40%" />
          <Skeleton height={90} radiusKey="card" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radiusKey="card" />
          ))}
          {phase === "finishing" ? (
            <AppText variant="bodySm" tone="soft">
              Tur bitiriliyor…
            </AppText>
          ) : null}
        </View>
      ) : phase === "error" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Notice tone="error" title="Tur açılamadı">
            {error}
          </Notice>
          <Button title="Bugün'e dön" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : question ? (
        <>
          <ScrollView contentContainerStyle={{ padding: space.screenGutter, paddingBottom: 140, gap: space.s3 }}>
            <QuestionStem index={index + 1} total={total} stem={question.stem} />
            {question.options.map((o) => (
              <QuestionOption key={o.id} label={o.label} text={o.text} state={optionState(o.id)} onPress={() => void answer(o.id)} />
            ))}
            {feedback ? (
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
          {feedback ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.screenGutter, paddingTop: space.s3, paddingBottom: insets.bottom + space.s3, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.line }}>
              <Button title={index + 1 >= total ? "Turu bitir" : "Sonraki soru"} onPress={next} />
            </View>
          ) : null}
          {feedback?.relatedArticle?.text ? (
            <Sheet visible={articleOpen} onClose={() => setArticleOpen(false)} title={`Madde ${feedback.relatedArticle.no}`}>
              <AppText variant="body">{feedback.relatedArticle.text.body}</AppText>
              <AppText variant="bodySm" tone="subtle">
                {feedback.relatedArticle.text.source}
                {feedback.relatedArticle.text.verifiedAt ? ` · Doğrulandı: ${new Date(feedback.relatedArticle.text.verifiedAt).toLocaleDateString("tr-TR")}` : ""}
              </AppText>
            </Sheet>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
