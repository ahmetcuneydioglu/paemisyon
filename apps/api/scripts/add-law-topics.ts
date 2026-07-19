/**
 * "Polis Mevzuatı" dersine eksik kanun konularını ekler (import otomatik eşleşsin).
 * DRY-RUN (varsayılan): ders + mevcut konuları + eksik hedefleri listeler.
 *   npx ts-node scripts/add-law-topics.ts
 * UYGULA: eksik olanları oluşturur.
 *   APPLY=1 npx ts-node scripts/add-law-topics.ts
 */
import { PrismaService } from '../src/infra/prisma/prisma.service';

// Hedef kanunlar (ad = mevcut konvansiyon "NNNN Sayılı ... Kanunu";
// matchKeywords = import eşleme desenleri, büyük/küçük harf duyarsız).
const TARGETS = [
  {
    no: '3071',
    name: '3071 Sayılı Dilekçe Kanunu',
    matchKeywords: ['3071 sayılı', 'Dilekçe Kanunu', 'dilekçe hakkı'],
  },
  {
    no: '5607',
    name: '5607 Sayılı Kaçakçılıkla Mücadele Kanunu',
    matchKeywords: ['5607 sayılı', 'Kaçakçılıkla Mücadele Kanunu', 'Kaçakçılık Kanunu'],
  },
  {
    no: '7201',
    name: '7201 Sayılı Tebligat Kanunu',
    matchKeywords: ['7201 sayılı', 'Tebligat Kanunu'],
  },
];

async function main() {
  const apply = process.env.APPLY === '1';
  const prisma = new PrismaService();
  await prisma.$connect();

  const course = await prisma.course.findFirst({
    where: { name: { contains: 'Polis Mevzuat', mode: 'insensitive' }, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!course) {
    console.error('"Polis Mevzuatı" dersi bulunamadı.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Ders: "${course.name}" (${course.id})\n`);

  const topics = await prisma.topic.findMany({
    where: { courseId: course.id, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, parentId: true, isPremium: true, sortOrder: true, matchKeywords: true },
  });
  console.log(`Mevcut ${topics.length} konu (Polis Mevzuatı):`);
  for (const t of topics) {
    console.log(
      `  [${t.parentId ? 'alt' : 'üst'}${t.isPremium ? ' 🔒' : ''}] "${t.name}"  kw=${JSON.stringify(t.matchKeywords)}`,
    );
  }

  // Eksik hedefleri bul (numarayı ada göre eşle).
  const missing = TARGETS.filter(
    (tg) => !topics.some((t) => t.name.includes(tg.no)),
  );
  console.log(`\nHedeflerden EKSİK olanlar: ${missing.length}/${TARGETS.length}`);
  const maxSort = topics.reduce((m, t) => Math.max(m, t.sortOrder), 0);
  missing.forEach((m, i) =>
    console.log(`  + "${m.name}"  (sortOrder ${maxSort + 1 + i})  kw=${JSON.stringify(m.matchKeywords)}`),
  );
  if (missing.length === 0) console.log('  (hepsi zaten var — ekleme yok)');

  if (!apply) {
    console.log('\n(DRY-RUN) Eklemek için: APPLY=1 npx ts-node scripts/add-law-topics.ts');
    await prisma.$disconnect();
    return;
  }

  for (let i = 0; i < missing.length; i++) {
    const m = missing[i];
    const created = await prisma.topic.create({
      data: {
        courseId: course.id,
        parentId: null, // üst-düzey kanun konusu (mevcut kanunlarla aynı)
        name: m.name,
        sortOrder: maxSort + 1 + i,
        isPremium: false,
        matchKeywords: m.matchKeywords,
      },
      select: { id: true, name: true },
    });
    console.log(`  ✓ oluşturuldu: "${created.name}" (${created.id})`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Hata:', e instanceof Error ? e.message : e);
  process.exit(1);
});
