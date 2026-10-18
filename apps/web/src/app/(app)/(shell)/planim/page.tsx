import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Lock } from "lucide-react";
import { api } from "@/lib/api";
import type { Plan, PlanDefaults, PlanItem, PlanWeek } from "@/lib/public-api";
import { formatMinutes, itemTitle, longDate, phaseLabel, planItemHref, shortDate } from "@/lib/plan";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { ProgressBar } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTile } from "@/components/ui/stat-tile";
import { ListRow } from "@/components/ui/list-row";
import { PlanArchiveButton, PlanDialogButton } from "@/components/plan/plan-dialog";

export const metadata: Metadata = { title: "Planım", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Planım (Doc 49/12 F8-A §5) — L2 kabuk. Hafta şeridi `?hafta=` ile seçilir (sunucu
 * bileşeni; istemci durumu yok), seçili haftanın kalemleri ilerlemesiyle, kilitli haftada
 * Premium kapısı. Plan yoksa boş durum + kur diyaloğu; `?kur=1` diyaloğu açık başlatır.
 * Kural sunucuda: evre, yüzde, kilit ve kapsam `/me/plan`'dan gelir.
 */
export default async function PlanimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const [res, defaults] = await Promise.all([
    api<{ plan: Plan | null }>("/me/plan"),
    api<PlanDefaults>("/me/plan/defaults"),
  ]);
  const plan = res.plan;
  const autoOpen = one(p.kur) === "1";

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <h1 className="type-title mb-6 text-ink">Planım</h1>
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Henüz planın yok"
            body="Haftada ayırabildiğin süreyi söyle; konuları sınav ağırlığına ve zayıf noktalarına göre haftalara dağıtayım. Her Pazartesi plan taze verilerle yenilenir."
            action={<PlanDialogButton mode="create" current={null} defaults={defaults} label="Planı kur" variant="primary" autoOpen={autoOpen} />}
          />
        </Card>
      </div>
    );
  }

  const secili = one(p.hafta);
  const week: PlanWeek = plan.weeks.find((w) => w.weekStart === secili) ?? plan.thisWeek;
  const s = plan.thisWeek.summary;
  const haftaNo = plan.weeks.findIndex((w) => w.weekStart === plan.currentWeekStart) + 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="type-title text-ink">Planım</h1>
          <Badge tone={plan.phase === "build" ? "neutral" : "warning"}>{phaseLabel(plan.phase)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanDialogButton mode="revise" current={plan} defaults={defaults} label="Planı yenile" autoOpen={autoOpen} />
          <PlanArchiveButton />
        </div>
      </div>

      {plan.ended ? (
        <Notice tone="info" title="Plan tamamlandı" className="mb-4">
          Sınav tarihi geçti ya da ufuk doldu. Yeni dönem için planı yeniden kurabilirsin.
        </Notice>
      ) : null}
      {plan.suggestions.includes("exam_date") ? (
        <Notice tone="warning" title="Sınav tarihi yok" className="mb-4">
          Plan 12 haftalık kuruldu. Tarihi girersen sınava kalan haftaya göre yeniden dağıtırım.
        </Notice>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <Card className="flex flex-col gap-3 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-subhead text-ink">Bu hafta</span>
              <span className="type-stat text-ink">%{s.pct}</span>
            </div>
            <ProgressBar value={s.pct / 100} tone={s.pct >= 100 ? "success" : "accent"} label="Bu haftanın ilerlemesi" />
            <p className="type-body-sm tabular text-ink-soft">
              {formatMinutes(s.doneMinutes)} / {formatMinutes(s.targetMinutes)} · {s.doneQuestions} / {s.targetQuestions} soru
              {s.offPlanQuestions > 0 ? ` · plan dışı ${s.offPlanQuestions} soru` : ""}
            </p>
          </Card>

          {/* Hafta şeridi */}
          <nav aria-label="Haftalar" className="-mx-1 w-full min-w-0 overflow-x-auto px-1">
            <ol className="flex gap-2">
              {plan.weeks.map((w, i) => {
                const sel = w.weekStart === week.weekStart;
                return (
                  <li key={w.weekStart} className="shrink-0">
                    <Link
                      href={sel ? "/planim" : `/planim?hafta=${w.weekStart}`}
                      aria-current={sel ? "true" : undefined}
                      className={cn(
                        "tk-interactive flex min-h-16 min-w-20 flex-col items-center justify-center gap-0.5 rounded-card border px-3 py-2",
                        sel ? "border-accent bg-accent-soft" : w.state === "past" ? "border-line bg-surface-alt opacity-70" : "border-line bg-surface hover:border-ink-soft",
                      )}
                    >
                      <span className={cn("type-label", sel ? "text-accent-ink" : "text-ink-subtle")}>Hf {i + 1}</span>
                      <span className={cn("type-body-sm", sel ? "text-accent-ink" : "text-ink-soft")}>{shortDate(w.weekStart)}</span>
                      {w.locked ? (
                        <Lock size={12} className="text-ink-subtle" aria-label="kilitli" />
                      ) : (
                        <span className={cn("type-label", w.summary.pct >= 100 ? "text-success-ink" : "text-ink-subtle")}>
                          {w.state === "future" ? phaseLabel(w.phase).slice(0, 4) : `%${w.summary.pct}`}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <section className="flex flex-col gap-3">
            <SectionHeader title={week.state === "current" ? "Bu hafta" : `${shortDate(week.weekStart)} haftası`} />
            {week.locked ? (
              <Card tone="alt" className="flex flex-col gap-2">
                <span className="type-subhead inline-flex items-center gap-2 text-ink">
                  <Lock size={18} className="text-ink-soft" aria-hidden /> Gelecek haftalar Premium&apos;da
                </span>
                <p className="type-body-sm text-ink-soft">
                  Bu haftanın planı herkese açık. Sonraki haftalar, her Pazartesi otomatik yenileme ve sınav modundaki
                  tekrar/deneme kalemleri Premium&apos;la açılır.
                </p>
                <div>
                  <ButtonLink href="/premium" variant="secondary">
                    Premium&apos;u incele
                  </ButtonLink>
                </div>
              </Card>
            ) : week.items.length === 0 ? (
              <Card>
                <p className="type-body-sm text-ink-soft">Bu haftaya kalem düşmedi.</p>
              </Card>
            ) : (
              <Card className="p-0">
                {week.items.map((i, idx) => (
                  <PlanItemRow key={i.id} item={i} current={week.state === "current"} divider={idx < week.items.length - 1} />
                ))}
              </Card>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Hafta" value={`${haftaNo} / ${plan.weeks.length}`} />
            <StatTile label="Kapsam" value={plan.coverage.pctOfSyllabus} unit="%" hint="müfredat" />
          </div>
          <Card className="p-0">
            <ListRow title="Haftalık süre" subtitle={formatMinutes(plan.weeklyMinutes)} />
            <ListRow title="Sınav tarihi" subtitle={plan.examDate ? longDate(plan.examDate) : "Belli değil"} />
            <ListRow title="Kapsam" subtitle={`${plan.coverage.topics} / ${plan.coverage.syllabusTopics} konu`} />
            <ListRow
              title={plan.revisedAt ? "Son yenileme" : "Kuruluş"}
              subtitle={new Date(plan.revisedAt ?? plan.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" })}
              divider={false}
            />
          </Card>
          <p className="type-body-sm text-ink-subtle">
            Her Pazartesi geçen hafta kapanır; eksik kalan dakikanın yarısı sonraki haftaya taşınır (Premium).
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanItemRow({ item, current, divider }: { item: PlanItem; current: boolean; divider: boolean }) {
  const done = item.status === "done";
  const pct = item.targetMinutes > 0 ? Math.min(1, item.doneMinutes / item.targetMinutes) : 0;
  const href = current && !done ? planItemHref(item) : undefined;
  return (
    <ListRow
      title={itemTitle(item)}
      subtitle={item.courseName ?? (item.kind === "review" ? "SRS ve yanlış turu" : item.kind === "mock" ? "Kişisel ya da canlı deneme" : null)}
      divider={divider}
      href={href}
      chevron={false}
      trailing={
        <span className="flex min-w-28 flex-col items-end gap-1">
          {done ? (
            <Badge tone="success">Tamam</Badge>
          ) : item.status === "skipped" ? (
            <Badge>Geçti</Badge>
          ) : (
            <span className={cn("type-subhead inline-flex items-center gap-1", current ? "text-accent-ink" : "text-ink-soft")}>
              {current ? `${formatMinutes(item.remainingMinutes)} kaldı` : formatMinutes(item.targetMinutes)}
              {href ? <ArrowRight size={14} aria-hidden /> : null}
            </span>
          )}
          <ProgressBar value={done ? 1 : pct} tone={done ? "success" : "accent"} height={4} className="w-28" />
        </span>
      }
    />
  );
}
