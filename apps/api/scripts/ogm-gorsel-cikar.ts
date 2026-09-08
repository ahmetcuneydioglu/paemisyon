/**
 * Doc 37 — OGM testlerindeki, metin katmanında BULUNMAYAN görselleri çıkarır.
 *
 * Yedi testin tamamında tek bir görsel var (`pdfimages -list` ile doğrulandı):
 * test3'ün 2. sorusundaki muharebe-antlaşma tablosu. Kök "Yukarıda verilen
 * tablo incelendiğinde…" diyor ama tablo bir resim; `pdftotext` hiçbir şey
 * çıkarmıyor, yani soru metin hâliyle ÇÖZÜLEMEZ.
 *
 * Çözüm `QuestionVersion.mediaUrl` — API, web oynatıcı ve Flutter zaten render
 * ediyor (Doc 36'da PAEM 9'un şekilli soruları böyle taşındı).
 *
 * Kırpma kutusu `pdftotext -bbox` ile ölçüldü: tablo, soru başlığı ile kökün
 * ilk satırı arasında duruyor.
 *
 *   npx tsx scripts/ogm-gorsel-cikar.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const HEDEF = '/Users/ahmetcnd/Developer/paemisyon/apps/web/public/soru-gorsel/ogm';
export const GORSEL_TABAN = '/soru-gorsel/ogm';
const DPI = 200;
const OLCEK = DPI / 72;

/** soru kimliği → { pdf, sayfa, nokta cinsinden kırpma kutusu } */
const KUTULAR: Record<string, { pdf: string; sayfa: number; x: number; y: number; g: number; h: number }> = {
  t3s2: { pdf: `${process.env.HOME}/Downloads/test3.pdf`, sayfa: 1, x: 45, y: 325, g: 263, h: 101 },
};

function main() {
  mkdirSync(HEDEF, { recursive: true });
  for (const [id, k] of Object.entries(KUTULAR)) {
    const px = (v: number) => String(Math.round(v * OLCEK));
    execFileSync('pdftoppm', [
      '-png', '-r', String(DPI),
      '-f', String(k.sayfa), '-l', String(k.sayfa),
      '-x', px(k.x), '-y', px(k.y), '-W', px(k.g), '-H', px(k.h),
      k.pdf, `${HEDEF}/${id}`,
    ]);
    const yol = `${HEDEF}/${id}-${k.sayfa}.png`;
    console.log(`${id} → ${yol}  (${(statSync(yol).size / 1024).toFixed(0)} KB)  url: ${GORSEL_TABAN}/${id}-${k.sayfa}.png`);
  }
}
main();
