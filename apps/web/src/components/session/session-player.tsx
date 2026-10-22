"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Scale, X } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { KeyHint } from "@/components/ui/key-hint";
import { Notice } from "@/components/ui/notice";
import {
  QuestionOption,
  QuestionStem,
  type QuestionOptionState,
} from "@/components/ui/question";
import { ProgressBar, SegmentBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusFrame } from "@/components/shell/focus-frame";
import {
  FeedbackPanel,
  QuestionMetaRow,
  ResultPanel,
  SessionTitleBlock,
  type Difficulty,
  type SliceState,
  type ToolAction,
} from "./seans-kit";

/** ISO → "GG.AA.YYYY" (deterministik; locale/TZ yok → hydration güvenli). */
function fmtVerifiedDate(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}

// ── API sözleşmeleri (quiz.service ile birebir) ──
interface SessionQuestion {
  questionId: string;
  versionId: string;
  stem: string;
  mediaUrl: string | null;
  options: { id: string; label: string; text: string }[];
  /** F10-0: meta satırı; eski sunucuda yok. */
  difficulty?: Difficulty;
  /** Cevaptan ÖNCE madde bağı (yalnız alıştırma); metin yok, Atlas'a köprü. */
  relatedArticleRef?: {
    lawSlug: string;
    no: string;
    slug: string;
    label: string;
    legislationSlug: string | null;
  } | null;
}
interface StartResponse {
  sessionId: string;
  mode: string;
  plannedDurationSeconds: number | null;
  questions: SessionQuestion[];
  /** Başlık bloğu: kapsam adı ("Anayasa Hukuku", "Yanlış tekrarı"). */
  scopeName?: string | null;
}
interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  legalReference: string | null;
  /** Yapısal madde bağı — "M ile aç" inspector'ı + link için (Doc 27 §3.6).
   *  text: yayınlanmış resmî madde metni (Doc 25 §4); girilmemişse null. */
  relatedArticle: {
    lawSlug: string;
    no: string;
    slug: string;
    text: {
      body: string;
      source: string;
      sourceUrl: string | null;
      effectiveInfo: string | null;
      verifiedAt: string | null;
    } | null;
  } | null;
  source: string | null;
}
interface CompleteResponse {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number;
  durationSeconds: number;
  topicBreakdown:
    | { topicId: string; topicName: string; correct: number; total: number }[]
    | null;
  earnedBadges: { key: string; name: string }[];
}

export interface SessionScope {
  topicId?: string;
  courseId?: string;
  /** Seçili mevzuat turu (1 Eki 2026): kullanıcının işaretlediği konular. */
  topicIds?: string[];
  articleNo?: string;
  /** 'review' = yanlış tekrarı · 'favorites' = favori reçetesi; varsayılan practice. */
  mode?: "practice" | "review" | "favorites";
  /** Yarım oturumu kaldığı yerden aç (Doc 27 §2.4). */
  resumeId?: string;
  /** Üst şeritte gösterilen insan-okur kapsam etiketi. */
  label?: string;
  /** Ölçüm kanalı (sunucu enum'u): plan | course_room | topic_room … */
  source?: string;
  questionCount?: number;
}

interface ResumeResponse {
  sessionId: string;
  mode: string;
  questions: SessionQuestion[];
  scopeName?: string | null;
  givenAnswers: {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean | null;
  }[];
}

type Phase =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "playing"; data: StartResponse }
  | { kind: "finishing"; data: StartResponse }
  | { kind: "done"; result: CompleteResponse };

/**
 * Tur Oynatıcı — TEK çalışma odası (Doc 25 Karar 1, Doc 27 §3.6, wireframe 08).
 * L3 Odak: kabuk yok; klavye birincil giriş (1-4 şık, Enter sonraki, Esc çıkış).
 * Değerlendirme SUNUCUDA; istemci yalnız gösterir.
 */
