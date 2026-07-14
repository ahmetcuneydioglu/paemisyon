import { CoachRule } from '../coach.types';

/// Seri riski (Doc 19 kural 4): dün aktifti, bugün 0 soru ve saat ≥ 18.
/// Gün içinde erken korkutmamak için yalnız akşam tetiklenir.
export const streakRiskRule: CoachRule = (ctx) => {
  if (ctx.streak.current <= 0) return null;
  if (!ctx.streak.activeYesterday) return null;
  if (ctx.answeredToday > 0) return null;
  if (ctx.trHour < 18) return null;
  return {
    type: 'streak_risk',
    priority: 85,
    title: `Bugün çalışmazsan ${ctx.streak.current} günlük serin bozulacak`,
    body: 'Birkaç soru bile seriyi korur.',
    cta: { label: 'Çalışmaya başla', route: '/catalog' },
  };
};
