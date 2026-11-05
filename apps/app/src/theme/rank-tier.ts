/**
 * Lig katmanı — 8 polis rütbesinin (Doc 24 §5, `api/coach/rank.logic`) üzerine bindirilen
 * renk/prestij skalası; web `components/leaderboard/rank-tier.ts` ile BİREBİR. Rütbe ADI polis
 * temalı kalır (Aday…Komiserlik Kapısı); lig, o rütbeyi görsel olarak "Demir→Elmas" ekseninde
 * konumlar.
 *
 * Madalya renkleri tema token'ı DEĞİLDİR (altın her iki şemada altındır; degrade koyuda da
 * doygun kalır) — bu yüzden `packages/tokens`'a girmez, burada bilinçli olarak sabit hex tutulur.
 * Üstündeki metin `ink` ile verilir; kontrast her degrade için iki şemada da ölçülmüştür.
 */
export interface RankTier {
  /** Rütbe seviyesi (1–8) — sunucunun `level`'ı ile aynı. */
  level: number;
  /** Lig adı — rütbe adından ayrı prestij etiketi. */
  league: string;
  /** Rozet/halka degrade uçları (135°). */
  grad: readonly [string, string];
  /** Degrade üstünde okunur kontrast metin rengi. */
  ink: string;
  /** Parıltı/halo rengi (hex); kullanan bileşen alpha ekler. */
  glow: string;
}

export const RANK_TIERS: readonly RankTier[] = [
  { level: 1, league: "Demir", grad: ["#64748b", "#94a3b8"], ink: "#ffffff", glow: "#94a3b8" },
  { level: 2, league: "Bronz", grad: ["#9a5b24", "#d98a44"], ink: "#ffffff", glow: "#d98a44" },
  { level: 3, league: "Gümüş", grad: ["#6b7685", "#c7d0d9"], ink: "#1a1c22", glow: "#c7d0d9" },
  { level: 4, league: "Altın", grad: ["#b7791f", "#f4c430"], ink: "#3a2c07", glow: "#f4c430" },
  { level: 5, league: "Zümrüt", grad: ["#047857", "#34d399"], ink: "#04231a", glow: "#34d399" },
  { level: 6, league: "Safir", grad: ["#1e40af", "#3b82f6"], ink: "#ffffff", glow: "#3b82f6" },
  { level: 7, league: "Ametist", grad: ["#6d28d9", "#a78bfa"], ink: "#ffffff", glow: "#a78bfa" },
  { level: 8, league: "Elmas", grad: ["#0891b2", "#67e8f9"], ink: "#052b33", glow: "#67e8f9" },
];

/** Seviyeye karşılık gelen lig (aralık dışı ve bozuk değerler kırpılır). */
export function rankTier(level: number): RankTier {
  const safe = Number.isFinite(level) ? Math.floor(level) : 1;
  const idx = Math.min(RANK_TIERS.length, Math.max(1, safe)) - 1;
  return RANK_TIERS[idx]!;
}

/** Şampiyon halosu — 1. sıranın nefes alan altın parıltısı; ligden bağımsız (web `lb-halo-pulse`). */
export const CHAMPION_HALO = "#ffd05c";

/**
 * Rütbe eşikleri — `api/coach/rank.logic` RANKS ile birebir (web `RANK_MIN_SCORES`). Sunucu
 * liderlik satırında yalnız `xp` + `level` verir; "bir üst rütbeye kaç XP" için eşik tablosu
 * istemcide de tutulur. Sunucu kataloğu değişirse üç kopya (api, web, app) birlikte güncellenir.
 */
export const RANK_MIN_SCORES: readonly number[] = [0, 150, 400, 900, 1800, 3500, 7000, 12000];

/** Bir sonraki seviyeye ilerleme yüzdesi + kalan XP. Son seviyede pct=100, toNext=0. */
export function xpProgress(xp: number, level: number): { pct: number; toNext: number; nextMin: number | null } {
  const min = RANK_MIN_SCORES[level - 1] ?? 0;
  const nextMin = RANK_MIN_SCORES[level] ?? null;
  if (nextMin == null) return { pct: 100, toNext: 0, nextMin: null };
  const span = Math.max(1, nextMin - min);
  const pct = Math.max(0, Math.min(100, Math.round(((xp - min) / span) * 100)));
  return { pct, toNext: Math.max(0, nextMin - xp), nextMin };
}

/** `#rrggbb` → `rgba(r,g,b,a)`; token ya da lig rengine saydamlık eklemek için. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
