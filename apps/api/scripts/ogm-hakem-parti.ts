/**
 * Doc 37 — uyarı alan soruları hakem turuna hazırlar.
 *
 * Denetimde cevap tartışması ÇIKMADI (69 soruda 0 çelişki); tartışma soruların
 * KUSURUNDA. Denetçiler 13 soruya uyarı düştü ama uyarıların ağırlığı çok
 * farklı: kimi "birden fazla şık savunulabilir" diyor, kimi "kökte çoğul kip
 * kullanılmış" diyor. İlki adayın itiraz edeceği bir kusur, ikincisi değil.
 *
 * Bu ayrımı script yapamaz ve tek başıma yapmam da çift denetimin anlamını
 * boşa çıkarır — bu yüzden ayrı bir hakem turu.
 *
 *   npx tsx scripts/ogm-hakem-parti.ts <doc-dizini>
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

/** Tur etiketi: aynı doc altında birden çok hakem turu oluyor. */
const TUR = process.env.TUR ?? '1';

function main() {
  const doc = process.argv[2];
  if (!doc) throw new Error('kullanım: ogm-hakem-parti.ts <doc-dizini>');

  // Aday dosyaları tur tur birikiyor (aday-69, aday-60 …); hepsi okunur.
  const aday = new Map<string, any>();
  for (const f of readdirSync(doc).filter((x) => /^aday-\d+\.json$/.test(x)))
    for (const q of JSON.parse(readFileSync(`${doc}/${f}`, 'utf8'))) aday.set(q.id, q);
  const kayitlar: any[] = [];
  // ogm-1 ilk parti (Test1): kararı kullanıcı verdi, üç uyarılı soru alınmadı.
  for (const f of readdirSync(`${doc}/denetim`).filter((x) => /^ogm-([2-9]|\d\d)-karar\.json$/.test(x)))
    for (const k of JSON.parse(readFileSync(`${doc}/denetim/${f}`, 'utf8')))
      if (k.karar === 'UYARI') {
        const q = aday.get(k.id);
        if (!q) throw new Error(`${k.id} adayda yok`);
        kayitlar.push({ id: k.id, kok: q.kok, siklar: q.siklar, cevap: k.mebCevabi, uyarilar: k.uyarilar });
      }

  kayitlar.sort((a, b) => a.id.localeCompare(b.id));
  mkdirSync(`${doc}/hakem`, { recursive: true });
  writeFileSync(`${doc}/hakem/uyari-${TUR}.json`, JSON.stringify(kayitlar, null, 1));
  console.log(`${kayitlar.length} uyarılı soru → ${doc}/hakem/uyari-${TUR}.json`);
  console.log(`   ${kayitlar.map((k) => k.id).join(' ')}`);
}
main();
