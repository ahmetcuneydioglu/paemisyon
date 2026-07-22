import { rankTier, tierGradient, xpProgress } from "./rank-tier";

/** Rütbe + lig rozeti — polis rütbe adı + lig renk katmanı (küçük çip). */
export function RankTierBadge({
  level,
  rankName,
  showLeague = true,
  size = "md",
}: {
  level: number;
  rankName: string;
  showLeague?: boolean;
  size?: "sm" | "md";
}) {
  const tier = rankTier(level);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]";
  return (
    <span
      className={["inline-flex items-center gap-1.5 rounded-full font-heading font-bold", pad].join(
        " ",
      )}
      style={{ background: tierGradient(tier), color: tier.ink }}
      title={`${rankName} · ${tier.league} Lig`}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: tier.ink, opacity: 0.85 }}
        aria-hidden
      />
      {rankName}
      {showLeague && <span style={{ opacity: 0.8 }}>· {tier.league}</span>}
    </span>
  );
}

/**
 * Seviye ilerleme çubuğu — XP'nin bir sonraki rütbeye ne kadar yaklaştığı.
 * Dolum, mount'ta CSS ile 0'dan hedefe animasyonlanır (dönem değişince remount → tekrar oynar).
 */
export function XpProgress({ xp, level }: { xp: number; level: number }) {
  const tier = rankTier(level);
  const { pct, toNext, nextMin } = xpProgress(xp, level);
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--tk-ink) 10%, transparent)" }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="lb-xp-fill h-full rounded-full"
          style={{ width: `${pct}%`, background: tierGradient(tier) }}
        />
      </div>
      <p className="tk-caption mt-1 normal-case tracking-normal">
        {nextMin == null
          ? "En yüksek rütbe 🎖️"
          : `Bir üst rütbeye ${toNext.toLocaleString("tr-TR")} XP`}
      </p>
    </div>
  );
}
