/**
 * Doc 39 — aday dosyalarının bütünlük taraması (yazmadan ÖNCE çalıştırılır).
 *
 * NEDEN: `doc39-bankaya-yaz.ts` mükerreri `contentHash` ile ayıklar; parmak izi
 * kök + ŞIK SIRASI üzerinden hesaplandığı için, iki parti aynı soruyu şıkları
 * farklı sırada üretirse çakışma GÖRÜNMEZ ve banka mükerrer alır. 3201'de tam
 * bu oldu: p1 (md 13 rütbe tablosu) ile p2 (md 55 bekleme süreleri tablosu)
 * "Emniyet Amiri hangi meslek derecesindedir" sorusunu bağımsız olarak üretti.
 *
 * Bu script kökü normalize ederek dosya İÇİ ve dosyalar ARASI çakışmayı,
 * şema bozukluğunu ve parti kapsamı dışına taşan articleNo'ları bulur.
 *
 *   npx tsx scripts/doc39-parti-butunluk.ts <doc-dizini>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ALANLAR = new Set(['id', 'articleNo', 'kok', 'siklar', 'dogru', 'aciklama', 'dayanak', 'zorluk', 'tur']);
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const doc = process.argv[2];
if (!doc) throw new Error('kullanım: doc39-parti-butunluk.ts <doc-dizini>');

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr');
const izi = (s: string) => createHash('md5').update(norm(s)).digest('hex');

type Kayit = { dosya: string; id: string; articleNo: string };
const kokler = new Map<string, Kayit[]>();
let toplam = 0, sorun = 0;

for (const f of readdirSync(`${doc}/aday`).filter((x) => x.endsWith('.json')).sort()) {
  const parti = f.replace(/\.json$/, '');
  // Üretici hâlâ yazıyorsa dosya yarım olabilir; tarama çökmemeli.
  let d: any[];
  try {
    d = JSON.parse(readFileSync(`${doc}/aday/${f}`, 'utf8'));
  } catch {
    console.log(`${parti.padEnd(11)}   —  ⏳ okunamadı (yazılıyor olabilir), atlandı`);
    continue;
  }
  toplam += d.length;
  const hata: string[] = [];
  for (const q of d) {
    if (Object.keys(q).some((k) => !ALANLAR.has(k)) || ALANLAR.size !== Object.keys(q).length) hata.push(`${q.id}: şema`);
    if (SIKLAR.some((l) => !q.siklar?.[l]?.trim())) hata.push(`${q.id}: eksik şık`);
    if (!SIKLAR.includes(q.dogru)) hata.push(`${q.id}: geçersiz doğru cevap`);
    if (new Set(SIKLAR.map((l) => norm(q.siklar[l]))).size !== 5) hata.push(`${q.id}: yinelenen şık`);
    if (!q.id?.startsWith(`${parti}-`)) hata.push(`${q.id}: yabancı id`);
    kokler.set(izi(q.kok), [...(kokler.get(izi(q.kok)) ?? []), { dosya: parti, id: q.id, articleNo: q.articleNo }]);
  }
  console.log(`${parti.padEnd(11)} ${String(d.length).padStart(3)} soru  ${hata.length ? '✗ ' + hata.join(' · ') : '✓'}`);
  sorun += hata.length;
}

const cakisan = [...kokler.values()].filter((v) => v.length > 1);
console.log(`\ntoplam aday: ${toplam}`);
console.log(`şema/biçim sorunu: ${sorun}`);
console.log(`AYNI KÖK (mükerrer): ${cakisan.length}`);
for (const g of cakisan) console.log(`   ${g.map((x) => `${x.dosya}/${x.id} (md ${x.articleNo})`).join('  ↔  ')}`);
if (sorun || cakisan.length) process.exitCode = 1;
