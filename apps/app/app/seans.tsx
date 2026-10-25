import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ALargeSmall, Ellipsis, ExternalLink, Flag, Share2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Linking, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExamActionBar, ExamFeedbackBox, ExamMapSheet, ExamSubmitSheet, ExamTopBar, FeedbackPanel, QuestionMetaRow, QuestionOption, QuestionStem, SessionBar, SessionTitleBlock, SessionTopRow, ShareQuestionSheet, type CoachState, type ExamMapCell, type OptionState, type SliceState, type ToolAction } from "@/components/domain";
import { AppText, Badge, Button, IconButton, ListRow, Notice, Sheet, Skeleton, TextField } from "@/components/ui";
import { examApi, examKeys, fmtDuration, mmss } from "@/features/exams/queries";
import { homeKeys } from "@/features/home/queries";
import { quizApi, sessionToolsApi, type AnswerFeedback, type QuizSession, type StartSessionBody } from "@/features/quiz/api";
import { buildShareCardData } from "@/features/quiz/share";
import { reviewKeys } from "@/features/review/queries";
import { ApiError, NetworkError } from "@/lib/api";
import { readLocal, writeLocal } from "@/lib/local-store";
import { enqueueAnswer, flushQueue } from "@/lib/offline-queue";
import { useNow } from "@/lib/use-now";
import { useTheme } from "@/theme/ThemeProvider";

/** Saat erişimi render dışında kalsın (React Compiler kuralı); yalnız olay işleyicileri çağırır. */
const saat = { simdi: () => Date.now() };

/** Yazı boyu kademeleri — mevzuat okuyucuyla ORTAK tercih (`reader.scale`). */
const SCALES = [0.9, 1, 1.15] as const;
const SCALE_LABEL = ["Küçük", "Standart", "Büyük"] as const;

/**
 * Seans Oynatıcı (Doc 25 Karar 1: tek oynatıcı; seanslar reçetedir). Deri: Doc 49/15 (Figma
 * "Seans"). Alıştırma/yanlış turu: dokunuş cevaptır, geri bildirim paneli anında, "Önceki"
 * cevaplanmış soruyu salt okunur gösterir, ileri alt çubuktan. Deneme modu: süre, sayfa sayfa
 * ileri/geri, bayrak (yerel), optik form, "Bitir" onayı; cevap anahtarı yok.
 * Kurallar sunucuda: pencere, premium, hak, süre aşımı (EXAM_TIME_OVER) kodla gelir.
 * Params: resume | exam=<examId> | archiveExamId | personalExam=1 | mode, source, count, recipe,
 *   focusKind, courseId, topicId, articleNo, fromBookmarks, title.
 */
type Phase = "loading" | "error" | "playing" | "finishing";
type SaveState = "saving" | "saved" | "failed";
/** Alıştırmada verilen cevap: seçilen şık + sunucu geri bildirimi + harcanan saniye. */
type Given = { selected: string | null; fb: AnswerFeedback; seconds: number | null };

