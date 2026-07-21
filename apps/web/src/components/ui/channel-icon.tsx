/**
 * Kanal marka ikonları — tek renk (currentColor), token'lı boyut, dış istek yok.
 * `aria-hidden`: etiket her zaman metinden gelir (ekran okuyucu ikonu okumaz).
 */
export type ChannelKey = "telegram" | "instagram" | "email";

const PATHS: Record<ChannelKey, React.ReactNode> = {
  telegram: (
    <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8L18.3 6c.4-.3-.1-.5-.6-.2L6.9 12.7 2.2 11.2c-1-.3-1-1 .2-1.5L20.6 2.6c.8-.3 1.5.2 1.3 1.7Z" />
  ),
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" strokeWidth="1.9" stroke="currentColor" />
      <circle cx="12" cy="12" r="4.2" fill="none" strokeWidth="1.9" stroke="currentColor" />
      <circle cx="17.4" cy="6.6" r="1.3" />
    </>
  ),
  email: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="none" strokeWidth="1.9" stroke="currentColor" />
      <path d="m3.5 6.5 8.5 6 8.5-6" fill="none" strokeWidth="1.9" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
};

export function ChannelIcon({ channel, size = 20 }: { channel: ChannelKey; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      focusable="false"
      className="shrink-0"
    >
      {PATHS[channel]}
    </svg>
  );
}
