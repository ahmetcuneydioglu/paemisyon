/** Beş polis kanununda 4 şıklı kalan soruları döker (beşinci şık tamamlaması için). */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const legs = await p.legislation.findMany({
    where: { number: { in: ['3201','7068','5901','5682','2911'] } },
    select: { number: true, topicId: true },
  });
  const out: string[] = [];
  for (const l of legs) {
    const qs = await p.question.findMany({
      where: { topicId: l.topicId!, deletedAt: null },
      select: {
        id: true, articleNo: true,
        versions: {
          where: { status: { in: ['published','in_review'] } },
          select: { id: true, stem: true, status: true, sourceLabel: true,
            options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } },
          orderBy: { versionNo: 'desc' }, take: 1,
        },
      },
    });
    for (const q of qs) {
      const v = q.versions[0];
      if (!v || v.options.length === 5) continue;
      out.push(`### ${l.number} | md ${q.articleNo ?? '?'} | versionId=${v.id} | ${v.status}`);
      out.push(v.stem);
      for (const o of v.options) out.push(`   ${o.label}) ${o.text}${o.isCorrect ? '  ✔' : ''}`);
      out.push('');
    }
  }
  const yol = 'docs/39-polis-mevzuati-soru-uretimi/rapor/dort-sikli.md';
  writeFileSync(yol, out.join('\n'), 'utf8');
  console.log(`${out.filter((x) => x.startsWith('### ')).length} soru → ${yol}`);
})().finally(() => p.$disconnect());
