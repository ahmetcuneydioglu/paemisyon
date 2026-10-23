"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flag, Grid3x3, Timer } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { KeyHint } from "@/components/ui/key-hint";
import { Notice } from "@/components/ui/notice";
import { QuestionOption, QuestionStem } from "@/components/ui/question";
import { FocusFrame } from "@/components/shell/focus-frame";
import {
  ExamGrid,
  SessionTitleBlock,
  type ExamCellState,
  type SliceState,
} from "@/components/session/seans-kit";

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
  /** flagged: "emin değilim" bayrağı sunucuda kalıcı (Doc 49 S1-C). */
  givenAnswers: {
    questionId: string;
    selectedOptionId: string | null;
    flagged?: boolean;
  }[];
}

type SaveState = "saved" | "saving" | "failed";

/**
 * Deneme Oynatıcı — L3 odak, optik form panelli (Doc 27 §3.8, wireframe 10).
 * Eski ExamRunner'ın sunucu disiplinini aynen korur: her işaretleme anında
 * sunucuya yazılır, süre sunucu bitiş anına sayar, dolunca otomatik teslim,
 * değerlendirme tamamen sunucuda. Deneme sırasında açıklama/cevap SIZMAZ.
 * Klavye: ←/→ soru · 1-5/A-E işaretle · F bayrak · Esc bitirme diyaloğu.
 */
/** Arşiv modunda tamamlanınca gösterilen yerinde sonuç (resmî /sonuc yok). */

export type ExamKind = "live" | "archive" | "personal";
const KIND_LABEL: Record<ExamKind, string> = {
  live: "Türkiye geneli canlı deneme",
  archive: "arşiv denemesi (sıralamasız)",
  personal: "kişisel deneme (sıralamasız)",
};

