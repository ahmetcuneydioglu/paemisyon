"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { bridgeSessionHref, masteryLabel, type SummaryUnitDetail } from "@/lib/ozet";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { SummaryBlockCard } from "./summary-block-card";
import { cn } from "@/lib/cn";

const KAYIT_ARALIGI_MS = 2500;

/**
 * Ünite okuyucu (Doc 53 §6): dikey kart akışı; görünen en ileri kart ilerleme olarak kaydedilir
 * (girişliyse), son kart görülünce ünite "bitti" sayılır; kilitliyse açık kartlardan sonra
 * premium kapısı; sonda "bu üniteden soru çöz" köprüsü (madde kapsamlı seans).
 */
export function UnitReader({
  unit,
  loggedIn,
  premiumHref,
  loginHref,
}: {
  unit: SummaryUnitDetail;
  loggedIn: boolean;
  premiumHref: string;
  loginHref: string;
}) {
  const cards = useMemo(() => unit.blocks.filter((b) => b.type !== "bridge"), [unit.blocks]);
  const bridge = unit.blocks.find((b) => b.type === "bridge");
  const [maxSeen, setMaxSeen] = useState(unit.progress?.lastBlockIndex ?? 0);
  // Bitti: sunucudan geldiyse ya da son kart görüldüyse (kilitli ünitede son AÇIK kart bitirmez).
  const done =
    Boolean(unit.progress?.completedAt) || (!unit.locked && cards.length > 0 && maxSeen >= cards.length - 1);
  const lastSent = useRef<{ idx: number; done: boolean }>({
    idx: unit.progress?.lastBlockIndex ?? -1,
    done: Boolean(unit.progress?.completedAt),
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Görünürlük: kartlar ekrana girdikçe en ileri indeks ilerler.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.blockIndex);
          if (Number.isFinite(i)) setMaxSeen((m) => (i > m ? i : m));
        }
      },
      { threshold: 0.5 },
    );
    el.querySelectorAll<HTMLElement>("[data-block-index]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [cards.length]);

  // İlerleme kaydı: seyrek ve sessiz; misafirde hiç.
  useEffect(() => {
    if (!loggedIn) return;
    if (lastSent.current.idx === maxSeen && lastSent.current.done === done) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastSent.current = { idx: maxSeen, done };
      void apiClient("/me/summaries/progress", {
        method: "POST",
        body: { slug: unit.slug, lastBlockIndex: maxSeen, completed: done || undefined },
      }).catch(() => undefined);
    }, KAYIT_ARALIGI_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [maxSeen, done, loggedIn, unit.slug]);

  const pct = done ? 100 : cards.length ? Math.round(((maxSeen + 1) / unit.totalBlocks) * 100) : 0;
  const kalan = unit.totalBlocks - unit.blocks.length;
  const scope = `${unit.topic.name} · ${unit.title.split(" — ")[0]}`;

  return (
    <div ref={root} className="flex flex-col gap-4">
      {loggedIn ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <ProgressBar value={pct} tone={done ? "success" : "accent"} label="Okuma ilerlemesi" className="flex-1" />
            <span className={cn("type-label tabular-nums", done ? "text-success-ink" : "text-ink-subtle")}>
              {done ? "Bitti" : `%${pct}`}
            </span>
          </div>
          {unit.mastery && unit.mastery.band !== "new" ? (
            <p className={cn("type-body-sm", unit.mastery.band === "weak" ? "text-warning-ink" : "text-ink-subtle")}>
              Bu üniteden {unit.mastery.solved} soru çözdün: {masteryLabel(unit.mastery)}
            </p>
          ) : null}
        </div>
      ) : null}

      {cards.map((b, i) => (
        <SummaryBlockCard key={b.id} block={b} lawSlug={unit.legislation.slug} index={i} />
      ))}

      {unit.locked ? (
        <Card tone="alt" className="flex flex-col items-start gap-3 p-5">
          <div className="flex items-center gap-2 type-heading text-ink">
            <Lock size={18} aria-hidden />
            Kalan {kalan} kart Premium
          </div>
          <p className="type-body text-ink-soft">
            Sayı tabloları, tuzak kartları ve &quot;Sınav der ki&quot; bölümü dâhil ünitenin tamamı Premium&apos;da açılır.
            {loggedIn ? "" : " Hesabın varsa önce giriş yap."}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={premiumHref}>Premium&apos;u gör</ButtonLink>
            {!loggedIn ? (
              <ButtonLink href={loginHref} variant="secondary">
                Giriş yap
              </ButtonLink>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!unit.locked && bridge?.session ? (
        <Card tone="accent" className="flex flex-col items-start gap-3 p-5">
          <div className="flex items-center gap-2 type-heading text-ink">
            {done ? <CheckCircle2 size={18} aria-hidden className="text-success-ink" /> : null}
            {done ? "Ünite bitti. Şimdi soruya." : "Okuduğunu soruyla sına"}
          </div>
          <p className="type-body text-ink-soft">
            {bridge.rows?.[0]?.value ? String(bridge.rows[0].value) : `md ${unit.articleFrom}–${unit.articleTo}`} ·
            bu maddelerden çıkmış sorularla.
            {unit.mastery?.band === "weak" ? ` Şu an %${unit.mastery.accuracyPct ?? 0}; 10 soruyla yükselt.` : ""}
          </p>
          {loggedIn ? (
            <ButtonLink
              href={bridgeSessionHref({ topicId: bridge.session.topicId, articleNos: bridge.session.articleNos, scope })}
              leadingIcon={<ArrowRight size={16} aria-hidden />}
            >
              Bu üniteden 10 soru
            </ButtonLink>
          ) : (
            <ButtonLink href={loginHref} variant="secondary">
              Soru çözmek için giriş yap
            </ButtonLink>
          )}
        </Card>
      ) : null}
    </div>
  );
}
