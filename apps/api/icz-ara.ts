import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
(async () => {
  const leg = await p.legislation.findFirst({ where: { number: arg('--kanun')!, deletedAt: null }, select: { topicId: true } });
  const arts = await p.lawArticle.findMany({ where: { topicId: leg!.topicId!, deletedAt: null, status: 'published' }, select: { articleNo: true, text: true } });
  const re = new RegExp(arg('--re')!, 'i');
  for (const a of arts) if (re.test(a.text)) {
    for (const ln of a.text.split('\n')) if (re.test(ln)) console.log(`m.${a.articleNo}: ${ln.trim()}`);
  }
})().finally(() => p.$disconnect());
