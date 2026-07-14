import { PrismaClient, PlanPeriod, BadgeKind } from '@prisma/client';

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

  // Planlar (Doc 16). Fiyatlar başlangıç değeri — App Store Connect ürün fiyatı asıldır.
  // storeProductId'ler App Store Connect'te bire bir aynı olmalı (Doc 15).
  // Freemium günlük limit: başlangıç 15 (öneri 10-20; admin'den ayarlanabilir).
  const plans = [
    {
      key: 'free',
      name: 'Ücretsiz',
      period: PlanPeriod.none,
      // TODO(LANSMAN): geliştirme için 1000 — yayına çıkmadan önce 15'e çek!
      dailyQuestionLimit: 1000,
      price: null as string | null,
      storeProductIdIos: null as string | null,
    },
    {
      key: 'monthly',
      name: 'Premium Aylık',
      period: PlanPeriod.monthly,
      dailyQuestionLimit: null,
      price: '149.99',
      storeProductIdIos: 'com.paemisyon.premium.monthly',
    },
    {
      key: 'yearly',
      name: 'Premium Yıllık',
      period: PlanPeriod.yearly,
      dailyQuestionLimit: null,
      price: '999.99',
      storeProductIdIos: 'com.paemisyon.premium.yearly',
    },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      update: {
        name: p.name,
        period: p.period,
        dailyQuestionLimit: p.dailyQuestionLimit,
        price: p.price,
        storeProductIdIos: p.storeProductIdIos,
      },
      create: {
        key: p.key,
        name: p.name,
        period: p.period,
        dailyQuestionLimit: p.dailyQuestionLimit,
        price: p.price,
        storeProductIdIos: p.storeProductIdIos,
        currency: 'TRY',
        isActive: true,
      },
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

  // Örnek sorular (DEV) — quiz motorunu denemek için. "Temel Kavramlar" boşsa ekle.
  const firstTopic = await prisma.topic.findFirst({ where: { name: 'Temel Kavramlar' } });
  if (firstTopic) {
    const qCount = await prisma.question.count({ where: { topicId: firstTopic.id } });
    if (qCount === 0) {
      const samples = [
        {
          stem: '1982 Anayasası’na göre Türkiye Cumhuriyeti’nin nitelikleri arasında aşağıdakilerden hangisi YER ALMAZ?',
          options: ['Demokratik', 'Laik', 'Sosyal', 'Federal'],
          correct: 3,
          explanation: 'Türkiye Cumhuriyeti üniter bir devlettir; "federal" bir niteliği değildir.',
        },
        {
          stem: 'Anayasa’ya göre egemenlik kayıtsız şartsız kime aittir?',
          options: ['Millete', 'Cumhurbaşkanına', 'TBMM’ye', 'Hükümete'],
          correct: 0,
          explanation: 'Egemenlik kayıtsız şartsız Milletindir (Anayasa md. 6).',
        },
        {
          stem: 'Aşağıdakilerden hangisi bir temel hak ve hürriyet DEĞİLDİR?',
          options: ['Yaşama hakkı', 'Kişi dokunulmazlığı', 'Seçme ve seçilme hakkı', 'Vergi toplama'],
          correct: 3,
          explanation: 'Vergi toplama bir devlet yetkisidir; temel hak ve hürriyet değildir.',
        },
      ];
      for (const s of samples) {
        const q = await prisma.question.create({ data: { topicId: firstTopic.id } });
        const v = await prisma.questionVersion.create({
          data: {
            questionId: q.id,
            versionNo: 1,
            stem: s.stem,
            explanation: s.explanation,
            difficulty: 'medium',
            status: 'published',
            publishedAt: new Date(),
          },
        });
        await prisma.questionOption.createMany({
          data: s.options.map((text, i) => ({
            questionVersionId: v.id,
            label: String.fromCharCode(65 + i),
            text,
            isCorrect: i === s.correct,
            sortOrder: i + 1,
          })),
        });
        await prisma.question.update({ where: { id: q.id }, data: { currentVersionId: v.id } });
      }
      console.log('Örnek sorular eklendi (dev): 3 soru.');
    }
  }

  // Rozet kataloğu (Doc 19 §3.2) — kazanım kuralı kind+threshold ile deterministik.
  // Metinler yetişkin ve profesyonel (Duolingo kalitesi, çocukça değil).
  const badges = [
    { key: 'first_session', name: 'İlk Adım', description: 'İlk quiz oturumunu tamamla', kind: BadgeKind.solved, threshold: 1, sortOrder: 1 },
    { key: 'solved_100', name: '100 Soru', description: '100 soru çöz', kind: BadgeKind.solved, threshold: 100, sortOrder: 2 },
    { key: 'solved_500', name: '500 Soru', description: '500 soru çöz', kind: BadgeKind.solved, threshold: 500, sortOrder: 3 },
    { key: 'solved_1000', name: '1000 Soru', description: '1000 soru çöz', kind: BadgeKind.solved, threshold: 1000, sortOrder: 4 },
    { key: 'streak_3', name: '3 Gün Seri', description: '3 gün üst üste çalış', kind: BadgeKind.streak, threshold: 3, sortOrder: 5 },
    { key: 'streak_7', name: '7 Gün Seri', description: '7 gün üst üste çalış', kind: BadgeKind.streak, threshold: 7, sortOrder: 6 },
    { key: 'streak_30', name: '30 Gün Seri', description: '30 gün üst üste çalış', kind: BadgeKind.streak, threshold: 30, sortOrder: 7 },
    { key: 'first_exam', name: 'İlk Deneme', description: 'İlk canlı denemeni tamamla', kind: BadgeKind.exam, threshold: 1, sortOrder: 8 },
    { key: 'exam_5', name: 'Deneme Ustası', description: '5 canlı deneme tamamla', kind: BadgeKind.exam, threshold: 5, sortOrder: 9 },
    { key: 'accuracy_70', name: 'Keskin Nişancı', description: '100+ soruda %70 doğruluğa ulaş', kind: BadgeKind.accuracy, threshold: 70, sortOrder: 10 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, kind: b.kind, threshold: b.threshold, sortOrder: b.sortOrder },
      create: b,
    });
  }
  console.log(`Rozet kataloğu: ${badges.length} rozet.`);

  console.log('Seed tamam: roller, planlar, modüller, rozetler (+ örnek içerik + sorular) eklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
