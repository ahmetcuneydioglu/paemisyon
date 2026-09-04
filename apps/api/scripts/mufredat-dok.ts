/** SALT OKUMA: ders/konu ağacını sınıflandırıcı ajanlar için dosyaya döker. */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const dersler = await p.course.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, name: true,
      topics: {
        where: { deletedAt: null }, orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, matchKeywords: true, _count: { select: { questions: true } } },
      },
    },
  });
  const satirlar: string[] = ['# Müfredat ağacı — ders / konu (soru sayısı)\n'];
  for (const d of dersler) {
    if (!d.topics.length) continue;
    satirlar.push(`\n## ${d.name}`);
    for (const t of d.topics) {
      const ak = t.matchKeywords.length ? `  · anahtar: ${t.matchKeywords.slice(0, 6).join(', ')}` : '';
      satirlar.push(`- **${t.name}** (${t._count.questions} soru) — \`${t.id}\`${ak}`);
    }
  }
  writeFileSync(process.argv[2], satirlar.join('\n') + '\n');
  console.log(`${dersler.filter((d) => d.topics.length).length} ders · ${dersler.reduce((a, d) => a + d.topics.length, 0)} konu yazıldı`);
}
main().finally(() => p.$disconnect());
