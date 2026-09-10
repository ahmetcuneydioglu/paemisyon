/**
 * Doc 42 — hakem kararlarını karar dosyalarına işler.
 *
 * `ogm-hakem-uygula.ts` ile aynı kural, Doc 42'nin dosya adlarına uyarlanmış
 * hâli (parti adları `k-1`, hakem dosyaları `hakem-h1.json`).
 *
 * Kural: bir soru bankaya ancak **iki hakem de `TEMIZ`** dediyse girer.
 * Hakemler ayrışırsa soru dışarıda kalır — ayrışmanın kendisi, kusurun
 * tartışmaya açık olduğunun kanıtıdır. Şüphe her zaman sorunun aleyhine.
 *
 *   npx tsx scripts/kpss-hakem-uygula.ts <doc-dizini>
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

type Hakem = { id: string; karar: string; gerekce: string; duzeltilebilir?: string };

function main() {
  const doc = process.argv[2];
  if (!doc) throw new Error('kullanım: kpss-hakem-uygula.ts <doc-dizini>');

  const oku = (k: string) =>
    new Map<string, Hakem>(
      (JSON.parse(readFileSync(`${doc}/denetim/hakem-${k}.json`, 'utf8')) as Hakem[]).map((h) => [h.id, h]),
    );
  const h1 = oku('h1');
  const h2 = oku('h2');

  let temiz = 0, kusurlu = 0, ayrisan = 0;
  const satirlar: string[] = [];
  for (const f of readdirSync(`${doc}/denetim`).filter((x) => /^k-\d+-karar\.json$/.test(x))) {
    const kararlar = JSON.parse(readFileSync(`${doc}/denetim/${f}`, 'utf8'));
    for (const k of kararlar) {
      if (k.karar !== 'UYARI') continue;
      const a = h1.get(k.id), b = h2.get(k.id);
      if (!a || !b) throw new Error(`${k.id}: hakem kararı eksik`);
      const ikisiTemiz = a.karar === 'TEMIZ' && b.karar === 'TEMIZ';
      if (a.karar !== b.karar) ayrisan++;
      k.karar = ikisiTemiz ? 'ONAY-HAKEM' : 'KUSURLU';
      k.hakem = {
        h1: a.karar, h2: b.karar, gerekce: [a.gerekce, b.gerekce],
        duzeltilebilir: [a.duzeltilebilir, b.duzeltilebilir].filter(Boolean),
      };
      ikisiTemiz ? temiz++ : kusurlu++;
      satirlar.push(`  ${k.id.padEnd(6)} ${(a.karar === b.karar ? a.karar : `${a.karar}/${b.karar}`).padEnd(15)} → ${k.karar}`);
    }
    writeFileSync(`${doc}/denetim/${f}`, JSON.stringify(kararlar, null, 1));
  }

  console.log(`uyarılı soru: ${temiz + kusurlu}`);
  for (const s of satirlar.sort()) console.log(s);
  console.log(`\nbankaya girecek (ONAY-HAKEM): ${temiz}`);
  console.log(`dışarıda kalan (KUSURLU)    : ${kusurlu}${ayrisan ? `  — ${ayrisan}'i hakemlerin ayrışması yüzünden` : ''}`);
}
main();
