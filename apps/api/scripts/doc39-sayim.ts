import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const v = await p.questionVersion.findMany({
    where: { sourceLabel: { startsWith: 'Mevzuat türetimi' }, question: { deletedAt: null } },
    select: { sourceLabel: true, status: true },
  });
  const say: Record<string, Record<string, number>> = {};
  for (const x of v) {
    const k = (x.sourceLabel ?? '').replace(/^Mevzuat türetimi — /, '').split(' md')[0];
    (say[k] ??= {})[x.status] = ((say[k] ??= {})[x.status] ?? 0) + 1;
  }
  console.table(say);
  console.log('TOPLAM', v.length);
})().finally(() => p.$disconnect());
