/** "Bu hafta" tek satır (Bugün v3; Expo `WeekSummaryLine`): surface-alt zemin, köşe card, iç 12; sol tabular özet, sağ rütbe. */
export function WeekSummaryLine({
  left,
  right,
}: {
  left: string;
  right: string | null;
}) {
  return (
    <p
      aria-label={`Bu hafta: ${left}${right ? `, ${right}` : ""}`}
      className="flex min-h-[46px] items-center justify-between gap-3 rounded-card bg-surface-alt px-3"
    >
      <span className="type-body tabular truncate text-[15px] text-ink">
        {left}
      </span>
      {right ? (
        <span className="type-body-sm shrink-0 truncate text-ink-soft">
          {right}
        </span>
      ) : null}
    </p>
  );
}
