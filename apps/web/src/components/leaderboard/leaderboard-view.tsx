"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { LeaderboardBoard, LeaderboardPeriod } from "@/lib/public-api";
import { Flag, Search } from "lucide-react";
import { Notice } from "@/components/ui/notice";
import { EmptyState } from "@/components/ui/empty-state";
import { LeaderboardPeriodTabs } from "./leaderboard-period-tabs";
import { LeaderboardStatCards } from "./leaderboard-stat-cards";
import { LeaderboardPodium } from "./leaderboard-podium";
import { LeaderboardTable } from "./leaderboard-table";
import { LeaderboardMyRank } from "./leaderboard-my-rank";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";

const PERIOD_LABEL: Record<LeaderboardPeriod, string> = {
  today: "bugün",
  week: "bu hafta",
  month: "bu ay",
  all: "tüm zamanlar",
};

/**
 * Liderlik tablosu — istemci orkestratörü. Sunucudan gelen ilk veriyle anında çizilir;
 * dönem sekmesi değişince `apiClient` ile tazelenir (skeleton + hata durumları yönetilir).
 * `key` remount'u animasyonları (satır girişi, XP dolumu) yeniden oynatır.
 */
export function LeaderboardView({
  initial,
  initialPeriod,
}: {
  initial: LeaderboardBoard;
  initialPeriod: LeaderboardPeriod;
}) {
  const [board, setBoard] = useState<LeaderboardBoard>(initial);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  async function switchPeriod(next: LeaderboardPeriod) {
    if (next === period || loading) return;
    setPeriod(next);
    setLoading(true);
    setError(false);
    try {
      const data = await apiClient<LeaderboardBoard>(
        `/progress/leaderboard?period=${next}`,
      );
      setBoard(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = q
    ? board.top.filter((r) =>
        r.displayName.toLocaleLowerCase("tr-TR").includes(q),
      )
    : null;

  const podium = board.top.slice(0, 3);
  const rest = board.top.slice(3);

  return (
    <div className="flex flex-col gap-6">
      <LeaderboardStatCards stats={board.stats} />

      {/* Kontroller: dönem sekmeleri + arama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LeaderboardPeriodTabs
          value={period}
          onChange={switchPeriod}
          disabled={loading}
        />
        <div className="relative sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yarışmacı ara…"
            aria-label="Yarışmacı ara"
            className="type-body-sm h-11 w-full rounded-control border border-line bg-surface pr-3 pl-9 text-ink outline-none placeholder:text-ink-subtle focus:border-ink-soft"
          />
        </div>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Notice tone="error">Sıralama yüklenemedi. Lütfen tekrar dene.</Notice>
      ) : (
        <div key={period} className="flex flex-col gap-6">
          {filtered ? (
            <div>
              <p className="type-body-sm mb-3 text-ink-soft">
                “{query}” için {filtered.length} sonuç
              </p>
              <LeaderboardTable rows={filtered} />
            </div>
          ) : board.top.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface">
              <EmptyState
                icon={Flag}
                title={`${PERIOD_LABEL[period]} için henüz sıralama yok`}
                body="İlk quizi çöz, tabloyu sen başlat."
              />
            </div>
          ) : (
            <>
              <LeaderboardPodium rows={podium} />
              <LeaderboardTable rows={rest} />
            </>
          )}
        </div>
      )}

      {board.me && <LeaderboardMyRank me={board.me} />}
    </div>
  );
}
