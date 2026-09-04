import { readFileSync, writeFileSync } from 'node:fs';
async function main() {
  const { PDFParse } = await import('pdf-parse');
  const buf = readFileSync(process.argv[2]);
  const p = new PDFParse({ data: new Uint8Array(buf) });
  const r = await p.getText();
  const out = r.pages
    .map((pg: any, i: number) => `\n===== SAYFA ${i + 1} =====\n${pg.text ?? ''}`)
    .join('\n');
  writeFileSync(process.argv[3], out);
  console.log('sayfa:', r.pages.length, 'karakter:', out.length);
}
main();
