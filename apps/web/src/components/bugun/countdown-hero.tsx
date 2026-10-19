import Link from "next/link";

/**
 * Geri sayım afişi (Doc 49/13 §2 — "Büyük sayı"): lacivert panel, dev Lora rakam, altında
 * sınav adı + tarih, sağda haftanın aktif gün sayısı. Tarih yoksa sayı uydurulmaz: sakin
 * cümle ve hedef tarihi seçme bağlantısı. Panel iki temada da koyudur (token `panel`).
 */
export function CountdownHero({
  examName,
  examDateLabel,
  daysLeft,
  activeDays,
  goalDays,
}: {
  examName: string | null;
  examDateLabel: string | null;
  daysLeft: number | null;
  activeDays: number;
  goalDays: number;
}) {
  return (
    <section
      aria-label={
        daysLeft == null
          ? "Hedef sınav tarihi seçilmedi"
          : `${examName ?? "Hedef sınava"} ${daysLeft} gün kaldı. Bu hafta ${activeDays} / ${goalDays} gün`
      }
      className="rounded-panel bg-panel px-5 pt-2 pb-5 text-panel-ink"
    >
      {daysLeft == null ? (
        <div className="flex flex-col gap-2 py-3">
          <p className="font-display text-[28px] leading-[34px] font-normal">
            Tarih bekleniyor
          </p>
          <p className="type-body-sm text-panel-soft">
            {examName
              ? `${examName} için hedef tarihini seç; geri sayım ve plan ona göre kurulur.`
              : "Hedef sınavını ve tarihini seç; geri sayım buradan başlar."}
          </p>
          <Link
            href="/profil"
            className="type-subhead inline-flex min-h-11 items-center text-accent hover:underline"
          >
            Hedef tarihini seç ›
          </Link>
        </div>
      ) : (
        <>
          <p className="type-hero text-accent" data-hero-number>
            {daysLeft > 999 ? "999+" : daysLeft}
          </p>
          <div className="flex items-baseline justify-between gap-3">
            <p className="type-subhead min-w-0 truncate">
              {examName ? `${examName}'ye` : "Hedef sınava"}
              {examDateLabel ? ` · ${examDateLabel}` : ""}
            </p>
            <p className="type-body-sm tabular shrink-0 text-panel-soft">
              {activeDays}/{goalDays} gün
            </p>
          </div>
        </>
      )}
    </section>
  );
}
