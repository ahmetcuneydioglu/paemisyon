/**
 * Doc 41 — birleştirmede uyarı/eskime/anahtar-şüphesi alan soruları hakem
 * dosyasına toplar.
 *
 * Doc 40'ın `ogm-hakem-parti.ts` hattının bankaya uyarlanmışı: orada anahtar
 * sınavın basılı cevabıydı, burada **bankanın kendi işaretlediği cevap** —
 * yani hakemin tartışacağı şeyin ta kendisi. Bu yüzden hakem hem bankanın
 * cevabını hem denetçilerin cevabını görüyor; ayrıştıkları yer kararın konusu.
 *
 * SALT OKUMA.
 *   npx tsx scripts/kaym-hakem-parti.ts <doc-dizini>
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const ILGINC = new Set(['UYARI', 'ANAHTAR-SUPHELI', 'ESKIMIS', 'GUNCELLENECEK', 'CELISKI', 'ZAYIF']);

function main() {
  const doc = process.argv[2];
  if (!doc) throw new Error('kullanım: kaym-hakem-parti.ts <doc-dizini>');

  const kayitlar: any[] = [];
  for (const dosya of readdirSync(`${doc}/denetim`).filter((f) => f.endsWith('-karar.json')).sort()) {
    const parti = dosya.replace('-karar.json', '');
    const kararlar = JSON.parse(readFileSync(`${doc}/denetim/${dosya}`, 'utf8'));
    const kor = JSON.parse(readFileSync(`${doc}/parti/${parti}-kor.json`, 'utf8'));
    const korMap = new Map(kor.map((k: any) => [k.id, k]));
    for (const k of kararlar) {
      if (!ILGINC.has(k.karar)) continue;
      const s: any = korMap.get(k.id);
      kayitlar.push({
        id: k.id,
        sinif: k.karar,
        sinavYili: s.sinavYili,
        ders: s.ders,
        kok: s.kok,
        siklar: s.siklar,
        bankaCevabi: k.mebCevabi,
        denetciCevaplari: [k.d1, k.d2, k.d3].filter(Boolean),
        guven: k.guven,
        dayanaklar: [k.dayanak, k.dayanak2].filter(Boolean),
        uyarilar: k.uyarilar ?? [],
      });
    }
  }

  mkdirSync(`${doc}/hakem`, { recursive: true });
  writeFileSync(`${doc}/hakem/uyari.json`, JSON.stringify(kayitlar, null, 1));
  console.log(`Hakeme giden: ${kayitlar.length}`);
  for (const k of kayitlar)
    console.log(`  ${k.id}  ${k.sinif.padEnd(16)} banka=${k.bankaCevabi} denetçi=${k.denetciCevaplari.join('')}`);
  console.log(`\n→ ${doc}/hakem/uyari.json`);
}

main();
