/**
 * Ders ikonları — izinli anahtarların TEK kaynağı (Doc 48 Faz 6, 14 Eki 2026).
 *
 * Renk tek vurgu olarak kalır; dersleri birbirinden ikon ayırır (terazi,
 * kalkan, bayrak…). İkon VERİDİR: `courses.icon` kolonunda yaşar ve panelden
 * (İçerik Ağacı) değiştirilir. İstemci ders adından ikon tahmin etmez; yeni ya
 * da adı değişen ders, uygulama sürümü beklemeden ikonunu alır.
 *
 * Anahtarlar Lucide ikon adlarıdır (kebab-case). İstemci anahtarı kendi Lucide
 * setine eşler; null'da ya da tanımadığı anahtarda `book-open` çizer. Bu yüzden
 * listeye anahtar eklemek eski istemciyi bozmaz, ama yeni ikon ancak istemci
 * eşlemesi eklendiğinde görünür. Panelin seçici listesi
 * (apps/admin/src/lib/course-icons.ts) bu listenin aynasıdır.
 */
export const COURSE_ICON_KEYS = [
  'lightbulb',
  'shield',
  'scale',
  'gavel',
  'landmark',
  'building-2',
  'flag',
  'hand-heart',
  'handshake',
  'crosshair',
  'newspaper',
  'languages',
  'book-open',
] as const;

export type CourseIconKey = (typeof COURSE_ICON_KEYS)[number];
