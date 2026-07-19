"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { OptionRow, type OptionState } from "@/components/ui/option-row";
import { ExplanationBox } from "@/components/ui/explanation-box";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

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
  /** Yapısal madde bağı — "M ile aç" inspector'ı + link için (Doc 27 §3.6). */
  relatedArticle: { lawSlug: string; no: string; slug: string } | null;
  source: string | null;
}
interface CompleteResponse {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  score: number;
  durationSeconds: number;
  topicBreakdown: { topicId: string; topicName: string; correct: number; total: number }[] | null;
  earnedBadges: { key: string; name: string }[];
}

export interface SessionScope {
  topicId?: string;
  courseId?: string;
  articleNo?: string;
  /** 'review' = yanlış tekrarı · 'favorites' = favori reçetesi; varsayılan practice. */
  mode?: "practice" | "review" | "favorites";
  /** Yarım oturumu kaldığı yerden aç (Doc 27 §2.4). */
  resumeId?: string;
  /** Üst şeritte gösterilen insan-okur kapsam etiketi. */
  label?: string;
  questionCount?: number;
}

interface ResumeResponse {
  sessionId: string;
  mode: string;
  questions: SessionQuestion[];
  givenAnswers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean | null }[];
}

type Phase =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "playing"; data: StartResponse }
  | { kind: "finishing"; data: StartResponse }
  | { kind: "done"; result: CompleteResponse };

/**
 * Seans Oynatıcı — TEK çalışma odası (Doc 25 Karar 1, Doc 27 §3.6, wireframe 08).
 * L3 Odak: kabuk yok; klavye birincil giriş (1-4 şık, Enter sonraki, Esc çıkış).
 * Değerlendirme SUNUCUDA; istemci yalnız gösterir.
 */
