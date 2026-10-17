import Link from "next/link";
import { cn } from "@/lib/cn";

export interface ConquestCell {
  no: string;
  href: string;
  questionCount: number;
  clearedCount: number;
  conquered: boolean;
  current?: boolean;
}

/**
 * Fetih Haritası ızgarası (Doc 25 §4): kanunu madde madde "temizleme" ilerlemesi.
 * Durum renk + metin (title/aria) ile birlikte verilir.
 */
export function ConquestGrid({ cells }: { cells: ConquestCell[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cells.map((c) => {
        const partial = !c.conquered && c.clearedCount > 0;
        return (
          <Link
            key={c.no}
            href={c.href}
            title={`m.${c.no} — ${c.clearedCount}/${c.questionCount} soru temizlendi${c.conquered ? " · fethedildi" : ""}`}
            aria-label={`Madde ${c.no}: ${c.clearedCount} bölü ${c.questionCount} temizlendi`}
            className={cn(
              "tk-interactive grid size-9 place-items-center rounded-control border font-mono text-[11px] font-semibold",
              c.current && "ring-2 ring-accent",
              c.conquered
                ? "border-success/40 bg-success-soft text-success-ink"
                : partial
                  ? "border-warning/40 bg-warning-soft text-warning-ink"
                  : "border-line bg-surface text-ink-soft hover:border-ink-soft",
            )}
          >
            {c.no.length > 4 ? c.no.slice(0, 3) + "…" : c.no}
          </Link>
        );
      })}
    </div>
  );
}
