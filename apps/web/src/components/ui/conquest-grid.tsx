import Link from "next/link";

export interface ConquestCell {
  no: string;
  href: string;
  questionCount: number;
  clearedCount: number;
  conquered: boolean;
  /** Ağaçta vurgulanan aktif madde. */
  current?: boolean;
}

/**
 * Fetih Haritası ızgarası (Doc 26 #13, Doc 25 §4 fikir 2): kanunu madde madde
 * "temizleme" ilerlemesi. Hücre = madde; tıklanınca madde sayfası açılır.
 * Durum renk + doku + tooltip metniyle birlikte verilir (a11y).
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
            title={`m.${c.no} — ${c.clearedCount}/${c.questionCount} soru temizlendi${c.conquered ? " ✓ fethedildi" : ""}`}
            aria-label={`Madde ${c.no}: ${c.clearedCount} bölü ${c.questionCount} temizlendi`}
            className={[
              "tk-interactive grid size-9 place-items-center rounded-sm border font-mono text-[11px] font-bold",
              c.current ? "ring-2 ring-brand" : "",
              c.conquered
                ? "border-success/50 bg-success/15 text-success"
                : partial
                  ? "border-warning/50 bg-warning/10 text-warning"
                  : "border-line bg-surface text-ink-soft hover:border-ink-soft",
            ].join(" ")}
          >
            {c.no.length > 4 ? c.no.slice(0, 3) + "…" : c.no}
          </Link>
        );
      })}
    </div>
  );
}
