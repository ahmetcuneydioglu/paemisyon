/**
 * Doc 36 — PAEM 9'un 100 sorusunu derse ve konuya bağlar.
 *
 * PAEM'in blok düzeni sabittir (müfredat: 7 ders × 10 + Genel Kültür 30) ve
 * kitapçıkta sorular blok blok sıralı. Ders bu yüzden SIRA NUMARASINDAN
 * deterministik çıkar; elle karar yalnız konu (kanun) düzeyinde gerekir.
 *
 * Not: 2022'deki PAEM 7'de blok düzeni farklıydı (Polis Mevzuatı 30, Genel
 * Kültür 10). Bu tablo PAEM 9'a özeldir; her sınav için yeniden kurulmalı.
 *
 *   npx tsx scripts/paem9-siniflandir.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';

/** [ilk, son] → [ders, varsayılan konu] */
const BLOKLAR: [number, number, string, string][] = [
  [1, 10, 'Polis Mevzuatı', '2559 Sayılı Polis Vazife ve Salâhiyet Kanunu (PVSK)'],
  [11, 20, 'Ceza Muhakemesi Hukuku', '5271 Sayılı Ceza Muhakemesi Kanunu (CMK)'],
  [21, 30, 'Ceza Hukuku', 'Türk Ceza Kanunu'],
  [31, 40, 'Anayasa Hukuku', 'T.C. Anayasası'],
  [41, 50, 'İdare Hukuku', 'İdare Hukuku'],
  [51, 60, 'İnsan Hakları', 'İnsan Hakları'],
  [61, 70, 'Atatürk İlkeleri ve İnkılap Tarihi', 'İnkilap Tarihi'],
  [71, 77, 'Genel Kültür ve Analitik Düşünme', 'Genel Kültür'],
  [78, 81, 'Genel Kültür ve Analitik Düşünme', 'Türkçe / Dil Bilgisi'],
  [82, 90, 'Genel Kültür ve Analitik Düşünme', 'Analitik Akıl Yürütme'],
  [91, 100, 'Genel Kültür ve Analitik Düşünme', 'Matematik ve Sayısal Mantık'],
];

/** Blok varsayılanından sapan sorular — konu, sorunun dayandığı mevzuata göre. */
const KONU_ISTISNA: Record<number, string> = {
  1: '3201 Sayılı Emniyet Teşkilat Kanunu',       // EHS mensubunun dernek üyeliği
  4: '2911 Sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu',
  5: '657 Sayılı Devlet Memurları Kanunu',        // kanuna aykırı emir
  6: 'Adli ve Önleme Aramaları Yönetmeliği',
  7: 'Adli Kolluk Yönetmeliği',
  9: '3201 Sayılı Emniyet Teşkilat Kanunu',
  10: 'Adli Kolluk Yönetmeliği',
  41: '2577 İdari Yargılama Usulü Kanunu (İYUK)',
  42: '2577 İdari Yargılama Usulü Kanunu (İYUK)',
  44: '2575 Danıştay Kanunu',
  47: '2575 Danıştay Kanunu',
  49: '2577 İdari Yargılama Usulü Kanunu (İYUK)',
  51: 'Avrupa İnsan Hakları Sözleşmesi (AİHS)',
  73: 'Güncel ve Kültürel Olaylar',               // KAAN
  75: 'Güncel ve Kültürel Olaylar',               // 2025 Dünya Atletizm Şampiyonası
  77: 'Güncel ve Kültürel Olaylar',               // 2024 Cumhurbaşkanlığı Kültür ve Sanat Ödülü
};

function main() {
  const { A } = JSON.parse(readFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, 'utf8'));
  const cikti = (A as any[]).map((s) => {
    const blok = BLOKLAR.find(([i, j]) => s.no >= i && s.no <= j);
    if (!blok) throw new Error(`${s.no} hiçbir bloğa girmiyor`);
    return { no: s.no, ders: blok[2], konu: KONU_ISTISNA[s.no] ?? blok[3], iptal: !!s.iptal };
  });

  const sayim = new Map<string, number>();
  for (const c of cikti) sayim.set(`${c.ders} › ${c.konu}`, (sayim.get(`${c.ders} › ${c.konu}`) ?? 0) + 1);
  for (const [k, v] of [...sayim].sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(3)}  ${k}`);
  console.log(`\ntoplam ${cikti.length} · iptal ${cikti.filter((c) => c.iptal).length}`);

  writeFileSync(`${KOK}/siniflandirma.json`, JSON.stringify(cikti, null, 1));
  console.log('→ siniflandirma.json');
}
main();
