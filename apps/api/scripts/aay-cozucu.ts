/**
 * Analitik akıl yürütme çözücüsü — tek çözümlülüğün KABA KUVVETLE kanıtı.
 *
 * Mevzuat sorusunda doğruluk metne bakılarak kanıtlanır. Bu soru tipinde
 * kanıtlanacak şey başka: kurgunun öncülleriyle tutarlı BÜTÜN dünyalar
 * kurulduğunda, şıklardan yalnız BİRİ soruyu karşılıyor mu? PAEM 9'un 88-90.
 * soruları tam burada düştü — Nöroloji'yi zincire yerleştiren tek bir öncül
 * yoktu, beş dizilim birden mümkündü ve iki şık aynı anda tutarlıydı.
 *
 * Bu yüzden soru "tip" taşımaz: her şık kendi NİCELEYİCİSİNİ açıkça yazar
 * (`her` / `bazi` / `hicbiri`). "Kesinlikle doğrudur" ile "olabilir" arasındaki
 * fark, insanın kafasında değil, spesifikasyonun içinde durur.
 *
 *   npx tsx scripts/aay-cozucu.ts        (kendi kendini sınar)
 */

export type Dunya = Record<string, string | number | boolean>;

/** Bir şıkkın iddiası: dünyalar KÜMESİ üzerinde bir önerme. */
export type Iddia = (dunyalar: Dunya[]) => boolean;

export const her =
  (f: (d: Dunya) => boolean): Iddia =>
  (ds) => ds.every(f);
export const bazi =
  (f: (d: Dunya) => boolean): Iddia =>
  (ds) => ds.some(f);
export const hicbiri =
  (f: (d: Dunya) => boolean): Iddia =>
  (ds) => !ds.some(f);

export interface Bulmaca {
  id: string;
  baslik: string;
  /** Öncüllerle tutarlı bütün dünyalar. Boşsa kurgu çelişkilidir. */
  dunyalar: Dunya[];
  siklar: { harf: string; metin: string; iddia: Iddia }[];
  /** Üreticinin doğru dediği şık. */
  isaretli: string;
}

export interface Karar {
  id: string;
  sonuc: 'KANIT' | 'CELISKILI' | 'COKLU-DOGRU' | 'DOGRU-YOK' | 'ANAHTAR-YANLIS';
  dunyaSayisi: number;
  tutan: string[];
  not: string;
}

export function cozumle(b: Bulmaca): Karar {
  const tutan = b.siklar.filter((s) => s.iddia(b.dunyalar)).map((s) => s.harf);
  const ortak = { id: b.id, dunyaSayisi: b.dunyalar.length, tutan };
  if (b.dunyalar.length === 0)
    return { ...ortak, sonuc: 'CELISKILI', not: 'Öncüller birbirini tutmuyor — hiçbir dünya kurulamıyor.' };
  if (tutan.length === 0)
    return { ...ortak, sonuc: 'DOGRU-YOK', not: 'Hiçbir şık soruyu karşılamıyor; doğru cevap şıklarda yok.' };
  if (tutan.length > 1)
    return { ...ortak, sonuc: 'COKLU-DOGRU', not: `${tutan.join(', ')} şıklarının hepsi soruyu karşılıyor.` };
  if (tutan[0] !== b.isaretli)
    return { ...ortak, sonuc: 'ANAHTAR-YANLIS', not: `Tek doğru ${tutan[0]}; üretici ${b.isaretli} işaretlemiş.` };
  return { ...ortak, sonuc: 'KANIT', not: `${ortak.dunyaSayisi} dünyanın hepsinde tek doğru ${tutan[0]}.` };
}

// ── Dünya kurucular ──────────────────────────────────────────────

