/**
 * Çözücünün ikinci sınavı: PAEM 10'un 81-90. soruları (resmî anahtar).
 *
 * PAEM 9 kalibrasyonu (aay-paem9-dogrula.ts) çözücünün `her`/`sabit`
 * kiplerini doğruladı. PAEM 10 iki yeni soru biçimi getiriyor ve bankadaki
 * 36 AI sorusunun HİÇBİRİ bu biçimlerde değil:
 *
 *   - Roma rakamlı öncül ("I. Koray II. Lale III. Mert — hangileri … olabilir?")
 *     → `romen` (kümece eşitlik; "olabilir" = bazi, "kesin bilinir" = sabit)
 *   - Yeterlilik ("tamamının belirlenebilmesi için hangisinin bilinmesi yeterlidir?")
 *     → `yeterli` (bilginin HER olası değeri tek çözüme indirmeli)
 *
 * Bu iki kurucu üretimde kullanılmadan önce burada kurumun anahtarını
 * ÜRETMELİ. Ayrıca metindeki iki belirsiz ifadenin öbür okuması da koşulur:
 * çözücü o okumalarda kusur bulursa, yazarken hangi kalıptan kaçınacağımızı
 * da öğrenmiş oluruz.
 *
 *   npx tsx scripts/aay-paem10-dogrula.ts
 */
import {
  bazi, cozumle, her, hicbiri, romen, romenMetin, sabit, yeterli,
  type Bulmaca, type Dunya,
} from './aay-cozucu';

const romenSik = (harfler: string, ozellik: Bulmaca['siklar'][number]['iddia'][], secimler: number[][]) =>
  secimler.map((s, i) => ({ harf: harfler[i], metin: romenMetin(s), iddia: romen(ozellik, s) }));

// ── 81-83 · lunapark: oyuncak + bilet ────────────────────────────
const ARK = ['Efe', 'Gizem', 'Koray', 'Lale', 'Mert'];
const lunapark = (dd_ca_herBiri: boolean): Dunya[] => {
  const cikti: Dunya[] = [];
  for (let m = 0; m < 3 ** 5; m++) {
    const oyuncak = ARK.map((_a, i) => ['DD', 'KT', 'CA'][Math.floor(m / 3 ** i) % 3]);
    for (let b = 0; b < 32; b++) {
      const bilet = ARK.map((_a, i) => (b & (1 << i) ? 'Tam' : 'Yarım'));
      const d: Dunya = {};
      ARK.forEach((a, i) => { d[`${a}_o`] = oyuncak[i]; d[`${a}_b`] = bilet[i]; });
      const say = (o: string) => oyuncak.filter((x) => x === o).length;
      if (bilet.filter((x) => x === 'Tam').length !== 3) continue;
      // "Dönme Dolap ve Çarpışan Arabalara 2 kişi binmiştir" — iki okuma.
      if (dd_ca_herBiri ? !(say('DD') === 2 && say('CA') === 2) : say('DD') + say('CA') !== 2) continue;
      if (d.Lale_o !== 'CA') continue;
      if (!(d.Efe_b !== d.Mert_b && d.Efe_o === d.Mert_o)) continue;
      if (d.Gizem_b !== d.Koray_b) continue;
      cikti.push(d);
    }
  }
  return cikti;
};

// ── 84-86 · ofis alışverişi: ürün → mağaza ───────────────────────
const URUN = ['Monitör', 'Klavye', 'Mouse', 'Kulaklık', 'Yazıcı', 'Hoparlör', 'WebKam'];
const magaza: Dunya[] = [];
for (let m = 0; m < 3 ** 7; m++) {
  const d: Dunya = Object.fromEntries(URUN.map((u, i) => [u, ['Sanaltek', 'Dijicep', 'Donanımhane'][Math.floor(m / 3 ** i) % 3]]));
  const say = (s: string) => URUN.filter((u) => d[u] === s).length;
  if (!(d.Monitör === 'Sanaltek' && d.Kulaklık === 'Dijicep' && d.Yazıcı === 'Donanımhane')) continue;
  if (new Set([d.Mouse, d.Yazıcı, d.WebKam]).size !== 3) continue;
  if (say('Dijicep') !== say('Donanımhane')) continue;
  if (d.WebKam === 'Sanaltek') continue;
  magaza.push(d);
}
const magazaMouseHop = magaza.filter((d) => d.Mouse === d.Hoparlör);
const magazaSay = (d: Dunya, s: string) => URUN.filter((u) => d[u] === s).length;

