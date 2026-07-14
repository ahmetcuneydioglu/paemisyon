import { CoachRule } from '../coach.types';

/// Bugün başlayacak yayında deneme (Doc 19 kural 3).
export const examTodayRule: CoachRule = (ctx) => {
  const e = ctx.exams.todayUpcoming;
  if (!e) return null;
  const hm = e.startAt.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
  return {
    type: 'exam_today',
    priority: 90,
    title: `Bugünkü canlı deneme ${hm}'de`,
    body: `${e.title} · ${e.questionCount} soru · ${e.durationMinutes} dk`,
    cta: { label: 'Görüntüle', route: '/denemeler' },
    meta: { examId: e.id, startAt: e.startAt.toISOString() },
  };
};
