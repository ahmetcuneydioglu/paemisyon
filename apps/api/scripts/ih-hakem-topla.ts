/**
 * Doc 33 — iki hakemin kararlarını birleştirir (SALT OKUMA → tek dosya).
 *
 * Hakemler ancak MUTABIKSA karar bağlayıcıdır; ayrıştıklarında soru çelişkide
 * kalır ve insana gider. Çıktı: denetim/hakem-kararlari.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi/denetim';
type H = { id: string; karar: string; cevap: string; alinti: string; gerekce: string; oneri?: string };

const oku = (n: string): H[] => (existsSync(`${KOK}/${n}`) ? JSON.parse(readFileSync(`${KOK}/${n}`, 'utf8')) : []);
const h1 = oku('b91-hakem1.json');
const h2 = new Map(oku('b91-hakem2.json').map((x) => [x.id, x]));

// Hakem dosyaları her turda ÜZERİNE yazılıyor; önceki turların bağlayıcı
// kararları kaybolmasın diye mevcut sonuç dosyasının üstüne eklenir.
const sonuc: Record<string, { karar: string; cevap: string | null; gerekce: string; alinti: string }> =
  existsSync(`${KOK}/hakem-kararlari.json`)
    ? JSON.parse(readFileSync(`${KOK}/hakem-kararlari.json`, 'utf8'))
    : {};
const oncekiSayi = Object.keys(sonuc).length;
for (const a of h1) {
  const b = h2.get(a.id);
  if (!b) { console.log(`${a.id}: ikinci hakem yok — çelişkide bırakıldı`); continue; }
  if (a.karar !== b.karar) { console.log(`${a.id}: hakemler ayrıştı (${a.karar} / ${b.karar}) — çelişkide bırakıldı`); continue; }
  // "denetci" kararında iki hakem aynı şıkta da birleşmeli.
  if (a.karar === 'denetci' && a.cevap !== b.cevap) {
    console.log(`${a.id}: hakemler "denetci" dedi ama şık farklı (${a.cevap}/${b.cevap}) — çelişkide bırakıldı`);
    continue;
  }
  sonuc[a.id] = {
    karar: a.karar, cevap: a.karar === 'kusurlu' ? null : a.cevap,
    gerekce: `${a.gerekce} // ${b.gerekce}`, alinti: a.alinti,
  };
  console.log(`✓ ${a.id} → ${a.karar}${a.cevap && a.karar !== 'kusurlu' ? ` (${a.cevap})` : ''}`);
}
writeFileSync(`${KOK}/hakem-kararlari.json`, JSON.stringify(sonuc, null, 1));
console.log(`\n${Object.keys(sonuc).length} bağlayıcı hakem kararı (önceki turlardan ${oncekiSayi})`);
