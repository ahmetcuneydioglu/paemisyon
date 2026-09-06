/**
 * Doc 36 — kör doğrulama partilerini kurar.
 *
 * Denetçi anahtarı GÖRMEZ; soruyu kendisi çözer. Resmî anahtar elimizde
 * olduğu için denetçinin işi cevabı belirlemek değil DOĞRULAMAK: ayrışma
 * ya bizim hatamıza ya da 2025'ten bu yana değişen mevzuata işaret eder.
 *
 * Şekilli sorularda (97-100) kök tek başına yetmez; kör dosyaya görselin
 * yolu konur, denetçi Read ile açar.
 *
 *   npx tsx scripts/paem9-parti-kur.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const GORSEL = '/Users/ahmetcnd/Developer/paemisyon/apps/web/public/soru-gorsel/paem-9';

/** Denetçi partileri — ders bloklarına göre, her parti tek denetçilik iş. */
const PARTILER: [string, number, number][] = [
  ['polis-cmk', 1, 20],
  ['ceza-anayasa', 21, 40],
  ['idare-insanhaklari', 41, 60],
  ['inkilap-genelkultur', 61, 81],
  ['analitik-matematik', 82, 100],
];

function main() {
  mkdirSync(`${KOK}/parti`, { recursive: true });
  const { A } = JSON.parse(readFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, 'utf8'));
  const sinif: any[] = JSON.parse(readFileSync(`${KOK}/siniflandirma.json`, 'utf8'));
  const dersi = new Map(sinif.map((c) => [c.no, c]));

  for (const [ad, ilk, son] of PARTILER) {
    const dilim = (A as any[]).filter((s) => s.no >= ilk && s.no <= son);
    const kor = dilim.map((s) => ({
      no: s.no,
      ders: dersi.get(s.no)!.ders,
      konu: dersi.get(s.no)!.konu,
      ortakMetin: s.ortakMetin,
      kok: s.kok,
      siklar: s.siklar,
      gorsel: s.gorselli ? `${GORSEL}/${s.no}.png` : undefined,
    }));
    const anahtar = dilim.map((s) => ({ no: s.no, dogru: s.dogru, iptal: !!s.iptal }));
    writeFileSync(`${KOK}/parti/${ad}-kor.json`, JSON.stringify(kor, null, 1));
    writeFileSync(`${KOK}/parti/${ad}-anahtar.json`, JSON.stringify(anahtar, null, 1));
    console.log(`${ad}: ${dilim.length} soru (${ilk}-${son})` + (kor.some((k) => k.gorsel) ? ' · görselli var' : ''));
  }
}
main();
