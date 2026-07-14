import { CoachRule } from '../coach.types';

/// Geri dönüş (Doc 19 kural 12): son aktiviteden ≥ 3 gün geçti.
/// Servis bu kart tetiklenirse DİĞER kartları bastırır (tek başına gösterilir):
/// dönen kullanıcıyı görev listesiyle boğmak yerine tek sıcak davet.
export const comebackRule: CoachRule = (ctx) => {
  const days = ctx.daysSinceLastActivity;
  if (days == null || days < 3) return null;
  return {
    type: 'comeback',
    priority: 40,
    title: 'Seni özledik — hazır olduğunda buradayız',
    body: `Son girişinin üzerinden ${days} gün geçti. 5 soruluk ısınmayla dön.`,
    cta: { label: 'Isınmaya başla', route: '/catalog' },
  };
};
