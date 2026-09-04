/** SALT OKUMA: sorularda geçen kanun numaralarının panelde metni var mı? */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const sorular = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const sinif: any[] = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const eleme = new Set(sinif.filter((s) => s.zaman === 'guncel-kultur').map((s) => s.no));

  const gecen = new Map<string, number[]>();
  for (const q of sorular) {
    if (eleme.has(q.no)) continue;
    for (const m of (q.kok as string).matchAll(/\b(\d{3,4})\s*[Ss]ayılı/g)) {
      const no = m[1];
      if (!gecen.has(no)) gecen.set(no, []);
      gecen.get(no)!.push(q.no);
    }
  }
  const mevzuat = await p.legislation.findMany({
    select: { number: true, name: true, _count: { select: { articles: true } } },
  });
  const harita = new Map(mevzuat.filter((m) => m.number).map((m) => [m.number!, m]));

  console.log('kanun  soru  panelde');
  const eksik: string[] = [];
  for (const [no, sorularNo] of [...gecen].sort((a, b) => b[1].length - a[1].length)) {
    const m = harita.get(no);
    const durum = m ? (m._count.articles > 0 ? `✓ ${m._count.articles} md — ${m.name.slice(0, 45)}` : `⚠ kayıt var, madde YOK — ${m.name.slice(0, 40)}`) : '✗ YOK';
    if (!m || m._count.articles === 0) eksik.push(no);
    console.log(`${no.padEnd(6)} ${String(sorularNo.length).padStart(4)}  ${durum}`);
  }
  console.log(`\nEKSİK KANUNLAR: ${eksik.length ? eksik.join(', ') : 'yok'}`);
  if (eksik.length) {
    console.log('indirme bağlantıları:');
    for (const n of eksik) console.log(`  https://www.mevzuat.gov.tr/MevzuatMetin/1.5.${n}.pdf`);
  }
}
main().finally(() => p.$disconnect());
