import type { GlobalRankRow, RankRow } from "@/lib/types";
import { cn } from "@/lib/cn";
import { DataTable, type Column } from "@/components/ui/data-table";
import { fmtNet } from "@/lib/exam-ui";

/**
 * İlk-3 podyum + tablo — deneme sıralaması ve genel lider tablosu ortak deseni.
 * Podyum 2-1-3 dizilir; birinci kart vurgu çizgisiyle öne çıkar. Sıra rakamı
 * rozet olarak basılır (madalya emojisi değil — koyu temada ve ekran okuyucuda
 * tutarlı).
 */
export function Podium({ rows }: { rows: (RankRow | GlobalRankRow)[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <ol
      className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-2 sm:gap-3"
      aria-label="İlk üç"
    >
      {order.map((r) => {
        const first = r.rank === 1;
        return (
          <li
            key={r.rank}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-card border bg-surface px-2 text-center",
              first ? "border-accent py-6" : "border-line py-4",
              r.isMe && "ring-2 ring-focus-ring",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full type-subhead",
                first
                  ? "bg-accent text-on-accent"
                  : "bg-surface-alt text-ink-soft",
              )}
              aria-label={`${r.rank}. sıra`}
            >
              {r.rank}
            </span>
            <span className="type-subhead mt-1 w-full truncate text-ink">
              {"name" in r && r.name ? r.name : r.displayName}
            </span>
            <span className="type-stat text-ink">
              {"score" in r ? fmtNet(r.score) : fmtNet(r.avgScore)}
            </span>
            <span className="type-body-sm text-ink-soft">
              {"wrongCount" in r
                ? `${r.wrongCount} yanlış`
                : `${r.attempts} deneme`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function nameCell(r: { displayName: string; name?: string; isMe: boolean }) {
  return (
    <span className="type-subhead text-ink">
      {r.name ?? r.displayName}
      {r.isMe ? (
        <span className="type-body-sm ml-1.5 text-accent-ink">(sen)</span>
      ) : null}
    </span>
  );
}
const meRow = (r: { isMe: boolean }) => (r.isMe ? "bg-accent-soft" : undefined);

/** Deneme sıralama tablosu (NET + D/Y/B + süre). */
export function ExamRankTable({ rows }: { rows: RankRow[] }) {
  const columns: Column<RankRow>[] = [
    {
      key: "rank",
      header: "#",
      width: "3rem",
      align: "center",
      cell: (r) => <span className="tabular">{r.rank}</span>,
    },
    { key: "name", header: "Kullanıcı", cell: nameCell },
    {
      key: "net",
      header: "Net",
      align: "right",
      cell: (r) => fmtNet(r.score),
    },
    {
      key: "y",
      header: "Yanlış",
      align: "right",
      hideBelowMd: true,
      cell: (r) => r.wrongCount,
    },
    {
      key: "dur",
      header: "Süre",
      align: "right",
      hideBelowMd: true,
      cell: (r) => formatDuration(r.durationSeconds),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => String(r.rank)}
      rowClassName={meRow}
      caption="Deneme sıralaması"
      className="mx-auto max-w-3xl"
    />
  );
}

/** Genel liderlik tablosu (ortalama NET + deneme sayısı). */
export function GlobalRankTable({ rows }: { rows: GlobalRankRow[] }) {
  const columns: Column<GlobalRankRow>[] = [
    {
      key: "rank",
      header: "#",
      width: "3rem",
      align: "center",
      cell: (r) => <span className="tabular">{r.rank}</span>,
    },
    { key: "name", header: "Kullanıcı", cell: nameCell },
    {
      key: "avg",
      header: "Ortalama net",
      align: "right",
      cell: (r) => r.avgScore.toFixed(2),
    },
    {
      key: "att",
      header: "Deneme",
      align: "right",
      hideBelowMd: true,
      cell: (r) => r.attempts,
    },
    {
      key: "cor",
      header: "Toplam doğru",
      align: "right",
      hideBelowMd: true,
      cell: (r) => r.totalCorrect,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => String(r.rank)}
      rowClassName={meRow}
      caption="Genel lider tablosu"
      className="mx-auto max-w-3xl"
    />
  );
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
