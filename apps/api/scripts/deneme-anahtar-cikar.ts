/**
 * Cevap anahtarı sayfasının OCR'ını çözer ve İKİNCİ bir okumayla karşılaştırır.
 *
 * OCR'da Roma rakamı karışıklığı olağan (I↔1, IO↔10, 6I↔61). Bu yüzden anahtar
 * tek kaynağa bırakılmaz: OCR çıktısı düzeltilir, ayrıca gözle okunmuş referans
 * listeyle karşılaştırılır. İkisi tutmuyorsa script HATA verir — sessizce yanlış
 * anahtar geçmesin.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Gözle okunmuş referans (sayfa 20 görüntüsünden). */
const GOZLE = `1-C 2-C 3-C 4-B 5-B 6-C 7-A 8-C 9-B 10-E
11-B 12-D 13-A 14-A 15-A 16-E 17-B 18-E 19-D 20-C
21-E 22-D 23-B 24-B 25-D 26-C 27-B 28-D 29-A 30-B
31-D 32-B 33-C 34-C 35-E 36-E 37-B 38-B 39-C 40-E
41-E 42-D 43-D 44-B 45-D 46-C 47-C 48-A 49-E 50-B
51-C 52-B 53-C 54-E 55-A 56-B 57-C 58-C 59-C 60-E
61-A 62-D 63-B 64-D 65-C 66-D 67-E 68-D 69-C 70-E
71-C 72-D 73-D 74-B 75-D 76-B 77-E 78-D 79-E 80-E
81-A 82-E 83-B 84-E 85-C 86-E 87-C 88-D 89-B 90-D
91-E 92-A 93-D 94-C 95-A 96-C 97-A 98-B 99-A 100-D`;

function ayristir(metin: string): Map<number, string> {
  const m = new Map<number, string>();
  const duzeltilmis = metin
    .replace(/\bIO\b/g, '10').replace(/\bI6\b/g, '16').replace(/\b6I\b/g, '61')
    .replace(/\bI(\d)\b/g, '1$1').replace(/^I-/gm, '1-').replace(/\bI-/g, '1-')
    .replace(/•/g, '-');
  for (const e of duzeltilmis.matchAll(/\b(\d{1,3})\s*[-–]\s*([A-E])\b/g)) {
    m.set(Number(e[1]), e[2]);
  }
  return m;
}

function main() {
  const ocr = ayristir(readFileSync(process.argv[2], 'utf8'));
  const gozle = ayristir(GOZLE);
  const eksik = [...Array(100)].map((_, i) => i + 1).filter((n) => !gozle.has(n));
  if (eksik.length) throw new Error(`referans listede eksik: ${eksik.join(',')}`);

  const ayrik: string[] = [];
  for (let n = 1; n <= 100; n++) {
    const a = ocr.get(n), b = gozle.get(n);
    if (a !== b) ayrik.push(`${n}: OCR=${a ?? '-'} gözle=${b}`);
  }
  console.log(`OCR'dan çözülen : ${ocr.size}/100`);
  console.log(`referans        : ${gozle.size}/100`);
  console.log(`AYRIŞAN         : ${ayrik.length}`);
  for (const a of ayrik) console.log(`   ! ${a}`);
  if (ayrik.length > 3) {
    throw new Error('İki okuma çok ayrışıyor — anahtar elle doğrulanmadan kullanılmamalı.');
  }
  writeFileSync(process.argv[3], JSON.stringify(Object.fromEntries(gozle), null, 1));
  console.log(`\n✓ anahtar yazıldı (referans esas alındı, OCR doğrulama olarak kullanıldı)`);
}
main();
