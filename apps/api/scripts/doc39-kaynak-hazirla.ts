/**
 * Bir mevzuat için üretim malzemesini hazırlar:
 *   mevzuat/<ad>.txt              — madde metinleri (tek hukuki kaynak)
 *   mevzuat/<ad>-mevcut-sorular.txt — o konudaki BÜTÜN banka soruları, şıklarıyla
 * İkincisi hem mükerrer tabanı hem stil referansıdır.
 *   npx tsx apps/api/scripts/doc39-kaynak-hazirla.ts <kanun-no|slug> <dosya-adi>
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const [hedef, ad] = process.argv.slice(2);
  if (!hedef || !ad) throw new Error('kullanım: … <kanun-no|slug> <dosya-adi>');
  const leg = await p.legislation.findFirstOrThrow({
    where: hedef.match(/^\d+$/) ? { number: hedef } : { slug: hedef },
    select: { id: true, topicId: true, name: true },
  });
  const D = 'docs/39-polis-mevzuati-soru-uretimi/mevzuat';

  const a = await p.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null, status: 'published' },
    select: { articleNo: true, title: true, text: true }, orderBy: { sortKey: 'asc' },
  });
  writeFileSync(`${D}/${ad}.txt`,
    a.map((x) => `### MADDE ${x.articleNo}${x.title ? ' — ' + x.title : ''}\n${x.text ?? ''}`).join('\n\n') + '\n', 'utf8');

  const v = await p.questionVersion.findMany({
    where: { question: { topicId: leg.topicId!, deletedAt: null }, status: { in: ['published', 'in_review'] } },
    select: { stem: true, question: { select: { articleNo: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } },
  });
  writeFileSync(`${D}/${ad}-mevcut-sorular.txt`,
    v.map((x) => `[md ${x.question.articleNo ?? '?'}] ${x.stem}\n` +
      x.options.map((o) => `   ${o.label}) ${o.text}${o.isCorrect ? '  ✔' : ''}`).join('\n')).join('\n\n') + '\n', 'utf8');
  console.log(`${leg.name}: ${a.length} madde · ${v.length} mevcut soru → ${D}/${ad}{,-mevcut-sorular}.txt`);
})().finally(() => p.$disconnect());
