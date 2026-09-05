/**
 * Doc 35 — doğru cevabın şık konumunu dengeler.
 *
 * Üreten ajanlar doğru cevabı ilk şıkka koyma eğiliminde: 70 soruda A %41,
 * bir alanda %100. Aday bunu iki denemede öğrenir ve bilmediği soruda A
 * işaretler; set sınav değerini kaybeder.
 *
 * SIRALI ŞIKLARA DOKUNULMAZ: bütün şıklar sayı/yıl ise (ör. 1945/1949/1950)
 * artan sıra okunabilirliğin parçasıdır, karıştırmak amatörce görünür.
 * Bu sorular dengelemenin dışında tutulur, konumları olduğu gibi kalır.
 *
 * Deterministik: aynı girdi aynı çıktıyı verir (tohum = soru id'si).
 *
 *   npx tsx scripts/guncel-sik-dengele.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/guncel-sik-dengele.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';
const APPLY = process.env.APPLY === '1';
const HARF = ['A', 'B', 'C', 'D', 'E'];
/**
 * Dengeleme BİR KEZ uygulanır. Tamamlanmış alanlar ikinci kez dengelenirse
 * bankaya yazılmış sorularla dosyalar arasında sapma doğar; ayrıca denetim
 * kayıtları zaten o alanların ilk dengelemesine göre geçersizleşmiştir.
 * Yeni alan eklendiğinde ATLA listesine tamamlananlar yazılır.
 */
const ATLA = new Set([
  'ekonomi-teknoloji-savunma', 'kultur-sanat-bilim', 'spor',
  'turkiye-siyaset-mevzuat', 'uluslararasi',
]);

/** Şıkların tamamı sayı/yıl mı — öyleyse sıra anlamlıdır. */
function siraliMi(siklar: Record<string, string>): boolean {
  const sayilar = Object.values(siklar).map((t) => {
    const s = String(t).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    return s && /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  });
  if (sayilar.some((n) => Number.isNaN(n))) return false;
  const artan = [...sayilar].sort((a, b) => a - b);
  const azalan = [...artan].reverse();
  return sayilar.every((n, i) => n === artan[i]) || sayilar.every((n, i) => n === azalan[i]);
}

/** id'den türetilmiş kararlı sözde-rastgele sayı. */
const tohum = (id: string) => parseInt(createHash('sha256').update(id).digest('hex').slice(0, 8), 16);

function main() {
  const dosyalar = readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json'));
  const tumSorular: { alan: string; i: number; s: any; id: string }[] = [];
  for (const f of dosyalar) {
    const o = JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8'));
    const alan = f.replace('.json', '');
    if (ATLA.has(alan)) continue;
    (o.sorular ?? []).forEach((s: any, i: number) => tumSorular.push({ alan, i, s, id: `${alan}-${i + 1}` }));
  }

  const sirali = tumSorular.filter((x) => siraliMi(x.s.siklar));
  const karistirilabilir = tumSorular.filter((x) => !siraliMi(x.s.siklar));
  // Hedef konumlar: karıştırılabilir soruları harflere eşit böl, sıralı
  // soruların mevcut dağılımını da hesaba katarak dengele.
  const mevcut: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const x of sirali) mevcut[x.s.dogru]++;
  const hedefToplam = tumSorular.length / 5;
  const kota: Record<string, number> = {};
  for (const h of HARF) kota[h] = Math.max(0, Math.round(hedefToplam - mevcut[h]));

  // id'ye göre kararlı sıra, sonra kotaya göre dağıt
  const sirada = [...karistirilabilir].sort((a, b) => tohum(a.id) - tohum(b.id));
  const atama = new Map<string, string>();
  let h = 0;
  for (const x of sirada) {
    while (kota[HARF[h % 5]] <= 0 && h < 100) h++;
    const harf = HARF[h % 5];
    atama.set(x.id, harf);
    kota[harf]--;
    h++;
  }

  const oncekiDagilim: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const x of tumSorular) oncekiDagilim[x.s.dogru]++;

  let degisen = 0;
  for (const x of karistirilabilir) {
    const hedef = atama.get(x.id)!;
    if (x.s.dogru === hedef) continue;
    const dogruMetin = x.s.siklar[x.s.dogru];
    const digerler = HARF.filter((l) => l !== x.s.dogru).map((l) => x.s.siklar[l]);
    // kararlı karıştırma
    let t = tohum(x.id);
    for (let i = digerler.length - 1; i > 0; i--) { t = (t * 1103515245 + 12345) >>> 0; const j = t % (i + 1); [digerler[i], digerler[j]] = [digerler[j], digerler[i]]; }
    const yeni: Record<string, string> = {};
    let k = 0;
    for (const l of HARF) yeni[l] = l === hedef ? dogruMetin : digerler[k++];
    x.s.siklar = yeni;
    x.s.dogru = hedef;
    degisen++;
  }

  const son: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const x of tumSorular) son[x.s.dogru]++;
  console.log(`soru: ${tumSorular.length} · sıralı (dokunulmadı): ${sirali.length} · karıştırılan: ${degisen}`);
  console.log(`ÖNCE  ${HARF.map((h) => h + oncekiDagilim[h]).join(' ')}`);
  console.log(`SONRA ${HARF.map((h) => h + son[h]).join(' ')}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  for (const f of dosyalar) {
    const alan = f.replace('.json', '');
    if (ATLA.has(alan)) continue;
    const o = JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8'));
    o.sorular = tumSorular.filter((x) => x.alan === alan).sort((a, b) => a.i - b.i).map((x) => x.s);
    writeFileSync(`${KOK}/arastirma/${f}`, JSON.stringify(o, null, 1));
  }
  console.log('\n✓ araştırma dosyaları güncellendi — parti dosyaları yeniden kurulmalı');
}
main();
