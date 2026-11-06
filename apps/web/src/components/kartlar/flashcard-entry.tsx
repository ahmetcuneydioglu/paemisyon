"use client";

import {
  AlertTriangle,
  Bookmark,
  ChevronRight,
  Clock,
  Layers,
  Lock,
  Shuffle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import {
  countsNote,
  FLASHCARD_MODE,
  FLASHCARD_MODE_ORDER,
  isLockedScope,
  kartlarHref,
  modeCount,
  roomCountsToModeCounts,
  type FlashcardMode,
  type FlashcardOverview,
  type FlashcardRoomCounts,
  type FlashcardScope,
  type FlashcardSource,
} from "@/lib/kartlar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashcardStateBar } from "./flashcard-kit";

/**
 * Bilgi kartları giriş satırı (Doc 56 karar B): ders odası "Konu oku" üçüncü bölümü, konu
 * diyaloğu ve konu odası "Bu konuda". Kart yoksa çağıran satırı hiç çizmez (`hasFlashcards`);
 * kilitliyse rozet "Premium" ve satır Premium sayfasına gider; değilse mod diyaloğu açılır.
 */
export function FlashcardEntry({
  counts,
  scope,
  label,
  source,
  divider = false,
  title = "Bilgi kartları",
}: {
  counts: FlashcardRoomCounts;
  scope: FlashcardScope;
  /** Kapsam adı: diyalog başlığı altı ve oynatıcı üst şeridi. */
  label: string;
  source: FlashcardSource;
  divider?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const mc = roomCountsToModeCounts(counts);
  const locked = isLockedScope(counts);
  const rozet = locked ? <Badge tone="warning">Premium</Badge> : mc.due > 0 ? <Badge tone="warning">{mc.due} tekrar</Badge> : null;
  const inner = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-alt">
        <Layers size={18} strokeWidth={1.75} className="text-ink-soft" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="type-subhead text-ink">{title}</span>
        <span className="type-body-sm text-ink-subtle">{locked ? `${counts.locked} kart · Premium ile açılır` : countsNote(mc)}</span>
        {!locked && mc.total > 0 ? <FlashcardStateBar counts={mc} className="mt-0.5" /> : null}
      </span>
      {rozet}
      <ChevronRight size={18} className="shrink-0 text-ink-subtle" aria-hidden />
    </>
  );
  const cls = cn(
    "tk-interactive flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left hover:opacity-80",
    divider && "border-b border-line",
  );
  if (locked) {
    return (
      <Link href="/premium" className={cls} aria-label={`${title}, ${counts.locked} kart, Premium ile açılır`}>
        {inner}
      </Link>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={cls}>
        {inner}
      </button>
      <FlashcardModeDialog open={open} onClose={() => setOpen(false)} scope={scope} label={label} source={source} />
    </>
  );
}

/* ---------------------------------------------------------------- Mod diyaloğu */

const MODE_ICON: Record<FlashcardMode, LucideIcon> = {
  due: Clock,
  new: Sparkles,
  hard: AlertTriangle,
  favorites: Bookmark,
  all: Layers,
  mixed: Shuffle,
};

function hataMetni(e: unknown): string {
  if (e instanceof ApiClientError) {
    if (e.code === "FLASHCARDS_DISABLED") return "Bilgi kartları henüz açık değil.";
    if (e.status === 401) return "Kartlar için oturum açmalısın.";
    return e.message;
  }
  return "Kartlar şu an yüklenemedi. Bağlantını kontrol edip yeniden dene.";
}

/**
 * "Nasıl çalışmak istersin?" (Figma 159:913): kapsam künyesi + durum çubuğu, sunucunun önerdiği
 * mod birincil düğme, kaldığın yer varsa ikincil, kalan modlar satır; sayısı sıfır olan sönük.
 * Özet açılışta çekilir (`/me/flashcards/overview`); karar sunucuda, burada yalnız çizim.
 */
export function FlashcardModeDialog({
  open,
  onClose,
  scope,
  label,
  source,
}: {
  open: boolean;
  onClose: () => void;
  scope: FlashcardScope;
  label: string;
  source: FlashcardSource;
}) {
  const [data, setData] = useState<FlashcardOverview | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data !== undefined || error) return;
    let aktif = true;
    const q = new URLSearchParams();
    if (scope.unitSlug) q.set("unitSlug", scope.unitSlug);
    else if (scope.topicId) q.set("topicId", scope.topicId);
    else if (scope.courseId) q.set("courseId", scope.courseId);
    apiClient<FlashcardOverview>(`/me/flashcards/overview?${q.toString()}`)
      .then((d) => aktif && setData(d))
      .catch((e: unknown) => aktif && setError(hataMetni(e)));
    return () => {
      aktif = false;
    };
  }, [open, data, error, scope.unitSlug, scope.topicId, scope.courseId]);

  const o = data;
  const c = o?.counts;
  const oneri = o?.suggestedMode ?? "all";
  const oneriSayi = c ? modeCount(c, oneri) : 0;
  const href = (mode: FlashcardMode, opts?: { resume?: boolean }) => kartlarHref(scope, mode, source, o?.scope.label ?? label, opts);

  return (
    <Dialog open={open} onClose={onClose} title="Bilgi kartları" size="sm">
      {error ? (
        <p className="type-body-sm text-ink-soft">{error}</p>
      ) : !o || !c ? (
        <div className="flex flex-col gap-3 py-1" aria-busy>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-1 w-full" radius="pill" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : o.locked ? (
        <div className="flex flex-col gap-3">
          <p className="type-body-sm text-ink-soft">
            {o.scope.label} · {c.locked} kart
          </p>
          <p className="type-subhead flex items-center gap-2 text-ink">
            <Lock size={18} strokeWidth={1.75} aria-hidden /> Bu kapsamın kartları Premium ile açılır
          </p>
          <ButtonLink href="/premium">Premium&apos;u gör</ButtonLink>
        </div>
      ) : o.dailyLimit && o.dailyLimit.remaining === 0 ? (
        // Günlük hak doldu (Doc 56 §3h): modlar gizlenir, Premium teklifi; sayaç yarın sıfırlanır.
        <div className="flex flex-col gap-3">
          <p className="type-body-sm text-ink-soft">
            {o.scope.label} · {c.total} kart
          </p>
          <p className="type-subhead flex items-center gap-2 text-ink">
            <Lock size={18} strokeWidth={1.75} aria-hidden /> Bugünlük kart hakkın doldu · {o.dailyLimit.used} / {o.dailyLimit.limit}
          </p>
          <p className="type-body-sm text-ink-soft">Yarın yeniden {o.dailyLimit.limit} kart; Premium ile sınırsız.</p>
          <ButtonLink href="/premium">Premium ile sınırsız çalış</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="type-body-sm text-ink-soft">
              {o.scope.label} · {c.total} kart
            </p>
            <FlashcardStateBar counts={c} />
            <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Öğrenme durumu">
              <Legend dot="bg-success" label={`${c.learned} öğrenildi`} />
              <Legend dot="bg-accent" label={`${c.learning} öğreniliyor`} />
              <Legend dot="bg-surface-alt" label={`${c.new} yeni`} />
            </ul>
          </div>
          {oneriSayi > 0 ? (
            <ButtonLink href={href(oneri)}>
              {oneri === "due" ? `Tekrara başla · ${oneriSayi} kart` : `${FLASHCARD_MODE[oneri].title} · ${oneriSayi} kart`}
            </ButtonLink>
          ) : null}
          {o.resume && o.resume.remaining > 0 ? (
            <ButtonLink href={href(o.resume.mode, { resume: true })} variant="secondary">
              Kaldığın yerden devam · {o.resume.remaining} kart
            </ButtonLink>
          ) : null}
          <div>
            {FLASHCARD_MODE_ORDER.filter((m) => m !== oneri && m !== "due").map((m, i, arr) => {
              const n = modeCount(c, m);
              const Icon = MODE_ICON[m];
              const aktif = n > 0;
              return (
                <ListRow
                  key={m}
                  title={FLASHCARD_MODE[m].title}
                  subtitle={FLASHCARD_MODE[m].subtitle}
                  leading={<Icon size={20} strokeWidth={1.75} aria-hidden />}
                  trailing={m === "mixed" ? null : <span className="type-subhead tabular text-ink-soft">{n}</span>}
                  href={aktif ? href(m) : undefined}
                  chevron={aktif}
                  divider={i < arr.length - 1}
                  className={aktif ? undefined : "opacity-45"}
                />
              );
            })}
          </div>
          {o.dailyGoal.target > 0 ? (
            <p className="type-body-sm text-ink-subtle">
              Bugün {o.dailyGoal.done} / {o.dailyGoal.target} kart
              {o.dailyLimit?.limit != null ? ` · günlük hak ${o.dailyLimit.remaining} kart kaldı` : ""}
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <li className="type-body-sm inline-flex items-center gap-1.5 text-ink-soft">
      <span className={cn("size-2 rounded-full", dot)} aria-hidden />
      {label}
    </li>
  );
}
