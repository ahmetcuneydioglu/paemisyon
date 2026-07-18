import Link from "next/link";
import type { ExamListItem, MyAttempt } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CoachRail } from "@/components/shell/coach-rail";
import { Countdown } from "@/components/countdown";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Deneme merkezi — girişli derinlik (Doc 27 §3.8, wireframe eşleniği):
 * canlı/sıradaki deneme hero'su + takvim + gelişim çizgim. Koç rayı L2 gereği sağda.
 */
export function ExamCenter({
  exams,
  attempts,
}: {
  exams: ExamListItem[];
  attempts: MyAttempt[];
}) {
  const active = exams.find((e) => e.state === "active");
  const upcoming = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const next = upcoming[0];
  const past = [...exams]
    .filter((e) => e.state === "ended")
    .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
  const myCompleted = attempts
    .filter((a) => a.status === "completed" && a.score != null)
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
  const maxScore = myCompleted.reduce((m, a) => Math.max(m, Number(a.score)), 0);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <h1 className="mb-5 font-heading text-xl font-bold text-ink">Denemeler</h1>

        {/* Hero: canlı > sıradaki > sakin boşluk */}
        {active ? (
          <Card className="mb-5 border-live/50 p-6">
            <span className="tk-caption text-live">● Canlı — şu an devam ediyor</span>
            <p className="mt-1 font-heading text-lg font-bold text-ink">{active.title}</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {active.questionCount} soru · {active.durationMinutes} dk ·{" "}
              {active.participantCount} katılımcı
            </p>
            <div className="mt-4">
              {active.myAttempt?.status === "completed" ? (
                <ButtonLink href={`/sonuc/${active.myAttempt.id}`} variant="secondary">
                  Sonucumu gör
                </ButtonLink>
              ) : (
                <ButtonLink href={`/sinav/${active.id}`} size="lg">
                  {active.myAttempt ? "Sınava devam et" : "Sınava katıl"}
                </ButtonLink>
              )}
            </div>
          </Card>
        ) : next ? (
          <Card className="mb-5 border-brand/30 p-6">
            <span className="tk-caption text-brand">Sıradaki canlı deneme</span>
            <p className="mt-1 font-heading text-lg font-bold text-ink">{next.title}</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {formatDate(next.startAt)} · {formatTime(next.startAt)} · {next.questionCount} soru
              · {next.durationMinutes} dk
            </p>
            <div className="mt-3 text-[15px] font-bold text-ink">
              <Countdown target={next.startAt} />
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">
              Başladığında bu sayfadan tek tıkla girersin — Türkiye geneli eşzamanlı, sıralamalı.
            </p>
          </Card>
        ) : (
          <Card className="mb-5 border-dashed p-6 text-center">
            <p className="text-[14px] text-ink-soft">
              Şu an planlanmış canlı deneme yok. Yeni deneme açıldığında koçun Bugün&apos;de
              haber verir; sen de buradan takip edebilirsin.
            </p>
          </Card>
        )}

        {/* Yaklaşan takvim */}
        {upcoming.length > 1 && (
          <section className="mb-5">
            <h2 className="tk-caption mb-2">Takvim</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.slice(1).map((e) => (
                <Card key={e.id}>
                  <p className="font-heading text-[14px] font-bold text-ink">{e.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {formatDate(e.startAt)} · {formatTime(e.startAt)} · {e.questionCount} soru
                    {e.isPremium && " · 🔒 premium"}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Geçmiş denemeler */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="tk-caption">Geçmiş denemeler</h2>
            <Link href="/profil/denemelerim" className="text-[13px] font-bold text-brand hover:underline">
              Denemelerim →
            </Link>
          </div>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="tk-caption border-b border-line text-left">
                  <th className="px-4 py-2.5 font-semibold">Deneme</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Tarih</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Katılım</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Ortalama</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Benim</th>
                </tr>
              </thead>
              <tbody>
                {past.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 font-medium text-ink">{e.title}</td>
                    <td className="tabular px-3 py-2.5 text-right text-ink-soft">
                      {formatDate(e.startAt)}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right text-ink-soft">
                      {e.participantCount}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right text-ink-soft">
                      {e.avgScore != null ? Number(e.avgScore).toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {e.myAttempt?.status === "completed" ? (
                        <Link
                          href={`/sonuc/${e.myAttempt.id}`}
                          className="text-[13px] font-bold text-brand hover:underline"
                        >
                          sonucum →
                        </Link>
                      ) : (
                        <span className="tk-caption">katılmadım</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {past.length === 0 && (
              <p className="p-6 text-center text-[14px] text-ink-soft">Henüz geçmiş deneme yok.</p>
            )}
          </Card>
        </section>

        {/* Gelişim çizgim (net trendi) */}
        {myCompleted.length >= 2 && (
          <section className="mt-5">
            <h2 className="tk-caption mb-2">Gelişim çizgim — son {myCompleted.length} deneme</h2>
            <Card>
              <div className="flex items-end gap-2" aria-hidden>
                {myCompleted.slice(-12).map((a) => (
                  <div key={a.attemptId} className="flex flex-1 flex-col items-center gap-1">
                    <span className="tabular text-[11px] text-ink-soft">
                      {Number(a.score).toFixed(0)}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-live/70"
                      style={{
                        height: `${Math.max(8, (Number(a.score) / Math.max(1, maxScore)) * 72)}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="tk-caption mt-2">puanlar deneme NET&apos;i (doğru − yanlış/4)</p>
            </Card>
          </section>
        )}
      </div>

      <CoachRail />
    </div>
  );
}
