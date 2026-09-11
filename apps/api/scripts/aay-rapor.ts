/** Partiyi insan okuyacak biçimde yazar: senaryo, soru, şıklar, cevap, dünya sayısı. */
import { writeFileSync } from 'node:fs';
import { cozumle } from './aay-cozucu';
import { PARTI as P1 } from './aay-p1';
import { PARTI as P2 } from './aay-p2';
import { PARTI as P3 } from './aay-p3';

const PARTILER: Record<string, typeof P1> = { 'aay-p1': P1, 'aay-p2': P2, 'aay-p3': P3 };
const hangi = process.argv[2] ?? 'aay-p1';
const PARTI = PARTILER[hangi];
if (!PARTI) throw new Error(`bilinmeyen parti: ${hangi}`);

const satir: string[] = [`# Analitik Akıl Yürütme · ${hangi === 'aay-p2' ? '2' : '1'}. parti`, '', '4 senaryo · 12 soru · hepsi kaba kuvvetle kanıtlandı.', ''];
let oncekiMetin = '';
for (const b of PARTI) {
  const k = cozumle(b);
  if (b.ortakMetin !== oncekiMetin) {
    satir.push('---', '', '## Senaryo', '', b.ortakMetin.split('\n').map((x) => `> ${x}`).join('\n'), '');
    oncekiMetin = b.ortakMetin;
  }
  satir.push(`### ${b.id}`, '', `**${b.kok}**`, '');
  for (const s of b.siklar) satir.push(`- **${s.harf})** ${s.metin}${s.harf === k.tutan[0] ? '  ← **doğru**' : ''}`);
  satir.push('', `\`${k.sonuc}\` · ${k.dunyaSayisi} tutarlı dünya · tek doğru **${k.tutan[0]}**`, '');
}
const yol = `/Users/ahmetcnd/Developer/paemisyon/docs/43-analitik-akil-yurutme/${hangi}.md`;
writeFileSync(yol, satir.join('\n'));
console.log(`✓ ${PARTI.length} soru → ${yol}`);
