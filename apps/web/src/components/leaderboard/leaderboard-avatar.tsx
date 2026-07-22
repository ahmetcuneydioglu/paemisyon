import { rankTier, tierGradient } from "./rank-tier";

/** İsimden baş harf(ler) — avatar yoksa fallback (Türkçe büyük harf). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toLocaleUpperCase("tr-TR");
}

const SIZES = {
  sm: { box: 36, ring: 2, text: "text-[13px]" },
  md: { box: 48, ring: 2, text: "text-base" },
  lg: { box: 72, ring: 3, text: "text-xl" },
  xl: { box: 104, ring: 4, text: "text-3xl" },
} as const;

/**
 * Liderlik avatarı — lig rengiyle çerçevelenmiş dairesel avatar. Görsel yoksa
 * baş harfli, lig degradeli bir zemin gösterir. Tek ekrana özel değil: podyum,
 * tablo satırı ve "senin sıran" kartında aynı bileşen kullanılır.
 */
export function LeaderboardAvatar({
  name,
  avatarUrl,
  level,
  size = "md",
}: {
  name: string;
  avatarUrl: string | null;
  level: number;
  size?: keyof typeof SIZES;
}) {
  const tier = rankTier(level);
  const s = SIZES[size];
  const grad = tierGradient(tier);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: s.box, height: s.box, padding: s.ring, background: grad }}
      aria-hidden
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          width={s.box - s.ring * 2}
          height={s.box - s.ring * 2}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className={[
            "flex h-full w-full items-center justify-center rounded-full font-heading font-bold",
            s.text,
          ].join(" ")}
          style={{ background: grad, color: tier.ink }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
