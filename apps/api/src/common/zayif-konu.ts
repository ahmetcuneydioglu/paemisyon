/**
 * Zayıf konu — TEK tanım (Doc 48 A3, 14 Eki 2026).
 *
 * Önceden iki ayrı eşik vardı: koç kartı "≥10 çözülmüş ve < %50", koç turu
 * karışımı "≥5 çözülmüş ve < %60". Kart "Anayasa'da zorlanıyorsun" derken tur
 * başka konulara ağırlık verebiliyordu. Artık koç kartı, anasayfa hazırlık
 * bloğu, görev kartının gerekçe satırı ve koç turu karışımı aynı tanımı okur.
 */

/** Bir konunun "zayıf" sayılabilmesi için gereken en az çözülmüş soru. */
export const ZAYIF_MIN_COZULEN = 10;

/** Bu doğruluk oranının altı zayıftır (0..1). */
export const ZAYIF_DOGRULUK_ESIGI = 0.6;

/** Ders bazında bu kadar sorudan azı "az veri" sayılır (yorum yapılmaz). */
export const AZ_VERI_ESIGI = 10;

export function zayifMi(solved: number, accuracy: number): boolean {
  return solved >= ZAYIF_MIN_COZULEN && accuracy < ZAYIF_DOGRULUK_ESIGI;
}

/** Zayıf olanlardan en düşük doğruluklu `limit` tanesi; eşitlikte daha çok çözülen önce. */
export function enZayifKonular<T extends { solved: number; accuracy: number }>(
  rows: readonly T[],
  limit: number,
): T[] {
  return rows
    .filter((r) => zayifMi(r.solved, r.accuracy))
    .sort((a, b) => a.accuracy - b.accuracy || b.solved - a.solved)
    .slice(0, limit);
}

/** Güçlü konu: dönüş turunun (Doc 24 §7.1) kaynağı — en az bu kadar çözülmüş. */
export const GUCLU_MIN_COZULEN = 10;

/** Bu doğruluk oranı ve üstü güçlüdür (0..1). */
export const GUCLU_DOGRULUK_ESIGI = 0.7;

/** Güçlü olanlardan en yüksek doğruluklu `limit` tanesi; eşitlikte daha çok çözülen önce. */
export function enGucluKonular<T extends { solved: number; accuracy: number }>(
  rows: readonly T[],
  limit: number,
): T[] {
  return rows
    .filter((r) => r.solved >= GUCLU_MIN_COZULEN && r.accuracy >= GUCLU_DOGRULUK_ESIGI)
    .sort((a, b) => b.accuracy - a.accuracy || b.solved - a.solved)
    .slice(0, limit);
}
