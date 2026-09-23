/**
 * Doc 35 — araştırma çıktılarını KÖR denetim partilerine ayırır.
 * Cevap ve açıklama ayrı dosyaya konur; denetçi yalnız soruyu görür.
 *
 *   [GUNCEL_KOK=<parti klasörü>] npx tsx scripts/guncel-parti-kur.ts [alan]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
// GUNCEL_KOK ile başka bir parti klasörü seçilir (ör. docs/35-guncel-kultur/parti-2);
// varsayılan ilk partidir. Her parti kendi arastirma/parti/denetim/kurtarma alt klasörlerini taşır.
const KOK = process.env.GUNCEL_KOK ?? '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';

mkdirSync(`${KOK}/parti`, { recursive: true });
mkdirSync(`${KOK}/denetim`, { recursive: true });
let toplam = 0;
// Alan adı verilirse yalnız o alan işlenir: paralel üreticiler birbirinin yarım
// yazılmış araştırma dosyasını okumasın.
const TEK = process.argv[2];
for (const f of readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json') && (!TEK || x === `${TEK}.json`))) {
  const o = JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8'));
  const alan = f.replace('.json', '');
  const sorular = (o.sorular ?? []).map((s: any, i: number) => ({ ...s, id: `${alan}-${i + 1}` }));
  writeFileSync(`${KOK}/parti/${alan}-kor.json`, JSON.stringify({
    alan, not: 'Cevap anahtarı AYRI dosyada; denetçi görmez.',
    sorular: sorular.map((s: any) => ({ id: s.id, kok: s.kok, siklar: s.siklar })),
  }, null, 1));
  writeFileSync(`${KOK}/parti/${alan}-anahtar.json`, JSON.stringify(
    Object.fromEntries(sorular.map((s: any) => [s.id, s.dogru])), null, 1));
  writeFileSync(`${KOK}/parti/${alan}-meta.json`, JSON.stringify(
    Object.fromEntries(sorular.map((s: any) => [s.id, {
      aciklama: s.aciklama, kaynak: s.kaynak, kaynakUrl: s.kaynakUrl, olayTarihi: s.olayTarihi,
    }])), null, 1));
  console.log(`  ${alan.padEnd(32)} ${sorular.length} soru`);
  toplam += sorular.length;
}
console.log(`\ntoplam ${toplam} soru, ${readdirSync(`${KOK}/arastirma`).length} alan`);
