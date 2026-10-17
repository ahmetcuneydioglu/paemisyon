import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Medal, Pause, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import {
  activeSessionHref,
  type ActiveSession,
  type ActivityDay,
  type CoachBrief,
} from "@/lib/public-api";
import type { ExamListItem } from "@/lib/types";
import { Countdown } from "@/components/countdown";
import { formatDate, formatTime } from "@/lib/format";
import { webRoute } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { CoachCard } from "@/components/ui/coach-card";
import { GoalProgress } from "@/components/ui/goal-progress";
import { ProgressBar } from "@/components/ui/progress";
import { ButtonLink } from "@/components/ui/button";
import { StoreBadges } from "@/components/store-badges";
import { StreakBadge } from "@/components/ui/streak-badge";
import { FocusPicker } from "@/components/bugun/focus-picker";
import { ExamBanner, bannerExam } from "@/components/exam-banner";
import { PushOptIn } from "@/components/push-opt-in";

export const metadata: Metadata = { title: "Bugün", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Bugün — girişli ana sayfa (Doc 27 §3.2). Sahne koçundur: hero = durum
 * makinesinin kartı (/me/coach), yanı günün özeti. Koç rayı burada YOK.
 * Görünüm v3 "Nöbet" (Doc 49/11 W-D): tek vurgu, rozet/ikon eşlikli durum.
 */
export default async function BugunPage() {
  const [brief, exams, active, activity] = await Promise.all([
    api<CoachBrief>("/me/coach"),
    api<ExamListItem[]>("/exams", {
      auth: false,
      next: { revalidate: 30 },
    }).catch(() => [] as ExamListItem[]),
    api<ActiveSession | null>("/quiz/active-session").catch(() => null),
    api<ActivityDay[]>("/progress/activity").catch(() => [] as ActivityDay[]),
  ]);
  const { today, gamification, greeting } = brief;
  const [hero, ...cards] = brief.cards;
  const rank = gamification.rank;
  const rankPct =
    rank?.next != null
      ? Math.min(
          100,
          Math.round(
            ((rank.score - rank.minScore) /
              Math.max(1, rank.next.minScore - rank.minScore)) *
              100,
          ),
        )
      : 100;
  const nextExam = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const liveExam = exams.find((e) => e.state === "active");
  const serit = bannerExam(exams);
  const week = activity.slice(-7);
  const dayShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const sectionLabel = "type-label text-ink-subtle";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      {serit && <ExamBanner exam={serit} />}
      <PushOptIn />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-title text-ink">
          {greeting.displayName
            ? `Merhaba, ${greeting.displayName}`
            : "Merhaba"}
        </h1>
        <div className="flex items-center gap-3">
          <StoreBadges width={96} className="hidden sm:inline-flex" />
          <StreakBadge
            days={today.streak.current}
            atRisk={today.streak.atRisk}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sol sahne (8 kolon): hero + destek kartları + nöbet çizelgesi */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex flex-col gap-3 p-6">
            <span className="type-label text-accent-ink">Koç</span>
            <p className="type-heading text-ink">
              {hero?.title ?? "Bugün senin için bir tur hazır."}
            </p>
            {hero?.body ? (
              <p className="type-body text-ink-soft">{hero.body}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ButtonLink href={webRoute(brief.primaryAction.route)} size="lg">
                Bugün Çalış
              </ButtonLink>
              <FocusPicker />
            </div>
          </Card>

          {cards.length > 0 ? (
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
          ) : null}

          {week.length === 7 ? (
            <Card className="flex flex-col gap-3">
              <span className={sectionLabel}>Son 7 gün · nöbet çizelgesi</span>
              <div className="flex gap-2">
                {week.map((d, i) => {
                  const isToday = i === week.length - 1;
                  const dow =
                    dayShort[new Date(d.date + "T00:00:00Z").getUTCDay()];
                  const active = d.questionsAnswered > 0;
                  return (
                    <div
                      key={d.date}
                      className={cn(
                        "flex-1 rounded-control border py-2 text-center",
                        isToday
                          ? "border-accent bg-accent-soft"
                          : active
                            ? "border-success/40 bg-success-soft"
                            : "border-dashed border-line",
                      )}
                    >
                      <p
                        className={cn(
                          "type-label",
                          isToday ? "text-accent-ink" : "text-ink-subtle",
                        )}
                      >
                        {isToday ? "Bugün" : dow}
                      </p>
                      <p
                        className={cn(
                          "type-subhead tabular mt-0.5",
                          active
                            ? isToday
                              ? "text-accent-ink"
                              : "text-success-ink"
                            : "text-ink-subtle",
                        )}
                      >
                        {active ? d.questionsAnswered : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </div>

        {/* Sağ kolon (4 kolon): günün özeti — salt okunur */}
        <div className="flex flex-col gap-3">
          <Card>
            <GoalProgress answered={today.answered} goal={today.goal} />
          </Card>

          {active ? (
            <Card className="flex flex-col gap-1 border-warning/40">
              <span className="type-label inline-flex items-center gap-1.5 text-warning-ink">
                <Pause size={12} aria-hidden /> Devam eden tur
              </span>
              <p className="type-body-sm tabular text-ink-soft">
                {active.scopeName ??
                  (active.mode === "review"
                    ? "Yanlış tekrarı"
                    : "Koç turu")}{" "}
                · {active.answeredCount}/{active.totalQuestions} soruda kaldın
              </p>
              {active.resumable ? (
                <Link
                  href={activeSessionHref(active)}
                  className="type-subhead mt-1 inline-flex items-center gap-1 text-accent-ink hover:underline"
                >
                  Kaldığın yerden devam et <ArrowRight size={14} aria-hidden />
                </Link>
              ) : (
                <p className="type-body-sm text-ink-subtle">
                  Eski sürümden yarım oturum — yeni tur başlatman yeterli.
                </p>
              )}
            </Card>
          ) : null}

          {brief.weeklyPhoto && brief.weeklyPhoto.length > 0 ? (
            <Card className="flex flex-col gap-2">
              <span className={sectionLabel}>Haftalık fotoğraf</span>
              <ul className="flex flex-col gap-1.5">
                {brief.weeklyPhoto.slice(0, 4).map((c) => (
                  <li
                    key={c.courseName}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="type-body-sm min-w-0 truncate text-ink-soft">
                      {c.courseName}
                    </span>
                    <span
                      className={cn(
                        "type-subhead tabular shrink-0",
                        c.deltaPct > 0 ? "text-success-ink" : "text-danger-ink",
                      )}
                    >
                      %{Math.abs(c.deltaPct)} {c.deltaPct > 0 ? "↑" : "↓"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/performans/konu-haritasi"
                className="type-body-sm inline-flex items-center gap-1 text-accent-ink hover:underline"
              >
                Konu haritasında incele <ArrowRight size={14} aria-hidden />
              </Link>
            </Card>
          ) : null}

          {gamification.nextBadge ? (
            <Card className="flex flex-col gap-2">
              <span
                className={cn(sectionLabel, "inline-flex items-center gap-1.5")}
              >
                <Medal size={12} aria-hidden /> Sıradaki rozet
              </span>
              <p className="type-body-sm text-ink">
                {gamification.nextBadge.name}
              </p>
              <ProgressBar
                value={
                  gamification.nextBadge.progress /
                  Math.max(1, gamification.nextBadge.target)
                }
                height={4}
                label="Rozet ilerlemesi"
              />
              <p className="type-body-sm tabular text-ink-subtle">
                {gamification.nextBadge.progress}/
                {gamification.nextBadge.target}
              </p>
            </Card>
          ) : null}

          {(liveExam || nextExam) &&
          serit?.id !== (liveExam ?? nextExam)?.id ? (
            <Card
              className={cn(
                "flex flex-col gap-1",
                liveExam && "border-success/40",
              )}
            >
              <span
                className={cn(
                  sectionLabel,
                  "inline-flex items-center gap-1.5",
                  liveExam && "text-success-ink",
                )}
              >
                {liveExam ? (
                  <span
                    aria-hidden
                    className="inline-block size-2 rounded-full bg-success motion-safe:animate-pulse"
                  />
                ) : (
                  <Trophy size={12} aria-hidden />
                )}
                {liveExam ? "Canlı deneme sürüyor" : "Sıradaki canlı deneme"}
              </span>
              {liveExam ? (
                <>
                  <p className="type-body-sm text-ink-soft">{liveExam.title}</p>
                  <Link
                    href="/denemeler"
                    className="type-subhead mt-1 inline-flex items-center gap-1 text-success-ink hover:underline"
                  >
                    Hemen katıl <ArrowRight size={14} aria-hidden />
                  </Link>
                </>
              ) : nextExam ? (
                <>
                  <p className="type-body-sm text-ink-soft">
                    {nextExam.title} · {formatDate(nextExam.startAt)}{" "}
                    {formatTime(nextExam.startAt)}
                  </p>
                  <div className="type-subhead mt-1 text-ink">
                    <Countdown target={nextExam.startAt} />
                  </div>
                </>
              ) : null}
            </Card>
          ) : null}

          {rank ? (
            <Card className="flex flex-col gap-2">
              <span className={sectionLabel}>Rütbe</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="type-subhead text-ink">{rank.name}</span>
                {rank.next ? (
                  <span className="type-body-sm tabular text-ink-soft">
                    {rank.score}/{rank.next.minScore}
                  </span>
                ) : null}
              </div>
              <ProgressBar
                value={rankPct / 100}
                height={4}
                label="Rütbe ilerlemesi"
              />
              {rank.next ? (
                <p className="type-body-sm text-ink-subtle">
                  {rank.next.name} rütbesine{" "}
                  {Math.max(0, rank.next.minScore - rank.score)} puan
                </p>
              ) : (
                <p className="type-body-sm text-ink-subtle">
                  En yüksek rütbedesin.
                </p>
              )}
            </Card>
          ) : null}

          <Card className="flex flex-col gap-2">
            <span className={sectionLabel}>Rekorların</span>
            <dl className="type-body-sm tabular flex flex-col gap-1.5 text-ink-soft">
              {[
                [
                  "Bu hafta",
                  `${gamification.weekly.activeDays}/${gamification.weekly.goalDays} aktif gün`,
                ],
                ["En iyi net", gamification.records.bestNet ?? "—"],
                ["En uzun seri", `${gamification.records.longestStreak} gün`],
                [
                  "Günlük rekor",
                  `${gamification.records.maxDailyQuestions} soru`,
                ],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-2">
                  <dt>{k}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {!greeting.isPremium ? (
            <Link
              href="/premium"
              className="tk-interactive type-body-sm block rounded-card border border-dashed border-line p-4 text-ink-soft hover:border-ink-soft"
            >
              <span className="type-subhead text-ink">Premium</span> — koçun tam
              beyni: sınırsız soru, tam tekrar hafızası.
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
