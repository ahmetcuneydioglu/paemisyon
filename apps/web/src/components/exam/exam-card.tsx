import { Check, Lock, Users } from "lucide-react";
import type { ExamListItem } from "@/lib/types";
import { DIFFICULTY_LABEL, DIFFICULTY_TONE, examCardModel } from "@/lib/exam-ui";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PremiumBadge } from "@/components/ui/premium-badge";

/**
 * Deneme kartı (Doc 50 M1 / Figma ExamCard — 5 durum). Kurallar sunucudan;
 * kart yalnız gösterir. Haftalık denemede tarih rozeti üstte.
 */
export function ExamCard({
  exam,
  loggedIn,
  className,
}: {
  exam: ExamListItem;
  loggedIn: boolean;
  className?: string;
}) {
  const m = examCardModel(exam, loggedIn);
  const done = m.kind === "done";
  const closedIcon = m.kind === "weekly_missed" || m.kind === "closed";
  return (
    <Card className={cn("flex flex-col gap-3", className)} aria-label={exam.title}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          {exam.publishMode === "takvimli" ? (
            <Badge className="self-start">{formatDate(exam.startAt)}</Badge>
          ) : null}
          <h3 className="type-heading text-ink">{exam.title}</h3>
          <p className="type-body-sm text-ink-soft">
            {exam.questionCount} soru · {exam.durationMinutes} dk
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {exam.isPremium ? <PremiumBadge variant="soft" /> : null}
          {exam.difficulty ? (
            <Badge tone={DIFFICULTY_TONE[exam.difficulty]}>
              {DIFFICULTY_LABEL[exam.difficulty]}
            </Badge>
          ) : null}
        </div>
      </div>

      <p
        className={cn(
          "inline-flex items-center gap-1.5",
          done ? "type-subhead text-ink" : "type-body-sm text-ink-subtle",
        )}
      >
        {done ? (
          <Check size={16} className="text-success-ink" aria-hidden />
        ) : closedIcon ? (
          <Lock size={16} aria-hidden />
        ) : (
          <Users size={16} aria-hidden />
        )}
        <span className="tabular">{m.status}</span>
      </p>

      {m.primary || m.secondary ? (
        <div className="flex gap-2">
          {m.primary ? (
            <ButtonLink href={m.primary.href} variant={m.primary.variant} className="flex-1">
              {m.primary.label}
            </ButtonLink>
          ) : null}
          {m.secondary ? (
            <ButtonLink href={m.secondary.href} variant="ghost" className="flex-1">
              {m.secondary.label}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
