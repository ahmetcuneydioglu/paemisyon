import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Hash, Link2, Scale } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import {
  formatIsoDay,
  type ArticleSummaryValue,
  type PublicArticleSummary,
  type PublicArticleSummaryBrief,
} from "@/lib/ozet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SummaryBody } from "./summary-body";
import { cn } from "@/lib/cn";

type IconProps = { size?: number | string; className?: string; "aria-hidden"?: boolean };

/** Her özet yüzeyinde aynı uyarı: özet resmî metin değildir (Doc 54 §4). */
export function ArticleSummaryDisclaimer({ verifiedAt, className }: { verifiedAt?: string | null; className?: string }) {
  return (
    <p className={cn("type-label text-ink-subtle", className)}>
      Özet; resmî metin değildir.
      {verifiedAt ? ` Mevzuat kontrolü ${formatIsoDay(verifiedAt)}.` : ""}
    </p>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  tone = "neutral",
}: {
  icon: ComponentType<IconProps>;
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning";
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4
        className={cn(
          "inline-flex items-center gap-1.5 type-label",
          tone === "warning" ? "text-warning-ink" : "text-ink-subtle",
        )}
      >
        <Icon size={13} aria-hidden /> {title}
      </h4>
      {children}
    </section>
  );
}

function Bullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex list-disc flex-col gap-1 pl-5 type-body-sm text-ink", className)}>
      {items.map((t, i) => (
        <li key={i} className="text-pretty">
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Süre/sayı satırları: etiket · değer · (fıkra). Tablo değil tanım listesi — mobil dar ekranda alt alta iner. */
function ValueRows({ rows }: { rows: ArticleSummaryValue[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
      {rows.map((r, i) => (
        <div key={i} className="contents">
          <dt className="type-body-sm text-ink-soft">{r.label}</dt>
          <dd className="type-body-sm font-semibold tabular text-ink sm:text-right">
            {r.value}
            {r.ref ? <span className="ml-1 font-normal text-ink-subtle">({r.ref})</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Header({ summary, compact }: { summary: PublicArticleSummaryBrief; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Madde özeti</Badge>
        {summary.repealed ? <Badge tone="neutral">Mülga</Badge> : null}
      </div>
      <h3 className={cn(compact ? "type-subhead" : "type-heading", "text-ink")}>{summary.title}</h3>
    </div>
  );
}

/**
 * Madde özeti kartı (Doc 54). `variant="full"`: girişli çalışma alanı — resmî metnin ALTINDA, bütün alanlar.
 * `variant="compact"`: anon madde sayfası — başlık, kısa özet, temel noktalar; ayrıntı girişli yüzeyde.
 * Mülga maddede yalnız başlık + kısa özet. Kaynak etiketi (sourceLabel) hiçbir yüzeye gelmez.
 */
export function ArticleSummaryCard({
  summary,
  variant,
  detailHref,
  className,
}: {
  summary: PublicArticleSummary | PublicArticleSummaryBrief;
  variant: "full" | "compact";
  /** compact: "ayrıntılı özet" bağlantısı (giriş gerektiren madde sayfası). */
  detailHref?: string;
  className?: string;
}) {
  const full = variant === "full" && "detailed" in summary ? summary : null;
  return (
    <Card tone="alt" className={cn("flex flex-col gap-4 p-5 sm:p-6", className)}>
      <Header summary={summary} compact={variant === "compact"} />
      <p className="type-body text-ink text-pretty">{summary.shortSummary}</p>

      {!summary.repealed && (
        <>
          {full?.detailed ? <SummaryBody text={full.detailed} /> : null}

          {summary.keyPoints.length > 0 && (
            <Section icon={Scale} title="Temel noktalar">
              <Bullets items={summary.keyPoints} />
            </Section>
          )}

          {full && full.conditions.length > 0 && (
            <Section icon={Scale} title="Şartlar">
              <Bullets items={full.conditions} />
            </Section>
          )}

          {full && full.authorityAndLimits.length > 0 && (
            <Section icon={Scale} title="Yetki ve sınırlar">
              <ul className="flex flex-col gap-2">
                {full.authorityAndLimits.map((a, i) => (
                  <li key={i} className="rounded-control border border-line bg-surface p-3">
                    <p className="type-body-sm font-semibold text-ink">
                      {a.authority}
                      {a.ref ? <span className="ml-1 font-normal text-ink-subtle">({a.ref})</span> : null}
                    </p>
                    <p className="type-body-sm text-ink-soft">{a.limit}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {full && (full.timeLimits.length > 0 || full.numericalValues.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {full.timeLimits.length > 0 && (
                <Section icon={Clock} title="Süreler">
                  <ValueRows rows={full.timeLimits} />
                </Section>
              )}
              {full.numericalValues.length > 0 && (
                <Section icon={Hash} title="Sayılar">
                  <ValueRows rows={full.numericalValues} />
                </Section>
              )}
            </div>
          )}

          {full && full.exceptions.length > 0 && (
            <Section icon={AlertTriangle} title="İstisnalar">
              <Bullets items={full.exceptions} />
            </Section>
          )}

          {full && full.examReminders.length > 0 && (
            <Section icon={AlertTriangle} title="Sınavda dikkat" tone="warning">
              <div className="rounded-control border-l-[3px] border-warning bg-warning-soft p-3">
                <Bullets items={full.examReminders} className="text-warning-ink" />
              </div>
            </Section>
          )}

          {full && full.relatedLegislation.length > 0 && (
            <Section icon={Link2} title="İlgili mevzuat">
              <ul className="flex flex-col gap-1 type-body-sm text-ink">
                {full.relatedLegislation.map((r, i) => (
                  <li key={i}>
                    <span className="font-semibold">{r.law}</span>
                    {r.article ? ` md ${r.article}` : ""}
                    {r.note ? <span className="text-ink-soft"> — {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <ArticleSummaryDisclaimer verifiedAt={full?.verifiedAt} />
        {variant === "compact" && detailHref && !summary.repealed ? (
          <Link href={detailHref} className="inline-flex items-center gap-1 type-subhead text-accent-ink hover:underline">
            Ayrıntılı özet <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * Okuyucu satırı (Doc 54 §4): madde metninin altında katlanır "Özet" — native <details>, durum yok,
 * sunucuda da çalışır. Kısa özet + temel noktalar + süre/sayı satırları; "tamamı" madde sayfasına.
 */
export function ArticleSummaryDisclosure({
  summary,
  href,
  className,
}: {
  summary: PublicArticleSummaryBrief;
  href: string;
  className?: string;
}) {
  const rows = [...summary.timeLimits, ...summary.numericalValues];
  return (
    <details className={cn("group mt-3 rounded-control border border-line bg-surface-alt", className)}>
      <summary className="tk-interactive flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 type-subhead text-ink">
          <Badge tone="accent">Özet</Badge>
          <span className="truncate">{summary.title}</span>
        </span>
        <span className="type-label shrink-0 text-ink-subtle group-open:hidden">Aç</span>
        <span className="type-label hidden shrink-0 text-ink-subtle group-open:inline">Kapat</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
        <p className="type-body-sm text-ink text-pretty">{summary.shortSummary}</p>
        {!summary.repealed && summary.keyPoints.length > 0 && <Bullets items={summary.keyPoints} />}
        {!summary.repealed && rows.length > 0 && <ValueRows rows={rows} />}
        {!summary.repealed && summary.examReminders.length > 0 && (
          <div className="rounded-control border-l-[3px] border-warning bg-warning-soft p-3">
            <Bullets items={summary.examReminders} className="text-warning-ink" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ArticleSummaryDisclaimer />
          <Link href={href} className="inline-flex items-center gap-1 type-label text-accent-ink hover:underline">
            Tam özet ve madde sayfası <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </div>
    </details>
  );
}
