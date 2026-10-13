import { CoachRule } from '../coach.types';
import { DONUS_GUN, KISA_TUR } from '../today-task.logic';

/// Geri dönüş (Doc 19 kural 12; Doc 24 §3 "5+ gün"): son aktiviteden ≥ 5 gün.
/// Servis bu kart tetiklenirse DİĞER kartları bastırır (tek başına gösterilir):
/// dönen kullanıcıyı görev listesiyle boğmak yerine tek sıcak davet.
/// Ton (Doc 26 §1, Doc 48 §9): suçluluk ve borç dili yok — "N soru seni
/// bekliyor" kalıbı kaldırıldı. Dönüşte teşhis değil özgüven: güçlü konudan
/// kısa tur (dönüş reçetesi, Doc 48 A6). Eşik görev kartıyla aynı sabitten.
export const comebackRule: CoachRule = (ctx) => {
  const days = ctx.daysSinceLastActivity;
  if (days == null || days < DONUS_GUN) return null;
  return {
    type: 'comeback',
    priority: 40,
    title: 'Hoş geldin — kısa bir dönüş turu',
    body: `Güçlü konundan ${KISA_TUR} soruluk tur hazır — 3 dakika.`,
    cta: { label: `Kısa tur (${KISA_TUR} soru)`, route: '/catalog' },
    // Sayı vaat eden kart sayıyı da taşır (etiket = davranış — Doc 48 A7).
    meta: { count: KISA_TUR, recipe: 'comeback' },
  };
};
