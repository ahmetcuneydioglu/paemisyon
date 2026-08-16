/**
 * Soru bankasında PDF ligatür/kodlama artıklarını tarar (ör. "haŌa" = ft
 * ligatürünün Ō'ya çözülmesi). Beklenen Türkçe karakter kümesi dışındaki her
 * karakteri sıklık + örnek bağlamla raporlar. Salt okunur.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OK =
  /[a-zA-Z0-9çÇğĞıİöÖşŞüÜâÂîÎûÛ\s.,;:!?'"()[\]{}%&+\-–—*/\\<>=«»“”‘’…·•|^~€$£#@_°²³§]/u;

async function main() {
  const rows = await prisma.questionVersion.findMany({
    select: {
      id: true,
      stem: true,
      explanation: true,
      question: { select: { deletedAt: true } },
      options: { select: { id: true, text: true } },
    },
  });
  const freq = new Map<string, number>();
  const sample = new Map<string, string>();
  const scan = (t: string | null, where: string) => {
    if (!t) return;
    for (const ch of t) {
      if (!OK.test(ch)) {
        freq.set(ch, (freq.get(ch) ?? 0) + 1);
        if (!sample.has(ch)) {
          const i = t.indexOf(ch);
          sample.set(
            ch,
            `${where}: …${t.slice(Math.max(0, i - 30), i + 30).replace(/\n/g, ' ')}…`,
          );
        }
      }
    }
  };
  let live = 0;
  for (const r of rows) {
    if (r.question.deletedAt) continue;
    live++;
    scan(r.stem, `stem ${r.id.slice(0, 8)}`);
    scan(r.explanation, `expl ${r.id.slice(0, 8)}`);
    for (const o of r.options) scan(o.text, `opt ${o.id.slice(0, 8)}`);
  }
  console.log(`canlı versiyon: ${live}/${rows.length}`);
  for (const [ch, n] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
    const cp = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
    console.log(`${JSON.stringify(ch)} U+${cp} ×${n} | ${sample.get(ch)}`);
  }
  if (freq.size === 0) console.log('artık karakter yok');
  await prisma.$disconnect();
}
main();
