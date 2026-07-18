/** Seri rozeti (Doc 26 #4): 🔥 + gün; risk halinde warning durumu. */
export function StreakBadge({ days, atRisk = false }: { days: number; atRisk?: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-bold tabular",
        atRisk
          ? "border-warning/50 bg-warning/10 text-warning"
          : "border-line bg-surface text-ink",
      ].join(" ")}
      title={atRisk ? "Serin bugün risk altında" : "Günlük seri"}
    >
      <span aria-hidden>🔥</span>
      {days} gün
    </span>
  );
}