/** Bire bir yerleştirme: her ada bir yer, her yere bir ad. */
export function dizilimler<T extends string | number>(
  adlar: string[],
  yerler: T[],
): Dunya[] {
  if (adlar.length !== yerler.length)
    throw new Error(`dizilimler: ${adlar.length} ad ↔ ${yerler.length} yer — bire bir değil`);
  const cikti: Dunya[] = [];
  const gez = (kalan: T[], secim: Dunya) => {
    if (kalan.length === 0) return void cikti.push({ ...secim });
    const ad = adlar[adlar.length - kalan.length];
    for (const y of kalan) gez(kalan.filter((x) => x !== y), { ...secim, [ad]: y });
  };
  gez(yerler, {});
  return cikti;
}

/** Kontenjanlı dağıtım: her ad bir kategoriye, kategori kapasiteleri sabit. */
export function dagilimlar(adlar: string[], kapasite: Record<string, number>): Dunya[] {
  const toplam = Object.values(kapasite).reduce((a, b) => a + b, 0);
  if (toplam !== adlar.length)
    throw new Error(`dagilimlar: ${adlar.length} ad, ${toplam} kontenjan — tutmuyor`);
  const cikti: Dunya[] = [];
  const gez = (i: number, kalan: Record<string, number>, secim: Dunya) => {
    if (i === adlar.length) return void cikti.push({ ...secim });
    for (const [k, n] of Object.entries(kalan)) {
      if (n === 0) continue;
      gez(i + 1, { ...kalan, [k]: n - 1 }, { ...secim, [adlar[i]]: k });
    }
  };
  gez(0, { ...kapasite }, {});
  return cikti;
}

/**
 * Tek maçlık eleme turnuvası — 8 takım, 3 tur, bütün kura ve sonuç bileşimleri.
 *
 * Kura serbest olduğu için yarı final eşleşmesi de serbest bırakılır: gerçek
 * bir fikstürde yarı final ilk turun yerleşiminden belirlenir, ama ilk tur
 * eşleşmesi zaten her biçimde kurulabildiğinden ulaşılabilir turnuva kümesi
 * aynıdır. Dünya düz alanlarla taşınır (`r1_Şahin` = ilk tur rakibi,
 * `k1_Şahin` = ilk turu kazandı mı) ki yüklemler okunur kalsın.
 */
export function turnuvalar(takimlar: string[]): Dunya[] {
  if (takimlar.length !== 8) throw new Error('turnuvalar: 8 takım gerekir');
  const cikti: Dunya[] = [];
  const esle = (kalan: string[]): string[][][] => {
    if (kalan.length === 0) return [[]];
    const [ilk, ...geri] = kalan;
    return geri.flatMap((es) =>
      esle(geri.filter((x) => x !== es)).map((rest) => [[ilk, es], ...rest]),
    );
  };
  for (const tur1 of esle(takimlar)) {
    for (let m = 0; m < 16; m++) {
      const k1 = tur1.map(([a, b], i) => (m & (1 << i) ? b : a));
      for (const tur2 of esle(k1)) {
        for (let n = 0; n < 4; n++) {
          const k2 = tur2.map(([a, b], i) => (n & (1 << i) ? b : a));
          for (const sampiyon of k2) {
            const d: Dunya = { final: [...k2].sort().join('|'), sampiyon };
            for (const t of takimlar) {
              const m1 = tur1.find((x) => x.includes(t))!;
              d[`r1_${t}`] = m1[0] === t ? m1[1] : m1[0];
              d[`k1_${t}`] = k1.includes(t);
              const m2 = tur2.find((x) => x.includes(t));
              d[`r2_${t}`] = m2 ? (m2[0] === t ? m2[1] : m2[0]) : '';
              d[`k2_${t}`] = k2.includes(t);
              d[`r3_${t}`] = k2.includes(t) ? k2.find((x) => x !== t)! : '';
            }
            cikti.push(d);
          }
        }
      }
    }
  }
  return cikti;
}

/** İki takım turnuvanın herhangi bir turunda karşılaştı mı. */
export const karsilasti = (d: Dunya, a: string, b: string): boolean =>
  d[`r1_${a}`] === b || d[`r2_${a}`] === b || d[`r3_${a}`] === b;

