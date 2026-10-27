/**
 * Doc 53 F5 — ünite = ETİKET (alt konu değil). Soru, konusu ve madde numarasıyla bir üniteye düşer:
 * `question.topicId = unit.topicId` ve `articleNo` sayısal olarak `[articleFrom, articleTo]` içinde.
 * Sayısal olmayan madde numarası ("Ek 1", "Geçici 2") hiçbir üniteye düşmez.
 *
 * Saf mantık: ProgressService (seans sonu kancası) ve doldurma betiği aynı kodu kullanır.
 */

export interface UnitRange {
  id: string;
  topicId: string;
  articleFrom: string;
  articleTo: string;
}

export interface AnsweredQuestion {
  topicId: string;
  articleNo: string | null;
  isCorrect: boolean;
}

export interface UnitTally {
  solved: number;
  correct: number;
}

/** "84" → 84; "84/2" → 84 (fıkra atılır); "Ek 1", "Geçici 2", "4/A" → null. */
export function articleNumber(articleNo: string | null | undefined): number | null {
  if (!articleNo) return null;
  const m = /^\s*(\d+)\s*(?:\/\s*\d+\s*)?$/.exec(articleNo);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Konunun üniteleri içinde maddeyi kapsayan ilk ünite (aralıklar örtüşmez; örtüşürse sıralı ilk kazanır). */
export function unitOfArticle(
  units: readonly UnitRange[],
  topicId: string,
  articleNo: string | null,
): UnitRange | null {
  const n = articleNumber(articleNo);
  if (n == null) return null;
  for (const u of units) {
    if (u.topicId !== topicId) continue;
    const from = Number(u.articleFrom);
    const to = Number(u.articleTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    if (n >= from && n <= to) return u;
  }
  return null;
}

/** Cevapları ünitelere böler; ünitesi olmayan cevap sayılmaz. Konu ilerlemesiyle aynı sayım (boş hariç). */
export function tallyByUnit(
  answers: readonly AnsweredQuestion[],
  units: readonly UnitRange[],
): Map<string, UnitTally> {
  const out = new Map<string, UnitTally>();
  if (units.length === 0) return out;
  for (const a of answers) {
    const u = unitOfArticle(units, a.topicId, a.articleNo);
    if (!u) continue;
    const t = out.get(u.id) ?? { solved: 0, correct: 0 };
    t.solved += 1;
    if (a.isCorrect) t.correct += 1;
    out.set(u.id, t);
  }
  return out;
}
