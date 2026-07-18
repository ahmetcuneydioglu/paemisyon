import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ActiveSession, ActivityDay, CoachBrief } from "@/lib/public-api";
import type { ExamListItem } from "@/lib/types";
import { Countdown } from "@/components/countdown";
import { formatDate, formatTime } from "@/lib/format";
import { webRoute } from "@/lib/routes";
import { Card, CardTitle } from "@/components/ui/card";
import { CoachCard } from "@/components/ui/coach-card";
import { GoalProgress } from "@/components/ui/goal-progress";
import { StreakBadge } from "@/components/ui/streak-badge";
import { ButtonLink } from "@/components/ui/button";
import { FocusPicker } from "@/components/bugun/focus-picker";

export const metadata: Metadata = { title: "Bugün", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Bugün — girişli ana sayfa (Doc 27 §3.2, wireframe 02).
 * Sahne koçundur: hero = durum makinesinin kartı (/me/coach), yanı günün özeti.
 */
export default async function BugunPage() {
  const [brief, exams, active, activity] = await Promise.all([
    api<CoachBrief>("/me/coach"),
    api<ExamListItem[]>("/exams").catch(() => [] as ExamListItem[]),
    api<ActiveSession | null>("/quiz/active-session").catch(() => null),
    api<ActivityDay[]>("/progress/activity").catch(() => [] as ActivityDay[]),
  ]);
  const { today, gamification, greeting } = brief;
  // Hero = durum makinesinin en öncelikli kartı (Doc 25 Karar 3); kalanlar destek.
  const [hero, ...cards] = brief.cards;
  const rank = gamification.rank;
  const rankPct =
    rank?.next != null
      ? Math.min(
          100,
          Math.round(
            ((rank.score - rank.minScore) / Math.max(1, rank.next.minScore - rank.minScore)) * 100,
          ),
        )
      : 100;
  const nextExam = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const liveExam = exams.find((e) => e.state === "active");
  const week = activity.slice(-7);
  const dayShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Üst şerit: selamlama + seri */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-ink">
          {greeting.displayName ? `Merhaba, ${greeting.displayName}` : "Merhaba"}
        </h1>
        <StreakBadge days={today.streak.current} atRisk={today.streak.atRisk} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sol sahne (8 kolon): hero + destek kartları */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-brand/30 p-6">
            <span className="tk-caption text-brand">Koç</span>
            <p className="mt-1.5 font-heading text-lg font-bold leading-snug text-ink">
              {hero?.title ?? "Bugün senin için bir seans hazır."}
            </p>
            {hero?.body && (
              <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{hero.body}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ButtonLink href={webRoute(brief.primaryAction.route)} size="lg">
                Bugün Çalış
              </ButtonLink>
              <FocusPicker />
            </div>
          </Card>

          {cards.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => (
                <CoachCard
                  key={c.type + c.title}
                  type={c.type}
                  title={c.title}
                  body={c.body}
                  cta={c.cta}
                  routeMapper={webRoute}
                />
              ))}
            </div>
          )}

          {/* Son 7 gün — nöbet çizelgesi (wireframe 02): boş gün suçlanmaz */}
          {week.length === 7 && (
            <Card>
              <CardTitle className="text-[13px]">Son 7 gün — nöbet çizelgesi</CardTitle>
              <div className="mt-3 flex gap-2">
                {week.map((d, i) => {
                  const isToday = i === week.length - 1;
                  const dow = dayShort[new Date(d.date + "T00:00:00Z").getUTCDay()];
                  return (
                    <div
                      key={d.date}
                      className={[
                        "flex-1 rounded-sm border py-2 text-center",
                        isToday
                          ? "border-brand"
                          : d.questionsAnswered > 0
                            ? "border-line bg-session/10"
                            : "border-dashed border-line",
                      ].join(" ")}
                    >
                      <p className="tk-caption">{isToday ? "Bugün" : dow}</p>
                      <p
                        className={[
                          "tabular mt-0.5 text-[14px] font-bold",
                          d.questionsAnswered > 0 ? "text-ink" : "text-ink-soft",
                        ].join(" ")}
                      >
                        {d.questionsAnswered > 0 ? d.questionsAnswered : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Sağ kolon (4 kolon): günün özeti — salt okunur, en fazla 4 kart */}
        <div className="space-y-3">
          <Card>
            <GoalProgress answered={today.answered} goal={today.goal} />
          </Card>

          {/* Devam eden seans çapası (Doc 25 §7 emniyet 3): kayıp iş = kayıp güven */}
          {active && (
            <Card className="border-warning/50">
              <CardTitle className="text-[13px]">⏸ Devam eden seans</CardTitle>
              <p className="tabular mt-1 text-[13px] text-ink-soft">
                {active.scopeName ?? (active.mode === "review" ? "Yanlış tekrarı" : "Koç seansı")}{" "}
                · {active.answeredCount}/{active.totalQuestions} soruda kaldın
              </p>
              {active.resumable ? (
                <Link
                  href={`/seans?resume=${active.sessionId}${active.scopeName ? `&scope=${encodeURIComponent(active.scopeName)}` : ""}`}
                  className="mt-2 inline-block text-[13px] font-bold text-brand hover:underline"
                >
                  Kaldığın yerden devam et →
                </Link>
              ) : (
                <p className="tk-caption mt-2">
                  Eski sürümden yarım oturum — yeni seans başlatman yeterli.
                </p>
              )}
            </Card>
          )}

          {gamification.nextBadge && (
            <Card>
              <CardTitle className="text-[13px]">🎖 Sıradaki rozet</CardTitle>
              <p className="mt-1 text-[13px] text-ink-soft">{gamification.nextBadge.name}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-atlas"
                  style={{
                    width: `${Math.min(100, Math.round((gamification.nextBadge.progress / Math.max(1, gamification.nextBadge.target)) * 100))}%`,
                  }}
                />
              </div>
              <p className="tabular mt-1 text-[11px] text-ink-soft">
                {gamification.nextBadge.progress}/{gamification.nextBadge.target}
              </p>
            </Card>
          )}

          {/* Sıradaki canlı deneme (wireframe 02 sağ kolon) */}
          {(liveExam || nextExam) && (
            <Card className={liveExam ? "border-live/50" : undefined}>
              <CardTitle className="text-[13px]">
                {liveExam ? "● Canlı deneme sürüyor" : "🏆 Sıradaki canlı deneme"}
              </CardTitle>
              {liveExam ? (
                <>
                  <p className="mt-1 text-[13px] text-ink-soft">{liveExam.title}</p>
                  <Link
                    href="/denemeler"
                    className="mt-2 inline-block text-[13px] font-bold text-live hover:underline"
                  >
                    Hemen katıl →
                  </Link>
                </>
              ) : (
                nextExam && (
                  <>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {nextExam.title} · {formatDate(nextExam.startAt)}{" "}
                      {formatTime(nextExam.startAt)}
                    </p>
                    <div className="mt-2 text-[13px] font-bold text-ink">
                      <Countdown target={nextExam.startAt} />
                    </div>
                  </>
                )
              )}
            </Card>
          )}

          {/* Rütbe ilerlemesi (Doc 24 §5) */}
          {rank && (
            <Card>
              <CardTitle className="text-[13px]">Rütbe: {rank.name}</CardTitle>
              {rank.next ? (
                <>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-streak"
                      style={{ width: `${rankPct}%` }}
                    />
                  </div>
                  <p className="tabular mt-1 text-[11px] text-ink-soft">
                    {rank.next.name} rütbesine {Math.max(0, rank.next.minScore - rank.score)} puan
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[13px] text-ink-soft">En yüksek rütbedesin.</p>
              )}
            </Card>
          )}

          <Card>
            <CardTitle className="text-[13px]">Rekorların</CardTitle>
            <dl className="tabular mt-2 space-y-1.5 text-[13px] text-ink-soft">
              <div className="flex justify-between">
                <dt>Bu hafta</dt>
                <dd className="font-bold text-ink">
                  {gamification.weekly.activeDays}/{gamification.weekly.goalDays} aktif gün
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>En iyi net</dt>
                <dd className="font-bold text-ink">{gamification.records.bestNet ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>En uzun seri</dt>
                <dd className="font-bold text-ink">{gamification.records.longestStreak} gün</dd>
              </div>
              <div className="flex justify-between">
                <dt>Günlük rekor</dt>
                <dd className="font-bold text-ink">
                  {gamification.records.maxDailyQuestions} soru
                </dd>
              </div>
            </dl>
          </Card>

          {!greeting.isPremium && (
            <Link
              href="/premium"
              className="tk-interactive block rounded-md border border-dashed border-line p-4 text-[13px] text-ink-soft hover:border-ink-soft"
            >
              <span className="font-bold text-ink">Premium</span> — koçun tam beyni: sınırsız
              soru, tam tekrar hafızası. →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
