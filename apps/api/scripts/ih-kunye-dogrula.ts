/**
 * Doc 33 — açıklamalardaki madde künyelerini RESMÎ METNE karşı doğrular.
 *
 * Neden mekanik: uydurma madde numarasını yakalamanın en ucuz ve en kesin yolu
 * metinde aramaktır; bunun için ikinci bir modele sormak gerekmez.
 *
 * Künye biçimleri: "6216 md 2/1-ç", "Anayasa md 148/1", "AİHS md 34",
 * "6701 md 10/2-b", "3686 md 4", "6328 md 12/3".
 * Elde metni OLMAYAN kaynaklar (BM Şartı, AB antlaşmaları, doktrin) atlanır —
 * onlar zaten "künye ile" kuralına tabi, doğrulanamaz olduğu raporlanır.
 *
 *   npx tsx scripts/ih-kunye-dogrula.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';

const DOSYA: { desen: RegExp; dosya: string; ad: string }[] = [
  { desen: /\banayasa\b/i, dosya: 'anayasa.md', ad: 'T.C. Anayasası' },
  { desen: /\b6216\b/, dosya: '6216-aym-kanunu.md', ad: '6216' },
  { desen: /\b(aihs|avrupa insan haklar[ıi] s[öo]zle[şs]mesi)\b/i, dosya: 'aihs.md', ad: 'AİHS' },
  { desen: /\b6701\b/, dosya: '6701-tihek.md', ad: '6701' },
  { desen: /\b6328\b/, dosya: '6328-kdk.md', ad: '6328' },
  { desen: /\b3686\b/, dosya: '3686-ihik.md', ad: '3686' },
];

/** Kanun dosyasındaki madde numaraları. */
const maddeler = new Map<string, Set<string>>();
for (const d of DOSYA) {
  const yol = `${KOK}/mevzuat/${d.dosya}`;
  if (!existsSync(yol)) continue;
  const set = new Set<string>();
  for (const l of readFileSync(yol, 'utf8').split('\n')) {
    const m = /^## Madde (.+?)(?: — |$)/.exec(l.trim());
    if (m) set.add(m[1].trim());
  }
  maddeler.set(d.dosya, set);
}

let toplam = 0, dogrulanan = 0;
const sorunlu: string[] = [];
const atlanan: string[] = [];

if (!existsSync(`${KOK}/aciklama`)) { console.log('aciklama/ dizini yok'); process.exit(0); }
for (const f of readdirSync(`${KOK}/aciklama`).filter((x) => x.endsWith('.json'))) {
  for (const a of JSON.parse(readFileSync(`${KOK}/aciklama/${f}`, 'utf8'))) {
    if (!a.dayanak) continue;
    toplam++;
    const hedef = DOSYA.find((d) => d.desen.test(a.dayanak));
    if (!hedef || !maddeler.has(hedef.dosya)) { atlanan.push(`${a.id}: ${a.dayanak}`); continue; }
    // "md 2/1-ç" → madde no "2"; "md 4/A" gibi harfli maddeler olduğu gibi de denenir.
    const m = /m(?:d|adde)\.?\s*(?:no\.?\s*)?([0-9]+(?:\/[A-Za-zÇĞİÖŞÜçğıöşü]+)?|Ek\s*\d+|Geçici\s*\d+|(?:Ek\s*)?P\d+-\d+)/i.exec(a.dayanak);
    if (!m) {
      // Madde numarası içermeyen künye kusur değildir: sorunun kendisi kanunun
      // kabul tarihini/numarasını soruyor olabilir. Doğrulanamaz sayılır.
      atlanan.push(`${a.id}: ${a.dayanak} (madde numarası yok)`);
      continue;
    }
    const ham = m[1].trim();
    const set = maddeler.get(hedef.dosya)!;
    const adaylar = [ham, ham.split('/')[0], ham.replace(/\s+/g, ' ')];
    if (adaylar.some((x) => set.has(x))) dogrulanan++;
    else sorunlu.push(`${a.id}: ${hedef.ad} md ${ham} METİNDE YOK → "${a.dayanak}"`);
  }
}

console.log(`künyeli açıklama : ${toplam}`);
console.log(`metinde doğrulandı: ${dogrulanan}`);
console.log(`doğrulanamaz kaynak (elde metin yok): ${atlanan.length}`);
console.log(`SORUNLU          : ${sorunlu.length}`);
for (const s of sorunlu) console.log(`  ✗ ${s}`);
if (atlanan.length) {
  console.log('\nelde metni olmayan kaynaklar (ilk 10):');
  for (const s of atlanan.slice(0, 10)) console.log(`  · ${s}`);
}
