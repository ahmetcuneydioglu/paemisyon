import { CoachRule } from '../coach.types';

/// Motivasyon (Doc 19 kural 13): hiçbir kural tetiklenmediyse gösterilecek
/// tek kart — servis yalnız kart listesi boşken çağırır. Metin veriye göre
/// deterministik (rastgele üretim YOK).
export const motivationRule: CoachRule = (ctx) => {
  const s = ctx.streak.current;
  if (s >= 3) {
    return {
      type: 'motivation',
      priority: 10,
      title: `${s} gündür üst üste çalışıyorsun`,
      body: 'Harika gidiyorsun — serini bozma.',
      cta: { label: 'Devam et', route: '/catalog' },
    };
  }
  if (ctx.answeredToday >= ctx.user.dailyGoal) {
    return {
      type: 'motivation',
      priority: 10,
      title: 'Bugünkü hedefini tamamladın',
      body: 'İstersen biraz daha ilerle — yarın görüşürüz.',
      cta: { label: 'Ekstra çalış', route: '/catalog' },
    };
  }
  return {
    type: 'motivation',
    priority: 10,
    title: 'Bugün de bir adım ileri',
    body: 'Küçük ama düzenli adımlar kazandırır.',
    cta: { label: 'Çalışmaya başla', route: '/catalog' },
  };
};
