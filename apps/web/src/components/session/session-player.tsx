"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Brain,
  Flag,
  Scale,
  X,
} from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ExplanationBox } from "@/components/ui/explanation-box";
import { KeyHint } from "@/components/ui/key-hint";
import { Notice } from "@/components/ui/notice";
import {
  QuestionOption,
  QuestionStem,
  type QuestionOptionState,
} from "@/components/ui/question";
import { SegmentBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusFrame } from "@/components/shell/focus-frame";

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
}
interface StartResponse {
  sessionId: string;
  mode: string;
  plannedDurationSeconds: number | null;
  questions: SessionQuestion[];
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
    Record<string, AnswerFeedback & { selected: string }>
  >({});
  const [pendingAnswer, setPendingAnswer] = useState<{
    questionId: string;
    optionId: string;
  } | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [exitAsk, setExitAsk] = useState(false);
  // Soru notu (Doc 49 S1-C): kullanıcının soruya kişisel notu; sunucuda KALICI
  // (PUT /me/questions/:id/note, 800 ms gecikmeli). Soru başına tutulur.
  const [notes, setNotes] = useState<Record<string, string>>({});
  // Not kayıt durumu soru başına tutulur: soru değişince sıfırlamak gerekmez.
  const [noteStates, setNoteStates] = useState<
    Record<string, "saving" | "saved" | "error">
  >({});
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          const seeded: Record<string, AnswerFeedback & { selected: string }> =
            {};
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
  const currentQuestionId = question?.questionId ?? null;

