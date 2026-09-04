/**
 * Doc 34 — bankaya girmeyen soruları KURTARMA turu için paketler (SALT OKUMA).
 * Her kayıtta düzeltme kararını verecek her şey bulunur.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
const CAP = 15;

const kor = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x) && !/^(onarilan2?|hakem)-/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  for (const s of o.sorular) kor.set(s.id, { ...s, ders: o.ders ?? '—', dayanak: o.dayanak ?? '—' });
}
const denetci = new Map<string, any[]>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-d[12]\.json$/.test(x))) {
  for (const x of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (!denetci.has(x.id)) denetci.set(x.id, []);
    denetci.get(x.id)!.push({ cevap: x.cevap, guven: x.guven, dayanak: x.dayanak, gerekce: x.gerekce, eskime: x.eskime, uyari: x.uyari });
  }
}
const hakem = existsSync(`${KOK}/denetim/hakem-kararlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/denetim/hakem-kararlari.json`, 'utf8')) : {};

const adaylar: any[] = [];
const gorulen = new Set<string>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x) && !/^onarilan2?-/.test(x))) {
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (k.karar === 'ONAY' || k.karar === 'ZAYIF' || gorulen.has(k.id)) continue;
    const q = kor.get(k.id);
    if (!q) continue;
    gorulen.add(k.id);
    adaylar.push({
      id: k.id, ders: q.ders, dayanakKaynagi: q.dayanak, kok: q.kok, siklar: q.siklar,
      kitapCevabi: k.kitapCevabi, karar: k.karar, hakemCevabi: k.guncelCevap ?? null,
      hakemAlintisi: k.hakemAlintisi ?? null, hakemKarari: hakem[k.id]?.karar ?? null,
      hakemGerekcesi: hakem[k.id]?.gerekce ?? null,
      uyarilar: k.uyarilar ?? [], eskimeler: k.eskimeler ?? [],
      denetciler: denetci.get(k.id) ?? [],
    });
  }
}
adaylar.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
mkdirSync(`${KOK}/kurtarma`, { recursive: true });
for (let i = 0; i * CAP < adaylar.length; i++) {
  const pay = adaylar.slice(i * CAP, (i + 1) * CAP);
  writeFileSync(`${KOK}/kurtarma/parca-${i + 1}.json`, JSON.stringify({ parca: i + 1, sorular: pay }, null, 1));
  console.log(`  parca-${i + 1}.json → ${pay.length} soru (${pay[0].id} … ${pay[pay.length - 1].id})`);
}
console.log(`\ntoplam ${adaylar.length} soru`);
