"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { LeaderboardBoard, LeaderboardPeriod } from "@/lib/public-api";
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
      const data = await apiClient<LeaderboardBoard>(`/progress/leaderboard?period=${next}`);
      setBoard(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = q
    ? board.top.filter((r) => r.displayName.toLocaleLowerCase("tr-TR").includes(q))
    : null;

  const podium = board.top.slice(0, 3);
  const rest = board.top.slice(3);

  return (
    <div className="space-y-6">
      <LeaderboardStatCards stats={board.stats} />

      {/* Kontroller: dönem sekmeleri + arama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LeaderboardPeriodTabs value={period} onChange={switchPeriod} disabled={loading} />
        <div className="relative sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yarışmacı ara…"
            aria-label="Yarışmacı ara"
            className="tk-interactive w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand"
          />
        </div>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-danger/40 bg-surface p-6 text-center text-sm text-danger">
          Sıralama yüklenemedi. Lütfen tekrar dene.
        </div>
      ) : (
        <div key={period} className="space-y-6">
          {filtered ? (
            <div>
              <p className="mb-3 text-sm text-ink-soft">
                “{query}” için {filtered.length} sonuç
              </p>
              <LeaderboardTable rows={filtered} />
            </div>
          ) : board.top.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
              <p className="text-2xl" aria-hidden>
                🏁
              </p>
              <p className="mt-2 font-heading font-bold text-ink">
                {PERIOD_LABEL[period]} için henüz sıralama yok
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                İlk quizi çöz, tabloyu sen başlat.
              </p>
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
