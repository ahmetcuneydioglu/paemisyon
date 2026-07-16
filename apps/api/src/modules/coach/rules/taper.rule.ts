import { CoachRule } from '../coach.types';

/// Taper (Doc 24 §1/son 3 gün): sınava ≤ 3 gün. Yoğunluk bilinçli düşürülür;
/// ton güven verir, yük bindirmez. Servis bu kart tetiklenince görev
/// listesini bastırır (comeback gibi) — son günlerde tek sakin mesaj.
export const taperRule: CoachRule = (ctx) => {
  const days = ctx.daysToExam;
  if (days == null || days > 3) return null;

  const solved = ctx.stats.totalSolved;
  const title = days === 0 ? 'Bugün sınav günü. Hazırsın.' : 'Hazırsın.';
  const body =
    days === 0
      ? 'Kolay gelsin Komiserim. Bugün soru yok — dinlen, sakin git.'
      : solved > 0
        ? `Bugüne kadar ${formatCount(solved)} soru çözdün. Son ${days} gün: ağır yük yok, kısa bir tur yeter.`
        : `Son ${days} gün: ağır yük yok, kısa bir tur yeter.`;

  return {
    type: 'taper',
    priority: 97, // canlı deneme (100) hariç her şeyi ezer
    title,
    body,
    // Sınav gününde CTA yok — ürün susmayı bilir (Doc 24 §1).
    cta: days === 0 ? undefined : { label: 'Kısa tur (5 soru)', route: '/review' },
    meta: { daysToExam: days },
  };
};

/** 11400 → "11.400" (TR binlik ayracı). */
function formatCount(n: number): string {
  return n.toLocaleString('tr-TR');
}
