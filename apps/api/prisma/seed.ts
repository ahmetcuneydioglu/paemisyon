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

  // Örnek içerik (DEV) — katalog gezinmesini denemek için. PAEM boşsa ekle.
  // Gerçek içerik editoryal üretilir (Doc 2); bu yalnızca iskelet doğrulaması.
  const paem = await prisma.module.findUnique({ where: { key: 'paem' } });
  if (paem) {
    const courseCount = await prisma.course.count({ where: { moduleId: paem.id } });
    if (courseCount === 0) {
      const sample = [
        { name: 'Anayasa Hukuku', topics: ['Temel Kavramlar', 'Temel Hak ve Hürriyetler', 'Yasama'] },
        { name: 'Türkçe', topics: ['Ses Bilgisi', 'Anlatım Bozuklukları'] },
        { name: 'Genel Kültür', topics: ['Tarih', 'Coğrafya'] },
      ];
      for (let ci = 0; ci < sample.length; ci++) {
        const course = await prisma.course.create({
          data: { moduleId: paem.id, name: sample[ci].name, sortOrder: ci + 1 },
        });
        await prisma.topic.createMany({
          data: sample[ci].topics.map((name, ti) => ({
            courseId: course.id,
            name,
            sortOrder: ti + 1,
            isPremium: ti >= 2, // örnek: 3. konu premium
          })),
        });
      }
      console.log('Örnek PAEM içeriği eklendi (dev).');
    }
  }

  console.log('Seed tamam: roller, planlar, modüller (+ örnek içerik) eklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
