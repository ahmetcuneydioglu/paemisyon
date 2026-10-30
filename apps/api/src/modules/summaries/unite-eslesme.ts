/**
 * Doc 53 F5 — ünite = ETİKET (alt konu değil). Soru, konusu ve madde numarasıyla bir üniteye düşer:
 * `question.topicId = unit.topicId` ve madde numarası ünitenin kapsamında.
 *
 * Kapsam iki biçimde tanımlanır (Doc 53 PVSK, 31 Eki 2026):
 *  - AÇIK LİSTE (`articleNos` dolu): küme üyeliği. "4/A", "Ek 6", "Geçici 2" gibi sayısal olmayan
 *    numaralar burada eşleşir; "84/2" fıkrası atılıp "84" olarak aranır.
 *  - ARALIK (`articleNos` boş): `articleNo` sayısal olarak `[articleFrom, articleTo]` içinde.
 *    Sayısal olmayan madde numarası aralığa düşmez (Anayasa üniteleri).
 *
 * Saf mantık: ProgressService (seans sonu kancası) ve doldurma betiği aynı kodu kullanır.
 */

export interface UnitRange {
  id: string;
  topicId: string;
  articleFrom: string;
  articleTo: string;
  /** Açık madde listesi; doluysa aralık yerine geçer. */
  articleNos?: readonly string[];
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

/**
 * Liste eşlemesi için madde anahtarı: boşluklar sadeleşir, sayısal fıkra atılır, harf eki kalır.
 * "84/2" → "84"; " 4 / A " → "4/A"; "Ek  6" → "Ek 6"; "geçici 2" → "Geçici 2".
 */
export function articleKey(articleNo: string | null | undefined): string | null {
  if (!articleNo) return null;
  let k = articleNo
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/');
  if (!k) return null;
  const fikra = /^(\d+)\/\d+$/.exec(k);
  if (fikra) k = fikra[1]!;
  k = k
    .replace(/^ek(?=\s|\d)/i, 'Ek')
    .replace(/^geçici(?=\s|\d)/i, 'Geçici')
    .replace(/^(Ek|Geçici)(\d)/, '$1 $2');
  const harf = /^(\d+)\/([a-zçğıöşü])$/i.exec(k);
  if (harf) k = `${harf[1]}/${harf[2]!.toLocaleUpperCase('tr-TR')}`;
  return k;
}

/** Ünite bu maddeyi kapsıyor mu (liste doluysa üyelik, yoksa sayısal aralık). */
export function unitCovers(
  u: Pick<UnitRange, 'articleFrom' | 'articleTo' | 'articleNos'>,
  articleNo: string | null,
): boolean {
  if (u.articleNos && u.articleNos.length > 0) {
    const k = articleKey(articleNo);
    if (k == null) return false;
    return u.articleNos.some((n) => articleKey(n) === k);
  }
  const n = articleNumber(articleNo);
  if (n == null) return false;
  const from = Number(u.articleFrom);
  const to = Number(u.articleTo);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
  return n >= from && n <= to;
}

/** Konunun üniteleri içinde maddeyi kapsayan ilk ünite (kapsamlar örtüşmez; örtüşürse sıralı ilk kazanır). */
export function unitOfArticle(
  units: readonly UnitRange[],
  topicId: string,
  articleNo: string | null,
): UnitRange | null {
  if (!articleNo) return null;
  for (const u of units) {
    if (u.topicId !== topicId) continue;
    if (unitCovers(u, articleNo)) return u;
  }
  return null;
}

/**
 * Ünitenin madde etiketi: liste doluysa ardışık sayılar katlanır ("22–28"), kalanı sırayla
 * ("22–28, Ek 5, Ek 7, Geçici 2"); liste boşsa "from–to". Tüm yüzeyler bunu gösterir.
 */
export function articleLabel(
  u: Pick<UnitRange, 'articleFrom' | 'articleTo' | 'articleNos'>,
): string {
  const nos = u.articleNos ?? [];
  if (nos.length === 0) return `${u.articleFrom}–${u.articleTo}`;
  const parts: string[] = [];
  let runStart: number | null = null;
  let runEnd: number | null = null;
  const flush = () => {
    if (runStart == null || runEnd == null) return;
    parts.push(
      runStart === runEnd
        ? String(runStart)
        : runEnd === runStart + 1
          ? `${runStart}, ${runEnd}`
          : `${runStart}–${runEnd}`,
    );
    runStart = runEnd = null;
  };
  for (const raw of nos) {
    const n = /^\d+$/.test(raw.trim()) ? Number(raw) : null;
    if (n != null && runEnd != null && n === runEnd + 1) {
      runEnd = n;
      continue;
    }
    flush();
    if (n != null) runStart = runEnd = n;
    else parts.push(raw.trim());
  }
  flush();
  return parts.join(', ');
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
