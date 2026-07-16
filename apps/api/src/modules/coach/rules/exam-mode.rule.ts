import { CoachRule } from '../coach.types';

/// Sınav modu (Doc 25 §3, Doc 24 §1/150. gün): hedef sınava ≤ 30 gün, > 3 gün.
/// Karışım tersine döner: yeni konu değil, deneme + yanlış turu. Ton: sakin
/// komutan (Doc 26 §1) — aciliyet var, panik yok.
export const examModeRule: CoachRule = (ctx) => {
  const days = ctx.daysToExam;
  if (days == null || days > 30 || days <= 3) return null;

  const wrongs = ctx.unresolvedWrongCount;
  return {
    type: 'exam_mode',
    priority: 84, // streak_risk (85) akşam aciliyetini ezmez; günün çerçevesidir
    title: `Sınava ${days} gün — pekiştirme dönemi`,
    body:
      wrongs > 0
        ? 'Bugün: deneme + yanlış turu. Yeni konu yok.'
        : 'Bugün: deneme ağırlıklı çalışma. Yeni konu yok.',
    cta:
      wrongs > 0
        ? { label: `Yanlış turunu başlat (${Math.min(wrongs, 20)})`, route: '/review' }
        : { label: 'Denemelere bak', route: '/denemeler' },
    meta: { daysToExam: days, wrongCount: wrongs },
  };
};
