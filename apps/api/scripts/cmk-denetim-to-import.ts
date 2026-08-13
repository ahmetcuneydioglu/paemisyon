/**
 * Denetim çıktısını (cmk-denetim-progress.jsonl) içe aktarma XLSX'ine çevirir.
 * YALNIZ hukum=DOGRU sorular "hazir" sayfasına girer (sistemin import şablonu:
 * soru|A|B|C|D|E|dogru|aciklama|zorluk). Diğer hükümler ayrı sayfalarda —
 * bilgi amaçlı, import edilmez.
 * Kullanım: npx tsx scripts/cmk-denetim-to-import.ts <progress.jsonl> <cikti.xlsx>
 */
import * as fs from 'fs';
import ExcelJS from 'exceljs';

interface Row {
  no: number; page: number; stem: string;
  options: { label: string; text: string }[];
  answer: string | null; explanation: string;
  hukum: string; dogruCevap: string; ilgiliMaddeler: string; gerekce: string;
}

async function main() {
  const [src, dst] = process.argv.slice(2);
  const rows: Row[] = fs.readFileSync(src, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const wb = new ExcelJS.Workbook();
  const header = ['soru', 'A', 'B', 'C', 'D', 'E', 'dogru', 'aciklama', 'zorluk'];

  const opt = (r: Row, l: string) => r.options.find((o) => o.label === l)?.text ?? '';

  const ready = wb.addWorksheet('hazir');
  ready.addRow(header);
  const dogru = rows.filter((r) => r.hukum === 'DOGRU');
  for (const r of dogru) {
    ready.addRow([r.stem, opt(r, 'A'), opt(r, 'B'), opt(r, 'C'), opt(r, 'D'), opt(r, 'E'), r.answer, r.explanation, 'medium']);
  }
  ready.getRow(1).font = { bold: true };
  ready.columns.forEach((c, i) => (c.width = i === 0 ? 70 : i === 7 ? 50 : 22));

  // Bilgi sayfaları — import ETME, elden geçir.
  for (const [name, filt] of [
    ['kanun-degismis', 'KANUN_DEGISMIS'],
    ['anahtar-hatali', 'YANLIS'],
    ['belirsiz', 'BELIRSIZ'],
  ] as const) {
    const ws = wb.addWorksheet(name);
    ws.addRow([...header, 'ai-cevap', 'ilgili-maddeler', 'gerekce', 'sayfa']);
    for (const r of rows.filter((x) => x.hukum === filt)) {
      ws.addRow([r.stem, opt(r, 'A'), opt(r, 'B'), opt(r, 'C'), opt(r, 'D'), opt(r, 'E'), r.answer, r.explanation, 'medium', r.dogruCevap, r.ilgiliMaddeler, r.gerekce, r.page]);
    }
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach((c, i) => (c.width = i === 0 ? 70 : i >= 7 ? 40 : 22));
  }

  await wb.xlsx.writeFile(dst);
  console.log(`hazir: ${dogru.length} soru → ${dst}`);
}
main();
