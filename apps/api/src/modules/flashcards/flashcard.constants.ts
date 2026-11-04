/**
 * Bilgi kartları sabitleri (Doc 56) — TEK KAYNAK. İstemci bu eşikleri bilmez; yalnız sonucu
 * (durum, sayı, kilit) görür.
 */

/** "Öğrenildi" eşiği: tek doğru cevap yetmez (Doc 56 §6.2). */
export const OGRENILDI_MIN_REPS = 3;
export const OGRENILDI_MIN_ARALIK_GUN = 7;

/** "Zorlandıklarım": bu kadar unutma ya da son puanı "Tekrar". */
export const ZOR_MIN_LAPSES = 2;

/** Oturum porsiyonu: varsayılan ve tavan. */
export const OTURUM_VARSAYILAN_KART = 20;
export const OTURUM_EN_COK_KART = 50;

/** Oturum içinde "Tekrar" denen kart kuyruğun sonuna döner; bir kart turda en çok bu kadar görünür. */
export const OTURUM_ICI_TEKRAR_EN_COK = 2;

/** "Kaldığın yer": son etkinlikten bu kadar süre geçmemiş yarım oturum sürdürülür. */
export const TAZE_OTURUM_MS = 24 * 3_600_000;

/** Geri alma penceresi: yalnız kartın son olayı ve bu süre içinde. */
export const GERI_AL_PENCERESI_MS = 10 * 60_000;

/** Kullanıcı ayarı sınırları. */
export const GUNLUK_KART_HEDEFI_MIN = 5;
export const GUNLUK_KART_HEDEFI_MAX = 200;

export const FLASHCARD_MODES = ['due', 'new', 'hard', 'favorites', 'all', 'mixed'] as const;
export type FlashcardMode = (typeof FLASHCARD_MODES)[number];

export const FLASHCARD_SOURCES = [
  'course_room',
  'topic_room',
  'study_hub',
  'home_next',
  'home_route',
  'home_for_you',
  'notif',
  'summary',
] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];
