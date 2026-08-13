import { useId } from "react";

/**
 * Nişangâh P marka işareti (Faz 2 varyant A — kaynak: /brand/app-icon-master.svg).
 * Navy gradyan karo + beyaz P + amber merkez; app icon ile birebir aynı vektör.
 * Gradyan id'leri useId ile üretilir — aynı sayfada birden çok örnek çakışmaz.
 */
export function BrandGlyph({ className }: { className?: string }) {
  const uid = useId();
  const bg = `bg-${uid}`;
  const glow = `glow-${uid}`;
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#27548F" />
          <stop offset="0.55" stopColor="#1B3A6B" />
          <stop offset="1" stopColor="#122A52" />
        </linearGradient>
        <radialGradient id={glow} cx="0.58" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#3E6FB5" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#3E6FB5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="21" fill={`url(#${bg})`} />
      <rect width="96" height="96" rx="21" fill={`url(#${glow})`} />
      <rect x="28.6" y="21.5" width="11.2" height="53" rx="5.6" fill="#fff" />
      <circle cx="56.4" cy="40.2" r="15.2" fill="none" stroke="#fff" strokeWidth="11.2" />
      <circle cx="56.4" cy="40.2" r="5.7" fill="#F3A93C" />
    </svg>
  );
}

/**
 * Glif + "paemisyon" yazısı. Yazı rengi token'dan gelir (text-brand) —
 * koyu temada otomatik açılır; glif her iki temada aynı (kendi zemini var).
 */
export function BrandMark({
  glyphClassName = "size-7",
  textClassName = "text-[17px]",
  className = "",
}: {
  glyphClassName?: string;
  textClassName?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandGlyph className={`shrink-0 ${glyphClassName}`} />
      <span
        className={`font-heading font-bold lowercase tracking-tight text-brand ${textClassName}`}
      >
        paemisyon
      </span>
    </span>
  );
}
