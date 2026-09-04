/**
 * Doc 34 — iki hakemin kararlarını birleştirir; ancak MUTABIKSA bağlayıcıdır.
 * Sonuç dosyası birikimlidir (hakem dosyaları her turda üzerine yazılır).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme/denetim';
const oku = (n: string) => (existsSync(`${KOK}/${n}`) ? JSON.parse(readFileSync(`${KOK}/${n}`, 'utf8')) : []);
const h1 = oku('hakem1.json');
const h2 = new Map(oku('hakem2.json').map((x: any) => [x.id, x]));

const sonuc: Record<string, any> = existsSync(`${KOK}/hakem-kararlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/hakem-kararlari.json`, 'utf8')) : {};
const onceki = Object.keys(sonuc).length;

for (const a of h1) {
  const b: any = h2.get(a.id);
  if (!b) { console.log(`${a.id}: ikinci hakem yok — çelişkide kaldı`); continue; }
  if (a.karar !== b.karar) { console.log(`${a.id}: hakemler ayrıştı (${a.karar}/${b.karar}) — çelişkide kaldı`); continue; }
  if (a.karar !== 'kusurlu' && a.cevap !== b.cevap) {
    console.log(`${a.id}: aynı karar ama şık farklı (${a.cevap}/${b.cevap}) — çelişkide kaldı`); continue;
  }
  sonuc[a.id] = { karar: a.karar, cevap: a.karar === 'kusurlu' ? null : a.cevap,
                  gerekce: `${a.gerekce} // ${b.gerekce}`, alinti: a.alinti };
  console.log(`✓ ${a.id} → ${a.karar}${a.cevap && a.karar !== 'kusurlu' ? ` (${a.cevap})` : ''}`);
}
writeFileSync(`${KOK}/hakem-kararlari.json`, JSON.stringify(sonuc, null, 1));
console.log(`\n${Object.keys(sonuc).length} bağlayıcı karar (önceki turlardan ${onceki})`);