export function SessionPlayer({ scope }: { scope: SessionScope }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback & { selected: string }>>(
    {},
  );
  const [pendingAnswer, setPendingAnswer] = useState<{
    questionId: string;
    optionId: string;
  } | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [exitAsk, setExitAsk] = useState(false);
  // Oturum içi not (wireframe 08): kaydedilmez, seansla yaşar.
  const [note, setNote] = useState("");
  // Favoriler (F) — bookmark API'sine yazılır; oturum içi anlık durum.
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  // "M ile aç" — ilgili maddeyi sağ panelde göster (seanstan çıkmadan, Doc 27 §3.6).
  const [maddeOpen, setMaddeOpen] = useState(false);
  // Hata bildir (wireframe 08) — seanstan ÇIKMADAN yerinde bildirim; /questions/:id/report'a yazar.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportState, setReportState] = useState<
    "idle" | "busy" | "done" | "already" | "error"
  >("idle");
  const questionShownAt = useRef(0);
  const startedRef = useRef(false);
  const answerInFlight = useRef(false);

  // ── Seans başlat ──
  useEffect(() => {
    if (startedRef.current) return; // StrictMode çift çağrısına karşı
    startedRef.current = true;
    const fail = (e: unknown) => {
      const err = e instanceof ApiClientError ? e : null;
      setPhase({
        kind: "error",
        code: err?.code ?? "UNKNOWN",
        message: err?.message ?? "Seans başlatılamadı.",
      });
    };
    if (scope.resumeId) {
      // Kaldığı yerden devam: aynı set + verilen cevaplar (Doc 27 §2.4).
      apiClient<ResumeResponse>(`/quiz/sessions/${scope.resumeId}/resume`)
        .then((res) => {
          const seeded: Record<string, AnswerFeedback & { selected: string }> = {};
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
          const firstUnanswered = res.questions.findIndex((q) => !seeded[q.questionId]);
          setIndex(firstUnanswered >= 0 ? firstUnanswered : res.questions.length - 1);
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
        ...(scope.articleNo ? { articleNo: scope.articleNo } : {}),
        questionCount: scope.questionCount ?? 10,
      },
    })
      .then((data) => {
        questionShownAt.current = Date.now();
        setPhase({ kind: "playing", data });
      })
      .catch(fail);
  }, [scope]);

  // Favori durumunu tohumla — önceden yıldızlanmış sorular bu seansta da ★ görünsün.
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

  const data = phase.kind === "playing" || phase.kind === "finishing" ? phase.data : null;
  const question = data?.questions[index] ?? null;
  const currentFeedback = question ? feedback[question.questionId] : undefined;
  const answeredCount = data ? Object.keys(feedback).length : 0;
  const isLast = data != null && index === data.questions.length - 1;

  // ── Cevap gönder (tıklama veya klavye) ──
  const submit = useCallback(
    async (optionId: string) => {
      if (!data || !question || currentFeedback || answerInFlight.current) return;
      answerInFlight.current = true;
      setAnswerError(null);
      setPendingAnswer({ questionId: question.questionId, optionId });
      try {
        const fb = await apiClient<AnswerFeedback>(`/quiz/sessions/${data.sessionId}/answers`, {
          method: "POST",
          body: {
            questionId: question.questionId,
            questionVersionId: question.versionId,
            selectedOptionId: optionId,
            timeSpentMs: Date.now() - questionShownAt.current,
          },
        });
        setFeedback((f) => ({ ...f, [question.questionId]: { ...fb, selected: optionId } }));
      } catch (e: unknown) {
        const err = e instanceof ApiClientError ? e : null;
        if (err?.code === "DAILY_LIMIT_REACHED") {
          setPhase({ kind: "error", code: err.code, message: err.message });
        } else {
          setAnswerError(err?.message ?? "Cevap kaydedilemedi. Tekrar deneyebilirsin.");
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
      apiClient(`/review/bookmarks/${questionId}`, { method: has ? "DELETE" : "POST" }).catch(() => {
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

  // ── Hata bildir — mevcut soruyu /questions/:id/report'a bildirir; seanstan çıkmaz ──
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
        opt = q.options.find((o) => o.label.toLocaleUpperCase("tr-TR") === letter);
      }
      if (opt) void submit(opt.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, index, feedback, exitAsk, next, submit, toggleBookmark]);

  // ═══ Görünümler ═══

  if (phase.kind === "loading") {
    return (
      <FocusFrame label={scope.label ?? "Koç seansı"}>
        <div className="mx-auto max-w-2xl space-y-3 py-10" aria-busy>
          <div className="h-5 w-2/3 animate-pulse rounded-sm bg-line" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-sm bg-line" />
          ))}
        </div>
      </FocusFrame>
    );
  }

  if (phase.kind === "error") {
    const isLimit = phase.code === "DAILY_LIMIT_REACHED";
    return (
      <FocusFrame label={scope.label ?? "Koç seansı"}>
        <div className="mx-auto max-w-md py-16 text-center">
          {/* Limit duvarı — Doc 25 akış H: "koç seni durdurmak istemiyor" çerçevesi */}
          <p className="text-3xl" aria-hidden>
            {isLimit ? "🎯" : "⚠️"}
          </p>
          <h1 className="mt-3 font-heading text-lg font-bold text-ink">
            {isLimit ? "Bugünlük antrenman doldu" : "Bir sorun çıktı"}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            {isLimit
              ? "Koç seni durdurmak istemiyor — ama ücretsiz günlük hak burada bitiyor. Premium'la sınır kalkar; emeğin ve haritan seni bekliyor."
              : phase.message}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/bugun" variant={isLimit ? "secondary" : "primary"}>
              Bugün&apos;e dön
            </ButtonLink>
            {isLimit && <ButtonLink href="/sss">Premium&apos;u incele</ButtonLink>}
          </div>
        </div>
      </FocusFrame>
    );
  }

  if (phase.kind === "done") {
    // Bu seansta karşılaşılan tekil maddeler (İlgili maddeleri oku için).
    const seenArticles = new Map<string, { lawSlug: string; no: string; slug: string }>();
    for (const f of Object.values(feedback)) {
      if (f.relatedArticle) seenArticles.set(`${f.relatedArticle.lawSlug}/${f.relatedArticle.slug}`, f.relatedArticle);
    }
    return (
      <SessionResult
        result={phase.result}
        scopeLabel={scope.label}
        isReview={scope.mode === "review"}
        articles={[...seenArticles.values()]}
      />
    );
  }

  // playing / finishing
  const fb = currentFeedback;

  return (
    <FocusFrame
      label={
        scope.label ??
        (scope.mode === "review"
          ? "Yanlış tekrarı — en eski yanlışların önce"
          : scope.mode === "favorites"
            ? "Favorilerim — yıldızladığın sorular"
            : "Koç seansı — zayıf konuların, yanlışların ve yeni sorular")
      }
      right={
        <span className="tabular rounded-full border border-line px-3 py-1 text-[13px] font-bold text-ink">
          {Math.min(index + 1, data!.questions.length)} / {data!.questions.length}
        </span>
      }
      onExit={() => setExitAsk(true)}
    >
      <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr_220px]">
        {/* Soru alanı (≤65ch) */}
        <div className="max-w-[65ch]">
          <p className="tk-caption">Soru {index + 1}</p>
          <p className="mt-2 text-[17px] leading-relaxed text-ink">{question!.stem}</p>
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
              className="mt-3 max-h-72 rounded-md border border-line"
            />
          )}

          <div className="mt-5 space-y-2">
            {question!.options.map((o, i) => {
              let state: OptionState = "idle";
              if (fb) {
                if (o.id === fb.correctOptionId) state = "correct";
                else if (o.id === fb.selected) state = "wrong";
                else state = "dim";
              } else if (pendingAnswer?.questionId === question!.questionId) {
                state = o.id === pendingAnswer.optionId ? "selected" : "dim";
              }
              return (
                <OptionRow
                  key={o.id}
                  label={o.label}
                  text={o.text}
                  state={state}
                  keyHint={String(i + 1)}
                  disabled={!!fb || pendingAnswer != null}
                  onSelect={() => void submit(o.id)}
                />
              );
            })}
          </div>

          {pendingAnswer?.questionId === question!.questionId && (
            <p className="mt-2 text-[13px] font-medium text-session" role="status" aria-live="polite">
              Cevabın kontrol ediliyor…
            </p>
          )}
          {answerError && (
            <p className="mt-2 text-[13px] font-medium text-danger" role="alert">
              {answerError}
            </p>
          )}

          {fb && (
            <div className="mt-4 space-y-4">
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
              {/* Aksiyon ucu: favorile (F) · madde aç (M) · hata bildir (wireframe 08) */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => toggleBookmark(question!.questionId)}
                  aria-pressed={bookmarks.has(question!.questionId)}
                  className={[
                    "tk-caption rounded-full border px-2.5 py-1",
                    bookmarks.has(question!.questionId)
                      ? "border-streak/60 bg-streak/10 text-streak"
                      : "border-line hover:text-ink",
                  ].join(" ")}
                >
                  {bookmarks.has(question!.questionId) ? "★ Favoride" : "☆ Favorile (F)"}
                </button>
                {fb.relatedArticle && (
                  <button
                    type="button"
                    onClick={() => setMaddeOpen((v) => !v)}
                    aria-pressed={maddeOpen}
                    className={[
                      "tk-caption rounded-full border px-2.5 py-1",
                      maddeOpen
                        ? "border-atlas/60 bg-atlas/10 text-atlas"
                        : "border-line hover:text-ink",
                    ].join(" ")}
                  >
                    ⚖ İlgili madde: {fb.relatedArticle.no} (M)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen((v) => !v);
                    if (!reportOpen) setReportState("idle");
                  }}
                  aria-expanded={reportOpen}
                  className={[
                    "tk-caption rounded-full border px-2.5 py-1",
                    reportOpen
                      ? "border-danger/60 bg-danger/10 text-danger"
                      : "border-line hover:text-ink",
                  ].join(" ")}
                >
                  ⚑ Hata bildir
                </button>
              </div>
              {/* Yerinde hata bildir paneli — seanstan çıkmadan (Doc 27 §3.6) */}
              {reportOpen && (
                <div className="rounded-sm border border-danger/30 bg-danger/5 p-3">
                  {reportState === "done" || reportState === "already" ? (
                    <p className="text-[13px] font-semibold text-success" role="status">
                      {reportState === "already"
                        ? "Bu soruyu zaten bildirmiştin — teşekkürler."
                        : "Bildirimin alındı. Editör ekibi inceleyecek, teşekkürler."}
                    </p>
                  ) : (
                    <>
                      <label
                        htmlFor="report-message"
                        className="text-[13px] font-semibold text-ink"
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
                        className="mt-1 w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-danger"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => submitReport(question!.questionId)}
                          disabled={reportText.trim().length < 5 || reportState === "busy"}
                        >
                          {reportState === "busy" ? "Gönderiliyor…" : "Bildir"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setReportOpen(false)}
                          className="tk-caption text-ink-soft hover:text-ink"
                        >
                          Vazgeç
                        </button>
                        {reportState === "error" && (
                          <span className="text-[12px] font-semibold text-danger">
                            Gönderilemedi, tekrar dene.
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button size="lg" onClick={next} disabled={phase.kind === "finishing"}>
                  {isLast ? "Seansı bitir" : "Sonraki soru"}
                  <kbd className="rounded border border-current/30 px-1.5 text-[11px]" aria-hidden>
                    ⏎
                  </kbd>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Yardımcı panel: seans akışı + kısayollar */}
        <aside className="max-lg:hidden">
          <Card>
            <CardTitle className="text-[13px]">Seans akışı</CardTitle>
            <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden>
              {data!.questions.map((q, i) => {
                const f = feedback[q.questionId];
                return (
                  <span
                    key={q.questionId}
                    className={[
                      "grid aspect-square place-items-center rounded text-[11px] font-bold",
                      i === index ? "ring-2 ring-brand" : "",
                      f
                        ? f.isCorrect
                          ? "bg-success/20 text-success"
                          : "bg-danger/20 text-danger"
                        : "bg-line text-ink-soft",
                    ].join(" ")}
                  >
                    {f ? (f.isCorrect ? "✓" : "✗") : i + 1}
                  </span>
                );
              })}
            </div>
            <p className="tabular mt-2 text-[12px] text-ink-soft">{answeredCount} cevaplandı</p>
          </Card>

          {/* İlgili madde inspector'ı — M ile açılır, seanstan çıkmadan (Doc 27 §3.6) */}
          {maddeOpen && fb?.relatedArticle && (
            <Card className="mt-3 border-atlas/40">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-[13px] text-atlas">
                  İlgili madde · {fb.relatedArticle.no}
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setMaddeOpen(false)}
                  aria-label="Kapat"
                  className="tk-caption hover:text-ink"
                >
                  ✕
                </button>
              </div>
              {fb.legalReference && (
                <p className="mt-1 text-[13px] text-ink-soft">{fb.legalReference}</p>
              )}
              <Link
                href={`/kanun/${fb.relatedArticle.lawSlug}/madde/${fb.relatedArticle.slug}`}
                target="_blank"
                className="mt-2 inline-block text-[13px] font-bold text-atlas hover:underline"
              >
                Maddeyi Atlas&apos;ta aç →
              </Link>
            </Card>
          )}

          <Card className="mt-3">
            <CardTitle className="text-[13px]">Not</CardTitle>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Oturum içi karalama — kaydedilmez"
              rows={3}
              aria-label="Oturum içi not"
              className="mt-1.5 w-full resize-y rounded-sm border border-line bg-surface-alt p-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-brand"
            />
          </Card>
          <p className="tk-caption mt-3 leading-relaxed">
            1–4 şık · ⏎ sonraki · F favori · M madde · Esc çıkış
          </p>
        </aside>
      </div>

      {/* Çıkış diyaloğu — ilerleme kaybolmaz (cevaplar sunucuda) */}
      {exitAsk && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Seanstan çık"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
        >
          <Card className="w-full max-w-sm p-6">
            <CardTitle>Seanstan çıkıyor musun?</CardTitle>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              Cevapların kaydedildi; hedefe sayılması için seansın tamamlanması gerekir.
            </p>
            <div className="mt-5 flex justify-end gap-2">
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
              <Button variant="danger" onClick={() => router.push("/bugun")}>
                Çık
              </Button>
            </div>
          </Card>
        </div>
      )}
    </FocusFrame>
  );
}

/** L3 odak çerçevesi: ince üst şerit (çıkış · bağlam · sağ uç), kabuk yok. */
function FocusFrame({
  label,
  right,
  onExit,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  onExit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-surface px-4 py-2.5">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            aria-label="Seanstan çık"
            className="tk-interactive grid size-8 cursor-pointer place-items-center rounded-sm text-ink-soft hover:bg-line/40 hover:text-ink"
          >
            ✕
          </button>
        ) : (
          <Link
            href="/bugun"
            aria-label="Bugün'e dön"
            className="tk-interactive grid size-8 place-items-center rounded-sm text-ink-soft hover:bg-line/40 hover:text-ink"
          >
            ✕
          </Link>
        )}
        {/* Reçete şeffaflığı — tek satır (Doc 24 §9) */}
        <p className="tk-caption min-w-0 flex-1 truncate normal-case tracking-normal">{label}</p>
        {right}
      </header>
      <div className="py-8">{children}</div>
    </div>
  );
}

