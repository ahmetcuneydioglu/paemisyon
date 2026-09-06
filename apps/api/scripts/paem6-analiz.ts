/**
 * Doc 36 — PAEM 6 konu analizini aday hatırlatmasından çıkarır.
 *
 * `paem6.pdf` sınava girenlerin tuttuğu listedir: her satır bir etiket
 * (ders kısaltması ya da kanun numarası) ve hatırlanan konu. PAEM 7'nin
 * listesinden daha kaba — dört satırda "HATIRLAMIYORUM" yazıyor, birkaç
 * satır sayfa genişliğine sığmayıp altta parça hâlinde duruyor.
 *
 * Bu yüzden çıktı **yaklaşıktır** ve öyle etiketlenir. Soru üretilmez;
 * üretilen tek şey konu dağılımıdır.
 *
 *   npx tsx scripts/paem6-analiz.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const PDF = `${process.env.HOME}/Documents/PaemÇıkmışSorular/paem6.pdf`;
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';

const ETIKET: Record<string, string> = {
  ANY: 'Anayasa Hukuku',
  Anayasa: 'Anayasa Hukuku',
  'İDARE': 'İdare Hukuku',
  idare: 'İdare Hukuku',
  TCK: 'Ceza Hukuku',
  'CMK (ipt)': 'Ceza Muhakemesi Hukuku',
  CMK: 'Ceza Muhakemesi Hukuku',
  'İHAK (ipt)': 'İnsan Hakları',
  'İHAK': 'İnsan Hakları',
  'İNK': 'Atatürk İlkeleri ve İnkılap Tarihi',
  'GÜNCEL': 'Genel Kültür ve Analitik Düşünme',
};

function main() {
  const metin = execFileSync('pdftotext', ['-layout', PDF, '-'], { encoding: 'utf8' });
  const kayitlar: { ders: string; kanun: string | null; konu: string }[] = [];
  let hatirlanmayan = 0;
  const artik: string[] = [];

  for (const ham of metin.split('\n')) {
    // Bölünmez boşluk ve baştaki hizalama boşluğu etiketi gizliyor.
    const satir = ham.replace(/\u00a0/g, ' ').trim();
    if (!satir) continue;
    if (satir === 'HATIRLAMIYORUM') { hatirlanmayan++; continue; }

    const kanun = satir.match(/^(\d{3,4})\s+(.*)$/);
    if (kanun) { kayitlar.push({ ders: 'Polis Mevzuatı', kanun: kanun[1], konu: kanun[2].trim() }); continue; }

    const ad = Object.keys(ETIKET)
      .sort((a, b) => b.length - a.length) // "CMK (ipt)" önce, "CMK" sonra
      .find((k) => satir.startsWith(k + ' '));
    if (ad) { kayitlar.push({ ders: ETIKET[ad], kanun: null, konu: satir.slice(ad.length).trim() }); continue; }

    // Etiketsiz satır: ya sayfaya sığmayan bir satırın devamı ya da etiketi
    // unutulmuş bir kayıt. Sayıma katılmaz, kayda geçer.
    artik.push(satir);
  }

  const dersDagilim = new Map<string, number>();
  const kanunDagilim = new Map<string, number>();
  for (const k of kayitlar) {
    dersDagilim.set(k.ders, (dersDagilim.get(k.ders) ?? 0) + 1);
    if (k.kanun) kanunDagilim.set(k.kanun, (kanunDagilim.get(k.kanun) ?? 0) + 1);
  }

  console.log(`PAEM 6 — hatırlanan ${kayitlar.length} · "hatırlamıyorum" ${hatirlanmayan} · etiketsiz ${artik.length}`);
  for (const [d, n] of [...dersDagilim].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${d}`);
  console.log('\nPolis Mevzuatı kanun kırılımı');
  for (const [k, n] of [...kanunDagilim].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k} sayılı Kanun`);
  if (artik.length) { console.log('\netiketsiz satırlar:'); for (const a of artik) console.log('  · ' + a.slice(0, 90)); }

  mkdirSync(`${KOK}/analiz`, { recursive: true });
  writeFileSync(
    `${KOK}/analiz/paem-6.json`,
    JSON.stringify(
      {
        slug: 'paem-6',
        ad: 'PAEM 6. Dönem Yazılı Sınavı',
        tur: 'analiz',
        kaynak: 'sınava giren adayların derlediği hatırlatma listesi',
        uyari:
          'Bu sınav yayımlanmadı. Liste kabadır: bazı sorular hatırlanamamış, ' +
          'bazı satırların etiketi eksiktir. Dağılım YAKLAŞIKTIR.',
        hatirlanan: kayitlar.length,
        hatirlanmayan,
        etiketsiz: artik,
        dersDagilim: Object.fromEntries([...dersDagilim].sort((a, b) => b[1] - a[1])),
        kanunDagilim: Object.fromEntries([...kanunDagilim].sort((a, b) => b[1] - a[1])),
        kayitlar,
      },
      null,
      1,
    ),
  );
  console.log('\n→ analiz/paem-6.json');
}
main();
