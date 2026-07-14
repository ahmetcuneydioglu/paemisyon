import { CoachRule } from '../coach.types';

/// Aktif denemede yarım kalmış oturum (Doc 19 kural 2) — en acil ikinci durum.
export const examInProgressRule: CoachRule = (ctx) => {
  const live = ctx.exams.live;
  if (!live || !live.inProgress) return null;
  return {
    type: 'exam_in_progress',
    priority: 95,
    title: 'Denemen yarım kaldı — devam et',
    body: `${live.title} · süre dolmadan tamamla`,
    cta: { label: 'Devam et', route: `/denemeler/${live.id}` },
    meta: { examId: live.id },
  };
};
