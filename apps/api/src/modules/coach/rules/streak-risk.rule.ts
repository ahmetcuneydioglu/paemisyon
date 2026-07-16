import { CoachRule } from '../coach.types';

/// Seri riski (Doc 19 kural 4): dün aktifti, bugün 0 soru ve saat ≥ 18.
/// Gün içinde erken korkutmamak için yalnız akşam tetiklenir.
/// Ton (Doc 26 §1): acil ama sakin — kayıp dili yalnız seri için, ünlem yok.
export const streakRiskRule: CoachRule = (ctx) => {
  if (ctx.streak.current <= 0) return null;
  if (!ctx.streak.activeYesterday) return null;
  if (ctx.answeredToday > 0) return null;
  if (ctx.trHour < 18) return null;
  return {
    type: 'streak_risk',
    priority: 85,
    title: `${ctx.streak.current} günlük serin bu gece bozuluyor`,
    body:
      ctx.streak.freezesLeft > 0
        ? '5 soru yeter — 3 dakika. Olmazsa sigortan devrede: seri yarın da yaşar.'
        : '5 soru yeter — 3 dakika. Bu hafta sigortan kalmadı.',
    cta: { label: 'Mini seans (5 soru)', route: '/catalog' },
    meta: { freezesLeft: ctx.streak.freezesLeft },
  };
};
