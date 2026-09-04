/**
 * Doc 33 — kurtarma önerilerini insan okuyacak biçimde gösterir (SALT OKUMA).
 *   npx tsx scripts/ih-kurtarma-goster.ts [grup] [adet]
 *   npx tsx scripts/ih-kurtarma-goster.ts C 5
 *   npx tsx scripts/ih-kurtarma-goster.ts --ozet
 */
import { readFileSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';

const asil = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-kor\.json$/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  if (!o.konu) continue;
  for (const q of o.sorular) asil.set(q.id, q);
}
const anahtar = new Map<string, string>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-anahtar\.json$/.test(x))) {
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8')))) anahtar.set(k, v as string);
}
const oneriler: any[] = [];
for (const f of readdirSync(`${KOK}/kurtarma`).filter((x) => /-oneri\.json$/.test(x))) {
  oneriler.push(...JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8')));
}
oneriler.sort((a, b) => {
  const [ab, an] = a.id.slice(1).split('-').map(Number);
  const [bb, bn] = b.id.slice(1).split('-').map(Number);
  return ab - bb || an - bn;
});

if (process.argv[2] === '--ozet') {
  const d = oneriler.reduce<Record<string, string[]>>((a, o) => ({ ...a, [o.grup]: [...(a[o.grup] ?? []), o.id] }), {});
  for (const g of ['A', 'B', 'C', 'D', 'E', 'F']) {
    if (!d[g]) continue;
    console.log(`\n${g} (${d[g].length}): ${d[g].join(' ')}`);
  }
  console.log(`\ntoplam ${oneriler.length}`);
  process.exit(0);
}

const grup = process.argv[2];
const adet = Number(process.argv[3] ?? 99);
let n = 0;
for (const o of oneriler) {
  if (grup && o.grup !== grup) continue;
  if (++n > adet) break;
  const a = asil.get(o.id);
  const eskiDogru = anahtar.get(o.id);
  const d = o.duzeltme;
  console.log(`\n${'═'.repeat(78)}\n[${o.id}] grup ${o.grup} — ${o.gerekce}`);
  if (!d) { console.log('  (düzeltme önerilmedi — insana bırakıldı)'); continue; }
  const kokDegisti = d.kok && d.kok !== a.kok;
  console.log(`\nKÖK${kokDegisti ? ' (değişti)' : ''}: ${d.kok ?? a.kok}`);
  if (kokDegisti) console.log(`   eski: ${a.kok}`);
  for (const l of ['A', 'B', 'C', 'D', 'E']) {
    const yeni = String(d.siklar?.[l] ?? a.siklar[l]);
    const eski = String(a.siklar[l]);
    const im = `${l === d.dogru ? '✓' : ' '}${l === eskiDogru && l !== d.dogru ? '×' : ' '}`;
    console.log(`  ${im} ${l}) ${yeni}${yeni !== eski ? `\n        eski: ${eski}` : ''}`);
  }
  if (d.dogru !== eskiDogru) console.log(`\n  ANAHTAR: ${eskiDogru} → ${d.dogru}`);
  if (o.degisenler?.length) for (const x of o.degisenler) console.log(`  · ${x}`);
  console.log(`\n  AÇIKLAMA: ${d.aciklama}`);
  console.log(`  KÜNYE: ${d.dayanak ?? '—'}`);
}
