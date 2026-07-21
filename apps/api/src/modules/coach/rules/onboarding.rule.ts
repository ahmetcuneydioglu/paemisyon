import { CoachRule } from '../coach.types';

/// Onboarding (Doc 24 §3): ilk 3 seans. Yeni kullanıcıyı görev listesiyle değil
/// tek net adımla karşıla. İki alt-hâl:
///  · kurulum eksik (onboardingCompleted=false) → hedef/modül seçimini tamamla,
///  · kurulum tamam ama <3 seans → ilk devriyeye çık (küçük ilk zafer).
/// Ton (Doc 26 §1): karşılayıcı, umut veren — suç/aciliyet dili yok.
/// Priority 88: canlı deneme (90+) yeni kullanıcıyı da çağırabilir, onun altında;
/// ama günlük görev/motivasyon kartlarının üstünde hero olur.
export const onboardingRule: CoachRule = (ctx) => {
  if (ctx.stats.totalSessions >= 3) return null;

  if (!ctx.user.onboardingCompleted) {
    return {
      type: 'onboarding',
      priority: 88,
      title: 'Kurulumu tamamlayalım',
      body: 'Hedef sınavını ve çalışma modülünü seç — koçun sana göre planlasın.',
      cta: { label: 'Kuruluma devam et', route: '/onboarding' },
      meta: { step: 'setup' },
    };
  }

  const solved = ctx.stats.totalSolved;
  return {
    type: 'onboarding',
    priority: 88,
    title: solved > 0 ? 'İlk devriyene devam' : 'İlk devriyene çık',
    body:
      solved > 0
        ? 'Güzel başladın. 10 soruluk kısa bir turla ilk günü sağlamlaştır.'
        : 'Hazırsan 10 soruluk kısa bir turla başlayalım — koçun buradan şekillenecek.',
    cta: { label: 'Çalışmaya başla', route: '/catalog' },
    meta: { step: 'first_sessions', sessions: ctx.stats.totalSessions },
  };
};
