import { CoachRule } from '../coach.types';

/// Plan daveti (Doc 24 §11 "sana haftalık plan çıkarayım mı?"): planı olmayan,
/// onboarding'i bitmiş ve en az 10 soru çözmüş kullanıcıya. Düşük öncelik —
/// günün görevini gölgelemez; tempo düşüşünde (slump_watch) biraz öne çıkar.
export const PLAN_DAVETI_EN_AZ_COZULEN = 10;

export const planOfferRule: CoachRule = (ctx) => {
  if (ctx.plan) return null;
  if (!ctx.user.onboardingCompleted) return null;
  if (ctx.stats.totalSolved < PLAN_DAVETI_EN_AZ_COZULEN) return null;
  const dusus = ctx.volume.prev7 > 0 && ctx.volume.last7 < ctx.volume.prev7 * 0.5;
  return {
    type: 'plan_offer',
    priority: dusus ? 55 : 35,
    title:
      ctx.daysToExam != null
        ? `Sınava ${ctx.daysToExam} gün — haftalık plan çıkarayım mı?`
        : 'Haftalık plan çıkarayım mı?',
    body: 'Ayırabildiğin süreyi söyle; konuları haftalara ben dağıtayım.',
    cta: { label: 'Planı kur', route: '/planim' },
    meta: { daysToExam: ctx.daysToExam },
  };
};
