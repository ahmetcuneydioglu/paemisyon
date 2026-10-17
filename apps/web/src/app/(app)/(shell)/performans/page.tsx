import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MyAttempt } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Card, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTile } from "@/components/ui/stat-tile";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = {
  title: "Performans",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

interface Summary {
  totalSolved: number;
  totalCorrect: number;
  totalSessions: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
}
interface TopicProgressRow {
  topicId: string;
  topicName: string;
  courseName: string;
  solvedCount: number;
  correctCount: number;
  mastery: number;
}

/**
 * Performans — genel bakış (Doc 27 §3.9): metrik kartları (StatTile), 12 hafta
 * çalışma ısısı, deneme net trendi, en zayıf 3 konu → konu haritasına derinleşme.
 */
export default async function PerformansPage() {
  const [summary, topics, attempts, activity] = await Promise.all([
    api<Summary>("/progress/summary"),
    api<TopicProgressRow[]>("/progress/topics").catch(
      () => [] as TopicProgressRow[],
    ),
    api<MyAttempt[]>("/exams/attempts/mine").catch(() => [] as MyAttempt[]),
    api<{ date: string; questionsAnswered: number }[]>(
      "/progress/activity?days=84",
    ).catch(() => [] as { date: string; questionsAnswered: number }[]),
  ]);
  const maxDay = activity.reduce((m, d) => Math.max(m, d.questionsAnswered), 0);
  const weeks: { date: string; questionsAnswered: number }[][] = [];
  for (let i = 0; i < activity.length; i += 7)
    weeks.push(activity.slice(i, i + 7));

  const completed = attempts
    .filter((a) => a.status === "completed" && a.score != null)
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
  const maxScore = completed.reduce((m, a) => Math.max(m, Number(a.score)), 0);
  const weakest = topics.filter((t) => t.solvedCount >= 5).slice(0, 3);
  const activeDays = activity.filter((d) => d.questionsAnswered > 0).length;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <SectionHeader
          title="Performans"
          action={{ label: "Konu haritası", href: "/performans/konu-haritasi" }}
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Toplam soru" value={summary.totalSolved} />
          <StatTile
            label="Doğruluk"
            value={`%${summary.accuracy}`}
            tone={
              summary.accuracy < 40
                ? "danger"
                : summary.accuracy < 60
                  ? "warning"
                  : "success"
            }
          />
          <StatTile
            label="Seri"
            value={summary.currentStreak}
            unit="gün"
            hint={`En uzun ${summary.longestStreak} gün`}
            emphasis
          />
          <StatTile label="Tur" value={summary.totalSessions} />
        </div>

        {maxDay > 0 ? (
          <Card className="flex flex-col gap-3">
            <CardTitle>Son 12 hafta — çalışma ısısı</CardTitle>
            <div className="flex gap-1 overflow-x-auto pb-1" aria-hidden>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((d) => {
                    const ratio = d.questionsAnswered / maxDay;
                    const level =
                      d.questionsAnswered === 0
                        ? "bg-surface-alt"
                        : ratio < 0.34
                          ? "bg-success/35"
                          : ratio < 0.67
                            ? "bg-success/65"
                            : "bg-success";
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.questionsAnswered} soru`}
                        className={cn("size-3 rounded-[3px]", level)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="type-body-sm text-ink-subtle">
              her kutu bir gün · koyu = daha çok soru · {activeDays}/84 aktif
              gün
            </p>
          </Card>
        ) : null}

        {completed.length >= 2 ? (
          <Card className="flex flex-col gap-3">
            <CardTitle>Deneme net trendi</CardTitle>
            <div className="flex items-end gap-2" aria-hidden>
              {completed.slice(-12).map((a) => (
                <div
                  key={a.attemptId}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span className="type-body-sm tabular text-ink-soft">
                    {Number(a.score).toFixed(0)}
                  </span>
                  <div
                    className="w-full rounded-t-[4px] bg-accent/70"
                    style={{
                      height: `${Math.max(8, (Number(a.score) / Math.max(1, maxScore)) * 80)}px`,
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="type-body-sm text-ink-subtle">
              son {Math.min(12, completed.length)} deneme · NET = doğru −
              yanlış/4
            </p>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-2">
          <CardTitle>En zayıf konuların</CardTitle>
          {weakest.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {weakest.map((t) => (
                <li
                  key={t.topicId}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="type-subhead text-ink">{t.topicName}</span>
                    <span className="type-body-sm ml-2 text-ink-subtle">
                      {t.courseName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "type-subhead tabular shrink-0",
                      t.mastery < 40
                        ? "text-danger-ink"
                        : t.mastery < 60
                          ? "text-warning-ink"
                          : "text-success-ink",
                    )}
                  >
                    %{t.mastery}
                  </span>
                  <Link
                    href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                    className="tk-interactive inline-flex h-9 shrink-0 items-center rounded-control border border-line px-3 text-[13px] font-semibold text-ink-soft hover:border-ink-soft hover:text-ink"
                  >
                    Kapat
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-body-sm text-ink-soft">
              Zayıflık haritası için biraz daha veri gerekiyor — birkaç tur
              sonra burada konu konu güç/zaaf fotoğrafın oluşacak.
            </p>
          )}
        </Card>
      </div>

      <CoachRail />
    </div>
  );
}
