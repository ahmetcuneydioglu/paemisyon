import Link from "next/link";
import { BookOpenText, CheckCircle2, Lock } from "lucide-react";
import { masteryLabel, unitProgressPct, weakestUnit, type SummaryUnitListItem } from "@/lib/ozet";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { ProgressBar } from "@/components/ui/progress";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { cn } from "@/lib/cn";

/**
 * Konu odasının "Özet" yüzü (Doc 53 §6): ünite listesi — ilerleme, süre, kilit.
 * Ünite yoksa hiç çizilmez (oda eski hâliyle kalır).
 */
export function UnitListSection({
  units,
  title = "Konu özetleri",
  className,
}: {
  units: SummaryUnitListItem[];
  title?: string;
  className?: string;
}) {
  if (units.length === 0) return null;
  const zayif = weakestUnit(units);
  return (
    <section className={cn("flex flex-col gap-2", className)} aria-label={title}>
      <SectionHeader title={title} />
      {zayif ? (
        <p className="type-body-sm text-ink-soft">
          En zayıf ünite: <span className="text-ink">{zayif.title.split(" — ")[0]}</span> (%{zayif.mastery!.accuracyPct ?? 0}).{" "}
          {zayif.progress?.completedAt ? "Özetini okudun; sorularla pekiştir." : "Önce özetini oku."}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {units.map((u) => {
          const pct = unitProgressPct(u);
          const done = Boolean(u.progress?.completedAt);
          return (
            <li key={u.slug}>
              <Link
                href={`/ozet/${u.slug}`}
                className="tk-interactive flex items-center gap-4 rounded-card border border-line bg-surface p-4 hover:border-accent/50"
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-pill",
                    done ? "bg-success-soft text-success-ink" : "bg-accent-soft text-accent-ink",
                  )}
                  aria-hidden
                >
                  {done ? <CheckCircle2 size={20} /> : u.locked ? <Lock size={18} /> : <BookOpenText size={20} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="type-subhead text-ink">{u.title.split(" — ")[0]}</span>
                    {u.isPremium ? <PremiumBadge variant={u.locked ? "solid" : "soft"} /> : null}
                    {masteryLabel(u.mastery) ? (
                      <Badge tone={u.mastery!.band === "weak" ? "warning" : u.mastery!.band === "strong" ? "success" : "neutral"}>
                        {masteryLabel(u.mastery)}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="type-body-sm text-ink-subtle">
                    md {u.articleLabel ?? `${u.articleFrom}–${u.articleTo}`} · {u.readingMinutes} dk · {u.blockCount} kart
                    {u.progress && !done ? ` · kaldığın yerden` : ""}
                  </span>
                  {u.progress ? (
                    <ProgressBar value={pct} tone={done ? "success" : "accent"} height={4} label={`${u.title} ilerlemesi`} />
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
