import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MixedLawSessionCard({
  courseId,
  courseName,
  lawCount,
  questionCount,
  sessionSize = 15,
}: {
  courseId: string;
  courseName: string;
  lawCount: number;
  questionCount: number;
  sessionSize?: number;
}) {
  const size = Math.min(sessionSize, questionCount);
  const href = `/seans?courseId=${courseId}&count=${size}&scope=${encodeURIComponent(`${courseName} · karışık`)}`;

  return (
    <Card className="mb-4 overflow-hidden border-atlas/35 bg-atlas/5 p-0 shadow-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-atlas/15 text-xl text-atlas"
          >
            ⇄
          </span>
          <div>
            <p className="tk-caption text-atlas">Karma mevzuat antrenmanı</p>
            <h3 className="mt-0.5 font-heading text-[17px] font-bold text-ink">
              Tüm polis mevzuatından karışık çöz
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              {lawCount} mevzuattaki {questionCount} çıkmış sorudan, kanunlar arasında dengeli bir
              seans hazırlanır.
            </p>
          </div>
        </div>
        <ButtonLink
          href={href}
          size="lg"
          variant="atlas"
          className="w-full shrink-0 sm:w-auto"
          aria-label={`Tüm ${courseName} konularından ${size} soruluk karışık seans başlat`}
        >
          <span>Mevzuat karışık çöz</span>
          <span aria-hidden>→</span>
        </ButtonLink>
      </div>
    </Card>
  );
}
