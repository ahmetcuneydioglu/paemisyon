"use client";

import { Flag, MessageCircle, PenLine, Scale, Star } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Seans oynatıcı parçaları (Doc 49/15, Figma "Seans" 38:13277) — Expo `components/domain/seans.tsx`
 * ile aynı adlar ve kurallar. Panel (lacivert blok) iki temada da koyudur; üstündeki durum
 * renkleri `.theme-dark` alt ağacından okunur (Figma kusuru 1: açık tema yeşili panelde 3,7:1).
 */

/* ---------------------------------------------------------------- İlerleme dilimleri */

export type SliceState =
  | "correct"
  | "wrong"
  | "current"
  | "answered"
  | "flagged"
  | "future";

const SLICE_PRIORITY: SliceState[] = [
  "current",
  "wrong",
  "correct",
  "flagged",
  "answered",
  "future",
];
const SLICE_CLASS: Record<SliceState, string> = {
  correct: "bg-success",
  wrong: "bg-danger",
  current: "bg-accent",
  answered: "bg-accent",
  flagged: "bg-warning",
  future: "bg-line",
};

/** 2 px dilimler; 20'den fazla soruda gruplanır, grupta en "önemli" durum görünür. */
export function SessionProgress({
  slices,
  className,
}: {
  slices: SliceState[];
  className?: string;
}) {
  const n = Math.min(20, Math.max(1, slices.length));
  const per = Math.ceil(slices.length / n);
  const groups = Array.from({ length: n }, (_, i) => {
    const part = slices.slice(i * per, (i + 1) * per);
    return SLICE_PRIORITY.find((s) => part.includes(s)) ?? "future";
  });
  const done = slices.filter((s) => s !== "future" && s !== "current").length;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={slices.length}
      aria-valuenow={done}
      className={cn("flex gap-[3px]", className)}
    >
      {groups.map((s, i) => (
        <span
          key={i}
          className={cn("h-0.5 flex-1 rounded-full", SLICE_CLASS[s])}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Başlık bloğu */

/** Kapsam adı (Lora), "Soru 3 / 10 · ✓2 ✗0" ve dilimler. Açık temada ✓/✗ *Ink tonları. */
export function SessionTitleBlock({
  title,
  index,
  total,
  correct,
  wrong,
  sub,
  slices,
}: {
  title: string;
  index: number;
  total: number;
  correct?: number;
  wrong?: number;
  sub?: string;
  slices: SliceState[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="type-title text-ink">{title}</h1>
      <p
        className="type-body-sm tabular flex items-center gap-1.5 text-ink-soft"
        aria-label={`Soru ${index} / ${total}${
          correct != null
            ? `, ${correct} doğru, ${wrong ?? 0} yanlış`
            : sub
              ? `, ${sub}`
              : ""
        }`}
      >
        <span>
          Soru {index} / {total}
        </span>
        {correct != null ? (
          <>
            <span className="text-ink-subtle" aria-hidden>
              ·
            </span>
            <span
              className={correct > 0 ? "text-success-ink" : "text-ink-subtle"}
              aria-hidden
            >
              ✓{correct}
            </span>
            <span
              className={
                (wrong ?? 0) > 0 ? "text-danger-ink" : "text-ink-subtle"
              }
              aria-hidden
            >
              ✗{wrong ?? 0}
            </span>
          </>
        ) : sub ? (
          <span>· {sub}</span>
        ) : null}
      </p>
      <SessionProgress slices={slices} />
    </div>
  );
}

/* ---------------------------------------------------------------- Meta satırı */

export type Difficulty = "easy" | "medium" | "hard";
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

/** "ZOR · PVSK md. 4/A ›" — zorluk + madde bağı (bağ `href` ya da `onClick`). */
export function QuestionMetaRow({
  difficulty,
  article,
}: {
  difficulty?: Difficulty;
  article?: { label: string; href?: string; onClick?: () => void } | null;
}) {
  if (!difficulty && !article) return null;
  const link =
    "type-label inline-flex min-h-6 items-center gap-0.5 text-accent-ink hover:underline";
  return (
    <div className="flex min-h-6 items-center gap-1.5">
      {difficulty ? (
        <span className="type-label text-ink-subtle">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
      ) : null}
      {difficulty && article ? (
        <span className="type-label text-ink-subtle" aria-hidden>
          ·
        </span>
      ) : null}
      {article ? (
        article.href ? (
          <a
            href={article.href}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {article.label} ›
          </a>
        ) : article.onClick ? (
          <button type="button" onClick={article.onClick} className={link}>
            {article.label} ›
          </button>
        ) : (
          <span className="type-label text-accent-ink">{article.label}</span>
        )
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Araç satırı */

export interface ToolAction {
  key: "favorite" | "note" | "coach" | "report";
  label: string;
  active?: boolean;
  busy?: boolean;
  hint?: string;
  onClick: () => void;
}
const TOOL_ICON: Record<
  ToolAction["key"],
  ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
    fill?: string;
    "aria-hidden"?: boolean;
  }>
> = {
  favorite: Star,
  note: PenLine,
  coach: MessageCircle,
  report: Flag,
};

/** Panel üstü ghost ikon düğmeleri (Favori · Not · Koça sor · Hata bildir), ≥44 px. */
export function ToolRow({
  actions,
  onPanel = true,
}: {
  actions: ToolAction[];
  onPanel?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      {actions.map((a) => {
        const Icon = TOOL_ICON[a.key];
        return (
          <button
            key={a.key}
            type="button"
            aria-label={a.label}
            aria-pressed={a.active}
            aria-busy={a.busy}
            disabled={a.busy}
            onClick={a.onClick}
            title={a.hint}
            className={cn(
              "tk-interactive flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-control px-2 text-[13px] leading-4 disabled:opacity-60",
              a.active
                ? onPanel
                  ? "text-accent"
                  : "text-accent-ink"
                : onPanel
                  ? "text-panel-soft hover:text-panel-ink"
                  : "text-ink-soft hover:text-ink",
            )}
          >
            <Icon
              size={22}
              strokeWidth={1.75}
              aria-hidden
              {...(a.active && a.key === "favorite"
                ? { fill: "currentColor" }
                : {})}
            />
            <span>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Geri bildirim paneli */

export interface CoachState {
  status: "busy" | "done" | "error";
  text?: string;
  remainingToday?: number | null;
  message?: ReactNode;
}

/**
 * Cevap sonrası panel: sonuç satırı + süre rozeti, açıklama, dayanak, "Maddeyi oku →",
 * koç cevabı, araç satırı. `explanation === undefined` → açıklamasız varyant (devam edilen tur).
 */
export function FeedbackPanel({
  isCorrect,
  correctLabel,
  seconds,
  explanation,
  legalReference,
  articleLabel,
  onReadArticle,
  coach,
  tools,
  children,
}: {
  isCorrect: boolean;
  correctLabel?: string | null;
  seconds?: number | null;
  explanation?: string | null;
  legalReference?: string | null;
  articleLabel?: string | null;
  onReadArticle?: () => void;
  coach?: CoachState;
  tools: ToolAction[];
  /** Panel altına eklenen ek içerik (madde metni, hata bildir kartı). */
  children?: ReactNode;
}) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="theme-dark flex flex-col gap-3 rounded-panel bg-panel p-4 text-panel-ink"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[18px] leading-6 font-semibold">
          <span className={isCorrect ? "text-success" : "text-danger"}>
            {isCorrect ? "Doğru" : "Yanlış"}
          </span>
          {!isCorrect && correctLabel ? (
            <span className="text-panel-ink">
              {" "}
              · doğru cevap {correctLabel}
            </span>
          ) : null}
        </p>
        {seconds != null ? (
          <span className="tabular shrink-0 rounded-pill border border-panel-soft px-2 py-0.5 text-[12px] leading-4 text-panel-soft">
            +{seconds} sn
          </span>
        ) : null}
      </div>
      {explanation ? (
        <p className="whitespace-pre-line text-[15px] leading-[22px] text-panel-ink">
          {explanation}
        </p>
      ) : explanation === null ? (
        <p className="type-body-sm text-panel-soft">
          Bu soru için açıklama henüz yazılmadı.
        </p>
      ) : null}
      {legalReference ? (
        <p className="type-body-sm flex items-center gap-2 text-panel-soft">
          <Scale
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="shrink-0"
          />
          <span>{legalReference}</span>
        </p>
      ) : null}
      {articleLabel && onReadArticle ? (
        <button
          type="button"
          onClick={onReadArticle}
          className="type-subhead inline-flex min-h-8 items-center self-start text-accent hover:underline"
        >
          {articleLabel} →
        </button>
      ) : null}
      {coach ? (
        <div className="flex flex-col gap-1 border-t border-panel-soft/40 pt-3">
          <span className="type-label text-panel-soft">Koç</span>
          {coach.status === "busy" ? (
            <p className="type-body-sm text-panel-soft">Koç bakıyor…</p>
          ) : coach.status === "error" ? (
            <p className="type-body-sm text-panel-soft">
              {coach.message ?? "Koça şu an ulaşılamadı."}
            </p>
          ) : (
            <>
              <p className="whitespace-pre-line text-[15px] leading-[22px] text-panel-ink">
                {coach.text}
              </p>
              {coach.remainingToday != null ? (
                <p className="type-body-sm text-panel-soft">
                  Bugün {coach.remainingToday} soru hakkın kaldı.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {children}
      <div className="mt-1 border-t border-line pt-2">
        <ToolRow actions={tools} />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Sonuç paneli */

/** Tur sonu paneli: etiket, Lora hero "8/10", "Doğruluk %80 · 4 dk 12 sn". */
export function ResultPanel({
  correct,
  total,
  pct,
  durationLabel,
  label = "Tur tamamlandı",
}: {
  correct: number;
  total: number;
  pct: number | null;
  durationLabel: string | null;
  label?: string;
}) {
  const sub = [pct == null ? null : `Doğruluk %${pct}`, durationLabel]
    .filter(Boolean)
    .join(" · ");
  return (
    <section
      aria-label={`${label}: ${total} soruda ${correct} doğru${sub ? `, ${sub}` : ""}`}
      className="theme-dark flex flex-col gap-1 rounded-panel bg-panel px-5 pt-3 pb-5 text-panel-ink"
    >
      <span className="type-label text-panel-soft">{label}</span>
      {/* Eğik çizgi alt satıra taşmasın: satır 1,04 × boy (Figma kusuru 3). */}
      <p className="tabular font-display text-[clamp(64px,14vw,96px)] leading-[1.04] font-medium tracking-[-0.03em]">
        {correct}/{total}
      </p>
      {sub ? <p className="type-subhead text-panel-soft">{sub}</p> : null}
    </section>
  );
}
