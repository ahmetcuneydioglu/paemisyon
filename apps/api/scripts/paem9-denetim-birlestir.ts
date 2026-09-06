/**
 * Doc 36 — iki kör denetçinin cevaplarını RESMÎ ANAHTARLA karşılaştırır.
 *
 * Doc 33-35'ten farkı: burada anahtar resmî. Denetçi cevabı belirlemiyor,
 * doğruluyor. Ayrışma iki şeyden birine işaret eder — ya bizim ayrıştırma
 * hatamız/denetçi hatası, ya da 2025'ten bu yana DEĞİŞEN MEVZUAT.
 *
 * Kararlar:
 *   ONAY          iki denetçi de anahtarla aynı
 *   UYARI         anahtarla aynı ama denetçi bir kusura işaret etti
 *   ZAYIF         bir denetçi ayrıştı; anahtar ayakta, kayda geçer
 *   ESKIMIS       iki denetçi de anahtardan ayrıştı VE en az biri mevzuat
 *                 değişikliği gösterdi → soru bugün başka cevap istiyor
 *   CELISKI       iki denetçi de anahtardan ayrıştı, değişiklik gösterilmedi
 *                 → hakem şart (ayrıştırma hatası mı, anahtar hatası mı?)
 *   DOGRULANAMADI denetçi kaynağa ulaşamadı
 *   IPTAL         sınavda iptal edilmiş soru; puanlamaya girmez
 *
 * Hakem dosyası varsa (denetim/<parti>-hakem.json) kararı bağlayıcıdır.
 *
 *   npx tsx scripts/paem9-denetim-birlestir.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const PARTILER = ['polis-cmk', 'ceza-anayasa', 'idare-insanhaklari', 'inkilap-genelkultur', 'analitik-matematik'];

type Denetci = {
  no: number; cevap: string; guven?: string; kaynak?: string; kaynakUrl?: string;
  gerekce?: string; eskime?: string | null; dogrulanamadi?: boolean; uyari?: string | null;
};

function main() {
  const ozet: Record<string, number> = {};
  const tumKararlar: any[] = [];

  for (const parti of PARTILER) {
    const anahtar: { no: number; dogru: string; iptal: boolean }[] =
      JSON.parse(readFileSync(`${KOK}/parti/${parti}-anahtar.json`, 'utf8'));
    const oku = (n: number): Denetci[] => JSON.parse(readFileSync(`${KOK}/denetim/${parti}-d${n}.json`, 'utf8'));
    const d1 = new Map(oku(1).map((x) => [x.no, x]));
    const d2 = new Map(oku(2).map((x) => [x.no, x]));
    const hakemYol = `${KOK}/denetim/${parti}-hakem.json`;
    const hakem = existsSync(hakemYol)
      ? new Map((JSON.parse(readFileSync(hakemYol, 'utf8')) as any[]).map((x) => [x.no, x]))
      : new Map();

    const kararlar = anahtar.map((a) => {
      const x = d1.get(a.no), y = d2.get(a.no);
      if (!x || !y) throw new Error(`${parti}/${a.no}: denetçi cevabı eksik`);
      const uyarilar = [x.uyari, y.uyari].filter(Boolean) as string[];
      const eskimeler = [x.eskime, y.eskime].filter(Boolean) as string[];
      const ayrisan = [x, y].filter((d) => d.cevap !== a.dogru);

      let karar: string;
      if (a.iptal) karar = 'IPTAL';
      else if (x.dogrulanamadi || y.dogrulanamadi) karar = 'DOGRULANAMADI';
      else if (ayrisan.length === 0) karar = uyarilar.length ? 'UYARI' : 'ONAY';
      else if (ayrisan.length === 1) karar = 'ZAYIF';
      else if (x.cevap === y.cevap && eskimeler.length) karar = 'ESKIMIS';
      else karar = 'CELISKI';

      const h = hakem.get(a.no);
      return {
        no: a.no, parti,
        karar: h?.karar ?? karar,
        resmiCevap: a.dogru,
        d1: x.cevap, d2: y.cevap,
        guven: [x.guven, y.guven],
        eskime: eskimeler,
        uyarilar,
        kaynaklar: [x.kaynakUrl, y.kaynakUrl].filter(Boolean),
        gerekce: x.gerekce,
        gerekce2: y.gerekce,
        hakem: h ? { karar: h.karar, gerekce: h.gerekce } : undefined,
      };
    });

    writeFileSync(`${KOK}/denetim/${parti}-karar.json`, JSON.stringify(kararlar, null, 1));
    for (const k of kararlar) ozet[k.karar] = (ozet[k.karar] ?? 0) + 1;
    tumKararlar.push(...kararlar);
    const say = kararlar.reduce((a: Record<string, number>, k) => ((a[k.karar] = (a[k.karar] ?? 0) + 1), a), {});
    console.log(`${parti.padEnd(22)} ${kararlar.length.toString().padStart(3)}  ${JSON.stringify(say)}`);
  }

  console.log(`\nTOPLAM ${tumKararlar.length}  ${JSON.stringify(ozet)}`);
  const dikkat = tumKararlar.filter((k) => ['CELISKI', 'ESKIMIS', 'DOGRULANAMADI'].includes(k.karar));
  for (const k of dikkat) {
    console.log(`\n  ${k.karar}  #${k.no} (${k.parti}) — resmî ${k.resmiCevap}, denetçiler ${k.d1}/${k.d2}`);
    if (k.eskime.length) console.log(`     eskime: ${k.eskime[0]}`);
    console.log(`     ${k.gerekce?.slice(0, 150)}`);
  }
  writeFileSync(`${KOK}/denetim/ozet.json`, JSON.stringify(tumKararlar, null, 1));
}
main();
