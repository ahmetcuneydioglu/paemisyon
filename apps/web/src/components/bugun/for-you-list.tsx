import Link from "next/link";
import { cn } from "@/lib/cn";

export interface ForYouRow {
  key: string;
  label: string;
  ctaLabel: string;
  href: string;
}

/**
 * Senin için (Bugün v3, Figma 68:474; Expo `ForYouList`): en çok 4 satır, 56 px, 1 px çizgi;
 * sağda altın kenarlı hap (koyuda altın metin, açıkta kahve). Satırın tamamı bağlantıdır.
 */
export function ForYouList({ rows }: { rows: ForYouRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section
      aria-labelledby="senin-icin-baslik"
      className="flex flex-col gap-2"
    >
      <h2 id="senin-icin-baslik" className="type-label text-ink-subtle">
        Senin için
      </h2>
      <ul className="rounded-card border border-line bg-surface px-4">
        {rows.map((r, i) => (
          <li key={r.key}>
            <Link
              href={r.href}
              aria-label={`${r.label}. ${r.ctaLabel}`}
              className={cn(
                "tk-interactive flex min-h-14 items-center gap-3 hover:bg-surface-alt/40",
                i < rows.length - 1 && "border-b border-line",
              )}
            >
              <span className="type-body min-w-0 flex-1 text-[15px] leading-5 text-ink">
                {r.label}
              </span>
              <span className="type-subhead inline-flex min-h-8 shrink-0 items-center rounded-pill border border-accent px-3 text-[14px] leading-[18px] text-accent-ink">
                {r.ctaLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
