/**
 * Doc 39 — bir aday partisinin ÖLÇÜLEBİLİR kusurlarını tarar.
 *
 * Bu kontroller ajan gerektirmez; kalite ve dil denetçilerinin sayısal işini
 * script'e devretmek ajan maliyetini üçte bire indirdi. Ajan yalnız kanun
 * metnine basma işini yapar.
 *
 * Taranan: şema · beş şık · aynı/boş şık · doğru harf dağılımı · olumsuz kök
 * oranı · mutlak ifadeli şıklarda doğru cevap oranı · doğru şıkkın en uzun/en
 * kısa olması · açıklama uzunluk bandı · şablon izi · cevabı para tutarı olan
 * soru · parti içi ve partiler arası cevap sızıntısı · çeldirici-cevap çakışması.
 *
 *   npx tsx apps/api/scripts/doc39-parti-kontrol.ts <parti…>
 */
import { readFileSync } from 'node:fs';

const SIK = ['A', 'B', 'C', 'D', 'E'] as const;
const ALAN = ['id', 'articleNo', 'kok', 'siklar', 'dogru', 'aciklama', 'dayanak', 'zorluk', 'tur'];
/** Olumsuz kök kalıpları. "değildir/yasaklanmamıştır" gibi küçük harfli ve
 *  çekimli biçimler ilk sürümde kaçmıştı — denetçi yakaladı, liste genişletildi. */
const OLUMSUZ = /(DEĞİL|YANLIŞ|SAYILMAM|YER ALMAZ|OLAMAZ|VERİLEMEZ|KAPSAMAZ|değildir|yanlıştır|sayılmamıştır|yer almaz|yasaklanmamıştır|olamaz|verilemez|kapsamaz|gerekmez|aranmaz)/;
const MUTLAK = /\b(yalnız|yalnızca|sadece|hiçbir|hiç bir|her hâlde|her halde|mutlaka|tamamen|asla|kesinlikle|daima|her zaman|kimse|bütün|tüm)\b/i;
/** Binlik ayraçlı sayı ya da açık TL ibaresi: yeniden değerlemeyle eskiyen cevap. */
const TUTAR = /\b\d{1,3}(?:\.\d{3})+\b|\d[\d.]{2,}\s*(TL|Türk liras)/i;
const BICIM = /^(Yalnız|I ve|II ve|III ve|I, II)/;

type Soru = { id: string; articleNo: string; kok: string; siklar: Record<string, string>; dogru: string; aciklama: string; dayanak: string; zorluk: string; tur: string };

const partiler = process.argv.slice(2);
if (!partiler.length) throw new Error('kullanım: doc39-parti-kontrol.ts <parti…>');
const D = 'docs/39-polis-mevzuati-soru-uretimi/aday';
const hepsi: Soru[] = [];

for (const p of partiler) {
  const d: Soru[] = JSON.parse(readFileSync(`${D}/${p}.json`, 'utf8'));
  hepsi.push(...d);
  const sema = d.filter((q) => ALAN.some((a) => !(a in q)) || SIK.some((l) => !q.siklar?.[l]?.trim()) || !SIK.includes(q.dogru as never));
  const ayni = d.filter((q) => new Set(SIK.map((l) => q.siklar[l].trim().toLocaleLowerCase('tr'))).size !== 5);
  const olumsuz = d.filter((q) => OLUMSUZ.test(q.kok));
  let md = 0, mc = 0;
  for (const q of d) for (const l of SIK) {
    const t = q.siklar[l].trim();
    if (!MUTLAK.test(t) || BICIM.test(t)) continue;
    l === q.dogru ? md++ : mc++;
  }
  const enUzun = d.filter((q) => SIK.reduce((a, b) => (q.siklar[a].length >= q.siklar[b].length ? a : b)) === q.dogru);
  const enKisa = d.filter((q) => SIK.reduce((a, b) => (q.siklar[a].length <= q.siklar[b].length ? a : b)) === q.dogru);
  const L = d.map((q) => q.aciklama.length);
  const ort = L.reduce((a, b) => a + b, 0) / L.length;
  const std = Math.sqrt(L.reduce((a, b) => a + (b - ort) ** 2, 0) / L.length);
  const tutar = d.filter((q) => TUTAR.test(q.siklar[q.dogru]));
  const ilk = new Map<string, number>();
  for (const q of d) { const k = q.aciklama.split(/\s+/)[0]; ilk.set(k, (ilk.get(k) ?? 0) + 1); }
  const enSik = [...ilk.entries()].sort((a, b) => b[1] - a[1])[0];

  console.log(`\n━━ ${p}: ${d.length} soru`);
  console.log(`   şema/şık        : ${sema.length + ayni.length ? [...sema, ...ayni].map((q) => q.id).join(' ') : 'temiz'}`);
  console.log(`   olumsuz kök     : ${olumsuz.length}/${d.length} (%${((100 * olumsuz.length) / d.length).toFixed(0)})${olumsuz.length / d.length > 0.25 ? '  ← 1/4 SINIRI AŞILDI' : ''}`);
  console.log(`   mutlak ifade    : doğru ${md} · çeldirici ${mc}${md + mc ? `  → %${((100 * md) / (md + mc)).toFixed(0)}` : ''}${md + mc && md / (md + mc) < 0.2 ? '  ← %20 HEDEFİNİN ALTINDA' : ''}`);
  console.log(`   doğru şık uzunluk: en uzun ${enUzun.length} · en kısa ${enKisa.length}  (şans ~%40 → ${(((enUzun.length + enKisa.length) / d.length) * 100).toFixed(0)}%)`);
  console.log(`   açıklama        : ${Math.round(ort)}±${Math.round(std)} krkt${std < 60 ? '  ← DAR BANT (dolgu işareti)' : ''}`);
  console.log(`   şablon izi      : en sık ilk kelime "${enSik[0]}" ${enSik[1]}/${d.length}${enSik[1] / d.length > 0.35 ? '  ← YIĞILMA' : ''}`);
  console.log(`   cevabı tutar    : ${tutar.length ? tutar.map((q) => q.id).join(' ') + '  ← YENİDEN DEĞERLEMEYLE ESKİR' : 'yok'}`);
}

// Partiler arası: bir sorunun cevabı başkasının kök/açıklamasında geçiyor mu
const sizinti = hepsi.flatMap((a) => hepsi
  .filter((b) => b !== a && a.siklar[a.dogru].trim().length > 25 &&
    (b.kok + ' ' + b.aciklama).toLocaleLowerCase('tr').includes(a.siklar[a.dogru].trim().toLocaleLowerCase('tr')))
  .map((b) => `${a.id}→${b.id}`));
const carpisma = hepsi.flatMap((a) => hepsi.flatMap((b) => b === a ? [] : SIK
  .filter((l) => l !== a.dogru && a.siklar[l].trim().length > 25 &&
    a.siklar[l].trim().toLocaleLowerCase('tr') === b.siklar[b.dogru].trim().toLocaleLowerCase('tr'))
  .map(() => `${a.id}→${b.id}`)));
console.log(`\n━━ TOPLAM ${hepsi.length} soru`);
console.log(`   cevap sızıntısı (tam metin): ${sizinti.length ? sizinti.join(' ') : 'yok'}`);
console.log(`   çeldirici = başka cevap    : ${carpisma.length ? carpisma.join(' ') : 'yok'}`);
