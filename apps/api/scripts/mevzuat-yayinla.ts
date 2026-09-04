/**
 * Taslak mevzuatı yayına alır (kanun + maddeleri birlikte).
 *
 * Madde metni resmî PDF'ten kimlik doğrulamasıyla geldiği için yayın kararı
 * içerik kararı değil, görünürlük kararıdır. Yine de kuru çalışma varsayılan.
 *
 *   npx tsx scripts/mevzuat-yayinla.ts <slug|no> [...]
 *   APPLY=1 npx tsx scripts/mevzuat-yayinla.ts 2860 5188 ...
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1';

async function main() {
  const hedefler = process.argv.slice(2);
  if (!hedefler.length) throw new Error('slug ya da kanun numarası ver');
  console.log(APPLY ? 'MOD: YAYINLA' : 'MOD: KURU ÇALIŞMA');

  for (const h of hedefler) {
    const l = await prisma.legislation.findFirst({
      where: { OR: [{ slug: h }, { number: h }, { name: { contains: h } }] },
      select: { id: true, name: true, status: true, topicId: true, _count: { select: { articles: true } } },
    });
    if (!l) { console.log(`✗ bulunamadı: ${h}`); continue; }
    const taslakMd = await prisma.lawArticle.count({ where: { legislationId: l.id, status: 'draft', deletedAt: null } });
    console.log(`\n── ${l.name}`);
    console.log(`   kanun durumu: ${l.status} · madde: ${l._count.articles} (taslak ${taslakMd})`);
    if (l.status === 'published' && taslakMd === 0) { console.log('   zaten yayında'); continue; }
    if (!APPLY) { console.log('   → yayınlanacak'); continue; }
    await prisma.$transaction(async (tx) => {
      await tx.legislation.update({ where: { id: l.id }, data: { status: 'published', lastVerifiedAt: new Date() } });
      const r = await tx.lawArticle.updateMany({
        where: { legislationId: l.id, deletedAt: null, status: { not: 'published' } },
        data: { status: 'published', lastVerifiedAt: new Date() },
      });
      console.log(`   ✓ yayınlandı — kanun + ${r.count} madde`);
    });
  }
}
main().finally(() => prisma.$disconnect());
