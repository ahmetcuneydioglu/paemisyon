/**
 * Doc 34 — OCR onarım turunun sonuçlarını aday listesine ve partilere işler.
 *
 * Metni değişen sorular yeniden denetlenmeli: denetçi bozuk metne bakarak
 * karar vermişti. Bu script hangilerinin tekrar gerektiğini de raporlar.
 *
 *   npx tsx scripts/deneme-onarim-uygula.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/deneme-onarim-uygula.ts    # yaz
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
const APPLY = process.env.APPLY === '1';

function main() {
  const onarimlar = new Map<string, any>();
  for (const f of readdirSync(`${KOK}/onarim`).filter((x) => /-onarim\.json$/.test(x))) {
    for (const o of JSON.parse(readFileSync(`${KOK}/onarim/${f}`, 'utf8'))) onarimlar.set(o.id, o);
  }
  const aday = JSON.parse(readFileSync(`${KOK}/aday-96.json`, 'utf8'));

  const degisen: string[] = [], okunamayan: string[] = [], ayni: string[] = [];
  for (const q of aday) {
    const o = onarimlar.get(`s${q.no}`);
    if (!o) continue;
    if (o.okunamadi) { okunamayan.push(`s${q.no}`); continue; }
    const eskiMetin = q.kok + JSON.stringify(q.siklar);
    q.kok = o.kok ?? q.kok;
    if (o.siklar) q.siklar = o.siklar;
    if (eskiMetin === q.kok + JSON.stringify(q.siklar)) ayni.push(`s${q.no}`);
    else degisen.push(`s${q.no}`);
  }
  console.log(`onarım kaydı     : ${onarimlar.size}`);
  console.log(`metni DEĞİŞEN    : ${degisen.length} → ${degisen.join(' ')}`);
  console.log(`değişmeyen       : ${ayni.length}`);
  console.log(`okunamayan       : ${okunamayan.length} ${okunamayan.join(' ')}`);

  // Metni değişen sorular hangi partilerde? Onlar yeniden denetlenmeli.
  const partiler = new Map<string, string[]>();
  for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x))) {
    const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
    const parti = f.replace('-kor.json', '');
    for (const s of o.sorular) if (degisen.includes(s.id)) {
      if (!partiler.has(parti)) partiler.set(parti, []);
      partiler.get(parti)!.push(s.id);
    }
  }
  console.log('\nyeniden denetlenecek partiler:');
  for (const [p, ids] of partiler) console.log(`   ${p.padEnd(26)} ${ids.length} soru → ${ids.join(' ')}`);

  if (!APPLY) { console.log('\n(APPLY=1 ile yazılır)'); return; }
  writeFileSync(`${KOK}/aday-96.json`, JSON.stringify(aday, null, 1));
  // Parti kör dosyalarını da tazele
  for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x))) {
    const yol = `${KOK}/parti/${f}`;
    const o = JSON.parse(readFileSync(yol, 'utf8'));
    let n = 0;
    for (const s of o.sorular) {
      const q = aday.find((a: any) => `s${a.no}` === s.id);
      if (!q) continue;
      if (s.kok !== q.kok || JSON.stringify(s.siklar) !== JSON.stringify(q.siklar)) n++;
      s.kok = q.kok; s.siklar = q.siklar;
    }
    if (n) { writeFileSync(yol, JSON.stringify(o, null, 1)); console.log(`   ✓ ${f}: ${n} soru tazelendi`); }
  }
  console.log('\n✓ onarım uygulandı');
}
main();
