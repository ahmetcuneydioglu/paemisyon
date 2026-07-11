import { PrismaClient, PlanPeriod } from '@prisma/client';

/**
 * Başlangıç verisi (Doc 6 §8): roller, planlar, modüller.
 * Idempotent — tekrar çalıştırmak güvenli (upsert).
 * Not: soru/sınav verisi SEED'lenmez — mevzuat nedeniyle içerik editoryal üretilir.
 */
const prisma = new PrismaClient();

async function main() {
  // Roller (RBAC — Doc 8)
  const roles = [
    { key: 'admin', name: 'Yönetici' },
    { key: 'editor', name: 'Editör' },
    { key: 'user', name: 'Kullanıcı' },
  ];
  for (const r of roles) {
    await prisma.role.upsert({ where: { key: r.key }, update: { name: r.name }, create: r });
  }

  // Planlar (Doc 16). Fiyatlar iş kararı bekliyor → şimdilik null.
  // Freemium günlük limit: başlangıç 15 (öneri 10-20; admin'den ayarlanabilir).
  const plans = [
    { key: 'free', name: 'Ücretsiz', period: PlanPeriod.none, dailyQuestionLimit: 15 },
    { key: 'monthly', name: 'Premium Aylık', period: PlanPeriod.monthly, dailyQuestionLimit: null },
    { key: 'yearly', name: 'Premium Yıllık', period: PlanPeriod.yearly, dailyQuestionLimit: null },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      update: { name: p.name, period: p.period, dailyQuestionLimit: p.dailyQuestionLimit },
      create: { ...p, currency: 'TRY', isActive: true },
    });
  }

  // Modüller (Doc 2). İlk modül PAEM; platform çok-modüllü.
  const modules = [
    { key: 'paem', name: 'PAEM', sortOrder: 1 },
    { key: 'pomem', name: 'POMEM', sortOrder: 2 },
    { key: 'pmyo', name: 'PMYO', sortOrder: 3 },
    { key: 'misyon', name: 'Misyon', sortOrder: 4 },
  ];
  for (const m of modules) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: { name: m.name, sortOrder: m.sortOrder },
      create: { ...m, isActive: true },
    });
  }

  console.log('Seed tamam: roller, planlar, modüller eklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
