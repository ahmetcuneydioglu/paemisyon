import { CoachRule } from '../coach.types';

/// Rozete yaklaşma (Doc 19 kural 10): sıradaki rozete ≥ %80 ilerleme.
export const badgeNearRule: CoachRule = (ctx) => {
  const b = ctx.nextBadge;
  if (!b || b.target <= 0) return null;
  // Eşiği geçmişse rozet hak edilmiştir (verme kancası taşır) — "kaldı" deme.
  if (b.progress >= b.target) return null;
  if (b.progress / b.target < 0.8) return null;
  return {
    type: 'badge_near',
    priority: 50,
    title: `"${b.name}" rozetine çok az kaldı`,
    body: `${b.progress}/${b.target} tamamlandı`,
    meta: { badgeKey: b.key, progress: b.progress, target: b.target },
  };
};
