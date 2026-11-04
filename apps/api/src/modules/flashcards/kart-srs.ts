/**
 * Bilgi kartı puanı → aralıklı tekrar güncellemesi (Doc 56 §6). Motor YENİ DEĞİL: soru
 * tekrarıyla aynı `srsGuncelle` (quiz/srs.ts, SM-2 sadeleştirilmiş) kullanılır; sınava yakın
 * aralık tavanı ve hedef sınav tarihi oradan gelir. Burada yalnız üç puanın ikili sonuca ve
 * "hızlı" ödülüne eşlemesi vardır. SAF fonksiyon; spec'li.
 *
 *   again → yanlış (reps=0, lapses+1, 1 g / aynı gün, ease −0.20)
 *   known → doğru (1 g → 3 g → ×ease; ease +0.10)
 *   easy  → doğru + hızlı (ease +0.15) — istemci ilk sürümde göndermez (karar 4), sözleşme açık.
 */
import { srsGuncelle, type ReviewState, type SrsSonuc } from '../quiz/srs';

export type KartPuani = 'again' | 'known' | 'easy';

export interface KartSrsBaglam {
  now: Date;
  examDate?: Date | null;
}

export function kartSrsGuncelle(
  onceki: ReviewState | null,
  puan: KartPuani,
  ctx: KartSrsBaglam,
): SrsSonuc {
  return srsGuncelle(onceki, puan !== 'again', {
    now: ctx.now,
    examDate: ctx.examDate ?? null,
    fast: puan === 'easy',
  });
}
