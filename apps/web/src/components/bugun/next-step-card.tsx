import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

/**
 * Sıradaki kartı (Bugün v3, Figma 68:474; Expo `NextStepCard` ile aynı): sayfanın TEK birincil
 * eylemi. `panel` laciverti (iki temada koyu), köşe `rounded-panel`, iç 20; üstte etiket + küçük
 * hap, Lora başlık, tek cümle gerekçe, altın düğme. İkincil satır yarım turda "Şimdilik bitir".
 */
export function NextStepCard({
  eyebrow,
  title,
  reason,
  badge,
  ctaLabel,
  href,
  secondary,
}: {
  eyebrow: string;
  title: string;
  reason: string;
  badge?: string | null;
  ctaLabel: string;
  href: string;
  secondary?: { label: string; href: string } | null;
}) {
  return (
    <section
      aria-label={`Sıradaki: ${title}`}
      className="flex flex-col gap-4 rounded-panel bg-panel p-5 text-panel-ink md:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="type-label min-w-0 truncate text-panel-soft">
          {eyebrow}
        </span>
        {badge ? (
          <span className="type-body-sm shrink-0 rounded-pill bg-surface-alt px-2 py-0.5 text-[11px] leading-[14px] text-ink">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="type-title text-balance text-panel-ink">{title}</h2>
        <p className="type-body text-panel-soft">{reason}</p>
      </div>
      <div className="flex flex-col items-start gap-1">
        <ButtonLink href={href} size="lg" className="w-full sm:w-auto">
          {ctaLabel}
        </ButtonLink>
        {secondary ? (
          <Link
            href={secondary.href}
            className="type-body-sm inline-flex min-h-11 items-center px-1 text-panel-soft underline-offset-4 hover:underline"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
