import { CoachRule } from '../coach.types';

/// Deneme sonrası (Doc 24 §3 `post_exam`): son 48 saatte randevulu deneme
/// tamamlandı. Deneme bitince exam_live susar (attempted) — bu kart yerini alır
/// ve kullanıcıyı sonuç analizine + yanlış turuna çağırır (öğrenme deneme sonrası
/// pekişir). Ton: dürüst ayna — sonucu birlikte oku, sonra düzelt.
/// Priority 82: günlük çalışma kartlarının (goal/quick_review/slump) üstünde,
/// akşam seri güvenliği (85) ve exam_mode (84) altında.
export const postExamRule: CoachRule = (ctx) => {
  const d = ctx.recentDeneme;
  if (!d) return null;

  const wrongs = d.wrongCount;
  // Sonuç ekranı deneme kimliğiyle açılır; yanlış varsa doğrudan yanlış turu.
  const cta =
    wrongs > 0
      ? { label: `Yanlış turunu başlat (${Math.min(wrongs, 20)})`, route: '/review' }
      : { label: 'Sonucu incele', route: d.examId ? `/denemeler/${d.examId}` : '/denemeler' };

  return {
    type: 'post_exam',
    priority: 82,
    title: 'Deneme sonucun hazır',
    body:
      wrongs > 0
        ? `${d.title} · analizini gör, yanlışlarını kapat.`
        : `${d.title} · sonucunu ve analizini incele.`,
    cta,
    meta: { examId: d.examId, wrongCount: wrongs },
  };
};
