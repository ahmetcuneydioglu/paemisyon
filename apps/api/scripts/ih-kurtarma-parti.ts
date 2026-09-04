/**
 * Doc 33 — bankaya girmeyen soruları KURTARMA turu için paketler (SALT OKUMA).
 *
 * Her kayıtta düzeltme kararını verecek her şey bulunur: soru, şıklar, kitabın
 * anahtarı, hakem kararı, iki denetçinin uyarısı/dayanağı/gerekçesi, kitabın
 * bilgi notu ve hangi resmî metne bakılacağı.
 *
 *   npx tsx scripts/ih-kurtarma-parti.ts [parcaBoyu]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';
const PARCA = Number(process.argv[2] ?? 17);

const DAYANAK: Record<string, string> = {
  doktrin: 'Yetkili kanun metni YOK — akademik kaynak/eser künyesiyle çalış',
  'anayasa-6216': 'mevzuat/anayasa.md + mevzuat/6216-aym-kanunu.md',
  '3686': 'mevzuat/3686-ihik.md',
  '6701': 'mevzuat/6701-tihek.md',
  '6328': 'mevzuat/6328-kdk.md + mevzuat/anayasa.md md 74',
  bm: 'Elde metin YOK — BM Şartı, UAD Statüsü, BM sözleşmeleri (künye ile)',
  aihs: 'mevzuat/aihs.md',
  'avrupa-konseyi': 'Elde metin YOK — Avrupa Konseyi Statüsü, AK sözleşmeleri (künye ile)',
  ab: 'Elde metin YOK — AB antlaşmaları (ABA/ABİA), ABAD Statüsü (künye ile)',
};

const kor = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-kor\.json$/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  if (!o.konu) continue;
  for (const q of o.sorular) kor.set(q.id, { ...q, bolum: o.baslik, kaynak: o.kaynakKodu });
}
const notlar = existsSync(`${KOK}/kitap-notlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/kitap-notlari.json`, 'utf8')) : {};
const denetci = new Map<string, any[]>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /^b\d+-d[12]\.json$/.test(x) && !x.startsWith('b90'))) {
  for (const x of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (!denetci.has(x.id)) denetci.set(x.id, []);
    denetci.get(x.id)!.push({ cevap: x.cevap, dayanak: x.dayanak, gerekce: x.gerekce, uyari: x.uyari });
  }
}

const adaylar: any[] = [];
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x) && !x.startsWith('b90'))) {
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (k.karar === 'ONAY' || k.karar === 'ZAYIF-ONAY') continue;
    const q = kor.get(k.id);
    if (!q) continue;
    adaylar.push({
      id: k.id, bolum: q.bolum, kok: q.kok, siklar: q.siklar,
      kitapCevabi: k.kitapCevabi, karar: k.karar,
      hakemCevabi: k.hakemCevabi ?? null, hakemAlintisi: k.hakemAlintisi ?? null,
      uyarilar: k.uyarilar, denetciler: denetci.get(k.id) ?? [],
      kitapNotu: notlar[k.id] ?? null,
      dayanakKaynagi: DAYANAK[q.kaynak] ?? q.kaynak,
    });
  }
}
adaylar.sort((a, b) => {
  const [ab, an] = a.id.slice(1).split('-').map(Number);
  const [bb, bn] = b.id.slice(1).split('-').map(Number);
  return ab - bb || an - bn;
});

mkdirSync(`${KOK}/kurtarma`, { recursive: true });
for (let i = 0; i * PARCA < adaylar.length; i++) {
  const pay = adaylar.slice(i * PARCA, (i + 1) * PARCA);
  writeFileSync(`${KOK}/kurtarma/parca-${i + 1}.json`, JSON.stringify({ parca: i + 1, sorular: pay }, null, 1));
  console.log(`parca-${i + 1}.json → ${pay.length} soru (${pay[0].id} … ${pay[pay.length - 1].id})`);
}
console.log(`\ntoplam ${adaylar.length} soru, ${Math.ceil(adaylar.length / PARCA)} parça`);
