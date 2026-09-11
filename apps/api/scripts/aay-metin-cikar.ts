/**
 * Denetçiye giden dosya: YALNIZ metin.
 *
 * Spesifikasyon ve cevap anahtarı KASITLI olarak konmaz. Çözücü metnin
 * kısıtları sadık anlatıp anlatmadığını göremez — bunu ancak metinden yola
 * çıkıp sıfırdan çözen bağımsız bir denetçi gösterir.
 *
 *   npx tsx scripts/aay-metin-cikar.ts aay-p2
 */
import { writeFileSync } from 'node:fs';
import { PARTI as P1 } from './aay-p1';
import { PARTI as P2 } from './aay-p2';
import { PARTI as P3 } from './aay-p3';

const PARTILER: Record<string, typeof P1> = { 'aay-p1': P1, 'aay-p2': P2, 'aay-p3': P3 };
const hangi = process.argv[2] ?? 'aay-p1';
const parti = PARTILER[hangi];
if (!parti) throw new Error(`bilinmeyen parti: ${hangi} (${Object.keys(PARTILER).join(', ')})`);

const cikti = parti.map((b) => ({
  id: b.id,
  ortakMetin: b.ortakMetin,
  kok: b.kok,
  siklar: Object.fromEntries(b.siklar.map((s) => [s.harf, s.metin])),
}));
const yol = `/Users/ahmetcnd/Developer/paemisyon/docs/43-analitik-akil-yurutme/aday/${hangi}-metin.json`;
writeFileSync(yol, JSON.stringify(cikti, null, 1) + '\n');
console.log(`✓ ${cikti.length} soru yazıldı → ${yol}`);
