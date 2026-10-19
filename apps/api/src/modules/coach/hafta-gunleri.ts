import { GUN_MS } from '../../common/gun';

/** Bugün ekranındaki 7 günlük nöbet çizelgesinin gün durumu (Doc 49/13 §2). */
export type HaftaGunDurumu = 'done' | 'missed' | 'today' | 'future';

/**
 * Uygulama haftasının (Pzt→Paz, TR 04.00 sınırı) 7 gününü durumlarıyla verir — SAF.
 * `aktifGunler`: bu hafta en az 1 cevap verilen günlerin anahtarları (DailyUsage.usageDate).
 * Bugün aktifse `done`, değilse `today`; geçmiş pasif günler `missed`, kalanlar `future`.
 */
export function haftaGunleri(aktifGunler: Date[], bugun: Date, haftaBasi: Date): HaftaGunDurumu[] {
  const aktif = new Set(aktifGunler.map((d) => d.toISOString().slice(0, 10)));
  const bugunKey = bugun.toISOString().slice(0, 10);
  return Array.from({ length: 7 }, (_, i) => {
    const gun = new Date(haftaBasi.getTime() + i * GUN_MS);
    const key = gun.toISOString().slice(0, 10);
    if (aktif.has(key)) return 'done';
    if (key === bugunKey) return 'today';
    return key < bugunKey ? 'missed' : 'future';
  });
}
