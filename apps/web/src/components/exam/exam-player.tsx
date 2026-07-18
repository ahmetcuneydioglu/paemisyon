"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { OptionRow } from "@/components/ui/option-row";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export interface StartPayload {
  sessionId: string;
  examId: string;
  title: string;
  endsAt: string;
  liveAnswerReveal: boolean;
  questions: {
    order: number;
    questionId: string;
    versionId: string;
    stem: string;
    mediaUrl: string | null;
    options: { id: string; label: string; text: string }[];
  }[];
  givenAnswers: { questionId: string; selectedOptionId: string | null }[];
}

type SaveState = "saved" | "saving" | "failed";

/**
 * Deneme Oynatıcı — L3 odak, optik form panelli (Doc 27 §3.8, wireframe 10).
 * Eski ExamRunner'ın sunucu disiplinini aynen korur: her işaretleme anında
 * sunucuya yazılır, süre sunucu bitiş anına sayar, dolunca otomatik teslim,
 * değerlendirme tamamen sunucuda. Deneme sırasında açıklama/cevap SIZMAZ.
 * Klavye: ←/→ soru · 1-5/A-E işaretle · F bayrak · Esc bitirme diyaloğu.
 */
export function ExamPlayer({ start }: { start: StartPayload }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      start.givenAnswers
        .filter((a) => a.selectedOptionId != null)
        .map((a) => [a.questionId, a.selectedOptionId as string]),
    ),
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  // "Emin değilim" bayrağı yalnız oturum içi taktik aracıdır — sunucuya yazılmaz.
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const finishingRef = useRef(false);
  // Soru görüntülenme anı — süre yönetimi verisi (timeSpentMs) için.
  const shownAtRef = useRef(0); // ilk değer index-effect'inde atanır (saf render)

  const total = start.questions.length;
  const q = start.questions[index];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flags.size;

  // ── Bitirme (idempotent) ──
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try {
      await apiClient(`/quiz/sessions/${start.sessionId}/complete`, { method: "POST" });
    } catch {
      // Sonuç sayfası tembel finalize eder — yine de gidilir.
    }
    router.replace(`/sonuc/${start.sessionId}`);
  }, [router, start.sessionId]);

  // ── Sayaç: sunucunun bitiş anına ──
  useEffect(() => {
    const compute = () => Math.max(0, new Date(start.endsAt).getTime() - Date.now());
    const tick = () => {
      const ms = compute();
      setTimeLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        void finish();
      }
    };
    const t0 = setTimeout(tick, 0); // ilk değer bir sonraki tick'te (senkron setState yasağı)
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [start.endsAt, finish]);

  // ── Yanlışlıkla çıkış uyarısı ──
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!finishingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // ── Cevap: anında sunucuya ──
  const saveAnswer = useCallback(
    async (questionId: string, versionId: string, optionId: string) => {
      setAnswers((p) => ({ ...p, [questionId]: optionId }));
      setSaveState((p) => ({ ...p, [questionId]: "saving" }));
      try {
        await apiClient(`/quiz/sessions/${start.sessionId}/answers`, {
          method: "POST",
          body: {
            questionId,
            questionVersionId: versionId,
            selectedOptionId: optionId,
            timeSpentMs: Date.now() - shownAtRef.current,
          },
        });
        setSaveState((p) => ({ ...p, [questionId]: "saved" }));
      } catch (e) {
        if (e instanceof ApiClientError && e.code === "EXAM_TIME_OVER") {
          void finish();
          return;
        }
        setSaveState((p) => ({ ...p, [questionId]: "failed" }));
      }
    },
    [start.sessionId, finish],
  );

  async function retryFailedThen(fn: () => void) {
    const failed = Object.entries(saveState).filter(([, s]) => s === "failed");
    for (const [qid] of failed) {
      const item = start.questions.find((x) => x.questionId === qid);
      const opt = answers[qid];
      if (item && opt) await saveAnswer(qid, item.versionId, opt);
    }
    fn();
  }

  // Soru değişince süre sayacı yeniden başlar (revisit'te üzerine yazılır).
  useEffect(() => {
    shownAtRef.current = Date.now();
  }, [index]);

  const toggleFlag = useCallback((questionId: string) => {
    setFlags((p) => {
      const n = new Set(p);
      if (n.has(questionId)) n.delete(questionId);
      else n.add(questionId);
      return n;
    });
  }, []);

  // ── Klavye ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finishOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(total - 1, i + 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "Escape") setFinishOpen(true);
      else if (e.key.toLocaleLowerCase("tr-TR") === "f") toggleFlag(q.questionId);
      else {
        const num = Number.parseInt(e.key, 10);
        let opt: { id: string } | undefined;
        if (num >= 1 && num <= q.options.length) opt = q.options[num - 1];
        else {
          const letter = e.key.toLocaleUpperCase("tr-TR");
          opt = q.options.find((o) => o.label.toLocaleUpperCase("tr-TR") === letter);
        }
        if (opt) void saveAnswer(q.questionId, q.versionId, opt.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, total, finishOpen, saveAnswer, toggleFlag]);

  // ── Süre biçimi — sakin; son 10 dk warning (Doc 26: panik dili yok) ──
  const timeText = useMemo(() => {
    if (timeLeft === null) return "--:--";
    const s = Math.floor(timeLeft / 1000);
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  }, [timeLeft]);
  const lowTime = timeLeft !== null && timeLeft <= 10 * 60_000;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-surface px-4 py-2.5">
        <p className="tk-caption min-w-0 flex-1 truncate normal-case tracking-normal">
          {start.title} · Türkiye geneli canlı deneme
        </p>
        <span className="tabular text-[13px] text-ink-soft">
          {answeredCount}/{total} dolu
        </span>
        <span
          role="timer"
          aria-label="Kalan süre"
          className={[
            "tabular rounded-full border px-3 py-1 text-[14px] font-bold",
            lowTime ? "border-warning/60 bg-warning/10 text-warning" : "border-line text-ink",
          ].join(" ")}
        >
          ⏱ {timeText}
        </span>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_260px]">
        {/* Soru alanı */}
        <div className="max-w-[65ch]">
          <p className="tk-caption">
            Soru {q.order} / {total}
          </p>
          <p className="mt-2 text-[17px] leading-relaxed text-ink">{q.stem}</p>
          {q.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.mediaUrl}
              alt="Soru görseli"
              className="mt-3 max-h-72 rounded-md border border-line"
            />
          )}

          <div className="mt-5 space-y-2" role="radiogroup" aria-label={`Soru ${q.order}`}>
            {q.options.map((o, i) => (
              <OptionRow
                key={o.id}
                label={o.label}
                text={o.text}
                state={answers[q.questionId] === o.id ? "selected" : "idle"}
                keyHint={String(i + 1)}
                onSelect={() => void saveAnswer(q.questionId, q.versionId, o.id)}
              />
            ))}
          </div>
          {saveState[q.questionId] === "failed" && (
            <p className="mt-2 text-[13px] font-semibold text-danger" role="alert">
              Cevap kaydedilemedi — bağlantını kontrol edip tekrar seç.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              ← önceki
            </Button>
            <Button
              variant={flags.has(q.questionId) ? "primary" : "ghost"}
              onClick={() => toggleFlag(q.questionId)}
              aria-pressed={flags.has(q.questionId)}
              className={flags.has(q.questionId) ? "bg-warning text-surface hover:opacity-90" : ""}
            >
              ⚑ emin değilim
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
            >
              sonraki →
            </Button>
          </div>
        </div>

        {/* Optik form paneli */}
        <aside>
          <div className="sticky top-16 space-y-3">
            <Card>
              <CardTitle className="text-[13px]">Optik form</CardTitle>
              <div className="mt-2 grid grid-cols-8 gap-1.5 lg:grid-cols-6 xl:grid-cols-8">
                {start.questions.map((item, i) => {
                  const filled = !!answers[item.questionId];
                  const flagged = flags.has(item.questionId);
                  return (
                    <button
                      key={item.questionId}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Soru ${item.order}${filled ? ", dolu" : ", boş"}${flagged ? ", bayraklı" : ""}`}
                      aria-current={i === index ? "true" : undefined}
                      className={[
                        "tk-interactive grid aspect-square cursor-pointer place-items-center rounded text-[11px] font-bold",
                        i === index ? "ring-2 ring-brand" : "",
                        flagged
                          ? "bg-warning/25 text-warning"
                          : filled
                            ? "bg-session/25 text-ink"
                            : "bg-line text-ink-soft",
                      ].join(" ")}
                    >
                      {item.order}
                    </button>
                  );
                })}
              </div>
              <p className="tabular mt-2 text-[12px] text-ink-soft">
                dolu {answeredCount} · ⚑ {flaggedCount} · boş {total - answeredCount}
              </p>
              {/* Süre yönetimi önerisi (wireframe 10): sakin, sayısal, panik yok */}
              {timeLeft !== null && total - answeredCount > 0 && (
                <p className="tabular mt-1 text-[12px] text-ink-soft">
                  kalan öneri: boş soru başına ~
                  {Math.max(1, Math.floor(timeLeft / 1000 / (total - answeredCount)))}
                  sn
                </p>
              )}
            </Card>
            <Button variant="danger" className="w-full" onClick={() => setFinishOpen(true)}>
              Sınavı bitir
            </Button>
            <p className="tk-caption leading-relaxed">
              ←/→ soru · 1-5 işaretle · F bayrak. Cevapların anında kaydedilir; sayfa kapansa
              da kaldığın yerden devam edersin.
            </p>
          </div>
        </aside>
      </div>

      {/* Bitirme diyaloğu */}
      {finishOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Sınavı bitir"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
        >
          <Card className="w-full max-w-sm p-6">
            <CardTitle>Sınavı bitiriyor musun?</CardTitle>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              {total - answeredCount > 0 && (
                <>
                  <b className="text-danger">{total - answeredCount} boş</b>
                  {flaggedCount > 0 && (
                    <>
                      {" "}
                      ve <b className="text-warning">{flaggedCount} bayraklı</b>
                    </>
                  )}{" "}
                  sorun var.{" "}
                </>
              )}
              {total - answeredCount === 0 && flaggedCount > 0 && (
                <>
                  <b className="text-warning">{flaggedCount} bayraklı</b> sorun var.{" "}
                </>
              )}
              Bitirdikten sonra cevap değiştirilemez.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFinishOpen(false)}>
                Devam et
              </Button>
              <Button
                variant="danger"
                disabled={finishing}
                onClick={() => void retryFailedThen(() => void finish())}
              >
                {finishing ? "Bitiriliyor…" : "Kaydet ve bitir"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
