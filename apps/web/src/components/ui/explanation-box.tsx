import { SourceTag } from "./source-tag";

/**
 * Açıklama kutusu (Doc 26 #6): açıklama + kaynak etiketi + madde köprüsü.
 * Yanlış → kavrayış döngüsünün (Doc 25 akış C) seans içindeki durağı.
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
  /** "PVSK m.16" gibi atıf metni. */
  legalReference: string | null;
  /** Atfın Madde Atlası'ndaki sayfası (varsa köprü olur). */
  lawHref?: string | null;
}) {
  return (
    <div
      className={[
        "rounded-md border p-4",
        isCorrect ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5",
      ].join(" ")}
      role="status"
    >
      <p className={["font-heading text-[15px] font-bold", isCorrect ? "text-success" : "text-danger"].join(" ")}>
        {isCorrect ? "✓ Doğru" : "✗ Yanlış"}
      </p>
      {explanation && <p className="mt-2 text-[15px] leading-relaxed text-ink">{explanation}</p>}
      {(source || legalReference) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SourceTag source={source} />
          {legalReference &&
            (lawHref ? (
              <a
                href={lawHref}
                className="tk-caption rounded-full border border-atlas/40 bg-atlas/10 px-2 py-0.5 text-atlas hover:underline"
              >
                İlgili madde: {legalReference}
              </a>
            ) : (
              <span className="tk-caption rounded-full border border-line px-2 py-0.5">
                İlgili madde: {legalReference}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
