/** Koç cümlesi: sol altın çizgi + tek cümle (Doc 49/14). Cümle yoksa hiç çizilmez. */
export function CoachLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="type-body-sm flex gap-3 text-ink-soft">
      <span
        aria-hidden
        className="w-0.5 shrink-0 self-stretch bg-accent"
      />
      <span>{text}</span>
    </p>
  );
}
