/**
 * Doc 57 — ders "soru" bloğu eşlemesi için SALT OKUNUR arama: bir derste yayındaki soruları gövde
 * anahtar sözcüğüyle listeler; bulunan id `:::soru <id>` yönergesine yazılır.
 *
 *   cd apps/api && npx ts-node scripts/ders-soru-ara.ts "Anayasa Hukuku" "kurucu iktidar" "Sened-i İttifak"
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const [ders, ...terimler] = process.argv.slice(2);
if (!ders || terimler.length === 0) {
  console.error('kullanım: ders-soru-ara.ts "<ders adı>" "<terim>" ["<terim>" …]');
  process.exit(2);
}
const raw = process.env.DATABASE_URL ?? '';
const url = raw.includes('connection_limit')
  ? raw.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${raw}${raw.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });
(async () => {
  for (const terim of terimler) {
    const rows = await prisma.question.findMany({
      where: {
        deletedAt: null,
        topic: { course: { name: ders } },
        currentVersion: { status: 'published', stem: { contains: terim, mode: 'insensitive' } },
      },
      select: {
        id: true,
        articleNo: true,
        topic: { select: { name: true } },
        currentVersion: { select: { stem: true, sourceLabel: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 8,
    });
    console.log(`\n### ${terim} (${rows.length})`);
    for (const r of rows)
      console.log(
        `${r.id} | ${r.topic.name}${r.articleNo ? ` md ${r.articleNo}` : ''} | ${r.currentVersion?.sourceLabel ?? '-'} | ${r.currentVersion?.stem.replace(/\s+/g, ' ').slice(0, 150)}`,
      );
  }
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