// ── 87-90 · tatil köyü: kişi başı iki aktivite ───────────────────
const KISI = ['Ayşe', 'Belinay', 'Ceyda', 'Derya', 'Ece'];
const CIFT = ['SR', 'SY', 'RY']; // S=Safari, R=Rafting, Y=Yamaç Paraşütü
const tatil = (enCokKesin: boolean): Dunya[] => {
  const cikti: Dunya[] = [];
  for (let m = 0; m < 3 ** 5; m++) {
    const d: Dunya = Object.fromEntries(KISI.map((k, i) => [k, CIFT[Math.floor(m / 3 ** i) % 3]]));
    const say = (a: string) => KISI.filter((k) => (d[k] as string).includes(a)).length;
    if (!((d.Ceyda as string).includes('S') && (d.Ece as string).includes('S'))) continue;
    if (d.Ayşe !== d.Ece || d.Belinay !== d.Derya) continue;
    // "En çok rezervasyon yapılan aktivite Raftingdir" — iki okuma.
    const r = say('R');
    if (enCokKesin ? !(r > say('S') && r > say('Y')) : !(r >= say('S') && r >= say('Y'))) continue;
    cikti.push({ ...d, nS: say('S'), nR: r, nY: say('Y') });
  }
  return cikti;
};
const secti = (k: string, a: string) => (d: Dunya) => (d[k] as string).includes(a);
const ucuAyni = (d: Dunya) => Math.max(...CIFT.map((c) => KISI.filter((k) => d[k] === c).length)) === 3;

