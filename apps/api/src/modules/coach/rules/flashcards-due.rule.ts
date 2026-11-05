import { CoachRule } from '../coach.types';

/// Vadesi gelen bilgi kartları (Doc 56 aşama 5): bugün hiç kart çalışılmamış ve ≥5 kart bekliyorsa.
/// Kart tekrarı kısa iştir (kart başına ~12 sn); kural akşam aciliyetlerinin (streak_risk 85) ve
/// yanlış tekrarının (quick_review 70) altında kalır. Kartlar kapalıysa bağlam null → kural susar.
export const flashcardsDueRule: CoachRule = (ctx) => {
  const f = ctx.flashcards;
  if (!f || f.due < 5 || f.reviewedToday > 0) return null;
  const tur = Math.min(f.due, Math.max(1, f.dailyGoal));
  const dk = Math.max(1, Math.round((tur * 12) / 60));
  return {
    type: 'flashcards_due',
    priority: 60,
    title: `${f.due} kart tekrar bekliyor`,
    body: `${tur} kartlık tur ${dk} dakika sürer; hatırladıkların uzun aralığa geçer.`,
    cta: { label: 'Tekrara başla', route: '/kartlar?mode=due' },
    meta: { due: f.due, dailyGoal: f.dailyGoal },
  };
};
