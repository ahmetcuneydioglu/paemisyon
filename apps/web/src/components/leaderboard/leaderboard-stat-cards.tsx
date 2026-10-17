import { Crown, Sparkles, Users, Zap, type LucideIcon } from "lucide-react";
import type { LeaderboardBoard } from "@/lib/public-api";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-control bg-accent-soft text-accent-ink">
          <Icon size={14} strokeWidth={2} aria-hidden />
        </span>
        <p className="type-label text-ink-subtle">{label}</p>
      </div>
      <p className="type-stat truncate text-ink" title={value}>
        {value}
      </p>
    </div>
  );
}

/** Sayfa özeti — dört canlı istatistik kartı (gerçek veri). */
export function LeaderboardStatCards({
  stats,
}: {
  stats: LeaderboardBoard["stats"];
}) {
  const nf = (n: number) => n.toLocaleString("tr-TR");
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label="Toplam Yarışmacı"
        value={nf(stats.totalUsers)}
      />
      <StatCard
        icon={Zap}
        label="Bugünkü Quiz"
        value={nf(stats.todayQuizCount)}
      />
      <StatCard
        icon={Sparkles}
        label="Dağıtılan XP"
        value={nf(stats.totalXp)}
      />
      <StatCard
        icon={Crown}
        label="Günün Lideri"
        value={stats.todaysLeader ?? "—"}
      />
    </div>
  );
}
