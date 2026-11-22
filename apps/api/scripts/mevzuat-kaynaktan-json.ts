/**
 * mevzuat.gov.tr konsolide metninden madde JSON'u üretir (`mevzuat-json-import.ts` girdisi). DB'ye DOKUNMAZ.
 * Bölme ve temizlik `lib/mevzuat-kaynak` ile yapılır (dipnot işaretleri ve tanımları düşer, şerhler kalır);
 * madde başlığı, önceki maddenin bölümünün sonuna yapışan başlık satırıdır.
 * Başlık kimliği çağıran tarafından doğrulanır: çıktıdaki ilk satırlara bak (yanlış tertip BAŞKA kanun döndürür).
 *
 *   npx tsx scripts/mevzuat-kaynaktan-json.ts <kanun no> <tertip> <çıktı.json> [--tur 1]
 */
import { writeFileSync } from 'fs';
import { kaynakGetir, temizle } from './lib/mevzuat-kaynak';

const [no, tertip, cikti] = process.argv.slice(2);
const i = process.argv.indexOf('--tur');
const tur = i === -1 ? '1' : process.argv[i + 1];
if (!no || !tertip || !cikti) throw new Error('kullanım: mevzuat-kaynaktan-json.ts <no> <tertip> <çıktı.json> [--tur 1]');
const k = kaynakGetir(tur, no, [tertip], 1);
const maddeler = k.maddeler.map((m, j) => {
  const t = temizle(m.metin);
  // İlk maddenin başlığı önünde bölüm yok; kanun künyesinin sonundan okunamaz, boş kalır (elle bakılır).
  const title = j > 0 ? temizle(k.maddeler[j - 1].metin).sondakiBaslik ?? '' : '';
  return { articleNo: m.no, title, text: t.govde };
});
writeFileSync(cikti, JSON.stringify(maddeler, null, 1));
console.log(`${no}: ${maddeler.length} madde · ${k.dipnot.size} dipnot tanımı · ${k.url}`);
for (const m of maddeler) console.log(`  ${m.articleNo.padEnd(10)} ${String(m.text.length).padStart(6)}  «${m.title}»  ${m.text.replace(/\s+/g, ' ').slice(0, 70)}`);
