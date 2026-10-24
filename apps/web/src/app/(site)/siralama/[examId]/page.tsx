import type { Metadata } from "next";
import { Timer, Trophy, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { ExamListItem, Leaderboard } from "@/lib/types";
import { fmtDuration, fmtNet } from "@/lib/exam-ui";
import { ExamRankTable } from "@/components/rank-table";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sınav Sıralaması" };
export const dynamic = "force-dynamic";

/**
 * Deneme sıralaması (Doc 50 M6). İsimli; "senin sıran" sabit kart; eşitlikte ortak sıra.
 * Serbest: katılımla güncellenir. Takvimli: pencere kapanınca donar.
 */
export default async function SiralamaPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const [lb, exam] = await Promise.all([
    api<Leaderboard>(`/exams/${examId}/leaderboard`).catch(() => null),
    api<ExamListItem>(`/exams/${examId}`).catch(() => null),
  ]);

  const subtitle =
    lb?.frozenAt
      ? `Sıralama ${formatDate(lb.frozenAt)} ${formatTime(lb.frozenAt)}'de kapandı`
      : exam?.publishMode === "serbest"
        ? "Serbest deneme · sıralama katılımla güncellenir"
        : undefined;

  const intro = (
    <PageIntro
      breadcrumb={[{ label: "Denemeler", href: "/denemeler" }, { label: exam?.title ?? "Deneme" }, { label: "Sıralama" }]}
      eyebrow={exam?.title ?? "Deneme"}
      title="Sıralama"
      lead={subtitle}
    />
  );

  if (!lb) {
    return (
      <PageFrame className="flex flex-col gap-6">
        {intro}
        <EmptyState icon={Trophy} title="Sıralama bulunamadı" body="Bu denemeye ait sıralama görüntülenemiyor." />
      </PageFrame>
    );
  }

  if (!lb.available) {
    return (
      <PageFrame className="flex flex-col gap-6">
        {intro}
        {lb.reason === "min_sample" ? (
          <EmptyState
            icon={Users}
            title="Sıralama henüz açılmadı"
            body={`En az ${lb.minSample ?? 10} resmî çözümle açılır; şu an ${lb.participantCount ?? 0} çözüm var. Sonucun ve netin sende duruyor.`}
          />
        ) : (
          <EmptyState
            icon={Timer}
            title="Sonuçlar pencere kapanınca açıklanır"
            body={`Sıralama ${formatDate(lb.endAt)} ${formatTime(lb.endAt)}'de herkese aynı anda açılır.`}
          />
        )}
      </PageFrame>
    );
  }

  return (
    <PageFrame className="flex flex-col gap-6">
      {intro}
      {lb.me ? (
        <Card className="mx-auto flex w-full max-w-3xl items-center gap-4 border-panel bg-panel">
          <span className="type-stat tabular text-accent">{lb.me.rank}.</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="type-subhead text-panel-ink">{lb.me.name ?? lb.me.displayName} · sen</span>
            <span className="type-body-sm tabular text-panel-soft">
              {fmtNet(lb.me.score)} net · {lb.me.wrongCount} yanlış · {fmtDuration(lb.me.durationSeconds)}
            </span>
          </span>
          {lb.me.percentile ? <span className="type-subhead text-accent">ilk %{lb.me.percentile}</span> : null}
        </Card>
      ) : null}
      <p className="type-body-sm mx-auto w-full max-w-3xl text-ink-subtle">
        {lb.participantCount?.toLocaleString("tr-TR")} resmî çözüm. Eşitlikte sıra: net, az yanlış, kısa süre, erken teslim; dördü de eşitse sıra ortaktır (2, 2, 4).
      </p>
      <ExamRankTable rows={lb.top} />
    </PageFrame>
  );
}
