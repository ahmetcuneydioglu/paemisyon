import Link from "next/link";
import type { WeekDayState } from "@/lib/public-api";
import { WeekStrip7 } from "./week-strip7";

/**
 * Bağlam satırı (Bugün v3 karar 1; Expo `ExamContextLine`): geri sayım küçük ama görünür — Lora
 * 600 28 px "184" + "gün · PAEM 2027", sağda "bu hafta 3/5"; altında 7 dilimli ince çizelge.
 * Kahraman değil, bağlam. Tarih yoksa sayı uydurulmaz: "Sınav tarihini seç ›".
 */
export function ExamContextLine({
  daysLeft,
  examName,
  activeDays,
  goalDays,
  days,
  pickDateHref = "/profil",
}: {
  daysLeft: number | null;
  examName: string | null;
  activeDays: number;
  goalDays: number;
  days: WeekDayState[];
  pickDateHref?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        {daysLeft != null ? (
          <p
            className="flex min-w-0 flex-1 items-baseline gap-1"
            aria-label={`${examName ?? "Sınava"} ${daysLeft} gün`}
          >
            <span className="font-display text-[28px] font-semibold leading-[34px] tabular text-ink">
              {daysLeft}
            </span>
            <span className="type-body truncate text-[15px] leading-5 text-ink-soft">
              gün{examName ? ` · ${examName}` : ""}
            </span>
          </p>
        ) : (
          <Link
            href={pickDateHref}
            className="type-body inline-flex min-h-[34px] flex-1 items-center text-[15px] text-accent-ink hover:underline"
          >
            Sınav tarihini seç ›
          </Link>
        )}
        <span className="type-body-sm tabular shrink-0 text-ink-soft">
          bu hafta {activeDays}/{goalDays}
        </span>
      </div>
      <WeekStrip7 days={days} />
    </div>
  );
}