export default function SeansScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const p = useLocalSearchParams<{ resume?: string; source?: string; count?: string; recipe?: string; focusKind?: string; courseId?: string; topicId?: string; mode?: string; articleNo?: string; fromBookmarks?: string; archiveExamId?: string; personalExam?: string; exam?: string; role?: string; questionId?: string; title?: string }>();
  const [premiumGate, setPremiumGate] = useState(false);
  const [queuedNote, setQueuedNote] = useState(false);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [title, setTitle] = useState<string | null>(p.title ?? null);
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<Record<string, Given>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scaleIdx, setScaleIdx] = useState(1);
  // Araçlar (web oynatıcıyla aynı uçlar)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [coach, setCoach] = useState<Record<string, CoachState>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportState, setReportState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");
  // Deneme modu durumu
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [gridOpen, setGridOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  /** Doc 50: resmî çözümde admin anahtarı, tekrar çözümde her zaman — sunucu söyler, istemci kural bilmez. */
  const [reveal, setReveal] = useState(false);
  const shownAt = useRef(0);
  const finishing = useRef(false);
  const [scrollY] = useState(() => new Animated.Value(0));

  const isExam = session?.mode === "exam" || session?.mode === "deneme";
  const now = useNow(1000, Boolean(deadline) && phase === "playing");
  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;

  useEffect(() => {
    let active = true;
    void readLocal<number>("reader.scale", 1).then((v) => {
      const i = SCALES.indexOf(v as (typeof SCALES)[number]);
      if (active && i >= 0) setScaleIdx(i);
    });
    return () => {
      active = false;
    };
  }, []);

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
          const role = p.role === "practice" ? "practice" : p.role === "official" ? "official" : undefined;
          const r = await examApi.start(p.exam, role);
          // Teslim sınırı sunucunun: min(kişisel süre, pencere sonu). endsAt yalnız bilgi.
          s = { sessionId: r.sessionId, mode: "deneme", plannedDurationSeconds: null, questions: r.questions, givenAnswers: r.givenAnswers.map((a) => ({ ...a, isCorrect: null })), endsAt: r.deadlineAt ?? r.endsAt };
          if (active) {
            setTitle(r.title);
            setReveal(r.liveAnswerReveal === true);
            if (r.givenAnswers.some((a) => a.flagged)) setFlags(new Set(r.givenAnswers.filter((a) => a.flagged).map((a) => a.questionId)));
          }
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
        if (s.scopeName && !p.title) setTitle(s.scopeName);
        const givenAnswers = s.givenAnswers ?? [];
        const answered = new Set(givenAnswers.map((a) => a.questionId));
        const exam = s.mode === "exam" || s.mode === "deneme";
        if (exam) {
          const map: Record<string, string> = {};
          const saved: Record<string, SaveState> = {};
          for (const a of givenAnswers) if (a.selectedOptionId) { map[a.questionId] = a.selectedOptionId; saved[a.questionId] = "saved"; }
          setAnswers(map);
          setSaveState(saved);
          const end = s.endsAt ? Date.parse(s.endsAt) : s.remainingSeconds != null ? t0 + s.remainingSeconds * 1000 : s.plannedDurationSeconds ? t0 + s.plannedDurationSeconds * 1000 : null;
          setDeadline(end);
        } else {
          // Devam edilen tur: açıklama/anahtar tekrar SIZDIRILMAZ; doğruysa seçilen = doğru.
          const seeded: Record<string, Given> = {};
          for (const a of givenAnswers) {
            if (a.selectedOptionId == null) continue;
            seeded[a.questionId] = { selected: a.selectedOptionId, seconds: null, fb: { isCorrect: a.isCorrect === true, correctOptionId: a.isCorrect === true ? a.selectedOptionId : null, explanation: null, legalReference: null, relatedArticle: null } };
          }
          setGiven(seeded);
        }
        const first = s.questions.findIndex((q) => !answered.has(q.questionId));
        setSession(s);
        shownAt.current = saat.simdi();
        if (s.questions.length === 0 || (!exam && (p.resume && first < 0))) {
          // Çözülecek soru kalmamış: doğrudan sonuca.
          setPhase("finishing");
          await completeAndGo(s.sessionId, exam, Boolean(p.exam || p.archiveExamId), s.scopeName ?? null);
          return;
        }
        setIndex(first < 0 ? 0 : first);
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        // Resmî çözüm zaten var → sonuç ekranına (Doc 50 M3-b).
        const taken = e instanceof ApiError && e.code === "EXAM_ALREADY_TAKEN" ? (e.details as { attemptId?: string } | undefined)?.attemptId : undefined;
        if (taken) {
          router.replace({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: taken } });
          return;
        }
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

  // Favori durumunu tohumla — önceden yıldızlanmış sorular bu turda da dolu yıldız görünsün.
  useEffect(() => {
    if (!session || isExam) return;
    let alive = true;
    sessionToolsApi
      .bookmarks()
      .then((rows) => {
        if (alive) setBookmarks((s) => new Set([...s, ...rows.map((r) => r.questionId)]));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [session, isExam]);

  // Süre doldu → tek seferlik bitirme (sunucu zaten 30 sn sonra cevap kabul etmez).
  useEffect(() => {
    if (phase !== "playing" || !isExam || remaining == null || remaining > 0) return;
    void finishExam(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, isExam]);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[index] ?? null;
  const current = question ? given[question.questionId] : undefined;
  const feedback = current?.fb ?? null;
  const scale = SCALES[scaleIdx] ?? 1;
  const kacDogru = Object.values(given).filter((g) => g.fb.isCorrect).length;
  const kacYanlis = Object.values(given).filter((g) => !g.fb.isCorrect).length;
  const scopeTitle = title ?? (isExam ? "Deneme" : session?.mode === "review" ? "Yanlış tekrarı" : session?.mode === "daily" ? "Günün sorusu" : "Alıştırma");

  function describe(e: unknown): string {
    if (e instanceof ApiError) {
      const d = e.details as { startAt?: string; attemptId?: string } | undefined;
      switch (e.code) {
        case "PREMIUM_REQUIRED": return "Bu içerik Premium üyelikte açılır.";
        case "PERSONAL_EXAM_LIMIT": return "Bugünkü kişisel deneme hakkın doldu; yarın yenilenir.";
        case "EXAM_NOT_STARTED": return d?.startAt ? `Deneme ${new Date(d.startAt).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} başlıyor.` : "Deneme henüz başlamadı.";
        case "EXAM_ENDED":
        case "EXAM_CLOSED": return "Deneme penceresi kapandı.";
        case "EXAM_ALREADY_TAKEN": return "Resmî çözümünü yaptın; sonucuna gidiyoruz.";
        case "OFFICIAL_FIRST": return "Tekrar çözüm için önce resmî çözümünü tamamlaman gerekiyor.";
        case "OFFICIAL_IN_PROGRESS": return "Devam eden bir resmî çözümün var; önce onu bitir.";
        case "EXAM_EMPTY": return "Denemede henüz soru yok.";
        case "ARCHIVE_CLOSED": return "Bu deneme arşive açılmadı.";
        case "DAILY_ALREADY_PLAYED": return "Günün sorusunu bugün çözdün.";
        default: return e.message;
      }
    }
    if (e instanceof NetworkError) return "Bağlantı yok; tur başlatılamadı.";
    return "Tur başlatılamadı.";
  }

  async function completeAndGo(sessionId: string, exam: boolean, attemptResult: boolean, scopeName: string | null) {
    const r = await quizApi.complete(sessionId);
    void qc.invalidateQueries({ queryKey: homeKeys.brief });
    void qc.invalidateQueries({ queryKey: examKeys.list });
    void qc.invalidateQueries({ queryKey: examKeys.mine });
    void qc.invalidateQueries({ queryKey: examKeys.dashboard });
    void qc.invalidateQueries({ queryKey: examKeys.history });
    if (exam && attemptResult) router.replace({ pathname: "/deneme-sonuc/[attemptId]", params: { attemptId: sessionId } });
    else router.replace({ pathname: "/sonuc", params: { sessionId: r.sessionId, data: JSON.stringify(r), title: scopeName ?? "" } });
  }

  /* ---------------- Alıştırma ---------------- */
  async function answer(optionId: string) {
    if (!session || !question || submitting || current) return;
    setSelected(optionId);
    setSubmitting(true);
    const spent = saat.simdi() - shownAt.current;
    try {
      const fb = await quizApi.answer(session.sessionId, { questionId: question.questionId, questionVersionId: question.versionId, selectedOptionId: optionId, timeSpentMs: spent });
      if ("isCorrect" in fb) {
        setGiven((g) => ({ ...g, [question.questionId]: { selected: optionId, fb, seconds: Math.max(1, Math.round(spent / 1000)) } }));
        setSelected(null);
      } else next();
    } catch (e) {
      if (e instanceof NetworkError) {
        // Çevrimdışı: cevap kuyruğa, geri bildirimsiz ileri (bağlantı gelince gönderilir).
        await enqueueAnswer({ sessionId: session.sessionId, questionId: question.questionId, versionId: question.versionId, selectedOptionId: optionId, timeSpentMs: spent });
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
    setSelected(null);
    setArticleOpen(false);
    shownAt.current = saat.simdi();
    if (index + 1 >= total) {
      void finish();
      return;
    }
    setIndex((i) => i + 1);
    scrollY.setValue(0);
  }

  function prev() {
    if (index === 0) return;
    setArticleOpen(false);
    setIndex((i) => i - 1);
    scrollY.setValue(0);
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
      await completeAndGo(session.sessionId, false, false, session.scopeName ?? title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tur bitirilemedi.");
      setPhase("error");
    }
  }

  /* ---------------- Araçlar ---------------- */
  function toggleBookmark() {
    if (!question) return;
    const id = question.questionId;
    const has = bookmarks.has(id);
    setBookmarks((s) => {
      const n = new Set(s);
      if (has) n.delete(id);
      else n.add(id);
      return n;
    });
    sessionToolsApi
      .setBookmark(id, !has)
      .then(() => void qc.invalidateQueries({ queryKey: reviewKeys.bookmarks }))
      .catch(() => {
        setBookmarks((s) => {
          const n = new Set(s);
          if (has) n.add(id);
          else n.delete(id);
          return n;
        });
      });
  }

  async function askCoach() {
    if (!question || !current?.selected) return;
    const id = question.questionId;
    if (coach[id]?.status === "busy" || coach[id]?.status === "done") return;
    setCoach((c) => ({ ...c, [id]: { status: "busy" } }));
    try {
      const r = await sessionToolsApi.explain(question.versionId, current.selected);
      setCoach((c) => ({ ...c, [id]: { status: "done", text: r.text, remainingToday: r.remainingToday } }));
    } catch (e) {
      const limit = e instanceof ApiError && e.code === "AI_LIMIT_REACHED";
      setCoach((c) => ({ ...c, [id]: { status: "error", message: limit ? "Bugünkü koç hakkın doldu; Premium'da sınır yok." : e instanceof Error ? e.message : "Koça şu an ulaşılamadı." } }));
    }
  }

  async function sendReport() {
    if (!question || reportText.trim().length < 5) return;
    setReportState("busy");
    try {
      const r = await sessionToolsApi.report(question.questionId, reportText.trim());
      setReportState(r.alreadyReported ? "already" : "done");
      setReportText("");
    } catch {
      setReportState("error");
    }
  }

  /**
   * Menü Sheet'i kapanırken paylaşım sayfası ya da başka bir modal AÇILMAZ: iOS kapanmakta
   * olan modalın üstüne sunum yapmaz (paylaşım sessizce yutuluyordu). Eylem, kapanış
   * animasyonu bitince (`onDismissed`) koşar; Android'de kapanış eşzamanlı, hemen koşar.
   */
  const afterMenuClose = useRef<(() => void) | null>(null);
  function closeMenuThen(action: () => void) {
    setMenuOpen(false);
    if (Platform.OS === "ios") afterMenuClose.current = action;
    else action();
  }
  function onMenuDismissed() {
    const action = afterMenuClose.current;
    afterMenuClose.current = null;
    action?.();
  }

  // Paylaşım kartı sayfası (F10-P): kök + şıklar; cevaplanmışsa isteğe bağlı cevap modu.
  const [shareOpen, setShareOpen] = useState(false);


  function cycleScale() {
    const nextIdx = (scaleIdx + 1) % SCALES.length;
    setScaleIdx(nextIdx);
    void writeLocal("reader.scale", SCALES[nextIdx]);
  }

  function openArticleBeforeAnswer() {
    const ref = question?.relatedArticleRef;
    if (!ref) return;
    if (ref.legislationSlug) router.push({ pathname: "/oku/[slug]", params: { slug: ref.legislationSlug, madde: ref.no } });
    else Alert.alert(ref.label, "Bu madde henüz mevzuat merkezinde yayınlanmadı; cevaptan sonra dayanak açıklamada görünür.");
  }

  /* ---------------- Deneme ---------------- */
  async function save(qid: string, versionId: string, optionId: string) {
    if (!session) return;
    setSaveState((s) => ({ ...s, [qid]: "saving" }));
    const spent = saat.simdi() - shownAt.current;
    try {
      const fb = await quizApi.answer(session.sessionId, { questionId: qid, questionVersionId: versionId, selectedOptionId: optionId, timeSpentMs: spent });
      setSaveState((s) => ({ ...s, [qid]: "saved" }));
      // Canlı geri bildirim: sunucu anahtarı verdiyse göster; ilk cevap kilitlidir (kilitliyse kayıtlı şık geçerli).
      if (reveal && "isCorrect" in fb) {
        const locked = fb as AnswerFeedback & { selectedOptionId?: string | null };
        const sel = locked.selectedOptionId ?? optionId;
        setAnswers((a) => ({ ...a, [qid]: sel }));
        setGiven((g) => ({ ...g, [qid]: { selected: sel, fb, seconds: Math.max(1, Math.round(spent / 1000)) } }));
      }
    } catch (e) {
      setSaveState((s) => ({ ...s, [qid]: "failed" }));
      if (e instanceof ApiError && e.code === "EXAM_TIME_OVER") void finishExam(true);
    }
  }

  function pick(optionId: string) {
    if (!question) return;
    // Canlı geri bildirimde ilk cevap kilitlenir; ikinci dokunuş yok sayılır.
    if (reveal && (given[question.questionId] || saveState[question.questionId] === "saving")) return;
    const first = !answers[question.questionId];
    setAnswers((a) => ({ ...a, [question.questionId]: optionId }));
    void save(question.questionId, question.versionId, optionId);
    // İlk cevapta kısa gecikmeyle ilerle; cevabı değiştirirken yerinde kal. Canlı geri bildirimde
    // yerinde kal: açıklama okunur, ileri alt çubuktan.
    if (first && !reveal && index + 1 < total) setTimeout(() => go(index + 1), 220);
  }

  function go(i: number) {
    setIndex(Math.max(0, Math.min(total - 1, i)));
    shownAt.current = saat.simdi();
    setGridOpen(false);
    scrollY.setValue(0);
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
        await completeAndGo(session.sessionId, true, Boolean(p.exam || p.archiveExamId), title);
      } catch (e) {
        finishing.current = false;
        setError(e instanceof Error ? e.message : "Deneme bitirilemedi.");
        setPhase("error");
      }
    };
    if (auto || submitOpen) {
      setSubmitOpen(false);
      void run();
      return;
    }
    // Teslim onayı alt sayfa (Figma M3-e); ikinci çağrı (sayfadan "Teslim et") teslim eder.
    void blank;
    setGridOpen(false);
    setSubmitOpen(true);
  }

  /** Kurallar ekranı oynatıcıyı `replace` ile açar; geçmiş yoksa Denemeler'e döner. */
  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace(isExam ? "/(tabs)/denemeler" : "/(tabs)");
  }

  function confirmExit() {
    if (!session || phase !== "playing") {
      leave();
      return;
    }
    Alert.alert(isExam ? "Sınavdan çık?" : "Turdan çık?", isExam ? "Cevapların kaydedildi; süre dolmadan geri dönüp devam edebilirsin." : "Cevapların kaydedildi; Bugün'den kaldığın yerden devam edebilirsin.", [
      { text: "Kal", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: leave },
    ]);
  }

  const optionState = (id: string): OptionState => {
    if (isExam && !(reveal && current)) return answers[question?.questionId ?? ""] === id ? "selected" : "default";
    if (!current) return selected === id ? "selected" : "default";
    if (id === current.fb.correctOptionId) return current.selected === id ? "correct" : "missed";
    if (id === current.selected) return "incorrect";
    return "disabled";
  };

  const slices: SliceState[] = session
    ? session.questions.map((q, i) => {
        if (i === index) return "current";
        if (isExam) return flags.has(q.questionId) ? "flagged" : answers[q.questionId] ? "answered" : "future";
        const g = given[q.questionId];
        return g ? (g.fb.isCorrect ? "correct" : "wrong") : "future";
      })
    : [];

  const answeredCount = session ? session.questions.filter((q) => answers[q.questionId]).length : 0;
  const lastFive = remaining != null && remaining <= 300;
  const tools: ToolAction[] = question
    ? [
        { key: "favorite", label: "Favori", active: bookmarks.has(question.questionId), onPress: toggleBookmark },
        { key: "coach", label: "Koça sor", active: coach[question.questionId]?.status === "done", busy: coach[question.questionId]?.status === "busy", onPress: () => void askCoach() },
        { key: "report", label: "Hata bildir", onPress: () => { setReportState("idle"); setReportOpen(true); } },
      ]
    : [];
  const collapsedLabel = `${Math.min(index + 1, total)} / ${total} · ${scopeTitle}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {isExam && session && phase === "playing" ? (
        <ExamTopBar title={scopeTitle} index={Math.min(index + 1, total)} total={total} timeLabel={remaining != null ? mmss(remaining) : "Süresiz"} warning={lastFive} onClose={confirmExit} onPressCenter={() => setGridOpen(true)} />
      ) : (
      <SessionTopRow
        onClose={confirmExit}
        closeLabel={isExam ? "Sınavdan çık" : "Turdan çık"}
        label={isExam ? scopeTitle : "Alıştırma"}
        collapsedLabel={collapsedLabel}
        scrollY={scrollY}
        right={phase === "playing" ? <IconButton icon={Ellipsis} label="Seans menüsü" variant="ghost" onPress={() => setMenuOpen(true)} /> : null}
      />
      )}

      {phase === "loading" || phase === "finishing" ? (
        <View style={{ padding: space.screenGutter, gap: space.s3 }}>
          <Skeleton height={28} width="60%" radiusKey="card" />
          <Skeleton height={14} width="40%" />
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
          <Button title="Geri dön" variant="secondary" onPress={leave} />
        </View>
      ) : question ? (
        <>
          <Animated.ScrollView onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: space.screenGutter, paddingBottom: 140, gap: space.s4 }} contentInsetAdjustmentBehavior="never">
            {isExam ? (
              <>
                {lastFive ? <Notice tone="warning">Son 5 dakika. Süre dolunca cevapların otomatik teslim edilir.</Notice> : null}
                {saveState[question.questionId] === "failed" ? <Notice tone="warning">Cevap kaydedilemedi; şıkka yeniden dokun ya da bağlantıyı kontrol et.</Notice> : null}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.s2, paddingTop: space.s2 }}>
                  <AppText variant="label" tone="subtle" style={{ fontVariant: ["tabular-nums"] }}>
                    SORU {index + 1}
                  </AppText>
                  {question.course ? <Badge>{question.course}</Badge> : null}
                </View>
                <AppText variant="body" accessibilityRole="header" style={{ fontSize: Math.round(17 * scale), lineHeight: Math.round(26 * scale) }}>
                  {question.stem}
                </AppText>
              </>
            ) : (
              <>
                <SessionTitleBlock title={scopeTitle} index={Math.min(index + 1, total)} total={total} correct={kacDogru} wrong={kacYanlis} slices={slices} />
                {queuedNote ? <Notice tone="info">Çevrimdışısın; cevapların cihazda saklanıyor, bağlantı gelince gönderilecek. Geri bildirim o zaman görünür.</Notice> : null}
                <View style={{ gap: space.s3, paddingTop: space.s1 }}>
                  <QuestionMetaRow difficulty={question.difficulty} article={question.relatedArticleRef ? { label: question.relatedArticleRef.label, onPress: openArticleBeforeAnswer } : null} />
                  <QuestionStem index={index + 1} total={total} stem={question.stem} counter={false} scale={scale} />
                </View>
              </>
            )}
            <View style={{ gap: 10 }}>
              {question.options.map((o) => (
                <QuestionOption key={o.id} label={o.label} text={o.text} state={optionState(o.id)} scale={scale} onPress={() => (isExam ? pick(o.id) : void answer(o.id))} />
              ))}
            </View>
            {isExam && reveal && feedback ? <ExamFeedbackBox correctLabel={feedback.correctOptionId ? (question.options.find((o) => o.id === feedback.correctOptionId)?.label ?? null) : null} explanation={feedback.explanation} /> : null}
            {!isExam && feedback ? (
              <FeedbackPanel
                isCorrect={feedback.isCorrect}
                correctLabel={feedback.correctOptionId ? (question.options.find((o) => o.id === feedback.correctOptionId)?.label ?? null) : null}
                seconds={current?.seconds ?? null}
                explanation={current?.seconds == null && feedback.explanation == null ? undefined : feedback.explanation}
                legalReference={feedback.legalReference}
                articleLabel={feedback.relatedArticle?.text ? "Maddeyi oku" : null}
                onReadArticle={() => setArticleOpen(true)}
                coach={coach[question.questionId]}
                tools={tools}
                scale={scale}
              />
            ) : null}
          </Animated.ScrollView>

          {isExam ? (
            <ExamActionBar bottomInset={insets.bottom} flagged={flags.has(question.questionId)} onFlag={toggleFlag} onPrev={() => go(index - 1)} prevDisabled={index === 0} nextTitle={index >= total - 1 ? "Bitir" : "Sonraki"} onNext={() => (index >= total - 1 ? void finishExam() : go(index + 1))} />
          ) : current ? (
            <SessionBar variant="after" bottomInset={insets.bottom} onPrev={prev} prevDisabled={index === 0} primaryTitle={index + 1 >= total ? "Turu bitir" : "Sonraki soru"} onPrimary={next} />
          ) : index > 0 ? (
            <SessionBar variant="before" bottomInset={insets.bottom} onPrev={prev} />
          ) : null}

          {/* Seans menüsü (Figma S1b): paylaş · bildir · yazı boyu · vazgeç */}
          <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} onDismissed={onMenuDismissed} title="Seans">
            <ListRow title="Soruyu paylaş" leading={<Share2 color={colors.ink} size={20} strokeWidth={1.75} />} chevron={false} onPress={() => closeMenuThen(() => setShareOpen(true))} />
            <ListRow title="Soruyu bildir" leading={<Flag color={colors.ink} size={20} strokeWidth={1.75} />} chevron={false} onPress={() => closeMenuThen(() => { setReportState("idle"); setReportOpen(true); })} />
            <ListRow title="Yazı boyu" subtitle="Okuyucuyla ortak" leading={<ALargeSmall color={colors.ink} size={20} strokeWidth={1.75} />} trailing={<AppText variant="subhead" tone="accentInk">{SCALE_LABEL[scaleIdx]} ›</AppText>} chevron={false} onPress={cycleScale} divider={false} />
            <Button title="Vazgeç" variant="secondary" onPress={() => setMenuOpen(false)} />
          </Sheet>

          {question ? (
            <ShareQuestionSheet visible={shareOpen} onClose={() => setShareOpen(false)} answered={Boolean(current?.fb)} build={(mode) => buildShareCardData(question, current?.fb ?? null, mode)} />
          ) : null}

          {/* Hata bildir — turdan çıkmadan */}
          <Sheet visible={reportOpen} onClose={() => setReportOpen(false)} title="Soruyu bildir" footer={reportState === "done" || reportState === "already" ? <Button title="Kapat" variant="secondary" onPress={() => setReportOpen(false)} /> : <Button title="Gönder" onPress={() => void sendReport()} loading={reportState === "busy"} disabled={reportText.trim().length < 5} />}>
            {reportState === "done" ? (
              <Notice tone="success" title="Teşekkürler">Bildirimin editöre ulaştı; soru gözden geçirilecek.</Notice>
            ) : reportState === "already" ? (
              <Notice tone="info" title="Zaten bildirilmiş">Bu soru için daha önce bildirim göndermişsin.</Notice>
            ) : (
              <>
                {reportState === "error" ? <Notice tone="error">Gönderilemedi; yeniden dene.</Notice> : null}
                <TextField label="Sorun nedir?" value={reportText} onChangeText={setReportText} multiline placeholder="Yanlış cevap anahtarı, eksik şık, yazım hatası…" style={{ minHeight: 100, textAlignVertical: "top" }} maxLength={1000} />
              </>
            )}
          </Sheet>

          {(!isExam || reveal) && feedback?.relatedArticle?.text ? (
            <Sheet visible={articleOpen} onClose={() => setArticleOpen(false)} title={`Madde ${feedback.relatedArticle.no}`}>
              <AppText variant="label" tone="subtle">
                İlgili bölüm
              </AppText>
              <AppText variant="body" style={{ fontSize: Math.round(16 * scale), lineHeight: Math.round(26 * scale) }}>
                {feedback.relatedArticle.text.body}
              </AppText>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.s3, gap: space.s2 }}>
                <AppText variant="label" tone="subtle">
                  Kaynak
                </AppText>
                <AppText variant="bodySm" tone="soft">
                  {feedback.relatedArticle.text.source}
                  {feedback.relatedArticle.text.effectiveInfo ? ` · ${feedback.relatedArticle.text.effectiveInfo}` : ""}
                  {feedback.relatedArticle.text.verifiedAt ? ` · Doğrulandı: ${new Date(feedback.relatedArticle.text.verifiedAt).toLocaleDateString("tr-TR")}` : ""}
                </AppText>
                {feedback.relatedArticle.text.sourceUrl ? (
                  <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(feedback.relatedArticle!.text!.sourceUrl!)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}>
                    <AppText variant="subhead" tone="accentInk">
                      Mevzuat Bilgi Sistemi
                    </AppText>
                    <ExternalLink color={colors.accentInk} size={16} strokeWidth={1.75} />
                  </Pressable>
                ) : null}
                <AppText variant="bodySm" tone="subtle">
                  Soruyla ilgili bölüm gösteriliyor; maddenin tamamı değildir.
                </AppText>
              </View>
            </Sheet>
          ) : null}

          {isExam && session ? (
            <>
              {/* Mevcut soru cevaplıysa da "şu an" halkası önce gelir; bayrak dolu/boş'tan önce. */}
              <ExamMapSheet
                visible={gridOpen}
                onClose={() => setGridOpen(false)}
                cells={session.questions.map<ExamMapCell>((q) => (q.questionId === question?.questionId ? "current" : flags.has(q.questionId) ? "flagged" : answers[q.questionId] ? "answered" : "blank"))}
                onSelect={go}
                onSubmit={() => void finishExam()}
              />
              <ExamSubmitSheet
                visible={submitOpen}
                onClose={() => setSubmitOpen(false)}
                onSubmit={() => void finishExam()}
                answered={answeredCount}
                blank={total - answeredCount}
                flagged={flags.size}
                remainingLabel={remaining != null ? fmtDuration(remaining) : null}
                busy={finishing.current}
              />
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
