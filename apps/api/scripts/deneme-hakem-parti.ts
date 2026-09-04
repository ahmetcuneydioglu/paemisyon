/** Doc 34 — çözülmemiş ÇELİŞKİleri hakem partisine toplar (SALT OKUMA). */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

const kor = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  for (const s of o.sorular) if (!kor.has(s.id)) kor.set(s.id, { ...s, ders: o.ders ?? s.ders, dayanak: o.dayanak ?? s.dayanak });
}
const cozulmus = existsSync(`${KOK}/denetim/hakem-kararlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/denetim/hakem-kararlari.json`, 'utf8')) : {};

const cel = new Map<string, any>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x))) {
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (k.karar !== 'CELISKI' || cozulmus[k.id] || cel.has(k.id)) continue;
    const q = kor.get(k.id);
    if (!q) continue;
    cel.set(k.id, {
      id: k.id, ders: q.ders, dayanakKaynagi: q.dayanak, kok: q.kok, siklar: q.siklar,
      kitapCevabi: k.kitapCevabi, denetciCevaplari: [k.d1, k.d2],
      denetciGerekcesi: k.gerekce, denetciDayanagi: k.dayanak,
      eskimeNotlari: k.eskimeler ?? [], uyarilar: k.uyarilar ?? [],
    });
  }
}
const liste = [...cel.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
writeFileSync(`${KOK}/parti/hakem-kor.json`, JSON.stringify({ baslik: 'HAKEM TURU', sorular: liste }, null, 1));
console.log(`hakem partisi: ${liste.length} soru → ${liste.map((c) => c.id).join(' ')}`);
