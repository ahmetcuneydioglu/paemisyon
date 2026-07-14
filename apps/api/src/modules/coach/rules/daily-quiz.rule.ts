import { CoachRule } from '../coach.types';

/// Günün quizi oynanmamış (Doc 19 kural 9).
export const dailyQuizRule: CoachRule = (ctx) => {
  if (ctx.dailyQuizPlayed) return null;
  return {
    type: 'daily_quiz',
    priority: 55,
    title: 'Bugünkü quiz seni bekliyor',
    body: '10 karışık soru · serini koru.',
    cta: { label: 'Başla', route: '/quiz' },
    meta: { mode: 'daily', count: 10 },
  };
};
