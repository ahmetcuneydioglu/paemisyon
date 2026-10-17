import { Medal } from "lucide-react";
import type { ReactNode } from "react";
import type { LeaderboardRow } from "@/lib/public-api";
import { LeaderboardAvatar } from "./leaderboard-avatar";
import { RankTierBadge } from "./rank-tier-badge";
import { formatLastActive } from "./leaderboard-util";

function Cell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-3 py-3 align-middle", className].join(" ")}>
      {children}
    </td>
  );
}

function Row({
  row,
  animateIndex,
}: {
  row: LeaderboardRow;
  animateIndex: number;
}) {
  return (
    <tr
      className={[
        "lb-row tk-interactive border-t border-line hover:bg-surface-alt/60",
        row.isMe ? "bg-accent-soft/60" : "",
      ].join(" ")}
      style={{ animationDelay: `${Math.min(animateIndex, 12) * 35}ms` }}
    >
      <Cell className="w-12 text-center">
        <span className="type-subhead tabular text-ink-soft">{row.rank}</span>
      </Cell>
      <Cell>
        <div className="flex items-center gap-3">
          <LeaderboardAvatar
            name={row.displayName}
            avatarUrl={row.avatarUrl}
            level={row.level}
            size="sm"
          />
          <div className="min-w-0">
            <p
              className="type-subhead truncate text-ink"
              title={row.displayName}
            >
              {row.displayName}
              {row.isMe && (
                <span className="type-label ml-2 text-accent-ink">sen</span>
              )}
            </p>
            <div className="mt-0.5">
              <RankTierBadge
                level={row.level}
                rankName={row.rankName}
                size="sm"
              />
            </div>
          </div>
        </div>
      </Cell>
      <Cell className="hidden text-right tabular text-ink-soft lg:table-cell">
        {row.xp.toLocaleString("tr-TR")}
      </Cell>
      <Cell className="hidden text-right tabular text-ink-soft md:table-cell">
        {row.correct.toLocaleString("tr-TR")}
      </Cell>
      <Cell className="hidden text-right tabular text-ink-soft sm:table-cell">
        %{row.accuracy}
      </Cell>
      <Cell className="hidden text-right tabular text-ink-soft lg:table-cell">
        {row.sessions}
      </Cell>
      <Cell className="hidden text-right text-ink-soft xl:table-cell">
        {formatLastActive(row.lastActive)}
      </Cell>
      <Cell className="hidden text-center xl:table-cell">
        {row.badges > 0 ? (
          <span className="inline-flex items-center gap-1 text-ink-soft">
            <Medal size={14} aria-hidden />
            <span className="type-body-sm tabular">{row.badges}</span>
          </span>
        ) : (
          <span className="text-ink-soft/50">—</span>
        )}
      </Cell>
      <Cell className="text-right">
        <span className="type-subhead tabular text-ink">
          {row.points.toLocaleString("tr-TR")}
        </span>
      </Cell>
    </tr>
  );
}

/** Modern liderlik tablosu — kürsü sonrası kalan sıralar. Sütunlar ekran genişledikçe açılır. */
export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="type-body-sm rounded-card border border-dashed border-line bg-surface p-6 text-center text-ink-soft">
        Bu dönemde başka katılımcı yok. İlk sıralar seni bekliyor.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="type-label text-ink-subtle">
            <th className="px-3 py-2.5 text-center font-semibold">#</th>
            <th className="px-3 py-2.5 font-semibold">Kullanıcı</th>
            <th className="hidden px-3 py-2.5 text-right font-semibold lg:table-cell">
              XP
            </th>
            <th className="hidden px-3 py-2.5 text-right font-semibold md:table-cell">
              Doğru
            </th>
            <th className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">
              Başarı
            </th>
            <th className="hidden px-3 py-2.5 text-right font-semibold lg:table-cell">
              Quiz
            </th>
            <th className="hidden px-3 py-2.5 text-right font-semibold xl:table-cell">
              Son aktif
            </th>
            <th className="hidden px-3 py-2.5 text-center font-semibold xl:table-cell">
              Rozet
            </th>
            <th className="px-3 py-2.5 text-right font-semibold">Puan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Row
              key={`${row.rank}-${row.displayName}`}
              row={row}
              animateIndex={i}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