export function SessionPlayer({ scope }: { scope: SessionScope }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<
    Record<
      string,
      AnswerFeedback & { selected: string; seconds?: number | null }
    >
  >({});
  // Kapsam adı (F10-0 `scopeName`); query'deki etiket öncelikli.
  const [scopeName, setScopeName] = useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<{
    questionId: string;
    optionId: string;
  } | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [exitAsk, setExitAsk] = useState(false);
  // Favoriler (F) — bookmark API'sine yazılır; oturum içi anlık durum.
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  // "M ile aç" — ilgili maddeyi sağ panelde göster (turdan çıkmadan, Doc 27 §3.6).
  const [maddeOpen, setMaddeOpen] = useState(false);
  // AI koç (Doc 28 P3-21 — mobildeki "Koça sor" web'e): yanlış cevapta
  // çeldirici analizi. Soru bazlı durum; önbellekli üretim sunucuda.
  const [aiState, setAiState] = useState<
    Record<
      string,
      | { status: "busy" }
      | {
          status: "done";
          text: string;
          cached: boolean;
          remainingToday: number | null;
        }
      | { status: "error"; message: string; limit: boolean }
    >
  >({});
  // Hata bildir (wireframe 08) — turdan ÇIKMADAN yerinde bildirim; /questions/:id/report'a yazar.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportState, setReportState] = useState<
    "idle" | "busy" | "done" | "already" | "error"
  >("idle");
  const questionShownAt = useRef(0);
  const startedRef = useRef(false);
  const answerInFlight = useRef(false);

  // ── Tur başlat ──
  useEffect(() => {
    if (startedRef.current) return; // StrictMode çift çağrısına karşı
    startedRef.current = true;
    const fail = (e: unknown) => {
      const err = e instanceof ApiClientError ? e : null;
      setPhase({
        kind: "error",
        code: err?.code ?? "UNKNOWN",
        message: err?.message ?? "Tur başlatılamadı.",
      });
    };
    if (scope.resumeId) {
      // Kaldığı yerden devam: aynı set + verilen cevaplar (Doc 27 §2.4).
      apiClient<ResumeResponse>(`/quiz/sessions/${scope.resumeId}/resume`)
        .then((res) => {
          const seeded: Record<
            string,
            AnswerFeedback & { selected: string; seconds?: number | null }
          > = {};
          setScopeName(res.scopeName ?? null);
          for (const a of res.givenAnswers) {
            if (a.selectedOptionId == null) continue;
            seeded[a.questionId] = {
              isCorrect: a.isCorrect === true,
              // Açıklama/anahtar tekrar SIZDIRILMAZ; doğruysa seçilen = doğru.
              correctOptionId: a.isCorrect === true ? a.selectedOptionId : null,
              explanation: null,
              legalReference: null,
              relatedArticle: null,
              source: null,
              selected: a.selectedOptionId,
            };
          }
          setFeedback(seeded);
          const firstUnanswered = res.questions.findIndex(
            (q) => !seeded[q.questionId],
          );
          setIndex(
            firstUnanswered >= 0 ? firstUnanswered : res.questions.length - 1,
          );
          questionShownAt.current = Date.now();
          setPhase({
            kind: "playing",
            data: {
              sessionId: res.sessionId,
              mode: res.mode,
              plannedDurationSeconds: null,
              questions: res.questions,
            },
          });
        })
        .catch(fail);
      return;
    }
    // Favori reçetesi practice + fromBookmarks olarak gider (ayrı enum yok).
    const isFav = scope.mode === "favorites";
    apiClient<StartResponse>("/quiz/sessions", {
      method: "POST",
      body: {
        mode: isFav ? "practice" : (scope.mode ?? "practice"),
        ...(isFav ? { fromBookmarks: true } : {}),
        ...(scope.topicId ? { topicId: scope.topicId } : {}),
        ...(scope.courseId ? { courseId: scope.courseId } : {}),
        ...(scope.topicIds ? { topicIds: scope.topicIds } : {}),
        ...(scope.articleNo ? { articleNo: scope.articleNo } : {}),
        ...(scope.source ? { source: scope.source } : {}),
        questionCount: scope.questionCount ?? 10,
      },
    })
      .then((data) => {
        questionShownAt.current = Date.now();
        setScopeName(data.scopeName ?? null);
        setPhase({ kind: "playing", data });
      })
      .catch(fail);
  }, [scope]);

  // Favori durumunu tohumla — önceden yıldızlanmış sorular bu turda da ★ görünsün.
  // (Aksi halde bookmarks boş başlar ve favorideki soru "☆ Favorile" görünürdü.)
  useEffect(() => {
    let alive = true;
    apiClient<{ questionId: string }[]>("/review/bookmarks")
      .then((rows) => {
        if (!alive) return;
        const ids = rows.map((r) => r.questionId);
        setBookmarks((s) => new Set([...s, ...ids]));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const data =
    phase.kind === "playing" || phase.kind === "finishing" ? phase.data : null;
  const question = data?.questions[index] ?? null;

  const currentFeedback = question ? feedback[question.questionId] : undefined;
  const answeredCount = data ? Object.keys(feedback).length : 0;
  const isLast = data != null && index === data.questions.length - 1;

  // ── Cevap gönder (tıklama veya klavye) ──
  const submit = useCallback(
    async (optionId: string) => {
      if (!data || !question || currentFeedback || answerInFlight.current)
        return;
      answerInFlight.current = true;
      setAnswerError(null);
      setPendingAnswer({ questionId: question.questionId, optionId });
      const spentMs = Date.now() - questionShownAt.current;
      try {
        const fb = await apiClient<AnswerFeedback>(
          `/quiz/sessions/${data.sessionId}/answers`,
          {
            method: "POST",
            body: {
              questionId: question.questionId,
              questionVersionId: question.versionId,
              selectedOptionId: optionId,
              timeSpentMs: spentMs,
            },
          },
        );
        setFeedback((f) => ({
          ...f,
          [question.questionId]: {
            ...fb,
            selected: optionId,
            seconds: Math.max(1, Math.round(spentMs / 1000)),
          },
        }));
      } catch (e: unknown) {
        const err = e instanceof ApiClientError ? e : null;
        if (err?.code === "DAILY_LIMIT_REACHED") {
          setPhase({ kind: "error", code: err.code, message: err.message });
        } else {
          setAnswerError(
            err?.message ?? "Cevap kaydedilemedi. Tekrar deneyebilirsin.",
          );
        }
      } finally {
        answerInFlight.current = false;
        setPendingAnswer(null);
      }
    },
    [data, question, currentFeedback],
  );

  // ── Bitir ──
  const complete = useCallback(async () => {
    if (!data) return;
    setPhase({ kind: "finishing", data });
    try {
      const result = await apiClient<CompleteResponse>(
        `/quiz/sessions/${data.sessionId}/complete`,
        { method: "POST" },
      );
      setPhase({ kind: "done", result });
    } catch {
      setPhase({ kind: "playing", data });
    }
  }, [data]);

  const next = useCallback(() => {
    if (!data || !currentFeedback) return;
    if (isLast) {
      void complete();
    } else {
      setIndex((i) => i + 1);
      setMaddeOpen(false); // sonraki soruda inspector kapanır
      setReportOpen(false); // hata bildir paneli de kapanır
      setReportText("");
      setReportState("idle");
      setAnswerError(null);
      questionShownAt.current = Date.now();
    }
  }, [data, currentFeedback, isLast, complete]);

  // "Önceki": cevaplanmış soruyu salt okunur gösterir (cevap değiştirilemez).
  const prev = useCallback(() => {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setMaddeOpen(false);
    setReportOpen(false);
  }, [index]);

  // ── Favorile (F) — bookmark API'sine yazar (Doc 26 #7, wireframe 08) ──
  const toggleBookmark = useCallback(
    (questionId: string) => {
      const has = bookmarks.has(questionId);
      // İyimser güncelleme; hata olursa geri al.
      setBookmarks((s) => {
        const n = new Set(s);
        if (has) n.delete(questionId);
        else n.add(questionId);
        return n;
      });
      apiClient(`/review/bookmarks/${questionId}`, {
        method: has ? "DELETE" : "POST",
      }).catch(() => {
        setBookmarks((s) => {
          const n = new Set(s);
          if (has) n.add(questionId);
          else n.delete(questionId);
          return n;
        });
      });
    },
    [bookmarks],
  );

  // ── AI koç: "Neden yanlış?" — /ai/explain (önbellekli; free 3/gün) ──
  const askCoach = useCallback(
    async (q: SessionQuestion, chosenOptionId: string) => {
      if (aiState[q.questionId]?.status === "busy") return;
      setAiState((s) => ({ ...s, [q.questionId]: { status: "busy" } }));
      try {
        const res = await apiClient<{
          text: string;
          cached: boolean;
          remainingToday: number | null;
        }>("/ai/explain", {
          method: "POST",
          body: { versionId: q.versionId, chosenOptionId },
        });
        setAiState((s) => ({
          ...s,
          [q.questionId]: { status: "done", ...res },
        }));
      } catch (e: unknown) {
        const err = e instanceof ApiClientError ? e : null;
        setAiState((s) => ({
          ...s,
          [q.questionId]: {
            status: "error",
            limit: err?.code === "AI_LIMIT_REACHED",
            message: err?.message ?? "Koça şu an ulaşılamadı — tekrar dene.",
          },
        }));
      }
    },
    [aiState],
  );

  // ── Hata bildir — mevcut soruyu /questions/:id/report'a bildirir; turdan çıkmaz ──
  const submitReport = useCallback(
    async (questionId: string) => {
      const msg = reportText.trim();
      if (msg.length < 5) return;
      setReportState("busy");
      try {
        const res = await apiClient<{ alreadyReported: boolean }>(
          `/questions/${questionId}/report`,
          { method: "POST", body: { message: msg } },
        );
        setReportState(res.alreadyReported ? "already" : "done");
        setReportText("");
      } catch {
        setReportState("error");
      }
    },
    [reportText],
  );

  // ── Klavye (Doc 27 §2.2): 1-4/A-D şık · Enter sonraki · Esc çıkış ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase.kind !== "playing" || exitAsk) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Not alanı vb. form elemanlarında yazarken kısayollar devreye girmez.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      const q = phase.data.questions[index];
      if (!q) return;
      if (e.key === "Escape") {
        setExitAsk(true);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        next();
        return;
      }
      const low = e.key.toLocaleLowerCase("tr-TR");
      if (low === "f") {
        toggleBookmark(q.questionId);
        return;
      }
      // M — ilgili maddeyi sağ panelde aç (yalnız cevaplanmış + madde bağı varsa).
      if (low === "m" && feedback[q.questionId]?.relatedArticle) {
        setMaddeOpen((v) => !v);
        return;
      }
      if (feedback[q.questionId]) return;
      const num = Number.parseInt(e.key, 10);
      let opt: { id: string } | undefined;
      if (num >= 1 && num <= q.options.length) opt = q.options[num - 1];
      else {
        const letter = e.key.toLocaleUpperCase("tr-TR");
        opt = q.options.find(
          (o) => o.label.toLocaleUpperCase("tr-TR") === letter,
        );
      }
      if (opt) void submit(opt.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, index, feedback, exitAsk, next, submit, toggleBookmark]);

  // ═══ Görünümler ═══

  if (phase.kind === "loading") {
    return (
      <FocusFrame context={scope.label ?? "Koç turu"} exitHref="/bugun">
        <div className="flex flex-col gap-3 py-6" aria-busy>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-2/3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14" radius="card" />
          ))}
        </div>
      </FocusFrame>
    );
  }

  if (phase.kind === "error") {
    const isLimit = phase.code === "DAILY_LIMIT_REACHED";
    // Premium kapısı (Doc 8): seçili mevzuat/konu premium'a aitse sunucu reddeder;
    // burada suçlayıcı değil yönlendirici dil + Premium köprüsü.
    const isPremium = phase.code === "PREMIUM_REQUIRED";
    return (
      <FocusFrame context={scope.label ?? "Koç turu"} exitHref="/bugun">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
          <Badge tone={isLimit ? "accent" : isPremium ? "neutral" : "danger"}>
            {isLimit ? "Günlük hak" : isPremium ? "Premium" : "Hata"}
          </Badge>
          <h1 className="type-heading text-ink">
            {isLimit
              ? "Bugünlük antrenman doldu"
              : isPremium
                ? "Bu kapsam Premium'a ait"
                : "Bir sorun çıktı"}
          </h1>
          <p className="type-body text-ink-soft">
            {isLimit
              ? "Koç seni durdurmak istemiyor — ama ücretsiz günlük hak burada bitiyor. Premium'la sınır kalkar; emeğin ve haritan seni bekliyor."
              : phase.message}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/bugun"
              variant={isLimit || isPremium ? "secondary" : "primary"}
            >
              Bugün&apos;e dön
            </ButtonLink>
            {(isLimit || isPremium) && (
              <ButtonLink href="/premium">Premium&apos;u incele</ButtonLink>
            )}
          </div>
        </div>
      </FocusFrame>
    );
  }

  if (phase.kind === "done") {
    // Bu turda karşılaşılan tekil maddeler (İlgili maddeleri oku için).
    const seenArticles = new Map<
      string,
      { lawSlug: string; no: string; slug: string }
    >();
    for (const f of Object.values(feedback)) {
      if (f.relatedArticle)
        seenArticles.set(
          `${f.relatedArticle.lawSlug}/${f.relatedArticle.slug}`,
          f.relatedArticle,
        );
    }
    return (
      <SessionResult
        result={phase.result}
        scopeLabel={scope.label}
        isReview={scope.mode === "review"}
        articles={[...seenArticles.values()]}
        repeatHref={
          scope.topicIds && scope.topicIds.length > 0
            ? `/seans?topicIds=${scope.topicIds.join(",")}&count=${
                scope.questionCount ?? 15
              }&scope=${encodeURIComponent(scope.label ?? "Seçili mevzuat")}`
            : undefined
        }
      />
    );
  }

  // playing / finishing
  const fb = currentFeedback;

  const total = data!.questions.length;
  const context =
    scope.label ??
    (scope.mode === "review"
      ? "Yanlış tekrarı — en eski yanlışların önce"
      : scope.mode === "favorites"
        ? "Favorilerim — yıldızladığın sorular"
        : "Koç turu — zayıf konuların, yanlışların ve yeni sorular");
  const titleText =
    scope.label ??
    scopeName ??
    (scope.mode === "review"
      ? "Yanlış tekrarı"
      : scope.mode === "favorites"
        ? "Favorilerim"
        : "Koç turu");
  const dogruSayisi = Object.values(feedback).filter((f) => f.isCorrect).length;
  const yanlisSayisi = answeredCount - dogruSayisi;
  const slices: SliceState[] = data!.questions.map((q, i) => {
    if (i === index) return "current";
    const f = feedback[q.questionId];
    return f ? (f.isCorrect ? "correct" : "wrong") : "future";
  });
  const favoride = bookmarks.has(question!.questionId);
  const aiNow = aiState[question!.questionId];
  const araclar: ToolAction[] = [
    {
      key: "favorite",
      label: favoride ? "Favoride" : "Favori",
      active: favoride,
      hint: "F",
      onClick: () => toggleBookmark(question!.questionId),
    },
    {
      key: "coach",
      label: "Koça sor",
      active: aiNow?.status === "done",
      busy: aiNow?.status === "busy",
      onClick: () => {
        if (fb && !aiNow) void askCoach(question!, fb.selected);
      },
    },
    {
      key: "report",
      label: "Hata bildir",
      active: reportOpen,
      onClick: () => {
        setReportOpen((v) => !v);
        if (!reportOpen) setReportState("idle");
      },
    },
  ];
  const yanPanel = (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2">
        <span className="type-label text-ink-subtle">Tur akışı</span>
        <div className="grid grid-cols-5 gap-1.5" aria-hidden>
          {data!.questions.map((q, i) => {
            const f = feedback[q.questionId];
            return (
              <span
                key={q.questionId}
                className={cn(
                  "grid aspect-square place-items-center rounded-control text-[11px] font-semibold",
                  i === index && "ring-2 ring-accent",
                  f
                    ? f.isCorrect
                      ? "bg-success-soft text-success-ink"
                      : "bg-danger-soft text-danger-ink"
                    : "bg-surface-alt text-ink-soft",
                )}
              >
                {f ? (f.isCorrect ? "✓" : "✗") : i + 1}
              </span>
            );
          })}
        </div>
        <p className="type-body-sm tabular text-ink-soft">
          {answeredCount} cevaplandı
        </p>
      </Card>

      {maddeOpen && fb?.relatedArticle ? (
        <Card className="flex flex-col gap-1 border-accent/40">
          <div className="flex items-start justify-between gap-2">
            <span className="type-label inline-flex items-center gap-1 text-accent-ink">
              <Scale size={12} aria-hidden /> İlgili madde ·{" "}
              {fb.relatedArticle.no}
            </span>
            <button
              type="button"
              onClick={() => setMaddeOpen(false)}
              aria-label="Kapat"
              className="text-ink-subtle hover:text-ink"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          {fb.legalReference ? (
            <p className="type-body-sm text-ink-soft">{fb.legalReference}</p>
          ) : null}
          <Link
            href={`/kanun/${fb.relatedArticle.lawSlug}/madde/${fb.relatedArticle.slug}`}
            target="_blank"
            className="type-subhead mt-1 inline-flex items-center gap-1 text-accent-ink hover:underline"
          >
            Maddeyi Atlas&apos;ta aç <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      ) : null}

      <p className="type-body-sm text-ink-subtle">
        1–5 şık · ⏎ sonraki · F favori · M madde · Esc çıkış
      </p>
    </div>
  );

  return (
    <FocusFrame
      context={context}
      progress={
        <div className="flex items-center gap-3">
          <SegmentBar total={total} done={answeredCount} className="w-32" />
          <span className="type-body-sm tabular text-ink-soft">
            {Math.min(index + 1, total)}/{total}
          </span>
        </div>
      }
      onExit={() => setExitAsk(true)}
      aside={yanPanel}
    >
      <div className="flex flex-col gap-5">
        <SessionTitleBlock
          title={titleText}
          index={Math.min(index + 1, total)}
          total={total}
          correct={dogruSayisi}
          wrong={yanlisSayisi}
          slices={slices}
        />
        <div className="flex flex-col gap-3">
          <QuestionMetaRow
            difficulty={question!.difficulty}
            article={
              question!.relatedArticleRef
                ? {
                    label: question!.relatedArticleRef.label,
                    href: `/kanun/${question!.relatedArticleRef.lawSlug}/madde/${question!.relatedArticleRef.slug}`,
                  }
                : null
            }
          />
          <QuestionStem
            index={index + 1}
            total={total}
            stem={question!.stem}
            counter={false}
          />
        </div>
        {question!.mediaUrl && (
          // Soru medyası keyfi bir saklı URL'dir (bilinmeyen host) — next/image
          // optimizer'ını her host'a açmak güvenlik anti-pattern'i olurdu; bunun
          // yerine ham <img> sertleştirilir (lazy + async decode, CLS güvenli).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question!.mediaUrl}
            alt="Soru görseli"
            loading="lazy"
            decoding="async"
            className="max-h-72 rounded-card border border-line"
          />
        )}

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label={`Soru ${index + 1} şıkları`}
        >
          {question!.options.map((o, i) => {
            let state: QuestionOptionState = "default";
            if (fb) {
              if (o.id === fb.correctOptionId)
                state = o.id === fb.selected ? "correct" : "missed";
              else if (o.id === fb.selected) state = "incorrect";
              else state = "disabled";
            } else if (pendingAnswer?.questionId === question!.questionId) {
              state = o.id === pendingAnswer.optionId ? "selected" : "disabled";
            }
            return (
              <QuestionOption
                key={o.id}
                label={o.label}
                text={o.text}
                state={state}
                keyHint={String(i + 1)}
                onSelect={
                  !fb && pendingAnswer == null
                    ? () => void submit(o.id)
                    : undefined
                }
              />
            );
          })}
        </div>

        {pendingAnswer?.questionId === question!.questionId && (
          <p
            className="type-body-sm text-ink-soft"
            role="status"
            aria-live="polite"
          >
            Cevabın kontrol ediliyor…
          </p>
        )}
        {answerError && <Notice tone="error">{answerError}</Notice>}

        {fb ? (
          <div className="flex flex-col gap-4">
            <FeedbackPanel
              isCorrect={fb.isCorrect}
              correctLabel={
                fb.correctOptionId
                  ? (question!.options.find((o) => o.id === fb.correctOptionId)
                      ?.label ?? null)
                  : null
              }
              seconds={fb.seconds ?? null}
              // Devam edilen turda açıklama sızdırılmaz → "açıklamasız" varyant.
              explanation={
                fb.seconds == null && fb.explanation == null
                  ? undefined
                  : fb.explanation
              }
              legalReference={fb.legalReference}
              articleLabel={fb.relatedArticle ? "Maddeyi oku" : null}
              onReadArticle={() => setMaddeOpen((v) => !v)}
              coach={
                aiNow
                  ? aiNow.status === "busy"
                    ? { status: "busy" }
                    : aiNow.status === "error"
                      ? {
                          status: "error",
                          message: (
                            <>
                              {aiNow.message}
                              {aiNow.limit ? (
                                <>
                                  {" "}
                                  <Link
                                    href="/premium"
                                    className="font-semibold text-accent hover:underline"
                                  >
                                    Premium&apos;la sınırsız
                                  </Link>
                                </>
                              ) : null}
                            </>
                          ),
                        }
                      : {
                          status: "done",
                          text: aiNow.text,
                          remainingToday: aiNow.remainingToday,
                        }
                  : undefined
              }
              tools={araclar}
            />
            {/* İlgili maddenin resmî metni (Doc 25 §4) — Figma "Madde Sheet'i" karşılığı:
                yayınlanmışsa panelin altında; İlgili bölüm · Kaynak · MBS bağlantısı. */}
            {fb.relatedArticle?.text && (
              <Card className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="type-heading text-ink">
                    Madde {fb.relatedArticle.no}
                  </span>
                  <Link
                    href={`/kanun/${fb.relatedArticle.lawSlug}/madde/${fb.relatedArticle.slug}`}
                    target="_blank"
                    className="type-body-sm inline-flex items-center gap-1 text-accent-ink hover:underline"
                  >
                    Atlas&apos;ta aç <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
                <span className="type-label text-ink-subtle">İlgili bölüm</span>
                <div className="type-body whitespace-pre-line text-ink">
                  {fb.relatedArticle.text.body}
                </div>
                <div className="flex flex-col gap-1 border-t border-line pt-3">
                  <span className="type-label text-ink-subtle">Kaynak</span>
                  <p className="type-body-sm text-ink-soft">
                    {fb.relatedArticle.text.source}
                    {fb.relatedArticle.text.effectiveInfo ? (
                      <> · {fb.relatedArticle.text.effectiveInfo}</>
                    ) : null}
                    {fb.relatedArticle.text.verifiedAt ? (
                      <>
                        {" "}
                        · {fmtVerifiedDate(
                          fb.relatedArticle.text.verifiedAt,
                        )}{" "}
                        itibarıyla
                      </>
                    ) : null}
                  </p>
                  {fb.relatedArticle.text.sourceUrl ? (
                    <a
                      href={fb.relatedArticle.text.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-subhead inline-flex min-h-8 items-center gap-1 text-accent-ink hover:underline"
                    >
                      Mevzuat Bilgi Sistemi <ArrowRight size={14} aria-hidden />
                    </a>
                  ) : null}
                  <p className="type-body-sm text-ink-subtle">
                    Soruyla ilgili bölüm gösteriliyor; maddenin tamamı değildir.
                  </p>
                </div>
              </Card>
            )}
            {/* Yerinde hata bildir paneli — turdan çıkmadan (Doc 27 §3.6) */}
            {reportOpen && (
              <Card tone="alt" className="flex flex-col gap-2">
                {reportState === "done" || reportState === "already" ? (
                  <p className="type-body-sm text-success-ink" role="status">
                    {reportState === "already"
                      ? "Bu soruyu zaten bildirmiştin — teşekkürler."
                      : "Bildirimin alındı. Editör ekibi inceleyecek, teşekkürler."}
                  </p>
                ) : (
                  <>
                    <label
                      htmlFor="report-message"
                      className="type-subhead text-ink"
                    >
                      Bu soruda ne yanlış?
                    </label>
                    <textarea
                      id="report-message"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      rows={2}
                      maxLength={500}
                      placeholder="ör. cevap anahtarı yanlış, yazım hatası, şık eksik…"
                      className="type-body-sm w-full rounded-control border border-line bg-surface px-2.5 py-2 text-ink outline-none placeholder:text-ink-subtle focus:border-ink-soft"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => submitReport(question!.questionId)}
                        disabled={
                          reportText.trim().length < 5 || reportState === "busy"
                        }
                        loading={reportState === "busy"}
                      >
                        Bildir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReportOpen(false)}
                      >
                        Vazgeç
                      </Button>
                      {reportState === "error" && (
                        <span className="type-body-sm text-danger-ink">
                          Gönderilemedi, tekrar dene.
                        </span>
                      )}
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        ) : null}

        {/* Alt çubuk (Figma AltÇubuk): cevaptan önce yalnız "Önceki"; sonra Önceki + birincil. */}
        {fb || index > 0 ? (
          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-bg px-4 py-3 md:-mx-6 md:px-6">
            {index > 0 ? (
              <Button variant="ghost" onClick={prev} className="text-ink-soft">
                <ChevronLeft size={18} aria-hidden /> Önceki
              </Button>
            ) : null}
            {fb ? (
              <Button
                size="lg"
                onClick={next}
                disabled={phase.kind === "finishing"}
                className="ml-auto flex-1 sm:flex-none sm:min-w-56"
              >
                {isLast ? "Turu bitir" : "Sonraki soru"} <KeyHint keys="⏎" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Çıkış diyaloğu — ilerleme kaybolmaz (cevaplar sunucuda) */}
      <Dialog
        open={exitAsk}
        onClose={() => setExitAsk(false)}
        title="Turdan çıkıyor musun?"
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setExitAsk(false)}>
              Devam et
            </Button>
            {answeredCount > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setExitAsk(false);
                  void complete();
                }}
              >
                Bitir ve sonucu gör
              </Button>
            )}
            <Button variant="destructive" onClick={() => router.push("/bugun")}>
              Çık
            </Button>
          </div>
        }
      >
        <p className="type-body text-ink-soft">
          Cevapların kaydedildi; hedefe sayılması için turun tamamlanması
          gerekir.
        </p>
      </Dialog>
    </FocusFrame>
  );
}

/** Tur Sonucu (Doc 27 §3.7): skor + koç yorumu + konu kırılımı + tek eve dönüş çapası. */
function SessionResult({
  result,
  scopeLabel,
  isReview,
  articles,
  repeatHref,
}: {
  result: CompleteResponse;
  scopeLabel?: string;
  isReview: boolean;
  articles: { lawSlug: string; no: string; slug: string }[];
  /** Aynı kapsamla taze tur adresi (seçili mevzuat); yoksa düğme çıkmaz. */
  repeatHref?: string;
}) {
  const router = useRouter();
  const pct =
    result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : null;
  const dk = Math.floor(result.durationSeconds / 60);
  const sn = result.durationSeconds % 60;
  const sure = dk > 0 ? `${dk} dk ${sn} sn` : `${sn} sn`;
  const weakest = result.topicBreakdown
    ?.filter((t) => t.total >= 2)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  return (
    <FocusFrame context="Tur özeti" exitHref="/bugun" wide>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.2fr] lg:[&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="type-title text-ink">Bir tur daha tamam.</h1>
            <p className="type-body-sm text-ink-soft">
              {[scopeLabel ?? "Koç turu", `${result.totalQuestions} soru`].join(
                " · ",
              )}
            </p>
          </div>
          <ResultPanel
            correct={result.correctCount}
            total={result.totalQuestions}
            pct={pct}
            durationLabel={sure}
          />
          {result.earnedBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="type-label text-ink-subtle">Yeni rozet</span>
              {result.earnedBadges.map((b) => (
                <Badge key={b.key} tone="accent">
                  {b.name}
                </Badge>
              ))}
            </div>
          )}

          <Card className="flex flex-col gap-1 border-accent/40">
            <span className="type-label text-accent-ink">Koç</span>
            <p className="type-body text-ink">
              {result.wrongCount > 0
                ? `${result.wrongCount} yanlışını yanlış havuzuna ekledim — tekrarında karşına çıkacaklar.`
                : "Tam isabet. Yarın yeni sorularla devam."}
              {weakest && weakest.correct / weakest.total < 0.6 && (
                <>
                  {" "}
                  En çok {weakest.topicName} zorladı ({weakest.correct}/
                  {weakest.total}).
                </>
              )}
            </p>
          </Card>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/bugun" size="lg">
              Bugün&apos;e dön
            </ButtonLink>
            {result.wrongCount > 0 && !isReview && (
              <ButtonLink
                href={`/seans?mode=review&scope=${encodeURIComponent("Yanlış tekrarı")}`}
                variant="secondary"
                size="lg"
              >
                Yanlışları şimdi tekrar et
              </ButtonLink>
            )}
            {/* Değişen `n` nonce'u → yeni URL + yeni key → oynatıcı remount → taze tur. */}
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/seans?n=${Date.now()}`)}
            >
              Yeni tur
            </Button>
            {repeatHref && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push(`${repeatHref}&n=${Date.now()}`)}
              >
                Aynı seçimle yeni tur
              </Button>
            )}
          </div>

          {articles.length > 0 && (
            <Card className="flex flex-col gap-2">
              <span className="type-label text-ink-subtle">
                İlgili maddeleri oku
              </span>
              <div className="flex flex-wrap gap-2">
                {articles.slice(0, 6).map((a) => (
                  <Link
                    key={`${a.lawSlug}/${a.slug}`}
                    href={`/kanun/${a.lawSlug}/madde/${a.slug}`}
                    className="inline-flex h-9 items-center gap-1 rounded-pill border border-line px-3 text-[13px] font-semibold text-accent-ink hover:border-ink-soft"
                  >
                    <Scale size={14} aria-hidden /> madde {a.no}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="flex flex-col gap-2">
          <span className="type-label text-ink-subtle">Konu kırılımı</span>
          {result.topicBreakdown && result.topicBreakdown.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {result.topicBreakdown.map((t) => {
                const ratio = t.total > 0 ? t.correct / t.total : 0;
                return (
                  <li
                    key={t.topicId}
                    className="flex flex-col gap-2 py-1"
                    aria-label={`${t.topicName}: ${t.correct} / ${t.total}`}
                  >
                    <div className="flex justify-between gap-3">
                      <span className="type-body text-ink">{t.topicName}</span>
                      <span className="type-body tabular shrink-0 text-ink-soft">
                        {t.correct}/{t.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={ratio}
                      tone={
                        ratio >= 0.75
                          ? "success"
                          : ratio >= 0.5
                            ? "accent"
                            : "danger"
                      }
                      height={2}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="type-body-sm text-ink-soft">
              Tek konuluk tur — kırılım yok. Doğru {result.correctCount}, yanlış{" "}
              {result.wrongCount}, boş {result.blankCount}.
            </p>
          )}
        </Card>
      </div>
    </FocusFrame>
  );
}
