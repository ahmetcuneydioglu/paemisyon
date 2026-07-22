import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { LeaderboardBoard } from "@/lib/public-api";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export const metadata: Metadata = { title: "Liderlik Tablosu", robots: { index: false } };
export const dynamic = "force-dynamic";

const EMPTY: LeaderboardBoard = {
  period: "today",
  stats: { totalUsers: 0, todayQuizCount: 0, totalXp: 0, todaysLeader: null },
  top: [],
  me: null,
};

/**
 * Quiz Liderlik Tablosu (Doc 24 §5 gamification) — girişli app kabuğu, tam genişlik.
 * İlk veri sunucuda çekilir (hızlı ilk boya); dönem sekmeleri istemcide tazeler.
 */
export default async function LiderlikPage() {
  const board = await api<LeaderboardBoard>("/progress/leaderboard?period=today").catch(
    () => EMPTY,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          🏆 Quiz Liderlik Tablosu
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft sm:text-base">
          Quiz çözdükçe puan kazan, seviyeni yükselt ve Türkiye genelindeki diğer adaylarla yarış.
        </p>
      </header>

      <LeaderboardView initial={board} initialPeriod="today" />
    </div>
  );
}
