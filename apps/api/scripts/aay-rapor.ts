/** Partiyi insan okuyacak biçimde yazar: senaryo, soru, şıklar, cevap, dünya sayısı. */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { cozumle, type Bulmaca } from './aay-cozucu';

type Soru = Bulmaca & { ortakMetin: string; kok: string };

(async () => {
const hangi = process.argv[2] ?? 'aay-p1';
if (!/^aay-p\d+$/.test(hangi)) throw new Error(`parti adı aay-p<N> olmalı: ${hangi}`);
const PARTI: Soru[] = (await import(pathToFileURL(resolve(__dirname, `${hangi}.ts`)).href)).PARTI;
const senaryoSayisi = new Set(PARTI.map((b) => b.ortakMetin)).size;

const satir: string[] = [`# Analitik Akıl Yürütme · ${hangi.replace('aay-p', '')}. parti`, '', `${senaryoSayisi} senaryo · ${PARTI.length} soru · hepsi kaba kuvvetle kanıtlandı.`, ''];
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
})();
