import type { LeaderboardRow } from "@/lib/public-api";
import { LeaderboardAvatar } from "./leaderboard-avatar";
import { RankTierBadge } from "./rank-tier-badge";
import { Crown } from "lucide-react";
import { rankTier } from "./rank-tier";

function PodiumSlot({ row, place }: { row: LeaderboardRow; place: 0 | 1 | 2 }) {
  const first = place === 0;
  const tier = rankTier(row.level);
  return (
    <div
      className={[
        "tk-interactive flex min-w-0 flex-col items-center rounded-card border bg-surface px-3 pb-4 text-center",
        first ? "pt-8" : "pt-5",
        row.isMe ? "border-accent" : "border-line",
      ].join(" ")}
      style={{
        // Kürsü yüksekliği: 1. daha yüksek oturur (kürsü hissi).
        marginTop: first ? 0 : 28,
        boxShadow: first ? `0 0 0 1px rgba(${tier.glow},0.35)` : undefined,
      }}
    >
      <div className="relative">
        {first && (
          <span
            className="lb-crown absolute -top-7 left-1/2 -translate-x-1/2 text-accent"
            aria-hidden
          >
            <Crown size={24} strokeWidth={2} />
          </span>
        )}
        <span
          className={
            first
              ? "lb-halo relative inline-block rounded-full"
              : "inline-block"
          }
        >
          <LeaderboardAvatar
            name={row.displayName}
            avatarUrl={row.avatarUrl}
            level={row.level}
            size={first ? "xl" : "lg"}
          />
        </span>
        <span
          className="type-label absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink"
          aria-hidden
        >
          {place + 1}
        </span>
      </div>

      <p
        className={[
          "mt-3 max-w-full truncate text-ink",
          first ? "type-heading" : "type-subhead",
        ].join(" ")}
        title={row.displayName}
      >
        {row.displayName}
      </p>
      <div className="mt-1.5">
        <RankTierBadge
          level={row.level}
          rankName={row.rankName}
          size="sm"
          showLeague={false}
        />
      </div>
      <p className="type-stat mt-2 text-ink">
        {row.points.toLocaleString("tr-TR")}
        <span className="type-body-sm ml-1 text-ink-soft">puan</span>
      </p>
    </div>
  );
}

/** İlk 3 — kürsü düzeni (2 · 1 · 3), 1. büyük + taç + halo. */
export function LeaderboardPodium({ rows }: { rows: LeaderboardRow[] }) {
  const [first, second, third] = rows;
  if (!first) return null;

  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      <div>{second && <PodiumSlot row={second} place={1} />}</div>
      <div>
        <PodiumSlot row={first} place={0} />
      </div>
      <div>{third && <PodiumSlot row={third} place={2} />}</div>
    </div>
  );
}
