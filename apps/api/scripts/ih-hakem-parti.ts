/**
 * Doc 33 — çözülmemiş ÇELİŞKİleri hakem partisine toplar (SALT OKUMA).
 * Zaten bağlayıcı hakem kararı olanlar atlanır.
 *   npx tsx scripts/ih-hakem-parti.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';

const DAYANAK: Record<string, string> = {
  doktrin: 'Yetkili kanun metni yok — akademik kaynak/eser adıyla doğrula',
  'anayasa-6216': 'mevzuat/anayasa.md + mevzuat/6216-aym-kanunu.md',
  '3686': 'mevzuat/3686-ihik.md',
  '6701': 'mevzuat/6701-tihek.md',
  '6328': 'mevzuat/6328-kdk.md + mevzuat/anayasa.md md 74',
  bm: 'Elde metin YOK — BM Şartı, UAD Statüsü, BM sözleşmeleri (künye ile)',
  aihs: 'mevzuat/aihs.md',
  'avrupa-konseyi': 'Elde metin YOK — Avrupa Konseyi Statüsü ve AK sözleşmeleri (künye ile)',
  ab: 'Elde metin YOK — AB antlaşmaları, ABAD Statüsü (künye ile)',
};

const kor = new Map<string, { kok: string; siklar: Record<string, string>; kaynak: string; bolum: string }>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-kor\.json$/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  if (!o.kaynakKodu) continue;
  for (const q of o.sorular) kor.set(q.id, { kok: q.kok, siklar: q.siklar, kaynak: o.kaynakKodu, bolum: o.baslik });
}
const cozulmus = existsSync(`${KOK}/denetim/hakem-kararlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/denetim/hakem-kararlari.json`, 'utf8')) : {};

const cel: unknown[] = [];
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x))) {
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (k.karar !== 'CELISKI' || cozulmus[k.id]) continue;
    const q = kor.get(k.id);
    if (!q) continue;
    cel.push({
      id: k.id, bolum: q.bolum, kok: q.kok, siklar: q.siklar,
      kitapCevabi: k.kitapCevabi, denetciCevabi: k.d1 === k.d2 ? k.d1 : `${k.d1}/${k.d2}`,
      denetciGerekcesi: k.gerekce, denetciDayanagi: k.dayanak,
      dayanakDosyasi: DAYANAK[q.kaynak] ?? q.kaynak,
    });
  }
}
writeFileSync(`${KOK}/parti/b91-hakem.json`, JSON.stringify({ bolum: 91, baslik: 'HAKEM TURU', sorular: cel }, null, 1));
console.log(`hakem partisi: ${cel.length} soru → ${cel.map((c: any) => c.id).join(', ')}`);
