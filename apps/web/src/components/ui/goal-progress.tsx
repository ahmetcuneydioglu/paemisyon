/** Günlük hedef çubuğu (Doc 26 #3): çubuk + `8/20` etiketi. */
export function GoalProgress({
  answered,
  goal,
  label = "Bugünkü hedef",
}: {
  answered: number;
  goal: number;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((answered / Math.max(1, goal)) * 100));
  const done = answered >= goal && goal > 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="tk-caption">{label}</span>
        <span className="tabular text-[13px] font-bold text-ink">
          {answered}
          <span className="font-normal text-ink-soft">/{goal} soru</span>
          {done && (
            <span className="ml-1.5 text-success" aria-label="hedef tamamlandı">
              ✓
            </span>
          )}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label={label}
      >
        <div
          className={["h-full rounded-full transition-[width] duration-500", done ? "bg-success" : "bg-session"].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
