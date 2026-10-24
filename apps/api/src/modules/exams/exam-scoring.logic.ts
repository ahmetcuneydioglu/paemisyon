/**
 * Deneme puanlama ve sıralama — SAF mantık (Doc 50 §2.3–2.4).
 *
 * Tek puanlama noktası: hem teslimde (quiz.completeSession) hem soru iptali
 * sonrası yeniden puanlamada (admin adjustments) aynı fonksiyon çalışır;
 * böylece sonuç ekranı, sıralama ve panel istatistiği birbirinden ayrışmaz.
 *
 * Net = (doğru + herkese-doğru) − yanlış/4 (Doc 18 karar 3). Boş etkilemez.
 * Değişmez: correct + wrong + blank + creditAll + excluded = total.
 */

export type AdjustmentAction = 'credit_all' | 'exclude';

export interface AttemptAnswer {
  questionId: string;
  questionVersionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

export interface ScoreInput {
  /** Oturumun soru sayısı (ExamQuestion satırı ya da questionOrder uzunluğu). */
  total: number;
  /** Oturumun sabit soru seti: sürüm id → soru id. Boşsa (eski oturum) cevaplar aynen sayılır. */
  questionIdByVersion?: Map<string, string> | null;
  answers: AttemptAnswer[];
  /** Soru id → iptal eylemi (geri alınmamış). */
  adjustments?: Map<string, AdjustmentAction> | null;
}

export interface ScoreResult {
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  /** Herkese doğru sayılan (iptal) soru sayısı — net'e doğru olarak girer. */
  creditAll: number;
  /** Hesaptan çıkarılan soru sayısı — toplamdan düşer. */
  excluded: number;
  /** Puanlanan soru sayısı (total − excluded). */
  scoredTotal: number;
  /** Net: 2 ondalık. */
  score: number;
}

export function scoreAttempt(input: ScoreInput): ScoreResult {
  const adj = input.adjustments ?? new Map<string, AdjustmentAction>();
  const inSet = input.questionIdByVersion;
  // Yalnız oturumun soru setindeki cevaplar sayılır (savunma derinliği — Doc 18).
  const valid =
    inSet && inSet.size > 0
      ? input.answers.filter((a) => inSet.has(a.questionVersionId))
      : input.answers;
  const answerOf = new Map(valid.map((a) => [a.questionId, a]));

  // İptal sayıları soru setinden; set bilinmiyorsa (eski oturum) cevaplardan.
  const questionIds = inSet && inSet.size > 0 ? [...new Set(inSet.values())] : [...answerOf.keys()];
  let creditAll = 0;
  let excluded = 0;
  for (const qid of questionIds) {
    const a = adj.get(qid);
    if (a === 'credit_all') creditAll++;
    else if (a === 'exclude') excluded++;
  }

  let correct = 0;
  let wrong = 0;
  for (const [qid, a] of answerOf) {
    if (adj.has(qid)) continue; // iptal edilen soru normal sayıma girmez
    if (a.isCorrect === true) correct++;
    else if (a.selectedOptionId != null) wrong++;
  }
  // Tavanlar: kirli veri toplamı aşamaz.
  const scoredTotal = Math.max(0, input.total - excluded);
  correct = Math.min(correct, Math.max(0, scoredTotal - creditAll));
  wrong = Math.min(wrong, Math.max(0, scoredTotal - creditAll - correct));
  const blank = Math.max(0, scoredTotal - creditAll - correct - wrong);
  const score = Math.round((correct + creditAll - wrong / 4) * 100) / 100;
  return { total: input.total, correct, wrong, blank, creditAll, excluded, scoredTotal, score };
}

export interface RankInput {
  key: string;
  score: number;
  wrongCount: number;
  durationSeconds: number;
  submittedAt: Date;
}

export interface RankedRow<T extends RankInput = RankInput> {
  rank: number;
  row: T;
}

/**
 * Eşitlik kuralı (24 Eki 2026): net ↓, az yanlış, kısa süre, erken teslim.
 * Dördü de eşitse sıra ORTAK (1, 2, 2, 4) — sonraki sıra atlar.
 */
export function rankWithTies<T extends RankInput>(rows: T[]): RankedRow<T>[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.score - a.score ||
      a.wrongCount - b.wrongCount ||
      a.durationSeconds - b.durationSeconds ||
      a.submittedAt.getTime() - b.submittedAt.getTime(),
  );
  const out: RankedRow<T>[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;
    const same =
      prev != null &&
      prev.score === cur.score &&
      prev.wrongCount === cur.wrongCount &&
      prev.durationSeconds === cur.durationSeconds &&
      prev.submittedAt.getTime() === cur.submittedAt.getTime();
    out.push({ rank: same ? out[i - 1].rank : i + 1, row: cur });
  }
  return out;
}

/** Sıralama görünürlüğü için en az resmî çözüm sayısı (jsps ile aynı). */
export const RANKING_MIN_SAMPLE = 10;

/** Yüzdelik dilim: "ilk %20" — rank / total, 5'e yuvarlanmış tavan. */
export function percentileBand(rank: number, total: number): number {
  if (total <= 0 || rank <= 0) return 100;
  const pct = (rank / total) * 100;
  return Math.max(1, Math.min(100, Math.ceil(pct / 5) * 5));
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 100) / 100;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

/** Sıralamada görünen ad: "Ahmet Can Demir" → "Ahmet C." (24 Eki kararı: isimli, kısaltılmış). */
export function rankingName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Aday';
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0].toLocaleUpperCase('tr-TR')}.`;
}
