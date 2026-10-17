import { ArrowRight, Shuffle } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Karma mevzuat antrenmanı kartı — dersin TÜM kanunlarından dengeli tur.
 * `secondaryAction` ile yanına ikinci bir eylem alır (ör. "Kanun seçerek
 * çöz"); kart kendisi seçim bilmez, yalnız kapıdır.
 */
export function MixedLawSessionCard({
  courseId,
  courseName,
  lawCount,
  questionCount,
  sessionSize = 15,
  secondaryAction,
}: {
  courseId: string;
  courseName: string;
  lawCount: number;
  questionCount: number;
  sessionSize?: number;
  secondaryAction?: ReactNode;
}) {
  const size = Math.min(sessionSize, questionCount);
  const href = `/seans?courseId=${courseId}&count=${size}&scope=${encodeURIComponent(`${courseName} · karışık`)}`;

  return (
    <Card tone="accent" className="mb-4 overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-control bg-surface text-accent-ink"
          >
            <Shuffle size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="type-label text-accent-ink">
              Karma mevzuat antrenmanı
            </p>
            <h3 className="type-heading mt-0.5 text-ink">
              Tüm polis mevzuatından karışık çöz
            </h3>
            <p className="type-body-sm mt-1 text-ink-soft">
              {lawCount} mevzuattaki {questionCount} çıkmış sorudan, kanunlar
              arasında dengeli bir tur hazırlanır. İstersen yalnız çalıştığın
              kanunları seçebilirsin.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {secondaryAction}
          <ButtonLink
            href={href}
            size="lg"
            className="w-full sm:w-auto"
            aria-label={`Tüm ${courseName} konularından ${size} soruluk karışık tur başlat`}
          >
            Mevzuat karışık çöz <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
