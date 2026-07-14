"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { QuestionColumns } from "./question-columns";

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
 * Sınav oturumu — eski sinav.php birebir (Doc 18 §4.1):
 * 2 sütun + orta ayraç + examShadow, A-E bar şıklar, sabit alt bar
 * (kırmızı Testi Bitir + sarı sayaç pili + yeşil Cevapları Kontrol Et).
 * Her işaretleme SUNUCUYA anında yazılır (yenile/kapat → kaldığın yerden);
 * süre bitince otomatik teslim. Değerlendirme tamamen sunucuda.
 */
export function ExamRunner({ start }: { start: StartPayload }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      start.givenAnswers
        .filter((a) => a.selectedOptionId != null)
        .map((a) => [a.questionId, a.selectedOptionId as string]),
    ),
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [checkOpen, setCheckOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const finishingRef = useRef(false);

  const total = start.questions.length;
  const answeredCount = Object.keys(answers).length;

  // ── Bitirme (idempotent; sunucu zaten güvence altında) ──
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try {
      await apiClient(`/quiz/sessions/${start.sessionId}/complete`, { method: "POST" });
    } catch {
      // Ağ hatası olsa da sonuç sayfası tembel finalize eder — yine de gidilir.
    }
    router.replace(`/sonuc/${start.sessionId}`);
  }, [router, start.sessionId]);

  // ── Sayaç: sunucunun verdiği bitiş anına (küresel pencere) ──
  useEffect(() => {
    const compute = () => Math.max(0, new Date(start.endsAt).getTime() - Date.now());
    setTimeLeft(compute());
    const t = setInterval(() => {
      const ms = compute();
      setTimeLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        void finish(); // süre doldu → otomatik teslim (eski davranış)
      }
    }, 1000);
    return () => clearInterval(t);
  }, [start.endsAt, finish]);

  // ── Yanlışlıkla çıkışa karşı uyarı (Doc 18 senaryoları) ──
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!finishingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // ── Cevap kaydı: anında sunucuya (başarısızsa işaretle + bitirmeden önce tekrar dene) ──
  async function saveAnswer(questionId: string, versionId: string, optionId: string) {
    setAnswers((p) => ({ ...p, [questionId]: optionId }));
    setSaveState((p) => ({ ...p, [questionId]: "saving" }));
    try {
      await apiClient(`/quiz/sessions/${start.sessionId}/answers`, {
        method: "POST",
        body: { questionId, questionVersionId: versionId, selectedOptionId: optionId },
      });
      setSaveState((p) => ({ ...p, [questionId]: "saved" }));
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "EXAM_TIME_OVER") {
        void finish();
        return;
      }
      setSaveState((p) => ({ ...p, [questionId]: "failed" }));
    }
  }

  async function retryFailedThen(fn: () => void) {
    const failed = Object.entries(saveState).filter(([, s]) => s === "failed");
    for (const [qid] of failed) {
      const q = start.questions.find((x) => x.questionId === qid);
      const opt = answers[qid];
      if (q && opt) await saveAnswer(qid, q.versionId, opt);
    }
    fn();
  }

  // ── Süre biçimi (eski sarı pil: HH:MM:SS) ──
  const timeText = useMemo(() => {
    if (timeLeft === null) return "--:--:--";
    const s = Math.floor(timeLeft / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [timeLeft]);

  return (
    <div className="pb-28">
      <h1 className="head3 pt-8">
        <i className="icon-test" aria-hidden />
        {start.title}
      </h1>

      <QuestionColumns
        questions={start.questions}
        renderQuestion={(q) => (
          <>
            <div role="radiogroup" aria-label={`Soru ${q.order}`}>
              {q.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.questionId] === o.id}
                  className="option-bar"
                  onClick={() => saveAnswer(q.questionId, q.versionId, o.id)}
                >
                  <b>{o.label}.</b> {o.text}
                </button>
              ))}
            </div>
            {saveState[q.questionId] === "failed" && (
              <p className="mt-1 text-[12px] font-semibold text-(--color-red)">
                Cevap kaydedilemedi — tekrar seçmeyi dene.
              </p>
            )}
          </>
        )}
      />

      {/* ── Sabit alt bar (eski #exam .bottom) ── */}
      <div className="exam-bottom">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 py-3 md:gap-6">
          <button
            type="button"
            onClick={() => setFinishOpen(true)}
            disabled={finishing}
            className="btn-old btn-old-red min-w-[180px] disabled:opacity-60"
          >
            {finishing ? "Bitiriliyor…" : "Testi Bitir"}
          </button>
          <div className="timer-pill" role="timer" aria-label="Kalan süre">
            <i className="icon-timer" aria-hidden />
            <span className="tabular-nums">{timeText}</span>
          </div>
          <button
            type="button"
            onClick={() => setCheckOpen(true)}
            className="btn-old btn-old-green"
          >
            Cevapları Kontrol Et
          </button>
          <span className="text-[13px] font-semibold text-neutral-500">
            {answeredCount}/{total} cevaplandı
          </span>
        </div>
      </div>

      {/* ── Cevap kontrol penceresi ── */}
      {checkOpen && (
        <Modal onClose={() => setCheckOpen(false)} title="Cevaplarını Kontrol Et">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {start.questions.map((q) => (
              <a
                key={q.questionId}
                href={`#soru-${q.order}`}
                onClick={() => setCheckOpen(false)}
                className={`font-heading flex h-10 items-center justify-center text-sm font-bold text-white ${
                  answers[q.questionId] ? "bg-(--color-green)" : "bg-neutral-400"
                }`}
              >
                {q.order}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-[13px] text-neutral-500">
            Yeşil = cevaplandı · Gri = boş. Numaraya tıklayınca soruya gider.
          </p>
        </Modal>
      )}

      {/* ── Bitirme onayı (eski examPop) ── */}
      {finishOpen && (
        <Modal onClose={() => setFinishOpen(false)} title="Testi Bitir">
          <p className="text-center text-sm">
            {total - answeredCount > 0 ? (
              <>
                <strong className="text-(--color-red)">{total - answeredCount} boş sorun var.</strong>{" "}
                Sınavı bitirmek istediğine emin misin?
              </>
            ) : (
              <>Tüm soruları cevapladın. Sınavı bitirmek istediğine emin misin?</>
            )}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              className="btn-old btn-old-navy"
              onClick={() => setFinishOpen(false)}
            >
              Devam Et
            </button>
            <button
              type="button"
              className="btn-old btn-old-red"
              disabled={finishing}
              onClick={() => retryFailedThen(() => void finish())}
            >
              Kaydet ve Bitir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Eski .pop modalının erişilebilir hali. */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="head2 mb-5 -mx-6 -mt-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
