import Link from "next/link";
import { Check, Scale, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SourceTag } from "./source-tag";

/**
 * Açıklama kutusu (Doc 26 #6): sonuç + açıklama + kaynak etiketi (panel ayarına bağlı)
 * + madde köprüsü. Yanlış → kavrayış döngüsünün tur içindeki durağı.
 */
export function ExplanationBox({
  isCorrect,
  explanation,
  source,
  legalReference,
  lawHref,
}: {
  isCorrect: boolean;
  explanation: string | null;
  source: string | null;
  legalReference: string | null;
  lawHref?: string | null;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-2 rounded-card p-4",
        isCorrect
          ? "bg-success-soft text-success-ink"
          : "bg-danger-soft text-danger-ink",
      )}
    >
      <p className="type-subhead inline-flex items-center gap-1.5">
        {isCorrect ? (
          <Check size={18} strokeWidth={2.25} aria-hidden />
        ) : (
          <X size={18} strokeWidth={2.25} aria-hidden />
        )}
        {isCorrect ? "Doğru" : "Yanlış"}
      </p>
      {explanation ? <p className="type-body text-ink">{explanation}</p> : null}
      {source || legalReference ? (
        <div className="flex flex-wrap items-center gap-2">
          <SourceTag source={source} />
          {legalReference ? (
            lawHref ? (
              <Link
                href={lawHref}
                className="inline-flex items-center gap-1 rounded-pill border border-accent/40 bg-surface px-2.5 py-1 text-[12px] font-semibold text-accent-ink hover:underline"
              >
                <Scale size={12} aria-hidden /> İlgili madde: {legalReference}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-soft">
                <Scale size={12} aria-hidden /> İlgili madde: {legalReference}
              </span>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
