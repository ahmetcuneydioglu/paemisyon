/**
 * Ders ikonları (Doc 48 Faz 6.3) — İçerik Ağacı'ndaki ikon seçicisinin listesi.
 *
 * TEK DOĞRULUK KAYNAĞI API'dir: `apps/api/src/common/course-icons.ts`
 * (COURSE_ICON_KEYS). Bu liste onun aynasıdır; yeni anahtar önce orada eklenir,
 * yoksa API kaydı 400 ile reddeder. Anahtarlar Lucide ikon adlarıdır; mobil
 * istemci aynı anahtarları kendi ikon setine eşler, ikon atanmamış (null) derste
 * açık kitap çizer.
 */
export const COURSE_ICON_OPTIONS = [
  { key: 'lightbulb', label: 'Ampul (Genel kültür)' },
  { key: 'shield', label: 'Kalkan (Polis)' },
  { key: 'scale', label: 'Terazi' },
  { key: 'gavel', label: 'Tokmak' },
  { key: 'landmark', label: 'Kurum binası' },
  { key: 'building-2', label: 'Bina' },
  { key: 'flag', label: 'Bayrak' },
  { key: 'hand-heart', label: 'Kalp ve el' },
  { key: 'handshake', label: 'El sıkışma' },
  { key: 'crosshair', label: 'Nişangâh' },
  { key: 'newspaper', label: 'Gazete' },
  { key: 'languages', label: 'Diller' },
  { key: 'book-open', label: 'Açık kitap (varsayılan)' },
] as const;

export type CourseIconKey = (typeof COURSE_ICON_OPTIONS)[number]['key'];

/** Anahtar bu panel sürümünün listesinde mi? (API listesi daha yeni olabilir.) */
export function isKnownCourseIcon(key: string): key is CourseIconKey {
  return COURSE_ICON_OPTIONS.some((o) => o.key === key);
}
