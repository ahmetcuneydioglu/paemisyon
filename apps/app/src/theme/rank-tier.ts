import type { Scheme } from "./tokens";

/**
 * Lig katmanı — 8 polis rütbesinin üzerine bindirilen RENK skalası (Doc 24 §5; Figma PaemisyonNew
 * "Lig renkleri" 177:989). Rütbe ADI ve eşikleri SUNUCUDAN gelir (`/progress/leaderboard` →
 * `ranks`, `api/coach/rank.logic`); istemci yalnız seviye → renk eşlemesini bilir. Lig yalnız
 * renktir: avatar halkası ve rütbe metni aynı rengi kullanır, koyu şemada açık ton, açık şemada
 * koyu ton. Degrade, pil ya da hale yok — düz renk.
 *
 * Madalya renkleri tema token'ı DEĞİLDİR (altın her iki şemada altındır) — bu yüzden
 * `packages/tokens`'a girmez, burada bilinçli olarak sabit hex tutulur. Koyu tonlar web
 * `components/leaderboard/rank-tier.ts` degradesinin açık ucuyla aynıdır. Açık şema tonları
 * webden KOYUDUR: webde bu renk pil zeminidir (yazı `ink`), burada 12 pt METİN rengidir —
 * her biri beyaz kartta ve "sen" satırının accentSoft zemininde (#F6E9D2) ≥ 4,5:1 (WCAG AA;
 * 10 Kas 2026 ölçümü, eski Altın #B7791F ve Elmas #0891B2 beyazda 3,6:1'de kalıyordu).
 */
export interface RankTier {
  /** Rütbe seviyesi (1–8) — sunucunun `level`'ı ile aynı. */
  level: number;
  /** Lig adı — rütbe adından ayrı prestij etiketi ("Altın"). */
  league: string;
  /** Koyu şemada halka ve metin rengi (açık ton). */
  dark: string;
  /** Açık şemada halka ve metin rengi (koyu ton — beyaz yüzeyde okunur). */
  light: string;
}

export const RANK_TIERS: readonly RankTier[] = [
  { level: 1, league: "Demir", dark: "#94A3B8", light: "#5A697E" },
  { level: 2, league: "Bronz", dark: "#D98A44", light: "#8B4E1C" },
  { level: 3, league: "Gümüş", dark: "#C7D0D9", light: "#606977" },
  { level: 4, league: "Altın", dark: "#F4C430", light: "#866300" },
  { level: 5, league: "Zümrüt", dark: "#34D399", light: "#04704F" },
  { level: 6, league: "Safir", dark: "#3B82F6", light: "#1E40AF" },
  { level: 7, league: "Ametist", dark: "#A78BFA", light: "#6D28D9" },
  { level: 8, league: "Elmas", dark: "#67E8F9", light: "#06718B" },
];

/** Seviyeye karşılık gelen lig (aralık dışı ve bozuk değerler kırpılır). */
export function rankTier(level: number): RankTier {
  const safe = Number.isFinite(level) ? Math.floor(level) : 1;
  const idx = Math.min(RANK_TIERS.length, Math.max(1, safe)) - 1;
  return RANK_TIERS[idx]!;
}

/** Şemaya göre lig rengi — halka ve rütbe metni için tek kaynak. */
export function leagueColor(level: number, scheme: Scheme): string {
  const t = rankTier(level);
  return scheme === "dark" ? t.dark : t.light;
}

/** Sunucu rütbe kataloğu satırı (`/progress/leaderboard` → `ranks`). */
export interface RankCatalogEntry {
  level: number;
  name: string;
  minScore: number;
}

/**
 * Yedek eşikler — `api/coach/rank.logic` RANKS kopyası. Sunucu `ranks` vermiyorsa (eski API)
 * yalnız "bir üst rütbeye kaç XP" hesabı için kullanılır; rütbe ADI burada tutulmaz.
 */
export const FALLBACK_MIN_SCORES: readonly number[] = [0, 150, 400, 900, 1800, 3500, 7000, 12000];

export interface XpProgress {
  /** 0–100. */
  pct: number;
  /** Bir üst rütbeye kalan XP; son rütbede 0. */
  toNext: number;
  /** Bir üst rütbenin eşiği; son rütbede null. */
  nextMin: number | null;
  /** Bir üst rütbenin adı — yalnız sunucu kataloğu varsa; yoksa null. */
  nextName: string | null;
}

/** Bir sonraki rütbeye ilerleme. Katalog verilirse eşikler ve ad oradan, yoksa yedek eşiklerden. */
export function xpProgress(xp: number, level: number, ranks?: readonly RankCatalogEntry[] | null): XpProgress {
  const catalog = ranks && ranks.length > 0 ? [...ranks].sort((a, b) => a.level - b.level) : null;
  const current = catalog ? catalog.find((r) => r.level === level) : null;
  const next = catalog ? catalog.find((r) => r.level === level + 1) : null;
  const min = catalog ? (current?.minScore ?? 0) : (FALLBACK_MIN_SCORES[level - 1] ?? 0);
  const nextMin = catalog ? (next?.minScore ?? null) : (FALLBACK_MIN_SCORES[level] ?? null);
  if (nextMin == null) return { pct: 100, toNext: 0, nextMin: null, nextName: null };
  const span = Math.max(1, nextMin - min);
  const pct = Math.max(0, Math.min(100, Math.round(((xp - min) / span) * 100)));
  return { pct, toNext: Math.max(0, nextMin - xp), nextMin, nextName: next?.name ?? null };
}

/** `#rrggbb` → `rgba(r,g,b,a)`; token ya da lig rengine saydamlık eklemek için. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
