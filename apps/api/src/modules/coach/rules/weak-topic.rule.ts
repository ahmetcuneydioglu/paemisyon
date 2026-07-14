import { CoachRule } from '../coach.types';

/// Zayıf konu (Doc 19 kural 7): çözülen ≥ 10 ve mastery < 0.5 olan en düşük konu.
/// Eşikler bağlamda uygulanır (weakestTopic zaten filtreli gelir).
export const weakTopicRule: CoachRule = (ctx) => {
  const t = ctx.weakestTopic;
  if (!t) return null;
  return {
    type: 'weak_topic',
    priority: 65,
    title: `${t.name} konusunda zorlanıyorsun`,
    body: '10 soruluk güçlendirme çalışması öneriliyor.',
    cta: { label: 'Çöz', route: '/quiz' },
    meta: { topicId: t.topicId, topicName: t.name, mastery: t.mastery },
  };
};
