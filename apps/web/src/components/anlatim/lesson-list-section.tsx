import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { LessonSectionItem } from "@/lib/anlatim";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/**
 * Konu odasının "Konu anlatımı" bölümü (Doc 57): bölüm başlığı altında dersler — hedef, süre, okundu/devam.
 * Bölüm yoksa hiç çizilmez. Kaynak kitap adı görünmez.
 */
export function LessonListSection({ sections, className }: { sections: LessonSectionItem[]; className?: string }) {
  const dolu = sections.filter((s) => s.lessons.length > 0);
  if (dolu.length === 0) return null;
  return (
    <section className={cn("flex flex-col gap-4", className)} aria-label="Konu anlatımı">
      <SectionHeader title="Konu anlatımı" />
      {dolu.map((s) => (
        <div key={s.slug} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-subhead text-ink">{s.title}</h3>
            <span className="type-label text-ink-subtle">{s.lessons.length} ders</span>
            {s.isPremium ? <PremiumBadge variant={s.locked ? "solid" : "soft"} /> : null}
          </div>
          {s.subtitle ? <p className="type-body-sm text-ink-soft">{s.subtitle}</p> : null}
          <ul className="flex flex-col gap-2">
            {s.lessons.map((l, i) => {
              const okundu = Boolean(l.progress?.readAt);
              const devam = !okundu && (l.progress?.offset ?? 0) > 0;
              return (
                <li key={l.slug}>
                  <Link
                    href={`/anlatim/${l.slug}`}
                    className="tk-interactive flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:border-accent/50"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-control",
                        okundu ? "bg-success-soft text-success-ink" : "bg-accent-soft text-accent-ink",
                      )}
                      aria-hidden
                    >
                      {okundu ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="type-subhead text-ink">
                        {i + 1}. {l.title}
                      </span>
                      <span className="type-body-sm text-ink-soft">
                        {l.goal} · {l.readingMinutes} dk
                      </span>
                    </span>
                    {okundu ? <Badge tone="success">Okundu</Badge> : devam ? <Badge tone="accent">Devam</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
