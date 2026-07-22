import type { LeaderboardBoard } from "@/lib/public-api";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="tk-interactive relative overflow-hidden rounded-lg border border-line bg-surface p-4 hover:-translate-y-0.5 hover:shadow-card">
      {/* Yumuşak renk vurgusu — glass hissi */}
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <p className="tk-caption">{label}</p>
      </div>
      <p className="mt-2 truncate font-heading text-2xl font-bold tabular text-ink" title={value}>
        {value}
      </p>
    </div>
  );
}

/** Sayfa özeti — dört canlı istatistik kartı (gerçek veri). */
export function LeaderboardStatCards({ stats }: { stats: LeaderboardBoard["stats"] }) {
  const nf = (n: number) => n.toLocaleString("tr-TR");
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon="👥"
        label="Toplam Yarışmacı"
        value={nf(stats.totalUsers)}
        accent="var(--tk-accent-session)"
      />
      <StatCard
        icon="⚡"
        label="Bugünkü Quiz"
        value={nf(stats.todayQuizCount)}
        accent="var(--tk-accent-live)"
      />
      <StatCard
        icon="✨"
        label="Dağıtılan XP"
        value={nf(stats.totalXp)}
        accent="var(--tk-accent-atlas)"
      />
      <StatCard
        icon="👑"
        label="Günün Lideri"
        value={stats.todaysLeader ?? "—"}
        accent="var(--tk-accent-streak)"
      />
    </div>
  );
}
