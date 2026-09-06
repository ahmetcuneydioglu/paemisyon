/**
 * Doc 36 — tek soruluk yeniden denetimleri parti dosyalarına işler.
 *
 * Bir soru ayrıştırma hatası yüzünden bozuk sorulmuşsa, düzeltilmiş metinle
 * yeniden kör denetime verilir ve sonuç `denetim/soru-<no>-d<N>.json` olarak
 * düşer. Bu script o kayıtları ilgili partinin d1/d2 dosyasındaki ESKİ
 * kaydın yerine koyar; eski hâli `denetim/yamalanan.json`'a yedeklenir ki
 * neyin neden değiştiği kaybolmasın.
 *
 *   npx tsx scripts/paem9-denetim-yamala.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem9-denetim-yamala.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const PARTILER = ['polis-cmk', 'ceza-anayasa', 'idare-insanhaklari', 'inkilap-genelkultur', 'analitik-matematik'];

function main() {
  const yamalar = readdirSync(`${KOK}/denetim`)
    .map((f) => f.match(/^soru-(\d+)-d(\d)\.json$/))
    .filter(Boolean) as RegExpMatchArray[];
  if (!yamalar.length) { console.log('yama yok'); return; }

  // Soru hangi partide? Anahtar dosyaları söyler.
  const partisi = new Map<number, string>();
  for (const p of PARTILER)
    for (const a of JSON.parse(readFileSync(`${KOK}/parti/${p}-anahtar.json`, 'utf8')) as any[])
      partisi.set(a.no, p);

  const yedek: any[] = existsSync(`${KOK}/denetim/yamalanan.json`)
    ? JSON.parse(readFileSync(`${KOK}/denetim/yamalanan.json`, 'utf8'))
    : [];

  for (const m of yamalar) {
    const no = Number(m[1]), n = m[2];
    const parti = partisi.get(no);
    if (!parti) throw new Error(`#${no} hiçbir partide yok`);
    const yol = `${KOK}/denetim/${parti}-d${n}.json`;
    const kayitlar: any[] = JSON.parse(readFileSync(yol, 'utf8'));
    const yeni = (JSON.parse(readFileSync(`${KOK}/denetim/${m[0]}`, 'utf8')) as any[])[0];
    const i = kayitlar.findIndex((k) => k.no === no);
    if (i < 0) throw new Error(`#${no} ${parti}-d${n} içinde yok`);
    console.log(`${parti}-d${n} #${no}: ${kayitlar[i].cevap} → ${yeni.cevap}`);
    if (!APPLY) continue;
    yedek.push({ parti, denetci: Number(n), no, eski: kayitlar[i], zaman: new Date().toISOString() });
    kayitlar[i] = { ...yeni, no };
    writeFileSync(yol, JSON.stringify(kayitlar, null, 1));
  }

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  writeFileSync(`${KOK}/denetim/yamalanan.json`, JSON.stringify(yedek, null, 1));
  console.log('\n✓ yamalar işlendi · eski kayıtlar denetim/yamalanan.json');
}
main();
