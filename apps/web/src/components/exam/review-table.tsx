"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, Flag, Lock, Minus, X } from "lucide-react";
import type { AttemptReview, ReviewQuestion } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatStem } from "@/lib/stem-format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/question";
import { StatTile } from "@/components/ui/stat-tile";

type Filter = "all" | "wrong" | "blank" | "flagged" | "majority";

/**
 * Cevap incelemesi (Doc 50 M5/W3): süzgeçli satırlar, satır açılınca soru ayrıntısı
 * (şıklar, açıklama, Türkiye/Süren karoları). Türkiye alanları Premium; kilit sunucudan.
 * Kaynak etiketi GÖSTERİLMEZ.
 */
export function ReviewTable({
  review,
  questions,
}: {
  review: AttemptReview;
  questions: ReviewQuestion[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const qOf = useMemo(() => new Map(questions.map((q) => [q.questionId, q])), [questions]);
  const counts = useMemo(
    () => ({
      wrong: review.items.filter((i) => i.status === "wrong").length,
      blank: review.items.filter((i) => i.status === "blank").length,
      flagged: review.items.filter((i) => i.flagged).length,
    }),
    [review.items],
  );
  const rows = review.items.filter((i) =>
    filter === "all"
      ? true
      : filter === "wrong"
        ? i.status === "wrong"
        : filter === "blank"
          ? i.status === "blank"
          : filter === "flagged"
            ? i.flagged
            : i.missedMajority,
  );

  return (
    <section className="flex flex-col gap-3" aria-label="Cevap incelemesi">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-heading text-ink">Cevap incelemesi</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Süzgeç">
          <Chip label="Tümü" selected={filter === "all"} onClick={() => setFilter("all")} />
          <Chip label={`Yanlış ${counts.wrong}`} selected={filter === "wrong"} onClick={() => setFilter("wrong")} />
          <Chip label={`Boş ${counts.blank}`} selected={filter === "blank"} onClick={() => setFilter("blank")} />
          <Chip label={`İşaretli ${counts.flagged}`} icon={Flag} selected={filter === "flagged"} onClick={() => setFilter("flagged")} />
          <Chip
            label="Çoğunluk bildi"
            icon={review.locked ? Lock : undefined}
            selected={filter === "majority"}
            disabled={review.locked}
            onClick={() => setFilter("majority")}
            title={review.locked ? "Premium ile açılır" : undefined}
          />
        </div>
      </div>

      {!review.locked && review.majorityMissed != null && review.majorityMissed > 0 ? (
        <Card tone="accent" className="flex flex-col gap-0.5">
          <p className="type-subhead text-accent-ink">Çoğunluğun bildiği {review.majorityMissed} soruyu kaçırdın</p>
          <p className="type-body-sm text-ink-soft">Türkiye&apos;nin %70&apos;inden fazlasının doğru yaptığı sorular. Önce bunlara bak.</p>
        </Card>
      ) : null}
      {review.locked ? (
        <Card className="flex items-center gap-3">
          <Lock size={18} className="shrink-0 text-ink-subtle" aria-hidden />
          <p className="type-body-sm text-ink-soft">
            Soru bazlı Türkiye doğru oranı, ortalama süre ve &quot;çoğunluk bildi&quot; süzgeci Premium ile açılır.{" "}
            <Link href="/premium" className="font-semibold text-accent-ink hover:underline">Premium&apos;u incele</Link>
          </p>
        </Card>
      ) : null}

      <Card className="divide-y divide-line p-0">
        <div className="hidden grid-cols-[3rem_1fr_7rem_7rem_6rem_2.5rem] gap-3 px-4 py-2 md:grid">
          {["#", "Ders · konu", "Durum", "Türkiye", "Süre", ""].map((h) => (
            <span key={h} className="type-label text-ink-subtle">{h}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="type-body-sm px-4 py-6 text-center text-ink-subtle">Bu süzgeçte soru yok.</p>
        ) : null}
        {rows.map((it) => {
          const q = qOf.get(it.questionId);
          const isOpen = open === it.questionId;
          return (
            <div key={it.questionId} className={cn(isOpen && "bg-surface-alt/40")}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : it.questionId)}
                aria-expanded={isOpen}
                className="tk-interactive grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-surface-alt/60 md:grid-cols-[3rem_1fr_7rem_7rem_6rem_2.5rem]"
              >
                <span className="type-subhead tabular text-ink">{it.no}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="type-subhead truncate text-ink">{it.course ?? "—"}</span>
                  <span className="type-body-sm truncate text-ink-soft">{it.topic ?? ""}</span>
                </span>
                <StatusCell status={it.status} flagged={it.flagged} />
                <span className="type-body-sm tabular hidden text-ink-soft md:block">
                  {it.turkeyRate != null ? `%${it.turkeyRate}` : review.locked ? "🔒" : "—"}
                </span>
                <span className="type-body-sm tabular hidden text-ink-subtle md:block">
                  {it.seconds != null ? `${Math.floor(it.seconds / 60)}:${String(it.seconds % 60).padStart(2, "0")}` : "—"}
                </span>
                <ChevronDown size={16} className={cn("hidden text-ink-subtle transition-transform md:block", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen && q ? <Detail q={q} item={it} locked={review.locked} /> : null}
            </div>
          );
        })}
      </Card>
    </section>
  );
}

function StatusCell({ status, flagged }: { status: "correct" | "wrong" | "blank"; flagged: boolean }) {
  const m = {
    correct: { icon: Check, cls: "text-success-ink", label: "Doğru" },
    wrong: { icon: X, cls: "text-danger-ink", label: "Yanlış" },
    blank: { icon: Minus, cls: "text-ink-subtle", label: "Boş" },
  }[status];
  const Icon = m.icon;
  return (
    <span className={cn("type-body-sm inline-flex items-center gap-1.5", m.cls)}>
      <Icon size={16} aria-hidden /> {m.label}
      {flagged ? <Flag size={12} className="text-ink-subtle" aria-label="işaretli" /> : null}
    </span>
  );
}

function Detail({ q, item, locked }: { q: ReviewQuestion; item: AttemptReview["items"][number]; locked: boolean }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line px-4 py-4 md:grid md:grid-cols-[1fr_20rem] md:gap-6">
      <div className="flex flex-col gap-3">
        <p className="type-body whitespace-pre-line text-ink">{formatStem(q.stem)}</p>
        {q.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.mediaUrl} alt="Soru görseli" loading="lazy" className="max-h-64 rounded-card border border-line" />
        ) : null}
        <div className="flex flex-col gap-1.5">
          {q.options.map((o) => {
            const chosen = q.selectedOptionId === o.id;
            let state: QuestionOptionState = "disabled";
            if (o.isCorrect) state = chosen ? "correct" : "missed";
            else if (chosen) state = "incorrect";
            return <QuestionOption key={o.id} label={o.label} text={o.text} state={state} />;
          })}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {q.adjustment ? (
          <Badge tone="warning" className="self-start">
            {q.adjustment === "credit_all" ? "İptal: herkese doğru sayıldı" : "İptal: hesaptan çıkarıldı"}
          </Badge>
        ) : null}
        {q.explanation ? (
          <Card tone="alt" className="flex flex-col gap-1">
            <p className="type-subhead inline-flex items-center gap-1.5 text-ink"><BookOpen size={16} aria-hidden /> Açıklama</p>
            <p className="type-body-sm whitespace-pre-line text-ink-soft">{q.explanation}</p>
          </Card>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Türkiye"
            value={locked ? null : item.turkeyRate != null ? `%${item.turkeyRate}` : null}
            hint={locked ? "Premium ile açılır" : "doğru yaptı"}
          />
          <StatTile
            label="Süren"
            value={item.seconds != null ? `${Math.floor(item.seconds / 60)}:${String(item.seconds % 60).padStart(2, "0")}` : null}
            hint={!locked && item.avgSeconds != null ? `ortalama ${Math.floor(item.avgSeconds / 60)}:${String(item.avgSeconds % 60).padStart(2, "0")}` : undefined}
          />
        </div>
        {item.missedMajority ? (
          <p className="type-body-sm rounded-card bg-warning-soft p-3 text-warning-ink">Çoğunluğun bildiği bir soru; bu konuyu çalışılacaklara ekledik.</p>
        ) : null}
      </div>
    </div>
  );
}
