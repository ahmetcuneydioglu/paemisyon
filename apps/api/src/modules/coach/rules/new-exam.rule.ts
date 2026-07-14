import { CoachRule } from '../coach.types';

/// Yeni deneme yayınlandı (Doc 19 kural 11): son 48 saat, katılmadığı.
/// Aynı deneme exam_live/exam_today ile zaten görünüyorsa bağlam null verir.
export const newExamRule: CoachRule = (ctx) => {
  const e = ctx.exams.newPublished;
  if (!e) return null;
  return {
    type: 'new_exam',
    priority: 45,
    title: 'Yeni deneme yayınlandı',
    body: e.title,
    cta: { label: 'İncele', route: '/denemeler' },
    meta: { examId: e.id },
  };
};
