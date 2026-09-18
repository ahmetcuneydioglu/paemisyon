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

/**
 * Kişisel deneme hakkı — ücretsiz plan (Doc 46, 18 Eyl 2026).
 *
 * Doğruluk kaynağı yine `plans` tablosudur (key='free',
 * personal_exam_daily_limit); buradaki değer o satır okunamazsa devreye giren
 * emniyet ağıdır. Premium'da limit yoktur (null = sınırsız).
 */
export const PERSONAL_EXAM_FREE_DAILY_FALLBACK = 1;

/**
 * Ücretsiz planda bir kişisel denemenin soru tavanı. İstemcide 50/100
 * seçenekleri zaten kilitli görünür; bu, sunucudaki emniyet kilidi — dağıtılmış
 * eski istemciler 100 gönderdiğinde hata yerine KIRPILIR (onları bozmamak için).
 */
export const PERSONAL_EXAM_FREE_MAX_QUESTIONS = 25;

/**
 * Bir kişisel denemenin mutlak soru tavanı (premium). Gerçek format 100 soru;
 * 120 pay bırakır. DTO doğrulaması da bu sabiti kullanır — tek kaynak.
 */
export const PERSONAL_EXAM_MAX_QUESTIONS = 120;
