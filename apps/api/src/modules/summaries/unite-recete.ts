import { band, type Band } from '../rooms/rooms.logic';
import { ZAYIF_MIN_COZULEN, zayifMi } from '../../common/zayif-konu';

/**
 * Doc 53 F5-2 — ünite hâkimiyeti ve koç reçetesi, SAF mantık. Kural sunucuda (koç kuralı):
 *  - Hâkimiyet bandı konu bandıyla aynı eşikten (`common/zayif-konu.ts`, `rooms.logic.band`).
 *  - Reçete yalnız zayıf konuda: o konunun üniteleri içinde zayıf olanlardan doğruluğu en düşük;
 *    hiçbiri eşiği geçmiyorsa (az veri) en az çözülmüş ünite. Özeti bitirilmiş ünite için özet
 *    reçetesi bir daha çıkmaz (karar 26 Eki): reçete doğrudan soruya gider.
 *  - Reçete günde en çok bir kez: seçim deterministiktir (aynı veri → aynı ünite), istemci
 *    kartı gün içinde tekrar üretmez.
 */

export interface UnitMasteryRow {
  solved: number;
  correct: number;
  /** 0..1; çözüm yoksa null. */
  accuracy: number | null;
  band: Band;
  /** İstemciye yüzde yeter; ham oran dışarı çıkmaz. */
  accuracyPct: number | null;
}

export function unitMastery(solved: number, correct: number): UnitMasteryRow {
  const accuracy = solved > 0 ? correct / solved : null;
  return { solved, correct, accuracy, band: band(solved, accuracy), accuracyPct: accuracy == null ? null : Math.round(accuracy * 100) };
}

export interface UnitForRecipe {
  slug: string;
  title: string;
  topicId: string;
  isPremium: boolean;
  articleNos: string[];
  mastery: UnitMasteryRow;
  /** Kullanıcı özeti bitirdiyse dolu. */
  completedAt: Date | string | null;
}

export type RecipeKind = 'summary_then_questions' | 'questions';

export interface UnitRecipe {
  unit: { slug: string; title: string; topicId: string; isPremium: boolean; accuracyPct: number | null; solved: number; band: Band };
  kind: RecipeKind;
  /** Seans parametreleri — istemci URL'yi kendi kurar (web /seans?…, mobil /seans params). */
  session: { topicId: string; articleNos: string[]; count: number };
}

/** Zayıf konunun üniteleri arasından reçete; konu zayıf değilse çağrılmaz. Ünite yoksa null. */
export function pickUnitRecipe(units: readonly UnitForRecipe[]): UnitRecipe | null {
  if (units.length === 0) return null;
  const zayif = units
    .filter((u) => zayifMi(u.mastery.solved, u.mastery.accuracy ?? 0))
    .sort((a, b) => (a.mastery.accuracy ?? 0) - (b.mastery.accuracy ?? 0) || b.mastery.solved - a.mastery.solved);
  let secilen = zayif[0];
  if (!secilen) {
    // Az veri: hiçbir ünite eşiği geçmiyor → en az çözülmüş (hiç çözülmemiş önce), sonra sıra.
    secilen = [...units].sort((a, b) => a.mastery.solved - b.mastery.solved)[0];
  }
  if (!secilen) return null;
  const kind: RecipeKind = secilen.completedAt ? 'questions' : 'summary_then_questions';
  return {
    unit: {
      slug: secilen.slug,
      title: secilen.title,
      topicId: secilen.topicId,
      isPremium: secilen.isPremium,
      accuracyPct: secilen.mastery.accuracyPct,
      solved: secilen.mastery.solved,
      band: secilen.mastery.band,
    },
    kind,
    session: { topicId: secilen.topicId, articleNos: secilen.articleNos, count: 10 },
  };
}

/** "Yasama I — Meclis…" → "Yasama I". */
export const shortUnitTitle = (title: string): string => title.split(' — ')[0]!;

export { ZAYIF_MIN_COZULEN };
