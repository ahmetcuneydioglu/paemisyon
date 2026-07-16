/**
 * Doc 21 EK — bölümsüz (müfredata bağlı olmayan) faydasız dersleri içindeki
 * konular ve sorularla birlikte SOFT-DELETE eder. Kullanıcı talebi.
 *
 * Neden soft-delete: tüm sorgular deletedAt:null filtreler → her yerden kaybolur
 * ("komple silinmiş" görünür), ama geçmiş quiz cevapları / FK bütünlüğü bozulmaz
 * ve gerekirse geri alınabilir (Deneme E2E Dersi'nde 8 geçmiş cevap tespit edildi).
 *
 * Çalıştırma: npx ts-node scripts/delete-orphan-courses.ts
 */
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL as string;
const url = base + (base.includes('?') ? '&' : '?') + 'connection_limit=1';
const prisma = new PrismaClient({ datasources: { db: { url } } });

const TARGET_COURSES = [
  'Memur ve Kamu Mevzuatı',
  'Adli ve İdari Yazı İşleri Mevzuatı',
  'Türkçe',
  'A.Ö.F',
  'Deneme E2E Dersi',
];

async function main() {
  // GÜVENLİK: yalnız müfredata BAĞLI OLMAYAN (bölümsüz) dersleri hedefle.
  const courses = await prisma.course.findMany({
    where: { name: { in: TARGET_COURSES }, deletedAt: null },
    include: {
      sections: { select: { sectionId: true } },
      topics: { where: { deletedAt: null }, select: { id: true } },
    },
  });

  const qBefore = await prisma.question.count({ where: { deletedAt: null } });
  const now = new Date();
  const report: { course: string; topics: number; questions: number }[] = [];
  const backup: unknown[] = [];

  await prisma.$transaction(async (tx) => {
    for (const c of courses) {
      if (c.sections.length > 0) {
        console.log(`⚠ ATLANDI (bir bölüme bağlı): ${c.name}`);
        continue;
      }
      const topicIds = c.topics.map((t) => t.id);
      const qs = topicIds.length
        ? await tx.question.findMany({ where: { topicId: { in: topicIds }, deletedAt: null }, select: { id: true } })
        : [];
      const qIds = qs.map((q) => q.id);

      backup.push({ courseId: c.id, name: c.name, topicIds, questionIds: qIds });

      if (qIds.length) {
        await tx.question.updateMany({ where: { id: { in: qIds } }, data: { deletedAt: now } });
      }
      if (topicIds.length) {
        await tx.topic.updateMany({ where: { id: { in: topicIds } }, data: { deletedAt: now } });
      }
      await tx.course.update({ where: { id: c.id }, data: { deletedAt: now } });
      report.push({ course: c.name, topics: topicIds.length, questions: qIds.length });
    }
  });

  const backupPath = `/tmp/orphan-courses-deleted-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  const qAfter = await prisma.question.count({ where: { deletedAt: null } });
  console.log('\nSilinen dersler:');
  for (const r of report) console.log(`  🗑 ${r.course}: ${r.topics} konu, ${r.questions} soru`);
  const totalQ = report.reduce((s, r) => s + r.questions, 0);
  console.log(`\nAktif soru: ${qBefore} → ${qAfter} (${totalQ} soru soft-delete edildi)`);
  console.log('Yedek (geri alma için):', backupPath);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
