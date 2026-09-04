/**
 * Resmî madde metni sorgulama (SALT OKUMA) — denetçi ajanların tek kaynağı.
 *
 * Denetçi soruyu okur, dayanağı buradan çeker; bağlamına tüm kanunu almaz.
 *
 *   npx tsx scripts/madde-ara.ts --kanun Anayasa --md 148
 *   npx tsx scripts/madde-ara.ts --kanun 6216 --ara "bireysel başvuru"
 *   npx tsx scripts/madde-ara.ts --liste
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const arg = (ad: string) => {
  const i = argv.indexOf(`--${ad}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

async function main() {
  if (argv.includes('--liste')) {
    const hepsi = await prisma.legislation.findMany({
      select: { name: true, number: true, _count: { select: { articles: true } } },
      orderBy: { name: 'asc' },
    });
    for (const l of hepsi.filter((x) => x._count.articles > 0)) {
      console.log(`${String(l.number ?? '-').padEnd(6)} ${l.name}  (${l._count.articles} md)`);
    }
    return;
  }

  const kanun = arg('kanun');
  if (!kanun) { console.error('--kanun gerekli (ör. --kanun Anayasa | --kanun 6216)'); process.exit(1); }
  const mevzuat = await prisma.legislation.findFirst({
    where: { OR: [{ name: { contains: kanun, mode: 'insensitive' } }, { number: kanun }] },
    select: { id: true, name: true, number: true },
  });
  if (!mevzuat) { console.error(`bulunamadı: ${kanun}`); process.exit(1); }

  const md = arg('md');
  const ara = arg('ara');
  const maddeler = await prisma.lawArticle.findMany({
    where: {
      legislationId: mevzuat.id,
      deletedAt: null,
      ...(md ? { articleNo: md } : {}),
      ...(ara ? { text: { contains: ara, mode: 'insensitive' } } : {}),
    },
    select: { articleNo: true, title: true, text: true, sourceUrl: true, effectiveInfo: true, status: true },
    orderBy: { sortKey: 'asc' },
    take: md ? 5 : 25,
  });

  console.log(`# ${mevzuat.name}${mevzuat.number ? ` (${mevzuat.number})` : ''} — ${maddeler.length} sonuç\n`);
  for (const m of maddeler) {
    console.log(`── Madde ${m.articleNo}${m.title ? ` — ${m.title}` : ''} [${m.status}]`);
    console.log(md ? m.text : m.text.slice(0, 400) + (m.text.length > 400 ? ' …' : ''));
    if (md && m.effectiveInfo) console.log(`(yürürlük: ${m.effectiveInfo})`);
    console.log();
  }
  if (!md && maddeler.length === 0) console.log('(eşleşme yok — farklı bir anahtar kelime dene)');
}
main().finally(() => prisma.$disconnect());
