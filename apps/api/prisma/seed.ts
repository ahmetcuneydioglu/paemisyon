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

  // Modüller (Doc 2 + Doc 20 hedef seçimi): platform çok-modüllü; şimdilik
  // yalnız PAEM + Misyon yayında. POMEM/PMYO kaldırıldı (isActive=false —
  // veri silinmez, katalog uçları isActive filtreler; ileride açılabilir).
  const modules = [
    {
      key: 'paem',
      name: 'PAEM',
      description: 'Polis Amirleri Eğitim Merkezi · Komiser yardımcılığı hazırlığı',
      sortOrder: 1,
      isActive: true,
    },
    {
      key: 'misyon',
      name: 'Misyon',
      description: 'Misyon koruma sınavı hazırlığı',
      sortOrder: 2,
      isActive: true,
    },
    { key: 'pomem', name: 'POMEM', description: null, sortOrder: 3, isActive: false },
    { key: 'pmyo', name: 'PMYO', description: null, sortOrder: 4, isActive: false },
  ];
  for (const m of modules) {
    await prisma.examType.upsert({
      where: { key: m.key },
      update: {
        name: m.name,
        description: m.description,
        sortOrder: m.sortOrder,
        isActive: m.isActive,
      },
      create: { ...m },
    });
  }

  // NOT (Doc 21): Ders/konu/soru İÇERİĞİ artık seed'de ÜRETİLMEZ. İçerik
  // migrate-content-tree.ts + admin İçerik Ağacı paneli + gerçek PDF/CSV
  // içe aktarımlarıyla yönetilir. (Eski Doc 20 taksonomisi ve dev örnek içerik
  // blokları kaldırıldı; tekrar çalıştırıldığında silinmiş dersleri diriltmesin.)

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

  // Uygulama ayarları — varsayılanlar (panelden değiştirilir).
  await prisma.appSetting.upsert({
    where: { key: 'show_question_source' },
    update: {},
    create: { key: 'show_question_source', value: 'true' },
  });

  console.log('Seed tamam: roller, planlar, sınav türleri, rozetler, ayarlar. (İçerik seed edilmez — Doc 21.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
