/**
 * Doc 34 — "onarilan" partisinin denetim sonuçlarını asıl parti dosyalarına işler.
 *
 * OCR metni onarılan sorular kendi partilerinde BOZUK metinle denetlenmişti;
 * onarilan-d{1,2}.json temiz metinle yeniden denetledi. Bu script o kayıtları
 * ilgili partinin d1/d2 dosyasında ÜZERİNE YAZAR.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

const partiOf = new Map<string, string>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x) && !x.startsWith('onarilan'))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  for (const s of o.sorular) partiOf.set(s.id, f.replace('-kor.json', ''));
}

const TUR = process.argv[2] ?? 'onarilan';
for (const k of ['d1', 'd2'] as const) {
  const yol = `${KOK}/denetim/${TUR}-${k}.json`;
  if (!existsSync(yol)) { console.log(`onarilan-${k}.json yok — atlandı`); continue; }
  const kayitlar = JSON.parse(readFileSync(yol, 'utf8'));
  const gruplar = new Map<string, any[]>();
  for (const r of kayitlar) {
    const parti = partiOf.get(r.id);
    if (!parti) { console.log(`⚠ ${r.id} hangi partide bilinmiyor`); continue; }
    if (!gruplar.has(parti)) gruplar.set(parti, []);
    gruplar.get(parti)!.push(r);
  }
  for (const [parti, rs] of gruplar) {
    const hedef = `${KOK}/denetim/${parti}-${k}.json`;
    if (!existsSync(hedef)) { console.log(`⚠ ${hedef} yok`); continue; }
    const mevcut = JSON.parse(readFileSync(hedef, 'utf8'));
    let n = 0;
    for (const r of rs) {
      const i = mevcut.findIndex((x: any) => x.id === r.id);
      if (i < 0) { console.log(`⚠ ${parti}-${k} içinde ${r.id} yok`); continue; }
      mevcut[i] = r; n++;
    }
    writeFileSync(hedef, JSON.stringify(mevcut, null, 1));
    console.log(`✓ ${parti}-${k}: ${n} kayıt güncellendi (${rs.map((x) => x.id).join(' ')})`);
  }
}
