/**
 * Doc 36 — PAEM 9'un şekilli sorularındaki çizimleri PNG olarak çıkarır.
 *
 * Dört soruda (97-100) kök, metinde bulunmayan bir çizime atıf yapıyor:
 * ok şeması, dairesel grafik, sembol grupları, kare dizisi. Bunlar
 * `QuestionVersion.mediaUrl` ile taşınır — web ve mobil zaten render ediyor.
 *
 * Kırpma kutuları `pdftotext -bbox` ile ölçüldü (A4 595x842 pt, A kitapçığı
 * s.17): soru numarasının altından kök metninin başladığı yere kadar. 99 tek
 * istisna — semboller cümlenin İÇİNE gömülü olduğu için o cümle de görselde.
 *
 * Görseller depoya konur (dört küçük PNG); ayrı bir yükleme altyapısı yok.
 *   apps/web/public/soru-gorsel/paem-9/<no>.png
 *
 *   npx tsx scripts/paem9-gorsel-cikar.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const PDF = `${process.env.HOME}/Documents/PaemÇıkmışSorular/Paem9.pdf`;
const HEDEF = '/Users/ahmetcnd/Developer/paemisyon/apps/web/public/soru-gorsel/paem-9';
export const GORSEL_TABAN = '/soru-gorsel/paem-9';
const DPI = 200;
const OLCEK = DPI / 72;

/** soru no → A kitapçığı s.17 üzerinde nokta cinsinden kırpma kutusu. */
const KUTULAR: Record<number, { x: number; y: number; g: number; y2: number }> = {
  97: { x: 40, y: 108, g: 252, y2: 177 },
  98: { x: 40, y: 466, g: 252, y2: 548 },
  // 99'da semboller hem sayı listesinde hem soru cümlesinin içinde geçiyor:
  // kökün TAMAMI görsele girer, metin sürümü yalnız arama/erişilebilirlik için.
  99: { x: 300, y: 96, g: 284, y2: 226 },
  100: { x: 300, y: 558, g: 284, y2: 624 },
};
const SAYFA = 17;

function main() {
  mkdirSync(HEDEF, { recursive: true });
  for (const [no, k] of Object.entries(KUTULAR)) {
    const px = (v: number) => String(Math.round(v * OLCEK));
    execFileSync('pdftoppm', [
      '-png', '-r', String(DPI),
      '-f', String(SAYFA), '-l', String(SAYFA),
      '-x', px(k.x), '-y', px(k.y), '-W', px(k.g), '-H', px(k.y2 - k.y),
      PDF, `${HEDEF}/${no}`,
    ]);
    // pdftoppm dosya adına sayfa numarasını ekler: "97-17.png"
    execFileSync('mv', [`${HEDEF}/${no}-${SAYFA}.png`, `${HEDEF}/${no}.png`]);
    console.log(`${no}.png  ${(statSync(`${HEDEF}/${no}.png`).size / 1024).toFixed(1)} KB`);
  }
  console.log(`\n→ ${HEDEF}`);
}
main();
