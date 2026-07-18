/**
 * Kaynak etiketi — soru nerede görünürse görünsün kaynağı gösterir (Doc 26 #7).
 * Bankanın varlık nedeni "gerçek, kaynaklı çıkmış soru" güvenidir; bu etiket
 * hiçbir görünümden çıkarılamaz.
 */
export function SourceTag({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <span className="tk-caption inline-flex items-center gap-1 rounded-full border border-line bg-surface-alt px-2 py-0.5">
      <span aria-hidden>📌</span>
      {source}
    </span>
  );
}