/** Seans Sonucu (Doc 27 §3.7, wireframe 09): skor + kırılım + tek eve dönüş çapası. */
function SessionResult({
  result,
  scopeLabel,
  isReview,
  articles,
}: {
  result: CompleteResponse;
  scopeLabel?: string;
  isReview: boolean;
  articles: { lawSlug: string; no: string; slug: string }[];
}) {
  const pct =
    result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : 0;
  const minutes = Math.max(1, Math.round(result.durationSeconds / 60));
  const weakest = result.topicBreakdown
    ?.filter((t) => t.total >= 2)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  return (
    <FocusFrame label={scopeLabel ?? "Seans sonucu"}>
      <div className="mx-auto grid max-w-4xl gap-4 px-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <p className="tk-caption">
              {scopeLabel ?? "Koç seansı"} · {minutes} dk
            </p>
            <p className="tabular mt-2 font-heading text-5xl font-bold text-ink">
              {result.correctCount}
              <span className="text-2xl text-ink-soft">/{result.totalQuestions}</span>
            </p>
            <p className="tabular mt-1 text-[14px] text-ink-soft">doğruluk %{pct}</p>
            {result.earnedBadges.length > 0 && (
              <p className="mt-3 rounded-md bg-streak/10 px-3 py-2 text-[14px] font-bold text-streak">
                🎖 Yeni rozet: {result.earnedBadges.map((b) => b.name).join(", ")}
              </p>
            )}
          </Card>

          {/* Koç yorumu — rakam konuşur (Doc 26 dil kuralı 1) */}
          <Card className="border-brand/30">
            <CardTitle className="text-[13px] text-brand">Koç</CardTitle>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">
              {result.wrongCount > 0
                ? `${result.wrongCount} yanlışını yanlış havuzuna ekledim — tekrarında karşına çıkacaklar.`
                : "Tam isabet. Yarın yeni sorularla devam."}
              {weakest && weakest.correct / weakest.total < 0.6 && (
                <> En çok {weakest.topicName} zorladı ({weakest.correct}/{weakest.total}).</>
              )}
            </p>
          </Card>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/bugun" size="lg">
              Bugün&apos;e dön
            </ButtonLink>
            {/* Yanlış varsa (ve zaten tekrar seansı değilse) doğrudan review'a köprü */}
            {result.wrongCount > 0 && !isReview && (
              <ButtonLink
                href={`/seans?mode=review&scope=${encodeURIComponent("Yanlış tekrarı")}`}
                variant="secondary"
                size="lg"
              >
                Yanlışları şimdi tekrar et
              </ButtonLink>
            )}
            <ButtonLink href="/seans" variant="ghost" size="lg">
              Yeni seans
            </ButtonLink>
          </div>

          {/* İlgili maddeleri oku (wireframe 09): bu seansta geçen mevzuat maddeleri */}
          {articles.length > 0 && (
            <Card>
              <CardTitle className="text-[13px]">İlgili maddeleri oku</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {articles.slice(0, 6).map((a) => (
                  <Link
                    key={`${a.lawSlug}/${a.slug}`}
                    href={`/kanun/${a.lawSlug}/madde/${a.slug}`}
                    className="tk-caption rounded-full border border-atlas/40 bg-atlas/5 px-2.5 py-1 text-atlas hover:border-atlas"
                  >
                    ⚖ madde {a.no}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardTitle className="text-[13px]">Konu kırılımı</CardTitle>
          {result.topicBreakdown && result.topicBreakdown.length > 0 ? (
            <table className="mt-2 w-full text-[14px]">
              <thead>
                <tr className="tk-caption border-b border-line text-left">
                  <th className="py-1.5 font-semibold">Konu</th>
                  <th className="py-1.5 text-right font-semibold">Doğru</th>
                </tr>
              </thead>
              <tbody>
                {result.topicBreakdown.map((t) => {
                  const ratio = t.total > 0 ? t.correct / t.total : 0;
                  return (
                    <tr key={t.topicId} className="border-b border-line last:border-0">
                      <td className="py-2 pr-2 text-ink">{t.topicName}</td>
                      <td
                        className={[
                          "tabular py-2 text-right font-bold",
                          ratio < 0.4 ? "text-danger" : ratio < 0.6 ? "text-warning" : "text-success",
                        ].join(" ")}
                      >
                        {t.correct}/{t.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">
              Tek konuluk seans — kırılım yok. Doğru {result.correctCount}, yanlış{" "}
              {result.wrongCount}, boş {result.blankCount}.
            </p>
          )}
        </Card>
      </div>
    </FocusFrame>
  );
}
