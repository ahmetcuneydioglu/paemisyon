/**
 * Doc 38 — hakemlerin önerdiği düzeltmeleri aday dosyasına uygular.
 *
 * Yalnız İKİ hakemin de aynı düzeltmeyi önerdiği yerler uygulanır ve her
 * düzeltme `duzeltme.json` dosyasında ESKİ/YENİ olarak açıkça yazılır: burada
 * kaynağın metnini değiştiriyoruz, bu iz kalmadan yapılmamalı.
 *
 * Metin bulunamazsa script DURUR — "bulamadım, geçtim" sessiz bir kusurdur.
 *
 *   npx tsx scripts/ogm-duzeltme-uygula.ts <doc> <aday.json> <duzeltme.json>
 *   APPLY=1 … ile yazar
 */
import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.env.APPLY === '1';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;

type Duzeltme = { id: string; alan: 'kok' | (typeof SIKLAR)[number]; eski: string; yeni: string; gerekce: string };

function main() {
  const [doc, adayYolu, duzeltmeYolu] = process.argv.slice(2);
  if (!doc || !adayYolu || !duzeltmeYolu)
    throw new Error('kullanım: ogm-duzeltme-uygula.ts <doc> <aday.json> <duzeltme.json>');

  const aday = JSON.parse(readFileSync(adayYolu, 'utf8'));
  const duzeltmeler: Duzeltme[] = JSON.parse(readFileSync(duzeltmeYolu, 'utf8'));
  const kayit: any[] = [];

  for (const d of duzeltmeler) {
    const q = aday.find((x: any) => x.id === d.id);
    if (!q) throw new Error(`${d.id}: adayda yok`);
    const oncesi = d.alan === 'kok' ? q.kok : q.siklar[d.alan];
    if (!oncesi.includes(d.eski))
      throw new Error(`${d.id} · ${d.alan}: aranan metin YOK → ${JSON.stringify(d.eski)}`);
    const kez = oncesi.split(d.eski).length - 1;
    if (kez !== 1) throw new Error(`${d.id} · ${d.alan}: metin ${kez} kez geçiyor, tek olmalı`);
    const sonrasi = oncesi.replace(d.eski, d.yeni);
    kayit.push({ id: d.id, alan: d.alan, gerekce: d.gerekce, oncesi, sonrasi });
    if (APPLY) { if (d.alan === 'kok') q.kok = sonrasi; else q.siklar[d.alan] = sonrasi; }
  }

  for (const k of kayit) {
    console.log(`\n${k.id} · ${k.alan}`);
    console.log(`  önce : ${k.oncesi.replace(/\n/g, ' ').slice(0, 110)}`);
    console.log(`  sonra: ${k.sonrasi.replace(/\n/g, ' ').slice(0, 110)}`);
  }
  console.log(`\n${kayit.length} düzeltme`);
  if (!APPLY) { console.log('(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  writeFileSync(adayYolu, JSON.stringify(aday, null, 1));
  writeFileSync(`${doc}/duzeltme-kaydi.json`, JSON.stringify(kayit, null, 1));
  console.log(`✓ uygulandı · iz: ${doc}/duzeltme-kaydi.json`);
}
main();
