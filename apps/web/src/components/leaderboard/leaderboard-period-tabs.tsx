"use client";
import type { LeaderboardPeriod } from "@/lib/public-api";

const TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu Hafta" },
  { key: "month", label: "Bu Ay" },
  { key: "all", label: "Tüm Zamanlar" },
];

/** Dönem sekmeleri — segmentli kontrol (Bugün/Hafta/Ay/Tüm). */
export function LeaderboardPeriodTabs({
  value,
  onChange,
  disabled,
}: {
  value: LeaderboardPeriod;
  onChange: (p: LeaderboardPeriod) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sıralama dönemi"
      className="inline-flex w-full gap-0.5 rounded-control border border-line bg-surface p-0.5 sm:w-auto"
    >
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(t.key)}
            className={[
              "tk-interactive type-subhead h-10 flex-1 whitespace-nowrap rounded-[8px] px-3 sm:flex-none",
              active
                ? "bg-accent text-on-accent"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
