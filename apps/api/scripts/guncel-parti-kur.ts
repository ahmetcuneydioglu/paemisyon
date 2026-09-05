/**
 * Doc 35 — araştırma çıktılarını KÖR denetim partilerine ayırır.
 * Cevap ve açıklama ayrı dosyaya konur; denetçi yalnız soruyu görür.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';

mkdirSync(`${KOK}/parti`, { recursive: true });
mkdirSync(`${KOK}/denetim`, { recursive: true });
let toplam = 0;
for (const f of readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json'))) {
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
