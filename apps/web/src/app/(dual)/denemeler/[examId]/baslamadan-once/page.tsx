import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Bell, Clock, Minus, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ExamDetail } from "@/lib/types";
import { DIFFICULTY_LABEL, fmtNet, normalizeExamListItem } from "@/lib/exam-ui";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { RemindButton } from "@/components/exam/remind-button";

export const metadata: Metadata = {
  title: "Başlamadan önce",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

type Tone = "warning" | "info" | "accent";
const toneCls: Record<Tone, { wrap: string; icon: string; title: string }> = {
  warning: { wrap: "bg-warning-soft", icon: "text-warning-ink", title: "text-warning-ink" },
  info: { wrap: "bg-surface-alt", icon: "text-ink-soft", title: "text-ink" },
  accent: { wrap: "bg-accent-soft", icon: "text-accent-ink", title: "text-accent-ink" },
};

function RuleCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  tone: Tone;
  title: string;
  body: string;
}) {
  const c = toneCls[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-card p-4", c.wrap)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface">
        <Icon size={18} className={c.icon} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("type-subhead", c.title)}>{title}</p>
        <p className="type-body-sm text-ink-soft">{body}</p>
      </div>
    </div>
  );
}

/**
 * Kurallar ve başlama (Doc 50 M2): tam sayfa. Uyarılar belirgin kart; ders dağılımı;
 * düğme altta. Üç varyant: ilk çözüm · tekrar çözüm · haftalık beklemede.
 */
export default async function BaslamadanOncePage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ examId }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user) redirect(`/giris?next=${encodeURIComponent(`/denemeler/${examId}/baslamadan-once`)}`);
  const role = (Array.isArray(sp.role) ? sp.role[0] : sp.role) === "practice" ? "practice" : "official";
  const exam = await api<ExamDetail>(`/exams/${examId}`)
    .then((e) => ({ ...normalizeExamListItem(e), distribution: e.distribution ?? [] }))
    .catch(() => null);
  if (!exam) notFound();

  const official = exam.my.official;
  const practice = role === "practice" || (official?.status === "completed" && exam.canStartPractice && !exam.canStartOfficial);
  const weeklyWaiting = exam.publishMode === "takvimli" && exam.availability === "upcoming";
  const closed = exam.availability === "closed";
  const premiumLocked = exam.isPremium && !exam.canStartOfficial && !exam.canStartPractice && exam.myState === "new";
  const reminding = weeklyWaiting
    ? await api<{ reminding: boolean }>(`/exams/${exam.id}/remind`).then((r) => r.reminding).catch(() => false)
    : false;
  const startHref = `/sinav/${exam.id}${practice ? "?role=practice" : ""}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <Breadcrumb items={[{ label: "Denemeler", href: "/denemeler" }, { label: exam.title }, { label: "Başlamadan önce" }]} />

      <header className="flex flex-col gap-3">
        <h1 className="type-title text-ink">{exam.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{exam.questionCount} soru</Badge>
          <Badge>{exam.durationMinutes} dk</Badge>
          {exam.publishMode === "takvimli" ? (
            <Badge tone="accent">{formatDate(exam.startAt)} {formatTime(exam.startAt)}</Badge>
          ) : exam.difficulty ? (
            <Badge tone="accent">{DIFFICULTY_LABEL[exam.difficulty]}</Badge>
          ) : null}
          {exam.isPremium ? <PremiumBadge variant="soft" /> : null}
        </div>
        {exam.description ? <p className="type-body text-ink-soft">{exam.description}</p> : null}
      </header>

      <section className="flex flex-col gap-2" aria-label="Kurallar">
        {practice && official ? (
          <RuleCard
            icon={Trophy}
            tone="warning"
            title="Bu denemeyi zaten çözdün"
            body={`Tekrar çözüm sıralamayı etkilemez; resmî sonucun ${official.resultLocked ? "pencere kapanınca açıklanacak" : `${fmtNet(official.score)} net olarak kalır`}.`}
          />
        ) : (
          <RuleCard
            icon={Trophy}
            tone="warning"
            title="Sıralamaya yalnız ilk çözümün girer"
            body={
              exam.publishMode === "takvimli"
                ? `${formatTime(exam.startAt)}'den sınav bitene kadar bir kez girebilirsin. Sonrası pratik sayılır.`
                : "İkinci kez çözersen pratik sayılır, sıran değişmez. Hazır olduğundan emin ol."
            }
          />
        )}
        <RuleCard
          icon={Clock}
          tone="warning"
          title={`${exam.durationMinutes} dakika kesintisiz zaman ayır`}
          body="Süre başlayınca durmaz; sekmeyi kapatsan da işler. Dolunca cevapların otomatik teslim edilir."
        />
        <RuleCard
          icon={Minus}
          tone="info"
          title="4 yanlış 1 doğruyu götürür"
          body="Puan net ile hesaplanır: doğru − yanlış/4. Boş sorular neti etkilemez."
        />
        {exam.publishMode === "takvimli" ? (
          <RuleCard
            icon={Bell}
            tone="accent"
            title="Sonuçlar pencere kapanınca açıklanır"
            body={`Sıralama ve Türkiye kıyası ${formatDate(exam.endAt)} ${formatTime(exam.endAt)}'de herkese aynı anda açılır; sana bildirim göndeririz.`}
          />
        ) : null}
        {exam.liveAnswerReveal && !practice ? (
          <Notice tone="info">Bu denemede şıkka basınca doğru/yanlış ve açıklama hemen görünür; cevap değiştirilemez.</Notice>
        ) : null}
      </section>

      {exam.distribution.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <p className="type-label text-ink-subtle">Ders dağılımı · {exam.questionCount} soru</p>
          <ul className="flex flex-col divide-y divide-line">
            {exam.distribution.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 py-2">
                <span className="type-body-sm text-ink">{d.name}</span>
                <span className="type-subhead tabular text-ink">{d.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {premiumLocked ? (
          <>
            <Notice tone="warning">Bu deneme Premium üyelere özel.</Notice>
            <ButtonLink href="/premium" size="lg">Premium ile aç</ButtonLink>
          </>
        ) : weeklyWaiting ? (
          <>
            <ButtonLink href="#" size="lg" aria-disabled className="pointer-events-none opacity-50">
              {formatDate(exam.startAt)} {formatTime(exam.startAt)}&apos;de açılır
            </ButtonLink>
            <RemindButton examId={exam.id} initial={reminding} />
          </>
        ) : exam.myState === "in_progress" ? (
          <ButtonLink href={startHref} size="lg">Devam et</ButtonLink>
        ) : practice ? (
          exam.canStartPractice ? (
            <ButtonLink href={startHref} size="lg" variant="secondary">Tekrar çöz</ButtonLink>
          ) : (
            <Notice tone="info">
              {closed ? "Bu deneme tekrar çözüme kapalı." : "Tekrar çözüm, resmî çözüm bittikten sonra açılır."}
            </Notice>
          )
        ) : exam.canStartOfficial ? (
          <ButtonLink href={startHref} size="lg">Sınava başla</ButtonLink>
        ) : official?.status === "completed" ? (
          <ButtonLink href={`/sonuc/${official.attemptId}`} size="lg" variant="secondary">Sonucunu gör</ButtonLink>
        ) : (
          <Notice tone="info">Bu deneme yeni çözüme kapalı.</Notice>
        )}
        <ButtonLink href="/denemeler" variant="ghost">Denemelere dön</ButtonLink>
      </div>
    </div>
  );
}