/** Evet/hayır dünyaları: her ad için doğru ya da yanlış (2^n). */
export function ikiliDunyalar(adlar: string[]): Dunya[] {
  return Array.from({ length: 1 << adlar.length }, (_, m) =>
    Object.fromEntries(adlar.map((a, i) => [a, Boolean(m & (1 << i))])),
  );
}

/**
 * "Hangisi olabilir?" şıkkı: alanın mümkün değerleri TAM OLARAK bu küme mi.
 *
 * Yalnız `her` kullanmak yetmez — üst küme sayan bir şık da geçerdi
 * ("2 veya 5" doğruyken "2, 4 veya 5" de her dünyada tutar). Bu yüzden iki
 * yönlü sınanır: her dünya kümeye düşer VE kümedeki her değer bir dünyada
 * gerçekleşir.
 */
export const tamDeger =
  (alan: string, degerler: (string | number)[]): Iddia =>
  (ds) =>
    ds.every((d) => degerler.includes(d[alan] as string | number)) &&
    degerler.every((v) => ds.some((d) => d[alan] === v));

/**
 * "Kesin olarak bilinir" şıkkı: alan bütün dünyalarda AYNI değeri alıyor mu.
 * Değerin ne olduğu sorulmaz — belirlenmiş olması sorulur.
 */
export const sabit =
  (f: (d: Dunya) => string | number): Iddia =>
  (ds) => ds.length > 0 && new Set(ds.map(f)).size === 1;

/** Tam olarak şu küme seçilmiş mi — "sadece B ve D" tipi şıklar için. */
export const kume =
  (adlar: string[], secili: string[]) =>
  (d: Dunya): boolean =>
    adlar.every((a) => Boolean(d[a]) === secili.includes(a));

/**
 * Şık kurucu — DOĞRU ŞIK HER ZAMAN İLK yazılır, sonra tohumla karıştırılır.
 *
 * Yazarken doğruyu başa koymak kaçınılmaz; öyle bırakmak da cevabı A'da
 * toplardı. Karıştırma deterministik: aynı tohum aynı diziliş, yani parti
 * yeniden koşulduğunda anahtarlar oynamaz. `isaretli` karıştırmadan SONRA
 * hesaplanır ama çözücü onu hiç okumaz — doğruyu öncüllerden yeniden bulur,
 * dolayısıyla denetim boşa düşmez.
 */
export function sik(
  metinler: string[],
  iddialar: Bulmaca['siklar'][number]['iddia'][],
  tohum: number,
): { siklar: Bulmaca['siklar']; isaretli: string } {
  const sira = metinler.map((_m, i) => i);
  let x = tohum;
  const rastgele = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = sira.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sira[i], sira[j]] = [sira[j], sira[i]];
  }
  return {
    siklar: sira.map((kaynak, i) => ({ harf: 'ABCDE'[i], metin: metinler[kaynak], iddia: iddialar[kaynak] })),
    isaretli: 'ABCDE'[sira.indexOf(0)],
  };
}

// ── Rapor ────────────────────────────────────────────────────────

const ISARET: Record<Karar['sonuc'], string> = {
  KANIT: '✓ KANIT',
  CELISKILI: '✗ ÇELİŞKİLİ',
  'COKLU-DOGRU': '✗ ÇOKLU DOĞRU',
  'DOGRU-YOK': '✗ DOĞRU YOK',
  'ANAHTAR-YANLIS': '✗ ANAHTAR YANLIŞ',
};

export function raporla(bulmacalar: Bulmaca[]): Karar[] {
  const kararlar = bulmacalar.map(cozumle);
  for (const [i, k] of kararlar.entries()) {
    console.log(`${ISARET[k.sonuc].padEnd(18)} ${k.id.padEnd(6)} ${bulmacalar[i].baslik}`);
    console.log(`${''.padEnd(18)} ${String(k.dunyaSayisi).padStart(5)} dünya · ${k.not}`);
  }
  const gecen = kararlar.filter((k) => k.sonuc === 'KANIT').length;
  console.log(`\n${gecen}/${kararlar.length} kanıtlandı · ${kararlar.length - gecen} kusurlu`);
  return kararlar;
}
