import { Check } from "lucide-react";
import { ProgressBar } from "./progress";

/** Günlük hedef çubuğu: etiket + `8/20` + çubuk; tamamlanınca adaçayı ve onay ikonu. */
export function GoalProgress({
  answered,
  goal,
  label = "Bugünkü hedef",
}: {
  answered: number;
  goal: number;
  label?: string;
}) {
  const done = answered >= goal && goal > 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-label text-ink-subtle">{label}</span>
        <span className="type-subhead tabular inline-flex items-center gap-1 text-ink">
          {answered}
          <span className="font-normal text-ink-soft">/{goal} soru</span>
          {done ? (
            <Check
              size={14}
              className="text-success"
              aria-label="hedef tamamlandı"
            />
          ) : null}
        </span>
      </div>
      <ProgressBar
        value={answered / Math.max(1, goal)}
        tone={done ? "success" : "accent"}
        height={6}
        label={label}
      />
    </div>
  );
}
