import { CoachRule } from '../coach.types';

/// Sınav sonrası (Doc 24 §3 `aftermath`): hedef sınav geçti. İlk 14 gün sonucun
/// beklendiği/devrin yaşandığı sakin bir pencere — grind dili durur. Servis bu
/// kart tetiklenince görev listesini bastırır (taper gibi). Ton (Doc 26 §1):
/// insan, aidiyet; emeği onurlandır, sıradaki hedefe köprü kur. Baskı yok.
/// 14 günden sonra kart susar → kullanıcı yeni hedef belirleyene dek `normal`.
export const aftermathRule: CoachRule = (ctx) => {
  const days = ctx.daysSinceExam;
  if (days == null || days < 0 || days > 14) return null;

  const solved = ctx.stats.totalSolved;
  const title = days === 0 ? 'Sınavın bugündü — geçmiş olsun.' : 'Sınavın geçti — kolay gelsin.';
  const body =
    solved > 0
      ? `${solved.toLocaleString('tr-TR')} soruluk emek verdin. Sonucu beklerken sıradaki hedefini belirleyebilirsin.`
      : 'Sonucu beklerken sıradaki hedefini belirleyebilirsin.';

  return {
    type: 'aftermath',
    priority: 78,
    title,
    body,
    cta: { label: 'Sıradaki hedefi seç', route: '/onboarding' },
    meta: { daysSinceExam: days },
  };
};
