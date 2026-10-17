import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import type { LawSummary } from "@/lib/public-api";

/** Kanun kartının gövdesi — kütüphanede bağlantı kartı, seçim modunda seçilebilir kart aynı gövdeyi giyer. */
export function LawCardBody({ law }: { law: LawSummary }) {
  return (
    <>
      <p className="type-subhead mb-1 text-ink">{law.name}</p>
      <p className="type-body-sm text-ink-soft">
        {law.questionCount > 0 ? `${law.questionCount} çıkmış soru · ` : ""}
        {law.exams
          .map((e) => `${e.examName} %${e.weightPercent}`)
          .join(" · ") || "müfredat konusu"}
      </p>
      {law.readable || law.isPremium ? (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {law.readable ? (
            <Badge tone="accent">
              <BookOpen size={12} aria-hidden /> Tam metin
            </Badge>
          ) : null}
          {law.isPremium ? <PremiumBadge variant="soft" /> : null}
        </span>
      ) : null}
    </>
  );
}

/** Kütüphane kartı — kanun sayfasına bağlantı (SEO iç bağlantı merkezi). */
export function LawCard({ law }: { law: LawSummary }) {
  return (
    <Link
      href={`/kanun/${law.slug}`}
      className="tk-interactive flex flex-col rounded-card border border-line bg-surface p-4 hover:border-ink-soft"
    >
      <LawCardBody law={law} />
    </Link>
  );
}

export function LawCardGrid({ laws }: { laws: LawSummary[] }) {
  const sirali = [...laws].sort((a, b) => b.questionCount - a.questionCount);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sirali.map((l) => (
        <LawCard key={l.slug} law={l} />
      ))}
    </div>
  );
}
