import { CoachRule } from '../coach.types';

/// Geri dönüş (Doc 19 kural 12): son aktiviteden ≥ 3 gün geçti.
/// Servis bu kart tetiklenirse DİĞER kartları bastırır (tek başına gösterilir):
/// dönen kullanıcıyı görev listesiyle boğmak yerine tek sıcak davet.
/// Ton (Doc 26 §1): suçluluk yok, "seni özledik" yasak listesinde — birikim dili.
export const comebackRule: CoachRule = (ctx) => {
  const days = ctx.daysSinceLastActivity;
  if (days == null || days < 3) return null;

  const solved = ctx.stats.totalSolved;
  return {
    type: 'comeback',
    priority: 40,
    title: 'Hoş geldin — kaldığın yerden devam',
    body:
      solved > 0
        ? `${solved.toLocaleString('tr-TR')} soruluk birikimin seni bekliyor. 5 soruluk ısınma hazır — 3 dakika.`
        : '5 soruluk ısınmayla başlayalım — 3 dakika.',
    cta: { label: 'Isınmaya başla (5 soru)', route: '/catalog' },
  };
};
