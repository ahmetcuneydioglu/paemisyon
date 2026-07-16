import { CoachRule } from '../coach.types';

/// Dip izleme (Doc 24 §7.4, Doc 25 §3): son 7 günün soru hacmi önceki 7 günün
/// yarısının altına düştüyse tempo düşüşü var demektir. Ton: yoldaş, esnek —
/// suç kullanıcıda değil; düşük eşikli dönüş teklif edilir.
/// Guard'lar: önceki hafta anlamlı hacim (≥ 40 soru) olmalı (yeni kullanıcıyı
/// yanlış alarmla üzme); comeback (≥3 gün sessizlik) bunu zaten ezer;
/// sınav yaklaşırken (≤30 gün) exam_mode çerçevesi devralır.
export const slumpWatchRule: CoachRule = (ctx) => {
  const { last7, prev7 } = ctx.volume;
  if (prev7 < 40) return null;
  if (last7 >= prev7 * 0.5) return null;
  if (ctx.daysToExam != null && ctx.daysToExam <= 30) return null;

  return {
    type: 'slump_watch',
    priority: 80,
    title: 'Bu hafta yoğunsun galiba — tempo düşmüş',
    body: 'Sorun değil. Bugün 10 soru yeter; sen iste, yine artırırız.',
    cta: { label: '10 soruluk seans', route: '/quiz' },
    meta: { suggestedCount: 10, last7, prev7 },
  };
};
