/**
 * Doc 37 — iki bağımsız transkriptin karşılaştırılması.
 *
 * Resim olarak basılmış soruların metni ajanlara yazdırılıyor. Tek bir ajanın
 * çıktısına güvenmek, kaynağı görmeden soru yazmak demektir; bu yüzden iki ajan
 * aynı sayfaları ayrı ayrı okuyor ve çıktıları BURADA karşılaştırılıyor.
 *
 * Ayrışan her soru insana gider. Ayrıca `--referans` verilirse (metin katmanı
 * sağlam olan sorular) transkriptler KESİN DOĞRUYLA da karşılaştırılır —
 * ajanların ne kadar güvenilir kopyaladığının ölçüsü budur.
 *
 * Karşılaştırma normalize edilmiş metin üzerinden: tırnak çeşitleri, tire
 * çeşitleri, ardışık boşluk ve satır sonu farkları kusur sayılmaz; harf, rakam
 * ve roma rakamı farkları sayılır.
 *
 *   npx tsx scripts/ogm-transkript-karsilastir.ts <a.json> <b.json> [--referans <ham.json>]
 */
import { readFileSync } from 'node:fs';

const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;

/** Dizgi gürültüsünü at: aynı metnin iki yazımı kusur sayılmasın. */
const normalize = (t: string) =>
  (t ?? '')
    // Tipografik varyantlar tek biçime indirilir: ajanlar akıllı tırnağı düz
    // tırnak yazınca bu bir metin farkı DEĞİLDİR. Kod noktaları açıkça
    // yazılıyor — kaynak dosyaya akıllı tırnak koymak, aracın kendisini
    // ayıklamak istediği soruna düşürüyor.
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** İlk ayrışan yeri göster — "şurada ayrıldılar" demek, "ayrıldılar"dan iyi. */
function ilkFark(a: string, b: string): string {
  const x = normalize(a), y = normalize(b);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  const pencere = (s: string) => s.slice(Math.max(0, i - 30), i + 30).replace(/\n/g, '⏎');
  return `…${pencere(x)}…\n            …${pencere(y)}…`;
}

function karsilastir(ad: string, A: any[], B: any[]) {
  const mb = new Map(B.map((q) => [q.id, q]));
  const farklar: string[] = [];
  let esit = 0;

  for (const a of A) {
    const b = mb.get(a.id);
    if (!b) { farklar.push(`${a.id}: ikinci çıktıda YOK`); continue; }
    const alanlar: string[] = [];
    if (normalize(a.kok) !== normalize(b.kok)) alanlar.push('kok');
    for (const l of SIKLAR)
      if (normalize(a.siklar?.[l]) !== normalize(b.siklar?.[l])) alanlar.push(`şık ${l}`);
    if (!!a.okunamadi !== !!b.okunamadi) alanlar.push('okunamadi');
    if (alanlar.length) {
      farklar.push(`${a.id}: ${alanlar.join(', ')}`);
      const ilk = alanlar[0];
      const [x, y] = ilk === 'kok' ? [a.kok, b.kok] : [a.siklar?.[ilk.slice(-1)], b.siklar?.[ilk.slice(-1)]];
      farklar.push(`            ${ilkFark(x ?? '', y ?? '')}`);
    } else esit++;
  }
  for (const b of B) if (!A.some((a) => a.id === b.id)) farklar.push(`${b.id}: ilk çıktıda YOK`);

  console.log(`\n${ad}: ${esit}/${A.length} birebir aynı`);
  for (const f of farklar) console.log(`  ${f}`);
  return farklar.length === 0;
}

function main() {
  const [aYol, bYol] = process.argv.slice(2);
  const refIdx = process.argv.indexOf('--referans');
  const A = JSON.parse(readFileSync(aYol, 'utf8'));
  const B = JSON.parse(readFileSync(bYol, 'utf8'));

  const ikisiTutuyor = karsilastir('iki transkript', A, B);

  if (refIdx > 0) {
    // Referans = pdftotext'in metin katmanından çıkardığı KESİN doğru.
    const ham = JSON.parse(readFileSync(process.argv[refIdx + 1], 'utf8'));
    const test = /t(\d+)s/.exec(A[0]?.id ?? '')?.[1] ?? '?';
    const ref = ham.map((q: any) => ({ id: `t${test}s${q.no}`, kok: q.kok, siklar: q.siklar }));
    const refIds = new Set(ref.map((r: any) => r.id));
    console.log(`\n═══ KALİBRASYON — metin katmanı sağlam ${ref.length} soru ═══`);
    karsilastir('A ↔ kesin doğru', ref, A.filter((q: any) => refIds.has(q.id)));
    karsilastir('B ↔ kesin doğru', ref, B.filter((q: any) => refIds.has(q.id)));
  }

  console.log(ikisiTutuyor ? '\n✓ iki transkript birebir aynı' : '\n⚠ transkriptler ayrışıyor — insan bakmalı');
}
main();
