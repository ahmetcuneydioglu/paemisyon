/** Doc 39 — beş polis mevzuatı kanununun banka durumu: sayı, yayın durumu, zorluk, şık sayısı. */
import { PrismaClient } from '@prisma/client';
const KANUNLAR = ['3201', '7068', '5901', '5682', '2911'];
const p = new PrismaClient();
(async () => {
  let gt = 0, gy = 0, gk = 0, gd = 0, g4 = 0;
  const zor: Record<string, number> = {};
  console.log('kanun                         toplam  yayında  kuyrukta   Doc39  önceki   easy/med/hard   4şık');
  console.log('─'.repeat(100));
  for (const no of KANUNLAR) {
    const leg = await p.legislation.findFirst({ where: { number: no } });
    if (!leg?.topicId) continue;
    const qs = await p.question.findMany({
      where: { topicId: leg.topicId, deletedAt: null },
      select: {
        currentVersionId: true,
        versions: {
          where: { status: { in: ['published', 'in_review'] } },
          select: { status: true, difficulty: true, sourceLabel: true, _count: { select: { options: true } } },
          orderBy: { versionNo: 'desc' }, take: 1,
        },
      },
    });
    const v = qs.map((q) => q.versions[0]).filter(Boolean);
    const yayin = v.filter((x) => x!.status === 'published').length;
    const kuyruk = v.filter((x) => x!.status === 'in_review').length;
    const d39 = v.filter((x) => x!.sourceLabel?.startsWith('Mevzuat türetimi')).length;
    const z = { easy: 0, medium: 0, hard: 0 } as Record<string, number>;
    for (const x of v) z[x!.difficulty] = (z[x!.difficulty] ?? 0) + 1;
    for (const k of Object.keys(z)) zor[k] = (zor[k] ?? 0) + z[k];
    const dortluk = v.filter((x) => x!._count.options !== 5).length;
    gt += v.length; gy += yayin; gk += kuyruk; gd += d39; g4 += dortluk;
    console.log(
      `${(leg.shortName ?? no).padEnd(8)}${no.padEnd(22)}${String(v.length).padStart(5)}${String(yayin).padStart(9)}${String(kuyruk).padStart(10)}${String(d39).padStart(8)}${String(v.length - d39).padStart(8)}   ${String(z.easy).padStart(3)}/${String(z.medium).padStart(3)}/${String(z.hard).padStart(3)}${String(dortluk).padStart(7)}`,
    );
  }
  console.log('─'.repeat(100));
  console.log(`${'TOPLAM'.padEnd(30)}${String(gt).padStart(5)}${String(gy).padStart(9)}${String(gk).padStart(10)}${String(gd).padStart(8)}${String(gt - gd).padStart(8)}   ${String(zor.easy).padStart(3)}/${String(zor.medium).padStart(3)}/${String(zor.hard).padStart(3)}${String(g4).padStart(7)}`);
})().finally(() => p.$disconnect());
