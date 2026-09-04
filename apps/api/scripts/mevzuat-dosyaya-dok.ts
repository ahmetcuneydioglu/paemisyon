/**
 * SALT OKUMA: madde metinlerini dosyaya döker — denetçi ajanlar DB'ye bağlanmasın.
 *
 * Bağlantı havuzu (15 slot) canlı kullanıcılarla ORTAK; paralel ajanlar havuzu
 * tüketirse gerçek kullanıcı 500 alır. Bu yüzden denetim hattında madde metni
 * dosyadan okunur (grep/sed), Prisma'dan değil.
 *
 *   npx tsx scripts/mevzuat-dosyaya-dok.ts <hedefDizin> [kanunNo|ad ...]
 *   # argüman verilmezse madde metni olan TÜM mevzuat dökülür
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const slugla = (s: string) =>
  s.toLocaleLowerCase('tr-TR')
    .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

async function main() {
  const dizin = process.argv[2];
  const istenen = process.argv.slice(3);
  mkdirSync(dizin, { recursive: true });

  const hepsi = await p.legislation.findMany({
    select: { id: true, name: true, number: true, officialSourceUrl: true, _count: { select: { articles: true } } },
  });
  const hedef = hepsi.filter((l) => {
    if (l._count.articles === 0) return false;
    if (!istenen.length) return true;
    return istenen.some((x) => l.number === x || l.name.toLocaleLowerCase('tr-TR').includes(x.toLocaleLowerCase('tr-TR')));
  });

  const indeks: string[] = ['# Elde olan resmî metinler\n'];
  for (const l of hedef) {
    const md = await p.lawArticle.findMany({
      where: { legislationId: l.id, deletedAt: null },
      select: { articleNo: true, title: true, text: true },
      orderBy: { sortKey: 'asc' },
    });
    const dosya = `${l.number ? l.number + '-' : ''}${slugla(l.name)}.md`;
    const govde = md.map((m) => `\n## Madde ${m.articleNo}${m.title ? ` — ${m.title}` : ''}\n\n${m.text.trim()}\n`).join('');
    writeFileSync(`${dizin}/${dosya}`, `# ${l.name}\n\nKaynak: ${l.officialSourceUrl ?? 'mevzuat.gov.tr'} · ${md.length} madde\n${govde}`);
    indeks.push(`- \`${dosya}\` — ${l.name} (${md.length} md)`);
    console.log(`✓ ${dosya.padEnd(52)} ${String(md.length).padStart(4)} md`);
  }
  writeFileSync(`${dizin}/00-INDEKS.md`, indeks.join('\n') + '\n');
  console.log(`\n${hedef.length} kanun dökümü → ${dizin}`);
}
main().finally(() => p.$disconnect());
