import { CoachRule } from '../coach.types';

/// Haftalık ders trendi (Doc 19 kural 8): snapshot karşılaştırması ±%10.
/// Veri kaynağı topic_mastery_snapshots — Faz 3 cron'u doldurur; yoksa sessiz.
export const courseTrendRule: CoachRule = (ctx) => {
  const t = ctx.courseTrend;
  if (!t || Math.abs(t.deltaPct) < 10) return null;
  const up = t.deltaPct > 0;
  return {
    type: 'course_trend',
    priority: 60,
    title: up
      ? `Bu hafta ${t.courseName} başarın %${t.deltaPct} arttı`
      : `${t.courseName} son zamanlarda zayıfladı (%${Math.abs(t.deltaPct)})`,
    body: up ? 'Harika gidiyorsun — momentum sende.' : 'Kısa bir tekrar toparlar.',
    cta: up ? undefined : { label: 'Çalış', route: '/catalog' },
    meta: { courseName: t.courseName, deltaPct: t.deltaPct },
  };
};
