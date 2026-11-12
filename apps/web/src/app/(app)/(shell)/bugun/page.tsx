import type { Metadata } from "next";
import Link from "next/link";
import { Medal } from "lucide-react";
import { api } from "@/lib/api";
import type {
  CoachBrief,
  LeaderboardTeaser as LeaderboardTeaserData,
  WeekDayState,
} from "@/lib/public-api";
import type { ExamListItem } from "@/lib/types";
import { homeActionHref } from "@/lib/home-actions";
import { webRoute } from "@/lib/routes";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { ProgressBar } from "@/components/ui/progress";
import { StoreBadges } from "@/components/store-badges";
import { StreakBadge } from "@/components/ui/streak-badge";
import { ExamBanner, bannerExam } from "@/components/exam-banner";
import { PushOptIn } from "@/components/push-opt-in";
import { ExamContextLine } from "@/components/bugun/exam-context-line";
import { NextStepCard } from "@/components/bugun/next-step-card";
import { RouteList } from "@/components/bugun/route-list";
import { ForYouList } from "@/components/bugun/for-you-list";
import { WeekSummaryLine } from "@/components/bugun/week-summary-line";
import { LeaderboardTeaser } from "@/components/bugun/leaderboard-teaser";

export const metadata: Metadata = { title: "Bugün", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Bugün v3 (Doc 49/16) — "tek adım" ana sayfa; Expo `(tabs)/index.tsx` ile aynı iskelet.
 * Beş blok: bağlam satırı → Sıradaki (tek birincil düğme) → Bugünün rotası (2–6, numaralı,
 * tikli) → Senin için (≤4) → Bu hafta. Karar SUNUCUDA (`homeV3`); eski sunucuda `todayTask`'a,
 * o da yoksa koç kartına düşer. Geniş ekranda sağ sütun salt okunur özet (hafta, rozet, rütbe,
 * rekorlar); dar ekranda tek sütun, mobil sırayla.
 */

/** Eski sunucu `weekly.days` vermiyorsa aktif gün sayısından türetilen çizelge (TR takvimi, Pzt=0). */
function yedekGunler(activeDays: number): WeekDayState[] {
  const tr = new Date(Date.now() + 3 * 3600 * 1000 - 4 * 3600 * 1000);
  const today = (tr.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) =>
    i === today
      ? "today"
      : i < today
        ? i < activeDays
          ? "done"
          : "missed"
        : "future",
  );
}

