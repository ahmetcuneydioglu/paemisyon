/**
 * Tek seferlik backfill (Doc 20 EK 2): mevcut soruların EN SON sürümüne
 * contentHash yazar. Aksi halde eski sorular tekrar (mükerrer) tespitine
 * görünmez. Idempotent — contentHash'i dolu olanlar atlanır.
 *
 * Çalıştırma (backend KAPALIYKEN, pooler boşken):
 *   npx ts-node scripts/backfill-content-hash.ts
 */
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

async function main() {
  const url =
    process.env.DATABASE_URL! +
    (process.env.DATABASE_URL!.includes('?') ? '&' : '?') +
    'connection_limit=1';
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  const questions = await prisma.question.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      versions: {
        orderBy: { versionNo: 'desc' },
        take: 1,
        select: {
          id: true,
          stem: true,
          contentHash: true,
          options: { select: { text: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  for (const q of questions) {
    const v = q.versions[0];
    if (!v) continue;
    if (v.contentHash) {
      skipped++;
      continue;
    }
    const hash = questionFingerprint(v.stem, v.options.map((o) => o.text));
    await prisma.questionVersion.update({ where: { id: v.id }, data: { contentHash: hash } });
    updated++;
  }

  console.log(`Backfill tamam: ${updated} güncellendi, ${skipped} zaten dolu, ${questions.length} soru tarandı.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
