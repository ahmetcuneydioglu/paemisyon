"use client";

import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronRight,
  Flag,
  Hash,
  Lightbulb,
  RotateCcw,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  FLASHCARD_KIND_LABEL,
  relativeDay,
  type Flashcard,
  type FlashcardRating,
  type FlashcardSessionSummary,
  type ModeCounts,
} from "@/lib/kartlar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyHint } from "@/components/ui/key-hint";
import { ProgressBar } from "@/components/ui/progress";
import { StatTile } from "@/components/ui/stat-tile";
import { ArticlePeek } from "@/components/ozet/article-peek";
import { SummaryBody } from "@/components/ozet/summary-body";

/**
 * Bilgi kartları bileşen kiti (Doc 56 aşama 4; Figma 158:672) — Expo `components/domain/flashcards.tsx`
 * ile aynı adlar ve kurallar. Hepsi token'dan beslenir, ekrana bağlı değildir. Kural sunucuda:
 * sayılar, kilit, kuyruk, vade. Damga yok: puan yönü kenar tonu + köşe rozeti metniyle söylenir.
 * Kaynak etiketi hiçbir yüzeyde yoktur.
 */

/* ---------------------------------------------------------------- Tür rozeti */

const KIND_TONE: Record<Flashcard["kind"], BadgeTone> = {
  qa: "accent",
  cloze: "accent",
  numeric: "neutral",
  trap: "warning",
};
export const FLASHCARD_KIND_ICON: Record<Flashcard["kind"], LucideIcon> = {
  qa: Lightbulb,
  cloze: Lightbulb,
  numeric: Hash,
  trap: AlertTriangle,
};

export function FlashcardKindBadge({ kind }: { kind: Flashcard["kind"] }) {
  return <Badge tone={KIND_TONE[kind]}>{FLASHCARD_KIND_LABEL[kind]}</Badge>;
}

/* ---------------------------------------------------------------- Durum çubuğu */

/** Üç dilim: öğrenildi (success) · öğreniliyor (accent) · yeni (surface-alt). 4 px; sayılar sunucudan. */
export function FlashcardStateBar({
  counts,
  className,
}: {
  counts: Pick<ModeCounts, "total" | "learned" | "learning" | "new">;
  className?: string;
}) {
  const yeni = Math.max(counts.new, counts.total - counts.learned - counts.learning);
  const seg = (n: number, bg: string, key: string) =>
    n > 0 ? <span key={key} className={cn("h-full min-w-0 basis-0 rounded-pill", bg)} style={{ flexGrow: n }} /> : null;
  return (
    <div
      role="progressbar"
      aria-label={`${counts.learned} öğrenildi, ${counts.learning} öğreniliyor, ${yeni} yeni`}
      aria-valuemin={0}
      aria-valuemax={counts.total}
      aria-valuenow={counts.learned}
      className={cn("flex h-1 w-full gap-0.5", className)}
    >
      {seg(counts.learned, "bg-success", "learned")}
      {seg(counts.learning, "bg-accent", "learning")}
      {seg(yeni, "bg-surface-alt", "new")}
    </div>
  );
}

/* ---------------------------------------------------------------- Kart */

/** Tıklama etkileşimli bir çocuktan (düğme, bağlantı, açık pencere) geliyorsa çevirmez. */
function yuzeyTiklamasi(e: MouseEvent<HTMLElement>): boolean {
  const el = e.target as HTMLElement | null;
  return !el?.closest("button, a, dialog, [data-no-flip]");
}

/**
 * Tek bilgi kartı (Figma 158:782 / 158:793): iki yüz üst üste, `flipped` değişince 3B çevirme
 * (`.kart-cevirici`, 2×giriş süresi; reduce-motion'da anlık). Yüzeye tıklamak çevirir; klavye için
 * açık düğmeler ("Cevabı gör" · "Soruya dön") vardır. Sağ üstte favori (44 px). Gölge yok.
 */
