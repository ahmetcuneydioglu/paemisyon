-- Ömürlük plan tipi (App Store non-consumable): süresiz premium.
ALTER TYPE "PlanPeriod" ADD VALUE IF NOT EXISTS 'lifetime';
