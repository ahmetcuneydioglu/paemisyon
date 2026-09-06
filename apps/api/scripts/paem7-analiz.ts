/**
 * Doc 36 — PAEM 7 (2022) konu analizini aday hatırlatmasından çıkarır.
 *
 * PAEM 7 yayımlanmadı. Elimizdeki "Paem 7 - Cevaplar.pdf", sınava girenlerin
 * derlediği 100 satırlık liste: sıra no + ders + doğru cevabın özeti.
 * Buradan SORU üretilmez (soru metni yok, hatırlanan da güvenilmez); üretilen
 * şey **konu dağılımı** — adayın gerçekten aradığı ve elimizdeki tek dürüst
 * çıktı budur.
 *
 * Polis Mevzuatı satırları "Pol.Mev. (2559) ..." biçiminde kanun numarası
 * taşıyor; dağılım kanun kırılımına kadar iner.
 *
 *   npx tsx scripts/paem7-analiz.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const PDF = `${process.env.HOME}/Documents/PaemÇıkmışSorular/Paem 7 - Cevaplar.pdf`;
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';

/** Listedeki ders adları → bizim ders adlarımız. */
const DERS: Record<string, string> = {
  'Anayasa': 'Anayasa Hukuku',
  'İdare Hukuku': 'İdare Hukuku',
  'TCK': 'Ceza Hukuku',
  'CMK': 'Ceza Muhakemesi Hukuku',
  'İnsan Hakları': 'İnsan Hakları',
  'İnkilap': 'Atatürk İlkeleri ve İnkılap Tarihi',
  'Genel Kültür': 'Genel Kültür ve Analitik Düşünme',
  'Pol.Mev.': 'Polis Mevzuatı',
};

function main() {
  const metin = execFileSync('pdftotext', ['-layout', PDF, '-'], { encoding: 'utf8' });
  const satirlar: { no: number; ders: string; kanun: string | null; konu: string }[] = [];

  for (const ham of metin.split('\n')) {
    const m = ham.match(/^\s*(\d{1,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const no = Number(m[1]);
    if (no < 1 || no > 100) continue;
    const kalan = m[2];
    const ad = Object.keys(DERS).find((k) => kalan.startsWith(k));
    if (!ad) throw new Error(`${no}: ders tanınmadı → ${kalan.slice(0, 40)}`);
    let konu = kalan.slice(ad.length).trim();
    let kanun: string | null = null;
    const kn = konu.match(/^\((\d{3,4})\)\s*(.*)$/);
    if (kn) { kanun = kn[1]; konu = kn[2]; }
    satirlar.push({ no, ders: DERS[ad], kanun, konu });
  }

  if (satirlar.length !== 100) throw new Error(`100 satır bekleniyordu, ${satirlar.length} okundu`);

  const dersDagilim = new Map<string, number>();
  const kanunDagilim = new Map<string, number>();
  for (const s of satirlar) {
    dersDagilim.set(s.ders, (dersDagilim.get(s.ders) ?? 0) + 1);
    if (s.kanun) kanunDagilim.set(s.kanun, (kanunDagilim.get(s.kanun) ?? 0) + 1);
  }

  console.log('PAEM 7 (2022) — ders dağılımı');
  for (const [d, n] of [...dersDagilim].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${d}`);
  console.log('\nPolis Mevzuatı kanun kırılımı');
  for (const [k, n] of [...kanunDagilim].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k} sayılı Kanun`);

  mkdirSync(`${KOK}/analiz`, { recursive: true });
  writeFileSync(
    `${KOK}/analiz/paem-7-2022.json`,
    JSON.stringify(
      {
        slug: 'paem-7-2022',
        ad: 'PAEM 7. Dönem Yazılı Sınavı (2022)',
        tur: 'analiz',
        kaynak: 'sınava giren adayların derlediği hatırlatma listesi (100 satır)',
        uyari:
          'Bu sınav yayımlanmadı. Dağılım aday hatırlatmasına dayanır; soru metinleri elimizde yoktur.',
        dersDagilim: Object.fromEntries([...dersDagilim].sort((a, b) => b[1] - a[1])),
        kanunDagilim: Object.fromEntries([...kanunDagilim].sort((a, b) => b[1] - a[1])),
        satirlar,
      },
      null,
      1,
    ),
  );
  console.log('\n→ analiz/paem-7-2022.json');
}
main();
