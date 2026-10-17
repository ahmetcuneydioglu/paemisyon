import type { LeaderboardMe } from "@/lib/public-api";
import { LeaderboardAvatar } from "./leaderboard-avatar";
import { XpProgress } from "./rank-tier-badge";
import { motivationLine } from "./leaderboard-util";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="type-stat text-ink">{value}</p>
      <p className="type-label text-ink-subtle">{label}</p>
    </div>
  );
}

/**
 * "Senin Sıralaman" — sayfada sabit (sticky) duran kişisel kart. Kullanıcı listede
 * görünmese bile kendi durumunu ve bir üst sıraya kalan mesafeyi hep görür.
 */
export function LeaderboardMyRank({ me }: { me: LeaderboardMe }) {
  const nf = (n: number) => n.toLocaleString("tr-TR");
  const hasRank = me.rank > 0;
  return (
    <div className="sticky bottom-3 z-20 mt-4">
      <div className="rounded-card border border-accent/40 bg-surface/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Sıra + kimlik */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="type-label text-ink-subtle">Sıran</p>
              <p className="type-stat text-accent-ink">
                {hasRank ? `#${nf(me.rank)}` : "—"}
              </p>
            </div>
            <LeaderboardAvatar
              name={me.displayName}
              avatarUrl={me.avatarUrl}
              level={me.level}
              size="md"
            />
            <div className="min-w-0">
              <p className="type-subhead truncate text-ink">{me.displayName}</p>
              <p className="type-body-sm text-ink-soft">{me.rankName}</p>
            </div>
          </div>

          {/* Metrikler */}
          <div className="flex items-center gap-5">
            <Stat label="Toplam XP" value={nf(me.xp)} />
            <Stat label="Doğru" value={nf(me.correct)} />
            <Stat label="Başarı" value={`%${me.accuracy}`} />
          </div>

          {/* Motivasyon + seviye ilerlemesi */}
          <div className="min-w-[180px] flex-1">
            <p className="type-body-sm mb-1.5 text-ink">
              {motivationLine(me.rank, me.pointsToNext, me.nextName)}
            </p>
            <XpProgress xp={me.xp} level={me.level} />
          </div>
        </div>
      </div>
    </div>
  );
}