export function ExamPlayer({
  start,
  archive = false,
  kind,
}: {
  start: StartPayload;
  /** Eski ad: arşiv/kişisel deneme (sıralamasız). `kind` verilmezse archive → "archive". */
  archive?: boolean;
  kind?: ExamKind;
}) {
  const examKind: ExamKind = kind ?? (archive ? "archive" : "live");
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
  // Sunucunun gerekçesi (kota doldu, süre bitti, soru bu oturuma ait değil…).
  // Hepsini "bağlantını kontrol et" diye göstermek 2 Eylül 2026 denemesinde
  // gerçek sebebi (403 DAILY_LIMIT_REACHED) saatlerce gizledi.
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  // "Emin değilim" bayrağı SUNUCUDA kalıcı (Doc 49 S1-C): cihaz değişince kaybolmaz,
  // sonuç ekranında "bayrakladığın sorular" listelenir. Cevap satırıyla birlikte yazılır.
  const [flags, setFlags] = useState<Set<string>>(
    () =>
      new Set(
        start.givenAnswers.filter((a) => a.flagged).map((a) => a.questionId),
      ),
  );
  const [finishOpen, setFinishOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
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
    // Arşiv çözümü de sonuç sayfasına gider (7 Eyl 2026 kullanıcı bildirimi):
    // yerinde gösterilen sayı kartı yalnız doğru/yanlış sayısını veriyordu ve
    // aday kendi cevaplarını göremiyordu. 100 soruluk bir sınavı bitiren kişi
    // doğrularını ve yanlışlarını tek tek inceleyebilmeli — /sonuc sayfası
    // arşiv oturumlarını da açar (exams.service.getAttempt).
    try {
      await apiClient(`/quiz/sessions/${start.sessionId}/complete`, {
        method: "POST",
      });
    } catch {
      // Sonuç sayfası tembel finalize eder — yine de gidilir.
    }
    router.replace(`/sonuc/${start.sessionId}`);
  }, [router, start.sessionId]);

  // ── Sayaç: sunucunun bitiş anına ──
  useEffect(() => {
    const compute = () =>
      Math.max(0, new Date(start.endsAt).getTime() - Date.now());
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
        setSaveError((p) => {
          if (p[questionId] == null) return p;
          const rest = { ...p };
          delete rest[questionId];
          return rest;
        });
      } catch (e) {
        if (e instanceof ApiClientError && e.code === "EXAM_TIME_OVER") {
          void finish();
          return;
        }
        setSaveState((p) => ({ ...p, [questionId]: "failed" }));
        // Sunucu bir gerekçe verdiyse ONU göster; yalnız gerçek ağ/bilinmeyen
        // hatalarda bağlantı metnine düş.
        const sunucuMesaji =
          e instanceof ApiClientError && e.message.trim().length > 0
            ? e.message.trim()
            : null;
        setSaveError((p) => ({
          ...p,
          [questionId]:
            sunucuMesaji ??
            "Cevap kaydedilemedi — bağlantını kontrol edip tekrar seç.",
        }));
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

  const toggleFlag = useCallback(
    (questionId: string) => {
      const item = start.questions.find((x) => x.questionId === questionId);
      if (!item) return;
      const next = !flags.has(questionId);
      setFlags((p) => {
        const n = new Set(p);
        if (next) n.add(questionId);
        else n.delete(questionId);
        return n;
      });
      // Mevcut cevap korunarak yalnız bayrak yazılır (boşsa boş satır açılır — boş zaten boştur).
      apiClient(`/quiz/sessions/${start.sessionId}/answers`, {
        method: "POST",
        body: {
          questionId,
          questionVersionId: item.versionId,
          selectedOptionId: answers[questionId] ?? null,
          flagged: next,
        },
      }).catch(() => {
        // En iyi çaba: bayrak taktik araçtır; sunucu yazamazsa oturum içi durur.
      });
    },
    [flags, answers, start.questions, start.sessionId],
  );

  // ── Klavye ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finishOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(total - 1, i + 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "Escape") setFinishOpen(true);
      else if (e.key.toLocaleLowerCase("tr-TR") === "f")
        toggleFlag(q.questionId);
      else {
        const num = Number.parseInt(e.key, 10);
        let opt: { id: string } | undefined;
        if (num >= 1 && num <= q.options.length) opt = q.options[num - 1];
        else {
          const letter = e.key.toLocaleUpperCase("tr-TR");
          opt = q.options.find(
            (o) => o.label.toLocaleUpperCase("tr-TR") === letter,
          );
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

  const cells = start.questions.map((item, i) => ({
    label: String(item.order),
    state: (i === index
      ? "current"
      : flags.has(item.questionId)
        ? "flagged"
        : answers[item.questionId]
          ? "answered"
          : "blank") as ExamCellState,
  }));
  const slices: SliceState[] = start.questions.map((item, i) =>
    i === index
      ? "current"
      : flags.has(item.questionId)
        ? "flagged"
        : answers[item.questionId]
          ? "answered"
          : "future",
  );
  const remainingSeconds =
    timeLeft == null ? null : Math.floor(timeLeft / 1000);
  const gridLabel = `${answeredCount}/${total} · ⚑ ${flaggedCount}`;

  const optik = (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3">
        <span className="type-label text-ink-subtle">Optik form</span>
        <ExamGrid
          cells={cells}
          onSelect={(i) => setIndex(i)}
          remainingSeconds={remainingSeconds}
        />
      </Card>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setFinishOpen(true)}
      >
        Sınavı bitir
      </Button>
      <p className="type-body-sm text-ink-subtle">
        ←/→ soru · 1–5 işaretle · F bayrak. Cevapların anında kaydedilir; sayfa
        kapansa da kaldığın yerden devam edersin.
      </p>
    </div>
  );

  return (
    <FocusFrame
      context={`${start.title} · ${KIND_LABEL[examKind]}`}
      progress={
        <span className="type-body-sm tabular text-ink-soft">
          {answeredCount}/{total} dolu
        </span>
      }
      timer={
        <span
          role="timer"
          aria-label="Kalan süre"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[15px]",
            lowTime ? "bg-danger-soft text-danger-ink" : "text-ink",
          )}
        >
          <Timer size={16} strokeWidth={1.75} aria-hidden />
          {timeText}
        </span>
      }
      onExit={() => setFinishOpen(true)}
      aside={optik}
      asideLabel="Optik form"
    >
      <div className="flex flex-col gap-5">
        <SessionTitleBlock
          title={start.title}
          index={q.order}
          total={total}
          sub="Deneme modu"
          slices={slices}
        />
        <div className="flex flex-col gap-3">
          <QuestionStem
            index={q.order}
            total={total}
            stem={q.stem}
            counter={false}
          />
          {q.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.mediaUrl}
              alt="Soru görseli"
              className="max-h-72 rounded-card border border-line"
            />
          )}
        </div>

        <div
          className="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label={`Soru ${q.order}`}
        >
          {q.options.map((o, i) => (
            <QuestionOption
              key={o.id}
              label={o.label}
              text={o.text}
              state={answers[q.questionId] === o.id ? "selected" : "default"}
              keyHint={String(i + 1)}
              onSelect={() => void saveAnswer(q.questionId, q.versionId, o.id)}
            />
          ))}
        </div>
        {saveState[q.questionId] === "failed" && (
          <Notice tone="error">
            {saveError[q.questionId] ??
              "Cevap kaydedilemedi — bağlantını kontrol edip tekrar seç."}
          </Notice>
        )}

        {/* Yapışkan alt çubuk (Figma S6): Önceki · Bayrak · optik hapı · Sonraki */}
        <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-line bg-bg px-4 py-3 md:-mx-6 md:px-6">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Önceki soru"
            className="tk-interactive type-subhead inline-flex h-11 items-center gap-1 rounded-control px-2 text-ink-soft hover:bg-surface-alt disabled:opacity-40"
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Önceki
          </button>
          <button
            type="button"
            onClick={() => toggleFlag(q.questionId)}
            aria-pressed={flags.has(q.questionId)}
            aria-label={
              flags.has(q.questionId)
                ? "Bayrağı kaldır"
                : "Emin değilim, bayrakla"
            }
            className={cn(
              "tk-interactive inline-flex h-11 flex-col items-center justify-center rounded-control px-2 text-[12px] leading-4",
              flags.has(q.questionId)
                ? "text-accent-ink"
                : "text-ink-soft hover:bg-surface-alt",
            )}
          >
            <Flag
              size={18}
              strokeWidth={1.75}
              className={flags.has(q.questionId) ? "fill-current" : undefined}
              aria-hidden
            />
            Bayrak <KeyHint keys="F" />
          </button>
          <button
            type="button"
            onClick={() => setGridOpen(true)}
            aria-label={`Optik form, ${gridLabel}`}
            className="tk-interactive type-subhead tabular inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-surface-alt px-3 text-ink lg:pointer-events-none"
          >
            <Grid3x3 size={16} strokeWidth={1.75} aria-hidden /> {gridLabel}
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
            aria-label="Sonraki soru"
            className="tk-interactive type-subhead inline-flex h-11 items-center gap-1 rounded-control px-2 text-accent-ink hover:bg-accent-soft disabled:opacity-40"
          >
            Sonraki <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {/* Dar ekranda optik form diyaloğu (yan panel lg altında gizli) */}
      <Dialog
        open={gridOpen}
        onClose={() => setGridOpen(false)}
        title="Optik form"
        size="md"
        footer={
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              setGridOpen(false);
              setFinishOpen(true);
            }}
          >
            Sınavı bitir
          </Button>
        }
      >
        <ExamGrid
          cells={cells}
          onSelect={(i) => {
            setIndex(i);
            setGridOpen(false);
          }}
          remainingSeconds={remainingSeconds}
          columns="grid-cols-6"
        />
      </Dialog>

      <Dialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Sınavı bitiriyor musun?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFinishOpen(false)}>
              Devam et
            </Button>
            <Button
              variant="destructive"
              disabled={finishing}
              loading={finishing}
              onClick={() => void retryFailedThen(() => void finish())}
            >
              Kaydet ve bitir
            </Button>
          </div>
        }
      >
        <p className="type-body text-ink-soft">
          {total - answeredCount > 0 && (
            <>
              <b className="text-danger-ink">{total - answeredCount} boş</b>
              {flaggedCount > 0 && (
                <>
                  {" "}
                  ve <b className="text-warning-ink">{flaggedCount} bayraklı</b>
                </>
              )}{" "}
              sorun var.{" "}
            </>
          )}
          {total - answeredCount === 0 && flaggedCount > 0 && (
            <>
              <b className="text-warning-ink">{flaggedCount} bayraklı</b> sorun
              var.{" "}
            </>
          )}
          Bitirdikten sonra cevap değiştirilemez.
        </p>
      </Dialog>
    </FocusFrame>
  );
}
