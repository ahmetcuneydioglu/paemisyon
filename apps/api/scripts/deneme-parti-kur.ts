/**
 * Doc 34 — deneme sorularını ders bazında KÖR denetim partilerine böler.
 * Cevap anahtarı AYRI dosyada tutulur; denetçi görmez.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
const CAP = 14;

const DAYANAK: Record<string, string> = {
  'Ceza Muhakemesi Hukuku': 'mevzuat/5271-*.md (CMK, 349 md)',
  'Ceza Hukuku': 'mevzuat/5237-*.md (TCK, 349 md)',
  'Anayasa Hukuku': 'mevzuat/t-c-anayasasi.md + ilgili kanunlar',
  'İdare Hukuku': 'mevzuat/ içindeki idare kanunları (5442, 5302, 5393, 2577, 2575) + Anayasa',
  'Polis Mevzuatı': 'mevzuat/ içindeki polis mevzuatı (2559, 3201, 7068, 3713, 5326, 5682, 5253, 2911, 1774, 2918, 6136, 6222, 5901, 5607, 4483, 4982, 3628, 5726)',
  'İnsan Hakları': 'mevzuat/ (6701, Anayasa) — AİHS soruları için elde metin YOK, künye ile',
  'Atatürk İlkeleri ve İnkılap Tarihi': 'Elde metin YOK — tarihî belge/olay künyesiyle (tarih + belge adı)',
  'Genel Kültür ve Analitik Düşünme': 'Elde metin YOK — kaynağı künyele; dil bilgisi sorularında TDK kuralı',
};

function main() {
  const aday = JSON.parse(readFileSync(`${KOK}/aday-96.json`, 'utf8'));
  const sinif: any[] = JSON.parse(readFileSync(`${KOK}/siniflandirma.json`, 'utf8'));
  const sinifOf = new Map(sinif.map((s) => [s.no, s]));
  mkdirSync(`${KOK}/parti`, { recursive: true });

  // Kullanıcı kararı (5 Eyl 2026): güncel kültür soruları bankaya ALINMAZ.
  const elenen = aday.filter((q: any) => sinifOf.get(q.no)?.zaman === 'guncel-kultur');
  const kalan = aday.filter((q: any) => sinifOf.get(q.no)?.zaman !== 'guncel-kultur');
  writeFileSync(`${KOK}/elenen-guncel-kultur.json`, JSON.stringify(elenen, null, 1));

  const dersler = new Map<string, any[]>();
  for (const q of kalan) {
    const ders = sinifOf.get(q.no)?.ders ?? '(konusu yok)';
    if (!dersler.has(ders)) dersler.set(ders, []);
    dersler.get(ders)!.push(q);
  }
  const slug = (s: string) => s.toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);

  let toplam = 0;
  for (const [ders, sorular] of [...dersler].sort((a, b) => b[1].length - a[1].length)) {
    const parcaSayisi = Math.ceil(sorular.length / CAP);
    for (let i = 0; i < parcaSayisi; i++) {
      const pay = sorular.slice(i * CAP, (i + 1) * CAP);
      const ad = `${slug(ders)}${parcaSayisi > 1 ? `-${i + 1}` : ''}`;
      writeFileSync(`${KOK}/parti/${ad}-kor.json`, JSON.stringify({
        ders, dayanak: DAYANAK[ders] ?? 'Elde metin YOK — künye ile',
        sorular: pay.map((q: any) => ({ id: `s${q.no}`, kok: q.kok, siklar: q.siklar })),
      }, null, 1));
      writeFileSync(`${KOK}/parti/${ad}-anahtar.json`,
        JSON.stringify(Object.fromEntries(pay.map((q: any) => [`s${q.no}`, q.dogru])), null, 1));
      console.log(`  ${ad.padEnd(26)} ${String(pay.length).padStart(3)} soru  (${ders})`);
      toplam += pay.length;
    }
  }
  console.log(`\n${toplam} soru partilere bölündü · elenen güncel kültür: ${elenen.length}`);
}
main();
