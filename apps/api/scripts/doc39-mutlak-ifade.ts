/**
 * Doc 39 — "mutlak ifadeli şık asla doğru olmaz" kalıbını ölçer.
 *
 * 7068-p3 kalite denetçisi bu kalıbı 37 soruda 12/12 buldu: mutlak ifade
 * taşıyan her şık çeldiriciydi. Böyle bir kalıp sömürülebilir — hükmü
 * bilmeyen aday, mutlak ifadeli şıkları eleyerek doğruya yaklaşır. Ölçüm
 * bankadaki bütün Doc 39 soruları üzerinden yapılır; oran şans düzeyinin
 * (%20) belirgin altındaysa üretici brief'ine kural girer.
 */
import { PrismaClient } from '@prisma/client';
const MUTLAK = /\b(yalnız|yalnızca|sadece|hiçbir|hiç bir|her hâlde|her halde|mutlaka|tamamen|asla|kesinlikle|daima|her zaman)\b/i;
const p = new PrismaClient();
(async () => {
  const v = await p.questionVersion.findMany({
    where: { sourceLabel: { startsWith: 'Mevzuat türetimi' }, question: { deletedAt: null } },
    select: { sourceLabel: true, options: { select: { text: true, isCorrect: true } } },
  });
  let dogru = 0, celdirici = 0;
  const kanun = new Map<string, [number, number]>();
  for (const x of v) {
    const k = (x.sourceLabel ?? '').replace(/^Mevzuat türetimi — /, '').split(' md')[0];
    for (const o of x.options) {
      if (!MUTLAK.test(o.text)) continue;
      const c = kanun.get(k) ?? [0, 0];
      if (o.isCorrect) { dogru++; c[0]++; } else { celdirici++; c[1]++; }
      kanun.set(k, c);
    }
  }
  const t = dogru + celdirici;
  console.log(`Doc 39 sorusu: ${v.length}  ·  mutlak ifadeli şık: ${t}`);
  console.log(`  DOĞRU cevap olan : ${dogru}  (%${(100 * dogru / t).toFixed(1)})`);
  console.log(`  çeldirici olan   : ${celdirici}  (%${(100 * celdirici / t).toFixed(1)})`);
  console.log(`  şans düzeyi %20 olurdu (5 şıkta 1 doğru)\n`);
  for (const [k, [d, c]] of [...kanun].sort())
    console.log(`  ${k.padEnd(20)} doğru ${String(d).padStart(3)} · çeldirici ${String(c).padStart(3)}  → %${(100 * d / (d + c)).toFixed(1)}`);
})().finally(() => p.$disconnect());
// Soru düzeyinde: kaç soruda en az bir mutlak ifadeli şık var ve o soruların
// kaçında doğru cevap mutlak ifadeli? Adayın eleme kazancı buradan okunur.
