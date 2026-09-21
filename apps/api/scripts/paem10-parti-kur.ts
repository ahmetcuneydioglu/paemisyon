/**
 * Doc 36 — PAEM 10 kör doğrulama partilerini kurar.
 *
 * Denetçi anahtarı GÖRMEZ; soruyu kendisi çözer. Resmî anahtar elimizde
 * olduğu için denetçinin işi cevabı belirlemek değil DOĞRULAMAK.
 *
 * PAEM 9'dan farkı: orada denetimin en değerli çıktısı "2025'ten bu yana
 * mevzuat değişti mi" taramasıydı. PAEM 10 bir günlük; o risk yok denecek
 * kadar az. Buradaki kör geçişin işi ÇIPALAMA YANLILIĞINI kırmak: anahtarı
 * bilerek yazılan bir açıklama, kusurlu bir soruda kendinden emin ve yanlış
 * bir gerekçe üretir. Kör çözüm bunu engeller.
 *
 * Anahtar AYRI dosyada tutulur (`-anahtar.json`); kör dosyaya asla konmaz.
 *
 *   npx tsx scripts/paem10-parti-kur.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const GORSEL = `${KOK}/gorsel`;

/** Denetçi partileri — ders bloklarına göre, her parti tek denetçilik iş. */
const PARTILER: [string, number, number][] = [
  ['polis-cmk', 1, 20],
  ['ceza-anayasa', 21, 40],
  ['idare-insanhaklari', 41, 60],
  ['inkilap-genelkultur', 61, 80],
  ['analitik-matematik', 81, 100],
];

type Soru = {
  no: number;
  kok: string;
  siklar: Record<string, string>;
  dogru: string;
  ortakMetin?: string;
  gorselli?: boolean;
};
type Sinif = { no: number; ders: string; konu: string };

function main() {
  mkdirSync(`${KOK}/parti`, { recursive: true });
  const sorular: Soru[] = JSON.parse(
    readFileSync(`${KOK}/ham/paem10-B-sorular.json`, 'utf8'),
  );
  const sinif: Sinif[] = JSON.parse(
    readFileSync(`${KOK}/paem10-siniflandirma.json`, 'utf8'),
  );
  const sinifOf = new Map(sinif.map((s) => [s.no, s]));

  for (const [ad, ilk, son] of PARTILER) {
    const dilim = sorular.filter((s) => s.no >= ilk && s.no <= son);
    if (dilim.length !== son - ilk + 1) {
      throw new Error(`${ad}: ${son - ilk + 1} soru bekleniyordu, ${dilim.length} var`);
    }

    const kor = dilim.map((s) => {
      const c = sinifOf.get(s.no)!;
      // Şekilli soruda kök tek başına yetmez; denetçi görseli Read ile açar.
      const gorselYolu = s.gorselli ? `${GORSEL}/paem10-B-${s.no}.png` : undefined;
      if (gorselYolu && !existsSync(gorselYolu)) {
        throw new Error(`${s.no}: görsel bekleniyordu ama yok — ${gorselYolu}`);
      }
      return {
        no: s.no,
        ders: c.ders,
        konu: c.konu,
        ...(s.ortakMetin ? { ortakMetin: s.ortakMetin } : {}),
        kok: s.kok,
        siklar: s.siklar,
        ...(gorselYolu ? { gorsel: gorselYolu } : {}),
      };
    });

    // ANAHTAR AYRI DOSYADA. Kör dosyaya sızmadığını burada bir kez daha
    // sınıyoruz: tek satırlık bir hata bütün denetimi anlamsızlaştırır.
    const metin = JSON.stringify(kor);
    for (const s of dilim) {
      if (new RegExp(`"dogru"\\s*:`).test(metin)) {
        throw new Error(`${ad}: kör dosyada "dogru" alanı var — anahtar sızdı`);
      }
    }

    const anahtar = dilim.map((s) => ({ no: s.no, dogru: s.dogru }));
    writeFileSync(`${KOK}/parti/paem10-${ad}-kor.json`, JSON.stringify(kor, null, 1));
    writeFileSync(`${KOK}/parti/paem10-${ad}-anahtar.json`, JSON.stringify(anahtar, null, 1));
    const gorselli = kor.filter((k) => 'gorsel' in k).length;
    console.log(
      `${ad.padEnd(22)} ${String(dilim.length).padStart(3)} soru (${ilk}-${son})` +
        `${gorselli ? ` · ${gorselli} görselli` : ''}`,
    );
  }
  console.log(`\n→ ${KOK}/parti/paem10-*-{kor,anahtar}.json`);
}

main();
