import { CoachRule } from '../coach.types';

/// Haftalık plan kartı (Doc 49/12 F8-A): bu haftanın yüzdesi + sıradaki kalem.
/// Plan bitmişse (sınav geçti / ufuk doldu) kart "yeni dönem" daveti olur.
/// Metin ve yüzde sunucudan: istemci evre/eşik bilmez.
export const planWeekRule: CoachRule = (ctx) => {
  const p = ctx.plan;
  if (!p) return null;
  if (p.ended) {
    return {
      type: 'plan_week',
      priority: 45,
      title: 'Planın tamamlandı',
      body: 'Yeni dönem için planı yeniden kurabilirsin.',
      cta: { label: 'Planı yenile', route: '/planim' },
      meta: { ended: true },
    };
  }
  const pct = p.summary.pct;
  const next = p.nextItem;
  const evre =
    p.phase === 'taper'
      ? 'Son günler: hafif tekrar.'
      : p.phase === 'exam_mode'
        ? 'Pekiştirme dönemi: tekrar ve deneme ağırlıklı.'
        : null;
  const sira = next
    ? next.kind === 'topic'
      ? `Sıradaki: ${next.topicName ?? 'konu'} · ${next.remainingMinutes} dk`
      : next.kind === 'review'
        ? `Sıradaki: tekrar turu · ${next.remainingMinutes} dk`
        : `Sıradaki: deneme · ${next.remainingMinutes} dk`
    : 'Bu haftanın hedefi tamam.';
  return {
    type: 'plan_week',
    priority: pct >= 100 ? 40 : 70,
    title: `Haftalık plan %${pct}`,
    body: [evre, sira].filter(Boolean).join(' '),
    cta: next
      ? next.kind === 'topic' && next.topicId
        ? { label: 'Başla', route: '/quiz' }
        : next.kind === 'review'
          ? { label: 'Tekrar turu', route: '/review' }
          : { label: 'Deneme', route: '/denemeler' }
      : { label: 'Planım', route: '/planim' },
    meta: {
      pct,
      phase: p.phase,
      weekStart: p.weekStart,
      targetMinutes: p.summary.targetMinutes,
      doneMinutes: p.summary.doneMinutes,
      ...(next
        ? {
            itemId: next.id,
            kind: next.kind,
            topicId: next.topicId,
            topicName: next.topicName,
            remainingMinutes: next.remainingMinutes,
          }
        : {}),
    },
  };
};
