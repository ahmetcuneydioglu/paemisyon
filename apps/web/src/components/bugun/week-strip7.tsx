import { Check } from "lucide-react";
import type { WeekDayState } from "@/lib/public-api";
import { cn } from "@/lib/cn";

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/**
 * 7 günlük nöbet çizelgesi (Doc 49/13 §2): Pzt→Paz tek satır. Aktif gün ✓, bugün altın
 * kutu (nokta; görev bitince ✓), kaçan ve gelecek günler boş kutu. Durumlar sunucudan.
 */
export function WeekStrip7({ days }: { days: WeekDayState[] }) {
  const done = days.filter((d) => d === "done").length;
  return (
    <div
      role="img"
      aria-label={`Nöbet çizelgesi: bu hafta ${done} aktif gün`}
      className="flex gap-2"
    >
      {GUNLER.map((ad, i) => {
        const d = days[i] ?? "future";
        const today = d === "today";
        const isDone = d === "done";
        return (
          <div key={ad} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "type-label normal-case tracking-normal",
                today ? "text-accent-ink" : "text-ink-subtle",
              )}
            >
              {ad}
            </span>
            <div
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-control",
                isDone
                  ? "bg-surface-alt"
                  : today
                    ? "bg-accent"
                    : "border border-line bg-surface",
              )}
            >
              {isDone ? (
                <Check
                  size={18}
                  strokeWidth={2.25}
                  className="text-ink"
                  aria-hidden
                />
              ) : today ? (
                <span
                  className="size-2 rounded-full bg-on-accent"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
