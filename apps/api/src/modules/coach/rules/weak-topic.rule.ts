import { CoachRule } from '../coach.types';
import { shortUnitTitle } from '../../summaries/unite-recete';

/// Zayıf konu (Doc 19 kural 7): çözülen ≥ 10 ve mastery < eşik olan en düşük konu.
/// Eşikler bağlamda uygulanır (weakestTopic zaten filtreli gelir).
///
/// Doc 53 F5-2: konunun yayında ünitesi varsa kart ÜNİTE reçetesine döner (aynı zayıf konu,
/// daha keskin adım): özeti okunmamışsa "önce özet, sonra 10 soru"; okunmuşsa doğrudan o
/// üniteden 10 soru. Günde en çok bir kez: seçim deterministik (unite-recete.ts).
export const weakTopicRule: CoachRule = (ctx) => {
  const t = ctx.weakestTopic;
  if (!t) return null;
  const r = ctx.weakestUnit;
  if (r && r.unit.topicId === t.topicId) {
    const unite = shortUnitTitle(r.unit.title);
    const yuzde = r.unit.accuracyPct != null ? ` (%${r.unit.accuracyPct})` : '';
    if (r.kind === 'summary_then_questions') {
      return {
        type: 'weak_topic',
        priority: 65,
        title: `${t.name}: en zayıf yerin ${unite}${yuzde}`,
        body: 'Önce özetini oku, sonra bu maddelerden 10 soru.',
        cta: { label: 'Özeti aç', route: `/ozet/${r.unit.slug}` },
        meta: { topicId: t.topicId, topicName: t.name, mastery: t.mastery, recipe: r },
      };
    }
    return {
      type: 'weak_topic',
      priority: 65,
      title: `${t.name}: ${unite}${yuzde}`,
      body: 'Özetini okudun; şimdi bu maddelerden 10 soru.',
      cta: { label: 'Çöz', route: '/quiz' },
      meta: { topicId: t.topicId, topicName: t.name, mastery: t.mastery, recipe: r },
    };
  }
  return {
    type: 'weak_topic',
    priority: 65,
    title: `${t.name} konusunda zorlanıyorsun`,
    body: '10 soruluk güçlendirme çalışması öneriliyor.',
    cta: { label: 'Çöz', route: '/quiz' },
    meta: { topicId: t.topicId, topicName: t.name, mastery: t.mastery },
  };
};
