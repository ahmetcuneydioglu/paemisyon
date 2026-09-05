/**
 * Doc 34 — kurtarma önerilerini okunur biçimde gösterir (SALT OKUMA).
 *   npx tsx scripts/deneme-kurtarma-goster.ts --ozet
 *   npx tsx scripts/deneme-kurtarma-goster.ts C 5
 */
import { readFileSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

const asil = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x) && !/^(onarilan2?|hakem)-/.test(x)))
  for (const s of JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8')).sorular) asil.set(s.id, s);
const anahtar = new Map<string, string>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-anahtar\.json$/.test(x)))
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8')))) anahtar.set(k, v as string);

const oneriler: any[] = [];
for (const f of readdirSync(`${KOK}/kurtarma`).filter((x) => /-oneri\.json$/.test(x)))
  oneriler.push(...JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8')));
oneriler.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

if (process.argv[2] === '--ozet') {
  const d = oneriler.reduce<Record<string, string[]>>((a, o) => ({ ...a, [o.grup]: [...(a[o.grup] ?? []), o.id] }), {});
  for (const g of ['A', 'B', 'C', 'D', 'E', 'F']) if (d[g]) console.log(`\n${g} (${d[g].length}): ${d[g].join(' ')}`);
  console.log(`\ntoplam ${oneriler.length}`);
  process.exit(0);
}
const grup = process.argv[2];
let n = 0;
for (const o of oneriler) {
  if (grup && o.grup !== grup) continue;
  if (++n > Number(process.argv[3] ?? 99)) break;
  const a = asil.get(o.id), eski = anahtar.get(o.id), d = o.duzeltme;
  console.log(`\n${'═'.repeat(76)}\n[${o.id}] grup ${o.grup} — ${o.gerekce}`);
  if (!d) { console.log('  (düzeltme önerilmedi — insana bırakıldı)'); continue; }
  const kokDegisti = d.kok && d.kok !== a.kok;
  console.log(`\nKÖK${kokDegisti ? ' (değişti)' : ''}: ${d.kok ?? a.kok}`);
  if (kokDegisti) console.log(`   eski: ${a.kok}`);
  for (const l of ['A', 'B', 'C', 'D', 'E']) {
    const yeni = String(d.siklar?.[l] ?? a.siklar[l]), esk = String(a.siklar[l]);
    const im = `${l === d.dogru ? '✓' : ' '}${l === eski && l !== d.dogru ? '×' : ' '}`;
    console.log(`  ${im} ${l}) ${yeni}${yeni !== esk ? `\n        eski: ${esk}` : ''}`);
  }
  if (d.dogru !== eski) console.log(`\n  ANAHTAR: ${eski} → ${d.dogru}`);
  for (const x of o.degisenler ?? []) console.log(`  · ${x}`);
  console.log(`\n  AÇIKLAMA: ${d.aciklama}`);
  console.log(`  KÜNYE: ${d.dayanak ?? '—'}`);
}
