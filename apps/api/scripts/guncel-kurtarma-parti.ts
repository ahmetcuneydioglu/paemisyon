/** Doc 35 — uyarılı soruları kurtarma turuna paketler (SALT OKUMA). */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
// GUNCEL_KOK ile başka bir parti klasörü seçilir (ör. docs/35-guncel-kultur/parti-2);
// varsayılan ilk partidir. Her parti kendi arastirma/parti/denetim/kurtarma alt klasörlerini taşır.
const KOK = process.env.GUNCEL_KOK ?? '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';
const CAP = Number(process.env.CAP ?? 14); // parça başına soru (kurtarma ajanı başına iş)
/** Tamamlanmış alanların kurtarması bitti; yalnız yeni alanlar paketlenir. */
const ATLA = new Set(['ekonomi-teknoloji-savunma', 'kultur-sanat-bilim', 'spor', 'turkiye-siyaset-mevzuat', 'uluslararasi',
  // 2. parti (parti-2/, 23 Eyl 2026)
  'savunma-2026', 'egm-ic-guvenlik', 'kurumlar-2026', 'uluslararasi-2026', 'spor-2026', 'vefat-2026', 'kultur-sanat-2026',
]);

const soruOf = new Map<string, any>();
for (const f of readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json'))) {
  const alan = f.replace('.json', '');
  JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8')).sorular.forEach((s: any, i: number) =>
    soruOf.set(`${alan}-${i + 1}`, s));
}
const denetci = new Map<string, any[]>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-d[12]\.json$/.test(x)))
  for (const x of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (!denetci.has(x.id)) denetci.set(x.id, []);
    denetci.get(x.id)!.push({ cevap: x.cevap, kaynak: x.kaynak, kaynakUrl: x.kaynakUrl, gerekce: x.gerekce, uyari: x.uyari });
  }

const adaylar: any[] = [];
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x)))
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (k.karar === 'ONAY' || k.karar === 'ZAYIF') continue;
    if (ATLA.has(k.alan)) continue;
    const s = soruOf.get(k.id);
    if (!s) continue;
    adaylar.push({
      id: k.id, alan: k.alan, karar: k.karar, kok: s.kok, siklar: s.siklar,
      dogruCevap: s.dogru, aciklama: s.aciklama, kaynak: s.kaynak, kaynakUrl: s.kaynakUrl,
      olayTarihi: s.olayTarihi, uyarilar: k.uyarilar, denetciler: denetci.get(k.id) ?? [],
    });
  }
adaylar.sort((a, b) => a.id.localeCompare(b.id));
mkdirSync(`${KOK}/kurtarma`, { recursive: true });
for (let i = 0; i * CAP < adaylar.length; i++) {
  const pay = adaylar.slice(i * CAP, (i + 1) * CAP);
  writeFileSync(`${KOK}/kurtarma/parca-${i + 1}.json`, JSON.stringify({ parca: i + 1, sorular: pay }, null, 1));
  console.log(`  parca-${i + 1}.json → ${pay.length} soru`);
}
console.log(`\ntoplam ${adaylar.length}`);