function selam(): string {
  const saat = Number(
    new Date()
      .toLocaleString("tr-TR", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Istanbul",
      })
      .slice(0, 2),
  );
  if (saat < 6) return "İyi geceler";
  if (saat < 12) return "Günaydın";
  if (saat < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function BugunPage() {
  const [brief, exams, tahta] = await Promise.all([
    api<CoachBrief>("/me/coach"),
    api<ExamListItem[]>("/exams", {
      auth: false,
      next: { revalidate: 30 },
    }).catch(() => [] as ExamListItem[]),
    // Bugünün tahtası süs değil ama zorunlu da değil: düşerse sayfa düşmez.
    api<LeaderboardTeaserData>("/progress/leaderboard/teaser").catch(
      () => null,
    ),
  ]);
  const { today, gamification, greeting } = brief;
  const v3 = brief.homeV3 ?? null;
  const task = brief.todayTask ?? null;
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
  const serit = bannerExam(exams);
  const announcement =
    brief.cards.find((c) => c.type === "announcement") ?? null;
  const days =
    gamification.weekly.days ?? yedekGunler(gamification.weekly.activeDays);

  // Sıradaki: v3 varsa sunucunun adımı; yoksa Doc 48 görevi; o da yoksa koç kartı + birincil eylem.
  const hero = brief.cards.find(
    (c) => c.type !== "plan_week" && c.type !== "plan_offer",
  );
  const next = v3?.nextStep
    ? {
        eyebrow: v3.nextStep.eyebrow,
        title: v3.nextStep.title,
        reason: v3.nextStep.reason,
        badge: v3.nextStep.badge,
        ctaLabel:
          v3.nextStep.action.type === "resume_session"
            ? "Devam et"
            : v3.nextStep.kind === "done"
              ? v3.nextStep.action.label
              : "Başla",
        href: homeActionHref(v3.nextStep.action),
      }
    : task
      ? {
          eyebrow: "Sıradaki",
          title: task.title,
          reason: task.reason,
          badge: null,
          ctaLabel:
            task.action.type === "resume_session" ? "Devam et" : "Başla",
          href: homeActionHref(task.action),
        }
      : {
          eyebrow: "Sıradaki",
          title: hero?.title ?? "Bugün senin için bir tur hazır.",
          reason:
            hero?.body ??
            "Koç karışımı: zayıf konuların ve tekrar sırası gelenler.",
          badge: null,
          ctaLabel: brief.primaryAction.label || "Başla",
          href: webRoute(brief.primaryAction.route),
        };
  const secondary =
    task?.kind === "resume" && task.finishSessionId
      ? {
          label: "Şimdilik bitir, sonucu gör",
          href: `/sonuc/${task.finishSessionId}`,
        }
      : null;

  const rota = (v3?.route ?? []).map((r) => ({
    key: r.key,
    label: r.label,
    detail: r.detail,
    estimateMin: r.estimateMin ?? null,
    done: r.done,
    href: r.action ? homeActionHref(r.action) : null,
  }));
  // Bugünün sayımı (kullanıcı kararı 31 Eki): rota alt satırı, kart değil. Sıfırda dürüst metin.
  const t = v3?.today;
  const bugunSatiri = t
    ? t.answered === 0
      ? `Bugün henüz başlamadın · hedef ${t.goal} soru`
      : `Bugün ${t.answered} soru${
          t.accuracyPct != null ? ` · %${t.accuracyPct} doğru` : ""
        } · hedef ${t.goal}${t.answered >= t.goal ? " ✓" : ""}`
    : today.answered === 0
      ? `Bugün henüz başlamadın · hedef ${today.goal} soru`
      : `Bugün ${today.answered} soru · hedef ${today.goal}${
          today.answered >= today.goal ? " ✓" : ""
        }`;
  const seninIcin = (v3?.forYou ?? []).map((f, i) => ({
    key: `${f.kind}:${i}`,
    label: f.label,
    ctaLabel: f.ctaLabel,
    href: homeActionHref(f.action),
  }));
  const haftaSatiri = v3?.week
    ? {
        left: `${v3.week.solved} soru · ${v3.week.activeDays}/${v3.week.goalDays} gün`,
        right: v3.week.rankName,
      }
    : null;
  const sectionLabel = "type-label text-ink-subtle";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      {serit && <ExamBanner exam={serit} />}
      <PushOptIn />

      <div className="mb-5 flex flex-col gap-1">
        <div className="flex flex-nowrap items-baseline justify-between gap-3">
          <span className="type-brand text-ink">paemisyon</span>
          <div className="flex items-center gap-3">
            <StoreBadges width={96} className="hidden md:inline-flex" />
            <StreakBadge
              days={today.streak.current}
              atRisk={today.streak.atRisk}
            />
          </div>
        </div>
        <h1 className="type-body-sm text-ink-soft">
          {ilkAd(greeting.displayName)
            ? `${selam()}, ${ilkAd(greeting.displayName)}`
            : selam()}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sol sahne: beş blok, mobil sırayla. */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {announcement ? (
            <Notice
              title={announcement.title}
              action={
                announcement.cta ? (
                  <Link
                    href={webRoute(
                      announcement.cta.route,
                      announcement.type,
                      announcement.meta,
                    )}
                    className="type-subhead text-accent-ink hover:underline"
                  >
                    {announcement.cta.label} ›
                  </Link>
                ) : null
              }
            >
              {announcement.body}
            </Notice>
          ) : null}

          {/* 1) Bağlam satırı: geri sayım küçük ama görünür (karar 1) + hafta çizelgesi. */}
          <ExamContextLine
            daysLeft={brief.exam?.daysLeft ?? brief.daysToExam ?? null}
            examName={brief.exam?.name ?? null}
            activeDays={gamification.weekly.activeDays}
            goalDays={gamification.weekly.goalDays}
            days={days}
          />

          {/* 2) Sıradaki — sayfanın tek birincil düğmesi. */}
          <NextStepCard
            eyebrow={next.eyebrow}
            title={next.title}
            reason={next.reason}
            badge={next.badge}
            ctaLabel={next.ctaLabel}
            href={next.href}
            secondary={secondary}
          />

          {/* 3) Bugünün rotası (2–6 madde, sayı koçun). */}
          {rota.length > 0 ? (
            <RouteList
              rows={rota}
              footer={bugunSatiri}
              footerHref="/performans"
              planHref={brief.plan ? "/planim" : "/planim?kur=1"}
            />
          ) : null}

          {/* 4) Senin için (≤4). */}
          <ForYouList rows={seninIcin} />

          {/* 5) Bugünün tahtası — Senin için'in altında; genişte sağ sütunda (2 Kas 2026). */}
          {tahta ? (
            <div className="lg:hidden">
              <LeaderboardTeaser data={tahta} />
            </div>
          ) : null}

          {/* 6) Bu hafta — dar ekranda akışın sonunda; genişte sağ sütunun başında. */}
          {haftaSatiri ? (
            <div className="lg:hidden">
              <WeekSummaryLine
                left={haftaSatiri.left}
                right={haftaSatiri.right}
              />
            </div>
          ) : null}
        </div>

        {/* Sağ sütun (geniş ekran): salt okunur özet. */}
        <div className="flex flex-col gap-3">
          {haftaSatiri ? (
            <div className="hidden lg:block">
              <WeekSummaryLine
                left={haftaSatiri.left}
                right={haftaSatiri.right}
              />
            </div>
          ) : null}

          {tahta ? (
            <div className="hidden lg:block">
              <LeaderboardTeaser data={tahta} />
            </div>
          ) : null}

          {gamification.nextBadge ? (
            <Card className="flex flex-col gap-2">
              <span
                className={`${sectionLabel} inline-flex items-center gap-1.5`}
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
              <p className="type-body-sm text-ink-subtle">
                {rank.next
                  ? `${rank.next.name} rütbesine ${Math.max(0, rank.next.minScore - rank.score)} puan`
                  : "En yüksek rütbedesin."}
              </p>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-2">
            <span className={sectionLabel}>Rekorların</span>
            <dl className="type-body-sm tabular flex flex-col gap-1.5 text-ink-soft">
              {[
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

/** Selamda yalnız ilk ad ("Ahmet Yılmaz" → "Ahmet"); ad yoksa ya da anonimse ("Aday") selam yalın kalır. */
function ilkAd(displayName: string | null | undefined): string | null {
  const ad = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  return ad && ad !== "Aday" ? ad : null;
}
