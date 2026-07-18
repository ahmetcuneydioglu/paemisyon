import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { GlobalRankRow } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { GlobalRankTable, Podium } from "@/components/rank-table";

export const metadata: Metadata = {
  title: "Genel Lider Tablosu",
  description: "Tüm denemelerin ortalama net puanına göre genel sıralama.",
  alternates: { canonical: "/lider-tablosu" },
};
export const dynamic = "force-dynamic";

interface GlobalBoard {
  top: GlobalRankRow[];
  me: GlobalRankRow | null;
  participantCount: number;
}

/** Genel liderlik — eski lider-tablosu.php (Doc 18 §2.6). Tüm denemelerin ortalaması. */
export default async function LiderTablosuPage() {
  const board = await api<GlobalBoard>("/exams/leaderboard/global").catch(() => null);

  return (
    <div>
      <h2 className="head2">Genel Lider Tablosu</h2>
      {!board || board.top.length === 0 ? (
        <EmptyState
          icon="icon-user"
          title="Henüz sıralama yok"
          message="Denemeler tamamlandıkça genel sıralama burada oluşacak."
        />
      ) : (
        <div className="pb-10">
          <Podium rows={board.top} />
          {board.me && !board.top.slice(0, 3).some((r) => r.isMe) && (
            <p className="mb-2 text-center text-sm font-semibold text-(--color-navy)">
              🎯 Senin sıran: #{board.me.rank} · {board.me.avgScore.toFixed(2)} ortalama net
            </p>
          )}
          <GlobalRankTable rows={board.top} />
        </div>
      )}
    </div>
  );
}
