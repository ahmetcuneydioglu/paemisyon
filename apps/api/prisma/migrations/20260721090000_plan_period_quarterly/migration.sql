-- Web'in satılabilir tek planı 3 aylık oldu (499,99 TL, manuel ödeme).
-- PlanPeriod enum'una 'quarterly' eklenir. Additive: mevcut satırlar etkilenmez.
-- NOT: PG'de ADD VALUE ile eklenen değer AYNI transaction içinde KULLANILAMAZ;
-- bu yüzden plan satırı burada değil, scripts/set-premium-plan.ts ile yazılır.
ALTER TYPE "PlanPeriod" ADD VALUE IF NOT EXISTS 'quarterly' AFTER 'monthly';
