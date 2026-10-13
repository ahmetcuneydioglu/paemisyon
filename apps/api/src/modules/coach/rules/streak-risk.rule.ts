import { CoachRule } from '../coach.types';
import { AKSAM_SAATI, KISA_TUR, haftadaKalanGun } from '../today-task.logic';

/// Haftalık hedef riski (Doc 48 D1 — tek istikrar ölçüsü haftalık aktif gün;
/// tür adı eski istemciler ve web tanısın diye 'streak_risk' kaldı).
/// Akşam (≥18), bugün 0 cevap ve bugün de boş geçerse haftalık hedef artık
/// tutmuyor. Gün içinde erken korkutmaz; hedef zaten erişilebilirse susar.
/// Ton (Doc 26 §1): acil ama sakin — ünlem yok, kayıp dili yok.
export const streakRiskRule: CoachRule = (ctx) => {
  if (ctx.answeredToday > 0) return null;
  if (ctx.trHour < AKSAM_SAATI) return null;
  const { activeDays, goalDays } = ctx.weekly;
  const eksik = goalDays - activeDays;
  if (eksik <= 0) return null;
  if (eksik < haftadaKalanGun(ctx.now)) return null;
  return {
    type: 'streak_risk',
    priority: 85,
    title: 'Haftalık hedefin için bugün önemli',
    body: `Bu hafta ${activeDays}/${goalDays} gün. ${KISA_TUR} soru yeter — 3 dakika.`,
    cta: { label: `Mini tur (${KISA_TUR} soru)`, route: '/catalog' },
    meta: { count: KISA_TUR, activeDays, goalDays },
  };
};