  // Soru değişince kayıtlı notu getir (bir kez; bellekte varsa istek yok).
  useEffect(() => {
    if (!currentQuestionId) return;
    let alive = true;
    apiClient<{ text: string | null }>(
      `/me/questions/${currentQuestionId}/note`,
    )
      .then((r) => {
        if (!alive || r.text == null) return;
        setNotes((n) =>
          n[currentQuestionId] != null
            ? n
            : { ...n, [currentQuestionId]: r.text! },
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentQuestionId]);

  const noteDegisti = useCallback((questionId: string, text: string) => {
    setNotes((n) => ({ ...n, [questionId]: text }));
    setNoteStates((st) => ({ ...st, [questionId]: "saving" }));
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      const istek =
        text.trim().length === 0
          ? apiClient(`/me/questions/${questionId}/note`, { method: "DELETE" })
          : apiClient(`/me/questions/${questionId}/note`, {
              method: "PUT",
              body: { text: text.slice(0, 2000) },
            });
      istek
        .then(() => setNoteStates((st) => ({ ...st, [questionId]: "saved" })))
        .catch(() => setNoteStates((st) => ({ ...st, [questionId]: "error" })));
    }, 800);
  }, []);
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
      try {
        const fb = await apiClient<AnswerFeedback>(
          `/quiz/sessions/${data.sessionId}/answers`,
          {
            method: "POST",
            body: {
              questionId: question.questionId,
              questionVersionId: question.versionId,
              selectedOptionId: optionId,
              timeSpentMs: Date.now() - questionShownAt.current,
            },
          },
        );
        setFeedback((f) => ({
          ...f,
          [question.questionId]: { ...fb, selected: optionId },
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

      <Card className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="soru-notu" className="type-label text-ink-subtle">
            Notum
          </label>
          <span className="type-body-sm text-ink-subtle" aria-live="polite">
            {noteStates[question!.questionId] === "saving"
              ? "kaydediliyor…"
              : noteStates[question!.questionId] === "saved"
                ? "kaydedildi"
                : noteStates[question!.questionId] === "error"
                  ? "kaydedilemedi"
                  : ""}
          </span>
        </div>
        <textarea
          id="soru-notu"
          value={notes[question!.questionId] ?? ""}
          onChange={(e) => noteDegisti(question!.questionId, e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Bu soruya özel notun — hesabında saklanır"
          rows={3}
          maxLength={2000}
          className="type-body-sm w-full resize-y rounded-control border border-line bg-surface-alt p-2.5 text-ink outline-none placeholder:text-ink-subtle focus:border-ink-soft"
        />
      </Card>
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
        <QuestionStem index={index + 1} total={total} stem={question!.stem} />
        <div className="hidden"></div>
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

        {fb && (
          <div className="flex flex-col gap-4">
            <ExplanationBox
              isCorrect={fb.isCorrect}
              explanation={fb.explanation}
              source={fb.source}
              legalReference={fb.legalReference}
              lawHref={
                fb.relatedArticle
                  ? `/kanun/${fb.relatedArticle.lawSlug}/madde/${fb.relatedArticle.slug}`
                  : null
              }
            />
            {/* İlgili maddenin resmî metni (Doc 25 §4) — açıklamanın hemen altında,
                yayınlanmışsa otomatik; birebir metin + kaynak künyesi. */}
            {fb.relatedArticle?.text && (
              <Card className="flex flex-col gap-2 border-accent/40">
                <span className="type-label inline-flex items-center gap-1 text-accent-ink">
                  <Scale size={12} aria-hidden /> İlgili madde ·{" "}
                  {fb.relatedArticle.no}
                </span>
                <div className="type-body-sm whitespace-pre-line text-ink">
                  {fb.relatedArticle.text.body}
                </div>
                <p className="type-body-sm text-ink-subtle">
                  Kaynak:{" "}
                  {fb.relatedArticle.text.sourceUrl ? (
                    <a
                      href={fb.relatedArticle.text.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-ink"
                    >
                      {fb.relatedArticle.text.source}
                    </a>
                  ) : (
                    fb.relatedArticle.text.source
                  )}
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
              </Card>
            )}
            {/* AI koç (Doc 28 P3-21): yalnız yanlış cevapta — "neden bu çeldirici?" */}
            {!fb.isCorrect &&
              (() => {
                const ai = aiState[question!.questionId];
                if (!ai) {
                  return (
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      leadingIcon={<Brain size={18} aria-hidden />}
                      onClick={() => askCoach(question!, fb.selected)}
                    >
                      Koça sor: Neden yanlış?
                    </Button>
                  );
                }
                if (ai.status === "busy") {
                  return (
                    <p
                      className="type-body-sm rounded-card bg-surface-alt px-4 py-3 text-ink-soft"
                      role="status"
                      aria-live="polite"
                    >
                      Koç düşünüyor…
                    </p>
                  );
                }
                if (ai.status === "error") {
                  return (
                    <Notice tone="info">
                      {ai.message}
                      {ai.limit && (
                        <>
                          {" "}
                          <Link
                            href="/premium"
                            className="font-semibold text-accent-ink hover:underline"
                          >
                            Premium&apos;la sınırsız
                          </Link>
                        </>
                      )}
                    </Notice>
                  );
                }
                return (
                  <Card className="flex flex-col gap-2 border-accent/40">
                    <span className="type-label inline-flex items-center gap-1 text-accent-ink">
                      <Brain size={12} aria-hidden /> Koç · çeldirici analizi
                    </span>
                    <div className="type-body-sm whitespace-pre-line text-ink">
                      {ai.text}
                    </div>
                    {ai.remainingToday != null && (
                      <p className="type-body-sm text-ink-subtle">
                        Bugün kalan koç hakkı: {ai.remainingToday}
                      </p>
                    )}
                  </Card>
                );
              })()}
            {/* Aksiyon ucu: favorile (F) · madde aç (M) · hata bildir */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant={
                  bookmarks.has(question!.questionId) ? "primary" : "secondary"
                }
                aria-pressed={bookmarks.has(question!.questionId)}
                leadingIcon={
                  bookmarks.has(question!.questionId) ? (
                    <BookmarkCheck size={16} aria-hidden />
                  ) : (
                    <Bookmark size={16} aria-hidden />
                  )
                }
                onClick={() => toggleBookmark(question!.questionId)}
              >
                {bookmarks.has(question!.questionId) ? "Favoride" : "Favorile"}{" "}
                <KeyHint keys="F" />
              </Button>
              {fb.relatedArticle && (
                <Button
                  size="sm"
                  variant={maddeOpen ? "primary" : "secondary"}
                  aria-pressed={maddeOpen}
                  leadingIcon={<Scale size={16} aria-hidden />}
                  onClick={() => setMaddeOpen((v) => !v)}
                >
                  Madde {fb.relatedArticle.no} <KeyHint keys="M" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={reportOpen}
                leadingIcon={<Flag size={16} aria-hidden />}
                onClick={() => {
                  setReportOpen((v) => !v);
                  if (!reportOpen) setReportState("idle");
                }}
              >
                Hata bildir
              </Button>
            </div>
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
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={next}
                disabled={phase.kind === "finishing"}
              >
                {isLast ? "Turu bitir" : "Sonraki soru"} <KeyHint keys="⏎" />
              </Button>
            </div>
          </div>
        )}
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
      : 0;
  const minutes = Math.max(1, Math.round(result.durationSeconds / 60));
  const weakest = result.topicBreakdown
    ?.filter((t) => t.total >= 2)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  return (
    <FocusFrame context={scopeLabel ?? "Tur sonucu"} exitHref="/bugun" wide>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.2fr] lg:[&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center gap-1 p-6 text-center">
            <span className="type-label text-ink-subtle">
              {scopeLabel ?? "Koç turu"} · {minutes} dk
            </span>
            <p className="type-display tabular text-ink">
              {result.correctCount}
              <span className="type-title text-ink-soft">
                /{result.totalQuestions}
              </span>
            </p>
            <span className="type-body-sm tabular text-ink-soft">
              doğruluk %{pct}
            </span>
            {result.earnedBadges.length > 0 && (
              <Badge tone="accent" className="mt-2">
                Yeni rozet: {result.earnedBadges.map((b) => b.name).join(", ")}
              </Badge>
            )}
          </Card>

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
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="type-label py-2 text-ink-subtle">Konu</th>
                  <th className="type-label py-2 text-right text-ink-subtle">
                    Doğru
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.topicBreakdown.map((t) => {
                  const ratio = t.total > 0 ? t.correct / t.total : 0;
                  return (
                    <tr
                      key={t.topicId}
                      className="border-b border-line last:border-0"
                    >
                      <td className="type-body-sm py-2.5 pr-2 text-ink">
                        {t.topicName}
                      </td>
                      <td
                        className={cn(
                          "type-subhead tabular py-2.5 text-right",
                          ratio < 0.4
                            ? "text-danger-ink"
                            : ratio < 0.6
                              ? "text-warning-ink"
                              : "text-success-ink",
                        )}
                      >
                        {t.correct}/{t.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
