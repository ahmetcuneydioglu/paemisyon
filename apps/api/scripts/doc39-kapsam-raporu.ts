/**
 * Doc 39 — beş polis mevzuatı kanununun banka kapsamını madde madde döker.
 * Doc 39 türetimi ve daha önceden bankada olan sorular ayrı sütunlarda gösterilir.
 * Çıktı hem konsola özet, hem dosyaya tam tablo.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const KANUNLAR = ['3201', '7068', '5901', '5682', '2911'];
const p = new PrismaClient();

function sirala(a: string) {
  const m = a.match(/^(Ek|Geçici)?\s*(\d+)/i);
  const grup = /geçici/i.test(a) ? 2 : /ek/i.test(a) ? 1 : 0;
  return grup * 10000 + (m ? Number(m[2]) : 9999);
}

(async () => {
  const satirlar: string[] = ['# Polis mevzuatı — banka kapsamı (madde madde)\n'];
  for (const no of KANUNLAR) {
    const leg = await p.legislation.findFirst({ where: { number: no } });
    if (!leg?.topicId) continue;
    const qs = await p.question.findMany({
      where: { topicId: leg.topicId, deletedAt: null },
      select: { articleNo: true, versions: { select: { sourceLabel: true }, take: 1 } },
    });
    const mad = await p.lawArticle.findMany({
      where: { legislationId: leg.id, deletedAt: null },
      select: { articleNo: true, title: true },
    });
    const baslik = new Map(mad.map((m) => [m.articleNo, m.title ?? '']));
    const say = new Map<string, [number, number]>();
    for (const q of qs) {
      const a = q.articleNo ?? '(künyesiz)';
      const c = say.get(a) ?? [0, 0];
      if (q.versions[0]?.sourceLabel?.startsWith('Mevzuat türetimi')) c[0]++; else c[1]++;
      say.set(a, c);
    }
    const top = qs.length;
    const d39 = [...say.values()].reduce((s, c) => s + c[0], 0);
    console.log(`${(leg.shortName ?? no).padEnd(6)} ${no}  toplam ${String(top).padStart(3)}  (Doc 39: ${d39}, önceki: ${top - d39})  · ${say.size} madde`);
    satirlar.push(`\n## ${no} — ${leg.name ?? ''}\n`);
    satirlar.push(`Toplam **${top}** soru · ${say.size} madde · Doc 39 türetimi ${d39}, önceki banka ${top - d39}\n`);
    satirlar.push('| Madde | Başlık | Doc 39 | Önceki | Toplam |');
    satirlar.push('|---|---|---:|---:|---:|');
    for (const [a, [x, y]] of [...say].sort((u, v) => sirala(u[0]) - sirala(v[0])))
      satirlar.push(`| ${a} | ${(baslik.get(a) ?? '').slice(0, 60)} | ${x} | ${y} | ${x + y} |`);
  }
  const yol = 'docs/39-polis-mevzuati-soru-uretimi/rapor/kapsam.md';
  writeFileSync(yol, satirlar.join('\n') + '\n', 'utf8');
  console.log(`\ntam tablo: ${yol}`);
})().finally(() => p.$disconnect());
