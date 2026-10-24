import type { ExamListItem } from "@/lib/types";
import { heroFor } from "@/lib/exam-ui";
import { formatDate, formatTime } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Countdown } from "@/components/countdown";
import { DeadlineClock } from "./deadline-clock";
import { RemindButton } from "./remind-button";

/**
 * "Şu an" hero'su (Doc 50 M1): devam eden çözüm > sıradaki haftalık > sakin boşluk.
 * Lacivert panel; iki temada da koyu (Nöbet kuralı).
 */
export function ExamHero({
  exams,
  reminding,
}: {
  exams: ExamListItem[];
  /** Sıradaki haftalık deneme için hatırlatma açık mı (sunucudan). */
  reminding: boolean;
}) {
  const hero = heroFor(exams);

  if (hero.kind === "active") {
    const e = hero.exam;
    const a = e.my.active!;
    return (
      <Card className="flex flex-col gap-3 border-panel bg-panel p-6 md:flex-row md:items-center md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-label inline-flex items-center gap-1.5 text-accent-ink">
            <span aria-hidden className="inline-block size-2 rounded-full bg-accent motion-safe:animate-pulse" />
            Devam ediyor{a.role === "practice" ? " · tekrar çözüm" : ""}
          </span>
          <p className="type-heading text-panel-ink">{e.title}</p>
          <p className="type-body-sm tabular text-panel-soft">
            {a.answered} / {e.questionCount} cevaplandı
          </p>
          <ProgressBar value={a.answered / Math.max(1, e.questionCount)} label="Cevaplanan" />
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {a.deadlineAt ? (
            <DeadlineClock deadlineAt={a.deadlineAt} className="type-display tabular text-panel-ink" />
          ) : null}
          <ButtonLink href={`/sinav/${e.id}${a.role === "practice" ? "?role=practice" : ""}`} size="lg">
            Devam et
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (hero.kind === "weekly") {
    const e = hero.exam;
    const open = e.availability === "open";
    return (
      <Card className="flex flex-col gap-3 border-panel bg-panel p-6 md:flex-row md:items-center md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-label text-panel-soft">
            Haftalık deneme · {formatDate(e.startAt)} {formatTime(e.startAt)}
          </span>
          <p className="type-heading text-panel-ink">{e.title}</p>
          <p className="type-body-sm text-panel-soft">
            {e.questionCount} soru · {e.durationMinutes} dk · {e.participantCount.toLocaleString("tr-TR")}{" "}
            {open ? "kişi katıldı" : "kişi katılacak"} · sınav bitene kadar giriş açık
          </p>
          {!open ? (
            <div className="mt-1 text-panel-ink">
              <Countdown target={e.startAt} />
            </div>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 md:w-56">
          {open ? (
            <ButtonLink href={`/denemeler/${e.id}/baslamadan-once`} size="lg">
              {e.myState === "completed" ? "Sonucunu gör" : "Sınava katıl"}
            </ButtonLink>
          ) : (
            <RemindButton examId={e.id} initial={reminding} />
          )}
          <ButtonLink href={`/denemeler/${e.id}/baslamadan-once`} variant="ghost">
            Kuralları gör
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="alt" className="flex flex-col gap-1 p-5">
      <p className="type-subhead text-ink">Bu hafta deneme yok</p>
      <p className="type-body-sm text-ink-soft">
        Serbest denemelerden birini çöz; sıradaki haftalık deneme açıklanınca burada görünür.
      </p>
    </Card>
  );
}
