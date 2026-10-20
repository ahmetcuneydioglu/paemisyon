import {
  AZ_VERI_ESIGI,
  GUCLU_DOGRULUK_ESIGI,
  ZAYIF_MIN_COZULEN,
  zayifMi,
} from '../../common/zayif-konu';

/**
 * Ders/konu odası saf mantığı (Doc 49/14). Yüzde tonu ve koç cümlesi SUNUCUDA üretilir;
 * istemci eşik bilmez. Eşikler `common/zayif-konu.ts` ile aynı tek kaynaktan.
 */

/** `new`: hiç çözülmemiş · `sparse`: az veri · `weak` · `normal` · `strong`. */
export type Band = 'new' | 'sparse' | 'weak' | 'normal' | 'strong';

export function band(solved: number, accuracy: number | null): Band {
  if (solved === 0 || accuracy == null) return 'new';
  if (solved < AZ_VERI_ESIGI) return 'sparse';
  if (zayifMi(solved, accuracy)) return 'weak';
  if (accuracy >= GUCLU_DOGRULUK_ESIGI) return 'strong';
  return 'normal';
}

export interface KonuSatiri {
  topicId: string;
  name: string;
  solved: number;
  correct: number;
  /** 0..1; çözüm yoksa null. */
  accuracy: number | null;
}

/** En zayıf konu: en az ZAYIF_MIN_COZULEN çözülmüş konular içinde en düşük doğruluk. */
export function enZayif<T extends KonuSatiri>(rows: readonly T[]): T | null {
  const aday = rows.filter((r) => r.solved >= ZAYIF_MIN_COZULEN && r.accuracy != null);
  if (!aday.length) return null;
  return [...aday].sort((a, b) => a.accuracy! - b.accuracy! || b.solved - a.solved)[0];
}

export const yuzde = (x: number | null) => (x == null ? null : Math.round(x * 100));

/** Ders odası koç satırı — tek cümle, veri yoksa null (uydurma yok). */
export function dersKocCumlesi(input: {
  solved: number;
  weakest: KonuSatiri | null;
  weakestInPlan: boolean;
}): string | null {
  if (input.solved === 0) return 'Bu derste ilk turun seni bekliyor — 10 soru yeter.';
  const w = input.weakest;
  if (!w || w.accuracy == null || band(w.solved, w.accuracy) !== 'weak') return null;
  const kuyruk = input.weakestInPlan ? 'bu hafta planında.' : 'kısa bir tur iyi gelir.';
  return `Koç önerisi: ${w.name} — ${w.solved} sorunun ${w.correct}'${ek(w.correct)} doğru, ${kuyruk}`;
}

/** Konu odası koç cümlesi: son 5 cevaba bakar; yoksa toplam duruma. */
export function konuKocCumlesi(input: {
  solved: number;
  accuracy: number | null;
  son5Dogru: number | null;
  son5Toplam: number;
  inPlan: boolean;
}): string | null {
  if (input.solved === 0) return 'Bu konuyu henüz hiç çözmedin; 10 soruyla başla.';
  if (input.son5Toplam >= 3 && input.son5Dogru != null) {
    const d = input.son5Dogru;
    if (d / input.son5Toplam < 0.5)
      return `Son ${input.son5Toplam} cevabın ${d}'${ek(d)} doğru; kısa bir turla toparla.`;
    if (d === input.son5Toplam)
      return `Son ${input.son5Toplam} cevabın hepsi doğru — bir sonraki konuya geçebilirsin.`;
  }
  const b = band(input.solved, input.accuracy);
  if (b === 'weak')
    return input.inPlan
      ? 'Zayıf konun; bu hafta planında yer alıyor.'
      : 'Zayıf konun; haftalık plana almaya değer.';
  if (b === 'strong') return 'Güçlü konun; arada bir tekrar yeter.';
  if (b === 'sparse') return 'Az veri var; birkaç tur daha ölçümü netleştirir.';
  return null;
}

/** Türkçe sayı eki: 4'ü, 2'si, 3'ü, 7'si, 10'u … (yalnız iyelik, sade kural). */
function ek(n: number): string {
  const son = n % 10;
  const onlar = n % 100;
  if (n === 0) return 'ı';
  if (onlar === 10 || onlar === 30 || onlar === 40 || onlar === 60 || onlar === 90 || son === 0)
    return n % 100 === 0 ? 'ü' : 'u';
  if (son === 1 || son === 5 || son === 8) return 'i';
  if (son === 2 || son === 7) return 'si';
  if (son === 3 || son === 4) return 'ü';
  if (son === 6) return 'sı';
  return 'u';
}

/** Madde aralığı etiketi: "md. 104–118" ya da tek madde; madde yoksa null. */
export function maddeAraligi(nos: readonly string[]): string | null {
  const sayilar = nos.map((n) => Number.parseInt(n, 10)).filter((n) => Number.isFinite(n));
  if (!sayilar.length) return null;
  const min = Math.min(...sayilar);
  const max = Math.max(...sayilar);
  return min === max ? `md. ${min}` : `md. ${min}–${max}`;
}
