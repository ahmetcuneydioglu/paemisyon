import { CoachRule } from '../coach.types';

/// Günlük hedefe az kaldı (Doc 19 kural 5): 0 < kalan ≤ hedefin yarısı.
/// "Bitmeye yakın" hissi motive eder; hedefin başındayken kart gereksiz.
export const goalRemainingRule: CoachRule = (ctx) => {
  const remaining = ctx.user.dailyGoal - ctx.answeredToday;
  if (remaining <= 0 || remaining > Math.ceil(ctx.user.dailyGoal / 2)) return null;
  return {
    type: 'goal_remaining',
    priority: 75,
    title: `Bugünkü hedefine sadece ${remaining} soru kaldı`,
    body: `${ctx.answeredToday}/${ctx.user.dailyGoal} tamamlandı`,
    cta: { label: 'Tamamla', route: '/catalog' },
  };
};
