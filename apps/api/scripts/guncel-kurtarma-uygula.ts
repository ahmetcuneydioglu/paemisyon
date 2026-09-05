/**
 * Doc 35 — kurtarma önerilerini araştırma dosyalarına işler.
 *
 * A/B/C/D grubu düzeltmeleri uygulanır; E ve F bankaya girmez ve
 * `elenen` listesine yazılır. Şık dengelemesi BU ADIMDAN SONRA çalışır.
 *
 *   npx tsx scripts/guncel-kurtarma-uygula.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/guncel-kurtarma-uygula.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';
const APPLY = process.env.APPLY === '1';
const GECER = new Set(['A', 'B', 'C', 'D']);

/**
 * Yalnız HENÜZ UYGULANMAMIŞ öneri dosyaları işlenir. İlk turun önerileri
 * araştırma dosyalarına zaten yazıldı ve o sorular bankaya gitti; tekrar
 * işlemek dengelenmiş harflerle çakışır.
 */
const uygulandiYol = `${KOK}/kurtarma/uygulandi.json`;
const uygulandi: string[] = existsSync(uygulandiYol) ? JSON.parse(readFileSync(uygulandiYol, 'utf8')) : [];
const yeniDosyalar = readdirSync(`${KOK}/kurtarma`)
  .filter((x) => /-oneri\.json$/.test(x) && !uygulandi.includes(x));
if (yeniDosyalar.length === 0) { console.log('uygulanacak yeni öneri dosyası yok'); process.exit(0); }
console.log(`işlenecek: ${yeniDosyalar.join(', ')}`);
const oneri = new Map<string, any>();
for (const f of yeniDosyalar)
  for (const o of JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8'))) oneri.set(o.id, o);

const elenen: { id: string; grup: string; gerekce: string }[] = [];
let degisen = 0, dokunulmayan = 0;
const dosyalar = readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json'));
for (const f of dosyalar) {
  const alan = f.replace('.json', '');
  const o = JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8'));
  o.sorular = o.sorular.map((s: any, i: number) => {
    const id = `${alan}-${i + 1}`;
    const oz = oneri.get(id);
    if (!oz) return s;                       // denetimden ONAY ile geçmiş
    if (!GECER.has(oz.grup)) { elenen.push({ id, grup: oz.grup, gerekce: oz.gerekce }); return { ...s, _elendi: true }; }
    const d = oz.duzeltme;
    if (!d) { dokunulmayan++; return s; }
    const yeni = { ...s };
    if (d.kok && d.kok !== s.kok) yeni.kok = d.kok;
    if (d.siklar) yeni.siklar = d.siklar;
    if (d.dogru) yeni.dogru = d.dogru;
    if (d.aciklama) yeni.aciklama = d.aciklama;
    if (d.dayanak) yeni.kaynak = d.dayanak;
    if (JSON.stringify(yeni) !== JSON.stringify(s)) degisen++; else dokunulmayan++;
    return yeni;
  });
  if (APPLY) writeFileSync(`${KOK}/arastirma/${f}`, JSON.stringify(o, null, 1));
}
console.log(`öneri: ${oneri.size} · düzeltilen: ${degisen} · dokunulmayan: ${dokunulmayan} · ELENEN: ${elenen.length}`);
for (const e of elenen) console.log(`   ✗ ${e.id} [${e.grup}] ${e.gerekce.slice(0, 110)}`);
if (APPLY) {
  const eski = existsSync(`${KOK}/elenen.json`) ? JSON.parse(readFileSync(`${KOK}/elenen.json`, 'utf8')) : [];
  writeFileSync(`${KOK}/elenen.json`, JSON.stringify([...eski, ...elenen], null, 1));
  writeFileSync(uygulandiYol, JSON.stringify([...uygulandi, ...yeniDosyalar], null, 1));
  console.log('\n✓ uygulandı');
}
else console.log('\n(APPLY=1 ile yazılır)');
