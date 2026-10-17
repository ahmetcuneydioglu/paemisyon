import type { Metadata } from "next";
import { Timer, Trophy, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Leaderboard } from "@/lib/types";
import { ExamRankTable, Podium } from "@/components/rank-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sınav Sıralaması" };
export const dynamic = "force-dynamic";

/** Deneme sıralaması (Doc 18 §2.5). Public; pencere kapanınca. */
export default async function SiralamaPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const lb = await api<Leaderboard>(`/exams/${examId}/leaderboard`).catch(
    () => null,
  );

  const intro = (
    <PageIntro
      breadcrumb={[
        { label: "Denemeler", href: "/denemeler" },
        { label: "Sıralama" },
      ]}
      eyebrow="Deneme"
      title="Sınav sıralaması"
    />
  );

  if (!lb) {
    return (
      <PageFrame className="flex flex-col gap-6">
        {intro}
        <EmptyState
          icon={Trophy}
          title="Sıralama bulunamadı"
          body="Bu denemeye ait sıralama görüntülenemiyor."
        />
      </PageFrame>
    );
  }

  if (!lb.available) {
    return (
      <PageFrame className="flex flex-col gap-6">
        {intro}
        <EmptyState
          icon={Timer}
          title="Sıralama henüz açık değil"
          body={`Sıralama, sınav süresi bitince (${formatDate(lb.endAt)} ${formatTime(lb.endAt)}) açılacak.`}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame className="flex flex-col gap-6">
      {intro}
      {lb.top.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Katılım yok"
          body="Bu denemeyi henüz tamamlayan olmadı."
        />
      ) : (
        <>
          <Podium rows={lb.top} />
          {lb.me && !lb.top.slice(0, 3).some((r) => r.isMe) && (
            <Notice tone="info" className="mx-auto w-full max-w-3xl">
              Senin sıran: <b className="font-semibold">#{lb.me.rank}</b> ·{" "}
              {lb.me.score.toFixed(2)} net
            </Notice>
          )}
          <ExamRankTable rows={lb.top} />
        </>
      )}
    </PageFrame>
  );
}