type Soru = Bulmaca & { resmi: string };
const sorular = (luna: Dunya[], tat: Dunya[]): Soru[] => [
  {
    id: 's81', baslik: 'Koray/Lale/Mert — hangileri Tam Gün almış olabilir', dunyalar: luna, isaretli: 'E', resmi: 'E',
    siklar: romenSik('ABCDE', [bazi((d) => d.Koray_b === 'Tam'), bazi((d) => d.Lale_b === 'Tam'), bazi((d) => d.Mert_b === 'Tam')], [[1], [2], [3], [1, 2], [1, 3]]),
  },
  {
    id: 's82', baslik: 'Efe/Gizem/Koray — hangilerinin oyuncağı kesin bilinir', dunyalar: luna, isaretli: 'A', resmi: 'A',
    siklar: romenSik('ABCDE', [sabit((d) => d.Efe_o as string), sabit((d) => d.Gizem_o as string), sabit((d) => d.Koray_o as string)], [[1], [2], [3], [1, 2], [2, 3]]),
  },
  {
    id: 's83', baslik: 'Hepsinin belirlenmesi için bilinmesi yeterli olan', dunyalar: luna, isaretli: 'B', resmi: 'B',
    siklar: ([
      ['Gizem’in bileti + Koray’ın oyuncağı', (d: Dunya) => `${d.Gizem_b}|${d.Koray_o}`],
      ['Mert’in bileti + Koray’ın oyuncağı', (d: Dunya) => `${d.Mert_b}|${d.Koray_o}`],
      ['Efe’nin bileti + Mert’in oyuncağı', (d: Dunya) => `${d.Efe_b}|${d.Mert_o}`],
      ['Lale’nin bileti + Gizem’in oyuncağı', (d: Dunya) => `${d.Lale_b}|${d.Gizem_o}`],
      ['Koray’ın bileti + Efe’nin oyuncağı', (d: Dunya) => `${d.Koray_b}|${d.Efe_o}`],
    ] as const).map(([metin, f], i) => ({ harf: 'ABCDE'[i], metin, iddia: yeterli(f) })),
  },
  {
    id: 's84', baslik: 'Mouse ile hoparlör aynı mağazadan ise', dunyalar: magazaMouseHop, isaretli: 'A', resmi: 'A',
    siklar: [
      { harf: 'A', metin: 'Klavye ile yazıcı aynı mağaza', iddia: her((d) => d.Klavye === d.Yazıcı) },
      { harf: 'B', metin: 'Monitör ile hoparlör farklı', iddia: her((d) => d.Monitör !== d.Hoparlör) },
      { harf: 'C', metin: 'Mouse ile web kamerası aynı', iddia: her((d) => d.Mouse === d.WebKam) },
      { harf: 'D', metin: 'Sanaltek’ten toplam 2 ürün', iddia: her((d) => magazaSay(d, 'Sanaltek') === 2) },
      { harf: 'E', metin: 'Dijicep’ten toplam 3 ürün', iddia: her((d) => magazaSay(d, 'Dijicep') === 3) },
    ],
  },
  {
    id: 's85', baslik: 'Kesin olarak doğru', dunyalar: magaza, isaretli: 'B', resmi: 'B',
    siklar: ([['Mouse', 'Dijicep'], ['Mouse', 'Sanaltek'], ['Hoparlör', 'Sanaltek'], ['Hoparlör', 'Dijicep'], ['WebKam', 'Donanımhane']] as const)
      .map(([u, s], i) => ({ harf: 'ABCDE'[i], metin: `${u} ${s}`, iddia: her((d) => d[u] === s) })),
  },
  {
    id: 's86', baslik: 'Aynı mağazadan alınmış olamayacak çift', dunyalar: magaza, isaretli: 'A', resmi: 'A',
    siklar: ([['Kulaklık', 'Hoparlör'], ['Yazıcı', 'Hoparlör'], ['Monitör', 'Klavye'], ['Klavye', 'Yazıcı'], ['Kulaklık', 'WebKam']] as const)
      .map(([a, b], i) => ({ harf: 'ABCDE'[i], metin: `${a} ve ${b}`, iddia: hicbiri((d) => d[a] === d[b]) })),
  },
  {
    id: 's87', baslik: 'Ceyda/Derya/Ece — hangilerinin seçimi kesin bilinir', dunyalar: tat, isaretli: 'E', resmi: 'E',
    siklar: romenSik('ABCDE', [sabit((d) => d.Ceyda as string), sabit((d) => d.Derya as string), sabit((d) => d.Ece as string)], [[1], [2], [1, 2], [1, 3], [2, 3]]),
  },
  {
    id: 's88', baslik: 'Üç arkadaş aynı iki aktiviteyi yaptıysa', dunyalar: tat.filter(ucuAyni), isaretli: 'C', resmi: 'C',
    siklar: [
      { harf: 'A', metin: 'Ayşe Yamaç Paraşütü', iddia: her(secti('Ayşe', 'Y')) },
      { harf: 'B', metin: 'Derya Yamaç Paraşütü seçmedi', iddia: her((d) => !secti('Derya', 'Y')(d)) },
      { harf: 'C', metin: 'Ceyda Rafting', iddia: her(secti('Ceyda', 'R')) },
      { harf: 'D', metin: 'Ece Rafting seçmedi', iddia: her((d) => !secti('Ece', 'R')(d)) },
      { harf: 'E', metin: 'Belinay Safari', iddia: her(secti('Belinay', 'S')) },
    ],
  },
  {
    id: 's89', baslik: 'Kesin olarak doğru (toplamlar)', dunyalar: tat, isaretli: 'D', resmi: 'D',
    siklar: ([['nR', 5, 'Rafting 5'], ['nR', 4, 'Rafting 4'], ['nY', 3, 'Yamaç 3'], ['nS', 3, 'Safari 3'], ['nS', 2, 'Safari 2']] as const)
      .map(([alan, n, metin], i) => ({ harf: 'ABCDE'[i], metin, iddia: her((d) => d[alan] === n) })),
  },
  {
    id: 's90', baslik: 'Belinay/Ceyda/Ece — hangileri Yamaç Paraşütü seçmiş olabilir', dunyalar: tat, isaretli: 'C', resmi: 'C',
    siklar: romenSik('ABCDE', [bazi(secti('Belinay', 'Y')), bazi(secti('Ceyda', 'Y')), bazi(secti('Ece', 'Y'))], [[1], [2], [1, 2], [1, 3], [2, 3]]),
  },
];

const kos = (baslik: string, luna: Dunya[], tat: Dunya[]) => {
  console.log(`\n── ${baslik}  (lunapark ${luna.length} · mağaza ${magaza.length} · tatil ${tat.length} dünya)`);
  let uyum = 0;
  for (const s of sorular(luna, tat)) {
    const k = cozumle(s);
    const tamam = k.sonuc === 'KANIT';
    if (tamam) uyum++;
    console.log(`${tamam ? '✓' : '✗'} ${s.id} ${k.sonuc.padEnd(14)} ${s.baslik}`);
    if (!tamam) console.log(`     ${k.not} · tutan: ${k.tutan.join(', ') || '—'} · resmî ${s.resmi}`);
  }
  console.log(`${uyum}/10 soruda çözücü resmî anahtarı üretti.`);
  return uyum;
};

const esas = kos('ESAS OKUMA: "DD ve ÇA’ya ikişer kişi" · "Rafting tek başına en çok"', lunapark(true), tatil(true));
kos('ÖBÜR OKUMA: "DD ve ÇA’ya toplam 2 kişi" · "Rafting en az ötekiler kadar"', lunapark(false), tatil(false));
if (esas !== 10) process.exitCode = 1;
