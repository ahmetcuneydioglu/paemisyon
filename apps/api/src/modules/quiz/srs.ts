/**
 * Aralıklı tekrar (Doc 49 S1-A, `10-s1-veri-katmani.md` §1.1) — SM-2 sadeleştirilmiş,
 * SAF fonksiyon. Girdi: önceki durum (yoksa başlangıç), sonuç, bağlam; çıktı: yeni durum.
 * Zaman `now` parametresiyle gelir (test edilebilirlik; Date.now() burada yok).
 *
 * Kurallar:
 * - Doğru: reps+1; aralık reps=1→1 g, reps=2→3 g, sonra önceki×ease; üst sınır 60 g;
 *   sınava ≤30 gün kala üst sınır sınava kalan gün (en az 1). ease +0.10 (hızlıysa +0.15),
 *   tavan 3.00.
 * - Yanlış: reps=0, lapses+1; aralık 1 g (ikinci ve sonraki lapse'te 0 g = aynı gün);
 *   ease −0.20, taban 1.30.
 */
export interface ReviewState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
}

export const SRS_BASLANGIC: ReviewState = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 };
export const SRS_EASE_TABAN = 1.3;
export const SRS_EASE_TAVAN = 3.0;
export const SRS_ARALIK_TAVAN_GUN = 60;
export const SRS_SINAV_YAKINI_GUN = 30;
const GUN_MS = 86_400_000;

export interface SrsBaglam {
  now: Date;
  /** Hedef sınav tarihi (varsa) — sınava yakın aralık tavanı. */
  examDate?: Date | null;
  /** Hızlı cevap (ortalamanın altında) — küçük ease ödülü. */
  fast?: boolean;
}

export interface SrsSonuc extends ReviewState {
  dueAt: Date;
}

function yuvarla(n: number): number {
  return Math.round(n * 100) / 100;
}

export function srsGuncelle(
  onceki: ReviewState | null,
  isCorrect: boolean,
  ctx: SrsBaglam,
): SrsSonuc {
  const s = onceki ?? SRS_BASLANGIC;
  if (!isCorrect) {
    const lapses = s.lapses + 1;
    const intervalDays = lapses >= 2 ? 0 : 1;
    const ease = yuvarla(Math.max(SRS_EASE_TABAN, s.ease - 0.2));
    return {
      ease,
      intervalDays,
      reps: 0,
      lapses,
      dueAt: new Date(ctx.now.getTime() + intervalDays * GUN_MS),
    };
  }
  const reps = s.reps + 1;
  let intervalDays = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(s.intervalDays * s.ease);
  if (intervalDays < 1) intervalDays = 1;
  let tavan = SRS_ARALIK_TAVAN_GUN;
  if (ctx.examDate) {
    const kalan = Math.ceil((ctx.examDate.getTime() - ctx.now.getTime()) / GUN_MS);
    if (kalan <= SRS_SINAV_YAKINI_GUN) tavan = Math.max(1, Math.min(tavan, kalan));
  }
  intervalDays = Math.min(intervalDays, tavan);
  const ease = yuvarla(Math.min(SRS_EASE_TAVAN, s.ease + (ctx.fast ? 0.15 : 0.1)));
  return {
    ease,
    intervalDays,
    reps,
    lapses: s.lapses,
    dueAt: new Date(ctx.now.getTime() + intervalDays * GUN_MS),
  };
}

/** "Hızlı" eşiği: 20 sn altı (ortalama cevap ~35–60 sn). */
export function hizliMi(timeSpentMs: number | null | undefined): boolean {
  return timeSpentMs != null && timeSpentMs > 0 && timeSpentMs < 20_000;
}
