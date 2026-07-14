import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { Leaderboard } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { ExamRankTable, Podium } from "@/components/rank-table";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sınav Sıralaması" };
export const dynamic = "force-dynamic";

/** Deneme sıralaması — eski siralama.php (Doc 18 §2.5). Public; pencere kapanınca. */
export default async function SiralamaPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const lb = await api<Leaderboard>(`/exams/${examId}/leaderboard`).catch(() => null);

  if (!lb) {
    return (
      <div>
        <h2 className="head2">Sınav Sıralaması</h2>
        <EmptyState title="Sıralama bulunamadı" message="Bu denemeye ait sıralama görüntülenemiyor." />
      </div>
    );
  }

  if (!lb.available) {
    return (
      <div>
        <h2 className="head2">Sınav Sıralaması</h2>
        <EmptyState
          icon="icon-timer"
          title="Sıralama henüz açık değil"
          message={`Sıralama, sınav süresi bitince (${formatDate(lb.endAt)} ${formatTime(lb.endAt)}) açılacak.`}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="head2">Sınav Sıralaması</h2>
      {lb.top.length === 0 ? (
        <EmptyState
          icon="icon-user"
          title="Katılım yok"
          message="Bu denemeyi henüz tamamlayan olmadı."
        />
      ) : (
        <div className="pb-10">
          <Podium rows={lb.top} />
          {lb.me && !lb.top.slice(0, 3).some((r) => r.isMe) && (
            <p className="mb-2 text-center text-sm font-semibold text-(--color-navy)">
              🎯 Senin sıran: #{lb.me.rank} · {lb.me.score.toFixed(2)} net
            </p>
          )}
          <ExamRankTable rows={lb.top} />
        </div>
      )}
    </div>
  );
}
