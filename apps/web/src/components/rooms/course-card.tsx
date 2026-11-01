import Link from "next/link";
import type { Band } from "@/lib/public-api";
import { bandBarTone, bandPctClass } from "@/lib/rooms";
import { cn } from "@/lib/cn";
import { ProgressBar } from "@/components/ui/progress";

/**
 * Ders kartı (Doc 49/17; Expo `CourseCard`, Figma 108:295): ad (≤3 satır), serif hâkimiyet
 * yüzdesi, sunucunun seçtiği tek künye ve 4 px çubuk. Ders odasına gider.
 */
export function CourseCard({
  href,
  name,
  accuracyPct,
  band,
  note,
}: {
  href: string;
  name: string;
  accuracyPct: number | null;
  band: Band;
  note: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${name}, ${accuracyPct == null ? "henüz ölçülmedi" : `hâkimiyet yüzde ${accuracyPct}`}, ${note}`}
      className="tk-interactive flex min-h-28 flex-col justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-3 hover:border-ink-soft active:scale-[0.99]"
    >
      <span className="type-subhead line-clamp-3 text-ink">{name}</span>
      <span className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("type-stat tabular", bandPctClass(band))}>
            {accuracyPct == null ? "—" : `%${accuracyPct}`}
          </span>
          <span className="truncate text-[12px] leading-4 text-ink-soft tabular">
            {note}
          </span>
        </span>
        <ProgressBar
          value={(accuracyPct ?? 0) / 100}
          tone={bandBarTone(band)}
          height={4}
        />
      </span>
    </Link>
  );
}
