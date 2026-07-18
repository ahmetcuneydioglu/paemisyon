import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MyAttempt } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Performans", robots: { index: false } };
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
 * Performans — genel bakış (Doc 27 §3.9, wireframe 12 üst şeridi):
 * tek bakışta durum + net trendi + en zayıf 3 konu → konu haritasına derinleşme.
 */
export default async function PerformansPage() {
  const [summary, topics, attempts, activity] = await Promise.all([
    api<Summary>("/progress/summary"),
    api<TopicProgressRow[]>("/progress/topics").catch(() => [] as TopicProgressRow[]),
    api<MyAttempt[]>("/exams/attempts/mine").catch(() => [] as MyAttempt[]),
    api<{ date: string; questionsAnswered: number }[]>("/progress/activity?days=84").catch(
      () => [] as { date: string; questionsAnswered: number }[],
    ),
  ]);
  const maxDay = activity.reduce((m, d) => Math.max(m, d.questionsAnswered), 0);
  // 84 günü haftalara böl (7'lik sütunlar) — GitHub katkı ısı takvimi hissi.
  const weeks: { date: string; questionsAnswered: number }[][] = [];
  for (let i = 0; i < activity.length; i += 7) weeks.push(activity.slice(i, i + 7));

  const completed = attempts
    .filter((a) => a.status === "completed" && a.score != null)
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
  const maxScore = completed.reduce((m, a) => Math.max(m, Number(a.score)), 0);
  const weakest = topics.filter((t) => t.solvedCount >= 5).slice(0, 3); // zaten mastery ASC

  const metrics = [
    { label: "Toplam soru", value: summary.totalSolved },
    { label: "Doğruluk", value: `%${summary.accuracy}` },
    { label: "Seri", value: `🔥 ${summary.currentStreak}` },
    { label: "Seans", value: summary.totalSessions },
  ];

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-bold text-ink">Performans</h1>
          <Link
            href="/performans/konu-haritasi"
            className="text-[13px] font-bold text-brand hover:underline"
          >
            Konu haritası →
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="text-center">
              <span className="tk-caption">{m.label}</span>
              <p className="tabular mt-1 font-heading text-xl font-bold text-ink">{m.value}</p>
            </Card>
          ))}
        </div>

        {/* Son 12 hafta aktivite ısısı (wireframe 12) — GitHub katkı hissi */}
        {maxDay > 0 && (
          <Card className="mb-5">
            <CardTitle>Son 12 hafta — çalışma ısısı</CardTitle>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1" aria-hidden>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((d) => {
                    const ratio = d.questionsAnswered / maxDay;
                    const level =
                      d.questionsAnswered === 0
                        ? "bg-line"
                        : ratio < 0.34
                          ? "bg-success/30"
                          : ratio < 0.67
                            ? "bg-success/60"
                            : "bg-success";
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.questionsAnswered} soru`}
                        className={["size-3 rounded-[3px]", level].join(" ")}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="tk-caption mt-2">
              her kutu bir gün · koyu = daha çok soru · {activity.filter((d) => d.questionsAnswered > 0).length}/84 aktif gün
            </p>
          </Card>
        )}

        {completed.length >= 2 && (
          <Card className="mb-5">
            <CardTitle>Deneme net trendi</CardTitle>
            <div className="mt-3 flex items-end gap-2" aria-hidden>
              {completed.slice(-12).map((a) => (
                <div key={a.attemptId} className="flex flex-1 flex-col items-center gap-1">
                  <span className="tabular text-[11px] text-ink-soft">
                    {Number(a.score).toFixed(0)}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-live/70"
                    style={{
                      height: `${Math.max(8, (Number(a.score) / Math.max(1, maxScore)) * 80)}px`,
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="tk-caption mt-2">
              son {Math.min(12, completed.length)} deneme · NET = doğru − yanlış/4
            </p>
          </Card>
        )}

        <Card>
          <CardTitle>En zayıf konuların</CardTitle>
          {weakest.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {weakest.map((t) => (
                <li key={t.topicId} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {t.topicName}
                    <span className="tk-caption ml-2">{t.courseName}</span>
                  </span>
                  <span
                    className={[
                      "tabular shrink-0 font-bold",
                      t.mastery < 40 ? "text-danger" : t.mastery < 60 ? "text-warning" : "text-success",
                    ].join(" ")}
                  >
                    %{t.mastery}
                  </span>
                  <Link
                    href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                    className="tk-interactive shrink-0 rounded-full border border-line px-3 py-1 text-[12px] font-bold text-ink-soft hover:border-brand hover:text-brand"
                  >
                    kapat
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">
              Zayıflık haritası için biraz daha veri gerekiyor — birkaç seans sonra burada
              konu konu güç/zaaf fotoğrafın oluşacak.
            </p>
          )}
        </Card>
      </div>

      <CoachRail />
    </div>
  );
}
