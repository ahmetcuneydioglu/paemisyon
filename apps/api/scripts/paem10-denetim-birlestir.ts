/**
 * Doc 36 — PAEM 10 kör denetim sonuçlarını resmî anahtarla karşılaştırır.
 *
 * Denetçi cevabı anahtarla AYRIŞIYORSA üç olasılık var ve hangisi olduğunu
 * tespit etmek hakemin işi (HAKEM-TALIMATI.md):
 *   1. Denetçi yanılmış → anahtar doğru, soru olduğu gibi girer.
 *   2. Bizim aktarımımız bozuk → soru metni yanlış çıkarılmış.
 *   3. Soru kusurlu → iki savunulabilir şık, belirsiz kök vb.
 *
 * PAEM 9'dan farkı: orada dördüncü bir olasılık daha vardı (mevzuat eskimiş).
 * PAEM 10 bir günlük olduğu için o dal pratikte kapalı — ama denetçi
 * `eskime` yazdıysa yine de hakeme taşınır.
 *
 * AKTARIM HATASI olasılığı burada PAEM 9'dakinden DÜŞÜK: iki kitapçık da
 * okunarak 100/100 soruda anahtar çapraz doğrulandı. Yine de hakem, soruyu
 * kaynak kitapçıkla karşılaştırmadan karar vermemeli.
 *
 *   npx tsx scripts/paem10-denetim-birlestir.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const PARTILER = [
  'polis-cmk',
  'ceza-anayasa',
  'idare-insanhaklari',
  'inkilap-genelkultur',
  'analitik-matematik',
] as const;

type Denetim = {
  no: number;
  cevap: string;
  guven: 'yuksek' | 'orta' | 'dusuk';
  kaynak?: string;
  kaynakUrl?: string;
  gerekce?: string;
  eskime?: string | null;
  dogrulanamadi?: boolean;
  uyari?: string | null;
};

/** Hakeme taşınma sebebi. Birden çok sebep olabilir. */
type Karar = 'CELISKI' | 'ZAYIF' | 'KUSUR-UYARISI' | 'ESKIME' | 'DOGRULANAMADI';

function main() {
  const sorular = JSON.parse(
    readFileSync(`${KOK}/ham/paem10-B-sorular.json`, 'utf8'),
  ) as { no: number; kok: string; siklar: Record<string, string>; dogru: string }[];
  const soruOf = new Map(sorular.map((s) => [s.no, s]));

  const hepsi: (Denetim & { parti: string; anahtar: string })[] = [];
  const eksikParti: string[] = [];
  for (const p of PARTILER) {
    const dosya = `${KOK}/denetim/paem10-${p}-d1.json`;
    if (!existsSync(dosya)) {
      eksikParti.push(p);
      continue;
    }
    const d = JSON.parse(readFileSync(dosya, 'utf8')) as Denetim[];
    const anahtar = new Map(
      (JSON.parse(readFileSync(`${KOK}/parti/paem10-${p}-anahtar.json`, 'utf8')) as {
        no: number;
        dogru: string;
      }[]).map((x) => [x.no, x.dogru]),
    );
    for (const r of d) {
      const a = anahtar.get(r.no);
      if (!a) throw new Error(`${p}/${r.no}: anahtarda yok`);
      hepsi.push({ ...r, parti: p, anahtar: a });
    }
  }

  if (eksikParti.length) {
    console.log(`HENÜZ GELMEYEN PARTİ: ${eksikParti.join(', ')}\n`);
  }

  const hakemlik: {
    no: number;
    kararlar: Karar[];
    denetciCevabi: string;
    anahtar: string;
    guven: string;
    gerekce?: string;
    uyari?: string | null;
    eskime?: string | null;
  }[] = [];

  let uyumlu = 0;
  for (const r of hepsi) {
    const kararlar: Karar[] = [];
    if (r.cevap !== r.anahtar) kararlar.push('CELISKI');
    else uyumlu++;
    if (r.guven === 'dusuk') kararlar.push('ZAYIF');
    if (r.uyari) kararlar.push('KUSUR-UYARISI');
    if (r.eskime) kararlar.push('ESKIME');
    if (r.dogrulanamadi) kararlar.push('DOGRULANAMADI');
    if (kararlar.length) {
      hakemlik.push({
        no: r.no,
        kararlar,
        denetciCevabi: r.cevap,
        anahtar: r.anahtar,
        guven: r.guven,
        gerekce: r.gerekce,
        uyari: r.uyari,
        eskime: r.eskime,
      });
    }
  }
  hakemlik.sort((a, b) => a.no - b.no);

  console.log(`denetlenen soru: ${hepsi.length}/100`);
  console.log(`  anahtarla UYUMLU : ${uyumlu}`);
  console.log(`  hakeme taşınan   : ${hakemlik.length}`);
  const sayim = new Map<Karar, number>();
  for (const h of hakemlik)
    for (const k of h.kararlar) sayim.set(k, (sayim.get(k) ?? 0) + 1);
  for (const [k, n] of [...sayim].sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(n).padStart(3)}  ${k}`);
  }

  if (hakemlik.length) {
    console.log('\nHAKEME TAŞINANLAR');
    for (const h of hakemlik) {
      const s = soruOf.get(h.no)!;
      const ayri = h.kararlar.includes('CELISKI');
      console.log(
        `  ${String(h.no).padStart(3)} [${h.kararlar.join(',')}] ` +
          (ayri ? `denetçi ${h.denetciCevabi} ↔ anahtar ${h.anahtar}` : `anahtar ${h.anahtar}`) +
          ` · güven ${h.guven}`,
      );
      console.log(`      ${s.kok.replace(/\n/g, ' ').slice(0, 110)}`);
    }
  }

  mkdirSync(`${KOK}/denetim`, { recursive: true });
  writeFileSync(
    `${KOK}/denetim/paem10-hakemlik.json`,
    JSON.stringify(
      hakemlik.map((h) => ({
        ...h,
        kok: soruOf.get(h.no)!.kok,
        siklar: soruOf.get(h.no)!.siklar,
      })),
      null,
      1,
    ),
  );
  console.log(`\n→ denetim/paem10-hakemlik.json (${hakemlik.length} kayıt)`);
}

main();
