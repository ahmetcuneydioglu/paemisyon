import { CoachRule } from '../coach.types';

/// Yanlışlardan hızlı tekrar (Doc 19 kural 6): çözülmemiş yanlış ≥ 5.
/// Mevcut /review modülü (tekrar oturumu) kullanılır — yeni motor yok.
export const quickReviewRule: CoachRule = (ctx) => {
  if (ctx.unresolvedWrongCount < 5) return null;
  return {
    type: 'quick_review',
    priority: 70,
    title: 'Yanlışlarından 5 soruluk hızlı tekrar hazır',
    body: 'Son çözdüğün sorulardan senin için derlendi.',
    cta: { label: 'Tekrara başla', route: '/review' },
    meta: { wrongCount: ctx.unresolvedWrongCount },
  };
};
