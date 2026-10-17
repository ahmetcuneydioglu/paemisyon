import type { Metadata } from "next";
import { Users } from "lucide-react";
import { api } from "@/lib/api";
import type { GlobalRankRow } from "@/lib/types";
import { GlobalRankTable, Podium } from "@/components/rank-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageFrame, PageIntro } from "@/components/public/page-frame";

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

/** Genel liderlik (Doc 18 §2.6). Tüm denemelerin ortalaması. */
export default async function LiderTablosuPage() {
  const board = await api<GlobalBoard>("/exams/leaderboard/global").catch(
    () => null,
  );

  return (
    <PageFrame className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Tüm denemeler"
        title="Genel lider tablosu"
        lead="Tamamlanan denemelerin ortalama netine göre sıralama."
        meta={
          board ? <span>{board.participantCount} katılımcı</span> : undefined
        }
      />
      {!board || board.top.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz sıralama yok"
          body="Denemeler tamamlandıkça genel sıralama burada oluşacak."
        />
      ) : (
        <>
          <Podium rows={board.top} />
          {board.me && !board.top.slice(0, 3).some((r) => r.isMe) && (
            <Notice tone="info" className="mx-auto w-full max-w-3xl">
              Senin sıran: <b className="font-semibold">#{board.me.rank}</b> ·{" "}
              {board.me.avgScore.toFixed(2)} ortalama net
            </Notice>
          )}
          <GlobalRankTable rows={board.top} />
        </>
      )}
    </PageFrame>
  );
}
