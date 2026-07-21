/**
 * Plan sabitleri — TEK KAYNAK.
 *
 * Ücretsiz günlük soru limitinin doğruluk kaynağı `plans` tablosudur
 * (key='free', daily_question_limit). Buradaki değer yalnız o satır
 * okunamazsa devreye giren emniyet ağıdır; üç ayrı yerde farklı sayı
 * kalmasın diye tek yerde toplanmıştır (quiz limiti, /me, public fiyat).
 *
 * Limiti değiştirmek için: `npx ts-node scripts/set-free-daily-limit.ts 30`
 * (fallback'i de aynı sayıya çek ki plan satırı kaybolursa davranış sapmasın).
 */
export const FREE_DAILY_LIMIT_FALLBACK = 30;

/** Satılabilir premium planın anahtarı (3 aylık, manuel ödeme). */
export const PREMIUM_PLAN_KEY = 'quarterly';

/** Manuel premium süresi — 3 aylık abonelik karşılığı gün sayısı. */
export const PREMIUM_GRANT_DAYS = 90;
