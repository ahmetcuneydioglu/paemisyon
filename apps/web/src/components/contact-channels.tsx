import { PURCHASE_CHANNELS, type ContactChannel } from "@/lib/contact";
import { ChannelIcon, type ChannelKey } from "@/components/ui/channel-icon";

type Variant = "buttons" | "inline";

/**
 * İletişim kanalı bağlantıları (Telegram/Instagram) — premium satın alma,
 * destek ve footer aynı bileşeni kullanır. Tek ekrana özel değil: `variant` ile
 * ya birincil CTA butonu ya da footer'daki sade satır olur.
 *
 * a11y: dokunma hedefi ≥44px, `rel="noreferrer"` ile dış bağlantı güvenliği,
 * ikon `aria-hidden` (etiket metinden okunur).
 */
export function ContactChannels({
  channels = PURCHASE_CHANNELS,
  variant = "buttons",
  className,
}: {
  channels?: ContactChannel[];
  variant?: Variant;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}>
        {channels.map((c) => (
          <a
            key={c.key}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="tk-interactive inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 text-[13px] text-ink-soft hover:border-ink-soft hover:text-ink"
          >
            <ChannelIcon channel={c.key as ChannelKey} size={16} />
            {/* Kanal adı METİNDE olmalı: ikon aria-hidden ve iki kanalın kullanıcı
                adı aynı ("@paemvemisyon") olduğu için, yalnız handle basılırsa iki
                bağlantı ekran okuyucuda ayırt edilemez (WCAG 2.4.4). */}
            <span>
              <span className="sr-only">{c.label}: </span>
              {c.handle}
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={["flex flex-col gap-2 sm:flex-row sm:justify-center", className].filter(Boolean).join(" ")}>
      {channels.map((c, i) => (
        <a
          key={c.key}
          href={c.href}
          target="_blank"
          rel="noreferrer"
          className={[
            "tk-interactive inline-flex h-12 items-center justify-center gap-2 rounded-sm px-6",
            "font-heading text-[15px] font-bold active:scale-[0.99]",
            i === 0
              ? "bg-brand text-surface hover:opacity-90"
              : "border border-line bg-surface text-ink hover:border-ink-soft",
          ].join(" ")}
        >
          <ChannelIcon channel={c.key as ChannelKey} />
          <span>
            {c.label}
            <span className="ml-1.5 font-body text-[13px] font-normal opacity-80">{c.handle}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