export function FlashCard({
  card,
  flipped,
  onFlip,
  onBookmark,
  onReport,
  solveHref,
  className,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  onBookmark?: () => void;
  /** Hata bildir (Doc 56 §3f): favorinin yanında bayrak; diyalog açılır, tur yerinde kalır. */
  onReport?: () => void;
  /** "Bu konudan soru çöz" köprüsü (arka yüz). */
  solveHref?: string;
  className?: string;
}) {
  const kapsam = [card.topic.name, card.unit?.title].filter(Boolean).join(" · ");
  const yuz =
    "kart-yuz flex min-h-[380px] flex-col gap-3 rounded-card border border-line bg-surface p-5 md:min-h-[420px]";
  const uzun = card.front.length > 140;
  return (
    <div className={cn("kart-sahne", className)}>
      <div className="kart-cevirici" data-flipped={flipped}>
        {/* Ön yüz */}
        <section
          aria-label="Soru"
          aria-hidden={flipped}
          onClick={(e) => yuzeyTiklamasi(e) && onFlip()}
          className={cn(yuz, "cursor-pointer justify-between")}
        >
          <KartBaslik badge={<FlashcardKindBadge kind={card.kind} />} kapsam={kapsam} bookmarked={card.bookmarked} onBookmark={onBookmark} onReport={onReport} />
          <p className={cn("text-balance py-3 text-center text-ink", uzun ? "type-heading" : "type-title")}>{card.front}</p>
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={onFlip} tabIndex={flipped ? -1 : 0}>
              Cevabı gör <KeyHint keys="Boşluk" />
            </Button>
          </div>
        </section>

        {/* Arka yüz */}
        <section
          aria-label="Cevap"
          aria-hidden={!flipped}
          onClick={(e) => yuzeyTiklamasi(e) && onFlip()}
          className={cn(yuz, "kart-yuz-arka cursor-pointer")}
        >
          <KartBaslik badge={<Badge tone="success">Cevap</Badge>} kapsam={kapsam} bookmarked={card.bookmarked} onBookmark={onBookmark} onReport={onReport} />
          <div className="flex max-h-[55dvh] min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <p className="type-heading text-ink">{card.back}</p>
            {card.explanation ? (
              <>
                <hr className="border-line" />
                <SummaryBody text={card.explanation} className="type-body-sm" />
              </>
            ) : null}
            {card.articles.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-no-flip>
                {card.articles.map((a) =>
                  a.legislationSlug ? (
                    <ArticlePeek key={`${a.legislationSlug}-${a.no}`} lawSlug={a.legislationSlug} no={a.no} title={a.title} />
                  ) : (
                    <span key={a.no} className="inline-flex h-7 items-center rounded-pill border border-line bg-surface-alt px-2 type-label text-ink-soft">
                      md {a.no}
                    </span>
                  ),
                )}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onFlip} tabIndex={flipped ? 0 : -1}>
              Soruya dön
            </Button>
            {solveHref ? (
              <Link
                href={solveHref}
                tabIndex={flipped ? 0 : -1}
                className="tk-interactive inline-flex min-h-9 items-center gap-1 rounded-control px-2 type-subhead text-accent-ink hover:bg-accent-soft"
              >
                Bu konudan soru çöz <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Kart üst satırı: tür/cevap rozeti + kapsam etiketi solda, hata bildir + favori (44 px) sağda. */
function KartBaslik({
  badge,
  kapsam,
  bookmarked,
  onBookmark,
  onReport,
}: {
  badge: ReactNode;
  kapsam: string;
  bookmarked: boolean;
  onBookmark?: () => void;
  onReport?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {badge}
        <span className="type-label truncate text-ink-subtle">{kapsam}</span>
      </div>
      {onReport ? (
        <button
          type="button"
          onClick={onReport}
          aria-label="Hata bildir"
          title="Hata bildir"
          className="tk-interactive -mt-2 flex size-11 shrink-0 items-center justify-center rounded-control text-ink-soft hover:bg-surface-alt"
        >
          <Flag size={20} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {onBookmark ? (
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "Favorilerden çıkar" : "Favorilere ekle"}
          title={bookmarked ? "Favorilerden çıkar (F)" : "Favorilere ekle (F)"}
          className={cn(
            "tk-interactive -mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-control hover:bg-surface-alt",
            bookmarked ? "text-accent-ink" : "text-ink-soft",
          )}
        >
          <Bookmark size={22} strokeWidth={1.75} aria-hidden {...(bookmarked ? { fill: "currentColor" } : {})} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Köşe rozeti (puan yönü) */

/** Kart uçarken köşede: renk tek başına anlam taşımaz, metin eşlik eder (Doc 26 §5). */
export function KoseRozeti({ rating }: { rating: FlashcardRating }) {
  const bilinen = rating !== "again";
  const Icon = bilinen ? Check : RotateCcw;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-3.5 inline-flex items-center gap-1.5 rounded-pill border py-1.5 pr-3 pl-2.5 text-[13px] leading-4 font-semibold",
        bilinen ? "right-auto left-4 border-success bg-success-soft text-success-ink" : "right-4 border-danger bg-danger-soft text-danger-ink",
      )}
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden />
      {bilinen ? "Biliyorum" : "Tekrar"}
    </span>
  );
}

/* ---------------------------------------------------------------- Puan çubuğu */

/** İki düğme (karar 4): Tekrar (danger-soft/danger-ink) · Biliyorum (accent/on-accent). 56 px. */
export function RatingBar({
  onAgain,
  onKnown,
  disabled,
}: {
  onAgain: () => void;
  onKnown: () => void;
  disabled?: boolean;
}) {
  const btn =
    "tk-interactive inline-flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-card type-subhead text-[16px] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]";
  return (
    <div className="flex gap-3" role="group" aria-label="Puanla">
      <button type="button" onClick={onAgain} disabled={disabled} className={cn(btn, "bg-danger-soft text-danger-ink hover:brightness-95")}>
        <RotateCcw size={20} strokeWidth={1.75} aria-hidden />
        Tekrar <KeyHint keys="←" />
      </button>
      <button type="button" onClick={onKnown} disabled={disabled} className={cn(btn, "bg-accent text-on-accent hover:brightness-110")}>
        <Check size={20} strokeWidth={2} aria-hidden />
        Biliyorum <KeyHint keys="→" />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- Geri al şeridi */

/** Kart çıkınca 5 sn: sonuç metni + "Geri al" (44 px). Olay sunucuda geri alınır. */
export function UndoStrip({ rating, onUndo }: { rating: FlashcardRating; onUndo: () => void }) {
  const bilinen = rating !== "again";
  const Icon = bilinen ? Check : RotateCcw;
  return (
    <div role="status" className="flex items-center gap-3 rounded-card bg-surface-alt py-2 pr-2 pl-4">
      <Icon size={18} strokeWidth={2} aria-hidden className={bilinen ? "text-success-ink" : "text-danger-ink"} />
      <span className="type-body-sm flex-1 text-ink">{bilinen ? "Biliyorum işaretlendi" : "Tekrar işaretlendi"}</span>
      <button
        type="button"
        onClick={onUndo}
        className="tk-interactive inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 type-subhead text-accent-ink hover:bg-surface"
      >
        <Undo2 size={16} strokeWidth={2} aria-hidden />
        Geri al <KeyHint keys="Z" />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- Oturum sonu */

/**
 * Oturum sonu paneli (Figma 161:1019; seans `ResultPanel` dili): "BU TUR" · Lora "16 / 20 biliyorum"
 * · koç cümlesi · üç istatistik kutusu · günlük kart hedefi. Eylemler çağıranın.
 */
export function FlashcardResultPanel({
  result,
  line,
  learnedDelta,
}: {
  result: FlashcardSessionSummary;
  line: string;
  learnedDelta: number;
}) {
  const s = result.summary;
  const goal = result.dailyGoal;
  const kalan = Math.max(0, goal.target - goal.done);
  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label={`Bu tur: ${s.reviewed} kartta ${s.known} biliyorum. ${line}`}
        className="theme-dark flex flex-col gap-1 rounded-panel bg-panel px-5 pt-3 pb-5 text-panel-ink"
      >
        <span className="type-label text-panel-soft">Bu tur</span>
        <p className="tabular flex flex-wrap items-baseline gap-x-2 font-display">
          <span className="text-[clamp(56px,12vw,80px)] leading-[1.04] font-medium tracking-[-0.03em] text-accent">{s.known}</span>
          <span className="text-[22px] leading-7 text-panel-soft">/ {s.reviewed} biliyorum</span>
        </p>
        <p className="type-subhead text-panel-soft">{line}</p>
      </section>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Öğrenildi" value={learnedDelta > 0 ? `+${learnedDelta}` : "0"} tone="success" hint={learnedDelta > 0 ? "bu tur" : "henüz değil"} />
        <StatTile label="Tekrar" value={s.again} tone={s.again > 0 ? "danger" : "accent"} hint="bu tur" />
        <StatTile
          label="Sıradaki"
          value={result.due.count > 0 ? result.due.count : result.due.nextAt ? relativeDay(result.due.nextAt) : null}
          hint={result.due.count > 0 ? "kart bekliyor" : "kart"}
        />
      </div>
      <section aria-label="Günlük kart hedefi" className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="type-subhead text-ink">Günlük kart hedefi</span>
          <span className="type-stat tabular text-accent">
            {goal.done} / {goal.target}
          </span>
        </div>
        <ProgressBar value={goal.target > 0 ? goal.done / goal.target : 0} height={6} label="Günlük kart hedefi" />
        <span className="type-body-sm text-ink-soft">{kalan === 0 ? "Bugünkü hedef tamam." : `${kalan} kart daha`}</span>
      </section>
    </div>
  );
}
