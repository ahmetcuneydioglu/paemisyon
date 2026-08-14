/**
 * cmk-sure-sorular.json → profesyonel PDF sınav kitapçığı.
 * Seçim: doğrulanmış adaylardan 100 (hedef 20 kolay / 50 orta / 30 zor),
 * yakın-mükerrer eleme, şık karıştırma ile A-E cevap dengesi.
 * PDF: HTML + Chrome headless print (A4).
 * Kullanım: npx tsx scripts/cmk-sure-pdf.ts <sorular.json> <cikti.pdf>
 */
import * as fs from 'fs';
import { execFileSync } from 'child_process';
import type { Soru } from './cmk-sure-sinav';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function norm(s: string): string {
  return s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]+/g, ' ').trim();
}

// Basit yakın-mükerrer: normalize kökün ilk 90 karakteri aynıysa at.
function dedupe(qs: Soru[]): Soru[] {
  const seen = new Set<string>();
  return qs.filter((q) => {
    const k = norm(q.stem).slice(0, 90);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Hedef zorluk dağılımıyla 100 seç (eksikse komşu zorluktan tamamla). */
function pick100(qs: Soru[]): Soru[] {
  const by = {
    kolay: qs.filter((q) => q.zorluk === 'kolay'),
    orta: qs.filter((q) => q.zorluk === 'orta'),
    zor: qs.filter((q) => q.zorluk === 'zor'),
  };
  const out: Soru[] = [
    ...by.kolay.slice(0, 20),
    ...by.orta.slice(0, 50),
    ...by.zor.slice(0, 30),
  ];
  for (const q of qs) {
    if (out.length >= 100) break;
    if (!out.includes(q)) out.push(q);
  }
  return out.slice(0, 100);
}

/** Şıkları karıştırıp harf dağılımını dengele (her harf ~20). */
function balance(qs: Soru[]): Soru[] {
  const counts = [0, 0, 0, 0, 0];
  return qs.map((q) => {
    // En az kullanılan harfi hedefle; doğru şıkkı oraya taşı, kalanları karıştır.
    const hedef = counts.indexOf(Math.min(...counts));
    counts[hedef]++;
    const dogru = q.options[q.dogruIndex];
    const digerleri = q.options.filter((_, i) => i !== q.dogruIndex);
    // Deterministik olmayan karışıklık yerine stabil rotasyon (tekrar üretilebilir).
    const rot = (norm(q.stem).length + hedef) % 4;
    const yigin = [...digerleri.slice(rot), ...digerleri.slice(0, rot)];
    const options: string[] = [];
    let d = 0;
    for (let i = 0; i < 5; i++) options.push(i === hedef ? dogru : yigin[d++]);
    return { ...q, options, dogruIndex: hedef };
  });
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(qs: Soru[]): string {
  const H = 'ABCDE';
  const anahtar = qs.map((q, i) => `${i + 1}-${H[q.dogruIndex]}`);
  const dagilim = [0, 0, 0, 0, 0];
  for (const q of qs) dagilim[q.dogruIndex]++;
  console.log('cevap dağılımı A-E:', dagilim.join('/'));

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 12mm 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; }
  body { font: 10.5pt/1.42 "Helvetica Neue", Arial, sans-serif; color: #14243e; }
  .kapak { height: 250mm; display: flex; flex-direction: column; justify-content: center;
    align-items: center; text-align: center; page-break-after: always; }
  .kapak .tile { width: 84px; height: 84px; border-radius: 19px; margin-bottom: 32px;
    background: linear-gradient(135deg, #27548F, #122A52); position: relative; }
  .kapak .tile svg { position: absolute; inset: 0; }
  .kapak h1 { font-size: 21pt; letter-spacing: .04em; color: #1B3A6B; }
  .kapak h2 { font-size: 15pt; margin-top: 8px; font-weight: 600; }
  .kapak .alt { margin-top: 14px; color: #5A6B82; font-size: 11pt; }
  .kapak .rozet { margin-top: 40px; border: 1.5pt solid #1B3A6B; border-radius: 99px;
    padding: 8px 26px; font-weight: 700; color: #1B3A6B; }
  .kapak .uyari { margin-top: 60px; font-size: 8.5pt; color: #8896ab; max-width: 120mm; }
  .bolum { page-break-before: always; }
  .bolum-baslik { font-size: 14pt; font-weight: 800; color: #1B3A6B;
    border-bottom: 2pt solid #1B3A6B; padding-bottom: 4px; margin-bottom: 14px; }
  .soru { break-inside: avoid; margin-bottom: 12px; }
  .soru .kok { font-weight: 600; margin-bottom: 4px; }
  .soru .no { color: #1B3A6B; font-weight: 800; }
  .soru ol { list-style: none; padding-left: 14px; }
  .soru li { margin: 1.5px 0; }
  .soru li b { color: #1B3A6B; }
  .anahtar { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px 8px;
    font-variant-numeric: tabular-nums; font-size: 10pt; }
  .anahtar span { border: .5pt solid #cdd7e4; border-radius: 4px; text-align: center;
    padding: 3px 0; }
  .acik { break-inside: avoid; margin-bottom: 10px; padding: 7px 10px;
    background: #f2f5fa; border-left: 2.5pt solid #1B3A6B; border-radius: 0 6px 6px 0; }
  .acik .b { font-weight: 700; color: #1B3A6B; }
  .acik .d { color: #5A6B82; font-size: 9pt; margin-top: 1px; }
  </style></head><body>

  <div class="kapak">
    <div class="tile"><svg viewBox="0 0 96 96">
      <rect x="28.6" y="21.5" width="11.2" height="53" rx="5.6" fill="#fff"/>
      <circle cx="56.4" cy="40.2" r="15.2" fill="none" stroke="#fff" stroke-width="11.2"/>
      <circle cx="56.4" cy="40.2" r="5.7" fill="#F3A93C"/>
    </svg></div>
    <h1>5271 SAYILI CEZA MUHAKEMESİ KANUNU</h1>
    <h2>SÜRELER — 100 SORULUK DENEME SINAVI</h2>
    <div class="alt">CMK Süreler ve Zaman Sınırları Çalışması</div>
    <div class="rozet">100 Soru &nbsp;|&nbsp; 5 Seçenek &nbsp;|&nbsp; Açıklamalı Cevap Anahtarı</div>
    <div class="uyari">Bu kitapçık, 5271 sayılı Kanun'un güncel metni esas alınarak çalışma
    amacıyla hazırlanmış özgün sorulardan oluşur; resmî sınav sorusu değildir.</div>
  </div>

  <div class="bolum-baslik">BÖLÜM 1 — SORULAR</div>
  ${qs
    .map(
      (q, i) => `<div class="soru"><div class="kok"><span class="no">${i + 1}.</span> ${esc(q.stem)}</div>
      <ol>${q.options.map((o, j) => `<li><b>${H[j]})</b> ${esc(o)}</li>`).join('')}</ol></div>`,
    )
    .join('\n')}

  <div class="bolum"><div class="bolum-baslik">BÖLÜM 2 — CEVAP ANAHTARI</div>
    <div class="anahtar">${anahtar.map((a) => `<span>${a}</span>`).join('')}</div>
  </div>

  <div class="bolum"><div class="bolum-baslik">BÖLÜM 3 — AÇIKLAMALI CEVAPLAR</div>
  ${qs
    .map(
      (q, i) => `<div class="acik"><span class="b">Soru ${i + 1} — Doğru Cevap: ${H[q.dogruIndex]}</span>
      &nbsp;·&nbsp; Dayanak: CMK m. ${esc(q.madde)}
      <div>${esc(q.aciklama)}</div>
      ${q.dayanak ? `<div class="d">Hüküm: “${esc(q.dayanak)}”</div>` : ''}</div>`,
    )
    .join('\n')}
  </body></html>`;
}

async function main() {
  const [src, dst] = process.argv.slice(2);
  const data = JSON.parse(fs.readFileSync(src, 'utf8')) as { onayli: Soru[] };
  const uniq = dedupe(data.onayli);
  console.log(`onaylı: ${data.onayli.length} · mükerrer sonrası: ${uniq.length}`);
  const secim = balance(pick100(uniq));
  console.log(
    `seçim: ${secim.length} (kolay ${secim.filter((q) => q.zorluk === 'kolay').length} / orta ${secim.filter((q) => q.zorluk === 'orta').length} / zor ${secim.filter((q) => q.zorluk === 'zor').length})`,
  );
  const htmlPath = dst.replace(/\.pdf$/, '.html');
  fs.writeFileSync(htmlPath, html(secim));
  execFileSync(CHROME, [
    '--headless',
    '--disable-gpu',
    `--print-to-pdf=${dst}`,
    '--no-pdf-header-footer',
    htmlPath,
  ]);
  console.log(`PDF: ${dst}`);
}
main();
