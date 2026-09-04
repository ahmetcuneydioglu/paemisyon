/** SALT OKUMA: denetçilerin DB'ye hiç bağlanmaması için madde metinlerini dosyaya döker. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const DIZIN = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi/mevzuat';
const HEDEF = [
  { ara: 'T.C. Anayasası', dosya: 'anayasa.md' },
  { ara: '6216', dosya: '6216-aym-kanunu.md' },
  { ara: 'Avrupa İnsan Hakları Sözleşmesi', dosya: 'aihs.md' },
  { ara: '6701', dosya: '6701-tihek.md' },
  { ara: '6328', dosya: '6328-kdk.md' },
  { ara: '3686', dosya: '3686-ihik.md' },
];
async function main() {
  mkdirSync(DIZIN, { recursive: true });
  for (const h of HEDEF) {
    const k = await p.legislation.findFirst({
      where: { OR: [{ name: { contains: h.ara } }, { number: h.ara }] },
      select: { id: true, name: true, officialSourceUrl: true },
    });
    if (!k) { console.log(`✗ ${h.ara} bulunamadı`); continue; }
    const md = await p.lawArticle.findMany({
      where: { legislationId: k.id, deletedAt: null },
      select: { articleNo: true, title: true, text: true },
      orderBy: { sortKey: 'asc' },
    });
    const govde = md.map((m) => `\n## Madde ${m.articleNo}${m.title ? ` — ${m.title}` : ''}\n\n${m.text.trim()}\n`).join('');
    writeFileSync(`${DIZIN}/${h.dosya}`,
      `# ${k.name}\n\nKaynak: ${k.officialSourceUrl ?? 'mevzuat.gov.tr'} · ${md.length} madde\n${govde}`);
    console.log(`✓ ${h.dosya.padEnd(22)} ${String(md.length).padStart(3)} md`);
  }
}
main().finally(() => p.$disconnect());
