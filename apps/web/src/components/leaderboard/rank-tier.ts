/**
 * Lig katmanı — mevcut 8 polis rütbesinin (Doc 24 §5) üzerine bindirilen renk/prestij
 * skalası. Rütbe ADI polis temalı kalır (Aday…Komiserlik Kapısı); lig, o rütbeyi görsel
 * olarak "Demir→Elmas" ekseninde konumlar. Madalya renkleri tema token'ı değildir
 * (altın her temada altındır) → burada bilinçli olarak sabit hex tutulur.
 */
export interface RankTier {
  level: number;
  /** Lig adı — rütbe adından ayrı prestij etiketi. */
  league: string;
  /** Rozet/halka degrade uçları. */
  grad: [string, string];
  /** Kontrast metin rengi (degrade üstünde okunur). */
  ink: string;
  /** Parıltı/halo rengi (rgba). */
  glow: string;
}

const TIERS: RankTier[] = [
  { level: 1, league: "Demir", grad: ["#64748b", "#94a3b8"], ink: "#ffffff", glow: "148,163,184" },
  { level: 2, league: "Bronz", grad: ["#9a5b24", "#d98a44"], ink: "#ffffff", glow: "217,138,68" },
  { level: 3, league: "Gümüş", grad: ["#6b7685", "#c7d0d9"], ink: "#1a1c22", glow: "199,208,217" },
  { level: 4, league: "Altın", grad: ["#b7791f", "#f4c430"], ink: "#3a2c07", glow: "244,196,48" },
  { level: 5, league: "Zümrüt", grad: ["#047857", "#34d399"], ink: "#04231a", glow: "52,211,153" },
  { level: 6, league: "Safir", grad: ["#1e40af", "#3b82f6"], ink: "#ffffff", glow: "59,130,246" },
  { level: 7, league: "Ametist", grad: ["#6d28d9", "#a78bfa"], ink: "#ffffff", glow: "167,139,250" },
  { level: 8, league: "Elmas", grad: ["#0891b2", "#67e8f9"], ink: "#052b33", glow: "103,232,249" },
];

/** Seviyeye karşılık gelen lig (aralık dışı değerler kırpılır). */
export function rankTier(level: number): RankTier {
  const idx = Math.min(TIERS.length, Math.max(1, level)) - 1;
  return TIERS[idx];
}

/** CSS linear-gradient — rozet/halka zeminleri için. */
export function tierGradient(tier: RankTier): string {
  return `linear-gradient(135deg, ${tier.grad[0]}, ${tier.grad[1]})`;
}

/** Rütbe eşikleri — api/coach/rank.logic RANKS ile birebir (Seviye ilerleme çubuğu). */
export const RANK_MIN_SCORES = [0, 150, 400, 900, 1800, 3500, 7000, 12000];

/** Bir sonraki seviyeye ilerleme yüzdesi + kalan XP. Son seviyede pct=100, toNext=0. */
export function xpProgress(
  xp: number,
  level: number,
): { pct: number; toNext: number; nextMin: number | null } {
  const min = RANK_MIN_SCORES[level - 1] ?? 0;
  const nextMin = RANK_MIN_SCORES[level] ?? null;
  if (nextMin == null) return { pct: 100, toNext: 0, nextMin: null };
  const span = Math.max(1, nextMin - min);
  const pct = Math.max(0, Math.min(100, Math.round(((xp - min) / span) * 100)));
  return { pct, toNext: Math.max(0, nextMin - xp), nextMin };
}

