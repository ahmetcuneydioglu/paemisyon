import { CoachRule } from '../coach.types';

/// Şu an penceresi açık deneme var ve kullanıcı hiç katılmamış (Doc 19 kural 1).
export const examLiveRule: CoachRule = (ctx) => {
  const live = ctx.exams.live;
  if (!live || live.attempted || live.inProgress) return null;
  const hm = live.endAt.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
  return {
    type: 'exam_live',
    priority: 100,
    title: 'Canlı deneme şu an devam ediyor',
    body: `${live.title} · bitiş ${hm}`,
    cta: { label: 'Katıl', route: '/denemeler' },
    meta: { examId: live.id },
  };
};
