import type { ExamInfo } from './home-v2.types';
import { AFTERMATH_PENCERE_GUN } from './rules/aftermath.rule';

/** İki an arasındaki TR takvim günü farkı (target - now, tam gün). */
function trDayDiff(now: Date, target: Date): number {
  const day = (d: Date) => Math.floor((d.getTime() + 3 * 3_600_000) / 86_400_000);
  return day(target) - day(now);
}

/**
 * Hedef sınav tarihi (Doc 48 A2): kişisel tarih önceliklidir. Ama sınav sonrası
 * pencereyi (14 gün) aşmış geçmiş bir kişisel tarih artık hedef değildir; resmî
 * tarih varsa ona düşülür. Aksi hâlde geçen dönemin tarihi, admin yeni resmî
 * tarihi girdiğinde bile geri sayımı gölgeler (14 Eki 2026: kişisel tarihli 131
 * kullanıcının 34'ünde tarih geçmişteydi). Resmî tarih yoksa davranış aynı kalır.
 * (Test için export.)
 */
export function hedefSinavTarihi(
  kisisel: Date | null,
  resmi: Date | null,
  now: Date,
): { date: Date | null; source: ExamInfo['source'] } {
  if (kisisel && trDayDiff(now, kisisel) >= -AFTERMATH_PENCERE_GUN) {
    return { date: kisisel, source: 'personal' };
  }
  if (resmi) return { date: resmi, source: 'official' };
  return kisisel ? { date: kisisel, source: 'personal' } : { date: null, source: null };
}
